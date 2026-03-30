import type {
  AiModelOption,
  ImproveRequest,
  ImproveResult,
  AiProvider,
} from "../../shared/types";

export interface AiServiceProvider {
  readonly name: Exclude<AiProvider, "auto">;
  isConfigured(apiKey: string): boolean;
  improve(
    req: ImproveRequest,
    apiKey: string,
    model: string,
  ): Promise<ImproveResult>;
  listModels(apiKey: string): Promise<AiModelOption[]>;
}
