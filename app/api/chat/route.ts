// import { z } from "zod";
// import { Sandbox } from "@e2b/code-interpreter";
import { getModel } from "@/app/lib/models";
import { streamText, convertToCoreMessages, Message } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const systemPrompt = `
You are a sophisticated python data scientist/analyst.
You are provided with a question and a dataset.
Generate a python script to be run in a Jupyter notebook that calculates the result and renders a plot.
Only one code block is allowed.
Install additional packages using !pip syntax.

The following libraries are already installed:
- jupyter
- numpy
- pandas
- matplotlib
- seaborn
- plotly
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
