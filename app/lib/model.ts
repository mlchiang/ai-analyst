import { createOpenAI } from "@ai-sdk/openai";
import { createOllama } from 'ollama-ai-provider'

export type LLMModelConfig = {
  model?: string;
  baseURL?: string;
  apiKey?: string;
}

type ProviderName = 'together' | 'fireworks' | 'ollama'

// Default configurations for each provider
const defaultConfigs = {
  together: {
    baseURL: "https://api.together.xyz/v1",
    model: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo"
  },
  fireworks: {
    baseURL: "https://api.fireworks.ai/inference/v1",
    model: "accounts/fireworks/models/llama-v3p1-405b-instruct"
  },
  ollama: {
  }
};

// Function to get a model based on provider and configuration
function getModel(provider: ProviderName, config: LLMModelConfig = {}) {
  const { apiKey, baseURL, model } = { ...defaultConfigs[provider], ...config };

  switch (provider) {
    case 'together':
    case 'fireworks':
      return createOpenAI({ apiKey, baseURL })(model || defaultConfigs[provider].model);
    case 'ollama':
      return createOllama({ baseURL })(model);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// Determine provider and config based on available environment variables
function getModelFromEnv() {
  if (process.env.TOGETHER_AI_API_KEY) return getModel("together", {
    apiKey: process.env.TOGETHER_AI_API_KEY
  });
  if (process.env.FIREWORKS_API_KEY) return getModel("fireworks", {
    apiKey: process.env.FIREWORKS_API_KEY
  })
  if (process.env.OLLAMA_BASE_URL) return getModel("ollama", {
    baseURL: process.env.OLLAMA_BASE_URL,
    model: process.env.OLLAMA_MODEL
  })
}

export const model = getModelFromEnv()