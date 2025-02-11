FROM e2bdev/code-interpreter:latest

# Install ggplot2 and its dependencies through R kernel
RUN R -e "install.packages(c('ggplot2', 'dplyr', 'tidyr', 'readr', 'grid', 'ggtext', 'ggforce', 'extrafont', 'nflplotR'), repos='https://cloud.r-project.org', dependencies=TRUE)" && \
    R -e "library(IRkernel); IRkernel::installspec(user = FALSE, name = 'r', displayname = 'R')"
