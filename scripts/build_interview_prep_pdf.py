from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


OUTPUT = "NextFlow_Assignment_Interview_Prep.pdf"


def p(text, style):
    return Paragraph(text.replace("&", "&amp;"), style)


def bullets(items, style):
    return ListFlowable(
        [ListItem(p(item, style), leftIndent=12) for item in items],
        bulletType="bullet",
        leftIndent=18,
        bulletFontName="Helvetica",
        bulletFontSize=8,
    )


def qa(question, answer):
    return {"q": question, "a": answer}


sections = [
    {
        "title": "One-Minute Project Pitch",
        "intro": "Use this answer when they ask: Tell me about your assignment.",
        "items": [
            qa(
                "What did you build?",
                "I built NextFlow, a Galaxy.ai-style workflow builder for LLM and image workflows. It has Clerk authentication, a dashboard for managing workflows, a React Flow canvas for connecting nodes, and run history for each execution.",
            ),
            qa(
                "What is the main assignment requirement?",
                "The assignment required three main pages: Clerk sign-in/sign-up, dashboard, and workflow canvas. It also required a sample workflow with Request Inputs, Crop Image nodes, Gemini LLM nodes, Response node, Trigger.dev execution, PostgreSQL persistence, run history, DAG execution, and a mandatory 30-second delay on Crop Image.",
            ),
            qa(
                "Short pitch to memorize",
                "NextFlow lets a signed-in user create, connect, run, and inspect AI workflow graphs. The backend executes the graph in dependency order, runs independent branches in parallel, calls image/LLM tasks, and stores node-level results in PostgreSQL.",
            ),
        ],
    },
    {
        "title": "Requirement Checklist",
        "intro": "These are the points to mention if they ask whether the assignment is complete.",
        "items": [
            qa("Auth pages", "Clerk sign-in and sign-up are implemented. Protected app routes redirect unauthenticated users to sign in."),
            qa("Dashboard", "The dashboard lists workflows, shows last edited time/status, supports create/open/rename/delete/import, and includes the required sample workflow card."),
            qa("Canvas", "The workflow canvas uses React Flow for draggable nodes, handles, edges, viewport controls, minimap behavior, and graph editing."),
            qa("Required nodes", "Request Inputs, Crop Image, Gemini/Groq LLM, and Response nodes are implemented. Groq is included because the assignment allowed other providers."),
            qa("Sample workflow", "The Trial Task Workflow is prebuilt with request inputs, two crop branches, multiple LLM steps, and a final response."),
            qa("Execution", "Execution uses DAG/topological batching so independent nodes can run in parallel while respecting dependencies."),
            qa("History", "Each workflow run is persisted with node-level status, duration, output, and errors."),
            qa("Persistence", "PostgreSQL and Prisma store users, workflows, nodes, edges, runs, and node runs."),
            qa("Deployment", "The app is deployed on Vercel and configured through environment variables."),
        ],
    },
    {
        "title": "Architecture",
        "intro": "Explain the system from frontend to backend.",
        "items": [
            qa(
                "What is the high-level architecture?",
                "Next.js App Router handles pages and API routes. React components render the dashboard and workflow UI. Zustand stores client-side workflow state. React Flow renders the graph. API routes persist workflows and execute runs. Prisma talks to PostgreSQL. Clerk handles auth. Trigger.dev handles long-running/background tasks.",
            ),
            qa("Why Next.js?", "It gives frontend routes, server-side API routes, middleware, deployment support on Vercel, and a clean App Router structure in one project."),
            qa("Why React Flow?", "React Flow is built for node editors. It provides nodes, handles, edges, viewport, dragging, connection events, and minimap support so I did not have to build graph canvas primitives from scratch."),
            qa("Why Zustand?", "Zustand is lightweight and works well for shared canvas state across toolbar, node panels, history panel, and the workflow builder without Redux boilerplate."),
            qa("Why Prisma and PostgreSQL?", "The assignment required persistence. Prisma gives a typed schema and clean relational API, while PostgreSQL handles relational records plus JSONB fields for flexible node and edge data."),
            qa("Why Trigger.dev?", "Crop Image has a required 30-second artificial delay and execution tasks can be long-running. Trigger.dev is designed for background/long-running jobs and gives task logs and retry behavior."),
        ],
    },
    {
        "title": "Important File Map",
        "intro": "If they ask you to open code live, know where to go.",
        "items": [
            qa("app/api/execute/route.ts", "Main workflow execution route. It validates user/workflow, creates a WorkflowRun, executes nodes in DAG batches, and stores NodeRun results."),
            qa("server/execution/dag.ts", "Contains the topological batching logic used to decide execution order."),
            qa("trigger/crop-image.ts", "Trigger.dev task for Crop Image. It waits 30 seconds, crops using Sharp, and returns output image data."),
            qa("trigger/gemini.ts", "Trigger.dev task for Gemini execution and multimodal handling."),
            qa("trigger/groq.ts", "Trigger.dev task for Groq text generation with fallback models."),
            qa("prisma/schema.prisma", "Database models for User, Workflow, WorkflowNode, WorkflowEdge, WorkflowRun, and NodeRun."),
            qa("store/workflow-store.ts", "Client workflow state: nodes, edges, viewport, add/delete/connect nodes, save workflow."),
            qa("features/workflow", "Workflow builder UI, nodes, tabs, toolbar, panels, and history."),
            qa("features/dashboard", "Dashboard and Galaxy shell/profile UI."),
            qa("middleware.ts", "Route protection and redirect behavior for unauthenticated users."),
        ],
    },
    {
        "title": "Workflow Execution Deep Dive",
        "intro": "This is the most important interview topic.",
        "items": [
            qa(
                "What happens when the user clicks Run?",
                "The frontend sends the workflow graph and selected scope to /api/execute. The backend checks the current user, verifies the workflow belongs to that user, creates a WorkflowRun, computes topological batches, executes each batch, stores node results, and returns the run summary to the UI.",
            ),
            qa(
                "What is a DAG?",
                "A DAG is a Directed Acyclic Graph. In this app, nodes are workflow steps and directed edges represent dependencies. Acyclic means there should be no circular dependency.",
            ),
            qa(
                "What is topological sorting?",
                "Topological sorting orders graph nodes so every node runs after its dependencies. In this app I use topological batching, which groups nodes that are ready at the same dependency level.",
            ),
            qa(
                "How do you run nodes in parallel?",
                "After computing a ready batch, nodes in that batch have no unresolved dependencies between them. I run them with Promise.all, so independent branches like the two crop nodes can execute at the same time.",
            ),
            qa(
                "What happens if a node fails?",
                "The node result is marked failed with its error message. Downstream nodes depending on it fail with an upstream dependency error. Independent branches can still complete if they do not depend on the failed node.",
            ),
            qa("How are node inputs resolved?", "Each target input checks incoming edges by targetHandle. The source node output is read from the nodeOutputs map. Request Inputs are special because their field values are read directly from node data."),
            qa("Why store outputs in a map?", "The execution route needs fast lookup of upstream results while executing downstream nodes."),
            qa("Why truncate stored output?", "LLM output and image data can be large. Truncating keeps run history readable and prevents unnecessarily large database records."),
            qa("Can disconnected nodes run?", "If included in the execution scope and they have no dependencies, they can appear in an early batch. In a production version I would add stronger validation around disconnected or invalid graph segments."),
            qa("How would you prevent cycles?", "Use cycle detection during edge creation or before execution. If topological processing cannot consume all selected nodes, the graph has a cycle and execution should be rejected with a clear error."),
        ],
    },
    {
        "title": "Crop Image Node",
        "intro": "Know this well because the assignment explicitly required the delay.",
        "items": [
            qa("Why does Crop Image wait 30 seconds?", "The assignment specifically required Crop Image to add an artificial 30-second delay before returning."),
            qa("Where is the delay implemented?", "It exists in the crop execution path and Trigger.dev crop task before the Sharp image processing work."),
            qa("What inputs does Crop Image accept?", "It accepts an input image URL or data URL, plus x, y, width, and height values as percentages."),
            qa("How does cropping work?", "The image is loaded into a buffer, Sharp reads the metadata, percentage crop values are converted into pixel dimensions, bounds are clamped, and Sharp extracts the selected region as PNG."),
            qa("Why Sharp?", "Sharp is fast, widely used, and reliable for server-side image processing in Node.js."),
            qa("What does Crop Image return?", "It returns a PNG as a base64 data URL so the next node can consume it as an image input."),
            qa("What happens if the input image is invalid?", "The image fetch/load fails and the node is marked failed with an error in run history."),
            qa("How are crop bounds handled?", "Coordinates and dimensions are clamped so the crop area stays inside the source image and has at least 1 pixel width/height."),
        ],
    },
    {
        "title": "Gemini and Groq",
        "intro": "Answer confidently why both providers exist.",
        "items": [
            qa("Why Gemini?", "Gemini is used for multimodal and vision-style workflow steps, especially when image inputs are connected."),
            qa("Why Groq?", "Groq is used for fast text generation. The assignment allowed other AI providers, so Groq is acceptable for text-focused LLM use cases."),
            qa("Can Groq process images?", "No, Groq text models do not process images in this implementation. Image/vision work should go through Gemini."),
            qa("How is Gemini called?", "The code builds a request with text parts and optional inline image parts, then calls the Gemini generate content API or Trigger task."),
            qa("How is Groq called?", "The code sends chat messages to Groq's OpenAI-compatible chat completions endpoint with system and user messages."),
            qa("How do you handle rate limits?", "Groq tries fallback models when the response is 429. Gemini route can try fallback Gemini models or return a clear rate-limit error."),
            qa("Where are API keys stored?", "API keys are stored in environment variables and must not be committed to GitHub."),
            qa("How would you secure keys in production?", "Use Vercel environment variables, rotate exposed keys, restrict provider key permissions where possible, and never expose server API keys to client code."),
            qa("What caused the 401 issue in the review?", "The screenshot showed Crop Image and LLM failing with 401 Invalid API key. Since Crop Image also failed, it was most likely Trigger.dev auth configuration, not only Gemini/Groq."),
            qa("What did you change after the 401 feedback?", "I validated Trigger key type, ensured the correct Trigger project API key is used instead of a personal token, and verified env configuration locally before redeploying."),
        ],
    },
    {
        "title": "Trigger.dev",
        "intro": "Be ready for questions on development mode and keys.",
        "items": [
            qa("What Trigger tasks did you create?", "Crop Image, Gemini, and Groq tasks."),
            qa("What is Trigger mode?", "In Trigger mode, the execution route triggers Trigger.dev tasks and polls their completion."),
            qa("What is local mode?", "In local mode or fallback mode, the same work runs directly inside the Next.js API route for development/debugging."),
            qa("Why have local fallback?", "It keeps development and demos from being completely blocked by external task auth problems, while still allowing Trigger.dev for real long-running tasks."),
            qa("Would you keep fallback in production?", "I would keep it only if explicitly intended. In production, I would prefer strict Trigger mode so execution behavior is predictable and operationally observable."),
            qa("Personal token vs project key?", "A personal token is for account-level CLI/API actions. A project runtime API key is what the app should use to trigger and run tasks for that project."),
            qa("How do you poll Trigger completion?", "After triggering a task, the execution route polls the run handle until the task completes or fails, then stores the result/error."),
            qa("Is development mode okay?", "For a trial assignment demo, Clerk/Trigger development mode is generally okay if the deployed flow works. For production, switch to production instances and keys."),
        ],
    },
    {
        "title": "Authentication and User Profile",
        "intro": "This directly addresses HR's feedback.",
        "items": [
            qa("How is auth implemented?", "Clerk handles sign-in/sign-up. Middleware protects app and API routes. Server routes use Clerk auth to identify the current user."),
            qa("Which routes are protected?", "Dashboard, workflow pages, workflow APIs, run APIs, execute/import APIs, and provider/upload APIs are protected."),
            qa("How do you show the actual user?", "The sidebar uses Clerk's useUser hook to display the signed-in user's full name, first name, email, and avatar image."),
            qa("What was the profile issue HR mentioned?", "The recording made the profile look like a developer/demo profile. The fix is to display the actual logged-in Clerk user in the app UI and show it clearly in the demo."),
            qa("How is user data scoped on backend?", "API routes get the current user ID and query/update workflows using both workflow ID and user ID. This prevents one user from reading or changing another user's workflows."),
            qa("What happens if Clerk keys are missing?", "The app has a demo fallback for local development. In deployed assignment/demo mode, Clerk keys should be present so the real auth flow is used."),
            qa("Why did you shorten sign-in URL?", "Protected route redirects were producing long encoded redirect URLs. I changed the middleware to redirect unauthenticated users to plain /sign-in for a cleaner demo flow."),
        ],
    },
    {
        "title": "Database and Prisma",
        "intro": "Memorize the models and why they exist.",
        "items": [
            qa("What database models exist?", "User, Workflow, WorkflowNode, WorkflowEdge, WorkflowRun, and NodeRun."),
            qa("Why separate WorkflowNode and WorkflowEdge?", "Nodes and edges are separate graph entities. This makes it easy to update positions, data, and connections independently while preserving graph structure."),
            qa("What is stored in Workflow?", "Workflow owner, name, description, viewport, status, timestamps, and relations to nodes, edges, and runs."),
            qa("What is stored in WorkflowNode?", "Node ID, workflow ID, type, position JSON, node data JSON, and timestamps."),
            qa("What is stored in WorkflowEdge?", "Edge ID, workflow ID, source, target, handles, edge data, and timestamp."),
            qa("What is WorkflowRun?", "A single execution attempt for a workflow. It stores scope, state, inputs, start time, duration, and NodeRun children."),
            qa("What is NodeRun?", "A per-node execution record containing node ID/title, state, duration, output, error, and start time."),
            qa("Why JSONB fields?", "Node data, positions, viewport, edge metadata, and outputs vary by node type. JSONB keeps the schema flexible while PostgreSQL still stores it efficiently."),
            qa("What are indexes for?", "Indexes on userId and workflowId speed up common queries like listing a user's workflows and fetching run history for a workflow."),
            qa("Why migrations?", "Migrations make the database schema reproducible for reviewers, deployment, and future environments."),
        ],
    },
    {
        "title": "Frontend and State",
        "intro": "Explain how the UI stays interactive.",
        "items": [
            qa("What is stored in Zustand?", "Workflow graph data, nodes, edges, viewport, selected state, panels, and actions like add node, delete node, connect edges, and save workflow."),
            qa("Why not only React local state?", "Many components need the same workflow state: toolbar, canvas, panels, node picker, and history. Zustand provides shared state without prop drilling."),
            qa("How do users add nodes?", "The node picker calls the store's addNode action, which creates a typed node object with default inputs/outputs and inserts it near the current viewport."),
            qa("How do users connect nodes?", "React Flow connection events create edges. The store validates source/target compatibility and saves the edge with sourceHandle and targetHandle."),
            qa("How is history shown?", "The history panel fetches workflow runs and displays each run's node-level status, duration, output, and error details."),
            qa("How does import/export work?", "A workflow can be serialized as JSON and imported back through an API route that creates corresponding workflow, node, and edge records."),
            qa("How did you match Galaxy.ai UI?", "I mirrored the required layout: auth entry, dashboard shell/sidebar, workflow card layout, canvas, node UI, history panel, and visual styling from the reference."),
        ],
    },
    {
        "title": "API Routes",
        "intro": "Short answers for route-by-route code review.",
        "items": [
            qa("/api/execute", "Runs workflows. It performs auth, ownership check, run creation, DAG batch execution, task execution, error handling, and result persistence."),
            qa("/api/workflows", "Lists workflows for the current user and creates new blank workflows."),
            qa("/api/workflows/[id]", "Fetches, updates, or deletes a workflow after checking ownership."),
            qa("/api/workflows/seed", "Creates or repairs the required Trial Task Workflow for the current user."),
            qa("/api/runs", "Lists run history for workflows."),
            qa("/api/runs/[id]", "Fetches a specific run with node-level details."),
            qa("/api/import", "Imports workflow JSON and creates corresponding database records."),
            qa("/api/crop", "Direct/local crop endpoint with auth and 30-second delay."),
            qa("/api/gemini", "Direct Gemini API endpoint for LLM/vision generation."),
            qa("/api/groq", "Direct Groq API endpoint for text generation."),
            qa("/api/transloadit/upload", "Handles image upload through Transloadit with server-side signing."),
        ],
    },
    {
        "title": "Error Handling and Debugging",
        "intro": "Use these for questions about failures.",
        "items": [
            qa("How are node errors handled?", "Each node execution is wrapped in try/catch. Failures are captured as node-level errors and stored as NodeRun records."),
            qa("How did you debug the 401 issue?", "I looked at which nodes failed. Since Crop Image and LLM both showed 401, the shared failure path was Trigger.dev auth. Then I checked environment key types and added validation around Trigger key configuration."),
            qa("How are missing env vars handled?", "Routes check required environment variables and return clear errors. Trigger configuration also rejects a personal access token used in place of a runtime project key."),
            qa("How does the UI show failure?", "Run history displays failed node status, duration, and error message so the reviewer can identify the exact failing step."),
            qa("What if one Promise in Promise.all fails?", "Each node's async function catches its own error and returns a failed result object, so one rejected provider call does not crash the entire batch unexpectedly."),
            qa("What edge cases would you test?", "Missing API keys, invalid image URL, graph cycle, disconnected node, failed upstream dependency, invalid workflow ID, unauthorized workflow access, and provider rate limit."),
        ],
    },
    {
        "title": "Security",
        "intro": "They may push on API keys and auth.",
        "items": [
            qa("How do you protect secrets?", "Secrets live in environment variables, not client code or Git. .env is ignored, and Vercel environment variables are used for deployment."),
            qa("What if keys were exposed?", "Rotate them immediately in the provider dashboards and update Vercel/local env values."),
            qa("How do you prevent unauthorized access?", "Every protected API route checks the current Clerk user and scopes queries by userId."),
            qa("What is SSRF risk here?", "Fetching arbitrary image URLs from the server could be abused to reach internal resources. In production I would validate URL schemes, block private IP ranges, limit file size, and proxy uploads through controlled storage."),
            qa("How would you rate limit execution?", "Add per-user rate limits, execution quotas, provider spend limits, and queue-level controls."),
            qa("How would you secure uploads?", "Validate file type/size, scan or sanitize inputs, store in object storage, use signed URLs, and avoid trusting arbitrary remote URLs."),
        ],
    },
    {
        "title": "Performance and Production Improvements",
        "intro": "Good answers for senior-style follow-up.",
        "items": [
            qa("Why run nodes in parallel?", "It reduces total run time for independent branches. For example, two crop nodes with 30-second waits should complete in about 30 seconds together, not 60 seconds sequentially."),
            qa("Could API routes time out?", "Yes, long-running synchronous work can hit platform limits. Trigger.dev is a better fit for long tasks and production execution."),
            qa("How would you improve live progress?", "Use webhooks, server-sent events, polling, or realtime subscriptions to update node states as tasks complete instead of waiting for the full run response."),
            qa("How would you optimize image storage?", "Do not store large base64 images in the database. Store images in object storage and save URLs/metadata in the DB."),
            qa("How would you scale for many users?", "Move execution to background queues, use provider quotas, add indexes, store assets externally, cache static workflow data, and stream run updates."),
            qa("What would you improve next?", "Production Clerk/Trigger keys, stronger cycle validation, better live progress, more tests, object storage for outputs, and observability around task execution."),
        ],
    },
    {
        "title": "Testing",
        "intro": "Be honest but show you know what should be tested.",
        "items": [
            qa("What checks did you run?", "I ran lint, TypeScript typecheck, production build, and Prisma schema validation."),
            qa("How would you unit test DAG execution?", "Create small graphs with known dependencies and assert that topological batches match expected levels. Test parallel branches, single chain, cycle, and disconnected nodes."),
            qa("How would you test API routes?", "Mock Clerk auth, Prisma, and providers. Verify unauthorized access, ownership checks, success paths, and error responses."),
            qa("How would you test provider calls?", "Mock fetch responses for success, 401 invalid key, 429 rate limit, and malformed responses."),
            qa("How would you test UI?", "Use Playwright to sign in, open dashboard, open sample workflow, run it, and confirm history output/status appears."),
            qa("What would you test for security?", "Attempt accessing another user's workflow ID, missing auth, invalid imports, huge payloads, and malicious image URLs."),
        ],
    },
    {
        "title": "Live Interview Questions and Model Answers",
        "intro": "These are likely quick-fire questions.",
        "items": [
            qa("Show me where execution happens.", "Open app/api/execute/route.ts. The POST handler creates the run, computes batches, executes nodes, and persists results."),
            qa("Show me where the 30-second delay is.", "Open trigger/crop-image.ts and the local crop path in app/api/execute/route.ts. The delay runs before Sharp crops the image."),
            qa("Show me where parallel execution happens.", "In app/api/execute/route.ts, each topological batch is run with Promise.all."),
            qa("Show me where the signed-in profile is displayed.", "Open features/dashboard/galaxy-shell.tsx. It uses useUser() to render name, email, and avatar."),
            qa("Show me where user auth is checked.", "Open middleware.ts for route protection and lib/current-user.ts for backend user resolution."),
            qa("Show me the database schema.", "Open prisma/schema.prisma and explain each model and relation."),
            qa("Show me where Groq is called.", "Open trigger/groq.ts or app/api/groq/route.ts. The request goes to Groq's OpenAI-compatible chat completions endpoint."),
            qa("Show me where Gemini image input is handled.", "Open trigger/gemini.ts or app/api/execute/route.ts. Image URLs are converted into inline Gemini image parts."),
            qa("Show me where history is saved.", "In app/api/execute/route.ts, after execution, WorkflowRun is updated and NodeRun records are created."),
            qa("Show me import/export.", "Open app/api/import/route.ts and the workflow UI/API tab where export/import actions are exposed."),
        ],
    },
    {
        "title": "Production-Ready Answer Bank",
        "intro": "Use these when they ask what you would do differently.",
        "items": [
            qa("If this went to production tomorrow, what changes first?", "Use production Clerk and Trigger environments, rotate keys, remove demo fallbacks, add strict cycle validation, object storage for images, better run progress updates, rate limiting, and monitoring."),
            qa("What observability would you add?", "Structured logs per run/node, provider latency metrics, failure rate dashboards, Trigger task logs, and alerts for 401/429/provider errors."),
            qa("What would you change about data storage?", "Store image outputs in S3/R2/Blob storage instead of base64 in DB. Keep DB records to URLs, metadata, status, and text outputs."),
            qa("How would you handle retries?", "Retry transient provider failures with backoff, but avoid retrying validation/auth errors. Configure retry policy per node type."),
            qa("How would you handle cancellation?", "Add run cancellation state, propagate cancellation to Trigger tasks if supported, and stop scheduling downstream batches."),
            qa("How would you handle collaboration?", "Add organizations/team memberships, workflow sharing permissions, audit logs, and role-based access control."),
        ],
    },
    {
        "title": "Answers to HR Feedback",
        "intro": "Use this if they ask about the earlier review comments.",
        "items": [
            qa("What was the execution issue?", "The recording showed 401 Invalid API key. Because Crop Image also failed, I traced it to Trigger.dev key configuration rather than only Groq/Gemini."),
            qa("How did you fix execution?", "I configured the correct Trigger project API key, added validation against using personal tokens in the runtime path, and verified the workflow execution flow again."),
            qa("What was the profile issue?", "The profile in the demo should represent the actual signed-in app user, not a developer/deployment identity."),
            qa("How did you fix profile?", "The app sidebar and account menu now read Clerk's signed-in user through useUser() and display real name/email/avatar."),
            qa("Why are Clerk/Trigger in development mode?", "This is a trial assignment demo, so development/test mode is acceptable for demonstration. For production, I would switch both to production instances and keys."),
        ],
    },
]


def draw_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#6B7280"))
    canvas.drawRightString(7.5 * inch, 0.45 * inch, f"Page {doc.page}")
    canvas.restoreState()


def build():
    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=LETTER,
        rightMargin=0.7 * inch,
        leftMargin=0.7 * inch,
        topMargin=0.65 * inch,
        bottomMargin=0.65 * inch,
    )
    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "GuideTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=25,
        leading=31,
        textColor=colors.HexColor("#111827"),
        spaceAfter=12,
        alignment=TA_LEFT,
    )
    subtitle = ParagraphStyle(
        "GuideSubtitle",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=15,
        textColor=colors.HexColor("#374151"),
        spaceAfter=18,
    )
    h1 = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#312E81"),
        spaceBefore=16,
        spaceAfter=7,
    )
    qstyle = ParagraphStyle(
        "Question",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=9.6,
        leading=13,
        textColor=colors.HexColor("#111827"),
        spaceBefore=6,
        spaceAfter=2,
    )
    astyle = ParagraphStyle(
        "Answer",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.1,
        leading=12.6,
        textColor=colors.HexColor("#374151"),
        spaceAfter=5,
    )
    small = ParagraphStyle(
        "Small",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.6,
        leading=12,
        textColor=colors.HexColor("#4B5563"),
        spaceAfter=5,
    )
    callout = ParagraphStyle(
        "Callout",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#1F2937"),
        backColor=colors.HexColor("#EEF2FF"),
        borderPadding=8,
        spaceBefore=5,
        spaceAfter=10,
    )

    story = [
        p("NextFlow Assignment Interview Prep", title),
        p("Complete follow-up question bank with answers for the Galaxy.ai workflow builder assignment.", subtitle),
        p(
            "Core memory path: User signs in -> opens dashboard -> opens Trial Task Workflow -> runs graph -> backend executes DAG batches -> tasks call providers -> history stores node results -> UI displays output/errors.",
            callout,
        ),
        p("Quick Things To Say First", h1),
        bullets(
            [
                "I built a Galaxy.ai-style LLM/image workflow builder using Next.js, React Flow, Clerk, Prisma/PostgreSQL, Trigger.dev, Gemini, and Groq.",
                "The most important technical part is DAG-based workflow execution with parallel batches.",
                "The required Crop Image node waits 30 seconds before returning.",
                "Run history stores node-level status, duration, output, and errors.",
                "Auth and data access are scoped to the actual signed-in Clerk user.",
            ],
            small,
        ),
        Spacer(1, 8),
    ]

    overview_rows = [
        ["Area", "What to remember"],
        ["Frontend", "Next.js App Router, React Flow canvas, Zustand state, Tailwind UI"],
        ["Backend", "Next.js API routes, Prisma, PostgreSQL, protected routes"],
        ["Execution", "Topological/DAG batching, Promise.all for parallel nodes, node-level error capture"],
        ["Tasks", "Trigger.dev tasks for crop, Gemini, Groq; local fallback for development"],
        ["Auth", "Clerk sign-in/sign-up, useUser profile, server auth scoping"],
        ["Fixes", "Correct API key config, actual user profile, clean sign-in URL, lint/build readiness"],
    ]
    table = Table(overview_rows, colWidths=[1.35 * inch, 5.55 * inch], hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#312E81")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("LEADING", (0, 0), (-1, -1), 11),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CBD5E1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.append(table)
    story.append(PageBreak())

    for idx, section in enumerate(sections):
        story.append(p(section["title"], h1))
        story.append(p(section["intro"], small))
        for item in section["items"]:
            story.append(p("Q: " + item["q"], qstyle))
            story.append(p("A: " + item["a"], astyle))
        if idx in {3, 7, 12}:
            story.append(PageBreak())

    story.append(PageBreak())
    story.append(p("Final 30-Second Closing Answer", h1))
    story.append(
        p(
            "Yes, the assignment requirements are covered. The app has Clerk auth, dashboard, workflow canvas, required node types, a prebuilt Trial Task Workflow, DAG-based execution with parallel branches, a 30-second Crop Image delay, Trigger.dev task integration, Prisma/PostgreSQL persistence, and run history with node-level results. Groq is included for allowed fast text generation, while Gemini handles multimodal/vision-style steps. For production I would switch Clerk and Trigger to production mode, add stronger graph validation, object storage for image outputs, live run updates, rate limiting, and more automated tests.",
            callout,
        )
    )

    doc.build(story, onFirstPage=draw_page_number, onLaterPages=draw_page_number)


if __name__ == "__main__":
    build()
