// import { z } from "zod";
// import { Sandbox } from "@e2b/code-interpreter";
import { getModelClient, LLMModel, LLMModelConfig } from "@/lib/model";
import { toPrompt } from "@/lib/prompt";
import { CustomFiles } from "@/lib/types";
import { streamText, convertToCoreMessages, Message, LanguageModelV1 } from "ai";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;
// Add response size limits
export const runtime = 'edge'; // Use edge runtime for better streaming
export const maxResponseSize = 1024 * 1024; // 1MB limit for responses

export async function POST(req: Request) {
  const {
    messages,
    data,
  }: {
    messages: Message[];
    data: { files: CustomFiles[]; model: LLMModel; config: LLMModelConfig };
  } = await req.json();

  // Filter out tool invocations and limit message history
  const maxMessages = 10; // Limit context window
  const filteredMessages = messages
    .slice(-maxMessages)
    .map((message) => {
      if (message.toolInvocations) {
        return {
          ...message,
          toolInvocations: undefined,
        };
      }
      return message;
    });

  const {
    model,
    apiKey,
    ...modelParams
  } = data.config;

  const modelClient = getModelClient(data.model, data.config);

  // Add timeout and abort controller for safety
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), maxDuration * 1000);

  try {
    const result = await streamText({
      system: await toPrompt(data),
      model: modelClient as LanguageModelV1,
      messages: convertToCoreMessages(filteredMessages),
      ...modelParams,
    });

    clearTimeout(timeout);
    return result.toDataStreamResponse();
  } catch (error) {
    clearTimeout(timeout);
    return new Response(
      JSON.stringify({ error: 'Request failed or timed out' }),
      { status: 500 }
    );
  }
}
