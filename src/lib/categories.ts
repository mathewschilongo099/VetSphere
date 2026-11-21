// Single source of truth for article categories. This file is pure (no fs),
// so it can be used from server and client components alike.

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  aliases: string[];
  keywords: string[];
}

export const DEFAULT_CATEGORY = 'Animal Health';

export const CATEGORIES: Category[] = [
  {
    id: 'animal-health',
    slug: 'animal-health',
    name: 'Animal Health',
    description: 'General disease prevention, biosecurity and health topics that apply to many animals.',
    icon: '🏥',
    aliases: ['health'],
    keywords: [],
  },
  {
    id: 'cattle',
    slug: 'cattle',
    name: 'Cattle',
    description: 'Diseases, calving, feeding and herd health for beef and dairy cattle.',
    icon: '🐂',
    aliases: ['beef', 'beef cattle', 'cows'],
    keywords: ['cattle', 'calf', 'calves', 'bovine', 'cow', 'cows', 'heifer', 'heifers', 'beef'],
  },
  {
    id: 'dairy-farming',
    slug: 'dairy-farming',
    name: 'Dairy Farming',
    description: 'Milk production, breeding and health of dairy cows.',
    icon: '🥛',
    aliases: ['dairy'],
    keywords: ['dairy', 'milk', 'mastitis'],
  },
  {
    id: 'goats-sheep',
    slug: 'goats-sheep',
    name: 'Goats & Sheep',
    description: 'Health and management of goats, sheep and other small ruminants.',
    icon: '🐐',
    aliases: ['goat', 'goats', 'sheep', 'goat production', 'sheep production'],
    keywords: ['goat', 'goats', 'sheep', 'caprine', 'ruminants', 'ruminant'],
  },
  {
    id: 'poultry',
    slug: 'poultry',
    name: 'Poultry',
    description: 'Chicken and other poultry diseases, feeding and flock management.',
    icon: '🐔',
    aliases: ['poultry farming', 'chickens'],
    keywords: ['poultry', 'chicken', 'chickens', 'avian', 'newcastle', 'hens', 'layers', 'broilers'],
  },
  {
    id: 'pig-farming',
    slug: 'pig-farming',
    name: 'Pig Farming',
    description: 'Pig health, feeding and swine disease control.',
    icon: '🐷',
    aliases: ['pig', 'pigs', 'swine'],
    keywords: ['pig', 'pigs', 'swine', 'piglet', 'piglets'],
  },
  {
    id: 'pet-care',
    slug: 'pet-care',
    name: 'Pet Care',
    description: 'Health, vaccination and care for dogs, cats and other companion animals.',
    icon: '🐕',
    aliases: ['pet', 'pets', 'dogs', 'cats'],
    keywords: ['dog', 'dogs', 'cat', 'cats', 'puppy', 'puppies', 'kitten', 'kittens', 'canine', 'feline', 'pet', 'pets'],
  },
];

// When a title could fit several categories, the first match in this list wins.
const INFERENCE_ORDER = ['pet-care', 'poultry', 'pig-farming', 'dairy-farming', 'cattle', 'goats-sheep'];

const GENERIC_TAGS = new Set(['veterinary', 'animal health', 'livestock', 'farming', 'vetsphere', 'animals', 'health']);

function keywordRegex(keywords: string[]): RegExp {
  return new RegExp(`\\b(${keywords.join('|')})\\b`, 'i');
}

// Finds a category from its name, slug or an alias (case-insensitive).
export function findCategory(value: string | undefined | null): Category | undefined {
  const v = (value || '').trim().toLowerCase();
  if (!v) return undefined;
  return CATEGORIES.find(
    (c) => c.name.toLowerCase() === v || c.slug === v || c.aliases.includes(v)
  );
}

// Turns old or short links such as ?category=Dairy into the real category name.
export function normalizeCategoryParam(value: string | undefined | null): string {
  const found = findCategory(value);
  return found ? found.name : (value || '').trim();
}

export function inferCategory(title: string, tags: string[] = []): string | null {
  const sources = [title, tags.filter((t) => !GENERIC_TAGS.has(t.toLowerCase())).join(' ')];
  for (const text of sources) {
    if (!text) continue;
    for (const slug of INFERENCE_ORDER) {
      const category = CATEGORIES.find((c) => c.slug === slug);
      if (category && keywordRegex(category.keywords).test(text)) return category.name;
    }
  }
  return null;
}

// Uses the category written in the article when it is a specific one, otherwise
// works it out from the title. Older articles all say "Animal Health".
export function resolveCategory(raw: string | undefined, title: string, tags: string[] = []): string {
  const found = findCategory(raw);
  if (found && found.slug !== 'animal-health') return found.name;
  return inferCategory(title, tags) ?? found?.name ?? DEFAULT_CATEGORY;
}
