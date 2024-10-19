import { ToolInvocation } from "ai";
import { Result } from "@e2b/code-interpreter";

export function ToolOutput({
  result,
}: {
  result: ToolInvocation[] | undefined;
}) {
  if (!result) return null;
  const toolResult = result[0].result;
  return toolResult !== undefined
    ? toolResult.results.map((result: Result, index: number) => (
        <RenderResult key={index} result={result} />
      ))
    : null;
}

function RenderResult({ result }: { result: Result }) {
  return result.png ? (
    <img src={`data:image/png;base64,${result.png}`} alt="plot" />
  ) : (
    <pre>{JSON.stringify(result, null, 2)}</pre>
  );
}
