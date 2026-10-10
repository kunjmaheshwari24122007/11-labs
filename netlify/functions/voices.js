/**
 * ElevenNarrate - Serverless Dynamic Voices Proxy
 *
 * Securely retrieves available voices from the user's ElevenLabs account.
 * Filters out internal sensitive fields and returns a clean, safe subset of voice metadata.
 */

exports.handler = async (event, context) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json", "Allow": "GET" },
      body: JSON.stringify({
        error: "Method Not Allowed. Voice discovery requires HTTP GET.",
        code: "METHOD_NOT_ALLOWED"
      })
    };
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_elevenlabs_api_key_here") {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "ELEVENLABS_API_KEY is not configured on the server. Falling back to static voice catalog.",
        code: "MISSING_API_KEY"
      })
    };
  }

  try {
    const upstreamResponse = await fetch("https://api.elevenlabs.io/v1/voices", {
      method: "GET",
      headers: {
        "xi-api-key": apiKey.trim(),
        "Accept": "application/json"
      }
    });

    if (!upstreamResponse.ok) {
      return {
        statusCode: upstreamResponse.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Unable to retrieve voices from ElevenLabs.",
          code: "UPSTREAM_VOICE_ERROR"
        })
      };
    }

    const data = await upstreamResponse.json();
    const rawVoices = Array.isArray(data.voices) ? data.voices : [];

    // Filter and sanitize voice objects to only expose safe presentation data
    const sanitizedVoices = rawVoices.map(v => {
      let description = "ElevenLabs studio voice";
      if (v.description && v.description.trim()) {
        description = v.description.trim();
      } else if (v.labels) {
        const parts = [];
        if (v.labels.accent) parts.push(v.labels.accent);
        if (v.labels.description) parts.push(v.labels.description);
        if (v.labels.use_case) parts.push(v.labels.use_case);
        if (parts.length > 0) description = parts.join(" · ");
      }

      return {
        id: v.voice_id,
        name: v.name,
        category: v.category || "General",
        gender: v.labels?.gender || "Neutral",
        description: description,
        previewUrl: v.preview_url || null
      };
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=300" // Cache for 5 minutes
      },
      body: JSON.stringify({
        success: true,
        voices: sanitizedVoices
      })
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Network error while connecting to ElevenLabs voice endpoint.",
        code: "NETWORK_ERROR"
      })
    };
  }
};
