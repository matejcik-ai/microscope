# Microscope RPG with AI Co-Players

A web application for playing Microscope RPG with AI-powered co-players. Built with Next.js, TypeScript, and a pluggable AI provider architecture.

## Features

- 🎮 Collaborative timeline-building RPG gameplay
- 🤖 AI co-players powered by Claude (or your choice of provider)
- 🔌 Pluggable AI architecture - bring your own API key and provider
- ⚡ Built with Next.js 14 and TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- An Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com/))

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` and add your API key:
   ```
   ANTHROPIC_API_KEY=your_actual_api_key_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## Deploying to Vercel

### Step 1: Push to GitHub

Make sure your code is pushed to a GitHub repository.

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

### Step 3: Set Environment Variables

In the Vercel project settings:
1. Go to "Settings" → "Environment Variables"
2. Add `ANTHROPIC_API_KEY` with your API key
3. Save the changes

### Step 4: Deploy

Click "Deploy" and Vercel will build and deploy your app. You'll get a URL like:
```
https://your-project.vercel.app
```

### Automatic Deployments

Every push to your main branch will automatically deploy to production. Pull requests get preview deployments with unique URLs.

## AI Provider Architecture

The app uses a pluggable AI provider system. Currently implemented:

- ✅ **Claude** (Anthropic) - fully implemented
- 📝 **OpenAI GPT** - stub implementation (TODO)

### Using Different Providers

To add a new provider, implement the `AIProvider` interface in `lib/ai/types.ts`:

```typescript
import { AIProvider } from '@/lib/ai';

export class MyCustomProvider implements AIProvider {
  name = 'my-provider';

  async generateResponse(messages, config) {
    // Your implementation
  }
}
```

Then register it in `lib/ai/provider-factory.ts`.

## Project Structure

```
microscope/
├── app/                  # Next.js app directory
│   ├── api/             # API routes
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── lib/                 # Shared libraries
│   └── ai/             # AI provider system
│       ├── types.ts           # TypeScript interfaces
│       ├── provider-factory.ts # Provider factory
│       └── providers/         # Provider implementations
│           ├── claude.ts
│           └── openai.ts
├── package.json
├── tsconfig.json
└── next.config.mjs
```

## Testing the AI Integration

Once deployed, you can test the AI endpoint:

```bash
curl -X POST https://your-app.vercel.app/api/test-ai \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, AI!"}'
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key for Claude |
| `OPENAI_API_KEY` | No | Your OpenAI API key (for future use) |

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **AI SDK:** Anthropic SDK
- **Deployment:** Vercel
- **Styling:** TBD (to be added with actual game UI)

## Contributing

This is a personal project, but suggestions are welcome!

## License

MIT
