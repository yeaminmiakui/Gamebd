# TCE FF — Spark (free) version: HTML + CSS + JavaScript

No credit card, no Cloud Functions, no Cloud Storage. Uses Firebase Auth, Firestore and Hosting only.

```
index.html, css/style.css, js/config.js, js/app.js
firestore.rules, firestore.indexes.json, firebase.json
```

## Setup (free)
1. console.firebase.google.com → Add project (stay on Spark).
2. Authentication → Sign-in method → enable Email/Password (Google optional).
3. Firestore Database → Create database (location asia-south1).
4. Project settings → Your apps → Web `</>` → copy `firebaseConfig` into `js/config.js`.
5. Install Node.js 20, then:
   ```
   npm i -g firebase-tools
   firebase login
   firebase use --add
   firebase deploy --only firestore,hosting
   ```
6. Authentication → Settings → Authorized domains: add your hosting domain (and `localhost`).
7. Test locally: `npx serve .` (needs http, not file://).

## Organizer work (in Firebase Console → Firestore; console writes bypass the rules)
- `tournaments/{id}`: name, mode, map, status (upcoming|open|live|completed|cancelled), totalSlots (number), joinedCount: 0, startAt, registerUntil (timestamps), entryFeePoisha: 0, prizePoolPoisha, teamSize: 1, prizes [{place, amountPoisha}], rules, eligibility, bannerUrl
- `matchRooms/{same id}`: roomId, password, releaseAt (timestamp)
- Results: players submit `resultSubmissions` (status pending, with a screenshot link). You verify, then write `leaderboards/{daily|weekly|monthly|allTime|kills|wins|teams|season}` = { entries: [{uid, username, points, wins, kills}] }, `winnerHistory`, and update the player's `users/{uid}.stats` by hand.
- `announcements`, `liveStreams` (embedUrl must be a YouTube /embed/ or Facebook plugin link), `appSettings/public` (banners, faqUrl, termsUrl, privacyUrl), `notifications` (userId, title, body, read:false, createdAt).
- Pay prizes manually (bKash/Nagad) and keep your own record.

## What works
Email auth, unique usernames, profile (Free Fire UID, IGN), tournament list with search/filters, solo join (slots enforced by rules), room credentials after release time for registered players, result submission (pending), notifications list, streams, winners, leaderboard, support tickets, player reports, language, dark/light.

## Not in this version
Teams and team tournaments, rewards/referral/daily reward, account deletion (use a support ticket), push notifications, wallet, paid entry, file uploads (links are used instead). Reward points and team permissions need server logic, which needs Blaze.

## Security notes
- Rules enforce: one registration per player, slot limit, deadline, Free Fire UID present, free tournaments only, room access, no self-approval of results, no role/VIP/stat edits.
- Anything saved by players is untrusted. You verify results and screenshots before paying prizes.
- Use the Rules Playground / Emulator to test `firestore.rules` before launch. Not production-ready until tested.
