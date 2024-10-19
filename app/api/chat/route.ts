// import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { streamText, convertToCoreMessages, Message } from "ai";
import { z } from "zod";
import { Sandbox } from "@e2b/code-interpreter";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const systemPrompt = `
You are a sophisticated python data scientist/analyst.
You are provided with a question and a dataset.
Generate python code to calculate the result and render a plot.
Include the code in the response before executing it.
Then, execute the code and return the result.

You can use the following libraries:
- jupyter
- numpy
- pandas
- matplotlib
- seaborn
- plotly
`;

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json();
  const result = await streamText({
    system: systemPrompt,
    model: openai("gpt-4o"),
    messages: convertToCoreMessages(messages),
    tools: {
      execute_python: {
        description:
          "Execute python code in a Jupyter notebook cell and return result",
        parameters: z.object({
          code: z
            .string()
            .describe("The python code to execute in a single cell"),
          install_packages_command: z
            .string()
            .optional()
            .describe("pip command to install additional packages"),
        }),
        execute: async ({ code, install_packages_command }) => {
          // Create a sandbox, execute LLM-generated code, and return the result
          const sandbox = await Sandbox.create();
          if (install_packages_command) {
            console.log("Installing packages:", install_packages_command);
            await sandbox.runCode(install_packages_command);
          }

          const { text, results, logs, error } = await sandbox.runCode(code);
          console.log("Results:", text, results, logs, error);
          return {
            text,
            results,
            logs,
            error,
          };
        },
      },
    },
  });

  return result.toDataStreamResponse();
}
