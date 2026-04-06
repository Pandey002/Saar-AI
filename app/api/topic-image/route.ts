import { NextResponse } from "next/server";
import type { TopicImageData } from "@/types";

interface SearchResult {
  title?: string;
  snippet?: string;
}

interface SummaryResult {
  title?: string;
  description?: string;
  thumbnail?: {
    source?: string;
  };
  originalimage?: {
    source?: string;
  };
  content_urls?: {
    desktop?: {
      page?: string;
    };
  };
}

interface CommonsResponse {
  query?: {
    pages?: Record<
      string,
      {
        title?: string;
        imageinfo?: Array<{
          thumburl?: string;
          url?: string;
          descriptionurl?: string;
        }>;
      }
    >;
  };
}

const TOPIC_ALIASES: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bdemonitization\b/gi, replacement: "demonetisation" },
  { pattern: /\bdemonetization\b/gi, replacement: "demonetisation" },
  { pattern: /\bmanipur riots\b/gi, replacement: "Manipur violence" },
];

function normalizeTopicQuery(topic: string) {
  let normalized = topic.trim();

  for (const alias of TOPIC_ALIASES) {
    normalized = normalized.replace(alias.pattern, alias.replacement);
  }

  normalized = normalized
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(kya hai|kya tha|kya hota hai|ka chart|ki prakriya|ke prabhav|ka prabhav|ke karan|kaaran|karan|prakriya|samjhao|samjhaiye|samjhaayein|in hindi)\b/gi, " ")
    .replace(/\b(summary|explain|explanation|assignment|revision|understanding|concepts?)\b/gi, " ")
    .replace(/[^\w\s:-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized;
}

function buildTopicVariants(topic: string) {
  const cleaned = normalizeTopicQuery(topic);

  const variants = [cleaned];
  const beforeColon = cleaned.split(":")[0]?.trim();
  if (beforeColon && beforeColon !== cleaned) {
    variants.push(beforeColon);
  }

  const firstWords = cleaned.split(/\s+/).slice(0, 5).join(" ").trim();
  if (firstWords && !variants.includes(firstWords)) {
    variants.push(firstWords);
  }

  const synonymVariants = [
    cleaned.replace(/\briots\b/gi, "violence"),
    cleaned.replace(/\briot\b/gi, "violence"),
    cleaned.replace(/\briots\b/gi, "conflict"),
    cleaned.replace(/\briots\b/gi, "unrest"),
  ]
    .map((item) => item.trim())
    .filter(Boolean);

  for (const variant of synonymVariants) {
    if (!variants.includes(variant)) {
      variants.push(variant);
    }
  }

  const lowerCleaned = cleaned.toLowerCase();
  if (lowerCleaned.includes("manipur") && (lowerCleaned.includes("riot") || lowerCleaned.includes("violence"))) {
    variants.unshift("2023 Manipur violence");
  }

  return variants.filter(Boolean);
}

function normalizeImageUrl(value?: string) {
  if (!value) {
    return "";
  }

  return value.startsWith("//") ? `https:${value}` : value;
}

function tokenSet(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/\briots?\b/g, "violence")
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
  );
}

function scoreCandidate(topic: string, title: string, imageUrl: string) {
  const topicTokens = tokenSet(topic);
  const titleTokens = tokenSet(title);
  const overlap = [...topicTokens].filter((token) => titleTokens.has(token)).length;
  const nonSvgBonus = imageUrl.toLowerCase().includes(".svg") ? 0 : 3;
  const fullPhraseBonus = title.toLowerCase().includes(topic.toLowerCase().replace(/\briots?\b/g, "violence")) ? 6 : 0;
  const listPenalty = title.toLowerCase().startsWith("list of") ? -6 : 0;
  return overlap * 4 + nonSvgBonus + fullPhraseBonus + listPenalty;
}

async function searchWikimediaCommonsImage(topic: string): Promise<TopicImageData | null> {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", `${topic} filetype:bitmap`);
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrlimit", "6");
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url");
  url.searchParams.set("iiurlwidth", "1400");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "SaarAI/1.0 (study workspace image fetcher)",
    },
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as CommonsResponse;
  const pages = Object.values(payload.query?.pages ?? {});

  for (const page of pages) {
    const image = page.imageinfo?.[0];
    const imageUrl = normalizeImageUrl(image?.thumburl || image?.url);

    if (!imageUrl || imageUrl.toLowerCase().includes(".svg")) {
      continue;
    }

    return {
      imageUrl,
      title: (page.title || "Wikimedia Commons").replace(/^File:/, ""),
      description: "Reference image from Wikimedia Commons",
      sourceUrl: image?.descriptionurl || "https://commons.wikimedia.org",
      sourceLabel: "Wikimedia Commons",
    };
  }

  return null;
}

async function searchWikipediaImage(topic: string): Promise<TopicImageData | null> {
  const normalizedTopic = normalizeTopicQuery(topic);
  const variants = buildTopicVariants(normalizedTopic);
  const preferredTitles: string[] = [];

  const lowerTopic = normalizedTopic.toLowerCase();
  if (lowerTopic.includes("demonetisation")) {
    preferredTitles.push("2016 Indian banknote demonetisation");
    preferredTitles.push("Demonetization");
  }
  if (lowerTopic.includes("manipur") && (lowerTopic.includes("riot") || lowerTopic.includes("violence"))) {
    preferredTitles.push("2023 Manipur violence");
    preferredTitles.push("Insurgency in Manipur");
  }

  for (const preferredTitle of preferredTitles) {
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(preferredTitle.replace(/\s+/g, "_"))}`;
    const summaryResponse = await fetch(summaryUrl, {
      headers: {
        "User-Agent": "SaarAI/1.0 (study workspace image fetcher)",
      },
      next: { revalidate: 86400 },
    });

    if (!summaryResponse.ok) {
      continue;
    }

    const summary = (await summaryResponse.json()) as SummaryResult;
    const imageUrl = normalizeImageUrl(summary.originalimage?.source || summary.thumbnail?.source);

    if (imageUrl && !imageUrl.toLowerCase().includes(".svg")) {
      return {
        imageUrl,
        title: summary.title || preferredTitle,
        description: summary.description || "Reference image from Wikipedia",
        sourceUrl:
          summary.content_urls?.desktop?.page ||
          `https://en.wikipedia.org/wiki/${encodeURIComponent(preferredTitle.replace(/\s+/g, "_"))}`,
        sourceLabel: "Wikipedia",
      };
    }
  }

  for (const variant of variants) {
    const url = new URL("https://en.wikipedia.org/w/rest.php/v1/search/page");
    url.pathname = "/w/api.php";
    url.searchParams.set("action", "query");
    url.searchParams.set("list", "search");
    url.searchParams.set("srsearch", `intitle:"${variant}" OR ${variant}`);
    url.searchParams.set("srlimit", "5");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "SaarAI/1.0 (study workspace image fetcher)",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      continue;
    }

    const payload = (await response.json()) as { query?: { search?: SearchResult[] } };
    const candidates = (payload.query?.search ?? []).filter((page) => page.title).slice(0, 5);

    let bestMatch: TopicImageData | null = null;
    let bestScore = -1;

    for (const candidate of candidates) {
      const title = candidate.title!;
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/\s+/g, "_"))}`;
      const summaryResponse = await fetch(summaryUrl, {
        headers: {
          "User-Agent": "SaarAI/1.0 (study workspace image fetcher)",
        },
        next: { revalidate: 86400 },
      });

      if (!summaryResponse.ok) {
        continue;
      }

      const summary = (await summaryResponse.json()) as SummaryResult;
      const imageUrl = normalizeImageUrl(summary.originalimage?.source || summary.thumbnail?.source);

      if (!imageUrl) {
        continue;
      }

      const candidateScore = scoreCandidate(normalizedTopic || variant, title, imageUrl);

      if (candidateScore > bestScore) {
        bestScore = candidateScore;
        bestMatch = {
          imageUrl,
          title: summary.title || title,
          description: summary.description || candidate.snippet || "Reference image from Wikipedia",
          sourceUrl:
            summary.content_urls?.desktop?.page ||
            `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, "_"))}`,
          sourceLabel: "Wikipedia",
        };
      }
    }

    if (bestMatch) {
      if (bestMatch.imageUrl.toLowerCase().includes(".svg")) {
        const commonsImage = await searchWikimediaCommonsImage(normalizedTopic || variant);
        if (commonsImage) {
          return commonsImage;
        }
      }
      return bestMatch;
    }
  }

  return searchWikimediaCommonsImage(normalizedTopic);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic")?.trim();

  if (!topic) {
    return NextResponse.json({ error: "Missing topic." }, { status: 400 });
  }

  try {
    const image = await searchWikipediaImage(topic);

    if (!image) {
      return NextResponse.json({ data: null }, { status: 200 });
    }

    return NextResponse.json({ data: image }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch topic image.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
