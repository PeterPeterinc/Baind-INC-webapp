import { NextResponse } from "next/server";
import { getApiBaseUrl, getMistralApiKey } from "@/lib/mistralStorage";

type Params = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    void request;
    const response = await fetch(`${getApiBaseUrl()}/v1/files/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getMistralApiKey()}`,
      },
    });

    const rawBody = await response.text();
    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Verwijderen in Mistral mislukt (${response.status}).`,
          details: rawBody.slice(0, 600),
        },
        { status: response.status },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Onbekende fout tijdens verwijderen.",
      },
      { status: 500 },
    );
  }
}
