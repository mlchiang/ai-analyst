import { createOpenAI } from "@ai-sdk/openai";

const providerConfigs = {
  together: createOpenAI({
    apiKey: process.env.TOGETHER_AI_API_KEY,
    baseURL: "https://api.together.xyz/v1",
  })("meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo"),
  fireworks: createOpenAI({
    apiKey: process.env.FIREWORKS_API_KEY,
    baseURL: "https://api.fireworks.ai/inference/v1",
  })("accounts/fireworks/models/llama-v3p1-405b-instruct"),
};

export function getModel(provider: keyof typeof providerConfigs) {
  return providerConfigs[provider];
}

export const model = getModel("fireworks");
