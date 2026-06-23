/** YouTube's normal watch/share URLs refuse to load in an iframe (X-Frame-Options);
 * only the /embed/ path is iframe-able. Converts to that form when recognized,
 * otherwise returns the URL unchanged. */
export function toEmbeddableUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  const host = parsed.hostname.replace(/^(www|m)\./, "");

  if (host === "youtube.com") {
    const videoId = parsed.searchParams.get("v");
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/?]+)/);
    if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    return url;
  }
  if (host === "youtu.be") {
    const videoId = parsed.pathname.slice(1).split("/")[0];
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  }
  return url;
}
