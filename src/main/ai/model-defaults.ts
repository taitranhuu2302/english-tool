/**
 * Static fallbacks used ONLY when the SDK list call fails or the API key
 * hasn't been configured yet. These are main-process constants — the renderer
 * always fetches live models from the SDK via IPC.
 */
import type { AiModelOption } from "../../shared/types";

export const GROQ_FALLBACK_MODELS: AiModelOption[] = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", provider: "groq" },
  {
    id: "llama-3.1-8b-instant",
    label: "Llama 3.1 8B (fast)",
    provider: "groq",
  },
  { id: "gemma2-9b-it", label: "Gemma 2 9B", provider: "groq" },
];

export const GEMINI_FALLBACK_MODELS: AiModelOption[] = [
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "gemini" },
  { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash", provider: "gemini" },
  {
    id: "gemini-1.5-flash-8b",
    label: "Gemini 1.5 Flash 8B",
    provider: "gemini",
  },
];
