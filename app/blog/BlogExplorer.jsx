"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { categories, formatPostDate, keywords, posts } from "./posts";

export default function BlogExplorer() {
  const searchParams = useSearchParams();
  const initialKeyword = searchParams.get("keyword") || "All";
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(
    [...categories, ...keywords].includes(initialKeyword) ? initialKeyword : "All"
  );

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesFilter =
        active === "All" || post.category === active || post.keywords.includes(active);
      const haystack = [post.title, post.dek, post.category, ...post.keywords].join(" ").toLowerCase();
      return matchesFilter && (!term || haystack.includes(term));
    });
  }, [active, query]);

  const featured = posts.find((post) => post.featured);

  return (
    <>
      {!query && active === "All" && featured && (
        <Link href={`/blog/${featured.slug}`} className="bl-featured">
          <div className="bl-featured-number">01</div>
          <div>
            <span className="bl-kicker">Featured · {featured.category}</span>
            <h2>{featured.title}</h2>
            <p>{featured.dek}</p>
            <span className="bl-meta">{formatPostDate(featured.published)} · {featured.readingTime} min read</span>
          </div>
          <ArrowUpRight aria-hidden="true" />
        </Link>
      )}

      <section className="bl-library" aria-labelledby="library-heading">
        <div className="bl-library-head">
          <div>
            <span className="bl-kicker">The library</span>
            <h2 id="library-heading">Explore every briefing</h2>
          </div>
          <label className="bl-search">
            <Search size={17} aria-hidden="true" />
            <span className="sr-only">Search articles</span>
            <input
              type="search"
              placeholder="Search topics or keywords"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>

        <div className="bl-filter-row" aria-label="Filter articles">
          {["All", ...categories].map((item) => (
            <button key={item} type="button" data-active={active === item} onClick={() => setActive(item)}>
              {item}
            </button>
          ))}
        </div>

        <div className="bl-keyword-cloud">
          <span>Browse by keyword</span>
          {keywords.map((keyword) => (
            <button key={keyword} type="button" data-active={active === keyword} onClick={() => setActive(keyword)}>
              {keyword}
            </button>
          ))}
        </div>

        <div className="bl-results-bar" aria-live="polite">
          <span>{visible.length} {visible.length === 1 ? "article" : "articles"}</span>
          {(active !== "All" || query) && (
            <button type="button" onClick={() => { setActive("All"); setQuery(""); }}>Clear filters</button>
          )}
        </div>

        <div className="bl-grid">
          {visible.map((post, index) => (
            <article className="bl-card" key={post.slug}>
              <div className="bl-card-top">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>{post.category}</span>
              </div>
              <h3><Link href={`/blog/${post.slug}`}>{post.title}</Link></h3>
              <p>{post.dek}</p>
              <div className="bl-card-keywords">
                {post.keywords.slice(0, 3).map((keyword) => (
                  <button key={keyword} type="button" onClick={() => setActive(keyword)}>#{keyword}</button>
                ))}
              </div>
              <div className="bl-card-foot">
                <span>{formatPostDate(post.published)} · {post.readingTime} min</span>
                <Link href={`/blog/${post.slug}`} aria-label={`Read ${post.title}`}><ArrowUpRight size={18} /></Link>
              </div>
            </article>
          ))}
        </div>

        {!visible.length && (
          <div className="bl-empty">
            <h3>No briefings found</h3>
            <p>Try a broader keyword or clear the current filters.</p>
          </div>
        )}
      </section>
    </>
  );
}
