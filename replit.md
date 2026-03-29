# Jarvis AI Assistant

## Overview

A personal AI assistant web dashboard inspired by Iron Man's JARVIS, with a futuristic dark HUD design. Features an intelligent intent router that automatically routes commands to the right AI (Google Gemini for general tasks, Anthropic Claude for code tasks, Gemini Imagen for image generation). Includes voice input/output, tasks & reminders, quick commands, and real-time streaming.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **Frontend**: React + Vite + Tailwind CSS
- **AI**: Google Gemini (general + images), Anthropic Claude (code tasks)

## Architecture

```
artifacts/
├── api-server/         ← Express API server (all routes)
│   └── src/routes/
│       ├── health.ts
│       ├── gemini/     ← Gemini chat + image routes
│       ├── anthropic/  ← Claude chat routes  
│       └── jarvis/     ← Main Jarvis routes with intent router
│           ├── index.ts   ← Conversations, messages, SSE streaming
│           └── tasks.ts   ← Tasks CRUD endpoints
└── jarvis/             ← React frontend (Iron Man HUD design)
    └── src/
        ├── components/
        │   ├── ArcReactor.tsx      ← Animated arc reactor
        │   ├── ChatArea.tsx        ← Chat with voice input/output
        │   ├── ChatMessage.tsx     ← Message bubbles with image support
        │   ├── QuickCommands.tsx   ← Expandable quick command panel
        │   ├── Sidebar.tsx         ← Navigation + tasks + quick commands
        │   ├── TasksPanel.tsx      ← Tasks & reminders CRUD UI
        │   └── WelcomeScreen.tsx   ← Landing screen
        ├── hooks/
        │   ├── use-jarvis-stream.ts    ← SSE streaming hook
        │   ├── use-voice-input.ts      ← Web Speech API mic input
        │   └── use-voice-output.ts     ← SpeechSynthesis voice output
        └── pages/
            └── Dashboard.tsx       ← Main layout, quick command wiring

lib/
├── api-spec/                   ← OpenAPI spec + Orval codegen
├── api-client-react/           ← Generated React Query hooks
├── api-zod/                    ← Generated Zod schemas
├── db/                         ← Drizzle schema + DB connection
│   └── schema/
│       ├── conversations.ts
│       ├── jarvis_messages.ts
│       ├── messages.ts
│       └── tasks.ts
├── integrations-gemini-ai/     ← Gemini AI integration client
└── integrations-anthropic-ai/  ← Anthropic AI integration client
```

## Intent Router

The Jarvis intent router (`artifacts/api-server/src/routes/jarvis/index.ts`) classifies every command:

| Intent | Provider | Examples |
|--------|----------|---------|
| general | Gemini Flash | Questions, weather, reminders |
| code | Claude | Write functions, debug, explain code |
| image | Gemini Imagen | Generate an image of... |
| device | Gemini Flash | Device control explanations |
| memory | Gemini Flash | What was I working on? |

## Database

Tables:
- `conversations` - conversation sessions
- `messages` - messages per conversation (Gemini/Anthropic routes)
- `jarvis_messages` - Jarvis messages with intent/provider metadata
- `tasks` - tasks & reminders with title, description, priority, status, dueDate

## Key Features

- Iron Man HUD-inspired dark UI with electric blue accents
- Real-time streaming responses via SSE
- Intent-based routing to the right AI automatically
- Conversation history persisted in PostgreSQL
- Image generation (Gemini Imagen) with base64 display + download
- Animated arc reactor component in sidebar
- **Voice input** via Web Speech API (microphone button)
- **Voice output** via SpeechSynthesis (toggleable, reads AI responses aloud)
- **Tasks & Reminders** CRUD panel in sidebar with priority/status
- **Quick Commands** panel with pre-set commands by category
- Image stored in DB as `[IMAGE:mimeType:base64data]` format

## AI Integrations

Uses Replit AI Integrations (no user API keys required):
- `AI_INTEGRATIONS_GEMINI_BASE_URL` + `AI_INTEGRATIONS_GEMINI_API_KEY`
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` + `AI_INTEGRATIONS_ANTHROPIC_API_KEY`

## Dev Commands

- `pnpm --filter @workspace/api-server run dev` - API server
- `pnpm --filter @workspace/jarvis run dev` - Frontend
- `pnpm --filter @workspace/api-spec run codegen` - Regenerate API types
- `pnpm --filter @workspace/db run push` - Push DB schema
