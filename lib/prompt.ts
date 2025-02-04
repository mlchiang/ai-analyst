import { CustomFiles } from "./types";
import { promises as fs } from 'fs';

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

export async function toPrompt(data: { files: CustomFiles[] }) {
  // Get column names for each file
  const fileDescriptions = await Promise.all(
    coreFiles.map(async (file) => {
      const content = await fs.readFile(file.path, 'utf-8');
      const headers = content.split('\n')[0];
      return `- ${file.name} (columns: ${headers})`;
    })
  );

  return `
You are a sophisticated R sports data scientist/analyst.
You are provided with a question and a dataset.
Generate a R script to be run in a Jupyter notebook that calculates the result and renders a plot.
Only one code block is allowed, use markdown code blocks.
Install additional packages (using !pip syntax) before importing them.

Use GGPlot2 to create plots.

If an output of a table is expected, use pandas to display the table.

Charts should display temporal progression, with either 'Week' or 'Season' on the x-axis.
Sort the data by week or season
Convert week or season numbers to numeric type
Handle any missing weeks or seasons appropriately

Available files:
${fileDescriptions.join('\n')}
`;
}
