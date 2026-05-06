# Omok Hanzi Learning

An educational game that combines the classic Omok (Gomoku) board game with Chinese character (Hanzi) writing practice.

## Features

- **OMOK Gameplay**: Classic 15x15 board game (Five in a Row).
- **Hanzi Integration**: Players must write Chinese characters correctly to place tokens or earn items.
- **AI Scoring**: Real-time AI evaluation of handwriting accuracy using Gemini.
- **Multi-language Support**: Instructions available in English and Mongolian.
- **Items System**:
  - **Hint**: Reveals character outlines.
  - **Skip**: Automates a move after writing a "Challenge Character".
- **Game Modes**:
  - **PK (Player vs Player)**: Local multiplayer.
  - **AI Mode**: Play against an AI opponent.
- **YCT Integration**: Vocabulary categories based on YCT (Youth Chinese Test) levels.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Animations**: motion (framer-motion)
- **AI Integration**: Google Gemini API
- **Handwriting**: Hanzi Writer + Custom Drawing Canvas

## GitHub Pages Deployment

### Automatic Deployment (Recommended)
This repository includes a GitHub Action that automatically deploys the project to GitHub Pages whenever you push to the `main` branch.

1. Go to your GitHub repository **Settings** > **Secrets and variables** > **Actions**.
2. Add a **New repository secret**:
   - Name: `GEMINI_API_KEY`
   - Value: (Your Google Gemini API Key)
3. Ensure GitHub Pages is configured to use **GitHub Actions** as the source (Settings > Pages > Build and deployment > Source).

### Local Build & Manual Verification
If you want to test the production build locally:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the project:
   ```bash
   npm run build
   ```
3. Verify the `dist/index.html` file. References to assets should now start with `/writing-omok/assets/`.
4. Preview the production build:
   ```bash
   npm run preview
   ```

### Validation Checklist
- Check console for 404 errors. If found, ensure `base` in `vite.config.ts` matches your repository name.
- View source in browser: Assets should look like `<script ... src="/writing-omok/assets/index-XXXX.js">`.


## License

MIT
