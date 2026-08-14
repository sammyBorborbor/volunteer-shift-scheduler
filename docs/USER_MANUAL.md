# User Manual — Volunteer Shift Scheduler

Live app: **https://volunteer-shift-scheduler.vercel.app/**

This manual covers everything a **Volunteer** or a **Coordinator** can do in the app. If you're not sure which one you are: volunteers sign up for shifts and do the work; coordinators post shifts and manage who's signed up. Every account is one or the other, never both.

---

## 1. Accounts

### 1.1 Volunteer accounts — self-service

Anyone can create a volunteer account:

1. Go to the live app and click **Sign up to volunteer** (from the landing page, or the link under the sign-in form).
2. Enter your full name, email, and a password (at least 8 characters).
3. Click **Create account**.
4. You'll see a **Check your email** screen — this project requires email confirmation, so follow the link in that email before signing in for the first time.

### 1.2 Coordinator accounts — by request only

There's no "sign up as a coordinator" option, on purpose — it's the difference between an ordinary user and someone who can post shifts and mark attendance for other people. If you need a coordinator account, ask whoever administers the project to create one for you directly. Once it exists, you sign in the same way a volunteer does; the app recognizes your role automatically and takes you to the coordinator side.

### 1.3 Signing in

Go to **Sign in**, enter your email and password, and click **Sign in**. You'll land on your own home page automatically — `/app` for volunteers, `/coordinator` for coordinators. If you ever try to open the other role's pages directly, the app quietly redirects you back to your own home instead of showing an error.

### 1.4 Signing out

Click **Sign out** in the top-right of the navigation bar, from anywhere in the app.

---

## 2. Volunteer guide

### 2.1 Browsing shifts

Your home page (**Shifts** in the nav) lists every upcoming shift, soonest first. Each shift card shows:

- Title, date, time, and location
- A short description of the work
- How many spots are left — colored green when there's plenty of room, amber when only a couple of spots remain, and marked **Full** with no sign-up button once capacity is reached

### 2.2 Signing up for a shift

Click **Sign up** on any open shift. The app checks two things automatically before confirming your spot:

- **Capacity** — if the shift filled up between when the page loaded and when you clicked, you'll see a message that it's now full.
- **Schedule conflicts** — if you're already signed up for a different shift that overlaps in time on the same day, your sign-up is rejected with a message telling you so. You can't accidentally double-book yourself.

Once confirmed, the card updates to show **Signed up** with a **Cancel sign-up** option.

### 2.3 Cancelling a sign-up

Click **Cancel sign-up** on any shift you're currently signed up for. Your spot is released immediately (the capacity count updates for everyone), and the shift goes back to showing a **Sign up** button. Nothing is deleted — your original sign-up is kept on record as cancelled, so a coordinator can still see the history if needed.

You can sign up again for the same shift later — cancelling doesn't lock you out of it.

### 2.4 After a shift happens

Once a coordinator marks your attendance (see §3.5), your card updates to show **Attended** or **No-show** instead of a sign-up button — there's nothing more for you to do.

### 2.5 Your sign-up history — "My Sign-ups"

Click **My Sign-ups** in the nav to see every shift you've ever signed up for, not just upcoming ones — split into **Upcoming** and **Past** sections. Each entry shows its current status:

| Status shown | What it means |
|---|---|
| Awaiting attendance | You're signed up; the shift hasn't happened yet |
| Completed | You attended, confirmed by the coordinator |
| No-show | You were marked absent |
| Cancelled | You cancelled this sign-up yourself |
| Shift cancelled | The coordinator cancelled the whole shift — not something you did |

### 2.6 If a shift you signed up for gets cancelled

Coordinators can cancel a shift entirely (see §3.6). If that happens to a shift you were signed up for, it disappears from your upcoming shifts list, and "My Sign-ups" shows it with a **Shift cancelled** badge so you know it wasn't your own cancellation.

---

## 3. Coordinator guide

### 3.1 Your dashboard

Signing in takes you to `/coordinator`, listing every shift you've posted with a fill-rate badge — **"X/Y signed up"** — flagged amber when a shift is less than half full, so under-subscribed shifts are easy to spot at a glance.

### 3.2 Creating a shift

Click **Create shift**, then fill in:

- **Title** (required)
- **Description** and **Location** (optional)
- **Date, start time, end time** (required — the date can't be in the past, and the end time must be after the start time)
- **Capacity** (required — a whole number greater than zero)

Click **Create shift** to post it. It's visible to every volunteer immediately.

### 3.3 Editing a shift

Click **Edit** on any shift from your dashboard. The form pre-fills with the current details — change whatever needs changing and click **Save changes**.

One rule is enforced automatically: you can't lower a shift's capacity below the number of volunteers already confirmed for it. If you try, you'll get a clear error explaining why, instead of the change silently failing or leaving a broken state.

Editing isn't available for shifts that have already happened, or that have already been cancelled.

### 3.4 Viewing a shift's roster

Click **View roster** on any shift to see everyone signed up, split into **Awaiting attendance** and **Recorded** sections, each with the volunteer's name and phone number (when they've provided one).

### 3.5 Marking attendance

On the roster page, each volunteer awaiting attendance has two buttons: **Mark completed** and **Mark no-show**. Click whichever applies — the row moves to the **Recorded** section and the volunteer's own view updates to match.

Made a mistake? Click the other button on that same row to correct it — there's no separate "undo," you just re-mark it.

### 3.6 Cancelling a shift

From the roster page, click **Cancel this shift**. You'll be asked to confirm, since this affects everyone currently signed up:

- The shift disappears from both your dashboard and the volunteer-facing shift list.
- Every volunteer with a confirmed sign-up on that shift has it automatically flipped to cancelled — they'll see it in their own "My Sign-ups" marked **Shift cancelled**, not as something they did themselves.
- The shift itself isn't deleted. Its roster page still works if you have the link, so the record of who was signed up is preserved.

Cancelling isn't available for shifts that have already happened, or that are already cancelled.

---

## 4. Frequently asked questions

**Why was my sign-up rejected?**
Either the shift filled up right before you clicked, or you're already signed up for something else that overlaps in time on the same day. The message tells you which.

**I cancelled a shift by accident — can I get it back?**
Not through the app. Cancelling a shift (coordinator) or a sign-up (volunteer) is a one-way action from the UI. Contact your project administrator if you need it reversed.

**Why can't I lower a shift's capacity?**
You're trying to set it below the number of people already confirmed for that shift. Either raise the number back up, or ask some of those volunteers to move to a different shift first.

**I'm a coordinator — where's the "sign up as coordinator" option?**
There isn't one, deliberately. Ask your administrator to create the account for you.

**Why do I only see upcoming shifts on the main list?**
The main shift list (and your coordinator dashboard) only ever shows what's still ahead. For your own full history, including past and cancelled shifts, use **My Sign-ups**.

---

## 5. Known limitations

A few things this version deliberately doesn't do — not oversights, but scope decisions made to ship a focused Must-have feature set on time:

- No waitlist — if a shift is full, you'll need to check back if a spot opens up.
- No email or SMS reminders — check the app directly for the latest shift status.
- No filtering shifts by date range — the list is sorted soonest-first, but not searchable yet.
- Coordinators don't have a dedicated view of shifts they've previously cancelled (their roster link still works if you have it, just not listed anywhere).

See the technical debt log in `CONTEXT.md` for the complete list and the reasoning behind each one.
