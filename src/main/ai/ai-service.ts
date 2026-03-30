import type {
  ImproveRequest,
  ImproveResult,
  AppSettings,
  AiModelOption,
} from "../../shared/types";
import { GROQ_FALLBACK_MODELS, GEMINI_FALLBACK_MODELS } from "./model-defaults";
import { GroqProvider } from "./groq-provider";
import { GeminiProvider } from "./gemini-provider";

const groq = new GroqProvider();
const gemini = new GeminiProvider();

/** Detects a rate-limit (HTTP 429) in a thrown error */
function is429(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    msg.includes("429") ||
    msg.toLowerCase().includes("rate limit") ||
    msg.toLowerCase().includes("too many requests")
  );
}

/**
 * Try improve() with preferredModel first, then cycle through the rest of
 * modelList when each returns a 429. Throws on first non-429 error, or
 * re-throws the last 429 error if every model is rate-limited.
 */
async function tryWithModelFallback(
  provider: GroqProvider | GeminiProvider,
  req: ImproveRequest,
  apiKey: string,
  preferredModel: string,
  modelList: readonly AiModelOption[],
): Promise<ImproveResult> {
  const order = [
    preferredModel,
    ...modelList.map((m) => m.id).filter((id) => id !== preferredModel),
  ];

  let lastErr: unknown = new Error("No models available");
  for (const model of order) {
    try {
      return await provider.improve(req, apiKey, model);
    } catch (e) {
      if (!is429(e)) throw e; // non-429 → bubble up immediately
      lastErr = e;
    }
  }
  throw lastErr;
}

export async function runImprove(
  req: ImproveRequest,
  settings: AppSettings,
): Promise<ImproveResult> {
  const {
    aiProvider,
    aiGroqApiKey,
    aiGroqModel,
    aiGeminiApiKey,
    aiGeminiModel,
  } = settings;

  if (aiProvider === "groq") {
    if (!groq.isConfigured(aiGroqApiKey)) {
      throw new Error(
        "API_ERROR: Groq API key is not configured. Please add it in Settings → AI.",
      );
    }
    return tryWithModelFallback(
      groq,
      req,
      aiGroqApiKey,
      aiGroqModel,
      GROQ_FALLBACK_MODELS,
    );
  }

  if (aiProvider === "gemini") {
    if (!gemini.isConfigured(aiGeminiApiKey)) {
      throw new Error(
        "API_ERROR: Gemini API key is not configured. Please add it in Settings → AI.",
      );
    }
    return tryWithModelFallback(
      gemini,
      req,
      aiGeminiApiKey,
      aiGeminiModel,
      GEMINI_FALLBACK_MODELS,
    );
  }

  // auto — try Groq (with model-level fallback) first, then Gemini
  if (groq.isConfigured(aiGroqApiKey)) {
    try {
      return await tryWithModelFallback(
        groq,
        req,
        aiGroqApiKey,
        aiGroqModel,
        GROQ_FALLBACK_MODELS,
      );
    } catch (e) {
      if (!is429(e)) throw e; // non-429 → propagate
      // all Groq models rate-limited → fall through to Gemini
    }
  }

  if (gemini.isConfigured(aiGeminiApiKey)) {
    return tryWithModelFallback(
      gemini,
      req,
      aiGeminiApiKey,
      aiGeminiModel,
      GEMINI_FALLBACK_MODELS,
    );
  }

  throw new Error(
    "API_ERROR: No AI provider is configured. Please add a Groq or Gemini API key in Settings → AI.",
  );
}

// ─── Model listing ────────────────────────────────────────────────────────────

export async function listGroqModels(apiKey: string): Promise<AiModelOption[]> {
  return groq.listModels(apiKey);
}

export async function listGeminiModels(
  apiKey: string,
): Promise<AiModelOption[]> {
  return gemini.listModels(apiKey);
}
