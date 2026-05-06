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

## Setup

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   Create a `.env` file based on `.env.example` and add your `GEMINI_API_KEY`.
4. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `GEMINI_API_KEY`: Required for AI handwriting evaluation.

## License

MIT
