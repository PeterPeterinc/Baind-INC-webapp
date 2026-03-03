import { NextResponse } from "next/server";
import { enforceRateLimit, isSupportedColleagueId, validateSameOrigin } from "@/lib/apiSecurity";
import {
  getApiBaseUrl,
  getMaxUploadBytes,
  getMistralApiKey,
} from "@/lib/mistralStorage";

const FILE_PREFIX_SEP = "__";
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/json",
]);

export async function POST(request: Request) {
  try {
    const originError = validateSameOrigin(request);
    if (originError) {
      return NextResponse.json({ error: originError }, { status: 403 });
    }

    const rateLimit = enforceRateLimit(request, "api-storage-upload", 10, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Te veel uploadverzoeken, probeer het zo opnieuw." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const colleagueId = formData.get("colleagueId");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Bestand ontbreekt in request." },
        { status: 400 },
      );
    }

    if (typeof colleagueId !== "string" || !colleagueId) {
      return NextResponse.json(
        { error: "colleagueId ontbreekt." },
        { status: 400 },
      );
    }
    if (!isSupportedColleagueId(colleagueId)) {
      return NextResponse.json({ error: "Ongeldige collega." }, { status: 400 });
    }

    const maxBytes = getMaxUploadBytes();
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          error: `Bestand is te groot. Maximum is ${Math.round(maxBytes / (1024 * 1024))}MB.`,
        },
        { status: 400 },
      );
    }
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Bestandstype niet toegestaan." },
        { status: 400 },
      );
    }

    const uploadPayload = new FormData();
    uploadPayload.append("file", file, `${colleagueId}${FILE_PREFIX_SEP}${file.name}`);
    uploadPayload.append("purpose", "ocr");

    const response = await fetch(`${getApiBaseUrl()}/v1/files`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getMistralApiKey()}`,
      },
      body: uploadPayload,
    });

    const rawBody = await response.text();
    if (!response.ok) {
      console.error("Mistral upload error", response.status, rawBody.slice(0, 300));
      return NextResponse.json(
        {
          error: "Upload naar Mistral mislukt.",
        },
        { status: response.status },
      );
    }

    const parsed = JSON.parse(rawBody) as {
      id?: string;
      filename?: string;
      bytes?: number;
      created_at?: number;
    };

    return NextResponse.json({
      item: {
        id: parsed.id ?? crypto.randomUUID(),
        colleagueId,
        fileName: (parsed.filename ?? `${colleagueId}${FILE_PREFIX_SEP}${file.name}`).replace(
          `${colleagueId}${FILE_PREFIX_SEP}`,
          "",
        ),
        size: parsed.bytes ?? file.size,
        status: "READY",
        createdAt: parsed.created_at
          ? new Date(parsed.created_at * 1000).toISOString()
          : new Date().toISOString(),
        url: null,
      },
    });
  } catch (error) {
    console.error("Storage upload route failure", error);
    return NextResponse.json(
      {
        error: "Onbekende fout tijdens upload.",
      },
      { status: 500 },
    );
  }
}
