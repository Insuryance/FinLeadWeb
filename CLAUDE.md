# FinLead Web Agent Guide

Use this file when making code changes in this repository, especially when adding or editing blog posts.

## Blog Post Rules

Blog posts live in `app/blog/posts.js`. Each post should be useful to insurance operators first, while still giving search engines and LLMs clean structure to understand.

When adding a new blog post, include:

- One primary keyword in `seo.primaryKeyword`.
- Two to four closely related keywords in `keywords`.
- Three concise FAQs in `faqs`.
- A clear audience in `seo.audience`.
- A clear intent in `seo.searchIntent`, usually `informational`.
- Links to at least two related posts or site pages where the visible experience supports it.

## Writing Style

- Use simple English.
- Write for insurance finance, operations, distribution, MGA, broker, agency, and executive readers.
- Keep headings human and practical, not robotic.
- Avoid visible headings like "for SEO", "for AI discovery", "search strategy", or similar wording on public pages.
- Do not make the article ending verbose. Keep visible post pages focused on the article, compact common questions, and a clean next-article handoff.
- Keep LLM-facing explanation in `public/llms.txt`, not in visible page sections.

## SEO And GEO

Preserve these features when editing blog pages:

- Each post has a public URL at `/blog/[slug]`.
- Each post should generate title, description, keywords, canonical URL, Open Graph data, and Twitter card metadata.
- Article pages should keep `Article`, `BreadcrumbList`, and `FAQPage` JSON-LD when the post has FAQs.
- `public/llms.txt` should describe FinLead AI, target audience, agent suites, and blog topic strategy for LLMs.
- The visible article should read naturally. Structured data should do the machine-readable work quietly.

## New Post Checklist

Before finishing a new blog post:

- Confirm the slug is short, readable, and keyword-aware.
- Confirm the title sounds human and contains the primary topic.
- Confirm the `dek` is plain English and specific.
- Confirm the first paragraph quickly explains the problem.
- Confirm every FAQ answer is short enough to be useful in search and AI summaries.
- Confirm the post includes or naturally points to at least two related FinLead pages or posts.
- Confirm `public/llms.txt` still describes the blog strategy accurately if the topic cluster changes.

