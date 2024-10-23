// import { z } from "zod";
// import { Sandbox } from "@e2b/code-interpreter";
import { model } from "@/app/lib/models";
import { systemPrompt } from "@/app/lib/prompt";
import { streamText, convertToCoreMessages, Message } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json();

  // Filter out tool invocations
  const filteredMessages = messages.map((message) => {
    if (message.toolInvocations) {
      return {
        ...message,
        toolInvocations: undefined,
      };
    }
    return message;
  });

  const result = await streamText({
    system: systemPrompt,
    model,
    messages: convertToCoreMessages(filteredMessages),
    // If the provider supports tooling, uncomment below
    // tools: {
    //   runCode: {
    //     description:
    //       "Execute python code in a Jupyter notebook cell and return result",
    //     parameters: z.object({
    //       code: z
    //         .string()
    //         .describe("The python code to execute in a single cell"),
    //     }),
    //     execute: async ({ code }) => {
    //       // Create a sandbox, execute LLM-generated code, and return the result
    //       console.log("Executing code", code);
    //       const sandbox = await Sandbox.create();
    //       const { text, results, logs, error } = await sandbox.runCode(code);
    //       console.log(text, results, logs, error);

    //       return {
    //         text,
    //         results,
    //         logs,
    //         error,
    //       };
    //     },
    //   },
    // },
  });

  return result.toDataStreamResponse();
}
