import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Unable to read the uploaded file."));

    reader.readAsText(file);
  });
}

const DEPENDENT_BULLET_START =
  /^(and|or|but|because|so|therefore|thus|including|such as|especially|while|whereas|which|that|who|whom|whose|with|without|by|for|to|of|in|on|at|from|after|before)\b/i;

function normalizeBulletText(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^[,;:\-\u2022]+/, "")
    .trim();
}

function splitSingleSentenceIntoClauses(sentence: string) {
  return sentence
    .split(/(?:,\s+|;\s+)/)
    .map(normalizeBulletText)
    .filter(Boolean);
}

function mergeDependentClauses(clauses: string[]) {
  return clauses.reduce<string[]>((items, clause) => {
    if (items.length === 0) {
      return [clause];
    }

    const isDependent =
      DEPENDENT_BULLET_START.test(clause) ||
      clause.split(/\s+/).length <= 2;

    if (isDependent) {
      items[items.length - 1] = `${items[items.length - 1]} ${clause}`.replace(/\s+/g, " ").trim();
      return items;
    }

    items.push(clause);
    return items;
  }, []);
}

export function toStandaloneBulletPoints(text: string | any[], limit: number) {
  if (Array.isArray(text)) {
    text = text.map(t => typeof t === "string" ? t : (t?.text || "")).join(" ");
  }

  if (typeof text !== "string" || !text) {
    return [];
  }

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(normalizeBulletText)
    .filter(Boolean);

  if (sentences.length === 0) {
    return [];
  }

  if (sentences.length === 1) {
    return mergeDependentClauses(splitSingleSentenceIntoClauses(sentences[0])).slice(0, limit);
  }

  return sentences.slice(0, limit);
}
