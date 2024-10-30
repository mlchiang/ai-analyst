"use server"

import { ProviderName } from "./model"

// Determine provider and config based on available environment variables
export async function getAvailableProviders() : Promise<ProviderName[]> {
    return Promise.resolve([
      process.env.TOGETHER_AI_API_KEY ? 'togetherai' : null,
      process.env.FIREWORKS_API_KEY ? 'fireworks' : null,
      process.env.OLLAMA_BASE_URL ? 'ollama' : null,
    ].filter(Boolean) as ProviderName[]);
  }