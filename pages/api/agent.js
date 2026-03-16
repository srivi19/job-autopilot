// pages/api/agent.js
// Calls your Airia agent via the PipelineExecution REST API.
//
// Airia facts (confirmed from docs):
//   - Endpoint:   POST https://api.airia.ai/v2/PipelineExecution/<GUID>
//   - Auth:       X-API-KEY header (API key from Airia dashboard → API)
//   - Body:       { userInput: string, asyncOutput: false }
//   - SDK:        No official JS SDK — plain fetch is the right approach
//   - Role:       Airia IS the orchestrator. It runs Claude + your MCP tools
//                 internally. Do NOT also call Anthropic directly.
//
// The Gmail and Google Calendar MCP servers are configured INSIDE your
// Airia pipeline — you do not pass mcp_servers from here.
// The user's Google OAuth token IS passed so Airia can authenticate
// those MCP calls on behalf of the signed-in user.

import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  // ── Auth: require Google sign-in ────────────────────────────────────────────
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Not authenticated. Please sign in with Google." });
  }
  if (session.error === "RefreshAccessTokenError") {
    return res.status(401).json({ error: "Google session expired. Please sign in again." });
  }

  // ── Guard: Airia API key must be set ────────────────────────────────────────
  if (!process.env.AIRIA_API_KEY) {
    console.error("AIRIA_API_KEY is not set");
    return res.status(500).json({
      error: "Server misconfiguration: Missing Airia API key. Please contact support."
    });
  }

  // ── Input validation ─────────────────────────────────────────────────────────
  const { linkedinUrl, resume } = req.body;
  if (!linkedinUrl || !resume) {
    return res.status(400).json({ error: "Missing linkedinUrl or resume" });
  }

  // Date helpers for calendar event instructions
  const today = new Date().toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  const followUpDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  // ── Build the userInput for the Airia agent ──────────────────────────────────
  // This is the full prompt your Airia pipeline receives.
  // The Google OAuth access token is included so your Airia pipeline can
  // forward it to the Gmail and Google Calendar MCP servers.
  const userInput = `
GOOGLE_ACCESS_TOKEN: ${session.accessToken}

LinkedIn Job URL: ${linkedinUrl}

Resume:
${resume}

Today's date: ${today}
Follow-up date (7 days from now): ${followUpDate}

Please complete ALL of the following steps:

1. SCRAPE — Use web search to read the job description from the LinkedIn URL.
   Extract: company name, job title, key requirements, required skills.

2. SCORE — Compare the resume to the JD.
   Produce a fit score (0-100), 2-4 fit reasons, and 2-4 skill gaps.

3. COVER LETTER — Write a tailored 3-paragraph cover letter.
   Reference specific details from both the JD and the resume.

4. GMAIL — Save the cover letter as a Gmail draft using the Gmail MCP.
   Subject: "Application for [Role] at [Company]"
   Use the GOOGLE_ACCESS_TOKEN above to authenticate.

5. CALENDAR — Create two Google Calendar events using the Calendar MCP.
   Event 1: "Apply: [Company]" on ${today}
   Event 2: "Follow up: [Company]" on ${followUpDate}
   Use the GOOGLE_ACCESS_TOKEN above to authenticate.

6. RESPOND — After all steps, reply ONLY with this exact JSON (no markdown, no backticks):
{
  "company": "Company name",
  "role": "Job title",
  "fitScore": 82,
  "fitReasons": ["Reason 1", "Reason 2"],
  "gaps": ["Gap 1", "Gap 2"],
  "coverLetter": "Full cover letter text...",
  "gmailDraftId": "draft_id_or_null",
  "calendarEventId": "event_id_or_null",
  "applyDate": "${today}",
  "followUpDate": "${followUpDate}"
}
`.trim();

  try {
    // ── Call Airia PipelineExecution endpoint ──────────────────────────────────
    const gatewayUrl = process.env.AIRIA_GATEWAY_URL;
    const pipelineId = process.env.AIRIA_PIPELINE_ID;

    const response = await fetch(
      `${gatewayUrl}/v2/PipelineExecution/${pipelineId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": process.env.AIRIA_API_KEY,
        },
        body: JSON.stringify({ userInput: req.body.userInput, asyncOutput: false }),
      }
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
