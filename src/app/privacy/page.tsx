import { brand } from "@/config/brand";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata({
  title: "Family privacy",
  description:
    "How family profiles, question banks, learning records, and saved games are handled.",
  path: "/privacy",
});
export default function Page() {
  return (
    <div className="workspace" style={{ maxWidth: 850 }}>
      <h1>Family privacy</h1>
      <section className="panel">
        <h2>Information used to run your family account</h2>
        <p>
          We store the parent account identifier, child first names or
          nicknames, avatars, grade levels, learning assignments, hashed PINs,
          question banks, learning records, rewards, and saved game progress.
          The sign-in service manages your parent email and account
          authentication. The payment service manages payment details; this
          website stores membership status and customer references, not full
          card numbers.
        </p>
      </section>
      <section className="panel">
        <h2>Children do not need email accounts.</h2>
        <p>
          A parent creates and manages child profiles. There are no ads, social
          chat, or advertising trackers in the family website. Operational logs
          record account administration and agent actions. Hosting and sign-in
          providers may process connection information to operate their
          services.
        </p>
      </section>
      <section className="panel">
        <h2>Sharing stays under your control.</h2>
        <p>
          Sharing codes let another signed-in parent import a copy of your
          question bank. They never include child profiles or progress. Do not
          put personal information into shared questions. Turning sharing off
          stops new imports; it does not remove copies already imported by
          another family.
        </p>
      </section>
      <section className="panel">
        <h2>Export and deletion</h2>
        <p>
          Export your family data from Membership & privacy. Deleting a child
          removes their profile, game saves, learning records, and rewards.
          Uploaded banks remain until you delete them separately. Ask the site
          operator about deleting the parent account or retained billing
          records.
        </p>
      </section>
      <section className="panel">
        <h2>Contact</h2>
        <p>
          {brand.supportEmail
            ? `For privacy questions, contact ${brand.supportEmail}.`
            : "This testing release is not open to public registration. A parent support contact will be published before public launch."}
        </p>
      </section>
    </div>
  );
}
