(() => {
  const root = document.documentElement;
  const metaScheme = document.querySelector('meta[name="color-scheme"]');
  const themeInput = document.getElementById("theme-toggle-input");
  const themeText = document.getElementById("theme-toggle-text");
  const sfxBtn = document.getElementById("sfx-toggle-btn");
  const crtBtn = document.getElementById("crt-toggle-btn");
  const darkMql = window.matchMedia("(prefers-color-scheme: dark)");

  // --- 1. 8-Bit Web Audio Synthesizer (0 bytes of external audio!) ---
  let audioCtx = null;
  let sfxEnabled = localStorage.getItem("geek-sfx") === "on";

  function playTone(freq = 440, duration = 0.06, type = "square", volume = 0.06) {
    if (!sfxEnabled) return;
    try {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        audioCtx = new AudioContextClass();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(volume, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // Ignore audio errors if blocked by browser autoplay policy
    }
  }

  function playArpeggio(notes, step = 0.07) {
    if (!sfxEnabled) return;
    notes.forEach((f, idx) => {
      setTimeout(() => playTone(f, step * 0.9, "square", 0.07), idx * step * 1000);
    });
  }

  window.GeekSFX = {
    blip: () => playTone(660, 0.04, "square", 0.04),
    key: () => playTone(320 + Math.random() * 120, 0.025, "square", 0.025),
    enter: () => playArpeggio([523.25, 659.25, 783.99], 0.05),
    error: () => playArpeggio([220, 164.81], 0.09),
    powerup: () => playArpeggio([330, 392, 659, 523, 587, 784], 0.065),
    setEnabled: (val) => {
      sfxEnabled = Boolean(val);
      localStorage.setItem("geek-sfx", sfxEnabled ? "on" : "off");
      updateHudButtons();
      if (sfxEnabled) window.GeekSFX.powerup();
    },
    isEnabled: () => sfxEnabled
  };

  // --- 2. Dark / Light Mode Two-State Control (per modern-web-guidance) ---
  function getEffectiveTheme() {
    const saved = localStorage.getItem("color-scheme");
    if (saved === "light" || saved === "dark") return saved;
    return darkMql.matches ? "dark" : "light";
  }

  function applyTheme(scheme) {
    if (scheme === "light" || scheme === "dark") {
      root.setAttribute("data-theme", scheme);
      if (metaScheme) metaScheme.content = scheme;
    } else {
      root.removeAttribute("data-theme");
      if (metaScheme) metaScheme.content = "light dark";
    }
    syncThemeUI();
  }

  function syncThemeUI() {
    const current = getEffectiveTheme();
    const systemScheme = darkMql.matches ? "dark" : "light";
    if (themeInput) {
      themeInput.checked = current !== systemScheme;
    }
    if (themeText) {
      themeText.textContent = current === "dark" ? "☀ LIGHT" : "☾ DARK";
    }
  }

  window.GeekTheme = {
    set: (mode) => {
      const systemScheme = darkMql.matches ? "dark" : "light";
      if (mode === "system" || mode === systemScheme) {
        localStorage.removeItem("color-scheme");
        applyTheme("light dark");
      } else if (mode === "light" || mode === "dark") {
        localStorage.setItem("color-scheme", mode);
        applyTheme(mode);
      }
    },
    get: getEffectiveTheme
  };

  // Initialize theme from localStorage if present
  const savedScheme = localStorage.getItem("color-scheme");
  if (savedScheme === "light" || savedScheme === "dark") {
    applyTheme(savedScheme);
  } else {
    syncThemeUI();
  }

  if (themeInput) {
    themeInput.addEventListener("change", () => {
      const current = getEffectiveTheme();
      const target = current === "dark" ? "light" : "dark";
      const systemScheme = darkMql.matches ? "dark" : "light";

      // Two-state control: if selecting the current OS default, return to system mode;
      // otherwise pin the explicit opposite color-scheme in localStorage.
      if (target === systemScheme) {
        localStorage.removeItem("color-scheme");
        applyTheme("light dark");
      } else {
        localStorage.setItem("color-scheme", target);
        applyTheme(target);
      }
      window.GeekSFX.blip();
    });
  }

  // React to runtime OS theme changes as required by dark-mode guide
  darkMql.addEventListener("change", () => {
    syncThemeUI();
  });

  // --- 3. CRT Scanlines & SFX HUD Toggles ---
  let crtEnabled = localStorage.getItem("geek-crt") === "on";
  if (crtEnabled) {
    document.body.classList.add("crt-enabled");
  }

  function updateHudButtons() {
    if (sfxBtn) {
      sfxBtn.setAttribute("aria-pressed", String(sfxEnabled));
      sfxBtn.textContent = sfxEnabled ? "♪ SFX:ON" : "♪ SFX:OFF";
    }
    if (crtBtn) {
      crtBtn.setAttribute("aria-pressed", String(crtEnabled));
      crtBtn.textContent = crtEnabled ? "▤ CRT:ON" : "▤ CRT:OFF";
    }
  }

  if (sfxBtn) {
    sfxBtn.hidden = false;
    sfxBtn.addEventListener("click", () => {
      window.GeekSFX.setEnabled(!sfxEnabled);
    });
  }

  if (crtBtn) {
    crtBtn.hidden = false;
    crtBtn.addEventListener("click", () => {
      crtEnabled = !crtEnabled;
      document.body.classList.toggle("crt-enabled", crtEnabled);
      localStorage.setItem("geek-crt", crtEnabled ? "on" : "off");
      updateHudButtons();
      window.GeekSFX.blip();
    });
  }

  updateHudButtons();

  // Play subtle blip on button/nav clicks when SFX is enabled
  document.addEventListener("click", (e) => {
    const target = e.target.closest("a, button, summary");
    if (target && target !== sfxBtn) {
      window.GeekSFX.blip();
    }
  });

  // --- 4. Konami Code Easter Egg (↑ ↑ ↓ ↓ ← → ← → B A) ---
  const konamiSeq = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a"
  ];
  let konamiIdx = 0;

  window.addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const expected = konamiSeq[konamiIdx];
    if (key === expected) {
      konamiIdx++;
      if (konamiIdx === konamiSeq.length) {
        konamiIdx = 0;
        triggerKonamiOverdrive();
      }
    } else {
      konamiIdx = key === konamiSeq[0] ? 1 : 0;
    }
  });

  function triggerKonamiOverdrive() {
    const wasSfx = sfxEnabled;
    sfxEnabled = true;
    window.GeekSFX.powerup();
    sfxEnabled = wasSfx;

    let dialog = document.getElementById("konami-dialog");
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.id = "konami-dialog";
      dialog.className = "pixel-window";
      dialog.style.maxInlineSize = "32rem";
      dialog.style.margin = "auto";
      dialog.style.padding = "0";
      dialog.setAttribute("aria-labelledby", "konami-title");
      dialog.innerHTML = `
        <div class="window-titlebar">
          <span class="window-title" id="konami-title">★ CHEAT CODE ACTIVATED // +99 LIVES ★</span>
          <button type="button" class="pixel-btn" id="konami-close-btn">✕</button>
        </div>
        <div class="window-body">
          <p><strong>↑ ↑ ↓ ↓ ← → ← → B A</strong> recognized!</p>
          <p>You unlocked <strong>GEEKONAUT TURBO MODE</strong>: Unlimited coffee mana, zero crawl budget issues, and 60fps software-rendered Three.js cubes!</p>
          <p class="mb-0"><a href="/terminal/?cmd=matrix" class="pixel-btn">>_ Launch Matrix in Terminal</a></p>
        </div>
      `;
      document.body.appendChild(dialog);
      dialog.querySelector("#konami-close-btn").addEventListener("click", () => dialog.close());
    }
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    }
  }
})();
