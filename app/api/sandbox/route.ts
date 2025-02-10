import { CustomFiles } from "@/lib/types";
import Sandbox, { Execution } from "@e2b/code-interpreter";
import fs from 'fs/promises';

// Increase timeouts to handle longer R computations
const sandboxTimeout = 10 * 60 * 1000; // 10 minutes in ms
const codeExecutionTimeout = 5 * 60 * 1000; // 5 minutes in ms

export const maxDuration = 600; // 10 minutes

export async function POST(req: Request) {
  let sandbox: Sandbox | undefined;
  
  try {
    const { code, files }: { code: string; files: CustomFiles[] } =
      await req.json();
    console.log("Creating sandbox with timeout:", sandboxTimeout);

    sandbox = await Sandbox.create(
      "f57luesnc366ong9ummz",
      {
        apiKey: process.env.E2B_API_KEY,
        timeoutMs: sandboxTimeout
      }
    );

    console.log("Sandbox created successfully");
    const coreFiles = [
      {
        name: "weekly_offense_player_stats.csv",
        path: "public/data/weekly_offense_player_stats.csv"
      },
      // {
      //   name: "nfl_2024_pbp.csv",
      //   path: "public/data/nfl_2024_pbp.csv"
      // },
      // {
      //   name: "nfl_2024_players.csv",
      //   path: "public/data/nfl_2024_players.csv"
      // },
      // {
      //   name: "nfl_2024_teams.csv",
      //   path: "public/data/nfl_2024_teams.csv"
      // }
    ];

    // Upload core files to public/data directory
    console.log("Uploading core files...");
    for (const file of coreFiles) {
      const content = await fs.readFile(file.path, 'utf-8');
      await sandbox.files.write(`${file.name}`, content);
    }

    // Upload any additional files to public/data directory
    if (files.length > 0) {
      console.log("Uploading additional files...");
      for (const file of files) {
        await sandbox.files.write(file.name, file.content);
      }
    }

    console.log("Starting code execution...");
    const result = await Promise.race([
      sandbox.runCode(code, { 
        language: 'r',
        timeoutMs: codeExecutionTimeout 
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => {
          console.log("Local timeout triggered");
          reject(new Error(`Code execution timeout - exceeded ${codeExecutionTimeout/1000} seconds`));
        }, codeExecutionTimeout)
      )
    ]) as Execution;
    
    console.log("Code execution completed");
    return new Response(
      JSON.stringify({
        text: result.text,
        results: result.results,
        logs: result.logs,
        error: result.error,
      })
    );
  } catch (error) {
    console.error('Sandbox error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      }),
      { status: 500 }
    );
  } finally {
    if (sandbox?.dispose) {
      try {
        console.log("Disposing sandbox...");
        await sandbox.dispose();
        console.log("Sandbox disposed successfully");
      } catch (error) {
        console.error('Error disposing sandbox:', error);
      }
    }
  }
}
