// preprocess data based on file extension
export function preProcessFile(filename: string, base64: string) {
  const parsed = atob(base64);

  // get first 5 lines of csv
  if (filename.endsWith(".csv")) {
    const lines = parsed.split("\n");
    const content = lines.slice(0, 5).join("\n");
    return content;
  }

  // return the raw content
  return parsed;
}
