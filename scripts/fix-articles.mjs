#!/usr/bin/env node
/**
 * Cleans up src/content/articles/*.md for readers, SEO and AdSense review.
 *
 *   node scripts/fix-articles.mjs          -> dry run (prints a summary, changes nothing)
 *   node scripts/fix-articles.mjs --write  -> applies the changes
 *
 * What it does (safe to re-run):
 *  - author            -> "Mathews Chilongo"
 *  - description       -> first 1-2 real sentences of the article (no trailing "...")
 *  - excerpt           -> same as description
 *  - category          -> Livestock Health | Pet Care | Disease Prevention
 *  - tags              -> clean topical tags (no single-word fragments such as "peste", "petits")
 *  - imageAlt          -> descriptive alt text
 *  - "## Related Articles" -> rebuilt from category + species overlap, with proper titles
 *  - "## Further Reading"  -> general authoritative sources added once (add article-specific ones by hand)
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'src/content/articles');
const WRITE = process.argv.includes('--write');
const AUTHOR = 'Mathews Chilongo';

const PET_RE = /\b(dog|dogs|puppy|puppies|canine|parvovirus|feline|cat|cats|kitten|rabies-prevention-in-dogs)\b/;
const PREVENTION_RE = /(biosecurity|spot-a-sick|first-aid|deworming|water-quality|heat-stress|zoonotic|vaccination|prevention)/;

const SPECIES = [
  ['cattle', /(cattle|cow|cows|calf|calves|dairy|bovine|bloat|lumpy|tick-fever|east-coast|milk-fever|mastitis|dystocia)/],
  ['goats', /(goat|goats|caprine|ruminants)/],
  ['poultry', /(poultry|chicken|avian|newcastle)/],
  ['pigs', /(swine|pig|pigs)/],
  ['dogs', /(dog|dogs|puppy|canine|parvovirus)/],
  ['cats', /(\bcat\b|cats|feline|kitten)/],
];

const FURTHER_READING = {
  livestock: [
    ['WOAH – World Organisation for Animal Health', 'https://www.woah.org'],
    ['FAO – Animal Production and Health', 'https://www.fao.org'],
    ['Merck Veterinary Manual', 'https://www.merckvetmanual.com'],
  ],
  pets: [
    ['Merck Veterinary Manual', 'https://www.merckvetmanual.com'],
    ['WSAVA – World Small Animal Veterinary Association', 'https://wsava.org'],
    ['WOAH – World Organisation for Animal Health', 'https://www.woah.org'],
  ],
};

function splitFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  return { fm: m[1], body: m[2] };
}

function getField(fm, key) {
  const m = fm.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  if (!m) return '';
  return m[1].trim().replace(/^"(.*)"$/, '$1');
}

function setField(fm, key, valueLiteral) {
  const re = new RegExp(`^${key}:.*$`, 'm');
  if (re.test(fm)) return fm.replace(re, `${key}: ${valueLiteral}`);
  return `${fm}\n${key}: ${valueLiteral}`;
}

const q = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

function stripMd(s) {
  return s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstParagraph(body) {
  for (const block of body.split(/\n\s*\n/)) {
    const t = block.trim();
    if (!t || /^(#|-|\*|\d+\.|!\[|<|>|\|)/.test(t)) continue;
    return stripMd(t);
  }
  return '';
}

function makeDescription(body) {
  const para = firstParagraph(body);
  const sentences = para.match(/[^.!?]+[.!?]+(?=\s|$)/g) || [para];
  let out = (sentences[0] || '').trim();
  if (sentences[1] && (out + ' ' + sentences[1].trim()).length <= 155 && out.length < 110) {
    out += ' ' + sentences[1].trim();
  }
  if (out.length > 160) {
    out = out.slice(0, 157).replace(/\s+\S*$/, '').replace(/[,;:–—-]$/, '') + '…';
  }
  return out;
}

function classify(slug) {
  if (PET_RE.test(slug.replace(/-/g, ' ')) || /rabies-prevention-in-dogs/.test(slug)) return 'pets';
  if (PREVENTION_RE.test(slug)) return 'prevention';
  return 'livestock';
}

const CATEGORY_LABEL = {
  pets: 'Pet Care',
  prevention: 'Disease Prevention',
  livestock: 'Livestock Health',
};

function speciesOf(slug) {
  return SPECIES.filter(([, re]) => re.test(slug)).map(([name]) => name);
}

function makeTags(title, slug, kind) {
  const tags = [title.toLowerCase(), ...speciesOf(slug)];
  if (kind === 'pets') tags.push('pets', 'pet care');
  if (kind === 'livestock') tags.push('livestock', 'livestock health');
  if (kind === 'prevention') tags.push('disease-prevention', 'prevention');
  tags.push('animal health');
  return [...new Set(tags)];
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
const meta = {};
for (const f of files) {
  const parts = splitFrontmatter(fs.readFileSync(path.join(DIR, f), 'utf8'));
  if (!parts) continue;
  const slug = f.replace(/\.md$/, '');
  const kind = classify(slug);
  meta[slug] = {
    slug,
    title: getField(parts.fm, 'title'),
    kind,
    species: speciesOf(slug),
  };
}

function relatedFor(slug) {
  const me = meta[slug];
  return Object.values(meta)
    .filter((o) => o.slug !== slug)
    .map((o) => {
      const shared = o.species.filter((s) => me.species.includes(s)).length;
      const score = shared * 3 + (o.kind === me.kind ? 1 : 0);
      return { o, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.o.title.localeCompare(b.o.title))
    .slice(0, 3)
    .map((x) => x.o);
}

let changed = 0;
for (const f of files) {
  const slug = f.replace(/\.md$/, '');
  const file = path.join(DIR, f);
  const raw = fs.readFileSync(file, 'utf8');
  const parts = splitFrontmatter(raw);
  if (!parts || !meta[slug]) continue;

  let { fm, body } = parts;
  const { title, kind } = meta[slug];

  const desc = makeDescription(body);
  fm = setField(fm, 'author', q(AUTHOR));
  if (desc) {
    fm = setField(fm, 'description', q(desc));
    fm = setField(fm, 'excerpt', q(desc));
  }
  fm = setField(fm, 'category', q(CATEGORY_LABEL[kind]));
  fm = setField(fm, 'tags', `[${makeTags(title, slug, kind).map(q).join(', ')}]`);
  fm = setField(fm, 'imageAlt', q(`Stock photo related to ${title.toLowerCase()}`));

  // Related articles
  const related = relatedFor(slug);
  const relBlock = related.length
    ? `## Related Articles\n\n${related.map((r) => `- [${r.title}](/articles/${r.slug})`).join('\n')}\n\n`
    : '';
  if (/^## Related Articles[\s\S]*?(?=^## |\s*$(?![\s\S]))/m.test(body)) {
    body = body.replace(/^## Related Articles[\s\S]*?(?=^## |(?![\s\S]))/m, relBlock);
  } else if (relBlock) {
    body = body.replace(/^## Conclusion/m, `${relBlock}## Conclusion`);
  }

  // Further reading (once)
  if (!/^## Further Reading/m.test(body)) {
    const list = FURTHER_READING[kind === 'pets' ? 'pets' : 'livestock']
      .map(([name, url]) => `- [${name}](${url})`)
      .join('\n');
    body =
      body.replace(/\s+$/, '') +
      `\n\n## Further Reading\n\nGeneral reference sources. Always confirm diagnosis, treatment and vaccination plans with a licensed veterinarian or your national veterinary authority.\n\n${list}\n`;
  }

  const next = `---\n${fm}\n---\n\n${body.replace(/^\s+/, '')}`;
  if (next !== raw) {
    changed++;
    if (WRITE) fs.writeFileSync(file, next);
    console.log(`${WRITE ? 'updated' : 'would update'}: ${f}  [${CATEGORY_LABEL[kind]}]`);
  }
}

console.log(`\n${changed} of ${files.length} articles ${WRITE ? 'updated' : 'would change (dry run — re-run with --write)'}.`);
