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
    this.init();
  }

  async init() {
    await this.initDB();
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
      .addEventListener("click", () => {
        this.checkAnswer();
      });

    document.getElementById("next-word-btn").addEventListener("click", () => {
      this.nextWord();
    });

    document
      .getElementById("stop-practice-btn")
      .addEventListener("click", () => {
        this.stopPractice();
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
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = false;
      this.speechRecognition.interimResults = false;
      this.speechRecognition.lang = "ja-JP"; // Default to Japanese, can be changed

      this.speechRecognition.onresult = (event) => {
        const result = event.results[0][0].transcript;
        document.getElementById("answer-input").value = result;
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
      answerInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          if (
            document.getElementById("check-answer-btn").style.display !== "none"
          ) {
            this.checkAnswer();
          } else if (
            document.getElementById("next-word-btn").style.display !== "none"
          ) {
            this.nextWord();
          }
        }
      });
    }
  }

  checkAnswer() {
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
          isCorrect = this.checkAnswerMatch(userAnswer, word.translation);
          break;
        case "guess-reverse":
          correctAnswer = word.word;
          isCorrect = this.checkAnswerMatch(userAnswer, word.word);
          break;
        case "pronunciation":
          correctAnswer = word.word;
          isCorrect = this.checkAnswerMatch(userAnswer, word.word);
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

  checkAnswerMatch(userAnswer, correctAnswer) {
    if (!correctAnswer) return false;

    const normalizedUser = userAnswer.toLowerCase().trim();
    const normalizedCorrect = correctAnswer.toLowerCase().trim();

    // Direct match
    if (normalizedUser === normalizedCorrect) return true;

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
        setTimeout(() => this.checkAnswer(), 300);
      });
      optionsEl.appendChild(optionBtn);
    });

    console.log(`Created ${options.length} choice options for ${answerType}`);
  }

  speakWord() {
    const word = this.practiceWords[this.currentPracticeIndex];
    if (this.speechSynthesis && word.word) {
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.lang = "ja-JP";
      utterance.rate = 0.8;
      this.speechSynthesis.speak(utterance);
    }
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
