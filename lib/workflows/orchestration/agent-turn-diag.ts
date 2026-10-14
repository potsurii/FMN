import type { ProviderFailureCode } from "@/lib/providers/gemini/types";

export const AGENT_TURN_LOG_PREFIX = "[agent-turn]";

export type AgentTurnDiagStage =
  | "session"
  | "validate"
  | "config"
  | "http"
  | "response"
  | "transport";

  export type AgentTurnDiag = {
    requestId: string;
    stage: AgentTurnDiagStage;
    code: ProviderFailureCode;
    status?: number;
    responseIsJson?: boolean;
    errorStatus?: string | null;
    errorCode?: number | null;
  };
  
  export function agentTurnDiag(input: {
    requestId: string;
    stage: AgentTurnDiagStage;
    code: ProviderFailureCode;
    status?: number;
    responseIsJson?: boolean;
    errorStatus?: string | null;
    errorCode?: number | null;
  }): AgentTurnDiag {
    const line: AgentTurnDiag = {
      requestId: input.requestId,
      stage: input.stage,
      code: input.code,
    };
    if (typeof input.status === "number" && Number.isInteger(input.status)) {
      line.status = input.status;
    }
    if (typeof input.responseIsJson === "boolean") {
      line.responseIsJson = input.responseIsJson;
    }
    if (input.errorStatus !== undefined) {
      line.errorStatus = input.errorStatus;
    }
    if (input.errorCode !== undefined) {
      line.errorCode = input.errorCode;
    }
    return line;
  }
  
  export function logAgentTurnDiag(input: {
    requestId: string;
    stage: AgentTurnDiagStage;
    code: ProviderFailureCode;
    status?: number;
    responseIsJson?: boolean;
    errorStatus?: string | null;
    errorCode?: number | null;
  }): void {
    console.error(AGENT_TURN_LOG_PREFIX, agentTurnDiag(input));
  }