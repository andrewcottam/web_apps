# EU Stay Calculator

Tracks days spent in the EU (Schengen area) and shows on a calendar how much longer we can stay under the 90-days-in-any-180 rule that applies to British citizens visiting Italy. Stays are saved in Firestore and the app is protected by Google sign-in.

## 📑 Table of Contents

- [How it works](#how-it-works)
- [Using the app](#using-the-app)
- [Setup: Firebase and Google login](#setup-firebase-and-google-login)
- [Local mode and testing](#local-mode-and-testing)
- [Files](#files)

## How it works

For any day, the app counts the days present in the 180 days ending on that day (inclusive); that count must never exceed 90. Starting from the chosen "in the EU from" date it adds days one at a time until the next day would break the rule, which gives the number of extra days we can stay and the last permitted day. Days already recorded as present are skipped over, so a trip that is already booked is respected.

Owning a house in Italy does not change the rule for UK citizens; this tool does not cover long-stay visas or residence permits. Always check the official guidance.

## Using the app

- Click a first and last day on the calendar, then **Add stay**. Click one day twice for a single day.
- Blue = recorded presence, green = days we can still stay, orange = last permitted day, red = days that already break the rule.
- Change **If we are in the EU from** to plan a future arrival. Hover any day to see how many of the 90 days are used in its 180-day window.

## Setup: Firebase and Google login

1. Create a project in the [Firebase console](https://console.firebase.google.com) and add a **Web app**; copy its config into `firebase-config.js`.
2. **Authentication → Sign-in method**: enable **Google**.
3. **Authentication → Settings → Authorized domains**: add the GitHub Pages domain (e.g. `andrewcottam.github.io`).
4. **Firestore Database**: create a database, then paste `firestore.rules` into the Rules tab (replace the placeholder emails with the Google accounts allowed in) and publish.
5. Commit and push to `gh-pages`.

The Firebase config values are public identifiers, not secrets: access is enforced by the sign-in plus the email allow-list in the Firestore rules.

## Local mode and testing

While `firebase-config.js` still has the `YOUR_` placeholders, the app runs without login and stores stays in the browser's localStorage. Serve the folder with any static server (modules need http):

```bash
python3 -m http.server 8000
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page and styles |
| `app.js` | UI, Google sign-in, Firestore persistence |
| `calc.js` | The 90/180 calculation |
| `firebase-config.js` | Your Firebase web config |
| `firestore.rules` | Email allow-list security rules |
