export interface MathSegment {
  type: "text" | "math";
  value: string;
  display: boolean;
}

const explicitMathRegex = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
const mathToken =
  String.raw`(?:\\[A-Za-z]+|[A-Za-z]+\d*|\d+(?:\.\d+)?|[(){}\[\]]|[+\-*/=^]|√|∫|Σ|π|∞|≤|≥|≠|≈|->|→|,)`;
const autoMathRegex = new RegExp(`(${mathToken}(?:\\s*${mathToken}){2,})`, "g");

export function containsMathNotation(text: string) {
  return tokenizeMath(text).some((segment) => segment.type === "math");
}

export function isLikelyStandaloneFormula(text: string) {
  const trimmed = stripMathDelimiters(text).trim();
  if (!trimmed) {
    return false;
  }

  if (trimmed.includes("\n")) {
    return true;
  }

  return isLikelyMathExpression(trimmed) && countWords(trimmed) <= 12;
}

export function normalizeFormulaToLatex(input: string) {
  const raw = stripMathDelimiters(input).trim();
  if (!raw) {
    return "";
  }

  const normalizedComparators = raw
    .replace(/<=/g, " \\le ")
    .replace(/>=/g, " \\ge ")
    .replace(/!=/g, " \\ne ")
    .replace(/=>/g, " \\Rightarrow ")
    .replace(/->/g, " \\to ")
    .replace(/→/g, " \\to ")
    .replace(/≈/g, " \\approx ")
    .replace(/Σ/g, " \\sum ")
    .replace(/∫/g, " \\int ")
    .replace(/π/g, " \\pi ")
    .replace(/∞/g, " \\infty ");

  if (normalizedComparators.includes("=")) {
    const [left, ...rest] = normalizedComparators.split("=");
    const right = rest.join("=").trim();
    if (right) {
      return `${normalizeExpressionSide(left.trim())} = ${normalizeExpressionSide(right)}`.trim();
    }
  }

  return normalizeExpressionSide(normalizedComparators);
}

export function tokenizeMath(text: string): MathSegment[] {
  if (!text) {
    return [];
  }

  const explicitSegments: MathSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(explicitMathRegex)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      explicitSegments.push({ type: "text", value: text.slice(lastIndex, index), display: false });
    }

    const value = match[1] ?? match[2] ?? "";
    explicitSegments.push({
      type: "math",
      value: value.trim(),
      display: Boolean(match[1]) || isLikelyStandaloneFormula(value),
    });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    explicitSegments.push({ type: "text", value: text.slice(lastIndex), display: false });
  }

  return mergeTextSegments(explicitSegments.flatMap((segment) => {
    if (segment.type === "math") {
      return [segment];
    }

    return autoDetectMathSegments(segment.value);
  }));
}

function autoDetectMathSegments(text: string): MathSegment[] {
  if (!text) {
    return [];
  }

  const segments: MathSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(autoMathRegex)) {
    const candidate = match[0];
    const index = match.index ?? 0;
    if (!isLikelyMathExpression(candidate)) {
      continue;
    }

    if (index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, index), display: false });
    }

    segments.push({
      type: "math",
      value: candidate.trim(),
      display: shouldDisplayAsBlock(text, candidate, index),
    });
    lastIndex = index + candidate.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex), display: false });
  }

  return segments.length > 0 ? segments : [{ type: "text", value: text, display: false }];
}

function shouldDisplayAsBlock(source: string, candidate: string, index: number) {
  const before = source.slice(0, index).trim();
  const after = source.slice(index + candidate.length).trim();
  return !before && !after && isLikelyStandaloneFormula(candidate);
}

function isLikelyMathExpression(value: string) {
  const text = value.trim();
  if (text.length < 3) {
    return false;
  }

  if (/[.!?]$/.test(text)) {
    return false;
  }

  const operators = (text.match(/[=^/*]|√|∫|Σ|≤|≥|≠|≈|\\frac|\\sqrt|\\sum|\\int/g) ?? []).length;
  const variableLike = (text.match(/\b(?:[A-Za-z]+\d*|\d+(?:\.\d+)?)\b/g) ?? []).length;
  // Count both lowercase and capitalized words as English words to avoid misidentifying sentences as math
  const englishWords = (text.match(/\b[A-Za-z]{3,}\b/g) ?? []).filter((token) => !/^(sin|cos|tan|log|ln|lim|max|min|and|for|with|from|then)$/i.test(token)).length;

  if (text.includes("\\frac") || text.includes("\\sqrt") || text.includes("\\sum") || text.includes("\\int")) {
    return true;
  }

  if (englishWords > 2) {
    return false;
  }

  if (/[=^]/.test(text) && variableLike >= 2) {
    return true;
  }

  if ((text.includes("/") || /√|∫|Σ/.test(text)) && variableLike >= 1) {
    return true;
  }

  return operators >= 2 && variableLike >= 2;
}

function normalizeExpressionSide(expression: string) {
  let result = expression.trim();

  if (!result) {
    return "";
  }

  result = convertSquareRoot(result);
  result = convertSimpleFraction(result);
  result = result.replace(/\*/g, " \\cdot ");
  result = result.replace(/([A-Za-z])(\d+)/g, "$1_{$2}");
  result = result.replace(/([A-Za-z0-9}\])])\^([A-Za-z0-9]+)/g, "$1^{$2}");
  result = result.replace(/\s+/g, " ").trim();

  return result;
}

function convertSquareRoot(expression: string) {
  return expression.replace(/√\s*(\([^)]+\)|[A-Za-z0-9]+)/g, (_, value: string) => {
    const normalized = stripOuterGrouping(value.trim());
    return `\\sqrt{${normalized}}`;
  });
}

function convertSimpleFraction(expression: string) {
  if (expression.includes("\\frac")) {
    return expression;
  }

  const slashCount = (expression.match(/\//g) ?? []).length;
  if (slashCount !== 1) {
    return expression;
  }

  const [numerator, denominator] = expression.split(/\s*\/\s*/);
  if (!numerator || !denominator) {
    return expression;
  }

  return `\\frac{${stripOuterGrouping(numerator.trim())}}{${stripOuterGrouping(denominator.trim())}}`;
}

function stripMathDelimiters(text: string) {
  return text.replace(/^\$\$?/, "").replace(/\$\$?$/, "");
}

function stripOuterGrouping(value: string) {
  if (
    (value.startsWith("(") && value.endsWith(")")) ||
    (value.startsWith("[") && value.endsWith("]")) ||
    (value.startsWith("{") && value.endsWith("}"))
  ) {
    return value.slice(1, -1).trim();
  }

  return value;
}

function mergeTextSegments(segments: MathSegment[]) {
  return segments.reduce<MathSegment[]>((items, segment) => {
    if (!segment.value) {
      return items;
    }

    const previous = items[items.length - 1];
    if (previous?.type === "text" && segment.type === "text") {
      previous.value += segment.value;
      return items;
    }

    items.push(segment);
    return items;
  }, []);
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
