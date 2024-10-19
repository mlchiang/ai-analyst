import { ToolInvocation } from "ai";
import { Result } from "@e2b/code-interpreter";
import { useState } from "react";
import { Line, ResponsiveLine } from "@nivo/line";

export function ToolOutput({
  result,
}: {
  result: ToolInvocation[] | undefined;
}) {
  if (!result) return null;
  const toolResult = result[0].result;
  const [viewMode, setViewMode] = useState<"static" | "interactive">("static");

  return toolResult !== undefined
    ? toolResult.results.map((result: Result, index: number) => (
        <div key={index}>
          <div className="flex justify-end">
            <button
              className={`px-2 border-b font-semibold text-sm ${
                viewMode === "static" ? "border-orange-500" : ""
              }`}
              onClick={() => setViewMode("static")}
            >
              Static
            </button>
            <button
              className={`px-2 border-b font-semibold text-sm ${
                viewMode === "interactive" ? "border-orange-500" : ""
              }`}
              onClick={() => setViewMode("interactive")}
            >
              Interactive
            </button>
          </div>
          <RenderResult result={result} viewMode={viewMode} />
        </div>
      ))
    : null;
}

function RenderResult({
  result,
  viewMode,
}: {
  result: Result;
  viewMode: "static" | "interactive";
}) {
  if (viewMode === "static" && result.png) {
    return <img src={`data:image/png;base64,${result.png}`} alt="plot" />;
  }

  if (viewMode === "interactive" && result.extra) {
    console.log(result.extra.chart);
    const data = result.extra.chart.elements.map((e) => {
      return {
        id: e.label,
        data: e.points.map((p) => ({ x: p[0], y: p[1] })),
      };
    });

    return (
      <Line
        height={500}
        width={1200}
        data={data}
        margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
      />
    );
  }

  return <pre>{JSON.stringify(result, null, 2)}</pre>;
}
