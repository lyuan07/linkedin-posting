const ENTITY_MAP = new Map([
  ['amp', '&'], ['lt', '<'], ['gt', '>'], ['quot', '"'], ['apos', "'"], ['nbsp', ' '],
]);

export function htmlToPlainText(html = '') {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/(p|h[1-6]|li|blockquote|pre|figure|ul|ol)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/&#x([0-9a-f]+);/gi, (_, value) => String.fromCodePoint(Number.parseInt(value, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITY_MAP.get(name.toLowerCase()) ?? match)
    .replace(/[ \t]+/g, ' ')
    .replace(/ +([.,!?;:])/g, '$1')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function buildLinkedInPrompt({ skill, post, articleUrl }) {
  return `${skill.trim()}\n\n# Source article\n\nTitle: ${post.title}\nSubtitle: ${post.subtitle || ''}\nCanonical URL: ${articleUrl}\n\n${htmlToPlainText(post.content)}`;
}

export function parseModelJson(value) {
  const text = String(value ?? '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const parsed = JSON.parse(text);
  return {
    summary: String(parsed.summary ?? '').trim(),
    post: String(parsed.post ?? '').trim(),
    firstComment: String(parsed.firstComment ?? '').trim(),
  };
}

export function validateLinkedInDraft(draft, articleUrl) {
  const errors = [];
  const lines = draft.post.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (!draft.summary) errors.push('summary is required');
  if (lines.length < 8 || lines.length > 15) errors.push(`post must contain 8-15 non-empty lines; found ${lines.length}`);
  if (/https?:\/\/|www\./i.test(draft.post)) errors.push('main post must not contain a URL');
  if (/(^|\s)#[\p{L}\p{N}_]+/u.test(draft.post)) errors.push('main post must not contain hashtags');
  if (!/check out (?:the )?link below[.!]?$/i.test(lines.at(-1) ?? '')) errors.push('final line must direct readers to check out the link below');
  if (!/^Link here:\s*/i.test(draft.firstComment)) errors.push('first comment must start with "Link here:"');
  if (!draft.firstComment.includes(articleUrl)) errors.push('first comment must contain the canonical article URL');
  return errors;
}

export function buildBufferRequest({ channelId, draft, saveToDraft = true }) {
  return {
    query: `mutation CreateLinkedInPost($input: CreatePostInput!) {
      createPost(input: $input) {
        ... on PostActionSuccess { post { id text dueAt status } }
        ... on InvalidInputError { message }
        ... on UnauthorizedError { message }
        ... on UnexpectedError { message }
        ... on RestProxyError { message }
        ... on LimitReachedError { message }
        ... on NotFoundError { message }
      }
    }`,
    variables: {
      input: {
        text: draft.post,
        channelId,
        schedulingType: 'automatic',
        mode: 'addToQueue',
        saveToDraft,
        aiAssisted: true,
        assets: [],
        metadata: { linkedin: { firstComment: draft.firstComment } },
      },
    },
  };
}
