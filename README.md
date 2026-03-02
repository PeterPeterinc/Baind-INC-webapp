# HN-AB Chat Platform

A modern AI-powered chat application for Het Nieuwe Arbeidsbureau with multi-assistant support and advanced search capabilities.

## Features

- **Multi-Assistant Chat**: Talk to different AI assistants (Claire, Tom, Remco, Roos, HN-AB) each with specialized knowledge
- **Web Search Integration**: Roos can search the internet for real-time information using Brave Search API
- **Conversation History**: Maintains chat history per colleague with persistent storage
- **Vector Store Integration**: Each assistant has access to relevant documents via OpenAI Vector Stores
- **Cost Optimizations**: Uses GPT-4o-mini for 95% cost reduction with exponential backoff polling
- **File Management**: Upload and manage files for each colleague

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: OpenAI Assistants API (GPT-4o-mini)
- **Search**: Brave Search API for web search
- **Storage**: Vercel Blob Storage + OpenAI Vector Stores
- **Database**: Prisma with PostgreSQL

## Environment Variables

Required environment variables in `.env.local`:

```env
# OpenAI Configuration
OPENAI_API_KEY=<your_openai_key>

# Brave Search API (for web search)
BRAVE_SEARCH_API_KEY=<your_brave_key>

# Storage Tokens (per colleague)
CLAIRE_READ_WRITE_TOKEN=<your_blob_token>
TOM_READ_WRITE_TOKEN=<your_blob_token>
REMCO_READ_WRITE_TOKEN=<your_blob_token>

# Optional: Assistant IDs and Vector Store IDs (configured on platform.openai.com)
# Will default to production values if not specified
```

## Assistant Configuration

Each assistant is configured on [platform.openai.com/assistants](https://platform.openai.com/assistants) with:

- **System Instructions**: Role-specific behavioral guidelines
- **Vector Store**: Access to relevant documents (file_search)
- **Tools**: Web search, document search, custom functions
- **Model**: GPT-4o-mini (cost optimized)

### Current Assistants

| Assistant | ID | Purpose | Web Search |
|-----------|----|---------|----|
| Claire | asst_RV73BLM5HB6ScbYIujNVJH6f | HR Advisor | ❌ |
| Tom | asst_FYWjsbBhjC3WL4U2mgr5ySaA | Learning & Development | ❌ |
| Remco | asst_UaYD6dZC7qxCCjZUWiWHtply | Tender Specialist | ❌ |
| Roos | asst_qUtgsCtBehfHln5wBIiZHPap | Marketing & Communications | ✅ |
| HN-AB | asst_AgxNxGDvrPMTr72QRhImZ4fp | General Knowledge | ❌ |

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
