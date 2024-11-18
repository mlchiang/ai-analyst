// preprocess data based on file extension
export async function preProcessFile(file: File) {
  const parsed = await file.text();

  // get first 5 lines of csv
  if (file.type === "text/csv") {
    const lines = parsed.split("\n");
    const content = lines.slice(0, 5).join("\n");
    return content;
  }

  // return the raw content
  return parsed;
}
