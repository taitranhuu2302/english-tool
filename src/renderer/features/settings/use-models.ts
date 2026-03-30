import { useQuery } from "@tanstack/react-query";
import { bridge } from "../../lib/bridge";
import type { AiModelOption } from "../../../shared/types";

export interface UseModelsResult {
  models: AiModelOption[];
  isLoading: boolean;
  isError: boolean;
}

export function useGroqModels(apiKey: string): UseModelsResult {
  const { data, isFetching, isError } = useQuery<AiModelOption[]>({
    queryKey: ["models", "groq", apiKey],
    queryFn: () => bridge.models.listGroq(apiKey),
    enabled: apiKey.trim().length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  return { models: data ?? [], isLoading: isFetching, isError };
}

export function useGeminiModels(apiKey: string): UseModelsResult {
  const { data, isFetching, isError } = useQuery<AiModelOption[]>({
    queryKey: ["models", "gemini", apiKey],
    queryFn: () => bridge.models.listGemini(apiKey),
    enabled: apiKey.trim().length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  return { models: data ?? [], isLoading: isFetching, isError };
}
