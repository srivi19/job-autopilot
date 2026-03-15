export default async function handler(req, res) {
  const key = process.env.AIRIA_API_KEY;
  const pipelineId = process.env.AIRIA_PIPELINE_ID;
  const maskedKey = key
    ? `${key.slice(0, 8)}...${key.slice(-4)} (length: ${key.length})`
    : "NOT SET";
  try {
    const response = await fetch(
      `https://api.airia.ai/v2/PipelineExecution/${pipelineId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": key,
        },
        body: JSON.stringify({ userInput: "Say hello", asyncOutput: false }),
      }
    );
    const text = await response.text();
    return res.status(200).json({
      keyPreview: maskedKey,
      pipelineId,
      airiaStatus: response.status,
      airiaResponse: text.slice(0, 500),
    });
  } catch (err) {
    return res.status(500).json({ keyPreview: maskedKey, error: err.message });
  }
}
```

Commit it → wait for Railway to redeploy → then visit:
```
https://job-autopilot-production-f33b.up.railway.app/api/test-airia
