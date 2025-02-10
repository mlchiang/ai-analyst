import { CustomFiles } from "@/lib/types";
import Sandbox from "@e2b/code-interpreter";
import fs from 'fs/promises';

const sandboxTimeout = 10 * 60 * 1000; // 10 minute in ms

export const maxDuration = 60;

export async function POST(req: Request) {
  const { code, files }: { code: string; files: CustomFiles[] } =
    await req.json();
  console.log("Executing code");

  const sandbox = await Sandbox.create(
    "f57luesnc366ong9ummz",
    {
      apiKey: process.env.E2B_API_KEY,
      timeoutMs: sandboxTimeout,
    }
  );

  const coreFiles = [
    {
      name: "weekly_offense_player_stats.csv",
      path: "https://auth.fantasyplaybook.ai/storage/v1/object/public/nfl-data//weekly_offense_player_stats.csv"
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
  for (const file of coreFiles) {
    const content = await fs.readFile(file.path, 'utf-8');
    // Write the complete file content to the sandbox
    await sandbox.files.write(`${file.name}`, content);
  }

  // Upload any additional files to public/data directory
  for (const file of files) {
    await sandbox.files.write(file.name, file.content);
  }

  const { text, results, logs, error } = await sandbox.runCode(code, { language: 'r' });
  
  
  return new Response(
    JSON.stringify({
      text,
      results,
      logs,
      error,
    })
  );
}
