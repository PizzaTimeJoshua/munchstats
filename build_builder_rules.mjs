/**
 * Build a data-only Champions legality snapshot for the Android teambuilder.
 *
 * The app supplies Showdown's validation engine. This file publishes its
 * changing format definitions, tiers, learnsets, and item/move/ability data.
 * No JavaScript from a downloaded pack is executed on the device.
 *
 * node build_builder_rules.mjs --ref <Showdown SHA or branch> --output stats/builder/champions-rules.json
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { runInNewContext } from 'node:vm';
import { transformSync } from 'esbuild';

const REPO = 'smogon/pokemon-showdown';
const DEFAULT_REF = '4434c2b4707f9b5b5dd70ea9841ab454cdcc0826';
const args = process.argv.slice(2);
const value = (flag, fallback) => {
  const at = args.indexOf(flag);
  return at < 0 ? fallback : args[at + 1];
};
const ref = value('--ref', DEFAULT_REF);
const output = value('--output', 'stats/builder/champions-rules.json');
if (!ref || !output) throw new Error('--ref and --output need values');

async function jsonResponse(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'MunchStats builder rules' } });
  if (!response.ok) throw new Error(`${response.status} fetching ${url}`);
  return response.json();
}

async function sourceCommit() {
  if (/^[a-f0-9]{40}$/i.test(ref)) return ref.toLowerCase();
  const commit = await jsonResponse(`https://api.github.com/repos/${REPO}/commits/${encodeURIComponent(ref)}`);
  if (!/^[a-f0-9]{40}$/.test(commit.sha)) throw new Error('Could not resolve Showdown commit');
  return commit.sha;
}

async function loadTable(commit, file, key) {
  const url = `https://raw.githubusercontent.com/${REPO}/${commit}/${file}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} fetching ${file}`);
  const source = await response.text();
  const compiled = transformSync(source, { loader: 'ts', format: 'cjs', target: 'es2021' }).code;
  const module = { exports: {} };
  runInNewContext(compiled, {
    module,
    exports: module.exports,
    require: (name) => { throw new Error(`Unexpected runtime import ${name} in ${file}`); },
  }, { filename: file, timeout: 10000 });
  const table = module.exports[key];
  if (!table || typeof table !== 'object') throw new Error(`Missing ${key} in ${file}`);
  return table;
}

function hasFunction(value) {
  if (typeof value === 'function') return true;
  if (!value || typeof value !== 'object') return false;
  return Object.values(value).some(hasFunction);
}

const commit = await sourceCommit();
const keys = ['FormatsData', 'Learnsets', 'Moves', 'Items', 'Abilities', 'Rulesets', 'Conditions'];
const files = ['formats-data', 'learnsets', 'moves', 'items', 'abilities', 'rulesets', 'conditions'];
const [formats, ...tables] = await Promise.all([
  loadTable(commit, 'config/formats.ts', 'Formats'),
  ...files.map((file, i) => loadTable(commit, `data/mods/champions/${file}.ts`, keys[i])),
]);
const supported = formats.filter((format) =>
  format.mod === 'champions' && !format.team && !hasFunction(format) && Array.isArray(format.ruleset));
if (!supported.some((format) => format.name === '[Gen 9 Champions] OU')) {
  throw new Error('Champions OU is missing from this Showdown revision');
}
const data = { Scripts: { gen: 9, inherit: 'gen9' } };
keys.forEach((key, index) => {
  data[key] = tables[index];
});
const pack = JSON.parse(JSON.stringify({
  schema_version: 1,
  source_commit: commit,
  formats: supported,
  data,
}));
if (Object.keys(pack.data.Learnsets).length < 200 ||
    Object.keys(pack.data.FormatsData).length < 1000) {
  throw new Error('The Champions tables look incomplete');
}
mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, output.endsWith('.ts')
  ? `// Generated from Pokémon Showdown ${commit}; run build_builder_rules.mjs to update.\nexport default ${JSON.stringify(pack)};\n`
  : JSON.stringify(pack));
console.log(`Wrote ${output}: ${pack.formats.length} formats, ${Object.keys(pack.data.Learnsets).length} learnsets, Showdown ${commit}`);
