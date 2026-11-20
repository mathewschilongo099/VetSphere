// Builds a short, clean summary from the first paragraph of an article.
// Used when an older article has a description that was cut off mid-sentence.
export function buildSummary(markdown: string, max = 155): string {
  const paragraphs = markdown.split(/\n\s*\n/);
  const first =
    paragraphs.find((p) => {
      const t = p.trim();
      return t && !/^(#|[-*+]\s|\d+\.\s|>|!\[|<|\|)/.test(t);
    }) || '';

  const text = first
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= max) return text;

  const cut = text.slice(0, max);
  const lastSentence = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
  if (lastSentence > 60) return cut.slice(0, lastSentence + 1);

  const lastSpace = cut.lastIndexOf(' ');
  return cut.slice(0, lastSpace > 0 ? lastSpace : max).replace(/[,;:\s]+$/, '') + '…';
}
