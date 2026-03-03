import { NextResponse } from "next/server";
import { enforceRateLimit, isSupportedColleagueId, validateSameOrigin } from "@/lib/apiSecurity";
import { getApiBaseUrl, getMistralApiKey } from "@/lib/mistralStorage";

interface MistralFile {
  id: string;
  filename: string;
  bytes?: number;
  created_at?: number;
}

const FILE_PREFIX_SEP = "__";

export async function GET(request: Request) {
  try {
    const originError = validateSameOrigin(request);
    if (originError) {
      return NextResponse.json({ error: originError }, { status: 403 });
    }

    const rateLimit = enforceRateLimit(request, "api-storage-list", 60, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Te veel verzoeken, probeer het zo opnieuw." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const { searchParams } = new URL(request.url);
    const colleagueId = searchParams.get("colleague");

    if (!colleagueId) {
      return NextResponse.json(
        { error: "colleague query parameter is verplicht." },
        { status: 400 },
      );
    }
    if (!isSupportedColleagueId(colleagueId)) {
      return NextResponse.json({ error: "Ongeldige collega." }, { status: 400 });
    }

    const response = await fetch(`${getApiBaseUrl()}/v1/files?page=0&page_size=100`, {
      headers: {
        Authorization: `Bearer ${getMistralApiKey()}`,
      },
      cache: "no-store",
    });

    const rawBody = await response.text();
    if (!response.ok) {
      console.error("Mistral list error", response.status, rawBody.slice(0, 300));
      return NextResponse.json(
        {
          error: "Mistral lijst ophalen mislukt.",
        },
        { status: response.status },
      );
    }

    const parsed = JSON.parse(rawBody) as { data?: MistralFile[] };
    const files = parsed.data ?? [];
    const prefix = `${colleagueId}${FILE_PREFIX_SEP}`;

    const items = files
      .filter((file) => file.filename?.startsWith(prefix))
      .map((file) => ({
      id: file.id,
      colleagueId,
      fileName: file.filename.replace(prefix, ""),
      size: file.bytes ?? 0,
      status: "READY",
      createdAt: file.created_at
        ? new Date(file.created_at * 1000).toISOString()
        : new Date().toISOString(),
      url: null,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Storage list route failure", error);
    return NextResponse.json(
      {
        error: "Onbekende fout bij ophalen van bestanden.",
      },
      { status: 500 },
    );
  }
}
