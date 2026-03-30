import { Badge } from "../../../components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Separator } from "../../../components/ui/separator";
import { SettingRow } from "./setting-row";
import { useSettings, useUpdateSettings } from "./use-settings";
import { useGroqModels, useGeminiModels } from "./use-models";
import { cn } from "../../../lib/utils";
import type { AiProvider } from "../../../shared/types";

export function AiSection() {
  const { data: settings } = useSettings();
  const { mutate: update } = useUpdateSettings();
  if (!settings) return null;

  const {
    models: groqModels,
    isLoading: groqLoading,
    isError: groqError,
  } = useGroqModels(settings.aiGroqApiKey);
  const {
    models: geminiModels,
    isLoading: geminiLoading,
    isError: geminiError,
  } = useGeminiModels(settings.aiGeminiApiKey);

  const PROVIDER_OPTIONS: { value: AiProvider; label: string; desc: string }[] =
    [
      {
        value: "auto",
        label: "Auto (recommended)",
        desc: "Try Groq first, fallback to Gemini on rate limit",
      },
      { value: "groq", label: "Groq only", desc: "Always use Groq API" },
      {
        value: "gemini",
        label: "Gemini only",
        desc: "Always use Google Gemini API",
      },
    ];

  return (
    <div className="flex flex-col gap-4">
      {/* Provider */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Provider</CardTitle>
          <CardDescription className="text-xs">
            Which AI provider powers the Improve feature
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {PROVIDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ aiProvider: opt.value })}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                settings.aiProvider === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/40",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 size-3.5 shrink-0 rounded-full border-2",
                  settings.aiProvider === opt.value
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/40",
                )}
              />
              <div>
                <p className="text-sm font-medium leading-tight">{opt.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {opt.desc}
                </p>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Groq */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            Groq
            <Badge
              variant={settings.aiGroqApiKey ? "secondary" : "outline"}
              className="text-[10px]"
            >
              {settings.aiGroqApiKey ? "Configured" : "Not set"}
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Free key at <span className="font-mono">console.groq.com</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <SettingRow label="API Key">
            <Input
              type="password"
              value={settings.aiGroqApiKey}
              onChange={(e) => update({ aiGroqApiKey: e.target.value })}
              placeholder="gsk_..."
              className="h-8 w-56 text-xs font-mono"
            />
          </SettingRow>
          <Separator />
          <SettingRow
            label="Model"
            description={
              !settings.aiGroqApiKey
                ? "Add API key to load models"
                : groqLoading
                  ? "Fetching models…"
                  : groqError
                    ? "Could not load models"
                    : undefined
            }
          >
            <Select
              value={groqModels.length > 0 ? settings.aiGroqModel : ""}
              onValueChange={(v) => update({ aiGroqModel: v })}
              disabled={groqModels.length === 0}
            >
              <SelectTrigger className="h-8 w-52 text-xs">
                <SelectValue
                  placeholder={
                    groqLoading
                      ? "Loading…"
                      : groqError
                        ? "Failed to load"
                        : "Enter API key first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {groqModels.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-xs">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
        </CardContent>
      </Card>

      {/* Gemini */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            Google Gemini
            <Badge
              variant={settings.aiGeminiApiKey ? "secondary" : "outline"}
              className="text-[10px]"
            >
              {settings.aiGeminiApiKey ? "Configured" : "Not set"}
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Free key at <span className="font-mono">aistudio.google.com</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <SettingRow label="API Key">
            <Input
              type="password"
              value={settings.aiGeminiApiKey}
              onChange={(e) => update({ aiGeminiApiKey: e.target.value })}
              placeholder="AIza..."
              className="h-8 w-56 text-xs font-mono"
            />
          </SettingRow>
          <Separator />
          <SettingRow
            label="Model"
            description={
              !settings.aiGeminiApiKey
                ? "Add API key to load models"
                : geminiLoading
                  ? "Fetching models…"
                  : geminiError
                    ? "Could not load models"
                    : undefined
            }
          >
            <Select
              value={geminiModels.length > 0 ? settings.aiGeminiModel : ""}
              onValueChange={(v) => update({ aiGeminiModel: v })}
              disabled={geminiModels.length === 0}
            >
              <SelectTrigger className="h-8 w-52 text-xs">
                <SelectValue
                  placeholder={
                    geminiLoading
                      ? "Loading…"
                      : geminiError
                        ? "Failed to load"
                        : "Enter API key first"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {geminiModels.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-xs">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
        </CardContent>
      </Card>
    </div>
  );
}
