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
    const response = await fetch(
      `https://api.airia.ai/v2/PipelineExecution/${process.env.AIRIA_PIPELINE_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": process.env.AIRIA_API_KEY,
        },
        body: JSON.stringify({
          userInput,
          asyncOutput: false, // synchronous — wait for full response
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Airia API error:", response.status, errText);
      return res.status(response.status).json({
        error: `Airia API error (${response.status})`,
        detail: errText,
        message: "Failed to process your request. Please try again later."
      });
    }

    const data = await response.json();

    // Log response shape in dev to help identify the correct output key
    if (process.env.NODE_ENV !== "production") {
      console.log("Airia response keys:", Object.keys(data));
      console.log("Airia response:", JSON.stringify(data).slice(0, 300));
    }

    // Airia returns the agent output — try common response key names in order
    const rawText =
      data.result ??
      data.output ??
      data.content ??
      data.text ??
      data.message ??
      data.response ??
      (typeof data === "string" ? data : null);

    if (!rawText) {
      console.error("No text content found in Airia response:", data);
      return res.status(500).json({
        error: "Unexpected response from Airia API. Please contact support.",
        detail: JSON.stringify(data).slice(0, 500),
      });
    }

    // Strip accidental markdown fences before JSON parsing
    const cleanJson = rawText.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error("JSON parse failed. Raw text:", rawText);
      return res.status(500).json({
        error: "Invalid response format from Airia API. Please contact support.",
        detail: rawText.slice(0, 500),
      });
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("Agent error:", error);
    return res.status(500).json({ error: "Agent failed", detail: error.message });
  }
}
