import { NextResponse } from "next/server";
import { enforceRateLimit, isSupportedColleagueId, validateSameOrigin } from "@/lib/apiSecurity";
import { getAgentIdForColleague, getApiBaseUrl, getMistralApiKey } from "@/lib/mistralStorage";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  colleagueId: string;
  message: string;
  conversationHistory?: ChatMessage[];
}

function extractAssistantText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (
          item &&
          typeof item === "object" &&
          "text" in item &&
          typeof (item as { text?: unknown }).text === "string"
        ) {
          return (item as { text: string }).text;
        }
        return "";
      })
      .join("")
      .trim();
  }
  return "";
}

export async function POST(request: Request) {
  try {
    const originError = validateSameOrigin(request);
    if (originError) {
      return NextResponse.json({ error: originError }, { status: 403 });
    }

    const rateLimit = enforceRateLimit(request, "api-chat", 30, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Te veel verzoeken, probeer het zo opnieuw." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const body = (await request.json()) as ChatRequestBody;
    const { colleagueId, message, conversationHistory = [] } = body;

    if (!colleagueId || !message?.trim()) {
      return NextResponse.json(
        { error: "colleagueId en message zijn verplicht." },
        { status: 400 },
      );
    }
    if (!isSupportedColleagueId(colleagueId)) {
      return NextResponse.json({ error: "Ongeldige collega." }, { status: 400 });
    }

    const agentId = getAgentIdForColleague(colleagueId);
    const messages = [
      ...conversationHistory
        .filter((entry) => entry?.content?.trim())
        .slice(-12)
        .map((entry) => ({
          role: entry.role,
          content: entry.content,
        })),
      { role: "user" as const, content: message.trim() },
    ];

    const response = await fetch(`${getApiBaseUrl()}/v1/agents/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getMistralApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: agentId,
        messages,
        stream: false,
      }),
    });

    const rawBody = await response.text();
    if (!response.ok) {
      console.error("Mistral chat error", response.status, rawBody.slice(0, 300));
      return NextResponse.json(
        {
          error: "Mistral chat mislukt.",
        },
        { status: response.status },
      );
    }

    const parsed = JSON.parse(rawBody) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };

    const answer = extractAssistantText(parsed.choices?.[0]?.message?.content);
    if (!answer) {
      return NextResponse.json(
        { error: "Mistral gaf een leeg antwoord terug." },
        { status: 502 },
      );
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Chat route failure", error);
    return NextResponse.json(
      {
        error: "Onbekende fout tijdens chat.",
      },
      { status: 500 },
    );
  }
}
