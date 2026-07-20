import { describe, expect, it } from 'vitest';
import {
  buildBufferRequest,
  buildLinkedInPrompt,
  htmlToPlainText,
  parseModelJson,
  validateLinkedInDraft,
} from '../../scripts/lib/linkedin-blog-post.mjs';

const articleUrl = 'https://molten.bot/blog/test-post/';
const validDraft = {
  summary: 'A factual summary.',
  post: ['AI governance starts before model selection.', 'Most teams start too late.', 'The real risk is access.', 'Not model quality.', 'Map the data.', 'Limit permissions.', 'Log every action.', 'Then choose the model.', 'We break down why.', 'Link in comments.'].join('\n'),
  firstComment: `Read the full post: ${articleUrl}`,
};

describe('LinkedIn blog post helpers', () => {
  it('converts article HTML into readable source text', () => {
    expect(htmlToPlainText('<h2>Risk &amp; access</h2><p>Use <strong>limits</strong>.</p>')).toBe('Risk & access\nUse limits.');
  });

  it('builds a grounded prompt from the repository skill and article', () => {
    const prompt = buildLinkedInPrompt({ skill: 'RULES', post: { title: 'Title', subtitle: 'Sub', content: '<p>Body</p>' }, articleUrl });
    expect(prompt).toContain('RULES');
    expect(prompt).toContain(`Canonical URL: ${articleUrl}`);
    expect(prompt).toContain('Body');
  });

  it('parses fenced model JSON', () => {
    expect(parseModelJson(`\`\`\`json\n${JSON.stringify(validDraft)}\n\`\`\``)).toEqual(validDraft);
  });

  it('validates line count, URL placement, hashtags, and first comment', () => {
    expect(validateLinkedInDraft(validDraft, articleUrl)).toEqual([]);
    expect(validateLinkedInDraft({ ...validDraft, post: 'Too short https://example.com #ai', firstComment: '' }, articleUrl)).toHaveLength(4);
  });

  it('places the article link in Buffer LinkedIn first-comment metadata and defaults to draft', () => {
    const request = buildBufferRequest({ channelId: 'channel-1', draft: validDraft });
    expect(request.variables.input.text).toBe(validDraft.post);
    expect(request.variables.input.saveToDraft).toBe(true);
    expect(request.variables.input.metadata.linkedin.firstComment).toBe(validDraft.firstComment);
  });
});
