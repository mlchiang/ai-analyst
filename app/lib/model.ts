import { createOpenAI } from "@ai-sdk/openai";

export type LLMModelConfig = {
  model?: string;
  baseURL?: string;
  apiKey?: string;
}

type ProviderName = 'together' | 'fireworks'

// Default configurations for each provider
const defaultConfigs = {
  together: {
    baseURL: "https://api.together.xyz/v1",
    model: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo"
  },
  fireworks: {
    baseURL: "https://api.fireworks.ai/inference/v1",
    model: "accounts/fireworks/models/llama-v3p1-405b-instruct"
  }
};

// Function to get a model based on provider and configuration
function getModel(provider: ProviderName, config: LLMModelConfig = {}) {
  const { apiKey, baseURL, model } = { ...defaultConfigs[provider], ...config };

  switch (provider) {
    case 'together':
    case 'fireworks':
      return createOpenAI({ apiKey, baseURL })(model || defaultConfigs[provider].model);
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
}

export const model = getModelFromEnv()