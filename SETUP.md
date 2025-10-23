# LLM Lab - Setup Guide

## Prerequisites
- Node.js 18+
- An OpenAI API key

## Install
```
npm install
```

## Environment
- Open `llm-lab/.env` and ensure you have:
```
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY=your_openai_key_here
```

If `.env` exists without `OPENAI_API_KEY`, add it.

## Database
```
npx prisma migrate dev
```

## Run Dev
```
npm run dev
```
Visit http://localhost:3000

## How It Works
- Submit a prompt and parameter lists for `temperature`, `top_p`, `max_tokens`.
- The API (`app/api/run/route.ts`) runs a grid over parameter combinations using OpenAI Chat Completions via `fetch` and computes metrics in `src/lib/metrics.ts`.
- Results are persisted with Prisma models defined in `prisma/schema.prisma`.

## Notes
- OpenAI model defaults to `gpt-4o-mini`, editable from the UI.
- You can deploy to Vercel: add `OPENAI_API_KEY` and `DATABASE_URL` envs in Vercel project settings (SQLite is fine for demo).
- Further polish (charts, comparison view, export/import) will be added next.
