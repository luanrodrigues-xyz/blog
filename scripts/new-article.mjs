// Cria um artigo com draft: true em contents/notebook/<assunto>/<slug>/en/.
// npm run new -- <slug> <assunto> "Title"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { articleFiles } from './article-files.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const folderOf = (root, topic) => join(root, 'contents/notebook', topic);

function template({ title, topic, order }) {
  const today = new Date().toLocaleDateString('sv');
  return `---
title: "${title.replaceAll('"', '\\"')}"
description: "One sentence: what the reader understands by the end."
date: "${today}"
topic: "${topic}"
readingOrder: ${order}
draft: true
tags: []
# cover e coverAlt são obrigatórios para publicar. A capa vem por último, depois do texto e dos exemplos (skill capas)
# cover: "nome-da-capa.png"
# coverAlt: "Descrição da imagem"
language: "en"
---

Opening: the question or concrete behavior that motivates the article.

## First step
`;
}

// Próximo readingOrder do assunto, contando rascunhos e publicados.
function nextOrder(root, topic) {
  const sameTopic = new RegExp(`^topic:\\s*"?${topic}"?\\s*$`, 'm');
  const base = folderOf(root, topic);
  let last = 0;
  if (!existsSync(base)) return 1;
  for (const { source: text } of articleFiles(root).filter((item) => item.topic === topic)) {
    if (sameTopic.test(text)) last = Math.max(last, Number(text.match(/^readingOrder:\s*(\d+)/m)?.[1] ?? 0));
  }
  return last + 1;
}

export function createArticle({ slug, topic, title, root = ROOT }) {
  const topics = JSON.parse(readFileSync(join(root, 'src/config/topics.json'), 'utf8')).topics.map((t) => t.slug);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug ?? '')) throw new Error(`Slug inválido: ${slug} (use minúsculas e hífens)`);
  if (!topics.includes(topic)) throw new Error(`Assunto desconhecido: ${topic}. Opções: ${topics.join(', ')}`);
  if (!title) throw new Error('Informe o título entre aspas');

  const target = join(folderOf(root, topic), slug, 'en', 'index.md');
  if (articleFiles(root).some((item) => item.slug === slug || item.urlSlug === slug))
    throw new Error(`${slug} já existe`);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, template({ title, topic, order: nextOrder(root, topic) }));
  return target;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [slug, topic, title] = process.argv.slice(2);
  try {
    console.log(createArticle({ slug, topic, title }).replace(`${ROOT}/`, ''));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
