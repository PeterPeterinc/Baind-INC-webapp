import { NextResponse } from "next/server";
import { enforceRateLimit, validateSameOrigin } from "@/lib/apiSecurity";
import { getApiBaseUrl, getMistralApiKey } from "@/lib/mistralStorage";

type Params = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const originError = validateSameOrigin(request);
    if (originError) {
      return NextResponse.json({ error: originError }, { status: 403 });
    }

    const rateLimit = enforceRateLimit(request, "api-storage-delete", 20, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Te veel verwijderverzoeken, probeer het zo opnieuw." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    if (!id || id.length < 8) {
      return NextResponse.json({ error: "Ongeldig bestand-id." }, { status: 400 });
    }

    const response = await fetch(`${getApiBaseUrl()}/v1/files/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getMistralApiKey()}`,
      },
    });

    const rawBody = await response.text();
    if (!response.ok) {
      console.error("Mistral delete error", response.status, rawBody.slice(0, 300));
      return NextResponse.json(
        {
          error: "Verwijderen in Mistral mislukt.",
        },
        { status: response.status },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Storage delete route failure", error);
    return NextResponse.json(
      {
        error: "Onbekende fout tijdens verwijderen.",
      },
      { status: 500 },
    );
  }
}
