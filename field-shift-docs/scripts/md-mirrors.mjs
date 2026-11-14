// Emit a Markdown mirror for every docs page, and advertise it from the HTML page.
//
// Why this exists: llms.txt version 2 specifies a clean Markdown copy of each page,
// discoverable through `rel="alternate"; type="text/markdown"`. The docs site is static,
// so the mirror is a second file at a predictable path, not a server feature.
//
// Run after `astro build`. Reads `src/content/docs`, writes into `dist`.

import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, dirname, relative, sep } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src', 'content', 'docs');
const DIST = join(ROOT, 'dist');

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (/\.mdx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

// Starlight route for a content file: drop `index`, drop the extension, keep the folders.
function routeFor(file) {
  const rel = relative(SRC, file).split(sep).join('/');
  const noExt = rel.replace(/\.mdx?$/, '');
  const slug = noExt === 'index' ? '' : noExt.replace(/\/index$/, '');
  return slug;
}

function splitFrontmatter(text) {
  if (!text.startsWith('---')) return { data: {}, body: text };
  const end = text.indexOf('\n---', 3);
  if (end === -1) return { data: {}, body: text };
  const raw = text.slice(3, end).trim();
  const body = text.slice(end + 4).replace(/^\r?\n/, '');
  const data = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) data[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return { data, body };
}

// MDX files in this repo hold JSX components. Keep the prose, drop the machinery,
// so the mirror stays readable in a plain Markdown reader.
function cleanMdx(body) {
  return body
    .replace(/^import\s.+$/gm, '')
    .replace(/<Tabs[^>]*>|<\/Tabs>/g, '')
    .replace(/<TabItem[^>]*>/g, '\n')
    .replace(/<\/TabItem>/g, '\n')
    .replace(/<\/?CardGrid[^>]*>/g, '')
    .replace(/<Card\b[^>]*title="([^"]*)"[^>]*>/g, '\n### $1\n')
    .replace(/<\/Card>/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const files = await walk(SRC);
let written = 0;
let linked = 0;
const pages = [];

for (const file of files) {
  const rel = relative(SRC, file);
  const route = routeFor(file);
  const raw = await readFile(file, 'utf8');
  const { data, body } = splitFrontmatter(raw);
  const isMdx = file.endsWith('.mdx');
  let md = isMdx ? cleanMdx(body) : body;
  if (data.title && !/^#\s/m.test(md.split('\n').slice(0, 3).join('\n'))) {
    md = `# ${data.title}\n\n${md}`;
  }
  const header = data.description ? `> ${data.description}\n\n` : '';
  const out = `${header}${md}`.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';

  // Both forms the specification allows: `page.md` and the directory `index.md`.
  const targets = route === ''
    ? [join(DIST, 'index.md')]
    : [join(DIST, `${route}.md`), join(DIST, route, 'index.md')];

  for (const target of targets) {
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, out, 'utf8');
    written += 1;
  }

  if (route !== '' && route !== '404') pages.push({ route, title: data.title || route });

  // Advertise the mirror from the rendered page, using the replaced-extension form.
  const htmlPath = route === '' ? join(DIST, 'index.html') : join(DIST, route, 'index.html');
  try {
    await stat(htmlPath);
    let html = await readFile(htmlPath, 'utf8');
    if (!/<link rel="alternate" type="text\/markdown"/.test(html)) {
      const href = route === '' ? '/index.md' : `/${route}.md`;
      // Two tags: the markdown twin, and the index that covers this page.
      const tags =
        `<link rel="alternate" type="text/markdown" href="${href}">` +
        '<link rel="describedby" href="/llms.txt">';
      html = html.replace('</head>', `${tags}</head>`);
      await writeFile(htmlPath, html, 'utf8');
      linked += 1;
    }
  } catch {
    // A content file with no rendered page (draft, 404 template) simply has no link to add.
  }
}

// The index is a map only if it lists the pages. llms.txt version 2 allows any number
// of H2 sections holding lists of [name](url) links, so append one for every page.
const indexPath = join(DIST, 'llms.txt');
try {
  let index = await readFile(indexPath, 'utf8');
  if (!index.includes('## Pages')) {
    const list = pages
      .sort((a, b) => a.route.localeCompare(b.route))
      .map((p) => `- [${p.title}](/${p.route}.md)`)
      .join('\n');
    index = `${index.trimEnd()}\n\n## Pages\n\n${list}\n`;
    await writeFile(indexPath, index, 'utf8');
  }
} catch {
  console.warn('[md-mirrors] no llms.txt found, skipped the page list');
}

console.log(`[md-mirrors] ${files.length} source files, ${written} markdown files written, ${linked} pages linked, ${pages.length} pages listed in llms.txt`);