import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildBufferRequest,
  buildLinkedInPrompt,
  parseModelJson,
  validateLinkedInDraft,
} from './lib/linkedin-blog-post.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function arg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function has(name) {
  return process.argv.includes(name);
}

async function requestJson(url, token, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json?.error?.message || `Request failed with ${response.status}`);
  return json;
}

function outputText(response) {
  if (response.output_text) return response.output_text;
  return (response.output ?? []).flatMap((item) => item.content ?? []).find((item) => item.type === 'output_text')?.text ?? '';
}

async function main() {
  const slug = arg('--slug');
  if (!slug) throw new Error('Usage: npm run social:linkedin -- --slug <blog-slug> [--input <blogposts.json>] [--buffer] [--queue]');

  const inputPath = resolve(ROOT, arg('--input') || 'src/data/blogposts.json');
  const parsedInput = JSON.parse(await readFile(inputPath, 'utf8'));
  const posts = Array.isArray(parsedInput) ? parsedInput : [parsedInput];
  const post = posts.find((candidate) => candidate.slug === slug);
  if (!post) throw new Error(`Unknown blog slug: ${slug}`);

  const skill = await readFile(resolve(ROOT, 'skills/linkedin-blog-post/SKILL.md'), 'utf8');
  const articleUrl = `https://molten.bot/blog/${post.slug}/`;
  const prompt = buildLinkedInPrompt({ skill, post, articleUrl });

  if (has('--prompt-only')) {
    process.stdout.write(`${prompt}\n`);
    return;
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) throw new Error('OPENAI_API_KEY is required unless --prompt-only is used');

  const response = await requestJson('https://api.openai.com/v1/responses', openAiKey, {
    model: process.env.LINKEDIN_OPENAI_MODEL || 'gpt-5.6-luna',
    input: prompt,
  });
  const draft = parseModelJson(outputText(response));
  const errors = validateLinkedInDraft(draft, articleUrl);
  if (errors.length) throw new Error(`Generated draft failed validation:\n- ${errors.join('\n- ')}`);

  const outputPath = resolve(ROOT, arg('--output') || `docs/social/linkedin/${post.slug}.json`);
  await import('node:fs/promises').then(({ mkdir }) => mkdir(dirname(outputPath), { recursive: true }));
  await writeFile(outputPath, `${JSON.stringify({ slug, articleUrl, ...draft }, null, 2)}\n`);
  console.log(`LinkedIn draft written to ${outputPath}`);

  if (!has('--buffer')) return;
  const bufferKey = process.env.BUFFER_API_KEY;
  const channelId = process.env.BUFFER_LINKEDIN_CHANNEL_ID;
  if (!bufferKey || !channelId) throw new Error('BUFFER_API_KEY and BUFFER_LINKEDIN_CHANNEL_ID are required with --buffer');

  const bufferResponse = await requestJson(
    'https://api.buffer.com',
    bufferKey,
    buildBufferRequest({ channelId, draft, saveToDraft: !has('--queue') }),
  );
  const result = bufferResponse?.data?.createPost;
  if (!result?.post) throw new Error(result?.message || 'Buffer did not return a created post');
  console.log(`${has('--queue') ? 'Queued' : 'Created Buffer draft'} ${result.post.id}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
