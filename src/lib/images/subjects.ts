// Works out which animal an article is about, so pictures can be searched for
// and checked against the right animal. Pure functions, no network.

export interface Subject {
  key: string;
  /** Plain name used in picture checks, e.g. "chickens". */
  label: string;
  /** Words in the article that point to this animal. */
  terms: string[];
  /** Picture searches, best first. Always about the animal, never the disease. */
  queries: string[];
  /** Words in a photo's description that show it is the right animal. */
  show: string[];
  /** Words in a photo's description that show it is the WRONG animal. */
  wrong: string[];
}

const PETS = ['dog', 'dogs', 'puppy', 'puppies', 'cat', 'cats', 'kitten', 'kittens'];
const FARM = ['cow', 'cows', 'cattle', 'goat', 'goats', 'sheep', 'lamb', 'pig', 'pigs', 'chicken', 'chickens', 'hen', 'hens'];

export const SUBJECTS: Subject[] = [
  {
    key: 'chicken',
    label: 'chickens',
    terms: ['chicken', 'chickens', 'poultry', 'hen', 'hens', 'layer', 'layers', 'broiler', 'broilers', 'fowl', 'newcastle', 'avian', 'bird flu', 'egg', 'eggs', 'coccidiosis', 'rooster', 'chicks'],
    queries: ['chickens poultry farm', 'hens in a chicken coop', 'free range chickens', 'chicks poultry house'],
    show: ['chicken', 'chickens', 'hen', 'hens', 'poultry', 'rooster', 'chick', 'chicks', 'fowl', 'coop'],
    wrong: [...PETS, 'cow', 'cows', 'cattle', 'goat', 'goats', 'sheep', 'pig', 'pigs', 'horse'],
  },
  {
    key: 'dairy',
    label: 'dairy cows',
    terms: ['dairy', 'milk', 'milking', 'mastitis', 'udder', 'lactating', 'lactation', 'milk fever', 'teat'],
    queries: ['dairy cows farm', 'cows in a milking parlour', 'dairy cattle barn', 'holstein cows'],
    show: ['cow', 'cows', 'cattle', 'dairy', 'calf', 'heifer', 'holstein', 'milking'],
    wrong: [...PETS, 'chicken', 'chickens', 'hen', 'hens', 'goat', 'goats', 'sheep', 'pig', 'pigs', 'horse'],
  },
  {
    key: 'cattle',
    label: 'cattle',
    terms: ['cattle', 'cow', 'cows', 'bovine', 'calf', 'calves', 'beef', 'bull', 'bulls', 'heifer', 'lumpy skin', 'east coast fever', 'tick fever', 'bloat', 'herd', 'steer'],
    queries: ['cattle herd on farm', 'cows grazing pasture', 'beef cattle', 'calves in a field'],
    show: ['cow', 'cows', 'cattle', 'calf', 'calves', 'bull', 'bulls', 'heifer', 'steer', 'oxen', 'herd'],
    wrong: [...PETS, 'chicken', 'chickens', 'hen', 'hens', 'goat', 'goats', 'sheep', 'pig', 'pigs', 'horse'],
  },
  {
    key: 'goat',
    label: 'goats',
    terms: ['goat', 'goats', 'caprine', 'peste des petits', 'ppr', 'kid', 'kids', 'foot rot'],
    queries: ['goats on a farm', 'goat herd', 'goats grazing', 'young goats kids'],
    show: ['goat', 'goats', 'kid', 'kids', 'caprine'],
    wrong: [...PETS, 'chicken', 'chickens', 'hen', 'hens', 'cow', 'cows', 'cattle', 'pig', 'pigs', 'horse'],
  },
  {
    key: 'sheep',
    label: 'sheep',
    terms: ['sheep', 'lamb', 'lambs', 'ovine', 'ewe', 'ewes', 'ram', 'wool'],
    queries: ['sheep flock', 'sheep grazing', 'lambs on a farm', 'ewes and lambs'],
    show: ['sheep', 'lamb', 'lambs', 'ewe', 'ewes', 'flock', 'ram'],
    wrong: [...PETS, 'chicken', 'chickens', 'hen', 'hens', 'cow', 'cows', 'cattle', 'pig', 'pigs', 'horse'],
  },
  {
    key: 'pig',
    label: 'pigs',
    terms: ['pig', 'pigs', 'swine', 'hog', 'hogs', 'piglet', 'piglets', 'sow', 'sows', 'african swine fever'],
    queries: ['pigs on a farm', 'piglets in a pig pen', 'swine farm', 'sow with piglets'],
    show: ['pig', 'pigs', 'piglet', 'piglets', 'swine', 'sow', 'hog'],
    wrong: [...PETS, 'chicken', 'chickens', 'hen', 'hens', 'cow', 'cows', 'cattle', 'goat', 'goats', 'sheep', 'horse'],
  },
  {
    key: 'dog',
    label: 'dogs',
    terms: ['dog', 'dogs', 'canine', 'puppy', 'puppies', 'parvovirus', 'distemper', 'rabies'],
    queries: ['dog at the veterinarian', 'puppy', 'healthy dog', 'vet examining a dog'],
    show: ['dog', 'dogs', 'puppy', 'puppies', 'canine'],
    wrong: ['cat', 'cats', 'kitten', ...FARM.filter((w) => !['dog', 'dogs'].includes(w))],
  },
  {
    key: 'cat',
    label: 'cats',
    terms: ['cat', 'cats', 'feline', 'kitten', 'kittens'],
    queries: ['cat at the veterinarian', 'kitten', 'healthy cat', 'vet examining a cat'],
    show: ['cat', 'cats', 'kitten', 'kittens', 'feline'],
    wrong: ['dog', 'dogs', 'puppy', 'puppies', ...FARM],
  },
  {
    key: 'livestock',
    label: 'farm animals (cattle, goats, sheep, pigs or chickens)',
    terms: [],
    queries: ['livestock farm', 'farm animals', 'farmer with cattle', 'animals on a farm'],
    show: ['cow', 'cows', 'cattle', 'goat', 'goats', 'sheep', 'pig', 'pigs', 'chicken', 'chickens', 'livestock', 'farm', 'farmer', 'herd', 'flock'],
    wrong: [...PETS],
  },
];

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countTerm(text: string, term: string, cap = 10): number {
  const matches = text.match(new RegExp(`\\b${escapeRegex(term)}\\b`, 'g'));
  return Math.min(matches ? matches.length : 0, cap);
}

function scoreSubject(subject: Subject, title: string, tags: string, body: string): number {
  let score = 0;
  for (const term of subject.terms) {
    score += countTerm(title, term, 1) * 8;
    score += countTerm(tags, term, 1) * 4;
    score += countTerm(body, term);
  }
  return score;
}

export function detectSubject(input: { title: string; tags?: string[]; body?: string }): Subject {
  const title = input.title.toLowerCase();
  const tags = (input.tags ?? []).join(' ').toLowerCase();
  // Only the start of the article: later sections often mention other animals.
  const body = (input.body ?? '').toLowerCase().slice(0, 2500);

  let best = SUBJECTS[SUBJECTS.length - 1];
  let bestScore = 0;
  for (const subject of SUBJECTS) {
    if (subject.key === 'livestock') continue;
    const score = scoreSubject(subject, title, tags, body);
    if (score > bestScore) {
      best = subject;
      bestScore = score;
    }
  }
  return best;
}

function hasWord(text: string, words: string[]): boolean {
  const lower = text.toLowerCase();
  return words.some((w) => new RegExp(`\\b${escapeRegex(w)}\\b`).test(lower));
}

/** The photo's own description names a different animal and not the right one. */
export function altLooksWrong(alt: string, subject: Subject): boolean {
  return hasWord(alt, subject.wrong) && !hasWord(alt, subject.show);
}

/** The photo's own description names the right animal. */
export function altLooksRight(alt: string, subject: Subject): boolean {
  return hasWord(alt, subject.show) && !hasWord(alt, subject.wrong);
}
