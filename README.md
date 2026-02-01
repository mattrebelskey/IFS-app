# Healing Journey

A compassionate, gamified tracker for mental health and personal growth based on Internal Family Systems (IFS) principles.

## Features

- **Daily Basics Tracking** - Track essential self-care tasks with XP rewards
- **Survival Mode** - Reduced tasks when you're struggling
- **Focus Tasks** - Weekly goals with higher XP rewards
- **Parts Work** - IFS-based parts check-ins and tracking
- **Journal** - Text, voice, and photo journaling
- **XP & Levels** - Gamified progression (Survivor → Curious → Courageous → Connected)
- **Prestige System** - Reset your cycle while keeping lifetime XP
- **Badges** - Achievement system for milestones
- **Learning Library** - Educational content about IFS and self-compassion
- **Crisis Resources** - Quick access to mental health support

## Setup

### Prerequisites
- Node.js 18+

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Add your Gemini API key for AI features:
   - Create a `.env.local` file in the root directory
   - Add: `GEMINI_API_KEY=your_api_key_here`
   - Get a free key at: https://makersuite.google.com/app/apikey

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

## Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect repo to Vercel
3. Add `GEMINI_API_KEY` as an environment variable (optional)
4. Deploy

### Netlify
1. Push to GitHub
2. Connect repo to Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add `GEMINI_API_KEY` as an environment variable (optional)

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide Icons
- Google Gemini AI (optional)

## Disclaimer

This app is for self-reflection and motivation, not therapy or crisis intervention. If you're struggling, please reach out to a mental health professional.

## License

MIT
