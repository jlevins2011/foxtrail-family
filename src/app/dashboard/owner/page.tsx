import { ParentSpace } from "@/components/FamilyApp";
export const metadata = {
  title: "Parent space",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <ParentSpace section="owner" />;
}
