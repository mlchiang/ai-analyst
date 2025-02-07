FROM e2bdev/code-interpreter:latest

# Install R
RUN apt-get update && apt-get install -y r-base

# Install required R packages
RUN R -e "install.packages('ggplot2', repos='http://cran.rstudio.com/')"

# You can add more packages as needed
RUN R -e "install.packages(c('dplyr', 'tidyr', 'readr'), repos='http://cran.rstudio.com/')"
