/**
 * Partial JSON Parser
 * 
 * This utility allows us to take a prefix of a JSON string that is currently 
 * being streamed (and thus is invalid JSON) and extract a valid partial object.
 */

export function parsePartialJSON<T = any>(jsonString: string): T {
  if (!jsonString || jsonString.trim() === "") {
    return {} as T;
  }

  let cleaned = jsonString.trim();

  // 1. Remove markdown fences if it started with them but hasn't closed them
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "");
  }
  
  // Also remove trailing fence if it's there
  cleaned = cleaned.replace(/\s*```$/, "");

  // 2. The strategy: track nested structures and force-close them
  let stack: string[] = [];
  let inString = false;
  let escaped = false;
  
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    
    if (escaped) {
      escaped = false;
      continue;
    }
    
    if (char === "\\") {
      escaped = true;
      continue;
    }
    
    if (char === "\"") {
      inString = !inString;
      continue;
    }
    
    if (inString) continue;
    
    if (char === "{" || char === "[") {
      stack.push(char);
    } else if (char === "}" || char === "]") {
      stack.pop();
    }
  }

  let repair = cleaned;
  
  // If we are left inside a string, close it
  if (inString) {
    repair += "\"";
  }
  
  // Close all open braces/brackets in reverse order
  for (let i = stack.length - 1; i >= 0; i--) {
    const opener = stack[i];
    if (opener === "{") {
      // If we ended right after a key or colon, we might need to fix the value
      const lastChar = repair.trim().slice(-1);
      if (lastChar === ":" || lastChar === ",") {
         repair = repair.trim().slice(0, -1);
      }
      repair += "}";
    } else {
      repair += "]";
    }
  }

  // Double check and try to parse
  try {
    return JSON.parse(repair) as T;
  } catch (e) {
    // If it still fails, it might be due to a trailing comma or a colon without a value
    try {
      // Try one more aggressive cleanup: remove trailing comma/colon
      const aggressive = repair.replace(/,\s*[}\]]$/, (match) => match.slice(1)).replace(/:\s*[}\]]$/, (match) => " : \"\" " + match.slice(1));
      return JSON.parse(aggressive) as T;
    } catch {
      // Fallback: search for first valid object pattern if everything else fails
      return {} as T;
    }
  }
}
