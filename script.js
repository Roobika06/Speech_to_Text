/**
 * VoiceFlow TTS - Modern Text-to-Speech Application
 * Uses Web Speech API (SpeechSynthesis)
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Sample Texts Dataset
  const SAMPLE_TEXTS = {
    en: "Text-to-speech technology converts written text into natural spoken words. You can adjust the speaking rate, pitch, and volume to craft the perfect voice experience.",
    ta: "உரையை பேச்சாக மாற்றும் தொழில்நுட்பம் மூலம் எந்தவொரு உரையையும் நீங்கள் தெளிவாகக் கேட்கலாம். குரலின் வேகம், சுருதி மற்றும் ஒலி அளவை உங்கள் விருப்பப்படி மாற்றிக் கொள்ளலாம்.",
    hi: "टेक्स्ट टू स्पीच तकनीक लिखित पाठ को प्राकृतिक भाषा में बोलकर सुनाती है। आप आवाज की गति, पिच और वॉल्यूम को अपनी पसंद के अनुसार बदल सकते हैं।",
    es: "La tecnología de texto a voz convierte el texto escrito en palabras habladas de forma natural. Puedes ajustar la velocidad, el tono y el volumen según tus preferencias.",
    fr: "La technologie de synthèse vocale transforme le texte écrit en parole naturelle. Vous pouvez ajuster la vitesse, la hauteur et le volume selon vos préférences.",
    de: "Die Text-to-Speech-Technologie wandelt geschriebenen Text in gesprochene Sprache um. Sie können Sprechgeschwindigkeit, Tonhöhe und Lautstärke individuell anpassen.",
    ja: "テキスト読み上げ技術は、書かれたテキストを自然な音声に変換します。話す速度、ピッチ、音量を自由に調整できます。"
  };

  // 2. DOM Elements
  const statusBadge = document.getElementById("statusBadge");
  const statusText = document.getElementById("statusText");
  
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const sunIcon = document.getElementById("sunIcon");
  const moonIcon = document.getElementById("moonIcon");

  const notificationBanner = document.getElementById("notificationBanner");
  const notificationText = document.getElementById("notificationText");
  const closeBannerBtn = document.getElementById("closeBannerBtn");

  const textInput = document.getElementById("textInput");
  const charCountEl = document.getElementById("charCount");
  const wordCountEl = document.getElementById("wordCount");
  const estTimeEl = document.getElementById("estTime");

  const sampleTextSelect = document.getElementById("sampleTextSelect");
  const pasteBtn = document.getElementById("pasteBtn");
  const copyBtn = document.getElementById("copyBtn");
  const clearBtn = document.getElementById("clearBtn");

  const spokenHighlightBox = document.getElementById("spokenHighlightBox");
  const highlightedContent = document.getElementById("highlightedContent");

  const fontDecrease = document.getElementById("fontDecrease");
  const fontIncrease = document.getElementById("fontIncrease");
  const fontSizeVal = document.getElementById("fontSizeVal");

  const speakBtn = document.getElementById("speakBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const resumeBtn = document.getElementById("resumeBtn");
  const stopBtn = document.getElementById("stopBtn");
  const audioWave = document.getElementById("audioWave");

  const languageFilter = document.getElementById("languageFilter");
  const voiceSelect = document.getElementById("voiceSelect");
  const activeVoiceName = document.getElementById("activeVoiceName");
  const activeVoiceLang = document.getElementById("activeVoiceLang");

  const rateSlider = document.getElementById("rateSlider");
  const rateValue = document.getElementById("rateValue");
  const pitchSlider = document.getElementById("pitchSlider");
  const pitchValue = document.getElementById("pitchValue");
  const volumeSlider = document.getElementById("volumeSlider");
  const volumeValue = document.getElementById("volumeValue");
  const volumeIcon = document.getElementById("volumeIcon");
  const resetControlsBtn = document.getElementById("resetControlsBtn");

  const toastContainer = document.getElementById("toastContainer");

  // 3. Application State Variables
  let synth = window.speechSynthesis;
  let currentUtterance = null;
  let allVoices = [];
  let currentFontSize = 18; // Default 18px
  let isSpeaking = false;
  let isPaused = false;

  // 4. Initial Feature Support Check
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    showBanner("Web Speech API (SpeechSynthesis) is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.", "error");
    speakBtn.disabled = true;
    pauseBtn.disabled = true;
    resumeBtn.disabled = true;
    stopBtn.disabled = true;
    setStatus("Unsupported", "stopped");
  } else {
    initSpeechSynthesis();
  }

  // 5. Initialize Core Listeners
  setupEventListeners();

  // --------------------------------------------------------------------------
  // Core Functions
  // --------------------------------------------------------------------------

  function initSpeechSynthesis() {
    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
  }

  function loadVoices() {
    if (!synth) return;
    allVoices = synth.getVoices();

    if (allVoices.length === 0) {
      // In case voices take a moment to load
      setTimeout(() => {
        allVoices = synth.getVoices();
        populateVoiceDropdown();
      }, 300);
      return;
    }

    populateVoiceDropdown();
  }

  function populateVoiceDropdown() {
    voiceSelect.innerHTML = "";

    const selectedLangPrefix = languageFilter.value;
    let filteredVoices = allVoices;

    if (selectedLangPrefix !== "all") {
      filteredVoices = allVoices.filter(v => v.lang.toLowerCase().startsWith(selectedLangPrefix.toLowerCase()));
    }

    if (filteredVoices.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No voices found for selected language";
      voiceSelect.appendChild(option);
      activeVoiceName.textContent = "None Selected";
      activeVoiceLang.textContent = "Select a different language filter";
      return;
    }

    filteredVoices.forEach((voice) => {
      const option = document.createElement("option");
      const globalIndex = allVoices.indexOf(voice);
      option.value = globalIndex;
      
      const isDefault = voice.default ? " (Default)" : "";
      option.textContent = `${voice.name} - ${voice.lang}${isDefault}`;
      voiceSelect.appendChild(option);
    });

    // Auto-select preferred/default voice
    if (voiceSelect.options.length > 0) {
      voiceSelect.selectedIndex = 0;
      updateActiveVoiceDisplay();
    }
  }

  function updateActiveVoiceDisplay() {
    const voiceIndex = voiceSelect.value;
    if (voiceIndex !== "" && allVoices[voiceIndex]) {
      const voice = allVoices[voiceIndex];
      activeVoiceName.textContent = voice.name;
      activeVoiceLang.textContent = `Language: ${voice.lang} ${voice.default ? '(System Default)' : ''}`;
    } else {
      activeVoiceName.textContent = "System Default Voice";
      activeVoiceLang.textContent = "Language: Auto";
    }
  }

  function speakText() {
    if (!synth) return;

    // Get selected text or full text
    const selectedText = window.getSelection().toString().trim();
    const fullText = textInput.value.trim();
    const textToSpeak = selectedText || fullText;

    if (!textToSpeak) {
      showToast("Please enter or paste text to convert to speech.", "info");
      textInput.focus();
      return;
    }

    // Stop any ongoing speech
    stopSpeech();

    currentUtterance = new SpeechSynthesisUtterance(textToSpeak);

    // Assign Voice
    const voiceIndex = voiceSelect.value;
    if (voiceIndex !== "" && allVoices[voiceIndex]) {
      currentUtterance.voice = allVoices[voiceIndex];
    }

    // Assign Rate, Pitch, Volume
    currentUtterance.rate = parseFloat(rateSlider.value) || 1.0;
    currentUtterance.pitch = parseFloat(pitchSlider.value) || 1.0;
    currentUtterance.volume = parseFloat(volumeSlider.value) || 1.0;

    // Word Boundary Highlighting Setup
    setupWordHighlighting(textToSpeak);

    // Event Listeners
    currentUtterance.onstart = () => {
      isSpeaking = true;
      isPaused = false;
      setStatus("Speaking...", "speaking");
      speakBtn.disabled = true;
      pauseBtn.disabled = false;
      pauseBtn.classList.remove("hidden");
      resumeBtn.classList.add("hidden");
      stopBtn.disabled = false;
      audioWave.classList.add("speaking-wave");
      spokenHighlightBox.classList.remove("hidden");
    };

    currentUtterance.onpause = () => {
      isSpeaking = true;
      isPaused = true;
      setStatus("Paused", "paused");
      pauseBtn.classList.add("hidden");
      resumeBtn.classList.remove("hidden");
      resumeBtn.disabled = false;
      audioWave.classList.remove("speaking-wave");
    };

    currentUtterance.onresume = () => {
      isSpeaking = true;
      isPaused = false;
      setStatus("Speaking...", "speaking");
      resumeBtn.classList.add("hidden");
      pauseBtn.classList.remove("hidden");
      pauseBtn.disabled = false;
      audioWave.classList.add("speaking-wave");
    };

    currentUtterance.onend = () => {
      resetSpeechUI("Ready");
      showToast("Finished reading text.", "success");
    };

    currentUtterance.onerror = (event) => {
      console.warn("TTS Error event:", event.error);
      if (event.error !== "canceled" && event.error !== "interrupted") {
        showToast(`Speech Synthesis error: ${event.error}`, "error");
      }
      resetSpeechUI("Ready");
    };

    // Word boundary event for live text highlighting
    currentUtterance.onboundary = (e) => {
      if (e.name === "word") {
        highlightWordAtIndex(textToSpeak, e.charIndex, e.charLength || 6);
      }
    };

    try {
      synth.speak(currentUtterance);
    } catch (err) {
      console.error("Speak error:", err);
      showToast("Unable to start speech synthesis.", "error");
      resetSpeechUI("Error");
    }
  }

  function pauseSpeech() {
    if (synth && synth.speaking && !synth.paused) {
      synth.pause();
      isPaused = true;
      setStatus("Paused", "paused");
      pauseBtn.classList.add("hidden");
      resumeBtn.classList.remove("hidden");
      resumeBtn.disabled = false;
      audioWave.classList.remove("speaking-wave");
      showToast("Speech paused.", "info");
    }
  }

  function resumeSpeech() {
    if (synth && synth.paused) {
      synth.resume();
      isPaused = false;
      setStatus("Speaking...", "speaking");
      resumeBtn.classList.add("hidden");
      pauseBtn.classList.remove("hidden");
      pauseBtn.disabled = false;
      audioWave.classList.add("speaking-wave");
      showToast("Resuming speech...", "info");
    } else if (!synth.speaking) {
      speakText();
    }
  }

  function stopSpeech() {
    if (synth) {
      synth.cancel();
    }
    resetSpeechUI("Stopped");
  }

  function resetSpeechUI(stateName = "Ready") {
    isSpeaking = false;
    isPaused = false;
    currentUtterance = null;

    setStatus(stateName, stateName.toLowerCase());
    speakBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.classList.remove("hidden");
    resumeBtn.classList.add("hidden");
    resumeBtn.disabled = true;
    stopBtn.disabled = true;
    audioWave.classList.remove("speaking-wave");
    spokenHighlightBox.classList.add("hidden");

    if (stateName === "Stopped") {
      setTimeout(() => {
        if (!isSpeaking) setStatus("Ready", "ready");
      }, 1500);
    }
  }

  function setupWordHighlighting(text) {
    highlightedContent.innerHTML = escapeHtml(text);
  }

  function highlightWordAtIndex(fullText, charIndex, charLength) {
    if (charIndex < 0 || charIndex >= fullText.length) return;

    // Extract word
    let length = charLength;
    if (!length) {
      const match = fullText.slice(charIndex).match(/^\s*(\S+)/);
      length = match ? match[1].length : 5;
    }

    const before = escapeHtml(fullText.slice(0, charIndex));
    const word = escapeHtml(fullText.slice(charIndex, charIndex + length));
    const after = escapeHtml(fullText.slice(charIndex + length));

    highlightedContent.innerHTML = `${before}<mark class="spoken-word-active">${word}</mark>${after}`;

    // Auto-scroll the highlight box to keep active word in view
    const activeMark = highlightedContent.querySelector(".spoken-word-active");
    if (activeMark) {
      activeMark.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function updateTextStats() {
    const text = textInput.value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;

    // Calculate estimated speaking time based on current rate (Avg 150 words/min at 1.0x rate)
    const rate = parseFloat(rateSlider.value) || 1.0;
    const wordsPerMinute = 150 * rate;
    const estSeconds = Math.round((words / wordsPerMinute) * 60);

    charCountEl.textContent = chars.toLocaleString();
    wordCountEl.textContent = words.toLocaleString();

    if (estSeconds < 60) {
      estTimeEl.textContent = `${estSeconds}s`;
    } else {
      const mins = Math.floor(estSeconds / 60);
      const secs = estSeconds % 60;
      estTimeEl.textContent = `${mins}m ${secs}s`;
    }
  }

  function setStatus(text, stateClass) {
    statusText.textContent = text;
    statusBadge.className = `status-badge status-${stateClass}`;
  }

  function showBanner(message, type = "info") {
    notificationText.textContent = message;
    notificationBanner.classList.remove("hidden");
  }

  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    } else {
      iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // --------------------------------------------------------------------------
  // Event Listeners Setup
  // --------------------------------------------------------------------------

  function setupEventListeners() {
    // Playback Control Buttons
    speakBtn.addEventListener("click", () => {
      if (isPaused) {
        resumeSpeech();
      } else {
        speakText();
      }
    });

    pauseBtn.addEventListener("click", pauseSpeech);
    resumeBtn.addEventListener("click", resumeSpeech);
    stopBtn.addEventListener("click", stopSpeech);

    // Textarea Live Typing
    textInput.addEventListener("input", () => {
      updateTextStats();
    });

    // Language Filter Dropdown Change
    languageFilter.addEventListener("change", () => {
      populateVoiceDropdown();
      const selectedText = languageFilter.options[languageFilter.selectedIndex].text;
      showToast(`Filter set to ${selectedText}`, "info");

      // Auto-switch sample text if empty or matching sample language
      const langKey = languageFilter.value;
      if (SAMPLE_TEXTS[langKey] && (!textInput.value.trim() || Object.values(SAMPLE_TEXTS).includes(textInput.value.trim()))) {
        textInput.value = SAMPLE_TEXTS[langKey];
        updateTextStats();
      }
    });

    // Voice Selector Change
    voiceSelect.addEventListener("change", () => {
      updateActiveVoiceDisplay();
      if (isSpeaking) {
        // Restart speech with new voice if currently playing
        speakText();
      }
    });

    // Sliders Event Listeners
    rateSlider.addEventListener("input", () => {
      rateValue.textContent = `${parseFloat(rateSlider.value).toFixed(1)}x`;
      updateTextStats();
      if (isSpeaking && !isPaused && synth) {
        // Apply rate change dynamically if possible or restart
        speakText();
      }
    });

    pitchSlider.addEventListener("input", () => {
      pitchValue.textContent = parseFloat(pitchSlider.value).toFixed(1);
      if (isSpeaking && !isPaused && synth) {
        speakText();
      }
    });

    volumeSlider.addEventListener("input", () => {
      const vol = parseFloat(volumeSlider.value);
      volumeValue.textContent = `${Math.round(vol * 100)}%`;

      if (vol === 0) {
        volumeIcon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>`;
      } else {
        volumeIcon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>`;
      }

      if (currentUtterance) {
        currentUtterance.volume = vol;
      }
    });

    // Reset Controls Button
    resetControlsBtn.addEventListener("click", () => {
      rateSlider.value = "1.0";
      rateValue.textContent = "1.0x";

      pitchSlider.value = "1.0";
      pitchValue.textContent = "1.0";

      volumeSlider.value = "1.0";
      volumeValue.textContent = "100%";

      volumeIcon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>`;
      updateTextStats();
      showToast("Reset audio settings to defaults.", "info");

      if (isSpeaking) {
        speakText();
      }
    });

    // Sample Text Dropdown
    sampleTextSelect.addEventListener("change", () => {
      const selectedKey = sampleTextSelect.value;
      if (SAMPLE_TEXTS[selectedKey]) {
        if (isSpeaking) stopSpeech();

        textInput.value = SAMPLE_TEXTS[selectedKey];
        updateTextStats();

        // Update language filter if applicable
        if (selectedKey !== "en") {
          languageFilter.value = selectedKey;
          populateVoiceDropdown();
        }

        showToast(`Loaded ${sampleTextSelect.options[sampleTextSelect.selectedIndex].text}!`, "success");
        sampleTextSelect.selectedIndex = 0;
      }
    });

    // Paste Button
    pasteBtn.addEventListener("click", async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          if (text) {
            textInput.value += (textInput.value ? "\n\n" : "") + text;
            updateTextStats();
            showToast("Pasted text from clipboard!", "success");
            return;
          }
        }
        showToast("Clipboard read permission unavailable or empty.", "info");
      } catch (err) {
        console.warn("Paste error:", err);
        showToast("Unable to access clipboard directly. Please use Ctrl+V or Cmd+V.", "info");
      }
    });

    // Copy Button
    copyBtn.addEventListener("click", () => {
      const text = textInput.value.trim();
      if (!text) {
        showToast("Text box is empty. Nothing to copy.", "info");
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showToast("Text copied to clipboard!", "success");
        }).catch(() => fallbackCopy(text));
      } else {
        fallbackCopy(text);
      }
    });

    function fallbackCopy(text) {
      const tempTextarea = document.createElement("textarea");
      tempTextarea.value = text;
      document.body.appendChild(tempTextarea);
      tempTextarea.select();
      document.execCommand("copy");
      document.body.removeChild(tempTextarea);
      showToast("Text copied to clipboard!", "success");
    }

    // Clear Button
    clearBtn.addEventListener("click", () => {
      if (!textInput.value.trim()) {
        showToast("Text input is already empty.", "info");
        return;
      }

      if (isSpeaking) stopSpeech();

      textInput.value = "";
      updateTextStats();
      showToast("Text cleared.", "info");
      textInput.focus();
    });

    // Font Sizing
    fontIncrease.addEventListener("click", () => {
      if (currentFontSize < 32) {
        currentFontSize += 2;
        textInput.style.fontSize = `${currentFontSize}px`;
        fontSizeVal.textContent = `${currentFontSize}px`;
      }
    });

    fontDecrease.addEventListener("click", () => {
      if (currentFontSize > 12) {
        currentFontSize -= 2;
        textInput.style.fontSize = `${currentFontSize}px`;
        fontSizeVal.textContent = `${currentFontSize}px`;
      }
    });

    // Theme Toggle
    themeToggleBtn.addEventListener("click", () => {
      const html = document.documentElement;
      const currentTheme = html.getAttribute("data-theme");
      const nextTheme = currentTheme === "dark" ? "light" : "dark";

      html.setAttribute("data-theme", nextTheme);

      if (nextTheme === "light") {
        sunIcon.classList.add("hidden");
        moonIcon.classList.remove("hidden");
      } else {
        sunIcon.classList.remove("hidden");
        moonIcon.classList.add("hidden");
      }
    });

    // Close Notification Banner
    closeBannerBtn.addEventListener("click", () => {
      notificationBanner.classList.add("hidden");
    });

    // Keyboard Shortcuts (Space bar to Speak/Pause when not typing in textarea)
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && document.activeElement !== textInput && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "SELECT") {
        e.preventDefault();
        if (isSpeaking && !isPaused) {
          pauseSpeech();
        } else if (isPaused) {
          resumeSpeech();
        } else {
          speakText();
        }
      }
    });

    // Initial calculation
    updateTextStats();
  }
});
