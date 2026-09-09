# Questburrow privacy operating procedure — launch draft

Planned operating jurisdiction: Texas, United States. The owner currently lives in Washington; revisit the applicable state requirements if launch precedes the move. No legal entity, operator mailing address, public phone, or support email has been provided. This document and code support compliance work; neither is a legal certification. Do not open registration until the operator completes the items below.

## Public launch requirements

- Fill the legal operator name, mailing address, telephone and support email. A registered business name is not automatically the same as the brand. Verify the public notice against the entity actually operating the service.
- Use Render, Clerk and Stripe only for the functions disclosed. Review their current contracts, children's-service eligibility, data processing terms, subprocessors, log retention, security and incident notices. Obtain and retain the required written security assurances. Do not assume a privacy-policy link alone supplies them. If any provider will not support the intended child-directed use, replace it before launch and revise the notice.
- Verify Clerk collects only parent authentication data and necessary connection/security information. Disable optional analytics/telemetry. Do not add advertising pixels, session replay, social widgets, or AI processing of child data. Inspect production network activity on child and parent routes; this remains a real deployment check.
- Set a unique `QUESTBURROW_PRIVACY_KEY` in server secrets. Keep a recovery copy separate from the database, with restricted access. Never rotate or discard the key while unread forms remain without migrating/reviewing them. The fixed development key is only for fake local forms.
- Configure HTTPS and owner authentication with MFA. Use least privilege in GitHub, Render, Clerk and Stripe. Review owner IDs and agent permissions monthly. Human review of consent and deletion is not delegated through the agent API.
- Enable daily retention by putting `QUESTBURROW_PUBLIC_URL` in GitHub repository variables and a matching random `QUESTBURROW_MAINTENANCE_SECRET` in both GitHub secrets and host environment. Scheduled workflows run from the default branch: merge the workflow or arrange an equivalent host schedule before launch. Trigger a run manually and confirm Owner → Privacy operations shows a recent timestamp. Alert on failures and check at least weekly; an expired/stopped job is an operational failure, not proof data expired automatically.
- Set up encrypted off-device backups, expire each backup within 30 days, and conduct a restore test into an isolated environment. SQLite deletion cannot remove rows from an already-existing backup. Keep a restricted deletion journal outside the database backup so deleted data is removed before restoring service. Render disk snapshots alone are not a tested database restore procedure.
- Make a vendor deletion checklist for Clerk accounts and Stripe customer/transaction retention. Do not delete legally necessary tax/payment records indiscriminately. Record the actual reason and period for any retained parent billing record. No indefinite child-data retention.
- Review the consent form, parent notice, current operator/provider list, subscription disclosures and applicable state requirements. The child-facing privacy link must remain prominent.
- Only then set `QUESTBURROW_PRIVACY_OPERATIONS_READY=true`. This flag records operator readiness, not a lawyer's approval or regulatory certification.

## Manual signed parental consent

1. The parent creates and verifies a parent email with Clerk and unlocks parent space.
2. Parent permission provides direct notice and a printable form with the current notice version and account reference. No child profile can be created or game entered before permission.
3. The parent signs/dates the form and uploads a clear scan or photograph of only the signed section. Browser conversion removes original metadata; the server accepts bounded PNG/JPEG bytes, encrypts the attachment, and exposes it only to the human owner.
4. Check the form's handwritten signature, printed name, date, account email, reference and notice version. The app checks the transcribed email/reference against the requesting account. If suspicious, unclear, unsigned or inconsistent, reject and contact the adult using their verified account contact in Clerk. Do not approve just because an image was uploaded. The system cannot prove handwriting authenticity.
5. Review within seven days. Approvals/rejections record version, evidence hash, timestamp and reviewer, then destroy the active form image. Unreviewed requests expire after seven days. If permission is not obtained, close unused parent accounts/contact records within 30 days using the deletion queue and Clerk cleanup. The operator must monitor those deadlines.
6. Tell parents to check Parent permission for the decision; no notification email service is connected or required for this manual workflow. Plan real email notifications if review volume grows.
7. A material practice change requires a new notice version and renewed permission before collecting more child data. Archive the old public notice alongside its code release. Previous consent does not automatically cover new disclosures.

## Parent rights and deletion

Parents can review/export records after parent authentication, delete a child, withdraw consent (removes child data and private banks), or request complete account deletion. Revocation does not itself cancel paid billing; the screen explains that separately. Account deletion cancels the connected subscription first and queues provider cleanup. Resolve provider requests within 30 days, verify external deletion and backup restore suppression, then mark completed. Do not tell a parent provider deletion is complete before doing it. Contact requests require verifying the adult's account ownership before disclosing information.

Pending consent never authorizes child gameplay. Existing pre-consent test profiles are gated, not grandfathered. Local test accounts must use fabricated forms; the production path never uses a simulated consent shortcut. Question-bank sharing is disabled in production during this launch; bank editing and private assignments remain available.

## Retention schedule and evidence

- Child profiles, private banks, cumulative rewards and game saves: needed for ongoing learning/gameplay; remove after 365 days without authenticated family activity, or immediately on withdrawal/deletion in the active database.
- Pending consent image/contact evidence: seven days. Approved/rejected images: destroy when reviewed. Minimal consent evidence: while consent is active; at most 365 days after withdrawal/expiry. Rejected consent records expire seven days after review.
- Native lesson receipts: one year. Challenges: 24 hours. Sessions and rate limits: expiry. Operational audit: 90 days. Webhook deduplication IDs: 30 days. Completed provider-deletion receipts: 30 days. Unresolved deletion requests: keep only to fulfill the request; review weekly and resolve within 30 days.
- Backups: maximum 30 days, recovery only, restricted encrypted storage. Restore deletion suppression is mandatory.
- Provider contact, connection and billing information: inventory each provider's actual periods before launch. The local cleanup job does not erase vendor records or downloaded exports.

## Security and incidents

Responsible coordinator: operator named in the notice. Maintain an inventory of records, authorized users, vendors, keys and backup locations. Review risks before feature/vendor changes; at least annually reassess the program, access, software patches, restore tests and retention evidence. Test separation between families and revoke unnecessary agent keys. Redact content, PINs, cookies, form images, emails and secrets from logs. Store no child information in GitHub issues or AI prompts.

For a suspected incident: restrict affected access and rotate affected credentials, preserve necessary incident evidence securely, establish affected data and dates, involve hosting/auth providers, assess required parent/regulator notices under applicable law, document decisions and remediation, and verify recovery. Do not fabricate a universal notice deadline: it depends on the incident and jurisdiction. Do not silently change the public notice to cover an incident.

## References

- FTC current six-step plan (May 2026): https://www.ftc.gov/business-guidance/resources/childrens-online-privacy-protection-rule-six-step-compliance-plan-your-business
- FTC consent FAQs: https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions

Still requires operator action: entity/contact details, vendor assurances, hosted tracking inspection, schedule/backups, real consent review, provider deletions, and state-specific assessment. No paid legal service is required by this implementation; these responsibilities do not disappear at small scale.
