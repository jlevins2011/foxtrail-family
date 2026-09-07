import { Library } from "@/components/FamilyApp";
export const metadata = {
  title: "Family library",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <Library />;
}
