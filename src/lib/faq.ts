// Pulls the "Frequently Asked Questions" section out of an article's markdown
// so the page can show it as click-to-open questions. Pure functions.

export interface FaqItem {
  question: string;
  /** Markdown. */
  answer: string;
}

const FAQ_HEADING = /^##\s*(frequently asked questions|faqs?|common questions)\b.*$/i;

function cleanQuestion(raw: string): string {
  return raw
    .replace(/^#{1,6}\s*/, '')
    .replace(/^\s*(?:q(?:uestion)?\s*\d*\s*[:.)-]|\d+\s*[.)])\s*/i, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractFaq(markdown: string): { faqs: FaqItem[]; rest: string } {
  const lines = markdown.split('\n');
  const start = lines.findIndex((l) => FAQ_HEADING.test(l.trim()));
  if (start === -1) return { faqs: [], rest: markdown };

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s+\S/.test(lines[i]) && !/^###/.test(lines[i])) {
      end = i;
      break;
    }
  }

  const section = lines.slice(start + 1, end);
  const faqs: FaqItem[] = [];
  let question = '';
  let answer: string[] = [];

  const flush = () => {
    const text = answer.join('\n').trim();
    if (question && text) faqs.push({ question, answer: text });
    question = '';
    answer = [];
  };

  for (const line of section) {
    const heading = line.match(/^###\s+(.+)$/);
    const bold = line.match(/^\s*(?:\d+[.)]\s*)?\*\*(.+?\?)\*\*\s*$/);
    if (heading) {
      flush();
      question = cleanQuestion(heading[1]);
    } else if (bold) {
      flush();
      question = cleanQuestion(bold[1]);
    } else if (question) {
      answer.push(line);
    }
  }
  flush();

  // A section we could not read as questions stays in the article untouched.
  if (faqs.length < 2) return { faqs: [], rest: markdown };

  const rest = [...lines.slice(0, start), ...lines.slice(end)].join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return { faqs, rest };
}
