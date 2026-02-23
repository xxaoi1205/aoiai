// api/generate.js
// Vercel Serverless Function - Video Generation via Replicate

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

// Model versions (text-to-video)
const MODELS = {
  // Primary: AnimateDiff Lightning - fast, good quality, free tier
  primary: {
    version: "bytedance/animatediff-lightning-4step:b4e551039552e36e8cae6a3ca6b3f9d98534e9b77bb48e2dac5dd1bafed2d72d",
    input: (payload) => ({
      prompt: payload.prompt,
      negative_prompt: payload.negative_prompt,
      num_frames: Math.min(payload.duration * 8, 40),  // ~8fps
      guidance_scale: payload.cfg_scale,
      width: getWidth(payload.aspect_ratio),
      height: getHeight(payload.aspect_ratio),
    })
  },
  // Fallback: Stable Video Diffusion style (image-to-video alternative)
  fallback: {
    version: "lucataco/animate-diff-v1-5:beecf59c4aee8d81bf04f0381033dfa10dc16e845b4ae00d281e2fa377e48a9f",
    input: (payload) => ({
      prompt: payload.prompt,
      n_prompt: payload.negative_prompt,
      num_frames: 24,
    })
  }
};

function getWidth(ratio) {
  const map = { '16:9': 848, '9:16': 480, '1:1': 512 };
  return map[ratio] || 480;
}

function getHeight(ratio) {
  const map = { '16:9': 480, '9:16': 848, '1:1': 512 };
  return map[ratio] || 848;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: 'REPLICATE_API_TOKEN が設定されていません。Vercel環境変数を確認してください。' });
  }

  try {
    const payload = req.body;

    if (!payload.prompt) {
      return res.status(400).json({ error: 'プロンプトが必要です' });
    }

    const model = MODELS.primary;
    const input = model.input(payload);

    // Create prediction on Replicate
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'respond-async'
      },
      body: JSON.stringify({
        version: model.version,
        input,
        webhook: null,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Replicate API error:', response.status, errorData);
      return res.status(response.status).json({
        error: errorData.detail || 'Replicate APIエラーが発生しました'
      });
    }

    const prediction = await response.json();

    // Return prediction ID for polling
    return res.status(201).json({
      id: prediction.id,
      status: prediction.status,
      created_at: prediction.created_at
    });

  } catch (error) {
    console.error('Generate error:', error);
    return res.status(500).json({ error: error.message || '内部エラーが発生しました' });
  }
}

// Disable body parsing size limit
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
};
