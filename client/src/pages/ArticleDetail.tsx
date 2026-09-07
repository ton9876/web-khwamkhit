import PublicLayout from "@/components/PublicLayout";
import { formatThaiDate, getTopic } from "@shared/editorial";
import { ArrowLeft, ExternalLink, Play } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link, useRoute } from "wouter";

function getEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (parsed.hostname === "youtu.be") return `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}`;
    if (parsed.hostname.includes("vimeo.com")) return `https://player.vimeo.com/video/${parsed.pathname.split("/").filter(Boolean).pop()}`;
  } catch {
    return null;
  }
  return null;
}

export default function ArticleDetail() {
  const [, params] = useRoute("/articles/:slug");
  const slug = params?.slug || "";
  const { data: article, isLoading } = trpc.articles.bySlug.useQuery({ slug }, { enabled: Boolean(slug) });

  if (isLoading) {
    return <PublicLayout><main className="container grid min-h-[60vh] place-items-center text-sm text-[#65736c]">กำลังเปิดบทความ…</main></PublicLayout>;
  }

  if (!article) {
    return (
      <PublicLayout>
        <main className="container py-28 text-center">
          <p className="eyebrow">ไม่พบบทความ</p>
          <h1 className="mt-4 font-serif-thai text-4xl">บทความนี้อาจยังไม่เผยแพร่</h1>
          <Link href="/articles" className="mt-8 inline-flex text-sm font-semibold text-[#b8653d]">กลับไปห้องสมุดบทความ</Link>
        </main>
      </PublicLayout>
    );
  }

  const topic = getTopic(article.topic);
  const embedUrl = article.videoUrl ? getEmbedUrl(article.videoUrl) : null;

  return (
    <PublicLayout>
      <main>
        <article>
          <header className="container pb-10 pt-12 md:pb-14 md:pt-20">
            <Link href="/articles" className="inline-flex items-center gap-2 text-sm font-semibold text-[#557067] hover:text-[#b8653d]"><ArrowLeft size={16} /> กลับไปห้องสมุดบทความ</Link>
            <div className="mt-12 max-w-4xl">
              <p className="eyebrow" style={{ color: topic.accent }}>{topic.label}</p>
              <h1 className="mt-5 font-serif-thai text-4xl font-semibold leading-[1.32] tracking-tight md:text-6xl">{article.title}</h1>
              <p className="mt-6 max-w-3xl text-lg leading-9 text-[#5f6d66]">{article.excerpt}</p>
              <p className="mt-7 text-sm text-[#7b877f]">เผยแพร่ {article.publishedAt ? formatThaiDate(article.publishedAt) : "เร็ว ๆ นี้"}</p>
            </div>
          </header>

          <div className="container">
            <div className="overflow-hidden rounded-[1.8rem] bg-[#d7ded2] shadow-[0_24px_60px_-35px_rgba(28,54,45,0.5)]">
              {article.coverImageUrl ? <img src={article.coverImageUrl} alt={article.coverAlt || article.title} className="aspect-[16/8] w-full object-cover" /> : <div className="article-art aspect-[16/8]" />}
            </div>
          </div>

          <div className="container grid gap-12 py-14 md:grid-cols-[minmax(0,1fr)_260px] md:py-20">
            <div className="article-prose">
              {article.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              {embedUrl ? (
                <div className="mt-12 overflow-hidden rounded-2xl bg-[#243932] shadow-lg">
                  <div className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#f6f2e9]"><Play size={15} /> รับชมคลิปประกอบ</div>
                  <iframe className="aspect-video w-full" src={embedUrl} title={`วิดีโอประกอบ: ${article.title}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              ) : null}
            </div>
            <aside className="h-fit border-l-2 border-[#d9c795] pl-5 text-sm leading-7 text-[#607069] md:sticky md:top-28">
              <p className="font-semibold text-[#243932]">บันทึกจากบรรณาธิการ</p>
              <p className="mt-2">บทความชิ้นนี้ใช้แหล่งข้อมูลเพื่อประกอบการตั้งคำถาม มิใช่คำแนะนำเฉพาะบุคคล</p>
            </aside>
          </div>

          <section className="border-t border-[#243932]/10 bg-[#ece7da] py-14 md:py-20">
            <div className="container max-w-4xl">
              <p className="eyebrow">แหล่งอ้างอิง</p>
              <h2 className="mt-4 font-serif-thai text-3xl font-semibold">อ่านต่อจากต้นทาง</h2>
              <div className="mt-8 space-y-4">
                {article.references.map((reference) => (
                  <a key={reference.url} href={reference.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-[#243932]/10 bg-[#fbf9f3] p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                    <span className="flex items-start justify-between gap-4"><span><span className="block font-semibold text-[#243932]">{reference.title}</span><span className="mt-1 block text-sm text-[#65736c]">{[reference.author, reference.publisher, reference.publishedAt].filter(Boolean).join(" · ")}</span></span><ExternalLink className="mt-1 shrink-0 text-[#b8653d]" size={17} /></span>
                    {reference.note ? <span className="mt-3 block text-xs leading-5 text-[#7b877f]">{reference.note}</span> : null}
                  </a>
                ))}
              </div>
            </div>
          </section>
        </article>
      </main>
    </PublicLayout>
  );
}
