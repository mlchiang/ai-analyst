import { CustomFiles } from "./types";

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

async function fetchFileContent(path: string): Promise<string> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
  }
  return response.text();
}

export async function toPrompt(data: { files: CustomFiles[] }) {
  // Get column names for each file
  const fileDescriptions = await Promise.all(
    coreFiles.map(async (file) => {
      const content = await fetchFileContent(file.path);
      const headers = content.split('\n')[0];
      return `- ${file.name} (columns: ${headers})`;
    })
  );

  return `
You are a sophisticated R sports data scientist/analyst.
You are provided with a question and a dataset.
Generate a R script to be run in a Jupyter notebook that calculates the result and renders a plot.
Only one code block is allowed, use markdown code blocks.

'ggplot2', 'dplyr', 'tidyr', 'readr', 'grid', 'ggtext', 'jsonlite', 'ggforce', 'extrafont', 'nflplotR' are installed. NEVER install or use additional packages.
Install additional packages (using library syntax) to import them. 


Use GGPlot2 to create plots.

If an output of a table is expected, use pandas to display the table.

Charts should display temporal progression, with either 'Week' or 'Season' on the x-axis.
Sort the data by week or season
Convert week or season numbers to numeric type
Handle any missing weeks or seasons appropriately
You can use nflplotR::geom_nfl_headshots(aes(player_gsis = player_gsis), height = 0.2, alpha = 0.5) to add player headshots to a plot. 
Don't forget to install the nflplotR package when using geom_nfl_headshots or geom_nfl_logos.

I will also provide you with types of charts you can create and code to create them.

A Diamond Plot is a type of chart that displays the relationship between two variables. We will want to use player_photo_url or team logos to denote the data. 
This is a great chart for showing the relationship between two variables, such as Offensive EPA vs. Defensive EPA, or Passing EPA vs. Rushing EPA.

library(nflplotR)
library(nflreadr)
library(grid)
library(ggtext)
libryar(nflplotR)

# data loading and wrangling copied from: https://www.nflfastr.com/articles/beginners_guide.html#figures-with-qb-stats
pbp <- nflreadr::load_pbp(2024) %>%
  dplyr::filter(season_type == "REG") %>%
  dplyr::filter(!is.na(posteam) & (rush == 1 | pass == 1))

offense <- pbp %>%
  dplyr::group_by(team = posteam) %>%
  dplyr::summarise(off_epa = mean(epa, na.rm = TRUE))

defense <- pbp %>%
  dplyr::group_by(team = defteam) %>%
  dplyr::summarise(def_epa = mean(epa, na.rm = TRUE))

df <- offense %>% 
  inner_join(defense, by = "team")

# find the max absolute value of off/def epa for our plot
sort(abs(c(max(df$off_epa), max(df$def_epa), min(df$off_epa), min(df$def_epa))), decreasing = T)

# set max and min for off and def epa (want them to be symmetric for chart)
off_epa_min <- -.25
off_epa_max <- .25
def_epa_min <- -.25
def_epa_max <- .25

# set rotation to 45 degrees
rotation <- 45

p_cb <- df %>%
  ggplot(aes(x = off_epa, y = def_epa)) + 
  # add color blocking
  annotate("rect", xmin = (off_epa_max + off_epa_min) / 2, xmax = off_epa_max, 
           ymin = def_epa_min, ymax = (def_epa_max + def_epa_min) / 2, fill= "#a6dba0", alpha = .5, color = 'transparent') + 
  annotate("rect", xmin = off_epa_min, xmax = (off_epa_max + off_epa_min) / 2, 
           ymin = (def_epa_max + def_epa_min) / 2, ymax = def_epa_max, fill= "#c2a5cf", alpha = .5, color = 'transparent') +
  annotate("rect", xmin = (off_epa_max + off_epa_min) / 2, xmax = off_epa_max,
           ymin = (def_epa_max + def_epa_min) / 2, ymax = def_epa_max, fill= "#f7f7f7", alpha = .5, color = 'transparent') +
  annotate("rect", xmin = off_epa_min, xmax = (off_epa_max + off_epa_min) / 2,
           ymin = def_epa_min, ymax = (def_epa_max + def_epa_min) / 2, fill= "#f7f7f7", alpha = .5, color = 'transparent') +
  # hack together a few chart guides (ie, 'Good D, Bad D')
  suppressWarnings(geom_richtext(aes(x = .20, y = .20, label = "Good O, Bad D"), angle = -1 * rotation, size = 2.75,  fontface = 'bold', color = 'black', fill = "#f7f7f7"))  +
  suppressWarnings(geom_richtext(aes(x = -.20, y = -.20, label = "Bad O, Good D"), angle = -1 * rotation,  size = 2.75,   fontface = 'bold', color = 'black', fill = "#f7f7f7"))   +
  suppressWarnings(geom_richtext(aes(x = -.205, y = .205, label = "Bad O, Bad D"), angle = -1 * rotation, size = 2.75,  fontface = 'bold', color = 'white',  fill = "#762a83", label.colour = 'black'))  +
  suppressWarnings(geom_richtext(aes(x = .215, y = -.215, label = "Good O, Good D"), angle = -1 * rotation,  size = 2.75,  fontface = 'bold', color = 'white', fill = "#1b7837", label.colour = 'black')) +
  # add team logos 
  geom_nfl_logos(aes(team_abbr = team), width = 0.09, alpha = 0.75, angle = -1*rotation) +
  scale_y_reverse(limits = c(def_epa_max, def_epa_min), breaks = seq(.25, -.25, -.05), 
                  labels = scales::number_format(style_positive = "plus", accuracy = .01)) +  
  scale_x_continuous(limits = c(off_epa_min, off_epa_max), breaks = seq(-.25, .25, .05), 
                     labels = scales::number_format(style_positive = "plus", accuracy = .01)) +
  coord_equal(clip = 'off') +
  # add axis labels
  labs(
    x = "Offensive EPA/play",
    y = "Defensive EPA/play"
    ) +
  # thematic stuff 
  theme_minimal() + 
  theme(axis.text.x = element_text(angle=(-1 * rotation), hjust = 0.5, margin = margin(t = -9.5)),
        axis.text.y = element_text(angle=(-1 * rotation), hjust = 0.5, margin = margin(r = -5)),
        axis.title.x = element_text(size = 12,
                                    vjust = 0.5, 
                                    margin = margin(t = 10),
                                    face = 'bold',
                                    color = "black"),
        axis.title.y = element_text(size = 12,
                                    angle=(-1 * rotation - 45),
                                    hjust = 0.5,
                                    margin = margin(r = 10),
                                    color = "black", 
                                    face = 'bold'),
        plot.margin = margin(1.15, .5, .5, -.25, unit = 'in'),
        panel.grid.minor = element_blank(),
        plot.background = element_rect(fill = 'floralwhite', color = "floralwhite")) +
  # hack together a title and subtitle
  annotate(geom = 'text', x = .235, y = -.235, label = "2024 NFL Offensive and Defensive EPA per Play", angle = -1 * rotation, vjust = -3.5, fontface = 'bold', size = 4) +
  annotate(geom = 'text', x = .235, y = -.235, label = paste0("As of ", format.Date(Sys.Date(), "%B %d, %Y"), ""), angle = -1 * rotation, vjust = -2.5, size = 3)


  #save plot
  png("epa_diamond_plot.png", res = 300, width = 6, height = 6, units = 'in', bg = 'floralwhite')

print(p_cb, vp=viewport(angle=rotation,  
width = unit(6, "in"), 
height = unit(6, "in")))

Available files:
${fileDescriptions.join('\n')}
`;
}
