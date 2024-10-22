import {
  ChartType,
  LineChart as LineChartType,
  Result,
} from "@e2b/code-interpreter";
import { useState } from "react";
import { ToolResult } from "../lib/types";
import {
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
  Label,
} from "recharts";

export function ToolOutput({ result }: { result: ToolResult | undefined }) {
  const [viewMode, setViewMode] = useState<"static" | "interactive">("static");

  if (!result) return null;
  const toolResult = result[0].result;

  return toolResult !== undefined
    ? toolResult.results.map((result: Result, index: number) => (
        <div key={index} className="flex flex-col gap-2">
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

  if (viewMode === "interactive" && result.extra.chart) {
    const chart = result.extra.chart;
    if (chart.type === "line") {
      const data = (chart as LineChartType).elements.map((e) => {
        return e.points.map((p: [number, number]) => ({
          x: p[0],
          y: p[1],
        }));
      });

      return (
        <LineChart height={400} width={600} data={data[0]}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="x"
            scale={chart.x_scale}
            label={{
              value: chart.x_label,
              position: "left",
              offset: 10,
            }}
          />
          <YAxis
            label={{
              value: chart.y_label,
              position: "left",
              offset: 0,
              angle: -90,
            }}
            scale={chart.y_scale}
          />
          <Tooltip />
          <Legend
            verticalAlign="top"
            height={36}
            content={
              <p className="text-sm font-semibold text-gray-800">
                {chart.title}
              </p>
            }
          />
          <Line name={chart.y_label} type="monotone" dataKey="y" />
        </LineChart>
      );
    }

    // if (chart.type === "superchart") {
    //   return chart.elements.map((e) => {
    //     return <RenderResult result={e} viewMode={viewMode} />;
    //   });
    // }
  }

  return <pre>{JSON.stringify(result, null, 2)}</pre>;
}
