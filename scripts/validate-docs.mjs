import { access, readFile } from 'node:fs/promises';
const required = [
  'AGENTS.md',
  'agent.md',
  'docs/README.md',
  'docs/architecture.md',
  'docs/data-contract.md',
  'docs/assets.md',
  'docs/quality.md',
  'docs/deployment.md',
  'docs/maintenance.md',
  'public/assets/characters/manifest.json',
  'public/assets/backgrounds/manifest.json',
  'public/assets/brand/manifest.json',
  'lighthouserc.cjs',
];
for (const file of required) {
  await access(file);
  const content = await readFile(file, 'utf8');
  if (!content.trim()) throw new Error(`Documentation is empty: ${file}`);
}
console.log(`Documentation validation passed (${required.length} files).`);
