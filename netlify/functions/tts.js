/**
 * ElevenNarrate - Serverless Text-to-Speech Proxy
 *
 * Securely forwards TTS requests to ElevenLabs API without exposing the API key to the client.
 * Enforces server-side validation, rate safety, and private error handling.
 */

exports.handler = async (event, context) => {
  // Enforce HTTP POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Content-Type": "application/json",
        "Allow": "POST"
      },
      body: JSON.stringify({
        error: "Method Not Allowed. Narration generation requires HTTP POST.",
        code: "METHOD_NOT_ALLOWED"
      })
    };
  }

  // Parse and validate client request payload
  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (parseError) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Invalid JSON request payload.",
        code: "INVALID_JSON"
      })
    };
  }

  // Check API key from headers, payload, or server environment
  const headerKey = event.headers["xi-api-key"] || event.headers["x-elevenlabs-api-key"];
  const payloadKey = payload.apiKey || payload.elevenLabsApiKey;
  const apiKey = (headerKey && headerKey.trim()) || (payloadKey && payloadKey.trim()) || process.env.ELEVENLABS_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey === "your_elevenlabs_api_key_here") {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Server configuration error: ELEVENLABS_API_KEY is not set. Please configure your key in .env or provide it in Studio Settings.",
        code: "MISSING_API_KEY"
      })
    };
  }

  const { text, voiceId, modelId, voiceSettings } = payload;

  // Validate script text
  if (typeof text !== "string" || text.trim().length === 0) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Enter some text before generating narration.",
        code: "EMPTY_TEXT"
      })
    };
  }

  const trimmedText = text.trim();
  const MAX_CHARACTERS = 5000;
  if (trimmedText.length > MAX_CHARACTERS) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: `Your script is too long (${trimmedText.length.toLocaleString()} characters). Shorten it to under ${MAX_CHARACTERS.toLocaleString()} characters and try again.`,
        code: "TEXT_TOO_LONG"
      })
    };
  }

  // Validate Voice ID (alphanumeric safe check)
  if (typeof voiceId !== "string" || !voiceId.trim() || !/^[a-zA-Z0-9_-]{5,64}$/.test(voiceId.trim())) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Invalid or missing voice ID. Please select a valid voice from the dropdown.",
        code: "INVALID_VOICE_ID"
      })
    };
  }
  const cleanVoiceId = voiceId.trim();

  // Validate Model ID
  if (typeof modelId !== "string" || !modelId.trim() || !/^[a-zA-Z0-9_.-]{3,64}$/.test(modelId.trim())) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Invalid or missing narration model ID.",
        code: "INVALID_MODEL_ID"
      })
    };
  }
  const cleanModelId = modelId.trim();

  // Validate and sanitize optional voice settings
  const cleanSettings = {
    stability: 0.50,
    similarity_boost: 0.75,
    style: 0.00,
    use_speaker_boost: true
  };

  if (voiceSettings && typeof voiceSettings === "object") {
    if (typeof voiceSettings.stability === "number" && !isNaN(voiceSettings.stability)) {
      cleanSettings.stability = Math.max(0, Math.min(1, Number(voiceSettings.stability.toFixed(2))));
    }
    const similarity = voiceSettings.similarityBoost !== undefined ? voiceSettings.similarityBoost : voiceSettings.similarity_boost;
    if (typeof similarity === "number" && !isNaN(similarity)) {
      cleanSettings.similarity_boost = Math.max(0, Math.min(1, Number(similarity.toFixed(2))));
    }
    if (typeof voiceSettings.style === "number" && !isNaN(voiceSettings.style)) {
      cleanSettings.style = Math.max(0, Math.min(1, Number(voiceSettings.style.toFixed(2))));
    }
    const speakerBoost = voiceSettings.useSpeakerBoost !== undefined ? voiceSettings.useSpeakerBoost : voiceSettings.use_speaker_boost;
    if (typeof speakerBoost === "boolean") {
      cleanSettings.use_speaker_boost = speakerBoost;
    }
  }

  // Construct ElevenLabs API request
  const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(cleanVoiceId)}?output_format=mp3_44100_128`;

  const requestBody = {
    text: trimmedText,
    model_id: cleanModelId,
    voice_settings: cleanSettings
  };

  try {
    const upstreamResponse = await fetch(elevenLabsUrl, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey.trim(),
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
      },
      body: JSON.stringify(requestBody)
    });

    if (!upstreamResponse.ok) {
      let upstreamErrorData = {};
      try {
        upstreamErrorData = await upstreamResponse.json();
      } catch (e) {
        // Non-JSON upstream error
      }

      const status = upstreamResponse.status;
      let userFriendlyMessage = "The narration service encountered an error while processing your audio.";
      let errorCode = "ELEVENLABS_API_ERROR";

      if (status === 401) {
        const detailMsg = typeof upstreamErrorData.detail === "string" 
          ? upstreamErrorData.detail 
          : upstreamErrorData.detail?.message;
        const statusTag = typeof upstreamErrorData.detail === "object" ? upstreamErrorData.detail?.status : "";
        if (statusTag === "detected_unusual_activity" || (detailMsg && detailMsg.toLowerCase().includes("unusual activity"))) {
          userFriendlyMessage = `ElevenLabs Free Tier Blocked: Unusual activity detected on this account (common with VPN/proxy or new free accounts). Upgrade your subscription or use Local Studio Synthesizer.`;
          errorCode = "ELEVENLABS_UNUSUAL_ACTIVITY";
        } else {
          userFriendlyMessage = detailMsg 
            ? `ElevenLabs Authentication: ${detailMsg}`
            : "ElevenLabs authentication failed. Verify that your ELEVENLABS_API_KEY is valid and has active permissions.";
          errorCode = "AUTH_FAILED";
        }
      } else if (status === 402 || status === 429) {
        const detailMsg = typeof upstreamErrorData.detail === "string" 
          ? upstreamErrorData.detail 
          : upstreamErrorData.detail?.message;
        userFriendlyMessage = detailMsg 
          ? `ElevenLabs Quota: ${detailMsg}`
          : "ElevenLabs credit quota or rate limit exceeded. Please check your ElevenLabs account credits and subscription tier.";
        errorCode = "QUOTA_EXCEEDED";
      } else if (status === 404) {
        userFriendlyMessage = `The voice ID "${cleanVoiceId}" was not found in your ElevenLabs voice library. Please verify the voice ID in your settings.`;
        errorCode = "VOICE_NOT_FOUND";
      } else if (status === 422) {
        const detailMessage = typeof upstreamErrorData.detail === "string" 
          ? upstreamErrorData.detail 
          : upstreamErrorData.detail?.message || "Invalid parameters sent to ElevenLabs.";
        userFriendlyMessage = `ElevenLabs rejected the request: ${detailMessage}`;
        errorCode = "UNPROCESSABLE_ENTITY";
      } else if (status >= 500) {
        userFriendlyMessage = "ElevenLabs service is currently experiencing upstream difficulties. Please try again in a few moments.";
        errorCode = "UPSTREAM_UNAVAILABLE";
      }

      return {
        statusCode: status >= 400 && status < 500 ? status : 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: userFriendlyMessage,
          code: errorCode
        })
      };
    }

    // Success: receive binary audio stream and return as base64 encoded MP3
    const arrayBuffer = await upstreamResponse.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Content-Disposition": 'inline; filename="eleven-narrate.mp3"',
        "X-Content-Type-Options": "nosniff"
      },
      body: audioBuffer.toString("base64"),
      isBase64Encoded: true
    };
  } catch (networkError) {
    return {
      statusCode: 504,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Network error: Unable to reach the ElevenLabs narration service. Check your internet connection and try again.",
        code: "NETWORK_TIMEOUT"
      })
    };
  }
};
