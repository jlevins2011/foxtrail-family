import Link from "next/link";
export const metadata = {
  title: "Membership confirmation",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <div className="workspace">
      <h1>Thanks for joining us.</h1>
      <p>
        We’re confirming your membership. Your billing status usually updates
        within a few seconds.
      </p>
      <div className="actions">
        <Link className="action" href="/dashboard/membership">
          Check membership status
        </Link>
        <Link className="action secondary" href="/library">
          Open the library
        </Link>
      </div>
    </div>
  );
}
