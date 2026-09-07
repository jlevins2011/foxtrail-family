# Start testing

1. Open the local website and choose **Parent space → Parent sign-in → Open testing family**.
2. Create a parent PIN of 6–10 digits. Add a child, choose their grade, and give them a separate four-digit PIN.
3. In **Question banks**, create a small bank or upload `public/question-bank-template.csv`. Save it, then assign it in the child’s learning plan. You can put a different plan on one game.
4. Go to **Play**, choose the child, and enter their PIN. Parent space should now ask for the parent PIN again.
5. In Sumtrail, try **Start assigned trail**. Correct answers earn credits immediately. Other learning games use their compatible banks only.
6. Try **Continue adventure** to open the original game with the same child profile. Complete a lesson, return to camp, and check that progress saved. Qualified lesson completions earn up to three discovery credits, once per lesson per day.
7. At 10 discovery credits, open Lumen Isles. The **Scholar’s lantern** appears in the building menu. Gather one timber to place it. The other special lights unlock at 30 and 60 credits.
8. In parent space, turn on earned island playtime for that child. Each credit earns the chosen number of minutes. Turn it off again to test unrestricted island play.
9. Copy a question-bank sharing code. Import it in Question banks. The import is a private copy; editing it does not change the original. Turning off sharing disables future imports.
10. In Owner controls, create a short-lived agent key with read-only catalog access, then revoke it. The activity log records requests. Never paste keys into a public chat or repository.

## What is ready for testing without accounts

Profiles, PINs, plans, banks, sharing, learning trails, game hosting, saves, rewards, optional playtime, free/trial access logic, and owner permissions all work locally. Your test data is kept on this computer.

Clerk sign-in and Stripe payment tests require the external accounts described in LAUNCH-SETUP. Local mode does not simulate a successful card payment.

## Game-format boundaries

- Sumtrail’s native workshop engine accepts correctly answered whole-number expressions such as `8 × 4`, within its visual model limits. Other math questions run in the assigned trail.
- Keytrail’s native runs accept printable English keyboard text. Other text formats remain available on the assigned trail.
- Camp Compass uses selected canonical US state-capital questions in its native quizzes. Other geography questions run in the assigned trail. Math banks cannot enter Camp Compass.
- Lumen Isles receives the selected shared banks as its in-world question curriculum.
- Built-in campaign structure and movement remain in each game. A selected custom bank changes compatible questions, not the world layout.

## Testing limits

Native campaign completion is reported by the game client, with server-bound play tickets, duplicate checks, duration checks, and daily credit limits. It is not tamper-proof competitive scoring. Assigned-trail correctness is checked by the server. Credits are non-transferable gameplay rewards, not money.

No automated browser gameplay or mobile-device playthrough has been performed for this release. The release includes API/security checks, bridge tests, native adapter checks, and production-build verification. Please test the playable flows on your children’s actual devices before inviting other families.

The optional browser agent read tool has not been exercised in a WebMCP-capable browser. Server-side permission checks apply to it just as they do to the visible parent dashboard.
