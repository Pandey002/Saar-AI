/**
 * Extracts and cleans JSON from a string that might contain 
 * markdown code fences, leading/trailing text, or other garbage.
 */
export function extractJSON(raw: string): string {
  let cleaned = raw.trim();

  // 1. Remove markdown code fences if present
  // Matches ```json { ... } ``` or simply ``` { ... } ```
  const codeFenceRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/i;
  const match = cleaned.match(codeFenceRegex);
  if (match && match[1]) {
    cleaned = match[1].trim();
  }

  // 2. Identify the first '{' or '[' and the last '}' or ']'
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  
  let startIdx = -1;
  let endChar = '';

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endChar = '}';
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endChar = ']';
  }

  if (startIdx !== -1) {
    const lastIdx = cleaned.lastIndexOf(endChar);
    if (lastIdx !== -1 && lastIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, lastIdx + 1);
    }
  }

  return cleaned;
}
