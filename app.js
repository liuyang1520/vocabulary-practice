class VocabularyApp {
  constructor() {
    this.db = null;
    this.currentWords = [];
    this.practiceWords = [];
    this.currentPracticeIndex = 0;
    this.sessionLength = 10;
    this.maxSessionWords = 10;
    this.sessionCorrect = 0;
    this.sessionTotal = 0;
    this.practiceStats = {
      sessions: 0,
      correct: 0,
      total: 0,
    };
    this.speechRecognition = null;
    this.speechSynthesis = window.speechSynthesis;
    this.isListening = false;
    this.theme = "auto"; // auto, light, dark
    this.audioContext = null;
    this.detectedLanguage = null;
    this.initAudioContext();
    this.init();
  }

  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API not supported");
    }
  }

  async init() {
    await this.initDB();
    this.initTheme();
    this.initSpeechRecognition();
    this.setupEventListeners();
    this.showSection("upload");
    await this.loadStats();
    await this.updateWordCount();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("vocabulary-practice", 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains("words")) {
          const wordsStore = db.createObjectStore("words", {
            keyPath: "id",
            autoIncrement: true,
          });
          wordsStore.createIndex("word", "word", { unique: false });
        }

        if (!db.objectStoreNames.contains("stats")) {
          db.createObjectStore("stats", { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains("wrongWords")) {
          const wrongWordsStore = db.createObjectStore("wrongWords", {
            keyPath: "id",
            autoIncrement: true,
          });
          wrongWordsStore.createIndex("wordId", "wordId", { unique: false });
          wrongWordsStore.createIndex("timestamp", "timestamp", {
            unique: false,
          });
        }
      };
    });
  }

  initTheme() {
    // Load saved theme or default to auto
    const savedTheme =
      localStorage.getItem("vocabulary-practice-theme") || "auto";
    this.theme = savedTheme;
    this.applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addListener(() => {
      if (this.theme === "auto") {
        this.applyTheme();
      }
    });
  }

  applyTheme() {
    const html = document.documentElement;

    if (this.theme === "auto") {
      // Remove explicit theme, let CSS media query handle it
      html.removeAttribute("data-theme");
    } else {
      html.setAttribute("data-theme", this.theme);
    }

    // Update toggle button if it exists
    this.updateThemeToggle();
  }

  toggleTheme() {
    const themes = ["auto", "light", "dark"];
    const currentIndex = themes.indexOf(this.theme);
    const nextIndex = (currentIndex + 1) % themes.length;

    this.theme = themes[nextIndex];
    localStorage.setItem("vocabulary-practice-theme", this.theme);
    this.applyTheme();
  }

  getThemeIcon() {
    switch (this.theme) {
      case "light":
        return "☀️";
      case "dark":
        return "🌙";
      case "auto":
      default:
        return "🌓";
    }
  }

  getThemeLabel() {
    switch (this.theme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "auto":
      default:
        return "Auto";
    }
  }

  updateThemeToggle() {
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.innerHTML = `${this.getThemeIcon()} ${this.getThemeLabel()}`;
      themeToggle.title = `Current theme: ${this.getThemeLabel()}. Click to cycle through Auto → Light → Dark`;
    }
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const section = e.target.id.replace("-tab", "");
        this.showSection(section);
      });
    });

    // Upload
    document.getElementById("upload-btn").addEventListener("click", () => {
      document.getElementById("csv-file").click();
    });

    document.getElementById("csv-file").addEventListener("change", (e) => {
      this.handleFileUpload(e.target.files[0]);
    });

    // Manage
    document.getElementById("add-word-btn").addEventListener("click", () => {
      this.showAddWordModal();
    });

    document.getElementById("clear-all-btn").addEventListener("click", () => {
      this.clearAllWords();
    });

    // Stats actions
    document.getElementById("clear-stats-btn").addEventListener("click", () => {
      this.clearAllStats();
    });

    document
      .getElementById("clear-wrong-words-btn")
      .addEventListener("click", () => {
        this.clearWrongWords();
      });

    // Practice
    document
      .getElementById("start-practice-btn")
      .addEventListener("click", () => {
        this.startPractice();
      });

    document
      .getElementById("check-answer-btn")
      .addEventListener("click", async () => {
        await this.checkAnswer();
      });

    document.getElementById("next-word-btn").addEventListener("click", () => {
      this.nextWord();
    });

    document
      .getElementById("stop-practice-btn")
      .addEventListener("click", () => {
        this.stopPractice();
      });

    // Theme toggle
    document.getElementById("theme-toggle")?.addEventListener("click", () => {
      this.toggleTheme();
    });

    // Voice controls
    document.addEventListener("click", (e) => {
      if (e.target.id === "speak-word-btn") {
        this.speakWord();
      }
      if (e.target.id === "start-listening-btn") {
        this.startListening();
      }
      if (e.target.id === "stop-listening-btn") {
        this.stopListening();
      }
    });

    // Modal
    document.querySelector(".close").addEventListener("click", () => {
      this.hideAddWordModal();
    });

    document.getElementById("add-word-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.addWord();
    });

    window.addEventListener("click", (e) => {
      const modal = document.getElementById("add-word-modal");
      if (e.target === modal) {
        this.hideAddWordModal();
      }
    });
  }

  initSpeechRecognition() {
    // Initialize TTS voice loading
    this.loadVoices();

    // Detect language from vocabulary
    this.detectLanguageFromVocabulary();

    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = false;
      this.speechRecognition.interimResults = false;
      this.speechRecognition.maxAlternatives = 5; // Get multiple alternatives

      // Set language based on detection
      this.speechRecognition.lang = this.getRecognitionLanguage();

      this.speechRecognition.onresult = (event) => {
        // Get the best result or try alternatives
        const results = event.results[0];
        let bestResult = results[0].transcript;

        // Try to find the best match among alternatives
        for (let i = 0; i < results.length; i++) {
          const alternative = results[i].transcript;
          // You could add logic here to prefer certain alternatives
          // For now, we'll use the first (highest confidence) result
          if (i === 0) {
            bestResult = alternative;
            break;
          }
        }

        document.getElementById("answer-input").value = bestResult;
        this.stopListening();
      };

      this.speechRecognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        this.stopListening();
      };

      this.speechRecognition.onend = () => {
        this.stopListening();
      };
    }
  }

  async detectLanguageFromVocabulary() {
    try {
      const transaction = this.db.transaction(["words"], "readonly");
      const store = transaction.objectStore("words");

      const words = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (words.length === 0) {
        this.detectedLanguage = "ja"; // Default to Japanese
        return;
      }

      // Sample first few words to detect language
      const sampleWords = words.slice(0, Math.min(10, words.length));
      const languageScores = {
        ja: 0, // Japanese
        en: 0, // English
        zh: 0, // Chinese
        ko: 0, // Korean
        es: 0, // Spanish
        fr: 0, // French
        de: 0, // German
      };

      for (const word of sampleWords) {
        const text = word.word + " " + word.translation;
        languageScores.ja += this.countJapaneseChars(text);
        languageScores.zh += this.countChineseChars(text);
        languageScores.ko += this.countKoreanChars(text);
        languageScores.en += this.countEnglishChars(text);
        languageScores.es += this.countSpanishChars(text);
        languageScores.fr += this.countFrenchChars(text);
        languageScores.de += this.countGermanChars(text);
      }

      // Find the language with highest score
      const detectedLang = Object.keys(languageScores).reduce((a, b) =>
        languageScores[a] > languageScores[b] ? a : b,
      );

      this.detectedLanguage = detectedLang;
      console.log(
        "🌐 Detected language:",
        detectedLang,
        "scores:",
        languageScores,
      );
    } catch (error) {
      console.warn("Language detection failed, using Japanese default:", error);
      this.detectedLanguage = "ja";
    }
  }

  countJapaneseChars(text) {
    const hiragana = (text.match(/[\u3040-\u309F]/g) || []).length;
    const katakana = (text.match(/[\u30A0-\u30FF]/g) || []).length;
    const kanji = (text.match(/[\u4E00-\u9FAF]/g) || []).length;
    return hiragana + katakana + kanji;
  }

  countChineseChars(text) {
    return (text.match(/[\u4E00-\u9FAF]/g) || []).length;
  }

  countKoreanChars(text) {
    return (text.match(/[\uAC00-\uD7AF]/g) || []).length;
  }

  countEnglishChars(text) {
    return (text.match(/[a-zA-Z]/g) || []).length;
  }

  countSpanishChars(text) {
    return (text.match(/[áéíóúüñ]/gi) || []).length;
  }

  countFrenchChars(text) {
    return (text.match(/[àâäéèêëïîôöùûüÿç]/gi) || []).length;
  }

  countGermanChars(text) {
    return (text.match(/[äöüß]/gi) || []).length;
  }

  getRecognitionLanguage() {
    const langMap = {
      ja: "ja-JP",
      en: "en-US",
      zh: "zh-CN",
      ko: "ko-KR",
      es: "es-ES",
      fr: "fr-FR",
      de: "de-DE",
    };

    return langMap[this.detectedLanguage] || "ja-JP";
  }

  getTTSLanguage() {
    return this.detectedLanguage || "ja";
  }

  loadVoices() {
    // Voices might not be loaded immediately
    if (this.speechSynthesis.getVoices().length === 0) {
      this.speechSynthesis.onvoiceschanged = () => {
        console.log("Voices loaded:", this.speechSynthesis.getVoices().length);
        this.logAvailableJapaneseVoices();
      };
    } else {
      this.logAvailableJapaneseVoices();
    }
  }

  logAvailableJapaneseVoices() {
    const voices = this.speechSynthesis.getVoices();
    const japaneseVoices = voices.filter(
      (voice) => voice.lang === "ja-JP" || voice.lang.startsWith("ja"),
    );

    console.log(
      "Available Japanese voices:",
      japaneseVoices.map((v) => ({
        name: v.name,
        lang: v.lang,
        localService: v.localService,
      })),
    );
  }

  showSection(sectionName) {
    document.querySelectorAll(".section").forEach((section) => {
      section.classList.remove("active");
    });
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    document.getElementById(`${sectionName}-section`).classList.add("active");
    document.getElementById(`${sectionName}-tab`).classList.add("active");

    if (sectionName === "manage") {
      this.loadWordList();
    } else if (sectionName === "stats") {
      this.updateStats();
    }
  }

  async handleFileUpload(file) {
    if (!file) return;

    const statusEl = document.getElementById("upload-status");
    statusEl.innerHTML = "Processing...";

    try {
      const text = await file.text();
      const words = this.parseCSV(text);

      if (words.length === 0) {
        statusEl.innerHTML =
          '<span style="color: red;">No valid words found in CSV</span>';
        return;
      }

      await this.saveWords(words);
      statusEl.innerHTML = `<span style="color: green;">Successfully uploaded ${words.length} words</span>`;
      await this.updateWordCount();
    } catch (error) {
      statusEl.innerHTML = `<span style="color: red;">Error: ${error.message}</span>`;
    }
  }

  parseCSV(text) {
    const lines = text.split("\n").filter((line) => line.trim());
    const words = [];

    // Skip header if it exists
    const startIndex = lines[0].toLowerCase().includes("word") ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const parts = this.parseCSVLine(lines[i]);
      if (parts.length >= 2) {
        words.push({
          word: parts[0].trim(),
          translation: parts[1].trim(),
        });
      }
    }

    return words;
  }

  parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  async saveWords(words) {
    const transaction = this.db.transaction(["words"], "readwrite");
    const store = transaction.objectStore("words");

    for (const word of words) {
      await new Promise((resolve, reject) => {
        const request = store.add(word);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  async addWord() {
    const word = document.getElementById("new-word").value.trim();
    const translation = document.getElementById("new-translation").value.trim();

    if (!word || !translation) return;

    const wordObj = { word, translation };

    try {
      const transaction = this.db.transaction(["words"], "readwrite");
      const store = transaction.objectStore("words");
      await new Promise((resolve, reject) => {
        const request = store.add(wordObj);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      this.hideAddWordModal();
      this.loadWordList();
      await this.updateWordCount();
    } catch (error) {
      alert("Error adding word: " + error.message);
    }
  }

  async loadWordList() {
    const transaction = this.db.transaction(["words"], "readonly");
    const store = transaction.objectStore("words");

    const words = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const listEl = document.getElementById("word-list");
    listEl.innerHTML = "";

    words.forEach((word) => {
      const wordEl = document.createElement("div");
      wordEl.className = "word-item";
      wordEl.innerHTML = `
                <div class="word-content">
                    <strong>${word.word}</strong> - ${word.translation}
                </div>
                <button class="delete-btn" onclick="app.deleteWord(${word.id})">Delete</button>
            `;
      listEl.appendChild(wordEl);
    });
  }

  async deleteWord(id) {
    const transaction = this.db.transaction(["words"], "readwrite");
    const store = transaction.objectStore("words");

    await new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    this.loadWordList();
    await this.updateWordCount();
  }

  async clearAllWords() {
    if (!confirm("Are you sure you want to delete all words?")) return;

    const transaction = this.db.transaction(["words"], "readwrite");
    const store = transaction.objectStore("words");

    await new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    this.loadWordList();
    await this.updateWordCount();
  }

  async updateWordCount() {
    const transaction = this.db.transaction(["words"], "readonly");
    const store = transaction.objectStore("words");

    const count = await new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    document.getElementById("word-count").textContent = `Words: ${count}`;
  }

  async startPractice() {
    // Get session settings
    const sessionLength = document.getElementById("session-length").value;
    const shuffleMode = document.getElementById("shuffle-mode").value;
    const wordSource = document.getElementById("word-source").value;

    let allWords;

    if (wordSource === "wrong") {
      allWords = await this.getWrongWords();
      if (allWords.length === 0) {
        alert(
          "No wrong words found. Practice with all words first to build your wrong words list.",
        );
        return;
      }
    } else {
      const transaction = this.db.transaction(["words"], "readonly");
      const store = transaction.objectStore("words");

      allWords = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (allWords.length === 0) {
        alert(
          "No words available for practice. Please upload some vocabulary first.",
        );
        return;
      }
    }

    // Prepare practice words
    this.practiceWords = [...allWords];

    if (shuffleMode === "random") {
      this.shuffleArray(this.practiceWords);
    }

    // Limit session length
    if (sessionLength !== "all") {
      this.maxSessionWords = parseInt(sessionLength);
      this.practiceWords = this.practiceWords.slice(0, this.maxSessionWords);
    } else {
      this.maxSessionWords = this.practiceWords.length;
    }

    this.currentPracticeIndex = 0;
    this.sessionCorrect = 0;
    this.sessionTotal = 0;

    document.querySelector(".practice-setup").style.display = "none";
    document.querySelector(".practice-controls").style.display = "none";
    document.getElementById("practice-area").style.display = "block";

    this.practiceStats.sessions++;
    this.updateProgress();
    this.showCurrentWord();
  }

  showCurrentWord() {
    const mode = document.getElementById("practice-mode").value;
    const word = this.practiceWords[this.currentPracticeIndex];
    const contentEl = document.getElementById("practice-content");

    const checkBtn = document.getElementById("check-answer-btn");
    const nextBtn = document.getElementById("next-word-btn");

    // Hide check button for choice modes since they auto-submit
    if (mode === "choice" || mode === "choice-reverse") {
      checkBtn.style.display = "none";
    } else {
      checkBtn.style.display = "block";
    }

    nextBtn.style.display = "none";
    document.getElementById("practice-feedback").innerHTML = "";

    switch (mode) {
      case "guess":
        contentEl.innerHTML = `
                    <div class="practice-question">
                        <h3>What does this word mean?</h3>
                        <div class="word-display">${word.word}</div>
                        <input type="text" id="answer-input" placeholder="Enter translation" />
                    </div>
                `;
        break;

      case "guess-reverse":
        contentEl.innerHTML = `
                    <div class="practice-question">
                        <h3>What word has this meaning?</h3>
                        <div class="translation-display">${word.translation}</div>
                        <input type="text" id="answer-input" placeholder="Enter word" />
                    </div>
                `;
        break;

      case "choice":
        contentEl.innerHTML = `
                    <div class="practice-question">
                        <h3>What does this word mean?</h3>
                        <div class="word-display">${word.word}</div>
                        <div class="choice-options" id="choice-options"></div>
                    </div>
                `;
        // Use setTimeout to ensure DOM is updated before creating choices
        setTimeout(() => this.createMultipleChoices(word, "translation"), 10);
        break;

      case "choice-reverse":
        contentEl.innerHTML = `
                    <div class="practice-question">
                        <h3>Which word has this meaning?</h3>
                        <div class="translation-display">${word.translation}</div>
                        <div class="choice-options" id="choice-options"></div>
                    </div>
                `;
        // Use setTimeout to ensure DOM is updated before creating choices
        setTimeout(() => this.createMultipleChoices(word, "word"), 10);
        break;

      case "pronunciation":
        contentEl.innerHTML = `
                    <div class="practice-question">
                        <h3>Practice pronouncing this word</h3>
                        <div class="word-display">${word.word}</div>
                        <div class="translation">${word.translation}</div>
                        <div class="voice-controls">
                            <button id="speak-word-btn" class="btn voice-btn">🔊 Play Pronunciation</button>
                            ${
                              this.speechRecognition
                                ? `
                                <button id="start-listening-btn" class="btn voice-btn">🎤 Start Recording</button>
                                <button id="stop-listening-btn" class="btn voice-btn" style="display: none;">⏹️ Stop Recording</button>
                            `
                                : ""
                            }
                        </div>
                        <div class="pronunciation-practice">
                            <p>Listen to the pronunciation, then say the word aloud!</p>
                            <input type="text" id="answer-input" placeholder="Use voice recognition or type the word" />
                        </div>
                    </div>
                `;
        break;
    }

    const answerInput = document.getElementById("answer-input");
    if (answerInput) {
      answerInput.focus();
      answerInput.addEventListener("keypress", async (e) => {
        if (e.key === "Enter") {
          if (
            document.getElementById("check-answer-btn").style.display !== "none"
          ) {
            await this.checkAnswer();
          } else if (
            document.getElementById("next-word-btn").style.display !== "none"
          ) {
            this.nextWord();
          }
        }
      });
    }
  }

  async checkAnswer() {
    const mode = document.getElementById("practice-mode").value;
    const word = this.practiceWords[this.currentPracticeIndex];
    const feedbackEl = document.getElementById("practice-feedback");

    let correctAnswer, isCorrect, userAnswer;

    // Handle multiple choice modes
    if (mode === "choice" || mode === "choice-reverse") {
      const selectedBtn = document.querySelector(".choice-option.selected");
      if (!selectedBtn) {
        alert("Please select an answer");
        return;
      }
      isCorrect = selectedBtn.dataset.correct === "true";
      correctAnswer = this.getCorrectAnswerForMode(word, mode);
    } else {
      // Handle text input
      const answerInput = document.getElementById("answer-input");
      if (!answerInput) {
        alert("Please provide an answer");
        return;
      }
      userAnswer = answerInput.value.trim().toLowerCase();

      switch (mode) {
        case "guess":
          correctAnswer = word.translation;
          isCorrect = await this.checkAnswerMatch(userAnswer, word.translation);
          break;
        case "guess-reverse":
          correctAnswer = word.word;
          isCorrect = await this.checkAnswerMatch(userAnswer, word.word);
          break;
        case "pronunciation":
          correctAnswer = word.word;
          isCorrect = await this.checkAnswerMatch(userAnswer, word.word);
          break;
      }
    }

    this.practiceStats.total++;
    this.sessionTotal++;

    if (isCorrect) {
      this.practiceStats.correct++;
      this.sessionCorrect++;
      feedbackEl.innerHTML = '<div class="feedback correct">Correct!</div>';
    } else {
      // Track wrong word
      this.addWrongWord(word);

      const formattedAnswer = this.formatCorrectAnswer(correctAnswer);
      feedbackEl.innerHTML = `
                <div class="feedback incorrect">
                    Incorrect
                    <div class="correct-answer">
                        Correct answer${formattedAnswer.split(",").length > 1 ? "s" : ""}:
                        ${formattedAnswer}
                    </div>
                </div>
            `;
    }

    this.updateProgress();

    document.getElementById("check-answer-btn").style.display = "none";
    document.getElementById("next-word-btn").style.display = "block";

    this.saveStats();
  }

  getCorrectAnswerForMode(word, mode) {
    switch (mode) {
      case "guess":
      case "choice":
        return word.translation;
      case "guess-reverse":
      case "choice-reverse":
        return word.word;
      case "pronunciation":
        return word.word;
      default:
        return word.translation;
    }
  }

  async checkAnswerMatch(userAnswer, correctAnswer) {
    if (!correctAnswer) return false;

    const normalizedUser = userAnswer.toLowerCase().trim();
    const normalizedCorrect = correctAnswer.toLowerCase().trim();

    // Direct match
    if (normalizedUser === normalizedCorrect) return true;

    // Language character matching - check if they represent the same meaning
    console.log(
      "🔍 Checking language equivalency for:",
      normalizedUser,
      "⟷",
      normalizedCorrect,
    );
    if (await this.areLanguageEquivalent(normalizedUser, normalizedCorrect)) {
      console.log("✅ Language equivalency match found");
      return true;
    }

    // Split by common separators and check if user answer matches any part
    const separators = [",", ";", "/", "|", " or ", " and "];
    let possibleAnswers = [normalizedCorrect];

    for (const sep of separators) {
      const newAnswers = [];
      for (const answer of possibleAnswers) {
        if (answer.includes(sep)) {
          newAnswers.push(...answer.split(sep).map((part) => part.trim()));
        } else {
          newAnswers.push(answer);
        }
      }
      possibleAnswers = newAnswers;
    }

    // Remove duplicates and empty strings
    possibleAnswers = [...new Set(possibleAnswers)].filter(
      (answer) => answer.length > 0,
    );

    // Check if user answer matches any of the possible answers
    for (const possible of possibleAnswers) {
      if (normalizedUser === possible) return true;

      // Language equivalency check for each possible answer
      if (await this.areLanguageEquivalent(normalizedUser, possible)) {
        return true;
      }

      // Also check if user answer is contained in the possible answer (for articles like "a", "an", "the")
      if (possible.includes(normalizedUser) && normalizedUser.length >= 2)
        return true;
    }

    // Check fuzzy matching for small typos (optional)
    for (const possible of possibleAnswers) {
      if (
        this.calculateSimilarity(normalizedUser, possible) > 0.8 &&
        Math.abs(normalizedUser.length - possible.length) <= 2
      ) {
        return true;
      }
    }

    return false;
  }

  areLanguageEquivalent(userAnswer, correctAnswer) {
    // Basic hiragana to katakana conversion and vice versa
    const hiraganaToKatakana = (str) => {
      return str.replace(/[\u3041-\u3096]/g, (match) => {
        return String.fromCharCode(match.charCodeAt(0) + 0x60);
      });
    };

    const katakanaToHiragana = (str) => {
      return str.replace(/[\u30A1-\u30F6]/g, (match) => {
        return String.fromCharCode(match.charCodeAt(0) - 0x60);
      });
    };

    // Convert both to hiragana for comparison
    const userHiragana = katakanaToHiragana(userAnswer);
    const correctHiragana = katakanaToHiragana(correctAnswer);

    // Check direct hiragana equivalency
    if (userHiragana === correctHiragana) return true;

    // Convert both to katakana for comparison
    const userKatakana = hiraganaToKatakana(userAnswer);
    const correctKatakana = hiraganaToKatakana(correctAnswer);

    // Check direct katakana equivalency
    if (userKatakana === correctKatakana) return true;

    // Dynamic equivalency check - look through existing vocabulary
    return this.checkDynamicEquivalency(userAnswer, correctAnswer);
  }

  async checkDynamicEquivalency(userAnswer, correctAnswer) {
    // Get all words from database to find patterns
    const transaction = this.db.transaction(["words"], "readonly");
    const store = transaction.objectStore("words");

    const allWords = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Enhanced matching for Japanese text
    for (const word of allWords) {
      // Direct matches
      if (userAnswer === word.word && correctAnswer === word.translation) {
        return true;
      }
      if (userAnswer === word.translation && correctAnswer === word.word) {
        return true;
      }

      // Check if both user answer and correct answer appear in the same vocabulary entry
      // This handles cases where both forms exist in your database
      const wordForms = [word.word, word.translation].map((w) =>
        w.toLowerCase(),
      );
      if (
        wordForms.includes(userAnswer.toLowerCase()) &&
        wordForms.includes(correctAnswer.toLowerCase())
      ) {
        return true;
      }

      // Cross-reference check: if userAnswer matches any word and correctAnswer matches its pair
      if (
        this.normalizeJapanese(userAnswer) ===
          this.normalizeJapanese(word.word) &&
        this.normalizeJapanese(correctAnswer) ===
          this.normalizeJapanese(word.translation)
      ) {
        return true;
      }
      if (
        this.normalizeJapanese(userAnswer) ===
          this.normalizeJapanese(word.translation) &&
        this.normalizeJapanese(correctAnswer) ===
          this.normalizeJapanese(word.word)
      ) {
        return true;
      }
    }

    // Look for semantic equivalency patterns
    return this.checkSemanticEquivalency(userAnswer, correctAnswer, allWords);
  }

  normalizeJapanese(text) {
    // Convert katakana to hiragana for comparison
    return text
      .replace(/[\u30A1-\u30F6]/g, (match) => {
        return String.fromCharCode(match.charCodeAt(0) - 0x60);
      })
      .toLowerCase();
  }

  checkSemanticEquivalency(userAnswer, correctAnswer, allWords) {
    // Look for patterns where different forms of the same word appear
    const userNormalized = this.normalizeJapanese(userAnswer);
    const correctNormalized = this.normalizeJapanese(correctAnswer);

    // Check if these could be different representations of the same concept
    for (const word of allWords) {
      const wordNorm = this.normalizeJapanese(word.word);
      const transNorm = this.normalizeJapanese(word.translation);

      // If either userAnswer or correctAnswer appears in vocabulary,
      // check if they share semantic meaning
      if (
        userNormalized === wordNorm ||
        userNormalized === transNorm ||
        correctNormalized === wordNorm ||
        correctNormalized === transNorm
      ) {
        // Additional heuristics for Japanese word equivalency
        if (this.areJapaneseWordVariants(userAnswer, correctAnswer)) {
          return true;
        }
      }
    }

    return false;
  }

  areJapaneseWordVariants(word1, word2) {
    // Check if words share common elements (like same verb stem)
    const norm1 = this.normalizeJapanese(word1);
    const norm2 = this.normalizeJapanese(word2);

    // Debug logging for equivalency checking (only when not matching)
    const shouldLog = norm1 !== norm2;

    // Direct match after normalization
    if (norm1 === norm2) {
      return true;
    }

    // If one is significantly shorter, it might be a stem of the other
    const longer = norm1.length > norm2.length ? norm1 : norm2;
    const shorter = norm1.length > norm2.length ? norm2 : norm1;

    // Check if shorter form is contained in longer form (potential stem matching)
    if (shorter.length >= 2 && longer.includes(shorter)) {
      return true;
    }

    // For conjugated forms, check if they share the same beginning
    if (longer.length > 2 && shorter.length > 2) {
      const commonLength = Math.min(longer.length - 1, shorter.length - 1, 3);
      if (
        longer.substring(0, commonLength) === shorter.substring(0, commonLength)
      ) {
        return true;
      }
    }

    // Check common hiragana-kanji pairs
    const commonPairs = {
      かいしゃ: "会社",
      がっこう: "学校",
      せんせい: "先生",
      がくせい: "学生",
      しごと: "仕事",
      でんわ: "電話",
      でんわばんごう: "電話番号",
      びょういん: "病院",
      ぎんこう: "銀行",
      としょかん: "図書館",
      こうえん: "公園",
      えき: "駅",
      みち: "道",
      いえ: "家",
      くるま: "車",
      でんしゃ: "電車",
      ひこうき: "飛行機",
      みずうみ: "湖",
      やま: "山",
      かわ: "川",
      うみ: "海",
      ばんごう: "番号",
      じゅうしょ: "住所",
      なまえ: "名前",
      ねんれい: "年齢",
      せいねんがっぴ: "生年月日",
      こくせき: "国籍",
    };

    // Check both directions
    if (commonPairs[word1] === word2 || commonPairs[word2] === word1) {
      console.log("✅ Common pair match found:", word1, "⟷", word2);
      return true;
    }

    // Enhanced compound word analysis
    if (this.areCompoundWordEquivalents(word1, word2, commonPairs)) {
      console.log("✅ Compound word equivalency found:", word1, "⟷", word2);
      return true;
    }

    console.log("❌ No equivalency found");
    return false;
  }

  areCompoundWordEquivalents(word1, word2, commonPairs) {
    // For compound words, try breaking them down and checking parts
    const longer = word1.length > word2.length ? word1 : word2;
    const shorter = word1.length > word2.length ? word2 : word1;

    // If the longer word might be a compound, try to find matching parts
    if (longer.length >= 4) {
      // Check if we can build the longer word from known parts
      for (let i = 2; i <= longer.length - 2; i++) {
        const part1 = longer.substring(0, i);
        const part2 = longer.substring(i);

        // Check if both parts have known equivalents
        const part1Equiv =
          commonPairs[part1] ||
          Object.keys(commonPairs).find((key) => commonPairs[key] === part1);
        const part2Equiv =
          commonPairs[part2] ||
          Object.keys(commonPairs).find((key) => commonPairs[key] === part2);

        if (part1Equiv && part2Equiv) {
          // Try to reconstruct the compound
          const reconstructed =
            (typeof part1Equiv === "string" ? part1Equiv : part1) +
            (typeof part2Equiv === "string" ? part2Equiv : part2);

          if (reconstructed === shorter) {
            console.log(
              "🔍 Compound word analysis:",
              longer,
              "=",
              part1,
              "+",
              part2,
              "→",
              reconstructed,
              "=",
              shorter,
            );
            return true;
          }
        }
      }
    }

    return false;
  }

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  nextWord() {
    // Store current scroll position
    const scrollPosition =
      window.pageYOffset || document.documentElement.scrollTop;

    this.currentPracticeIndex++;

    if (
      this.currentPracticeIndex >= this.practiceWords.length ||
      this.currentPracticeIndex >= this.maxSessionWords
    ) {
      this.endPractice();
    } else {
      this.updateProgress();
      this.showCurrentWord();

      // Restore scroll position after content changes
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition);
      });
    }
  }

  endPractice() {
    const contentEl = document.getElementById("practice-content");
    const sessionAccuracy =
      this.sessionTotal > 0
        ? Math.round((this.sessionCorrect / this.sessionTotal) * 100)
        : 0;

    // Update progress bar to 100%
    document.getElementById("progress-fill").style.width = "100%";
    document.getElementById("progress-text").textContent = "Session Complete!";

    contentEl.innerHTML = `
            <div class="practice-complete">
                <h3>🎉 Practice Session Complete!</h3>
                <div class="session-results">
                    <div class="result-item">
                        <span class="result-label">Questions Answered:</span>
                        <span class="result-value">${this.currentPracticeIndex}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Correct Answers:</span>
                        <span class="result-value">${this.sessionCorrect}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Session Accuracy:</span>
                        <span class="result-value">${sessionAccuracy}%</span>
                    </div>
                </div>
                <div class="completion-actions">
                    <button id="start-new-practice-btn" class="btn">Start New Practice</button>
                    <button id="back-to-setup-btn" class="btn" style="background: rgba(108, 117, 125, 0.8);">Back to Setup</button>
                </div>
            </div>
        `;

    document.getElementById("check-answer-btn").style.display = "none";
    document.getElementById("next-word-btn").style.display = "none";
    document.getElementById("stop-practice-btn").style.display = "none";

    // Add event listeners for completion buttons
    document
      .getElementById("start-new-practice-btn")
      .addEventListener("click", () => {
        this.startPractice();
      });

    document
      .getElementById("back-to-setup-btn")
      .addEventListener("click", () => {
        this.stopPractice();
      });
  }

  stopPractice() {
    document.querySelector(".practice-setup").style.display = "grid";
    document.querySelector(".practice-controls").style.display = "flex";
    document.getElementById("practice-area").style.display = "none";
  }

  updateProgress() {
    const currentQuestion = this.currentPracticeIndex + 1;
    const totalQuestions = this.maxSessionWords;
    const progressPercentage =
      (this.currentPracticeIndex / this.maxSessionWords) * 100;

    // Update progress text
    document.getElementById("progress-text").textContent =
      `Question ${currentQuestion} of ${totalQuestions}`;

    // Update score
    document.getElementById("progress-score").textContent =
      `Score: ${this.sessionCorrect}/${this.sessionTotal}`;

    // Update progress bar
    document.getElementById("progress-fill").style.width =
      `${progressPercentage}%`;
  }

  formatCorrectAnswer(answer) {
    if (!answer) return "";

    // Split by common separators and create a nicely formatted display
    const separators = [",", ";", "/", "|", " or ", " and "];
    let options = [answer];

    for (const sep of separators) {
      const newOptions = [];
      for (const option of options) {
        if (option.includes(sep)) {
          newOptions.push(...option.split(sep).map((part) => part.trim()));
        } else {
          newOptions.push(option);
        }
      }
      options = newOptions;
    }

    // Remove duplicates and empty strings
    options = [...new Set(options)].filter((opt) => opt.length > 0);

    if (options.length === 1) {
      return `<div class="answer-option">${options[0]}</div>`;
    } else {
      return `<div class="answer-options">${options
        .map((opt) => `<span class="answer-option">${opt}</span>`)
        .join("")}</div>`;
    }
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  showAddWordModal() {
    document.getElementById("add-word-modal").style.display = "block";
  }

  hideAddWordModal() {
    document.getElementById("add-word-modal").style.display = "none";
    document.getElementById("add-word-form").reset();
  }

  async saveStats() {
    const transaction = this.db.transaction(["stats"], "readwrite");
    const store = transaction.objectStore("stats");

    await new Promise((resolve, reject) => {
      const request = store.put({ id: "practice", ...this.practiceStats });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadStats() {
    const transaction = this.db.transaction(["stats"], "readonly");
    const store = transaction.objectStore("stats");

    const stats = await new Promise((resolve, reject) => {
      const request = store.get("practice");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (stats) {
      this.practiceStats = { ...stats };
      delete this.practiceStats.id;
    }
  }

  async updateStats() {
    const wordCount = await this.getWordCount();
    const wrongWordsCount = await this.getWrongWordsCount();
    const accuracy =
      this.practiceStats.total > 0
        ? Math.round(
            (this.practiceStats.correct / this.practiceStats.total) * 100,
          )
        : 0;

    document.getElementById("total-words").textContent = wordCount;
    document.getElementById("practice-sessions").textContent =
      this.practiceStats.sessions;
    document.getElementById("correct-answers").textContent =
      this.practiceStats.correct;
    document.getElementById("accuracy").textContent = accuracy + "%";
    document.getElementById("wrong-words-count").textContent = wrongWordsCount;
  }

  async getWordCount() {
    const transaction = this.db.transaction(["words"], "readonly");
    const store = transaction.objectStore("words");

    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  createMultipleChoices(correctWord, answerType) {
    const optionsEl = document.getElementById("choice-options");
    if (!optionsEl) {
      console.error("choice-options element not found!");
      return;
    }

    const options = [correctWord];

    // Add 3 random incorrect options
    const otherWords = this.practiceWords.filter(
      (w) => w.id !== correctWord.id,
    );
    this.shuffleArray(otherWords);
    options.push(...otherWords.slice(0, 3));

    // Shuffle all options
    this.shuffleArray(options);

    optionsEl.innerHTML = "";

    options.forEach((word, index) => {
      const optionBtn = document.createElement("button");
      optionBtn.className = "btn choice-option";
      optionBtn.textContent = word[answerType] || "N/A";
      optionBtn.dataset.correct = word.id === correctWord.id;
      optionBtn.addEventListener("click", () => {
        document
          .querySelectorAll(".choice-option")
          .forEach((btn) => btn.classList.remove("selected"));
        optionBtn.classList.add("selected");
        // Auto-trigger check answer
        setTimeout(async () => await this.checkAnswer(), 300);
      });
      optionsEl.appendChild(optionBtn);
    });

    console.log(`Created ${options.length} choice options for ${answerType}`);
  }

  speakWord() {
    const word = this.practiceWords[this.currentPracticeIndex];
    if (!word.word) return;

    // Use enhanced browser TTS with word-specific language detection
    this.speakWithEnhancedBrowserTTS(word.word);
  }

  speakWithEnhancedBrowserTTS(text) {
    if (!this.speechSynthesis) return;

    // Force voice loading if needed
    if (this.speechSynthesis.getVoices().length === 0) {
      this.speechSynthesis.getVoices(); // Trigger loading
      setTimeout(() => this.speakWithEnhancedBrowserTTS(text), 100);
      return;
    }

    // Detect language of the specific text being spoken
    const textLang = this.detectTextLanguage(text);
    const voice = this.selectBestVoiceForLanguage(textLang);
    console.log(
      "🔊 Using Enhanced Browser TTS with voice:",
      voice ? voice.name : "default",
    );

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.getLanguageCode(textLang); // Use text-specific language

    // Voice and language-specific optimized settings
    const settings = this.getOptimalVoiceSettings(voice, textLang);
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    // Enhanced voice selection
    if (voice) {
      utterance.voice = voice;
      console.log("🎯 Voice details:", {
        name: voice.name,
        lang: voice.lang,
        localService: voice.localService,
        detectedTextLang: textLang,
        quality: this.getVoiceQualityScore(voice, {
          google: 9,
          microsoft: 8,
          apple: 9,
          samsung: 7,
          amazon: 8,
        }),
      });
    }

    // Add pronunciation improvements
    utterance.text = this.preprocessTextForBetterPronunciation(text, textLang);

    // Add audio processing hooks
    utterance.onstart = () => {
      this.applyAudioEnhancements();
      console.log("🎵 Speaking:", utterance.text, "in", textLang);
    };

    utterance.onend = () => {
      console.log("✅ Speech completed");
    };

    // Better error handling with retry
    utterance.onerror = (event) => {
      console.error(
        "❌ Speech synthesis error:",
        event,
        "for text:",
        text,
        "lang:",
        textLang,
      );
      // Try once more with default voice
      if (voice) {
        console.log("🔄 Retrying with default voice...");
        setTimeout(() => {
          const retryUtterance = new SpeechSynthesisUtterance(text);
          retryUtterance.lang = utterance.lang;
          retryUtterance.rate = utterance.rate;
          retryUtterance.pitch = utterance.pitch;
          retryUtterance.volume = utterance.volume;
          this.speechSynthesis.speak(retryUtterance);
        }, 100);
      }
    };

    // Cancel any ongoing speech first
    this.speechSynthesis.cancel();

    // Small delay to ensure cancellation is processed
    setTimeout(() => {
      this.speechSynthesis.speak(utterance);
    }, 50);
  }

  detectTextLanguage(text) {
    // First check if this exact text appears in our vocabulary database
    const contextLang = this.getLanguageFromVocabularyContext(text);
    if (contextLang) {
      console.log(
        '🎯 Language from vocabulary context for "' +
          text +
          '": ' +
          contextLang,
      );
      return contextLang;
    }

    // Count characters for each language in the specific text
    const scores = {
      ja: this.countJapaneseChars(text),
      zh: this.countChineseChars(text),
      ko: this.countKoreanChars(text),
      en: this.countEnglishChars(text),
      es: this.countSpanishChars(text),
      fr: this.countFrenchChars(text),
      de: this.countGermanChars(text),
    };

    // Special handling for ambiguous cases (kanji/hanzi that exist in both Japanese and Chinese)
    if (scores.ja > 0 && scores.zh > 0) {
      // Use overall vocabulary language bias for ambiguous characters
      const vocabLang = this.detectedLanguage;
      if (vocabLang === "ja" || vocabLang === "zh") {
        console.log(
          '🔍 Ambiguous text "' +
            text +
            '" using vocabulary bias: ' +
            vocabLang,
        );
        return vocabLang;
      }

      // If no clear bias, check for Japanese-specific indicators
      if (this.hasJapaneseIndicators(text)) {
        console.log('🔍 Japanese indicators found in "' + text + '"');
        return "ja";
      }
    }

    // Find the language with highest score
    const detectedLang = Object.keys(scores).reduce((a, b) =>
      scores[a] > scores[b] ? a : b,
    );

    console.log(
      '🔍 Text language detection for "' + text + '":',
      scores,
      "→",
      detectedLang,
    );
    return detectedLang;
  }

  getLanguageFromVocabularyContext(text) {
    // Check if this text appears in our vocabulary and what language context it's in
    if (!this.practiceWords) return null;

    for (const word of this.practiceWords) {
      if (word.word === text) {
        // Found the word, analyze its translation to infer language
        const translation = word.translation.toLowerCase();

        // Japanese vocabulary often has English translations
        if (/^[a-z\s,]+$/.test(translation)) {
          // Translation is English, so the word is likely Japanese
          return "ja";
        }

        // Check if translation contains Chinese characters
        if (
          this.countChineseChars(word.translation) > 0 &&
          this.countJapaneseChars(word.translation) === 0
        ) {
          return "zh";
        }

        // Check if translation contains Japanese characters
        if (this.countJapaneseChars(word.translation) > 0) {
          return "ja";
        }

        break;
      }

      if (word.translation === text) {
        // Text is the translation, analyze the word to infer language
        if (
          this.countJapaneseChars(word.word) > this.countChineseChars(word.word)
        ) {
          return "ja";
        }
        if (
          this.countChineseChars(word.word) > 0 &&
          this.countJapaneseChars(word.word) === 0
        ) {
          return "zh";
        }
        break;
      }
    }

    return null;
  }

  hasJapaneseIndicators(text) {
    // Look for indicators that suggest Japanese rather than Chinese
    // Japanese often uses certain readings or combinations
    const japaneseIndicators = [
      /[\u3040-\u309F]/, // Contains hiragana
      /[\u30A0-\u30FF]/, // Contains katakana
      /[々]/, // Iteration mark more common in Japanese
    ];

    return japaneseIndicators.some((pattern) => pattern.test(text));
  }

  selectBestVoiceForLanguage(lang) {
    const voices = this.speechSynthesis.getVoices();

    // Enhanced quality ranking for voices
    const voiceQuality = {
      google: 9,
      microsoft: 8,
      apple: 9,
      samsung: 7,
      amazon: 8,
      nuance: 8,
      cereproc: 7,
      espeak: 3,
    };

    // Language-specific preferred voice names
    const preferredNamesByLang = {
      ja: [
        "kyoko",
        "otoya",
        "sayaka",
        "haruka",
        "japanese female",
        "japanese male",
      ],
      en: [
        "alex",
        "samantha",
        "karen",
        "daniel",
        "moira",
        "english female",
        "english male",
      ],
      zh: ["mei-jia", "liling", "sin-ji", "chinese female", "chinese male"],
      ko: ["yuna", "korean female", "korean male"],
      es: ["monica", "jorge", "spanish female", "spanish male"],
      fr: ["amelie", "thomas", "french female", "french male"],
      de: ["anna", "yannick", "german female", "german male"],
    };

    // Get language codes to search for
    const langCodes = this.getLanguageCodes(lang);

    // Find voices for the specific language
    const targetLanguageVoices = voices.filter((voice) =>
      langCodes.some(
        (code) => voice.lang === code || voice.lang.startsWith(code),
      ),
    );

    if (targetLanguageVoices.length === 0) {
      console.warn("❌ No voices found for language:", lang, "using default");
      return null;
    }

    const preferredNames = preferredNamesByLang[lang] || [];

    // Sort by quality score and preferred names
    targetLanguageVoices.sort((a, b) => {
      // First priority: Quality score (Google should win here)
      const scoreA = this.getVoiceQualityScore(a, voiceQuality);
      const scoreB = this.getVoiceQualityScore(b, voiceQuality);

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      // Second priority: Preferred names
      const nameScoreA = this.getNamePreferenceScore(a.name, preferredNames);
      const nameScoreB = this.getNamePreferenceScore(b.name, preferredNames);

      if (nameScoreA !== nameScoreB) {
        return nameScoreB - nameScoreA;
      }

      // Third priority: For same quality, prefer local for reliability
      if (a.localService !== b.localService) {
        return a.localService ? 1 : -1;
      }

      return 0;
    });

    // Debug logging to see all voice scores
    const voiceDetails = targetLanguageVoices.slice(0, 3).map((voice) => ({
      name: voice.name,
      localService: voice.localService,
      qualityScore: this.getVoiceQualityScore(voice, voiceQuality),
      nameScore: this.getNamePreferenceScore(voice.name, preferredNames),
    }));

    console.log("🗣️ Voice selection details:", voiceDetails);
    console.log(
      "🗣️ Selected voice:",
      targetLanguageVoices[0].name,
      "for language:",
      lang,
    );
    return targetLanguageVoices[0];
  }

  getLanguageCode(lang) {
    const langMap = {
      ja: "ja-JP",
      en: "en-US",
      zh: "zh-CN",
      ko: "ko-KR",
      es: "es-ES",
      fr: "fr-FR",
      de: "de-DE",
    };

    return langMap[lang] || "ja-JP";
  }

  getOptimalVoiceSettings(voice, lang) {
    // Base settings per language
    const baseSettings = {
      ja: { rate: 0.4, pitch: 0.8, volume: 1.0 },
      en: { rate: 0.5, pitch: 0.9, volume: 1.0 },
      zh: { rate: 0.4, pitch: 0.85, volume: 1.0 },
      ko: { rate: 0.45, pitch: 0.85, volume: 1.0 },
      es: { rate: 0.5, pitch: 0.9, volume: 1.0 },
      fr: { rate: 0.5, pitch: 0.9, volume: 1.0 },
      de: { rate: 0.45, pitch: 0.85, volume: 1.0 },
    };

    let settings = { ...(baseSettings[lang] || baseSettings["ja"]) };

    // Adjust based on voice type
    if (voice) {
      const voiceName = voice.name.toLowerCase();
      const isGoogleVoice =
        voiceName.includes("google") || voiceName.includes("日本語");
      const isMicrosoftVoice =
        voiceName.includes("microsoft") ||
        ["haruka", "sayaka"].some((name) => voiceName.includes(name));
      const isAppleVoice =
        voice.localService &&
        (voiceName.includes("kyoko") ||
          voiceName.includes("alex") ||
          voiceName.includes("samantha"));

      if (isGoogleVoice) {
        // Google voices are high quality and can handle faster speeds
        settings.rate = Math.min(settings.rate * 1.8, 0.8); // Increase rate by 80%
        settings.pitch = Math.max(settings.pitch, 0.85); // Slightly higher pitch sounds more natural
        console.log(
          "🎯 Using Google voice optimization: rate =",
          settings.rate,
        );
      } else if (isMicrosoftVoice) {
        // Microsoft voices can handle moderate increase
        settings.rate = Math.min(settings.rate * 1.4, 0.7);
        console.log(
          "🎯 Using Microsoft voice optimization: rate =",
          settings.rate,
        );
      } else if (isAppleVoice) {
        // Apple voices (like Kyoko) can handle slight increase
        settings.rate = Math.min(settings.rate * 1.2, 0.6);
        console.log("🎯 Using Apple voice optimization: rate =", settings.rate);
      } else {
        // Generic/unknown voices - keep conservative settings
        console.log(
          "🎯 Using conservative voice settings: rate =",
          settings.rate,
        );
      }
    }

    return settings;
  }

  // Keep for backward compatibility
  getLanguageSpecificSettings(lang) {
    return this.getOptimalVoiceSettings(null, lang);
  }

  applyAudioEnhancements() {
    // Resume audio context if suspended (required by some browsers)
    if (this.audioContext && this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    // Note: Direct Web Audio processing of speechSynthesis is limited
    // This is more about preparing the audio context and ensuring optimal playback
    // For real-time processing, we'd need to capture the audio stream
  }

  getLanguageCodes(lang) {
    const langMap = {
      ja: ["ja-JP", "ja"],
      en: ["en-US", "en-GB", "en"],
      zh: ["zh-CN", "zh-TW", "zh"],
      ko: ["ko-KR", "ko"],
      es: ["es-ES", "es-MX", "es"],
      fr: ["fr-FR", "fr-CA", "fr"],
      de: ["de-DE", "de"],
    };

    return langMap[lang] || ["ja-JP", "ja"];
  }

  getNamePreferenceScore(voiceName, preferredNames) {
    const name = voiceName.toLowerCase();
    for (let i = 0; i < preferredNames.length; i++) {
      if (name.includes(preferredNames[i])) {
        return preferredNames.length - i;
      }
    }
    return 0;
  }

  getVoiceQualityScore(voice, qualityMap) {
    const name = voice.name.toLowerCase();

    // Check for explicit provider matches first
    for (const [provider, score] of Object.entries(qualityMap)) {
      if (name.includes(provider)) {
        return score;
      }
    }

    // Special handling for Google voices that might not have "google" in the name
    if (
      name.includes("google") ||
      name.includes("日本語") ||
      (!voice.localService &&
        (name.includes("neural") || name.includes("premium")))
    ) {
      return 9; // High quality for Google/premium voices
    }

    // Default scoring based on local vs network
    return voice.localService ? 6 : 5;
  }

  preprocessTextForBetterPronunciation(text, lang = "ja") {
    let processed = text;

    if (lang === "ja") {
      // Japanese-specific preprocessing
      processed = processed.replace(/([。、])/g, "$1 ");

      // Add subtle breaks for long compound words (4+ characters)
      if (processed.length >= 4) {
        processed = processed.replace(
          /([あ-ん])(る|す|ます|した|して)/,
          "$1 $2",
        );
      }

      // Handle special Japanese pronunciation cases
      const jpPronunciationMap = {
        ー: "", // Remove long vowel marks that might confuse TTS
      };

      for (const [original, replacement] of Object.entries(
        jpPronunciationMap,
      )) {
        processed = processed.replace(new RegExp(original, "g"), replacement);
      }
    } else if (lang === "en") {
      // English-specific preprocessing
      // Add commas for natural pauses in long sentences
      if (processed.length > 20) {
        processed = processed.replace(/\b(and|or|but|so)\b/g, ", $1");
      }
    } else if (lang === "zh") {
      // Chinese-specific preprocessing
      processed = processed.replace(/([，。！？])/g, "$1 ");
    } else if (lang === "es" || lang === "fr") {
      // Romance language preprocessing
      processed = processed.replace(/([,.!?])/g, "$1 ");
    }

    // Universal improvements
    processed = processed.replace(/\s+/g, " ").trim(); // Clean up extra spaces

    return processed;
  }

  startListening() {
    if (this.speechRecognition && !this.isListening) {
      this.isListening = true;
      document.getElementById("start-listening-btn").style.display = "none";
      document.getElementById("stop-listening-btn").style.display =
        "inline-block";
      this.speechRecognition.start();
    }
  }

  stopListening() {
    if (this.speechRecognition && this.isListening) {
      this.isListening = false;
      document.getElementById("start-listening-btn").style.display =
        "inline-block";
      document.getElementById("stop-listening-btn").style.display = "none";
      this.speechRecognition.stop();
    }
  }

  async addWrongWord(word) {
    const wrongWord = {
      wordId: word.id,
      word: word.word,
      translation: word.translation,
      timestamp: new Date().toISOString(),
    };

    const transaction = this.db.transaction(["wrongWords"], "readwrite");
    const store = transaction.objectStore("wrongWords");

    await new Promise((resolve, reject) => {
      const request = store.add(wrongWord);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getWrongWords() {
    const transaction = this.db.transaction(["wrongWords"], "readonly");
    const store = transaction.objectStore("wrongWords");

    const wrongWords = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Remove duplicates by wordId, keeping the most recent
    const uniqueWrongWords = [];
    const seen = new Set();

    wrongWords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    for (const wrongWord of wrongWords) {
      if (!seen.has(wrongWord.wordId)) {
        seen.add(wrongWord.wordId);
        uniqueWrongWords.push(wrongWord);
      }
    }

    return uniqueWrongWords;
  }

  async getWrongWordsCount() {
    const wrongWords = await this.getWrongWords();
    return wrongWords.length;
  }

  async clearWrongWords() {
    if (!confirm("Are you sure you want to clear all wrong words?")) return;

    const transaction = this.db.transaction(["wrongWords"], "readwrite");
    const store = transaction.objectStore("wrongWords");

    await new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    this.updateStats();
    alert("Wrong words cleared successfully!");
  }

  async clearAllStats() {
    if (
      !confirm(
        "Are you sure you want to clear all statistics? This will reset your practice history and wrong words.",
      )
    )
      return;

    const transaction = this.db.transaction(
      ["stats", "wrongWords"],
      "readwrite",
    );
    const statsStore = transaction.objectStore("stats");
    const wrongWordsStore = transaction.objectStore("wrongWords");

    await Promise.all([
      new Promise((resolve, reject) => {
        const request = statsStore.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise((resolve, reject) => {
        const request = wrongWordsStore.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
    ]);

    // Reset in-memory stats
    this.practiceStats = {
      sessions: 0,
      correct: 0,
      total: 0,
    };

    this.updateStats();
    alert("All statistics cleared successfully!");
  }
}

const app = new VocabularyApp();
