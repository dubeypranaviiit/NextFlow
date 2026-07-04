# NextFlow

NextFlow is an interactive, visual no-code/low-code AI workflow orchestrator (a mini Zapier/n8n clone). It allows users to visually chain together LLMs (Gemini, Groq), image processors (FFmpeg/Sharp), and logical routing blocks into automated processing graphs.

---

## ✨ Features

- **Visual Editor (React Flow)**: A draggable, connectable node canvas with real-time state management via Zustand.
- **DAG Execution Engine**: An orchestrator that parses workflows as Directed Acyclic Graphs (DAGs) using **Kahn's Topological Sorting Algorithm** to execute concurrent batches in parallel.
- **Conditional branching (If/Else Node)**: A secure conditional logic block that routes data streams to either a `True` or `False` handle, propagating a `skipped` status downstream to prune inactive execution branches automatically.
- **Usage Metrics & Run History**: Deep execution stats recording start times, step status (success, failed, skipped), durations, raw outputs, and error stacks.
- **Offline / Recruiter Fallback Mode**:
  - **No-Auth Fallback**: Logs in automatically as a default `demo-user` if Clerk auth credentials are not in the environment variables (allowing zero-config local testing).
  - **Local Engine Fallback**: Defaults to local node completions (Google Gemini REST / Groq REST / local `sharp` image crops) if Trigger.dev keys are absent.
- **Import/Export**: Load or share workflows instantly via standard JSON configurations.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js (App Router), TypeScript, @xyflow/react (React Flow), Tailwind CSS, Zustand
- **Database / ORM**: Prisma, PostgreSQL
- **Execution & Jobs**: Trigger.dev v3 SDK, local REST completion layers
- **File & Image Processing**: Sharp, Transloadit
- **Testing**: Vitest

---

## 📁 Key File Overview

- `types/workflow.ts`: Unified TypeScript interfaces for nodes, ports, execution states, and comparison operators.
- `store/workflow-store.ts`: Zustand store for state mutations, connectivity checks (preventing loops), and debounced database syncs.
- `app/api/execute/route.ts`: Core serverless backend runner resolving the topological sort and propagating skipped states.
- `lib/condition-evaluator.ts`: A secure evaluation library utilizing switch/case conditions rather than `eval()` to prevent remote code injection attacks.
- `features/workflow/nodes/`: Directory containing visual canvas components (such as `condition-node.tsx`).
- `features/workflow/nodes/base-node.tsx`: Shared frame component that renders status alerts, header styles, and badge states.

---

## 🚀 Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root folder:
```env
DATABASE_URL="your-postgresql-url"

# Optional Clerk Authentication (falls back to "demo-user" if left blank)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Local AI API Keys
GEMINI_API_KEY="your-gemini-key"
GROQ_API_KEY="your-groq-key"

# Background Worker Offloading (Optional, runs locally if left blank)
TRIGGER_SECRET_KEY=

# File Upload Providers
TRANSLOADIT_KEY=
TRANSLOADIT_SECRET=
TRANSLOADIT_TEMPLATE_ID=
```

### 3. Initialize the Database
```bash
npx prisma generate
npx prisma db push
```

### 4. Run the Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Running Unit Tests
NextFlow includes unit tests to verify the condition evaluation engine and the branch routing logic.
```bash
# Run tests once
npx vitest run

# Run tests in watch mode
npx vitest
```

---

## ⚙️ Trigger.dev Integration
For production-ready background workers:
```bash
npm run trigger:dev
```
If `TRIGGER_SECRET_KEY` is not set, the workflow will automatically fall back to local direct executions.
