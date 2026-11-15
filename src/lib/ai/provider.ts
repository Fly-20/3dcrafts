import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

/**
 * One small interface over the AI providers, so the CRM isn't tied to one
 * company. Pick with env vars (server only):
 *
 *   AI_PROVIDER=anthropic | openai   optional; otherwise the first key found wins
 *   ANTHROPIC_API_KEY=…              Claude (default model claude-opus-5-5)
 *   OPENAI_API_KEY=…                 ChatGPT models (default model gpt-5)
 *   AI_MODEL=…                       optional model override for the chosen provider
 *
 * The model never sets a price. Callers ask it to read messages and write
 * text around figures the pricing engine produced; the draft checks reject
 * any other £ amount.
 */

export type AiProviderName = "anthropic" | "openai";

export type AiConfig = { provider: AiProviderName; model: string; label: string };

const DEFAULT_MODELS: Record<AiProviderName, string> = {
  anthropic: "claude-opus-5-5",
  openai: "gpt-5",
};

const LABELS: Record<AiProviderName, string> = { anthropic: "Claude", openai: "ChatGPT" };

/** Which provider and model are configured, or null if there's no key (callers then use rules and templates). */
export function aiConfig(): AiConfig | null {
  const hasKey: Record<AiProviderName, boolean> = {
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
  };
  const wanted = process.env.AI_PROVIDER?.trim().toLowerCase();
  let provider: AiProviderName | null = null;
  if (wanted === "anthropic" || wanted === "openai") provider = hasKey[wanted] ? wanted : null;
  else provider = hasKey.anthropic ? "anthropic" : hasKey.openai ? "openai" : null;
  if (!provider) return null;
  return { provider, model: process.env.AI_MODEL?.trim() || DEFAULT_MODELS[provider], label: LABELS[provider] };
}

export function aiEnabled() {
  return aiConfig() !== null;
}

/** The two calls the CRM needs. Kept as a plain object so tests can pass a fake. */
export type AiClient = {
  label: string;
  /** Returns JSON matching `schema` (strict: every property required, no extras). */
  json<T>(request: { system: string; prompt: string; schema: Record<string, unknown>; schemaName: string }): Promise<T>;
  text(request: { system: string; prompt: string }): Promise<string>;
};

let anthropic: Anthropic | null = null;
let openai: OpenAI | null = null;

const FALLBACK_BETA = "server-side-fallback-2026-07-01";

function anthropicClient(model: string, label: string): AiClient {
  anthropic ??= new Anthropic({ timeout: 90_000, maxRetries: 1 });
  const client = anthropic;
  const call = async (system: string, prompt: string, format?: Record<string, unknown>) => {
    // Refusal fallbacks: if the model declines, the API reruns the request on a fallback model.
    const message = await client.beta.messages.create({
      model,
      max_tokens: 6000,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      output_config: format ? { effort: "low", format: { type: "json_schema", schema: format } } : { effort: "low" },
      system,
      messages: [{ role: "user", content: prompt }],
    });
    if (message.stop_reason === "refusal") throw new Error(`${label} declined this request.`);
    return message.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();
  };
  return {
    label,
    json: async ({ system, prompt, schema }) => JSON.parse(await call(system, prompt, schema)),
    text: ({ system, prompt }) => call(system, prompt),
  };
}

function openaiClient(model: string, label: string): AiClient {
  openai ??= new OpenAI({ timeout: 90_000, maxRetries: 1 });
  const client = openai;
  const call = async (system: string, prompt: string, format?: { schema: Record<string, unknown>; name: string }) => {
    const response = await client.responses.create({
      model,
      instructions: system,
      input: prompt,
      ...(format ? { text: { format: { type: "json_schema" as const, name: format.name, schema: format.schema, strict: true } } } : {}),
    });
    const text = response.output_text?.trim();
    if (!text) throw new Error(`${label} returned no text (it may have declined).`);
    return text;
  };
  return {
    label,
    json: async ({ system, prompt, schema, schemaName }) => JSON.parse(await call(system, prompt, { schema, name: schemaName })),
    text: ({ system, prompt }) => call(system, prompt),
  };
}

/** The configured client, or null without a key. */
export function getAiClient(): AiClient | null {
  const config = aiConfig();
  if (!config) return null;
  return config.provider === "anthropic" ? anthropicClient(config.model, config.label) : openaiClient(config.model, config.label);
}
