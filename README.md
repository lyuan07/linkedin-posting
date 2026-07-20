# LinkedIn Posting

Generate high-engagement LinkedIn company-page posts from Molten.Bot blog articles and send them to Buffer with the article link in the first comment.

## What it does

1. Reads a blog article from a JSON object or array.
2. Uses the versioned `linkedin-blog-post` skill as the editorial source of truth.
3. Generates an internal summary, an 8–15-line LinkedIn post, and a first comment.
4. Rejects drafts containing a URL or hashtag in the main post.
5. Writes the reviewed result to JSON.
6. Optionally creates a Buffer draft. Publishing to the queue requires an explicit flag.

## Setup

Use Node.js 22 or newer.

```bash
npm install
cp .env.example .env
```

Set these environment variables outside source control:

- `OPENAI_API_KEY`
- `BUFFER_API_KEY`
- `BUFFER_LINKEDIN_CHANNEL_ID`
- `LINKEDIN_OPENAI_MODEL` (optional)

## Generate a draft

The input must use the Molten.Bot blog fields `slug`, `title`, `subtitle`, and `content`.

```bash
npm run generate -- \
  --input ../moltenbot/src/data/blogposts.json \
  --slug ARTICLE-SLUG
```

Preview the complete model prompt without calling an API:

```bash
npm run generate -- \
  --input ../moltenbot/src/data/blogposts.json \
  --slug ARTICLE-SLUG \
  --prompt-only
```

Create a reviewable Buffer draft:

```bash
npm run generate -- \
  --input ../moltenbot/src/data/blogposts.json \
  --slug ARTICLE-SLUG \
  --buffer
```

Add `--queue` only when the generated post should be added directly to the Buffer queue.

## Editorial rules

The canonical rules live in `skills/linkedin-blog-post/SKILL.md`. The generator reads that file on every run, so editorial changes directly affect generated copy.
