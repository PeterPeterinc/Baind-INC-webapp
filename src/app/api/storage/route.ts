import { NextResponse } from "next/server";
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
    const { searchParams } = new URL(request.url);
    const colleagueId = searchParams.get("colleague");

    if (!colleagueId) {
      return NextResponse.json(
        { error: "colleague query parameter is verplicht." },
        { status: 400 },
      );
    }

    const response = await fetch(`${getApiBaseUrl()}/v1/files?page=0&page_size=100`, {
      headers: {
        Authorization: `Bearer ${getMistralApiKey()}`,
      },
      cache: "no-store",
    });

    const rawBody = await response.text();
    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Mistral lijst ophalen mislukt (${response.status}).`,
          details: rawBody.slice(0, 600),
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
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Onbekende fout bij ophalen van bestanden.",
      },
      { status: 500 },
    );
  }
}
