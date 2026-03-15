# Job Application Autopilot

AI-powered job application tracker. The core AI agent runs on **Airia** — it scrapes the LinkedIn JD, scores your resume fit, saves a cover letter to Gmail, creates Google Calendar reminders, and tracks everything in a Kanban board.

## How Airia fits in

```
User (browser)
    │ POST /api/agent
    ▼
Next.js backend (pages/api/agent.js)
    │ POST https://api.airia.ai/v2/PipelineExecution/<GUID>
    │ Header: X-API-KEY
    │ Body: { userInput, asyncOutput: false }
    ▼
Airia Pipeline (your configured agent)
    ├── Claude Sonnet (LLM)
    ├── Web Search tool → scrapes LinkedIn URL
    ├── Gmail MCP → saves cover letter as draft
    └── Google Calendar MCP → creates apply + follow-up events
    │
    ▼
JSON response → Kanban dashboard
```

**You do NOT call Anthropic directly.** Airia orchestrates Claude + all tools internally. Your Next.js backend just calls one Airia endpoint.

## Airia API facts
| Property | Value |
|---|---|
| Endpoint | `POST https://api.airia.ai/v2/PipelineExecution/<GUID>` |
| Auth | `X-API-KEY` header |
| Body | `{ "userInput": "...", "asyncOutput": false }` |
| JS SDK | None — use plain `fetch` |

## Tech Stack
- **Next.js 14** + Tailwind CSS
- **Airia** — AI agent (Claude + Gmail MCP + Calendar MCP + web search)
- **NextAuth.js** — Google OAuth 2.0 (token passed to Airia for MCP auth)
- **Railway** — deployment

## Local Setup

### 1. Clone and install
```bash
git clone https://github.com/srivi19/job-autopilot.git
cd job-autopilot
npm install
```

### 2. Create a Google OAuth app
1. Go to https://console.cloud.google.com → create/select a project
2. Enable **Gmail API** and **Google Calendar API**
3. Go to **APIs & Services → Credentials → Create OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Add authorised redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy **Client ID** and **Client Secret**

### 3. Set environment variables
```bash
cp .env.example .env.local
```
Fill in `.env.local`:
```
AIRIA_API_KEY=           ← from Airia dashboard → API
AIRIA_PIPELINE_ID=       ← GUID from your Airia API URL
GOOGLE_CLIENT_ID=        ← from Google Cloud Console
GOOGLE_CLIENT_SECRET=    ← from Google Cloud Console
NEXTAUTH_SECRET=         ← run: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

### 4. Run
```bash
npm run dev
```
Open http://localhost:3000 → sign in with Google → paste a LinkedIn URL + resume → run agent.

## Deploy to Railway

### 1. Push to GitHub
```bash
git init && git add .
git commit -m "Initial commit"
git remote add origin https://github.com/srivi19/job-autopilot.git
git branch -M main && git push -u origin main
```

### 2. Deploy
1. Go to https://railway.app/new → Deploy from GitHub
2. Select `job-autopilot`
3. Add environment variables (same as `.env.local`, but change `NEXTAUTH_URL` to your Railway domain)
4. In Google Cloud Console, add your Railway redirect URI:
   `https://YOUR_RAILWAY_DOMAIN.railway.app/api/auth/callback/google`

## Project Structure
```
pages/
  index.js                  ← Landing page (Google sign-in)
  app.js                    ← Kanban dashboard (protected)
  api/
    agent.js                ← Calls Airia PipelineExecution endpoint
    auth/
      [...nextauth].js      ← Google OAuth (Gmail + Calendar scopes)
middleware.js               ← Protects /app — redirects if not signed in
railway.json                ← Railway deployment config
.env.example                ← Copy to .env.local
```

## Hackathon Track
**Active Agents** — Airia Hackathon 2026:
- Airia agent orchestrates 2+ tools (Gmail MCP + Google Calendar MCP + web search)
- Human-in-the-loop (user reviews cover letter before applying)
- Document generation (tailored cover letter)
- Real user data via Google OAuth
