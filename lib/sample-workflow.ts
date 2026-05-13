import type { PortType, Workflow, WorkflowEdge, WorkflowNode } from "@/types/workflow";

export const sampleImageUrl =
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80";

export function createDefaultWorkflow(userId = "demo-user"): Workflow {
  const nodes: WorkflowNode[] = [
    {
      id: "request-inputs",
      type: "request_inputs",
      position: { x: -520, y: 105 },
      data: {
        title: "Request Inputs",
        kind: "request_inputs",
        locked: true,
        fields: [
          {
            id: "text_field",
            label: "text_field",
            kind: "text_field",
            value: "Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design."
          },
          {
            id: "image_field",
            label: "image_field",
            kind: "image_field",
            value: "",
            imageUrl: sampleImageUrl
          }
        ],
        outputs: [
          { id: "text_field", label: "text_field", type: "text" },
          { id: "image_field", label: "image_field", type: "image" }
        ]
      }
    },
    {
      id: "crop-1",
      type: "crop_image",
      position: { x: -115, y: 44 },
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
      id: "crop-2",
      type: "crop_image",
      position: { x: -115, y: 352 },
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
      id: "gemini-1",
      type: "gemini",
      position: { x: -86, y: -290 },
      data: {
        title: "Gemini 3.1 Pro",
        kind: "gemini",
        model: "Gemini 3.1 Pro",
        systemPrompt: "You are a marketing copywriter. Write a one-paragraph product description.",
        prompt: "",
        inputs: [
          { id: "prompt", label: "Prompt", type: "text", connected: true },
          { id: "system_prompt", label: "System Prompt", type: "text", value: "You are a marketing copywriter. Write a one-paragraph product description." },
          { id: "image", label: "Image (Vision)", type: "image" },
          { id: "video", label: "Video", type: "video" },
          { id: "audio", label: "Audio", type: "audio" },
          { id: "file", label: "File", type: "file" }
        ],
        outputs: [{ id: "response", label: "Response text", type: "text" }]
      }
    },
    {
      id: "gemini-2",
      type: "gemini",
      position: { x: 330, y: -198 },
      data: {
        title: "Gemini 3.1 Pro",
        kind: "gemini",
        model: "Gemini 3.1 Pro",
        systemPrompt: "Condense the following product description into a tweet-length hook under 240 characters.",
        inputs: [
          { id: "prompt", label: "Prompt", type: "text", connected: true },
          { id: "system_prompt", label: "System Prompt", type: "text", value: "Condense the following product description into a tweet-length hook under 240 characters." },
          { id: "image", label: "Image (Vision)", type: "image" },
          { id: "video", label: "Video", type: "video" },
          { id: "audio", label: "Audio", type: "audio" },
          { id: "file", label: "File", type: "file" }
        ],
        outputs: [{ id: "response", label: "Response text", type: "text" }]
      }
    },
    {
      id: "gemini-final",
      type: "gemini",
      position: { x: 750, y: 92 },
      data: {
        title: "Gemini 3.1 Pro",
        kind: "gemini",
        model: "Gemini 3.1 Pro",
        systemPrompt: "You are a social media manager. Combine the tweet hook and cropped product images into a final marketing post.",
        inputs: [
          { id: "prompt", label: "Prompt", type: "text", connected: true },
          { id: "system_prompt", label: "System Prompt", type: "text", value: "You are a social media manager. Combine the tweet hook and cropped product images into a final marketing post." },
          { id: "image", label: "Image (Vision)", type: "image", connected: true },
          { id: "video", label: "Video", type: "video" },
          { id: "audio", label: "Audio", type: "audio" },
          { id: "file", label: "File", type: "file" }
        ],
        outputs: [{ id: "response", label: "Response text", type: "text" }]
      }
    },
    {
      id: "response",
      type: "response",
      position: { x: 1168, y: 150 },
      data: {
        title: "Response",
        kind: "response",
        locked: true,
        inputs: [{ id: "result", label: "result", type: "any", connected: true }]
      }
    }
  ];

  const edges: WorkflowEdge[] = [
    edge("request-inputs", "image_field", "crop-1", "input_image", "image"),
    edge("request-inputs", "image_field", "crop-2", "input_image", "image"),
    edge("request-inputs", "text_field", "gemini-1", "prompt", "text"),
    edge("gemini-1", "response", "gemini-2", "prompt", "text"),
    edge("crop-1", "output_image", "gemini-final", "image", "image"),
    edge("crop-2", "output_image", "gemini-final", "image", "image"),
    edge("gemini-2", "response", "gemini-final", "prompt", "text"),
    edge("gemini-final", "response", "response", "result", "text")
  ];

  return {
    id: "sample-workflow",
    name: "AI Racing Car Generator C...",
    description: "Sample LLM workflow",
    userId,
    nodes,
    edges,
    viewport: { x: 620, y: 340, zoom: 0.62 },
    updatedAt: new Date().toISOString(),
    status: "idle"
  };
}

function edge(source: string, sourceHandle: string, target: string, targetHandle: string, type: PortType): WorkflowEdge {
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
