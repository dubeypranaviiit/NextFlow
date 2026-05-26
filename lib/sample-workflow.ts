import type { PortType, Workflow, WorkflowEdge, WorkflowNode } from "@/types/workflow";

export const SYSTEM_WORKFLOW_NAME = "Trial Task Workflow";
export const SYSTEM_WORKFLOW_CARD_TITLE = "Trial Task Workflow";
export const systemWorkflowCardImage =
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=700&q=80";

const productPrompt =
  "Product: Luxury Sports Car. Features: Twin-turbo engine, aerodynamic design, premium leather interior, advanced digital cockpit.";
export function createBlankWorkflow(
  userId = "demo-user",
  name = "Untitled Workflow",
  idPrefix = `workflow-${Date.now()}`
): Workflow {
  return {
    id: idPrefix,
    name,
    description: "Blank workflow",
    userId,
    nodes: [
      {
        id: `${idPrefix}-request-inputs`,
        type: "request_inputs",
        position: { x: -240, y: 100 },
        data: {
          title: "Request Inputs",
          kind: "request_inputs",
          locked: true,
          fields: [{ id: "text_field", label: "text_field", kind: "text_field", value: "" }],
          outputs: [{ id: "text_field", label: "text_field", type: "text" }]
        }
      },
      {
        id: `${idPrefix}-response`,
        type: "response",
        position: { x: 580, y: 100 },
        data: {
          title: "Response",
          kind: "response",
          locked: true,
          inputs: [{ id: "result", label: "result", type: "any" }]
        }
      }
    ],
    edges: [],
    viewport: { x: 400, y: 300, zoom: 0.7 },
    updatedAt: new Date().toISOString(),
    status: "idle"
  };
}

export function createDefaultWorkflow(userId = "demo-user", idPrefix = "sample"): Workflow {
  const id = (value: string) => `${idPrefix}-${value}`;

  const geminiInputs = (promptConnected = true, imageConnected = false) => [
    { id: "prompt", label: "Prompt", type: "text" as const, connected: promptConnected },
    { id: "system_prompt", label: "System Prompt", type: "text" as const },
    { id: "image", label: "Image (Vision)", type: "image" as const, connected: imageConnected },
    { id: "video", label: "Video", type: "video" as const },
    { id: "audio", label: "Audio", type: "audio" as const },
    { id: "file", label: "File", type: "file" as const }
  ];

  const nodes: WorkflowNode[] = [
    {
      id: id("request-inputs"),
      type: "request_inputs",
      position: { x: -520, y: 105 },
      data: {
        title: "Request Inputs",
        kind: "request_inputs",
        locked: true,
        fields: [
          { id: "text_field", label: "text_field", kind: "text_field", value: productPrompt },
          {
            id: "image_field",
            label: "image_field",
            kind: "image_field",
            value: "",
            imageUrl: systemWorkflowCardImage
          }
        ],
        outputs: [
          { id: "text_field", label: "text_field", type: "text" },
          { id: "image_field", label: "image_field", type: "image" }
        ]
      }
    },
    {
      id: id("gemini-1"),
      type: "gemini",
      position: { x: -56, y: -310 },
      data: {
        title: "Gemini 3.1 Pro",
        kind: "gemini",
        model: "gemini-3.1-pro-preview",
        systemPrompt:
          "You are a marketing copywriter. Write a one-paragraph product description.",
        inputs: geminiInputs(true),
        outputs: [{ id: "response", label: "Response text", type: "text" }]
      }
    },
    {
      id: id("crop-1"),
      type: "crop_image",
      position: { x: -85, y: 44 },
      data: {
        title: "Crop Image",
        kind: "crop_image",
        inputs: [
          { id: "input_image", label: "Input Image", type: "image", connected: true },
          { id: "x", label: "X Position %", type: "number", value: 20 },
          { id: "y", label: "Y Position %", type: "number", value: 20 },
          { id: "width", label: "Width %", type: "number", value: 60 },
          { id: "height", label: "Height %", type: "number", value: 60 }
        ],
        outputs: [{ id: "output_image", label: "Output Image", type: "image" }]
      }
    },
    {
      id: id("crop-2"),
      type: "crop_image",
      position: { x: -85, y: 380 },
      data: {
        title: "Crop Image",
        kind: "crop_image",
        inputs: [
          { id: "input_image", label: "Input Image", type: "image", connected: true },
          { id: "x", label: "X Position %", type: "number", value: 0 },
          { id: "y", label: "Y Position %", type: "number", value: 0 },
          { id: "width", label: "Width %", type: "number", value: 100 },
          { id: "height", label: "Height %", type: "number", value: 50 }
        ],
        outputs: [{ id: "output_image", label: "Output Image", type: "image" }]
      }
    },
    {
      id: id("gemini-2"),
      type: "gemini",
      position: { x: 370, y: -220 },
      data: {
        title: "Gemini 3.1 Pro",
        kind: "gemini",
        model: "gemini-3.1-pro-preview",
        systemPrompt:
          "Condense the following product description into a tweet-length hook (under 240 characters).",
        inputs: geminiInputs(true),
        outputs: [{ id: "response", label: "Response text", type: "text" }]
      }
    },
    {
      id: id("gemini-final"),
      type: "gemini",
      position: { x: 780, y: 50 },
      data: {
        title: "Gemini 3.1 Pro",
        kind: "gemini",
        model: "gemini-3.1-pro-preview",
        systemPrompt:
          "You are a social media manager. Combine the tweet hook and the two product crops into a final marketing post.",
        inputs: geminiInputs(true, true),
        outputs: [{ id: "response", label: "Response text", type: "text" }]
      }
    },
    {
      id: id("response"),
      type: "response",
      position: { x: 1120, y: 120 },
      data: {
        title: "Response",
        kind: "response",
        locked: true,
        inputs: [{ id: "result", label: "result", type: "any", connected: true }]
      }
    }
  ];

  const edges: WorkflowEdge[] = [
    edge(id("request-inputs"), "image_field", id("crop-1"), "input_image", "image"),
    edge(id("request-inputs"), "image_field", id("crop-2"), "input_image", "image"),
    edge(id("request-inputs"), "text_field", id("gemini-1"), "prompt", "text"),
    edge(id("gemini-1"), "response", id("gemini-2"), "prompt", "text"),
    edge(id("gemini-2"), "response", id("gemini-final"), "prompt", "text"),
    edge(id("crop-1"), "output_image", id("gemini-final"), "image", "image"),
    edge(id("crop-2"), "output_image", id("gemini-final"), "image", "image"),
    edge(id("gemini-final"), "response", id("response"), "result", "text")
  ];

  return {
    id: "sample-workflow",
    name: SYSTEM_WORKFLOW_NAME,
    description: "Required sample workflow from the assignment",
    userId,
    nodes,
    edges,
    viewport: { x: 620, y: 360, zoom: 0.48 },
    updatedAt: new Date().toISOString(),
    status: "idle"
  };
}

function edge(
  source: string,
  sourceHandle: string,
  target: string,
  targetHandle: string,
  type: PortType
): WorkflowEdge {
  const color = type === "image" ? "#80aefb" : "#f5a83c";
  return {
    id: `${source}.${sourceHandle}-${target}.${targetHandle}`,
    source,
    sourceHandle,
    target,
    targetHandle,
    type: "smoothstep",
    animated: true,
    data: { type },
    style: { stroke: color }
  };
}
