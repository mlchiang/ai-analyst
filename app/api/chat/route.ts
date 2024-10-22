// import { z } from "zod";
// import { Sandbox } from "@e2b/code-interpreter";
import { getModel } from "@/app/lib/models";
import { streamText, convertToCoreMessages, Message } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const systemPrompt = `
You are a sophisticated python data scientist/analyst.
You are provided with a question and a dataset.
Generate python code to be run in a Jupyter notebook cell that calculates the result and renders a plot.

The following libraries are available:
- jupyter
- numpy
- pandas
- matplotlib
- seaborn
- plotly

You can install additional packages using pip (Jupyter notebook syntax).
`;

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json();
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
    model: getModel("fireworks"),
    messages: convertToCoreMessages(filteredMessages),
    // If the provider supports tooling, uncomment below
    // tools: {
    //   execute_python: {
    //     description:
    //       "Execute python code in a Jupyter notebook cell and return result",
    //     parameters: z.object({
    //       code: z
    //         .string()
    //         .describe("The python code to execute in a single cell"),
    //     }),
    //     execute: async ({ code }) => {
    //       // Create a sandbox, execute LLM-generated code, and return the result
    //       console.log("Executing code");
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
