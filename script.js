/**
 * ElevenNarrate - Frontend Application Logic
 *
 * Handles script editing, real-time metrics, voice and model selection,
 * voice settings shaping, serverless TTS generation, native audio playback,
 * audio blob lifecycle, and toast notifications.
 */

import { APP_CONFIG, VOICES, MODELS, TEMPLATES } from "./config.js";

/* --------------------------------------------------------------------------
   Central Application State
   -------------------------------------------------------------------------- */
const appState = {
  text: "",
  selectedVoiceId: "",
  selectedVoiceName: "",
  selectedModelId: "",
  selectedModelName: "",
  voiceSettings: {
    stability: APP_CONFIG.defaultVoiceSettings.stability,
    similarityBoost: APP_CONFIG.defaultVoiceSettings.similarityBoost,
    style: APP_CONFIG.defaultVoiceSettings.style,
    useSpeakerBoost: APP_CONFIG.defaultVoiceSettings.useSpeakerBoost
  },
  isGenerating: false,
  currentAudioUrl: null,
  currentAudioBlob: null,
  currentAudioFileName: "",
  playbackStatus: "idle", // 'idle' | 'playing' | 'paused'
  theme: "dark",
  engine: "elevenlabs", // 'elevenlabs' | 'local'
  customApiKey: localStorage.getItem("elevennarrate_api_key") || localStorage.getItem("elevennarrate_custom_key") || "",
  availableVoices: [...VOICES],
  availableModels: [...MODELS]
};

/* --------------------------------------------------------------------------
   DOM Elements Cache
   -------------------------------------------------------------------------- */
const DOM = {
  // Theme & Global
  themeToggle: document.getElementById("theme-toggle"),
  settingsBtn: document.getElementById("settings-btn"),
  settingsModal: document.getElementById("settings-modal"),
  settingsCloseBtn: document.getElementById("settings-close-btn"),
  settingsCancelBtn: document.getElementById("settings-cancel-btn"),
  settingsSaveBtn: document.getElementById("settings-save-btn"),
  inputElevenLabsKey: document.getElementById("input-elevenlabs-key"),
  inputDidKey: document.getElementById("input-did-key"),
  toggleKeyVisibility: document.getElementById("toggle-key-visibility"),
  apiStatusCard: document.getElementById("api-status-card"),
  apiStatusBadge: document.getElementById("api-status-badge"),
  apiStatusDesc: document.getElementById("api-status-desc"),
  engineBtnElevenLabs: document.getElementById("engine-btn-elevenlabs"),
  engineBtnLocal: document.getElementById("engine-btn-local"),
  serverStatusPill: document.getElementById("server-status-pill"),
  statusIndicatorDot: document.getElementById("status-indicator-dot"),
  statusPillText: document.getElementById("status-pill-text"),
  fallbackModal: document.getElementById("fallback-modal"),
  fallbackModalMessage: document.getElementById("fallback-modal-message"),
  fallbackGenerateBtn: document.getElementById("fallback-generate-btn"),
  fallbackSettingsBtn: document.getElementById("fallback-settings-btn"),
  shortcutsBtn: document.getElementById("shortcuts-btn"),
  shortcutsModal: document.getElementById("shortcuts-modal"),
  shortcutsCloseBtn: document.getElementById("shortcuts-close-btn"),
  shortcutsDismissBtn: document.getElementById("shortcuts-dismiss-btn"),
  confirmModal: document.getElementById("confirm-modal"),
  modalTitle: document.getElementById("modal-title"),
  modalMessage: document.getElementById("modal-message"),
  modalCancelBtn: document.getElementById("modal-cancel-btn"),
  modalConfirmBtn: document.getElementById("modal-confirm-btn"),
  toastContainer: document.getElementById("toast-container"),
  liveAnnouncer: document.getElementById("live-announcer"),

  // Editor
  scriptInput: document.getElementById("script-input"),
  textareaWrapper: document.getElementById("textarea-wrapper"),
  charCount: document.getElementById("char-count"),
  metricsInfo: document.getElementById("metrics-info"),
  clearBtn: document.getElementById("clear-btn"),
  generateBtn: document.getElementById("generate-btn"),
  generateBtnText: document.getElementById("generate-btn-text"),
  generateIconIdle: document.getElementById("generate-icon-idle"),
  generateIconSpinner: document.getElementById("generate-icon-spinner"),
  quickExampleBtn: document.getElementById("quick-example-btn"),

  // Voice & Model Controls
  voiceSelect: document.getElementById("voice-select"),
  voiceAvatar: document.getElementById("voice-avatar"),
  voiceAvatarLetter: document.getElementById("voice-avatar-letter"),
  voiceCardName: document.getElementById("voice-card-name"),
  voiceCardCategory: document.getElementById("voice-card-category"),
  voiceCardDesc: document.getElementById("voice-card-desc"),
  modelSelect: document.getElementById("model-select"),
  modelSpeedBadge: document.getElementById("model-speed-badge"),
  modelLanguagesText: document.getElementById("model-languages-text"),
  modelDescText: document.getElementById("model-desc-text"),

  // Voice Settings Accordion
  voiceSettingsToggle: document.getElementById("voice-settings-toggle"),
  voiceSettingsPanel: document.getElementById("voice-settings-panel"),
  settingStability: document.getElementById("setting-stability"),
  valStability: document.getElementById("val-stability"),
  settingSimilarity: document.getElementById("setting-similarity"),
  valSimilarity: document.getElementById("val-similarity"),
  settingStyle: document.getElementById("setting-style"),
  valStyle: document.getElementById("val-style"),
  settingSpeakerBoost: document.getElementById("setting-speaker-boost"),
  resetSettingsBtn: document.getElementById("reset-settings-btn"),

  // Audio Player
  audioPlaceholder: document.getElementById("audio-placeholder"),
  audioPlayerCard: document.getElementById("audio-player-card"),
  nativeAudio: document.getElementById("native-audio"),
  waveformVisualizer: document.getElementById("waveform-visualizer"),
  currentTime: document.getElementById("current-time"),
  totalDuration: document.getElementById("total-duration"),
  seekBar: document.getElementById("seek-bar"),
  timelineFill: document.getElementById("timeline-fill"),
  playPauseBtn: document.getElementById("play-pause-btn"),
  playIcon: document.getElementById("play-icon"),
  pauseIcon: document.getElementById("pause-icon"),
  stopBtn: document.getElementById("stop-btn"),
  replayBtn: document.getElementById("replay-btn"),
  muteBtn: document.getElementById("mute-btn"),
  volHighIcon: document.getElementById("vol-high-icon"),
  volMuteIcon: document.getElementById("vol-mute-icon"),
  volumeSlider: document.getElementById("volume-slider"),
  speedSelect: document.getElementById("speed-select"),
  downloadBtn: document.getElementById("download-btn"),
  playerVoiceTag: document.getElementById("player-voice-tag"),
  playerModelTag: document.getElementById("player-model-tag"),
  playerTimestamp: document.getElementById("player-timestamp"),

  // Templates
  templatesGrid: document.getElementById("templates-grid")
};

/* --------------------------------------------------------------------------
   Initialization
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});

function initializeApp() {
  initializeTheme();
  initializeEngineSwitcher();
  initializeSettingsModal();
  initializeVoiceControls();
  initializeModelControls();
  initializeVoiceSettings();
  initializeTextEditor();
  initializeAudioPlayer();
  initializeTemplates();
  initializeModals();
  initializeKeyboardShortcuts();

  // Try dynamic voice discovery from serverless function in background
  fetchDynamicVoices();

  // Check account diagnostic & status
  checkAccountStatus();

  // Restore draft if available
  restoreDraft();
}

/* --------------------------------------------------------------------------
   Speech Engine Switcher & Status
   -------------------------------------------------------------------------- */
function initializeEngineSwitcher() {
  DOM.engineBtnElevenLabs?.addEventListener("click", () => setEngine("elevenlabs"));
  DOM.engineBtnLocal?.addEventListener("click", () => setEngine("local"));
}

function setEngine(engine) {
  appState.engine = engine;
  const isLocal = engine === "local";

  if (DOM.engineBtnElevenLabs) {
    DOM.engineBtnElevenLabs.classList.toggle("active", !isLocal);
    DOM.engineBtnElevenLabs.setAttribute("aria-checked", String(!isLocal));
  }
  if (DOM.engineBtnLocal) {
    DOM.engineBtnLocal.classList.toggle("active", isLocal);
    DOM.engineBtnLocal.setAttribute("aria-checked", String(isLocal));
  }

  // Adjust selected voice if needed
  if (isLocal && !appState.selectedVoiceId.startsWith("local-")) {
    const localVoice = appState.availableVoices.find(v => v.id.startsWith("local-"));
    if (localVoice) selectVoice(localVoice.id);
  } else if (!isLocal && appState.selectedVoiceId.startsWith("local-")) {
    const cloudVoice = appState.availableVoices.find(v => !v.id.startsWith("local-"));
    if (cloudVoice) selectVoice(cloudVoice.id);
  }

  updateEngineStatusBadge();
}

function updateEngineStatusBadge() {
  if (!DOM.statusPillText) return;
  if (appState.engine === "local") {
    DOM.statusPillText.textContent = "Local Studio Synthesizer Active (Zero Cost)";
    DOM.serverStatusPill?.classList.remove("status-pill-warning");
    DOM.statusIndicatorDot?.classList.remove("warning-dot");
  } else if (appState.accountStatus?.ttsStatus === "unusual_activity_blocked") {
    DOM.statusPillText.textContent = "Free Tier Blocked by ElevenLabs";
    DOM.serverStatusPill?.classList.add("status-pill-warning");
    DOM.statusIndicatorDot?.classList.add("warning-dot");
  } else if (appState.accountStatus?.configured) {
    DOM.statusPillText.textContent = `ElevenLabs AI Connected (${appState.accountStatus.tier || "Active"})`;
    DOM.serverStatusPill?.classList.remove("status-pill-warning");
    DOM.statusIndicatorDot?.classList.remove("warning-dot");
  } else {
    DOM.statusPillText.textContent = "ElevenLabs Ready";
  }
}

async function checkAccountStatus() {
  const apiKey = getActiveApiKey();
  let data = null;

  // 1. Try local proxy server diagnostic first
  const localUrls = [
    APP_CONFIG.apiEndpoints.account,
    `${APP_CONFIG.apiEndpoints.localServer}/.netlify/functions/account`
  ];

  for (const url of localUrls) {
    try {
      const response = await fetch(url, {
        headers: apiKey ? { "xi-api-key": apiKey } : {}
      });
      if (response.ok) {
        data = await response.json();
        break;
      }
    } catch (e) {}
  }

  // 2. If running standalone / Live Server without local server, test ElevenLabs directly
  if (!data && apiKey) {
    try {
      const directResp = await fetch(APP_CONFIG.apiEndpoints.directUser, {
        headers: {
          "xi-api-key": apiKey,
          "Accept": "application/json"
        }
      });
      if (directResp.ok) {
        const uData = await directResp.json();
        const sub = uData.subscription || {};
        data = {
          configured: true,
          tier: sub.tier || "active",
          characterCount: sub.character_count || 0,
          characterLimit: sub.character_limit || 10000,
          ttsStatus: "active",
          ttsMessage: `Tier: ${sub.tier}. Credits: ${(sub.character_count || 0).toLocaleString()} / ${(sub.character_limit || 10000).toLocaleString()}`,
          localSynthesizerReady: false
        };
      } else {
        const errText = await directResp.text();
        data = {
          configured: false,
          error: `ElevenLabs returned HTTP ${directResp.status}: ${errText.slice(0, 150)}`,
          ttsStatus: "error",
          localSynthesizerReady: false
        };
      }
    } catch (err) {}
  }

  if (data) {
    appState.accountStatus = data;

    if (DOM.apiStatusBadge && DOM.apiStatusDesc) {
      if (data.ttsStatus === "unusual_activity_blocked") {
        DOM.apiStatusBadge.textContent = "Free Tier Flagged";
        DOM.apiStatusBadge.className = "badge badge-danger";
        DOM.apiStatusDesc.textContent = "ElevenLabs flagged this account for unusual activity (common with VPN/proxies). Free tier TTS is disabled by ElevenLabs. Use Local Studio Synthesizer or a paid plan.";
      } else if (data.configured) {
        DOM.apiStatusBadge.textContent = `${(data.tier || "Active").toUpperCase()} (${(data.characterCount || 0).toLocaleString()}/${(data.characterLimit || 10000).toLocaleString()} chars)`;
        DOM.apiStatusBadge.className = "badge badge-success";
        DOM.apiStatusDesc.textContent = data.ttsMessage || "Account is active and connected.";
      } else {
        DOM.apiStatusBadge.textContent = "Disconnected";
        DOM.apiStatusBadge.className = "badge badge-subtle";
        DOM.apiStatusDesc.textContent = data.error || "No API key configured.";
      }
    }

    updateEngineStatusBadge();
  }
}

function getActiveApiKey() {
  return appState.customApiKey || localStorage.getItem("elevennarrate_api_key") || "";
}

function initializeSettingsModal() {
  DOM.settingsBtn?.addEventListener("click", openSettingsModal);
  DOM.settingsCloseBtn?.addEventListener("click", closeSettingsModal);
  DOM.settingsCancelBtn?.addEventListener("click", closeSettingsModal);
  DOM.settingsModal?.addEventListener("click", (e) => {
    if (e.target === DOM.settingsModal) closeSettingsModal();
  });

  // Toggle key visibility
  DOM.toggleKeyVisibility?.addEventListener("click", () => {
    if (!DOM.inputElevenLabsKey) return;
    const isPassword = DOM.inputElevenLabsKey.type === "password";
    DOM.inputElevenLabsKey.type = isPassword ? "text" : "password";
  });

  // Save Settings
  DOM.settingsSaveBtn?.addEventListener("click", async () => {
    const elevenKey = DOM.inputElevenLabsKey?.value.trim() || "";
    const didKey = DOM.inputDidKey?.value.trim() || "";

    if (!elevenKey) {
      showNotification("warning", "Missing Key", "Please enter an ElevenLabs API key.");
      return;
    }

    DOM.settingsSaveBtn.disabled = true;
    DOM.settingsSaveBtn.textContent = "Testing & Saving…";

    appState.customApiKey = elevenKey;
    localStorage.setItem("elevennarrate_api_key", elevenKey);
    localStorage.setItem("elevennarrate_custom_key", elevenKey);
    if (didKey) {
      localStorage.setItem("elevennarrate_did_key", didKey);
    }

    // Attempt to persist in .env if local server proxy is active
    try {
      const saveEndpoint = window.location.port === "8888"
        ? APP_CONFIG.apiEndpoints.saveKey
        : `${APP_CONFIG.apiEndpoints.localServer}/.netlify/functions/save-key`;
      await fetch(saveEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elevenLabsApiKey: elevenKey, didApiKey: didKey })
      });
    } catch (err) {
      // Standalone / Live Server mode: key is safely in browser localStorage
    }

    showNotification("success", "Settings Saved", "API key successfully bound to requests.");
    await checkAccountStatus();
    await fetchDynamicVoices();
    closeSettingsModal();
    DOM.settingsSaveBtn.disabled = false;
    DOM.settingsSaveBtn.textContent = "Save & Test Connection";
  });

  // Fallback modal buttons
  DOM.fallbackGenerateBtn?.addEventListener("click", () => {
    if (DOM.fallbackModal) DOM.fallbackModal.hidden = true;
    setEngine("local");
    generateNarration();
  });

  DOM.fallbackSettingsBtn?.addEventListener("click", () => {
    if (DOM.fallbackModal) DOM.fallbackModal.hidden = true;
    openSettingsModal();
  });
}

function openSettingsModal() {
  if (DOM.settingsModal) {
    if (DOM.inputElevenLabsKey) {
      DOM.inputElevenLabsKey.value = getActiveApiKey();
    }
    if (DOM.inputDidKey) {
      DOM.inputDidKey.value = localStorage.getItem("elevennarrate_did_key") || "";
    }
    DOM.settingsModal.hidden = false;
    checkAccountStatus();
  }
}

function closeSettingsModal() {
  if (DOM.settingsModal) {
    DOM.settingsModal.hidden = true;
  }
}

/* --------------------------------------------------------------------------
   Theme Management
   -------------------------------------------------------------------------- */
function initializeTheme() {
  const savedTheme = localStorage.getItem("elevennarrate_theme");
  if (savedTheme === "light" || savedTheme === "dark") {
    setTheme(savedTheme);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
    setTheme("light");
  } else {
    setTheme("dark");
  }

  DOM.themeToggle?.addEventListener("click", () => {
    const nextTheme = appState.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  });
}

function setTheme(theme) {
  appState.theme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("elevennarrate_theme", theme);

  if (DOM.themeToggle) {
    DOM.themeToggle.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} theme`);
  }
}

/* --------------------------------------------------------------------------
   Voice & Model Controls
   -------------------------------------------------------------------------- */
function initializeVoiceControls() {
  renderVoiceOptions();

  DOM.voiceSelect?.addEventListener("change", (e) => {
    const voiceId = e.target.value;
    selectVoice(voiceId);
  });

  // Select initial voice
  if (appState.availableVoices.length > 0) {
    selectVoice(appState.availableVoices[0].id);
  }
}

function renderVoiceOptions() {
  if (!DOM.voiceSelect) return;
  DOM.voiceSelect.innerHTML = "";

  appState.availableVoices.forEach((voice) => {
    const option = document.createElement("option");
    option.value = voice.id;
    option.textContent = `${voice.name} (${voice.category || "Voice"})`;
    DOM.voiceSelect.appendChild(option);
  });
}

function selectVoice(voiceId) {
  const found = appState.availableVoices.find((v) => v.id === voiceId);
  if (!found) return;

  appState.selectedVoiceId = found.id;
  appState.selectedVoiceName = found.name;

  const isLocal = found.id.startsWith("local-");
  appState.engine = isLocal ? "local" : "elevenlabs";

  if (DOM.engineBtnElevenLabs) {
    DOM.engineBtnElevenLabs.classList.toggle("active", !isLocal);
    DOM.engineBtnElevenLabs.setAttribute("aria-checked", String(!isLocal));
  }
  if (DOM.engineBtnLocal) {
    DOM.engineBtnLocal.classList.toggle("active", isLocal);
    DOM.engineBtnLocal.setAttribute("aria-checked", String(isLocal));
  }

  if (DOM.voiceSelect) DOM.voiceSelect.value = found.id;
  if (DOM.voiceCardName) DOM.voiceCardName.textContent = found.name;
  if (DOM.voiceCardCategory) DOM.voiceCardCategory.textContent = isLocal ? "Local System" : (found.category || "ElevenLabs");
  if (DOM.voiceCardDesc) DOM.voiceCardDesc.textContent = found.description || "Studio voice";
  if (DOM.voiceAvatarLetter) DOM.voiceAvatarLetter.textContent = found.name.charAt(0);

  updateEngineStatusBadge();
}

function initializeModelControls() {
  if (!DOM.modelSelect) return;
  DOM.modelSelect.innerHTML = "";

  appState.availableModels.forEach((model) => {
    const option = document.createElement("option");
    option.value = model.id;
    option.textContent = `${model.name} — ${model.badge}`;
    DOM.modelSelect.appendChild(option);
  });

  DOM.modelSelect.addEventListener("change", (e) => {
    selectModel(e.target.value);
  });

  if (appState.availableModels.length > 0) {
    selectModel(appState.availableModels[0].id);
  }
}

function selectModel(modelId) {
  const found = appState.availableModels.find((m) => m.id === modelId);
  if (!found) return;

  appState.selectedModelId = found.id;
  appState.selectedModelName = found.name;

  if (DOM.modelSelect) DOM.modelSelect.value = found.id;
  if (DOM.modelSpeedBadge) DOM.modelSpeedBadge.textContent = found.speed || "Standard";
  if (DOM.modelLanguagesText) DOM.modelLanguagesText.textContent = found.languages || "Multilingual";
  if (DOM.modelDescText) DOM.modelDescText.textContent = found.description || "";
}

/**
 * Attempt to dynamically load voices from ElevenLabs via serverless proxy.
 * If running in local Live Server (where backend proxy isn't listening) or if key is missing,
 * it safely retains the curated static voice catalog.
 */
async function fetchDynamicVoices() {
  const apiKey = getActiveApiKey();

  // 1. Try local proxy endpoint first
  const endpointsToTry = [
    APP_CONFIG.apiEndpoints.voices,
    `${APP_CONFIG.apiEndpoints.localServer}/.netlify/functions/voices`
  ];

  for (const url of endpointsToTry) {
    try {
      const response = await fetch(url, {
        headers: apiKey ? { "xi-api-key": apiKey } : {}
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.voices) && data.voices.length > 0) {
          appState.availableVoices = data.voices;
          renderVoiceOptions();
          if (appState.availableVoices.length > 0) {
            selectVoice(appState.availableVoices[0].id);
          }
          return;
        }
      }
    } catch (e) {}
  }

  // 2. If running standalone / Live Server without local server, query ElevenLabs directly
  if (apiKey) {
    try {
      const response = await fetch(APP_CONFIG.apiEndpoints.directVoices, {
        headers: {
          "xi-api-key": apiKey,
          "Accept": "application/json"
        }
      });
      if (response.ok) {
        const data = await response.json();
        const rawVoices = data.voices || [];
        const combined = [...VOICES.filter(v => v.id.startsWith("local-"))];
        for (const v of rawVoices) {
          combined.push({
            id: v.voice_id,
            name: v.name,
            category: v.category || "ElevenLabs",
            gender: v.labels?.gender || "Neutral",
            description: v.description || "ElevenLabs cloud voice",
            previewUrl: v.preview_url,
            engine: "elevenlabs"
          });
        }
        if (combined.length > 0) {
          appState.availableVoices = combined;
          renderVoiceOptions();
          selectVoice(appState.availableVoices[0].id);
        }
      }
    } catch (err) {}
  }
}

/* --------------------------------------------------------------------------
   Voice Settings Accordion & Sliders
   -------------------------------------------------------------------------- */
function initializeVoiceSettings() {
  // Accordion Toggle
  DOM.voiceSettingsToggle?.addEventListener("click", () => {
    const isExpanded = DOM.voiceSettingsToggle.getAttribute("aria-expanded") === "true";
    const nextState = !isExpanded;
    DOM.voiceSettingsToggle.setAttribute("aria-expanded", String(nextState));
    if (DOM.voiceSettingsPanel) {
      DOM.voiceSettingsPanel.hidden = !nextState;
    }
  });

  // Stability Slider
  DOM.settingStability?.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    appState.voiceSettings.stability = val;
    if (DOM.valStability) DOM.valStability.textContent = val.toFixed(2);
  });

  // Similarity Boost Slider
  DOM.settingSimilarity?.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    appState.voiceSettings.similarityBoost = val;
    if (DOM.valSimilarity) DOM.valSimilarity.textContent = val.toFixed(2);
  });

  // Style Exaggeration Slider
  DOM.settingStyle?.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    appState.voiceSettings.style = val;
    if (DOM.valStyle) DOM.valStyle.textContent = val.toFixed(2);
  });

  // Speaker Boost Toggle
  DOM.settingSpeakerBoost?.addEventListener("change", (e) => {
    appState.voiceSettings.useSpeakerBoost = e.target.checked;
  });

  // Reset Defaults Button
  DOM.resetSettingsBtn?.addEventListener("click", () => {
    restoreDefaultSettings();
    showNotification("info", "Settings Reset", "Voice settings restored to studio defaults.");
  });
}

function restoreDefaultSettings() {
  const defaults = APP_CONFIG.defaultVoiceSettings;
  appState.voiceSettings = { ...defaults };

  if (DOM.settingStability) DOM.settingStability.value = defaults.stability;
  if (DOM.valStability) DOM.valStability.textContent = defaults.stability.toFixed(2);

  if (DOM.settingSimilarity) DOM.settingSimilarity.value = defaults.similarityBoost;
  if (DOM.valSimilarity) DOM.valSimilarity.textContent = defaults.similarityBoost.toFixed(2);

  if (DOM.settingStyle) DOM.settingStyle.value = defaults.style;
  if (DOM.valStyle) DOM.valStyle.textContent = defaults.style.toFixed(2);

  if (DOM.settingSpeakerBoost) DOM.settingSpeakerBoost.checked = defaults.useSpeakerBoost;
}

/* --------------------------------------------------------------------------
   Text Editor & Metrics
   -------------------------------------------------------------------------- */
function initializeTextEditor() {
  DOM.scriptInput?.addEventListener("input", () => {
    appState.text = DOM.scriptInput.value;
    updateMetrics();
    saveDraft();
  });

  // Clear button with confirmation
  DOM.clearBtn?.addEventListener("click", () => {
    if (DOM.scriptInput && DOM.scriptInput.value.trim().length > 0) {
      showConfirmModal({
        title: "Clear narration script?",
        message: "Are you sure you want to clear your current text? This cannot be undone.",
        confirmText: "Clear script",
        onConfirm: () => {
          DOM.scriptInput.value = "";
          appState.text = "";
          updateMetrics();
          clearDraft();
          showNotification("info", "Script Cleared", "The narration editor has been emptied.");
        }
      });
    } else {
      DOM.scriptInput.value = "";
      appState.text = "";
      updateMetrics();
    }
  });

  // Generate button
  DOM.generateBtn?.addEventListener("click", () => {
    generateNarration();
  });

  // Quick example button
  DOM.quickExampleBtn?.addEventListener("click", () => {
    loadTemplate(TEMPLATES[0]);
  });
}

function updateMetrics() {
  const text = DOM.scriptInput ? DOM.scriptInput.value : "";
  const charLength = text.length;
  const max = APP_CONFIG.maxCharacters;
  const warn = APP_CONFIG.warningCharacters;

  // Character Count Display
  if (DOM.charCount) {
    DOM.charCount.textContent = `${charLength.toLocaleString()} / ${max.toLocaleString()} characters`;
    DOM.charCount.classList.remove("warning", "danger");
    if (charLength > max) {
      DOM.charCount.classList.add("danger");
    } else if (charLength > warn) {
      DOM.charCount.classList.add("warning");
    }
  }

  // Word Count and Estimated Duration
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  let durationEstimate = "—";

  if (words > 0) {
    // Average reading rate: 150 words per minute
    const totalSeconds = Math.round((words / APP_CONFIG.wordsPerMinute) * 60);
    if (totalSeconds < 60) {
      durationEstimate = `~${totalSeconds}s`;
    } else {
      const minutes = Math.floor(totalSeconds / 60);
      const remainingSeconds = totalSeconds % 60;
      durationEstimate = `~${minutes}m ${remainingSeconds}s`;
    }
  }

  if (DOM.metricsInfo) {
    DOM.metricsInfo.textContent = `${words.toLocaleString()} words · Estimated duration: ${durationEstimate}`;
  }

  // Validate limits on textarea wrapper
  if (DOM.textareaWrapper) {
    if (charLength > max) {
      DOM.textareaWrapper.classList.add("error-limit");
    } else {
      DOM.textareaWrapper.classList.remove("error-limit");
    }
  }

  // Manage Generate Button State
  if (DOM.generateBtn) {
    const isInvalid = charLength === 0 || charLength > max || appState.isGenerating;
    DOM.generateBtn.disabled = isInvalid;
  }
}

/* --------------------------------------------------------------------------
   Draft Persistence (Local Storage)
   -------------------------------------------------------------------------- */
function saveDraft() {
  try {
    if (DOM.scriptInput) {
      localStorage.setItem("elevennarrate_draft", DOM.scriptInput.value);
    }
  } catch (e) {}
}

function restoreDraft() {
  try {
    const saved = localStorage.getItem("elevennarrate_draft");
    if (saved && DOM.scriptInput) {
      DOM.scriptInput.value = saved;
      appState.text = saved;
      updateMetrics();
    }
  } catch (e) {}
}

function clearDraft() {
  try {
    localStorage.removeItem("elevennarrate_draft");
  } catch (e) {}
}

/* --------------------------------------------------------------------------
   Narration Generation API Flow
   -------------------------------------------------------------------------- */
async function generateNarration() {
  if (appState.isGenerating) return;

  const text = DOM.scriptInput ? DOM.scriptInput.value.trim() : "";

  // Client-side validations
  if (!text) {
    showNotification("warning", "Empty Script", "Enter some text before generating narration.");
    DOM.scriptInput?.focus();
    return;
  }

  if (text.length > APP_CONFIG.maxCharacters) {
    showNotification("error", "Script Too Long", `Your script exceeds the ${APP_CONFIG.maxCharacters.toLocaleString()} character limit. Please shorten it.`);
    return;
  }

  if (!appState.selectedVoiceId) {
    showNotification("warning", "No Voice Selected", "Please select a narration voice from the dropdown.");
    return;
  }

  if (!appState.selectedModelId) {
    showNotification("warning", "No Model Selected", "Please select an ElevenLabs narration model.");
    return;
  }

  setLoadingState(true);

  const apiKey = getActiveApiKey();
  const isLocal = appState.engine === "local" || appState.selectedVoiceId?.startsWith("local-");

  let requestUrl = "";
  let requestHeaders = {};
  let requestBody = "";

  if (isLocal) {
    // Local speech synthesis via local_server.py (Windows System.Speech)
    requestUrl = window.location.port === "8888" 
      ? APP_CONFIG.apiEndpoints.tts 
      : `${APP_CONFIG.apiEndpoints.localServer}/.netlify/functions/tts`;
    requestHeaders = {
      "Content-Type": "application/json"
    };
    requestBody = JSON.stringify({
      text: text,
      voiceId: appState.selectedVoiceId,
      voiceSettings: appState.voiceSettings,
      engine: "local"
    });
  } else {
    // ElevenLabs Cloud Generation
    if (window.location.port === "8888") {
      // Local development server proxy
      requestUrl = APP_CONFIG.apiEndpoints.tts;
      requestHeaders = {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
        "x-elevenlabs-api-key": apiKey
      };
      requestBody = JSON.stringify({
        text: text,
        voiceId: appState.selectedVoiceId,
        modelId: appState.selectedModelId || "eleven_multilingual_v2",
        voiceSettings: appState.voiceSettings,
        engine: "elevenlabs",
        apiKey: apiKey,
        autoFallback: false
      });
    } else {
      // Standalone Mode (Live Server port 5500 / file:// / static preview):
      // Direct call to official ElevenLabs REST API
      requestUrl = `${APP_CONFIG.apiEndpoints.directTtsBase}/${encodeURIComponent(appState.selectedVoiceId)}?output_format=mp3_44100_128`;
      requestHeaders = {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
      };
      requestBody = JSON.stringify({
        text: text,
        model_id: appState.selectedModelId || "eleven_multilingual_v2",
        voice_settings: {
          stability: appState.voiceSettings.stability,
          similarity_boost: appState.voiceSettings.similarityBoost,
          style: appState.voiceSettings.style,
          use_speaker_boost: appState.voiceSettings.useSpeakerBoost
        }
      });
    }
  }

  let response;
  try {
    console.log(`ElevenNarrate: Dispatching TTS request to ${requestUrl}`, {
      isLocal,
      hasApiKey: !!apiKey
    });

    response = await fetch(requestUrl, {
      method: "POST",
      headers: requestHeaders,
      body: requestBody
    });
  } catch (networkError) {
    console.error("Narration Network Request Failed:", networkError);
    const helpMsg = isLocal
      ? "Could not reach local synthesizer. Ensure `local_server.py` is running (run start-studio.bat)."
      : `Network error connecting to ${requestUrl}. Check your internet connection.`;
    showNotification("error", "Network / Connection Error", `${helpMsg} (${networkError.message || networkError})`);
    setLoadingState(false);
    return;
  }

  if (!response.ok) {
    let rawText = "";
    try {
      rawText = await response.text();
    } catch (readErr) {
      rawText = "";
    }

    console.error("Narration Generation Failed:", {
      status: response.status,
      statusText: response.statusText,
      url: requestUrl,
      rawBody: rawText
    });

    let errorMessage = "";
    let errorCode = "";

    try {
      const parsed = JSON.parse(rawText);
      if (typeof parsed.detail === "string") {
        errorMessage = parsed.detail;
      } else if (parsed.detail && typeof parsed.detail.message === "string") {
        errorMessage = parsed.detail.message;
        errorCode = parsed.detail.status || "";
      } else if (parsed.error) {
        errorMessage = typeof parsed.error === "string" ? parsed.error : (parsed.error.message || JSON.stringify(parsed.error));
        errorCode = parsed.code || "";
      } else if (parsed.message) {
        errorMessage = parsed.message;
      }
      if (!errorCode && parsed.code) errorCode = parsed.code;
    } catch (parseErr) {
      // Non-JSON response (e.g. 404 HTML from Live Server, 502 Bad Gateway)
      errorMessage = rawText.replace(/<[^>]*>?/gm, "").trim().slice(0, 300) || response.statusText;
    }

    if (!errorMessage) {
      errorMessage = `HTTP ${response.status}: ${response.statusText || "Request failed"}`;
    }

    const displayMsg = `[HTTP ${response.status}] ${errorMessage}`;

    // ElevenLabs Free Tier Anti-Abuse Flagging
    const isUnusualActivity = (
      errorCode === "ELEVENLABS_UNUSUAL_ACTIVITY" ||
      errorCode === "detected_unusual_activity" ||
      errorMessage.toLowerCase().includes("unusual activity")
    );

    if (isUnusualActivity && DOM.fallbackModal) {
      if (DOM.fallbackModalMessage) {
        DOM.fallbackModalMessage.textContent = displayMsg;
      }
      DOM.fallbackModal.hidden = false;
      showNotification("warning", `ElevenLabs Restriction (${response.status})`, errorMessage);
      setLoadingState(false);
      return;
    }

    let title = `Generation Failed (${response.status})`;
    if (response.status === 401) {
      title = "Authentication Error (401)";
    } else if (response.status === 402 || response.status === 429) {
      title = "Quota Exceeded (402/429)";
    } else if (response.status === 404) {
      title = "Endpoint / Voice Not Found (404)";
    }

    showNotification("error", title, displayMsg);
    announceLive(`Error: ${displayMsg}`);
    setLoadingState(false);
    return;
  }

  // Success: receive binary audio stream and create Blob
  const audioBlob = await response.blob();
  if (audioBlob.size === 0) {
    showNotification("error", "Empty Audio Stream", "The narration service returned an empty audio response.");
    setLoadingState(false);
    return;
  }

  const engineUsed = response.headers.get("X-Audio-Engine") || (isLocal ? "local-system" : "elevenlabs");
  createAudioFromResponse(audioBlob, engineUsed);

  if (engineUsed === "local-fallback") {
    showNotification("warning", "Local Fallback Used", "ElevenLabs Free Tier access was restricted. Audio generated via Local Windows Synthesizer.");
  } else if (engineUsed === "local-system") {
    showNotification("success", "Local Speech Ready", "Narration generated instantly using Windows System.Speech.");
  } else {
    showNotification("success", "Narration Ready", "Your speech audio was generated successfully with ElevenLabs.");
  }

  announceLive("Your narration is ready. Press Play to listen.");
  setLoadingState(false);
}

function setLoadingState(isLoading) {
  appState.isGenerating = true ? isLoading : false;

  if (DOM.generateBtn) {
    DOM.generateBtn.disabled = isLoading;
  }

  if (DOM.generateBtnText) {
    DOM.generateBtnText.textContent = isLoading ? "Generating narration…" : "Generate narration";
  }

  if (DOM.generateIconIdle && DOM.generateIconSpinner) {
    DOM.generateIconIdle.style.display = isLoading ? "none" : "inline-block";
    DOM.generateIconSpinner.style.display = isLoading ? "inline-block" : "none";
  }

  if (isLoading) {
    announceLive("Creating your audio. This may take a few moments.");
  }
}

/* --------------------------------------------------------------------------
   Audio Engine & Player Lifecycle
   -------------------------------------------------------------------------- */
function initializeAudioPlayer() {
  const audio = DOM.nativeAudio;
  if (!audio) return;

  // Metadata loaded
  audio.addEventListener("loadedmetadata", () => {
    const duration = audio.duration;
    if (DOM.totalDuration && !isNaN(duration)) {
      DOM.totalDuration.textContent = formatTime(duration);
    }
  });

  // Time update
  audio.addEventListener("timeupdate", () => {
    const current = audio.currentTime;
    const duration = audio.duration;

    if (DOM.currentTime) {
      DOM.currentTime.textContent = formatTime(current);
    }

    if (DOM.seekBar && DOM.timelineFill && !isNaN(duration) && duration > 0) {
      const percentage = (current / duration) * 100;
      DOM.seekBar.value = percentage;
      DOM.timelineFill.style.width = `${percentage}%`;
    }
  });

  // Play event
  audio.addEventListener("play", () => {
    appState.playbackStatus = "playing";
    updatePlayPauseIcons(true);
    DOM.waveformVisualizer?.classList.add("playing");
  });

  // Pause event
  audio.addEventListener("pause", () => {
    appState.playbackStatus = "paused";
    updatePlayPauseIcons(false);
    DOM.waveformVisualizer?.classList.remove("playing");
  });

  // Ended event
  audio.addEventListener("ended", () => {
    appState.playbackStatus = "idle";
    updatePlayPauseIcons(false);
    DOM.waveformVisualizer?.classList.remove("playing");
    audio.currentTime = 0;
    if (DOM.timelineFill) DOM.timelineFill.style.width = "0%";
    if (DOM.seekBar) DOM.seekBar.value = "0";
    if (DOM.currentTime) DOM.currentTime.textContent = "0:00";
  });

  // Playback error
  audio.addEventListener("error", () => {
    showNotification("error", "Playback Error", "Browser encountered an issue decoding the audio stream.");
  });

  // Play/Pause button
  DOM.playPauseBtn?.addEventListener("click", () => {
    togglePlayPause();
  });

  // Stop button
  DOM.stopBtn?.addEventListener("click", () => {
    stopAudio();
  });

  // Replay button
  DOM.replayBtn?.addEventListener("click", () => {
    replayAudio();
  });

  // Seek bar
  DOM.seekBar?.addEventListener("input", (e) => {
    const seekPercentage = parseFloat(e.target.value);
    if (DOM.timelineFill) DOM.timelineFill.style.width = `${seekPercentage}%`;
    if (!isNaN(audio.duration) && audio.duration > 0) {
      const seekTime = (seekPercentage / 100) * audio.duration;
      if (DOM.currentTime) DOM.currentTime.textContent = formatTime(seekTime);
    }
  });

  DOM.seekBar?.addEventListener("change", (e) => {
    const seekPercentage = parseFloat(e.target.value);
    if (!isNaN(audio.duration) && audio.duration > 0) {
      audio.currentTime = (seekPercentage / 100) * audio.duration;
    }
  });

  // Volume & Mute
  DOM.volumeSlider?.addEventListener("input", (e) => {
    const vol = parseFloat(e.target.value);
    audio.volume = vol;
    audio.muted = (vol === 0);
    updateVolumeIcons(vol === 0);
  });

  DOM.muteBtn?.addEventListener("click", () => {
    audio.muted = !audio.muted;
    if (DOM.volumeSlider) {
      DOM.volumeSlider.value = audio.muted ? 0 : audio.volume || 1;
    }
    updateVolumeIcons(audio.muted);
  });

  // Playback Speed
  DOM.speedSelect?.addEventListener("change", (e) => {
    const speed = parseFloat(e.target.value);
    audio.playbackRate = speed;
  });

  // Download Action
  DOM.downloadBtn?.addEventListener("click", () => {
    downloadAudio();
  });
}

function createAudioFromResponse(audioBlob, engineUsed = "elevenlabs") {
  cleanupPreviousAudioUrl();

  appState.currentAudioBlob = audioBlob;
  appState.currentAudioUrl = URL.createObjectURL(audioBlob);

  const timestamp = new Date();
  const dateStr = timestamp.toISOString().split("T")[0];
  const safeVoiceName = (appState.selectedVoiceName || "Voice").replace(/[^a-zA-Z0-9_-]/g, "");
  const isWav = audioBlob.type.includes("wav") || engineUsed === "local-system" || engineUsed === "local-fallback";
  const ext = isWav ? "wav" : "mp3";
  appState.currentAudioFileName = `eleven-narrate-${dateStr}-${safeVoiceName}.${ext}`;

  // Update DOM elements for player
  if (DOM.nativeAudio) {
    DOM.nativeAudio.src = appState.currentAudioUrl;
    DOM.nativeAudio.load();
  }

  if (DOM.playerVoiceTag) DOM.playerVoiceTag.textContent = appState.selectedVoiceName;
  if (DOM.playerModelTag) DOM.playerModelTag.textContent = isWav ? "Local Windows Voice" : appState.selectedModelName;
  
  const formatBadge = document.querySelector(".meta-format");
  if (formatBadge) {
    formatBadge.textContent = isWav ? "WAV Audio" : "MP3 44.1kHz";
  }

  if (DOM.playerTimestamp) {
    const timeFormatted = timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    DOM.playerTimestamp.textContent = `Generated today at ${timeFormatted}`;
  }

  // Switch from placeholder to active player
  if (DOM.audioPlaceholder) DOM.audioPlaceholder.hidden = true;
  if (DOM.audioPlayerCard) {
    DOM.audioPlayerCard.hidden = false;
    DOM.audioPlayerCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // Reset seek and controls
  if (DOM.timelineFill) DOM.timelineFill.style.width = "0%";
  if (DOM.seekBar) DOM.seekBar.value = "0";
  if (DOM.currentTime) DOM.currentTime.textContent = "0:00";
  updatePlayPauseIcons(false);
}

function cleanupPreviousAudioUrl() {
  if (appState.currentAudioUrl) {
    URL.revokeObjectURL(appState.currentAudioUrl);
    appState.currentAudioUrl = null;
  }
}

function togglePlayPause() {
  const audio = DOM.nativeAudio;
  if (!audio || !audio.src) return;

  if (audio.paused) {
    audio.play().catch(() => {
      showNotification("info", "Autoplay Blocked", "Press Play to begin audio playback.");
    });
  } else {
    audio.pause();
  }
}

function stopAudio() {
  const audio = DOM.nativeAudio;
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  if (DOM.timelineFill) DOM.timelineFill.style.width = "0%";
  if (DOM.seekBar) DOM.seekBar.value = "0";
  if (DOM.currentTime) DOM.currentTime.textContent = "0:00";
  updatePlayPauseIcons(false);
}

function replayAudio() {
  const audio = DOM.nativeAudio;
  if (!audio || !audio.src) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function updatePlayPauseIcons(isPlaying) {
  if (DOM.playIcon && DOM.pauseIcon) {
    DOM.playIcon.style.display = isPlaying ? "none" : "block";
    DOM.pauseIcon.style.display = isPlaying ? "block" : "none";
  }
  if (DOM.playPauseBtn) {
    DOM.playPauseBtn.setAttribute("aria-label", isPlaying ? "Pause narration" : "Play narration");
  }
}

function updateVolumeIcons(isMuted) {
  if (DOM.volHighIcon && DOM.volMuteIcon) {
    DOM.volHighIcon.style.display = isMuted ? "none" : "block";
    DOM.volMuteIcon.style.display = isMuted ? "block" : "none";
  }
  if (DOM.muteBtn) {
    DOM.muteBtn.setAttribute("aria-label", isMuted ? "Unmute audio" : "Mute audio");
  }
}

function downloadAudio() {
  if (!appState.currentAudioUrl) {
    showNotification("warning", "No Audio Ready", "Generate narration audio before downloading.");
    return;
  }

  const downloadAnchor = document.createElement("a");
  downloadAnchor.href = appState.currentAudioUrl;
  downloadAnchor.download = appState.currentAudioFileName || "eleven-narrate.mp3";
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);

  showNotification("success", "Download Started", `Downloading ${downloadAnchor.download}`);
}

function formatTime(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "0:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

/* --------------------------------------------------------------------------
   Narration Templates Section
   -------------------------------------------------------------------------- */
function initializeTemplates() {
  if (!DOM.templatesGrid) return;
  DOM.templatesGrid.innerHTML = "";

  TEMPLATES.forEach((template) => {
    const card = document.createElement("div");
    card.className = "template-card";
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Use template: ${template.title}`);

    card.innerHTML = `
      <div class="template-card-top">
        <div class="template-meta-row">
          <span class="template-title">${escapeHtml(template.title)}</span>
          <span class="badge badge-subtle">${escapeHtml(template.badge)}</span>
        </div>
        <p class="template-desc">${escapeHtml(template.description)}</p>
        <blockquote class="template-quote">"${escapeHtml(template.text)}"</blockquote>
      </div>
      <div class="template-action-row">
        <span class="btn btn-ghost btn-sm">Use template &rarr;</span>
      </div>
    `;

    const applyHandler = () => loadTemplate(template);
    card.addEventListener("click", applyHandler);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        applyHandler();
      }
    });

    DOM.templatesGrid.appendChild(card);
  });
}

function loadTemplate(template) {
  const currentText = DOM.scriptInput ? DOM.scriptInput.value.trim() : "";

  if (currentText.length > 0 && currentText !== template.text.trim()) {
    showConfirmModal({
      title: `Load "${template.title}" template?`,
      message: "This will replace the current script in your editor. Do you want to proceed?",
      confirmText: "Replace script",
      onConfirm: () => {
        applyTemplateContent(template);
      }
    });
  } else {
    applyTemplateContent(template);
  }
}

function applyTemplateContent(template) {
  if (DOM.scriptInput) {
    DOM.scriptInput.value = template.text;
    appState.text = template.text;
    updateMetrics();
    saveDraft();
    DOM.scriptInput.focus();
  }

  // Suggest voice if matching voice exists in loaded voices
  if (template.suggestedVoiceId) {
    const voiceExists = appState.availableVoices.some((v) => v.id === template.suggestedVoiceId);
    if (voiceExists) {
      selectVoice(template.suggestedVoiceId);
    }
  }

  showNotification("info", "Template Loaded", `Loaded "${template.title}". Customize the text to fit your story.`);
}

/* --------------------------------------------------------------------------
   Accessible Modal System
   -------------------------------------------------------------------------- */
let activeConfirmCallback = null;
let lastFocusedElement = null;

function initializeModals() {
  // Cancel / Backdrop click
  DOM.modalCancelBtn?.addEventListener("click", closeConfirmModal);
  DOM.confirmModal?.addEventListener("click", (e) => {
    if (e.target === DOM.confirmModal) closeConfirmModal();
  });

  // Confirm button
  DOM.modalConfirmBtn?.addEventListener("click", () => {
    if (typeof activeConfirmCallback === "function") {
      activeConfirmCallback();
    }
    closeConfirmModal();
  });

  // Shortcuts modal
  DOM.shortcutsBtn?.addEventListener("click", openShortcutsModal);
  DOM.shortcutsCloseBtn?.addEventListener("click", closeShortcutsModal);
  DOM.shortcutsDismissBtn?.addEventListener("click", closeShortcutsModal);
  DOM.shortcutsModal?.addEventListener("click", (e) => {
    if (e.target === DOM.shortcutsModal) closeShortcutsModal();
  });
}

function showConfirmModal({ title, message, confirmText, onConfirm }) {
  lastFocusedElement = document.activeElement;
  activeConfirmCallback = onConfirm;

  if (DOM.modalTitle) DOM.modalTitle.textContent = title || "Confirm Action";
  if (DOM.modalMessage) DOM.modalMessage.textContent = message || "Are you sure?";
  if (DOM.modalConfirmBtn) DOM.modalConfirmBtn.textContent = confirmText || "Confirm";

  if (DOM.confirmModal) {
    DOM.confirmModal.hidden = false;
    DOM.modalCancelBtn?.focus();
  }
}

function closeConfirmModal() {
  if (DOM.confirmModal) {
    DOM.confirmModal.hidden = true;
  }
  activeConfirmCallback = null;
  if (lastFocusedElement) {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }
}

function openShortcutsModal() {
  lastFocusedElement = document.activeElement;
  if (DOM.shortcutsModal) {
    DOM.shortcutsModal.hidden = false;
    DOM.shortcutsDismissBtn?.focus();
  }
}

function closeShortcutsModal() {
  if (DOM.shortcutsModal) {
    DOM.shortcutsModal.hidden = true;
  }
  if (lastFocusedElement) {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }
}

/* --------------------------------------------------------------------------
   Keyboard Shortcuts
   -------------------------------------------------------------------------- */
function initializeKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Escape closes modals
    if (e.key === "Escape") {
      if (DOM.confirmModal && !DOM.confirmModal.hidden) {
        closeConfirmModal();
        return;
      }
      if (DOM.shortcutsModal && !DOM.shortcutsModal.hidden) {
        closeShortcutsModal();
        return;
      }
    }

    // Ctrl + Enter or Cmd + Enter to generate
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      generateNarration();
      return;
    }

    // Space to toggle play/pause when focus is NOT inside textarea or input
    const isTyping = ["TEXTAREA", "INPUT", "SELECT"].includes(document.activeElement?.tagName);
    if (!isTyping && e.key === " " && appState.currentAudioUrl) {
      e.preventDefault();
      togglePlayPause();
      return;
    }

    // M key to toggle mute when not typing
    if (!isTyping && (e.key === "m" || e.key === "M") && appState.currentAudioUrl) {
      e.preventDefault();
      if (DOM.muteBtn) DOM.muteBtn.click();
      return;
    }
  });
}

/* --------------------------------------------------------------------------
   Toast Notifications System
   -------------------------------------------------------------------------- */
function showNotification(type = "info", title = "", message = "") {
  if (!DOM.toastContainer) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", type === "error" ? "alert" : "status");

  let iconSvg = "";
  if (type === "success") {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (type === "error") {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else if (type === "warning") {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
  } else {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <div class="toast-body">
      <strong class="toast-title">${escapeHtml(title)}</strong>
      <span class="toast-msg">${escapeHtml(message)}</span>
    </div>
    <button class="toast-close" type="button" aria-label="Dismiss notification">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  `;

  const dismissToast = () => {
    toast.classList.add("hiding");
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 200);
  };

  toast.querySelector(".toast-close")?.addEventListener("click", dismissToast);

  // Auto-dismiss after 6 seconds
  const timer = setTimeout(dismissToast, 6000);
  toast.addEventListener("mouseenter", () => clearTimeout(timer));

  DOM.toastContainer.appendChild(toast);
}

/* --------------------------------------------------------------------------
   Accessibility & Utilities
   -------------------------------------------------------------------------- */
function announceLive(message) {
  if (DOM.liveAnnouncer) {
    DOM.liveAnnouncer.textContent = message;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Global cleanup when unloading
window.addEventListener("beforeunload", () => {
  cleanupPreviousAudioUrl();
});
