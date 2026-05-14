"use client";

import { useState } from "react";
import { Check, ChevronDown, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

const languages = ["Python", "JavaScript", "cURL"] as const;
type Language = (typeof languages)[number];

function getPythonCode(workflowId: string): string {
  return `import requests
import time
import json

api_key = "YOUR_API_KEY"
url = "https://api.magica.com/api/v1/runs"

data = {
    "workflowId": "${workflowId}",
    "values": {
        "node_request": {
            "Car prompt": "your text here"
        }
    }
}

response = requests.post(
    url,
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    },
    json=data
)

result = response.json()
run_id = result["runId"]
print(f"Run started: {run_id}")


def poll_for_result(run_id):
    """Poll the API until the generation is complete"""
    poll_url = f"https://api.magica.com/api/v1/runs/{run_id}?inDetails=false"
    while True:
        response = requests.get(
            poll_url,
            headers={"Authorization": f"Bearer {api_key}"}
        )
        result = response.json()
        status = result.get("status")
        if status in ["COMPLETED", "FAILED", "CANCELLED"]:
            return result
        time.sleep(2)


final = poll_for_result(run_id)
print(json.dumps(final, indent=2))`;
}

function getJsCode(workflowId: string): string {
  return `const API_KEY = "YOUR_API_KEY";
const BASE = "https://api.magica.com/api/v1";

const res = await fetch(\`\${BASE}/runs\`, {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    workflowId: "${workflowId}",
    values: {
      node_request: {
        "Car prompt": "your text here"
      }
    }
  })
});

const { runId } = await res.json();
console.log("Run started:", runId);

// Poll for result
async function poll(runId) {
  while (true) {
    const r = await fetch(
      \`\${BASE}/runs/\${runId}?inDetails=true\`,
      { headers: { "Authorization": \`Bearer \${API_KEY}\` } }
    );
    const data = await r.json();
    if (["COMPLETED","FAILED","CANCELLED"].includes(data.status)) return data;
    await new Promise(r => setTimeout(r, 2000));
  }
}

const result = await poll(runId);
console.log(JSON.stringify(result, null, 2));`;
}

function getCurlCode(workflowId: string): string {
  return `# Start a run
curl -X POST https://api.magica.com/api/v1/runs \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "workflowId": "${workflowId}",
    "values": {
      "node_request": {
        "Car prompt": "your text here"
      }
    }
  }'

# Poll for result (replace RUN_ID)
curl https://api.magica.com/api/v1/runs/RUN_ID?inDetails=true \\
  -H "Authorization: Bearer YOUR_API_KEY"`;
}

export function ApiTab({ workflowId }: { workflowId: string }) {
  const [language, setLanguage] = useState<Language>("Python");
  const [langDropdown, setLangDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const code =
    language === "Python"
      ? getPythonCode(workflowId)
      : language === "JavaScript"
        ? getJsCode(workflowId)
        : getCurlCode(workflowId);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-[calc(100vh-144px)]">
      {/* Code panel */}
      <div className="flex w-1/2 flex-col border-r border-gray-200 bg-white">
        <div className="flex h-[44px] items-center justify-between border-b border-gray-100 px-4">
          {/* Language selector */}
          <div className="relative">
            <button
              className="flex h-7 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
              onClick={() => setLangDropdown(!langDropdown)}
            >
              {language}
              <ChevronDown size={11} className="text-gray-400" />
            </button>
            {langDropdown && (
              <div className="absolute left-0 top-8 z-20 w-[120px] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    className={cn(
                      "flex h-7 w-full items-center px-3 text-[12px] hover:bg-gray-50",
                      language === lang && "font-semibold text-galaxy-purple"
                    )}
                    onClick={() => {
                      setLanguage(lang);
                      setLangDropdown(false);
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium text-gray-600 hover:bg-gray-100"
            onClick={handleCopy}
          >
            {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-[#1e1e2e] p-4">
          <pre className="text-[12px] leading-6 text-gray-300">
            <code>
              {code.split("\n").map((line, i) => (
                <div key={i} className="flex">
                  <span className="mr-4 w-6 select-none text-right text-gray-600">
                    {i + 1}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap">{colorize(line)}</span>
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>

   
      <div className="flex-1 overflow-y-auto bg-white px-8 py-6">
        <h2 className="text-lg font-semibold text-gray-900">API Endpoint</h2>
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#f0fdf4] px-4 py-2.5">
          <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
            POST
          </span>
          <code className="text-[12px] font-medium text-emerald-800">
            https://api.magica.com/api/v1/runs
          </code>
        </div>

        <h3 className="mt-8 text-base font-semibold text-gray-900">Response Format</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-gray-600">
          The start endpoint returns a{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-mono text-pink-600">
            runId
          </code>
          . Poll{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-mono text-pink-600">
            GET /v1/runs/{"{runId}"}
          </code>{" "}
          to check status.
        </p>
        <pre className="mt-3 rounded-lg bg-gray-50 border border-gray-200 p-4 text-[12px] text-gray-700">
{`{
  "runId": "run_abc123..."
}`}
        </pre>

        <h3 className="mt-8 text-base font-semibold text-gray-900">Polling Response</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-gray-600">
          Poll{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-mono text-pink-600">
            GET /v1/runs/{"{runId}"}
          </code>{" "}
          until status is a terminal value:
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["QUEUED", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"].map((s) => (
            <span
              key={s}
              className={cn(
                "rounded-md px-2.5 py-1 text-[10px] font-bold",
                s === "COMPLETED" && "bg-emerald-100 text-emerald-700",
                s === "FAILED" && "bg-red-100 text-red-700",
                s === "CANCELLED" && "bg-orange-100 text-orange-700",
                s === "QUEUED" && "bg-gray-100 text-gray-600",
                s === "RUNNING" && "bg-blue-100 text-blue-700"
              )}
            >
              {s}
            </span>
          ))}
        </div>
        <div className="mt-4 rounded-lg bg-[#f0fdf4] px-4 py-2.5">
          <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
            GET
          </span>
          <code className="ml-2 text-[12px] font-medium text-emerald-800">
            /v1/runs/{"{runId}"}?inDetails=true
          </code>
        </div>

        <div className="mt-3 flex items-center gap-3 text-[12px] text-gray-500">
          <span className="font-medium">inDetails</span>
          <div className="flex h-5 w-9 items-center rounded-full bg-galaxy-purple p-0.5">
            <div className="h-4 w-4 rounded-full bg-white shadow-sm ml-auto" />
          </div>
          <span>true — all node runs</span>
        </div>

        <p className="mt-4 text-[12px] text-gray-500">Sample response:</p>
        <pre className="mt-2 rounded-lg bg-gray-50 border border-gray-200 p-4 text-[12px] text-gray-700">
{`{
  "id": "run_abc123...",
  "workflowId": "${workflowId}",
  "status": "COMPLETED",
  "nodeRuns": [...]
}`}
        </pre>
      </div>
    </div>
  );
}

function colorize(line: string): React.ReactNode {

  const keywords = /\b(import|from|def|return|while|if|in|True|False|None|const|let|var|async|await|function|curl)\b/g;
  const strings = /(["'`])(?:(?!\1).)*\1/g;
  const comments = /(#.*$|\/\/.*$)/g;

  if (comments.test(line)) {
    return <span className="text-gray-500">{line}</span>;
  }

  return line;
}
