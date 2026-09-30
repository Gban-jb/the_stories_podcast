/**
 * Show notes are written in the admin page, so they're first-party text — but
 * they still get escaped before any markup is added. Escape first, then apply a
 * small set of inline patterns to the already-safe string: that ordering is
 * what makes injecting a tag impossible, rather than a blocklist.
 *
 * Supported: ## / ### headings, - bullets, **bold**, *italic*, `code`,
 * [text](https://url), blank-line paragraphs. Deliberately not a full parser.
 */

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Only http(s) and mailto survive, so a link can't become javascript:. */
function safeHref(href: string): string | null {
  const trimmed = href.trim();
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) return trimmed;
  return null;
}

function inline(escaped: string): string {
  return escaped
    .replace(/`([^`]+)`/g, '<code class="timecode text-cassette">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-bone">$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, text: string, href: string) => {
      const safe = safeHref(href);
      if (!safe) return text;
      const external = /^https?:/i.test(safe);
      const attrs = external ? ' target="_blank" rel="noreferrer"' : "";
      return `<a href="${safe}"${attrs} class="text-signal underline underline-offset-4 decoration-signal/40 hover:decoration-signal">${text}</a>`;
    });
}

export function renderNotes(markdown: string): string {
  const blocks = escapeHtml(markdown.trim()).split(/\n{2,}/);
  const html: string[] = [];

  for (const block of blocks) {
    const lines = block.split("\n");

    if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
      const items = lines
        .map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ""))}</li>`)
        .join("");
      html.push(`<ul class="my-5 space-y-2 pl-5 list-disc marker:text-signal-deep">${items}</ul>`);
      continue;
    }

    const heading = /^(#{2,3})\s+(.*)$/.exec(block);
    if (heading) {
      const level = heading[1].length;
      const size = level === 2 ? "text-2xl mt-10" : "text-xl mt-8";
      html.push(
        `<h${level} class="font-display ${size} mb-3 text-bone">${inline(heading[2])}</h${level}>`,
      );
      continue;
    }

    html.push(
      `<p class="my-5 leading-relaxed">${inline(block.replace(/\n/g, "<br />"))}</p>`,
    );
  }

  return html.join("");
}

/** Transcripts are plain text; keep the paragraphing and nothing else. */
export function renderTranscript(text: string): string {
  return escapeHtml(text.trim())
    .split(/\n{2,}/)
    .map((p) => `<p class="my-4 leading-relaxed">${p.replace(/\n/g, "<br />")}</p>`)
    .join("");
}
