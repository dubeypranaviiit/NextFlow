import type { PortType, Workflow, WorkflowEdge, WorkflowNode } from "@/types/workflow";

export const SYSTEM_WORKFLOW_NAME = "Trial Task Workflow";
export const SYSTEM_WORKFLOW_CARD_TITLE = "AI Racing Car Generator";
export const systemWorkflowCardImage =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=700&q=80";

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
          {
            id: "car_prompt",
            label: "Prompt (Text)",
            kind: "text_field",
            value:
              "Create a dramatic blue AI racing car on a mountain road, cinematic lighting, realistic details."
          },
          {
            id: "reference_image",
            label: "Reference image",
            kind: "image_field",
            value: "",
            imageUrl: systemWorkflowCardImage
          }
        ],
        outputs: [
          { id: "car_prompt", label: "Prompt (Text)", type: "text" },
          { id: "reference_image", label: "Reference image", type: "image" }
        ]
      }
    },
    {
      id: id("gemini-brief"),
      type: "gemini",
      position: { x: -56, y: -310 },
      data: {
        title: "Gemini 3.1 Pro",
        kind: "gemini",
        model: "Gemini 3.1 Pro",
        systemPrompt:
          "Expand the user prompt into a precise image-generation brief for an AI racing car.",
        inputs: geminiInputs(true),
        outputs: [{ id: "response", label: "Response text", type: "text" }]
      }
    },
    {
      id: id("crop-front"),
      type: "crop_image",
      position: { x: -85, y: 44 },
      data: {
        title: "Crop Image",
        kind: "crop_image",
        inputs: [
          { id: "input_image", label: "Input Image", type: "image", connected: true },
          { id: "x", label: "X Position %", type: "number", value: 10 },
          { id: "y", label: "Y Position %", type: "number", value: 35 },
          { id: "width", label: "Width %", type: "number", value: 70 },
          { id: "height", label: "Height %", type: "number", value: 45 }
        ],
        outputs: [{ id: "output_image", label: "Output Image", type: "image" }]
      }
    },
    {
      id: id("crop-wide"),
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
          { id: "height", label: "Height %", type: "number", value: 55 }
        ],
        outputs: [{ id: "output_image", label: "Output Image", type: "image" }]
      }
    },
    {
      id: id("gemini-style"),
      type: "gemini",
      position: { x: 370, y: -220 },
      data: {
        title: "Gemini 3.1 Pro",
        kind: "gemini",
        model: "Gemini 3.1 Pro",
        systemPrompt:
          "Turn the brief into a production-ready prompt with camera angle, car details, background, and lighting.",
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
        model: "Gemini 3.1 Pro",
        systemPrompt:
          "Combine the prompt and reference crops into a final AI racing car generation instruction.",
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
    edge(id("request-inputs"), "car_prompt", id("gemini-brief"), "prompt", "text"),
    edge(id("request-inputs"), "reference_image", id("crop-front"), "input_image", "image"),
    edge(id("request-inputs"), "reference_image", id("crop-wide"), "input_image", "image"),
    edge(id("gemini-brief"), "response", id("gemini-style"), "prompt", "text"),
    edge(id("gemini-style"), "response", id("gemini-final"), "prompt", "text"),
    edge(id("crop-front"), "output_image", id("gemini-final"), "image", "image"),
    edge(id("crop-wide"), "output_image", id("gemini-final"), "image", "image"),
    edge(id("gemini-final"), "response", id("response"), "result", "text")
  ];

  return {
    id: "sample-workflow",
    name: SYSTEM_WORKFLOW_NAME,
    description: "Prebuilt AI racing car generation workflow",
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
