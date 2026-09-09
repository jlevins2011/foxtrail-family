import { PrivacyNotice } from "@/components/PrivacyNotice";
export const dynamic="force-dynamic";
export const metadata={title:"Privacy and parent choices"};
export default function Page(){return <div className="workspace" style={{maxWidth:900}}><h1>Privacy and parent choices</h1><section className="panel privacy-copy"><PrivacyNotice/></section></div>;}
