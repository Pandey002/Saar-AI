import { NextResponse } from "next/server";

function stripHtmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|li|h1|h2|h3|h4|h5|h6)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, "\"")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function normalizeUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export async function POST(request: Request) {
  const body = (await request.json()) as { url?: string };
  const normalizedUrl = normalizeUrl(body.url ?? "");

  if (!normalizedUrl) {
    return NextResponse.json({ error: "Please provide a URL to extract." }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalizedUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
  }

  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent": "VidyaAI/1.0 (+study workspace extractor)",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Unable to fetch the URL. Received status ${response.status}.` },
        { status: 400 }
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return NextResponse.json(
        { error: "This URL does not expose readable HTML or plain text content." },
        { status: 400 }
      );
    }

    const bodyText = await response.text();
    const extracted = contentType.includes("text/plain") ? bodyText.trim() : stripHtmlToText(bodyText);

    if (!extracted) {
      return NextResponse.json({ error: "No readable text was found at that URL." }, { status: 400 });
    }

    return NextResponse.json({
      data: {
        text: extracted.slice(0, 40000),
        title: parsedUrl.hostname,
        url: parsedUrl.toString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to extract content from the URL.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
