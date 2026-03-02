import { NextResponse } from "next/server";
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
    const body = (await request.json()) as ChatRequestBody;
    const { colleagueId, message, conversationHistory = [] } = body;

    if (!colleagueId || !message?.trim()) {
      return NextResponse.json(
        { error: "colleagueId en message zijn verplicht." },
        { status: 400 },
      );
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
      return NextResponse.json(
        {
          error: `Mistral chat mislukt (${response.status}).`,
          details: rawBody.slice(0, 600),
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
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Onbekende fout tijdens chat.",
      },
      { status: 500 },
    );
  }
}
