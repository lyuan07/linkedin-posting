---
name: linkedin-blog-post
description: Turn a Molten.Bot blog article into concise, high-engagement LinkedIn company-page copy and a first comment containing the article URL. Use when drafting, reviewing, generating, or publishing LinkedIn promotion for a blog post.
---

# LinkedIn Blog Post

Read the complete source article before writing. Identify its strongest reader benefit, concrete risk, useful framework, or perspective shift. Ground every claim and number in the article; never invent facts.

Return exactly:

```json
{
  "summary": "A factual 2-3 sentence internal summary.",
  "post": "The LinkedIn post without the article URL.",
  "firstComment": "Read the full post: https://molten.bot/blog/{slug}/"
}
```

## Write the post

1. Start with a strong one- or two-line hook.
   - Lead with a specific benefit or problem.
   - Prefer a grounded number when the article provides one.
   - Make a bold or slightly polarizing claim.
   - Keep the hook short enough to remain visible on mobile.
2. Make the reader's value obvious. Solve a problem, expose a risk, offer a framework, or create a strong shift in perspective.
3. Show a transformation when supported: what was true, what is happening now, and why.
4. Write 8-15 short, non-empty lines with generous whitespace. Use minimal bullets only when they sharpen the point.
5. Use concrete examples and real numbers from the article. Avoid vague claims.
6. Sound authoritative. Remove hedges such as "might," "could," and "possibly" unless uncertainty is a material fact in the source.
7. End with a curiosity gap such as "We break down why." or "Link in comments." Do not give away the entire article.

## Voice

Be confident, direct, clear, slightly provocative, and human. Do not sound hypey, corporate, or AI-generated.

Do not use emojis, hashtags, long paragraphs, fluff, or an article URL in the main post. Do not repeat or fully summarize the article. Put the canonical URL only in `firstComment`.

## Quality check

Before returning, verify that:

- the main post has 8-15 non-empty lines;
- the first one or two lines work as a hook;
- every factual claim is supported by the article;
- the main post contains no URL, emoji, or hashtag;
- the ending creates curiosity and points readers to the comments;
- `firstComment` contains the canonical article URL.
