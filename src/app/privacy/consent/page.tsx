import { requireParent } from "@/lib/platform/security";
import { hash } from "@/lib/platform/model";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { NOTICE_VERSION } from "@/lib/platform/privacy";
import Link from "next/link";
export const dynamic="force-dynamic";
export const metadata={title:"Printable parent consent",robots:{index:false,follow:false}};
export default async function Page(){
 let id:string;try{id=(await requireParent()).userId;}catch{return <div className="workspace"><h1>Unlock parent space first.</h1><Link href="/dashboard/privacy">Parent permission</Link></div>;}
 return <div className="workspace consent-print" style={{maxWidth:900}}><h1>Questburrow parent consent</h1><p>Print all pages, sign, and upload a clear image of the completed signature section. Retain a copy of this notice. Do not upload identification documents or photos of your children.</p><PrivacyNotice/><section className="signature-section"><h2>Parent or legal guardian permission</h2><p>Notice: {NOTICE_VERSION} · Account reference: <strong>{hash(id).slice(0,12)}</strong></p><p>I am the parent or legal guardian of the children whose profiles I will manage in this account. I have read the notice above and consent to the collection and use described, including processing by necessary service providers. I understand I may review or delete their information or withdraw permission.</p><p>Parent’s printed name: ____________________________________</p><p>Parent account email: _____________________________________</p><p>Signature: ______________________________________________</p><p>Date: __________________________________________________</p></section><p className="no-print"><Link href="/dashboard/privacy">Return to Parent permission to upload your signed form</Link></p></div>;
}
