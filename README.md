# 🎯 Vocabulary Practice App

A modern, comprehensive vocabulary practice web application with multiple study modes, voice features, and smart progress tracking. Perfect for language learning with a beautiful, responsive interface.

## ✨ Features

### 📚 Multiple Practice Modes

- **Type Translation** (Word → Meaning): See the word, type the translation
- **Type Word** (Meaning → Word): See the meaning, type the word  
- **Multiple Choice** (Word → Meaning): Choose from 4 options
- **Multiple Choice** (Meaning → Word): Reverse multiple choice
- **Pronunciation Practice**: Real speech recognition validation with system voice

### 🎯 Smart Learning Features

- **Wrong Words Tracking**: Automatically tracks and stores incorrect answers
- **Focused Practice**: Practice only words you've gotten wrong
- **Flexible Sessions**: Choose 5, 10, 15, 20, 25 words or practice all
- **Real-time Progress**: Visual progress bar with live score tracking
- **Smart Answer Matching**: Accepts partial answers, handles typos, and multiple valid translations
- **Session Completion**: Clear "Start New Practice" and setup options after each session

### 🗣️ Voice Features

- **Text-to-Speech**: High-quality pronunciation playback (optimized for Japanese)
- **Speech Recognition**: Accurate pronunciation validation using Web Speech API
- **Real-time Transcription**: Voice input automatically fills answer fields
- **Pronunciation Scoring**: Validates your speech against the correct word

### 💾 Data Management

- **Easy CSV Upload**: Import vocabulary from simple 2-column CSV files (word, translation)
- **Local Storage**: All data stored securely in browser's IndexedDB with namespace isolation
- **Vocabulary Management**: Add, edit, and delete words with a clean interface
- **Comprehensive Statistics**: Track sessions, accuracy, total questions, and wrong words
- **Offline Ready**: Works completely offline, no server required

### 🎨 Modern Design

- **Beautiful Interface**: Modern gradient design with glass-morphism effects
- **Responsive Layout**: Perfect on desktop, tablet, and mobile devices
- **Smooth Animations**: Subtle transitions and hover effects for premium feel
- **Custom Favicon**: Professional branding with gradient icon
- **Accessibility**: High contrast, clear typography, and intuitive navigation

## CSV Format

Your CSV file should have the following columns:

```csv
word,translation
hello,こんにちは
thank you,ありがとう
goodbye,さようなら
```

- **word**: The vocabulary word
- **translation**: The meaning (can include multiple answers separated by commas)

## Deployment

### Deploy to Vercel

1. **Connect to Vercel**:

   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy**:

   ```bash
   vercel --prod
   ```

3. **Or use Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will automatically detect and deploy

### Alternative Deployment Options

**Netlify**:

- Drag and drop the entire folder to [netlify.com/drop](https://netlify.com/drop)

**GitHub Pages**:

1. Create a GitHub repository (must be public)
2. Push your code to the repository
3. Go to Settings → Pages → Source → Deploy from branch
4. Select 'main' branch and '/ (root)' folder
5. Your site will be live at `https://yourusername.github.io/repository-name`

**Any Static Host**:

- Upload all files to any web server
- No build process required - pure HTML/CSS/JS

## GitHub Pages Deployment (Detailed)

### Quick Setup

1. **Initialize git repository**:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create GitHub repository**:
   - Go to github.com → New repository
   - Name it (e.g., `vocabulary-practice`)
   - Make it **Public** (required for free GitHub Pages)
   - Don't initialize with README

3. **Push to GitHub**:

   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

4. **Enable GitHub Pages**:
   - Repository → Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `main`, Folder: `/ (root)`
   - Save

Your site will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME`

### Automatic Deployment

The included GitHub Actions workflow automatically deploys on every push to main branch.

## Local Development

1. **Install dependencies** (optional, for local server):

   ```bash
   npm install
   ```

2. **Run locally**:
   ```bash
   npm run dev
   ```
   Or simply open `index.html` in your browser.

## Browser Compatibility

- **Recommended**: Chrome, Edge (best voice features support)
- **Supported**: Firefox, Safari
- **Voice Features**: Require modern browsers with Web Speech API support

## File Structure

```
jp-words/
├── index.html          # Main application
├── app.js             # Application logic
├── style.css          # Styling
├── package.json       # Deployment configuration
├── vercel.json        # Vercel deployment settings
└── README.md          # This file
```

## Features Overview

### Practice Modes

- **5 different practice types** for varied learning
- **Session customization** (length, order, word source)
- **Real-time progress** with visual progress bar
- **Smart answer checking** accepts multiple valid answers

### Data Persistence

- **IndexedDB storage** for offline capability
- **Wrong words tracking** for focused review
- **Statistics tracking** across all sessions
- **Import/Export** via CSV files

### Voice Integration

- **Speech-to-text** for pronunciation practice
- **Text-to-speech** for audio playback
- **Language-specific** recognition (Japanese support)

## 🚀 Quick Start

1. **Download** or clone this repository
2. **Open** `index.html` in your browser (or deploy to any static host)
3. **Upload** a CSV file with your vocabulary (word, translation format)
4. **Start practicing** with any of the 5 practice modes!

## 🛠️ Technical Details

- **Frontend Only**: Pure HTML, CSS, JavaScript - no build process needed
- **Modern CSS**: Uses CSS Grid, Flexbox, and advanced features like backdrop-filter
- **Web APIs**: Leverages Speech Recognition, Speech Synthesis, and IndexedDB
- **No Backend Required**: All data stored locally with IndexedDB
- **Progressive Web App Ready**: Can be installed as a standalone app
- **Cross-browser**: Works on Chrome, Firefox, Safari, and Edge
- **Mobile Optimized**: Fully responsive with touch-friendly interface

## License

MIT License - Feel free to use and modify for your learning needs.
