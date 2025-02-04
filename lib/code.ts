export function extractCodeFromText(text: string) {
  const codeRegex = /```(?:python|r)\s*([\s\S]*?)\s*```/gi;
  const match = codeRegex.exec(text);
  return match ? match[1] : null;
}