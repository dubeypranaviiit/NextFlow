# NextFlow

This is my submission for the Galaxy.ai workflow builder assignment.  
The app is a workflow builder for LLM/image workflows where users can create workflows, connect nodes, run them, and see execution history.

I used Gemini for multimodal/vision workflow steps, and Groq for fast text generation because HR said using other AI providers like Groq is allowed.

## Main Features

- Clerk authentication for sign in and sign up
- Dashboard to create, open, rename, delete, and import workflows
- React Flow canvas with draggable/connected workflow nodes
- Default blank workflow with `Request Inputs` and `Response` nodes
- Prebuilt sample workflow called `Trial Task Workflow`
- Node picker for adding:
  - Crop Image
  - Gemini
  - Groq
- Workflow execution with DAG order
- Parallel execution for nodes at the same workflow level
- Crop Image waits for 30 seconds before returning, as required
- Run history with node-level status, duration, output, and errors
- JSON workflow export/import
- PostgreSQL persistence using Prisma

## Tech Stack

- Next.js App Router
- TypeScript
- React Flow
- Tailwind CSS
- Zustand
- Prisma
- PostgreSQL
- Clerk
- Trigger.dev
- Gemini API
- Groq API
- Transloadit
- Sharp

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file and add the required keys:

```env
DATABASE_URL=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

GEMINI_API_KEY=
GROQ_API_KEY=
TRIGGER_SECRET_KEY=

TRANSLOADIT_KEY=
TRANSLOADIT_SECRET=
TRANSLOADIT_TEMPLATE_ID=
```

Generate Prisma client:

```bash
npm run prisma:generate
```

Run database migration:

```bash
npm run prisma:migrate
```

Start the development server:

```bash
npm run dev
```

The app should run at:

```text
http://localhost:3000
```

## Trigger.dev

For local Trigger.dev testing:

```bash
npm run trigger:dev
```

The executable workflow nodes are handled through Trigger.dev tasks. There is also a local fallback for development if Trigger auth is not configured.

## Important Demo Flow

For the assignment demo, the main workflow to show is `Trial Task Workflow`, not just a blank workflow.

Suggested demo order:

1. Sign in or sign up.
2. Open the dashboard.
3. Open `Trial Task Workflow`.
4. Show the connected workflow graph.
5. Run the full workflow.
6. Show crop nodes taking 30+ seconds.
7. Show Groq and Gemini outputs.
8. Open the history panel and expand node-level results.
9. Show export/import JSON.

## Notes

- New blank workflows start with only `Request Inputs` and `Response`, which is intentional.
- The sample workflow is already prebuilt and connected.
- Groq is included because I was allowed to use it for AI execution.
- Make sure all environment variables are added on Vercel before deploying.

## Commands

```bash
npm run dev
npm run build
npm run typecheck
npm run prisma:generate
npm run prisma:migrate
```

