/**
 * ElevenNarrate - Public Application Configuration
 *
 * NOTE: This file is loaded by the browser and MUST NOT contain any secret keys.
 * API keys belong strictly in server-side environment variables (.env / Netlify dashboard).
 */

export const APP_CONFIG = {
  appName: "ElevenNarrate",
  tagline: "Turn written words into natural voice.",
  maxCharacters: 5000,
  warningCharacters: 4500,
  wordsPerMinute: 150, // Standard average reading rate for duration estimation
  apiEndpoints: {
    tts: "/.netlify/functions/tts",
    voices: "/.netlify/functions/voices",
    account: "/.netlify/functions/account",
    saveKey: "/.netlify/functions/save-key",
    did: "/.netlify/functions/did",
    directTtsBase: "https://api.elevenlabs.io/v1/text-to-speech",
    directVoices: "https://api.elevenlabs.io/v1/voices",
    directUser: "https://api.elevenlabs.io/v1/user",
    localServer: "http://localhost:8888"
  },
  defaultVoiceSettings: {
    stability: 0.50,
    similarityBoost: 0.75,
    style: 0.00,
    useSpeakerBoost: true
  }
};

/**
 * Curated ElevenLabs & Local Voices
 */
export const VOICES = [
  {
    id: "local-david",
    name: "Microsoft David (Local Desktop)",
    description: "Built-in offline Windows system voice - Free, fast & zero quota limit.",
    category: "Local System",
    gender: "Male",
    engine: "local",
    color: "#0284C7"
  },
  {
    id: "local-zira",
    name: "Microsoft Zira (Local Desktop)",
    description: "Built-in offline Windows system voice - Clear female articulation.",
    category: "Local System",
    gender: "Female",
    engine: "local",
    color: "#E11D48"
  },
  {
    id: "local-hazel",
    name: "Microsoft Hazel (Local Desktop)",
    description: "Built-in offline Windows system voice - British English delivery.",
    category: "Local System",
    gender: "Female",
    engine: "local",
    color: "#0D9488"
  },
  {
    id: "CwhRBWXzGAHq8TQ4Fs17",
    name: "Roger",
    description: "Laid-back, casual, and resonant American male narration.",
    category: "Conversational",
    gender: "Male",
    engine: "elevenlabs",
    color: "#10B981"
  },
  {
    id: "pNInz6obpgDQGcFmaJgB",
    name: "Adam",
    description: "Deep, warm, confident American male voice.",
    category: "Professional",
    gender: "Male",
    engine: "elevenlabs",
    color: "#3B82F6"
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Sarah",
    description: "Mature, reassuring, confident female narration.",
    category: "Professional",
    gender: "Female",
    engine: "elevenlabs",
    color: "#EC4899"
  },
  {
    id: "IKne3meq5aSn9XLyUdCD",
    name: "Charlie",
    description: "Deep, confident, and energetic Australian male delivery.",
    category: "Dynamic",
    gender: "Male",
    color: "#F59E0B"
  },
  {
    id: "JBFqnCBsd6RMkjVDRZzb",
    name: "George",
    description: "Warm, captivating British storyteller voice.",
    category: "Storytelling",
    gender: "Male",
    color: "#6366F1"
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Sarah",
    description: "Mature, reassuring, confident female narration.",
    category: "Professional",
    gender: "Female",
    color: "#EC4899"
  },
  {
    id: "SAz9YHcvj6GT2YYXdXww",
    name: "River",
    description: "Relaxed, neutral, informative delivery for documentaries.",
    category: "Documentary",
    gender: "Non-binary",
    color: "#14B8A6"
  },
  {
    id: "N2lVS1w4EtoT3dr4eOWO",
    name: "Callum",
    description: "Husky, expressive character voice for games and stories.",
    category: "Creative",
    gender: "Male",
    color: "#F43F5E"
  }
];

/**
 * ElevenLabs Narration Models
 *
 * Model availability depends on your ElevenLabs tier.
 * Models can be updated or expanded here.
 */
export const MODELS = [
  {
    id: "eleven_multilingual_v2",
    name: "Eleven Multilingual v2",
    badge: "Recommended",
    description: "State-of-the-art multilingual model with lifelike emotional nuance and natural pauses.",
    speed: "Standard Quality",
    languages: "29 languages"
  },
  {
    id: "eleven_turbo_v2_5",
    name: "Eleven Turbo v2.5",
    badge: "Fast & Rich",
    description: "High-performance model with ultra-low latency and excellent linguistic fidelity.",
    speed: "High Speed",
    languages: "32 languages"
  },
  {
    id: "eleven_flash_v2_5",
    name: "Eleven Flash v2.5",
    badge: "Ultra Fast",
    description: "Optimized for lightning-fast speech generation and rapid preview iterations.",
    speed: "Ultra Speed",
    languages: "32 languages"
  },
  {
    id: "eleven_monolingual_v1",
    name: "Eleven English v1",
    badge: "Classic",
    description: "Original high-accuracy English model designed for standard voiceover production.",
    speed: "Standard",
    languages: "English only"
  }
];

/**
 * Narration Starting Templates
 *
 * Diverse, original scripts across common speech synthesis use-cases.
 */
export const TEMPLATES = [
  {
    id: "podcast-intro",
    title: "Podcast Intro",
    badge: "Podcast",
    icon: "microphone",
    description: "Warm, engaging opener for episodic audio shows.",
    suggestedVoiceId: "pNInz6obpgDQGcFmaJgB", // Adam
    text: "Welcome back to Deep Signals. In today's episode, we explore the subtle patterns shaping modern technology, design philosophy, and human connection. Grab your favorite notebook, get comfortable, and let's dive into the conversation."
  },
  {
    id: "product-announcement",
    title: "Product Launch",
    badge: "Marketing",
    icon: "rocket",
    description: "Dynamic and compelling announcement for new software or products.",
    suggestedVoiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel
    text: "Introducing ElevenNarrate: a studio-grade workspace designed to bring your written ideas to life. With expressive AI narration, real-time voice shaping, and pristine audio quality, your stories now sound exactly the way you imagined."
  },
  {
    id: "guided-meditation",
    title: "Mindful Pause",
    badge: "Wellness",
    icon: "heart",
    description: "Calm, slow-paced script for mindfulness and reflection.",
    suggestedVoiceId: "EXAVITQu4vr4xnSDxMaL", // Bella
    text: "Find a comfortable position where you can remain relaxed yet alert. Gently close your eyes, take a slow breath in through your nose, and feel your shoulders drop as you breathe out. Give yourself permission to pause and arrive right here."
  },
  {
    id: "audiobook-excerpt",
    title: "Audiobook Scene",
    badge: "Literary",
    icon: "book",
    description: "Atmospheric, descriptive storytelling with nuanced pacing.",
    suggestedVoiceId: "ErXwobaYiN019PkySvjV", // Antoni
    text: "The harbor lights flickered across the ink-black water as the cold northern wind swept through the narrow cobblestone alleyways. He paused beneath the rusted streetlamp, checking the pocket watch once more. The signal had been given."
  },
  {
    id: "youtube-voiceover",
    title: "Video Voiceover",
    badge: "Creator",
    icon: "video",
    description: "Clear, crisp, and high-energy narration for tutorial or explainer videos.",
    suggestedVoiceId: "TxGEqnHWrfWFTfGW9XjX", // Josh
    text: "Have you ever wondered why certain products feel effortless while others feel frustrating? In this video, we are breaking down three subtle design principles that separate good interfaces from truly extraordinary digital experiences."
  },
  {
    id: "executive-presentation",
    title: "Executive Brief",
    badge: "Business",
    icon: "briefcase",
    description: "Authoritative and articulate summary for key stakeholders.",
    suggestedVoiceId: "VR6AewLTigWG4xSOukaG", // Arnold
    text: "Good morning, everyone. Over the past quarter, our cross-functional team delivered record operational efficiency while expanding platform capacity by forty percent. Let's walk through the strategic milestones and the outlook for next quarter."
  }
];
