// api/audio.js
// Vercel Serverless Function - BGM/Audio generation via Replicate MusicGen

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

const STYLE_MUSIC_PROMPTS = {
  realistic: 'ambient cinematic score, emotional, orchestral, subtle',
  anime: 'upbeat anime OST, J-pop electronic, energetic, melodic',
  manga: 'dramatic orchestral, tension building, manga battle theme',
  cinematic: 'epic Hans Zimmer style, cinematic orchestra, powerful',
  '3d': 'futuristic electronic ambient, sci-fi atmosphere',
  abstract: 'ambient electronic, ethereal, atmospheric, Brian Eno style',
  watercolor: 'gentle piano, soft acoustic, peaceful, impressionist',
  neon: 'synthwave, 80s retro electronic, neon city vibes',
  vintage: 'vintage jazz, film noir, 1950s ambiance',
  minimalist: 'minimal piano, sparse, breathing space, Erik Satie',
  horror: 'dark ambient, unsettling strings, horror atmosphere',
  fantasy: 'epic fantasy orchestra, magical, adventurous',
  cyberpunk: 'cyberpunk electronic, industrial beats, future bass',
  studio_ghibli: 'Joe Hisaishi style, gentle orchestral, whimsical, peaceful',
  pixel: 'chiptune, 8-bit music, retro game soundtrack',
  lofi: 'lo-fi hip hop, chill beats, nostalgic, warm vinyl'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: 'API token not configured' });
  }

  try {
    const { style = 'realistic', duration = 5, prompt = '' } = req.body;

    const musicPrompt = STYLE_MUSIC_PROMPTS[style] || STYLE_MUSIC_PROMPTS.realistic;
    const finalPrompt = prompt ? `${musicPrompt}, inspired by: ${prompt}` : musicPrompt;

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",  // meta/musicgen
        input: {
          prompt: finalPrompt,
          model_version: 'stereo-large',
          output_format: 'mp3',
          output_quality: 'medium',
          normalization_strategy: 'peak',
          duration: Math.max(duration + 2, 8)  // slightly longer for overlap
        }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.detail || 'Audio generation failed' });
    }

    const prediction = await response.json();
    return res.status(201).json({ id: prediction.id, status: prediction.status });

  } catch (error) {
    console.error('Audio error:', error);
    return res.status(500).json({ error: error.message });
  }
}
