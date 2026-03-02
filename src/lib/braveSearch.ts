export interface SearchResult {
  title: string;
  url: string;
  description: string;
}

export async function searchWithBrave(query: string): Promise<SearchResult[]> {
  try {
    const response = await fetch("/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      console.error("Search API error:", response.status);
      return [];
    }

    const data = (await response.json()) as { results?: SearchResult[] };
    return data.results || [];
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

export async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return `Unable to fetch content from ${url}`;
    }
    const html = await response.text();
    // Extract text from HTML (simple implementation)
    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, 2000); // Limit to 2000 characters
  } catch (error) {
    console.error("Fetch URL error:", error);
    return `Unable to fetch content from ${url}`;
  }
}

