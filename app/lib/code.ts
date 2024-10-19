export function extractCodeFromText(text: string) {
  const codeRegex = /```python\s*([\s\S]*?)\s*```/g;
  const match = codeRegex.exec(text);
  console.log(text, match);
  return match ? match[1] : null;
}
