const MISTRAL_API_BASE = "https://api.mistral.ai";

export type SupportedColleagueId = "dennis" | "niels";

export function getMistralApiKey(): string {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY ontbreekt in environment variables.");
  }
  return apiKey;
}

export function getWorkspaceIdForColleague(colleagueId: string): string {
  if (colleagueId === "dennis") {
    const workspaceId = process.env.MISTRAL_WORKSPACE_ID_DENNIS;
    if (!workspaceId) {
      throw new Error("MISTRAL_WORKSPACE_ID_DENNIS ontbreekt.");
    }
    return workspaceId;
  }

  if (colleagueId === "niels") {
    const workspaceId = process.env.MISTRAL_WORKSPACE_ID_NIELS;
    if (!workspaceId) {
      throw new Error("MISTRAL_WORKSPACE_ID_NIELS ontbreekt.");
    }
    return workspaceId;
  }

  throw new Error(`Onbekende collega: ${colleagueId}`);
}

export function getAgentIdForColleague(colleagueId: string): string {
  if (colleagueId === "dennis") {
    const agentId = process.env.MISTRAL_AGENT_ID_DENNIS;
    if (!agentId) {
      throw new Error("MISTRAL_AGENT_ID_DENNIS ontbreekt.");
    }
    return agentId;
  }

  if (colleagueId === "niels") {
    const agentId = process.env.MISTRAL_AGENT_ID_NIELS;
    if (!agentId) {
      throw new Error("MISTRAL_AGENT_ID_NIELS ontbreekt.");
    }
    return agentId;
  }

  throw new Error(`Onbekende collega: ${colleagueId}`);
}

export function getMaxUploadBytes(): number {
  const mb = Number(process.env.MAX_UPLOAD_MB ?? "20");
  if (!Number.isFinite(mb) || mb <= 0) {
    return 20 * 1024 * 1024;
  }
  return Math.floor(mb * 1024 * 1024);
}

export function getApiBaseUrl(): string {
  return MISTRAL_API_BASE;
}
