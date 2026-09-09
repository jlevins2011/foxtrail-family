import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireParent, requireOwner, sameOrigin } from "@/lib/platform/security";
import { database, atomic, log } from "@/lib/platform/db";
import { family, hash, pinMatches, Problem, rate } from "@/lib/platform/model";
import { readJson } from "@/lib/platform/http";
import { NOTICE_VERSION, DAY, consentFor, encrypt, decrypt, privacyReady, launchGaps, revokeConsent, privacyMaintenance, localPrivacy } from "@/lib/platform/privacy";
import { getStripe } from "@/lib/stripe";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const reply=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{"Cache-Control":"private, no-store","X-Robots-Tag":"noindex"}});
async function handle(req:Request,ctx:{params:Promise<{path:string[]}>}) {
 try {
  const route=(await ctx.params).path.join("/");
  if(route==="maintenance" && req.method==="POST") {
   const secret=process.env.QUESTBURROW_MAINTENANCE_SECRET;
   if(!secret || secret.length<32 || hash(req.headers.get("authorization")||"")!==hash("Bearer "+secret))throw new Problem("Not authorized.",401);
   return reply(privacyMaintenance());
  }
  if(req.method!=="GET")sameOrigin(req);
  const viewer=await requireParent(), id=viewer.userId;
  const b=req.method==="GET"?{}:await readJson(req,600000);
  if(route==="status" && req.method==="GET"){
   const c=consentFor(id);
   return reply({version:NOTICE_VERSION,reference:hash(id).slice(0,12),status:c?.status||"needed",current:c?.version===NOTICE_VERSION,requested:c?.requested,reviewed:c?.reviewed,expires:c?.expires,ready:localPrivacy()||!launchGaps().length,isTest:localPrivacy(),deletionPending:!!database().prepare("SELECT id FROM privacy_requests WHERE family=? AND completed IS NULL").get(id)});
  }
  if(route==="submit" && req.method==="POST") {
   privacyReady();rate("consent-submit:"+id,5,DAY);
   if(database().prepare("SELECT id FROM privacy_requests WHERE family=?").get(id))throw new Problem("Account deletion is pending. Contact the operator.",403);
   if(!viewer.emailVerified || !viewer.email)throw new Problem("Verify your parent email address first.",403);
   if(b.version!==NOTICE_VERSION || b.parent!==true)throw new Problem("Use the current consent form and confirm you are the parent or guardian.");
   if(consentFor(id)?.status==="approved" && consentFor(id)?.version===NOTICE_VERSION)throw new Problem("Permission is already active.",409);
   if(typeof b.image!=="string" || b.image.length>550000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(b.image))throw new Problem("Upload a PNG or JPEG image of the signed form (up to 400 KB).");
   const data=Buffer.from(b.image,"base64"),png=data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),jpg=data[0]===255&&data[1]===216&&data[2]===255;
   if(data.length>400000 || data.length<32 || (!png&&!jpg))throw new Problem("Upload a PNG or JPEG image of the signed form.");
   database().prepare("INSERT INTO consents VALUES(?,?,?,?,?,NULL,NULL,?,?,?,?) ON CONFLICT(family) DO UPDATE SET version=excluded.version,status=excluded.status,email_hash=excluded.email_hash,requested=excluded.requested,reviewed=NULL,reviewer=NULL,attachment=excluded.attachment,mime=excluded.mime,evidence_hash=excluded.evidence_hash,expires=excluded.expires").run(id,NOTICE_VERSION,"pending",hash(viewer.email.toLowerCase()),Date.now(),encrypt(data),png?"image/png":"image/jpeg",hash(b.image),Date.now()+7*DAY);
   database().prepare("DELETE FROM sessions WHERE family=? AND kind!='parent' AND kind!='test'").run(id);
   log(id,"privacy.submit",NOTICE_VERSION);
   return reply({ok:true});
  }
  if(route==="revoke" && req.method==="POST") {
   if(!pinMatches(b.pin,family(id).pinHash))throw new Problem("Confirm your parent PIN.",403);
   revokeConsent(id);log(id,"privacy.revoke",NOTICE_VERSION);return reply({ok:true});
  }
  if(route==="delete-account" && req.method==="POST") {
   const f=family(id);
   if(!pinMatches(b.pin,f.pinHash) || b.confirm!=="DELETE")throw new Problem("Enter your parent PIN and DELETE to confirm.",403);
   if(f.billing?.subscription) {
    if(!process.env.STRIPE_SECRET_KEY)throw new Problem("Contact the operator to cancel billing before account deletion.",503);
    const stripe=getStripe(); const sub=await stripe.subscriptions.retrieve(f.billing.subscription);
    if(sub.status!=="canceled")await stripe.subscriptions.cancel(sub.id);
   }
   revokeConsent(id);
   const existing=database().prepare("SELECT id FROM privacy_requests WHERE family=? AND completed IS NULL").get(id) as {id:string}|undefined;
   const receipt=existing?.id||randomUUID();
   database().prepare("INSERT OR IGNORE INTO privacy_requests VALUES(?,?,?,?,NULL)").run(receipt,id,"delete-account",Date.now());
   log(id,"privacy.delete-request","Local child data deleted; provider account cleanup pending");
   return reply({ok:true,receipt});
  }
  if(route.startsWith("owner")) {
   await requireOwner();
   if(route==="owner" && req.method==="GET")return reply({pending:database().prepare("SELECT family,version,requested,expires,evidence_hash FROM consents WHERE status='pending' AND expires>?").all(Date.now()),requests:database().prepare("SELECT * FROM privacy_requests WHERE completed IS NULL").all(),gaps:launchGaps(),jobs:database().prepare("SELECT * FROM privacy_jobs").all()});
   if(route==="owner/evidence" && req.method==="GET") {
    const target=new URL(req.url).searchParams.get("family")||"",c=consentFor(target);
    if(!c?.attachment || c.status!=="pending" || c.expires<Date.now())throw new Problem("Form unavailable.",404);
    log(id,"privacy.evidence-view",c.evidence_hash||"");
    return new Response(new Uint8Array(decrypt(c.attachment)),{headers:{"Content-Type":c.mime!,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'; sandbox","Content-Disposition":"inline; filename=parent-consent"}});
   }
   if(route==="owner/review" && req.method==="POST") {
    const target=String(b.family),c=consentFor(target);
    if(!c || c.status!=="pending" || c.expires<Date.now() || c.version!==NOTICE_VERSION || c.evidence_hash!==b.evidenceHash)throw new Problem("This form changed or expired. Refresh before reviewing.",409);
    if(b.approve===true && (typeof b.formEmail!=="string" || hash(b.formEmail.trim().toLowerCase())!==c.email_hash || b.reference!==hash(target).slice(0,12)))throw new Problem("The email or reference on this form does not match the requesting account.");
    if(b.approve===true && (typeof b.signedDate!=="string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.signedDate) || !Number.isFinite(Date.parse(b.signedDate)) || Date.parse(b.signedDate)>Date.now() || Date.parse(b.signedDate)<c.requested-7*DAY))throw new Problem("The signature date must be recent and not in the future.");
    if(b.approve===true && b.checked!==true)throw new Problem("Review the signature, account reference, date and current notice before approving.");
    if(!database().prepare("SELECT id FROM audit WHERE actor=? AND action='privacy.evidence-view' AND detail=? AND created>?").get(id,c.evidence_hash,Date.now()-3600000))throw new Problem("Open this submitted form before recording a decision.",403);
    atomic(()=>{
     const changed=database().prepare("UPDATE consents SET status=?,reviewed=?,reviewer=?,attachment=NULL,mime=NULL,expires=? WHERE family=? AND status='pending' AND evidence_hash=?").run(b.approve===true?"approved":"rejected",Date.now(),id,Date.now()+(b.approve===true?365:7)*DAY,target,b.evidenceHash as string);
     if(!changed.changes)throw new Problem("Form changed. Refresh and retry.",409);
     if(b.approve===true)database().prepare("INSERT INTO privacy_activity VALUES(?,?) ON CONFLICT(family) DO UPDATE SET last_seen=excluded.last_seen").run(target,Date.now());
    });
    log(id,"privacy.review",b.approve===true?"approved":"rejected");return reply({ok:true});
   }
   if(route==="owner/complete" && req.method==="POST") {
    if(b.providersDeleted!==true || b.backupsScheduled!==true)throw new Problem("Complete provider deletion and backup deletion scheduling first.");
    const r=database().prepare("SELECT family FROM privacy_requests WHERE id=? AND completed IS NULL").get(String(b.id)) as {family:string}|undefined;
    if(!r)throw new Problem("Request not found.",404);
    atomic(()=>{for(const table of ["consents","privacy_activity","sessions"])database().prepare(`DELETE FROM ${table} WHERE family=?`).run(r.family);database().prepare("DELETE FROM families WHERE id=?").run(r.family);database().prepare("DELETE FROM audit WHERE actor=?").run(r.family);database().prepare("UPDATE privacy_requests SET completed=? WHERE id=?").run(Date.now(),String(b.id));});return reply({ok:true});
   }
   if(route==="owner/maintenance" && req.method==="POST")return reply(privacyMaintenance());
  }
  throw new Problem("Not found.",404);
 }catch(e){return reply({error:e instanceof Problem?e.message:"Privacy request failed. Please try again."},e instanceof Problem?e.status:500);}
}
export const GET=handle;
export const POST=handle;
