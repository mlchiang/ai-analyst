import { createOpenAI } from "@ai-sdk/openai";
import { createOllama } from 'ollama-ai-provider'
import { LanguageModelV1 } from "ai"

export type ProviderName = 'togetherai' | 'fireworks' | 'ollama'

export type LLMModel = {
  id: string
  name: string
  provider: string
  providerId: ProviderName
}

export type LLMModelConfig = {
  model?: string;
  baseURL?: string;
  apiKey?: string;
}

// Default configurations for each provider
const defaultConfigs = {
  togetherai: {
    baseURL: "https://api.together.xyz/v1",
    model: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo"
  },
  fireworks: {
    baseURL: "https://api.fireworks.ai/inference/v1",
    model: "accounts/fireworks/models/llama-v3p1-405b-instruct"
  },
  ollama: {
    model: "llama3.2"
  }
};

// Function to get a model based on provider and configuration
export function getModel(model: LLMModel, userConfig: LLMModelConfig = {}) : LanguageModelV1 {
  const config = { ...userConfig, ...defaultConfigs[model.providerId]}
  const modelId = model.id || config.model;

  switch (model.providerId) {
    case 'togetherai':
      return createOpenAI({
        apiKey: process.env.TOGETHER_AI_API_KEY,
        ...config
      })(modelId);
    case 'fireworks':
      return createOpenAI({
        apiKey: process.env.FIREWORKS_API_KEY,
        ...config
      })(modelId);
    case 'ollama':
      return createOllama({
        baseURL: process.env.OLLAMA_BASE_URL,
        ...config
      })(modelId) as LanguageModelV1;
    default:
      throw new Error(`Unsupported provider: ${model.providerId}`);
  }
}