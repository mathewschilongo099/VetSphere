# VetSphere

Educational veterinary articles for livestock farmers and pet owners.

Live at: https://vetsphere.cc.cd

## Stack
- Next.js (App Router), TypeScript, Tailwind CSS
- Markdown articles in `src/content/articles` (frontmatter via gray-matter)
- AI-assisted tools: Ask VetAssist, quizzes, admin autopublish pipeline

## Environment variables
See your Vercel project settings. Optional: `NEXT_PUBLIC_CONTACT_EMAIL` shows a public contact email on the Contact and legal pages.

## Maintenance
```bash
npm install
npm run dev

# Clean article frontmatter, related links and further-reading sections
node scripts/fix-articles.mjs          # dry run
node scripts/fix-articles.mjs --write  # apply
```
