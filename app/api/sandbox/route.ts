import { Sandbox } from "@e2b/code-interpreter";
import { CustomFiles } from "@/lib/types";

const sandboxTimeout = 30000; // 30 second timeout
const maxFileSize = 50 * 1024 * 1024; // 50MB file size limit

async function fetchFileContent(path: string): Promise<string> {
  if (!path.startsWith('http')) {
    throw new Error('Only HTTP(S) paths are supported');
  }
  
  const response = await fetch(path, {
    signal: AbortSignal.timeout(10000) // 10s timeout for fetches
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
  }
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No readable stream available');
  }

  let result = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += new TextDecoder().decode(value);
    if (result.length > maxFileSize) {
      reader.cancel();
      throw new Error(`File ${path} exceeds size limit of ${maxFileSize} bytes`);
    }
  }
  return result;
}

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

  try {
    const coreFiles = [
      {
        name: "weekly_offense_player_stats.csv",
        path: "https://auth.fantasyplaybook.ai/storage/v1/object/public/nfl-data//weekly_offense_player_stats.csv"
      }
    ];

    // Upload core files to public/data directory
    for (const file of coreFiles) {
      try {
        const content = await fetchFileContent(file.path);
        // Write the complete file content to the sandbox
        await sandbox.files.write(`${file.name}`, content);
      } catch (error) {
        console.error(`Failed to process core file ${file.name}:`, error);
        // Continue with other files if one fails
      }
    }

    // Upload any additional files to public/data directory
    for (const file of files) {
      if (file.content.length > maxFileSize) {
        throw new Error(`File ${file.name} exceeds size limit of ${maxFileSize} bytes`);
      }
      await sandbox.files.write(file.name, file.content);
    }

    const { text, results, logs, error } = await sandbox.runCode(code, { language: 'r' });
    
    return new Response(
      JSON.stringify({
        text,
        results,
        logs,
        error,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  } catch (error) {
    console.error('Sandbox execution error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
