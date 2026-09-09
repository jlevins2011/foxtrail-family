import { randomBytes, randomUUID, createCipheriv, createDecipheriv } from "node:crypto";
import { database, atomic } from "./db";
import { family, saveFamily, hash, Problem } from "./model";
export const NOTICE_VERSION = "2026-09-09.1";
export const DAY = 86400000;
export const localPrivacy = () => process.env.NODE_ENV !== "production" && process.env.FOXTRAIL_TEST_MODE === "true";
export function operator() {
  return { name: process.env.QUESTBURROW_OPERATOR_NAME || "", address: process.env.QUESTBURROW_OPERATOR_ADDRESS || "", email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "", phone: process.env.QUESTBURROW_OPERATOR_PHONE || "" };
}
export function launchGaps() {
  const o=operator();
  return [...Object.entries(o).filter(([,v])=>!v).map(([k])=>`Operator ${k}`),
    ...(!(process.env.QUESTBURROW_MAINTENANCE_SECRET || "").match(/^.{32,}$/) ? ["Retention job secret"] : []),
    ...(!/^[a-f0-9]{64}$/i.test(process.env.QUESTBURROW_PRIVACY_KEY || "") ? ["Consent encryption key"] : []),
    ...(process.env.QUESTBURROW_PRIVACY_OPERATIONS_READY !== "true" ? ["Vendor agreements, retention schedule, backups and incident procedure verified"] : [])];
}
export function privacyReady() { if (!localPrivacy() && launchGaps().length) throw new Problem("Family registration is not open yet. The operator is completing privacy setup.",503); }
export type Consent = { family:string; version:string; status:string; email_hash:string; requested:number; reviewed:number|null; reviewer:string|null; attachment:string|null; mime:string|null; evidence_hash:string|null; expires:number; };
export function consentFor(id:string) { return database().prepare("SELECT * FROM consents WHERE family=?").get(id) as Consent|undefined; }
export function consentValid(id:string,email?:string|null) {
  const c=consentFor(id);
  return !!c && c.status==="approved" && c.version===NOTICE_VERSION && (!email || c.email_hash===hash(email.toLowerCase()));
}
export function requireConsent(id:string,email?:string|null) { privacyReady(); if(!consentValid(id,email))throw new Problem("A grown-up needs to complete parent permission before creating profiles or playing.",403); }
function key() {
  const value=process.env.QUESTBURROW_PRIVACY_KEY;
  if(value && /^[a-f0-9]{64}$/i.test(value))return Buffer.from(value,"hex");
  if(localPrivacy())return Buffer.from(hash("local-test-consent-only"),"hex");
  throw new Problem("Consent storage is not configured.",503);
}
export function encrypt(data:Buffer) { const iv=randomBytes(12), cipher=createCipheriv("aes-256-gcm",key(),iv);return Buffer.concat([iv,cipher.update(data),cipher.final(),cipher.getAuthTag()]).toString("base64"); }
export function decrypt(data:string) {const b=Buffer.from(data,"base64"), d=createDecipheriv("aes-256-gcm",key(),b.subarray(0,12));d.setAuthTag(b.subarray(-16));return Buffer.concat([d.update(b.subarray(12,-16)),d.final()]);}
export function eraseChildData(id:string) {
  const f=family(id); f.children=[]; saveFamily(f);
  for(const table of ["challenges","rewards","game_saves","native_records"])database().prepare(`DELETE FROM ${table} WHERE family=?`).run(id);
  database().prepare("DELETE FROM sessions WHERE family=? AND child IS NOT NULL").run(id);
}
export function activity(id:string) { database().prepare("INSERT INTO privacy_activity VALUES(?,?) ON CONFLICT(family) DO UPDATE SET last_seen=excluded.last_seen WHERE last_seen<?").run(id,Date.now(),Date.now()-DAY); }
export function revokeConsent(id:string) { atomic(()=>{eraseChildData(id);database().prepare("DELETE FROM banks WHERE family=?").run(id);database().prepare("UPDATE consents SET status='revoked',attachment=NULL,mime=NULL,expires=? WHERE family=?").run(Date.now()+365*DAY,id);}); }
export function privacyMaintenance() {
 const db=database(),now=Date.now();
 return atomic(()=>{
  const stale=db.prepare("SELECT family FROM privacy_activity WHERE last_seen<?").all(now-365*DAY) as {family:string}[];
  for(const {family:id} of stale){eraseChildData(id);db.prepare("DELETE FROM banks WHERE family=?").run(id);db.prepare("UPDATE consents SET status='expired',attachment=NULL,mime=NULL,expires=? WHERE family=?").run(now+365*DAY,id);db.prepare("DELETE FROM privacy_activity WHERE family=?").run(id);}
  const abandoned=db.prepare("SELECT a.family FROM privacy_activity a LEFT JOIN consents c ON c.family=a.family WHERE a.last_seen<? AND (c.family IS NULL OR c.status!='approved') AND NOT EXISTS(SELECT 1 FROM privacy_requests r WHERE r.family=a.family)").all(now-30*DAY) as {family:string}[];
  for(const {family:id} of abandoned)db.prepare("INSERT INTO privacy_requests VALUES(?,?,?,?,NULL)").run(randomUUID(),id,"close-unused-parent",now);
  db.prepare("DELETE FROM consents WHERE status!='approved' AND expires<?").run(now);
  db.prepare("DELETE FROM audit WHERE created<?").run(now-90*DAY);
  db.prepare("DELETE FROM webhook_events WHERE created<?").run(now-30*DAY);
  db.prepare("DELETE FROM native_records WHERE created<?").run(now-365*DAY);
  db.prepare("DELETE FROM challenges WHERE created<?").run(now-DAY);
  db.prepare("DELETE FROM sessions WHERE expires<?").run(now);
  db.prepare("DELETE FROM limits WHERE reset<?").run(now);
  db.prepare("DELETE FROM privacy_requests WHERE completed IS NOT NULL AND completed<?").run(now-30*DAY);
  db.prepare("INSERT INTO privacy_jobs VALUES('retention',?) ON CONFLICT(name) DO UPDATE SET last_run=excluded.last_run").run(now);
  return {inactiveFamiliesCleared:stale.length,completedAt:now};
 });
}
