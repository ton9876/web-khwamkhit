import { ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { EditorialArticle, formatThaiDate, getTopic } from "@shared/editorial";

export default function ArticleCard({ article, featured = false }: { article: EditorialArticle; featured?: boolean }) {
  const topic = getTopic(article.topic);

  return (
    <article className={`group overflow-hidden rounded-[1.6rem] border border-[#243932]/10 bg-[#fbf9f3] ${featured ? "md:grid md:grid-cols-2" : ""}`}>
      <Link href={`/articles/${article.slug}`} className={`relative block overflow-hidden ${featured ? "min-h-[290px] md:min-h-full" : "aspect-[4/3]"}`}>
        {article.coverImageUrl ? (
          <img src={article.coverImageUrl} alt={article.coverAlt || article.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="article-art h-full w-full" style={{ background: `linear-gradient(140deg, ${topic.accent}, #243932)` }} />
        )}
        <span className="absolute left-5 top-5 rounded-full bg-[#f6f2e9]/90 px-3 py-1 text-xs font-semibold text-[#243932] backdrop-blur-sm">{topic.label}</span>
      </Link>
      <div className={`flex flex-col ${featured ? "p-8 md:p-11" : "p-6"}`}>
        <p className="text-xs tracking-wide text-[#7b877f]">{article.publishedAt ? formatThaiDate(article.publishedAt as string | Date) : "ฉบับร่าง"}</p>
        <h2 className={`${featured ? "mt-4 text-3xl leading-[1.35] md:text-4xl" : "mt-3 text-xl leading-[1.5]"} font-serif-thai font-semibold tracking-tight text-[#243932]`}>{article.title}</h2>
        <p className="mt-4 text-sm leading-7 text-[#5f6d66]">{article.excerpt}</p>
        <Link href={`/articles/${article.slug}`} className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#b8653d] transition-transform duration-200 group-hover:translate-x-1">
          อ่านบทความ <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  );
}
