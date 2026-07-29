import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock3 } from "lucide-react";
import { BlogFooter, BlogHeader } from "../BlogChrome";
import { formatPostDate, getPost, posts } from "../posts";
import ShareBar from "./ShareBar";

export function generateStaticParams() {
  return posts.map(({ slug }) => ({ slug }));
}

export function generateMetadata({ params }) {
  const post = getPost(params.slug);
  if (!post) return {};
  const url = `/blog/${post.slug}`;
  return {
    title: `${post.title} | FinLead Briefing`,
    description: post.dek,
    keywords: post.keywords,
    authors: [{ name: post.author }],
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.dek,
      type: "article",
      url,
      publishedTime: post.published,
      modifiedTime: post.updated,
      tags: post.keywords,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "FinLead Briefing" }],
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.dek, images: ["/og.png"] },
  };
}

function ContentBlock({ block }) {
  if (block.type === "h2") return <h2>{block.text}</h2>;
  if (block.type === "lead") return <p className="bl-article-lead">{block.text}</p>;
  if (block.type === "bullets") return <ul>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
  if (block.type === "callout") return <aside><span>{block.title}</span><p>{block.text}</p></aside>;
  return <p>{block.text}</p>;
}

function FaqBlock({ faqs }) {
  if (!faqs?.length) return null;
  return (
    <section className="bl-faq" aria-labelledby="article-faq">
      <h2 className="fl-serif" id="article-faq">Common questions</h2>
      <div className="bl-faq-list">
        {faqs.map((faq, index) => (
          <details key={faq.question} open={index === 0}>
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export default function PostPage({ params }) {
  const post = getPost(params.slug);
  if (!post) notFound();
  const index = posts.findIndex((item) => item.slug === post.slug);
  const nextPost = posts[(index + 1) % posts.length];

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.dek,
    datePublished: post.published,
    dateModified: post.updated,
    keywords: post.keywords.join(", "),
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: "FinLead AI", url: "https://finlead.ai" },
    mainEntityOfPage: `https://finlead.ai/blog/${post.slug}`,
    image: "https://finlead.ai/og.png",
    about: post.seo?.primaryKeyword,
    audience: {
      "@type": "Audience",
      audienceType: post.seo?.audience,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "FinLead AI", item: "https://finlead.ai/" },
      { "@type": "ListItem", position: 2, name: "Briefing", item: "https://finlead.ai/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: `https://finlead.ai/blog/${post.slug}` },
    ],
  };

  const faqJsonLd = post.faqs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: post.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }
    : null;

  return (
    <div className="bl-root">
      <div className="fl-grain" />
      <BlogHeader />
      <main>
        <article className="bl-article">
          <Link href="/blog" className="bl-back"><ArrowLeft size={16} /> All briefings</Link>
          <header>
            <span className="bl-kicker">{post.category}</span>
            <h1 className="fl-serif">{post.title}</h1>
            <p>{post.dek}</p>
            <div className="bl-article-meta">
              <div className="bl-byline">
                <span>{post.author}</span>
                <span>{formatPostDate(post.published)}</span>
                <span><Clock3 size={14} /> {post.readingTime} min read</span>
              </div>
              <ShareBar />
            </div>
          </header>
          <div className="bl-article-layout">
            <aside className="bl-article-tags">
              <span>Filed under</span>
              {post.keywords.map((keyword) => (
                <Link key={keyword} href={`/blog?keyword=${encodeURIComponent(keyword)}`}>#{keyword}</Link>
              ))}
            </aside>
            <div className="bl-prose">
              {post.content.map((block, blockIndex) => <ContentBlock block={block} key={blockIndex} />)}
            </div>
          </div>
        </article>

        <FaqBlock faqs={post.faqs} />

        <section className="bl-next">
          <div>
            <span className="bl-kicker">Next article</span>
            <h2 className="fl-serif">{nextPost.title}</h2>
          </div>
          <Link href={`/blog/${nextPost.slug}`} aria-label={`Read ${nextPost.title}`}><ArrowRight /></Link>
        </section>
      </main>
      <BlogFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {faqJsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} /> : null}
    </div>
  );
}
