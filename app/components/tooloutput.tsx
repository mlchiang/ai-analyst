import { ChartTypes, Result } from "@e2b/code-interpreter";
import { useState } from "react";
import { ToolResult } from "../lib/types";
import ReactECharts, { EChartsOption } from "echarts-for-react";

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

  if (viewMode === "interactive" && result.extra?.chart) {
    return <Chart chart={result.extra.chart} />;
  }

  return <pre>{JSON.stringify(result, null, 2)}</pre>;
}

function Chart({ chart }: { chart: ChartTypes }) {
  if (chart.type === "line") {
    const series = chart.elements.map((e) => {
      return {
        name: e.label,
        type: "line",
        data: e.points.map((p: [number, number]) => [p[0], p[1]]),
      };
    });

    const options: EChartsOption = {
      title: {
        text: chart.title,
      },
      grid: { top: 8, right: 8, bottom: 24, left: 36 },
      xAxis: {
        type: "category",
        name: chart.x_label,
        nameLocation: "middle",
      },
      yAxis: {
        name: chart.y_label,
        nameLocation: "middle",
      },
      legend: {},
      series,
      tooltip: {
        trigger: "axis",
      },
    };

    return <ReactECharts option={options} />;
  }

  if (chart.type === "scatter") {
    const series = chart.elements.map((e) => {
      return {
        name: e.label,
        type: "scatter",
        data: e.points.map((p: [number, number]) => [p[0], p[1]]),
      };
    });

    const options: EChartsOption = {
      title: {
        text: chart.title,
      },
      grid: { top: 8, right: 8, bottom: 24, left: 36 },
      xAxis: {
        name: chart.x_label,
        nameLocation: "middle",
        min: "dataMin",
        max: "dataMax",
      },
      yAxis: {
        name: chart.y_label,
        nameLocation: "middle",
        min: "dataMin",
        max: "dataMax",
      },
      legend: {},
      series,
      tooltip: {
        trigger: "axis",
      },
    };

    return <ReactECharts option={options} />;
  }

  if (chart.type === "bar") {
    const data = Object.groupBy(chart.elements, ({ group }) => group);

    const series = Object.entries(data).map(([group, elements]) => ({
      name: group,
      type: "bar",
      stack: "total",
      data: elements?.map((e) => [e.label, e.value]),
    }));

    const options: EChartsOption = {
      title: {
        text: chart.title,
      },
      grid: { top: 8, right: 8, bottom: 24, left: 36 },
      xAxis: {
        type: "category",
        name: chart.x_label,
        nameLocation: "middle",
      },
      yAxis: {
        name: chart.y_label,
        nameLocation: "middle",
      },
      legend: {},
      series,
      tooltip: {
        trigger: "axis",
      },
    };

    return <ReactECharts option={options} />;
  }

  if (chart.type === "pie") {
    const options: EChartsOption = {
      title: {
        text: chart.title,
      },
      tooltip: {
        trigger: "item",
      },
      legend: {},
      series: [
        {
          type: "pie",
          data: chart.elements.map((e) => ({
            value: e.angle,
            name: e.label,
          })),
        },
      ],
    };

    return <ReactECharts option={options} />;
  }

  if (chart.type === "box_and_whisker") {
    const series = chart.elements.map((e) => {
      return {
        name: e.label,
        type: "boxplot",
        data: [[e.min, e.first_quartile, e.median, e.third_quartile, e.max]],
      };
    });

    const options: EChartsOption = {
      title: {
        text: chart.title,
      },
      xAxis: {
        type: "category",
        name: chart.x_label,
        nameLocation: "middle",
      },
      yAxis: {
        name: chart.y_label,
        nameLocation: "middle",
        min: "dataMin",
        max: "dataMax",
      },
      legend: {},
      series,
      tooltip: {
        trigger: "item",
      },
    };

    return <ReactECharts option={options} />;
  }

  if (chart.type === "superchart") {
    return chart.elements.map((e) => {
      return <Chart chart={e} />;
    });
  }

  return <pre>{JSON.stringify(chart, null, 2)}</pre>;
}
