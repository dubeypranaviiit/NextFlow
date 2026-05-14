import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const authKey = process.env.TRANSLOADIT_KEY;
  const authSecret = process.env.TRANSLOADIT_SECRET;
  const templateId = process.env.TRANSLOADIT_TEMPLATE_ID;
  if (!authKey || !authSecret || !templateId) {
    return NextResponse.json({ error: "Transloadit is not configured" }, { status: 500 });
  }

  const incoming = await request.formData();
  const file = incoming.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing image file" }, { status: 400 });
  }

  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const params = JSON.stringify({
    auth: { key: authKey, expires },
    template_id: templateId
  });
  const signature = `sha384:${crypto
    .createHmac("sha384", authSecret)
    .update(Buffer.from(params, "utf-8"))
    .digest("hex")}`;

  const form = new FormData();
  form.append("params", params);
  form.append("signature", signature);
  form.append("file", file, file.name);

  const response = await fetch("https://api2.transloadit.com/assemblies", {
    method: "POST",
    body: form
  });
  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { error: data?.error ?? "Transloadit upload failed", details: data },
      { status: response.status }
    );
  }

  const uploadedUrl = findUploadedUrl(data);
  if (!uploadedUrl) {
    return NextResponse.json({ error: "Transloadit did not return a file URL", details: data }, { status: 500 });
  }

  return NextResponse.json({
    url: uploadedUrl,
    assemblyId: data?.assembly_id,
    ok: data?.ok
  });
}

function findUploadedUrl(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;

  if ("ssl_url" in value && typeof value.ssl_url === "string") return value.ssl_url;
  if ("url" in value && typeof value.url === "string") return value.url;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findUploadedUrl(item);
      if (found) return found;
    }
    return null;
  }

  for (const item of Object.values(value)) {
    const found = findUploadedUrl(item);
    if (found) return found;
  }

  return null;
}
