# NextGen Quiz & Rewards

A mini quiz and rewards platform built for the **PUNCH NextGen Full-Stack Developer technical assessment**.
Students register, take multiple-choice quizzes, earn XP and badges, and compete on a leaderboard.

- **Live demo:** https://nextgen-quiz.vercel.app
- **API:** https://nextgen-quiz-api.onrender.com (health check: `/api/health/`)
- **Walkthrough video:** _add link_
- **Demo login:** `demo_student` / `NextGen-Demo-2026` (fictitious account; you can also register your own)

> The free Render server sleeps when idle, so the first request after a while can take up to a minute.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Backend | Python, Django 5.2, Django REST Framework | Mature, secure defaults (password hashing, ORM, admin), transactions and database constraints for the reward logic |
| Auth | JWT via `djangorestframework-simplejwt` | Frontend and API run on different domains; tokens work cleanly across them |
| Database | PostgreSQL in production, SQLite locally | Same code for both, switched by `DATABASE_URL` |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router | Typed API contracts, fast builds, mobile-first styling |
| Hosting | Render (API + Postgres), Vercel (frontend) | Free tiers, deploy from GitHub |

---

## Features, by assessment task

### Task 1: Registration and dashboard
- Register and log in. Passwords are hashed by Django and checked against its password rules.
- Personalised dashboard: the student's name, total XP and level, quizzes completed, rank, badges (earned and locked with progress), an "up next" quiz, and recent activity.

### Task 2: Interactive quiz system
- Three quizzes of **10 multiple-choice questions** each (Tech Foundations, Digital Safety, Science Quick-Fire).
- One question at a time, with a progress bar, back/next, keyboard shortcuts (1–4, Enter) and a review screen before submitting.
- Scores are calculated automatically **on the server**, and the results page shows the score, XP earned, new badges, and a review of every answer with explanations.
- Every attempt and every answer is saved, and past results can be reopened from the dashboard.
- **Repeated submissions can't generate duplicate rewards** (see *Duplicate protection* below).

### Task 3: Gamification
- **XP:** 10 XP per correct answer, plus a 50 XP bonus for a perfect score, awarded the first time a quiz is completed. Retakes are allowed for practice but earn no XP. Every 100 XP is a level.
- **Four badges:** 🚀 First Steps (1 quiz), 🎯 Sharp Shooter (perfect score), ⭐ Rising Star (150 XP), 🏆 Quiz Master (all 3 quizzes). Badges are stored as data with a rule and threshold, so staff can add new ones in the admin without code changes.
- **Leaderboard** ranked by XP. Ties go to whoever reached that XP first. Your own position is shown even if you're outside the top 20.
- Points, badges and rank update automatically in the same request that scores the quiz.

### Task 4: Back end, database and security
- **Server-side scoring:** the browser only sends which option was picked. It never receives the correct answers before submitting, and any `score`/`xp` it sends is ignored.
- **Access control:** every endpoint requires a valid token unless explicitly public. Students can only read their own attempts (queries are filtered by the logged-in user).
- **Invalid requests** get clear errors: 400 for missing/duplicate/foreign answers or a missing/malformed `Idempotency-Key`, 404 for unknown quizzes, 409 for a key reused on a different quiz, 401 without a token.
- **Rate limiting:** 20 login/register attempts per hour per IP, 30 quiz submissions per hour per student.
- **Secrets and config** come from environment variables, HTTPS redirect and secure cookies in production.
- **32 automated tests** covering scoring, duplicates, invalid input, access control, auth and gamification.

### Task 5: User experience and documentation
- Mobile-first: bottom tab bar on phones, full-screen quiz mode, large tap targets; scales up to tablet and desktop layouts.
- Clear feedback: answer saved indicator, progress bar, review grid of unanswered questions, loading states, friendly error messages with retry, and a celebration of new badges.
- Accessibility: semantic headings, radio-group quiz options, labelled progress bars, visible focus, keyboard support, reduced-motion support.

---

## Duplicate protection

A student double-tapping submit, a flaky connection retrying, or someone replaying the request with a script must never earn XP twice. Three layers handle this (`backend/quizzes/services.py`):

1. **Idempotency key.** The frontend creates one UUID per quiz attempt and sends it as an `Idempotency-Key` header on every submit of that attempt. If the server has already processed that key, it returns the original result (`replayed: true`) and does nothing else.
2. **Row lock.** Scoring runs inside a database transaction that locks the student's profile row (`select_for_update`), so two simultaneous requests from the same student run one after the other.
3. **Database constraints.** The database itself refuses a second attempt with the same key, and a second *rewarded* attempt for the same quiz. If the code above were ever bypassed, the database still wouldn't allow a duplicate reward.

---

## Project structure

```
backend/
  config/          settings, root URLs
  accounts/        registration, login, current user
  quizzes/         quiz, question, choice, attempt models; scoring service; seed command
  gamification/    XP profile, badges, leaderboard, dashboard
frontend/
  src/lib/         API client (token refresh), auth context, quiz session (idempotency key)
  src/pages/       Login, Register, Dashboard, Quizzes, QuizPlay, Result, Leaderboard
  src/components/  layout, cards, shared UI
```

Each request follows *URL → View → Serializer → Service → Model*. Views handle HTTP; the business rules live in `services.py` so they can be tested on their own and reused (the seed command creates demo data through the same scoring code).

### API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register/` | Create a student, returns tokens |
| POST | `/api/auth/login/` | Log in, returns tokens |
| POST | `/api/auth/refresh/` | New access token |
| GET | `/api/auth/me/` | Current user |
| GET | `/api/dashboard/` | XP, level, quizzes completed, rank, badges, recent attempts |
| GET | `/api/quizzes/` | Quizzes with completion status |
| GET | `/api/quizzes/<slug>/` | Questions and options (no answers) |
| POST | `/api/quizzes/<slug>/submit/` | Submit answers (requires `Idempotency-Key`) |
| GET | `/api/attempts/` · `/api/attempts/<id>/` | Your attempt history and results |
| GET | `/api/leaderboard/` | Top 20 and your position |

---

## Running it locally

Requirements: Python 3.12+, Node 20+, pnpm (or npm).

**Backend** (http://localhost:8000)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env          # macOS/Linux: cp .env.example .env
python manage.py migrate
python manage.py seed --demo-students
python manage.py runserver
```
Optional: `python manage.py createsuperuser`, then manage quizzes and badges at http://localhost:8000/admin/.

**Frontend** (http://localhost:5173)
```bash
cd frontend
pnpm install
pnpm dev
```

**Tests**
```bash
cd backend
python manage.py test
```

### Deployment
- **API:** Render Blueprint from `render.yaml` (web service + PostgreSQL). Set `CORS_ALLOWED_ORIGINS` to the frontend URL.
- **Frontend:** Vercel with root directory `frontend`, and `VITE_API_URL` set to the Render URL.

---

## Limitations and next steps

- Tokens are stored in `localStorage`. In production I'd move to httpOnly cookies to reduce XSS exposure.
- Badge checks run during the submit request. Fine at this scale; a large platform would move them to a background queue.
- The leaderboard isn't cached; at scale I'd cache it for a few seconds.
- Questions and options aren't shuffled per student, and quizzes have no timer.
- No email verification or password reset.
- No streaks or weekly challenges yet. They'd be the next engagement features to add.

## Use of AI tools

As the brief allows, I used **Claude Code**, an AI coding assistant, throughout this project.

**What I did**
- Set the requirements and the core rules: XP is awarded only on a student's first completion of a quiz, and every submission carries an idempotency key so retries and double-clicks can't award XP twice.
- Chose the stack (Django REST Framework and React, which I already work with) and the hosting (Render and Vercel).
- Directed the design: rejected the first version of the UI and moved it to PUNCH's own brand colours, with red as the main colour.
- Tested the deployed app and found issues, including a sign-up form that gave no feedback on weak passwords, which was then fixed.
- Deployed the API and database on Render and the frontend on Vercel, and configured them to work together.

**What the AI assistant did**
- Wrote most of the code, working from my direction: the Django models, scoring service and API, the 33 tests, the React screens and styling, the seed content, and the deployment configuration.
- Diagnosed and fixed bugs found during testing.

I've reviewed the code and can walk through how any part of it works, particularly the scoring and duplicate-protection logic in `backend/quizzes/services.py`.

## Test data

All accounts are fictitious. No real student data is used.
