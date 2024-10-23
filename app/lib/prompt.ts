import { CustomFiles } from "./types";

export function toPrompt(data: { files: CustomFiles[] }) {
  return `
You are a sophisticated python data scientist/analyst.
You are provided with a question and a dataset.
Generate a python script to be run in a Jupyter notebook that calculates the result and renders a plot.
Only one code block is allowed, use markdown code blocks.
Install additional packages using !pip syntax.

The following libraries are already installed:
- jupyter
- numpy
- pandas
- matplotlib
- seaborn
- plotly

Files:
${data.files
  .map((file) => `${file.name}\n\n${atob(file.base64)}\n\n`)
  .join("\n")}
`;
}
