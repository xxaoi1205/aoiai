// api/generate.js - Kling AI高品質モデル対応版

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

const MODELS = {
  primary: {
    version: "klingai/kling-v1-5-pro:b17904db1fc3a5e35eda30d80ba5b93f0d690b83cad01ea17e22c4d8f3e10fc5",
    input: (p) => ({
      prompt: p.prompt,
      negative_prompt: p.negative_prompt || "blurry, low quality, distorted, watermark, text",
      duration: Math.min(p.duration || 5, 10),
      aspect_ratio: p.aspect_ratio || "9:16",
      cfg_scale: p.cfg_scale || 7,
    })
  },
  fallback: {
    version: "minimax/video-01:5e9f4dcf34a84e8a93c9d3890b1c91af7c2c61697494a7d1a33f4028428e7cd7",
    input: (p) => ({
      prompt: p.prompt,
      prompt_optimizer: true,
    })
  }
};

const STYLE_MODIFIERS = {
  realistic: "photorealistic, cinematic quality, 8k, professional cinematography, natural lighting",
  anime: "anime style, vibrant colors, detailed cel-shading, high quality Japanese animation, Studio quality",
  manga: "manga style, black and white, detailed line art, dramatic shading, shounen manga",
  cinematic: "cinematic film, anamorphic lens, depth of field, Hollywood blockbuster quality, dramatic lighting",
  "3d": "3D CGI render, Pixar style, volumetric lighting, photorealistic 3D animation",
  abstract: "abstract art, surreal, ethereal, dreamlike, flowing organic shapes, artistic",
  watercolor: "watercolor painting, soft pastel colors, artistic brushstrokes, traditional media",
  neon: "synthwave neon lights, cyberpunk atmosphere, glowing neon colors, 80s retro futuristic",
  vintage: "vintage 35mm film, grain texture, retro, nostalgic, film photography aesthetic",
  minimalist: "minimalist, clean composition, elegant simplicity, negative space, refined",
  horror: "dark horror atmosphere, unsettling, eerie shadows, psychological horror, dramatic",
  fantasy: "epic fantasy art, magical atmosphere, high fantasy, Tolkien style, detailed world",
  cyberpunk: "cyberpunk 2077 style, futuristic Tokyo, neon rain cityscape, dystopian future",
  studio_ghibli: "Studio Ghibli style, Hayao Miyazaki, painterly, warm colors, magical realism, detailed backgrounds",
  pixel: "pixel art, 16-bit retro game aesthetic, chiptune era, detailed pixel animation",
  lofi: "lo-fi aesthetic, cozy warm atmosphere, nostalgic, soft golden hour lighting, peaceful"
};

function getWidth(ratio) {
  return { "16:9": 1280, "9:16": 720, "1:1": 1024 }[ratio] || 720;
}
function getHeight(ratio) {
  return { "16:9": 720, "9:16": 1280, "1:1": 1024 }[ratio] || 1280;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: "REPLICATE_API_TOKEN が未設定です" });
  }

  try {
    const payload = req.body;
    if (!payload.prompt) return res.status(400).json({ error: "プロンプトが必要です" });

    // スタイル修飾子を追加
    const styleModifier = STYLE_MODIFIERS[payload.style] || "";
    const enhancedPrompt = styleModifier
      ? `${payload.prompt}, ${styleModifier}`
      : payload.prompt;

    const model = MODELS.primary;
    const input = model.input({ ...payload, prompt: enhancedPrompt });

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
        Prefer: "respond-async",
      },
      body: JSON.stringify({ version: model.version, input }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      // プライマリが失敗したらフォールバックを試みる
      if (response.status === 422 || response.status === 404) {
        const fb = MODELS.fallback;
        const fbRes = await fetch("https://api.replicate.com/v1/predictions", {
          method: "POST",
          headers: {
            Authorization: `Token ${REPLICATE_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ version: fb.version, input: fb.input(payload) }),
        });
        if (!fbRes.ok) {
          const fbErr = await fbRes.json().catch(() => ({}));
          return res.status(fbRes.status).json({ error: fbErr.detail || "生成エラー" });
        }
        const fbData = await fbRes.json();
        return res.status(201).json({ id: fbData.id, status: fbData.status });
      }
      return res.status(response.status).json({ error: errData.detail || "Replicate APIエラー" });
    }

    const prediction = await response.json();
    return res.status(201).json({ id: prediction.id, status: prediction.status });

  } catch (error) {
    console.error("Generate error:", error);
    return res.status(500).json({ error: error.message || "内部エラー" });
  }
}

export const config = { api: { bodyParser: { sizeLimit: "2mb" } } };
