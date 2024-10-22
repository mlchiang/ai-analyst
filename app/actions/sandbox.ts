"use server";

import Sandbox from "@e2b/code-interpreter";

export async function runCode(code: string) {
  const sandbox = await Sandbox.create({ apiKey: process.env.E2B_API_KEY });
  const { text, results, logs, error } = await sandbox.runCode(code);
  return { text, results, logs, error };
}
