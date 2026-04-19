const webContextCache = new Map<string, string>();

const RECENT_OR_FACTUAL_PATTERN =
  /\b(latest|current|recent|today|2024|2025|2026|trend|trends|gdp|inflation|population|market size|statistics|stats|data|report|budget|tax|policy|rate|news|update|updated)\b/i;

function shouldUseWebAugmentation(sourceText: string) {
  return RECENT_OR_FACTUAL_PATTERN.test(sourceText);
}

async function fetchWikipediaTitles(query: string) {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "opensearch");
  url.searchParams.set("search", query);
  url.searchParams.set("limit", "3");
  url.searchParams.set("namespace", "0");
  url.searchParams.set("format", "json");

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as [string, string[]];
  return Array.isArray(payload?.[1]) ? payload[1] : [];
}

async function fetchWikipediaSummary(title: string) {
  const encodedTitle = encodeURIComponent(title.replace(/\s+/g, "_"));
  const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return "";
  }

  const payload = (await response.json()) as { extract?: string };
  return typeof payload.extract === "string" ? payload.extract : "";
}

async function fetchDuckDuckGoAbstract(query: string) {
  const url = new URL("https://api.duckduckgo.com/");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("no_html", "1");
  url.searchParams.set("skip_disambig", "1");

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    return "";
  }

  const payload = (await response.json()) as { AbstractText?: string };
  return typeof payload.AbstractText === "string" ? payload.AbstractText : "";
}

export async function getOptionalWebContext(sourceText: string, isSource: boolean = false) {
  const query = sourceText.trim();
  if (!query || isSource || !shouldUseWebAugmentation(query)) {
    return "";
  }

  const cacheKey = query.toLowerCase();
  const cached = webContextCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const [titles, abstract] = await Promise.all([
      fetchWikipediaTitles(query),
      fetchDuckDuckGoAbstract(query),
    ]);

    const summaries = (
      await Promise.all(titles.slice(0, 2).map((title) => fetchWikipediaSummary(title)))
    ).filter(Boolean);

    const snippets = [abstract, ...summaries]
      .map((snippet) => snippet.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .slice(0, 3);

    const context = snippets.map((snippet, index) => `- Web insight ${index + 1}: ${snippet}`).join("\n");
    if (context) {
      webContextCache.set(cacheKey, context);
    }

    return context;
  } catch {
    return "";
  }
}
