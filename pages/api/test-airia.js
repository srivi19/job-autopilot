export default async function handler(req, res) {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Testing endpoint is disabled in production." });
  }

  const key = process.env.AIRIA_API_KEY;
  const pipelineId = process.env.AIRIA_PIPELINE_ID;
  const maskedKey = key ? `${key.slice(0, 8)}...${key.slice(-4)} (length: ${key.length})` : "NOT SET";
  const gatewayUrl = process.env.AIRIA_GATEWAY_URL;
  try {
    const response = await fetch(
      `${gatewayUrl}/v2/PipelineExecution/${pipelineId}`,
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
