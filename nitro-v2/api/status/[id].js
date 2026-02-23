// api/status/[id].js
// Vercel Serverless Function - Poll prediction status from Replicate

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: 'API token not configured' });
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Prediction ID required' });

  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.detail || 'Status fetch failed' });
    }

    const prediction = await response.json();

    // Map Replicate status to our format
    // Replicate statuses: starting, processing, succeeded, failed, canceled
    const result = {
      id: prediction.id,
      status: prediction.status,
      output: null,
      audio_url: null,
      error: null,
      progress: getProgressFromLogs(prediction.logs)
    };

    if (prediction.status === 'succeeded') {
      // Output can be array or string depending on model
      const output = prediction.output;
      if (Array.isArray(output)) {
        result.output = output[0]; // First output is usually the video
      } else {
        result.output = output;
      }
    }

    if (prediction.status === 'failed') {
      result.error = prediction.error || '生成に失敗しました';
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({ error: error.message });
  }
}

function getProgressFromLogs(logs) {
  if (!logs) return 0;
  // Parse percentage from Replicate logs if available
  const match = logs.match(/(\d+)%/);
  if (match) return parseInt(match[1]);
  return 0;
}
