import ArticleCard from "@/components/ArticleCard";
import PublicLayout from "@/components/PublicLayout";
import { STARTER_ARTICLE, TOPICS } from "@shared/editorial";
import { trpc } from "@/lib/trpc";
import { ArrowDownRight, ArrowRight, BookOpen, Compass, Sprout } from "lucide-react";
import { Link } from "wouter";

const HERO_IMAGE = "/manus-storage/phuenthang-hero_3326df0c.png";

export default function Home() {
  const { data: articles } = trpc.articles.listPublished.useQuery();
  const featuredArticle = articles?.[0] || STARTER_ARTICLE;
  return (
    <PublicLayout>
      <main>
        <section className="relative min-h-[650px] overflow-hidden bg-[#243932] text-[#f6f2e9] md:min-h-[710px]">
          <img src={HERO_IMAGE} alt="สวนเขตร้อนยามเช้าที่เงียบสงบ" className="absolute inset-0 h-full w-full object-cover object-right opacity-70" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(22,45,38,0.98)_0%,rgba(26,52,43,0.82)_45%,rgba(26,52,43,0.18)_100%)]" />
          <div className="container relative z-10 flex min-h-[650px] flex-col justify-end pb-16 pt-28 md:min-h-[710px] md:pb-24">
            <p className="eyebrow text-[#d9c795]">คิดดีมีพลัง · ปล่อย · ภูมิคุ้มกันใจ</p>
            <h1 className="mt-6 max-w-4xl font-serif-thai text-5xl font-semibold leading-[1.2] tracking-tight md:text-7xl">ความคิดที่เปิดพื้นที่<br />ให้ชีวิตหายใจ</h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-[#eae4d6]/82 md:text-lg">พื้นที่สำหรับมองเรื่องใกล้ตัวอย่างลึกซึ้งขึ้น ตั้งแต่การใช้ชีวิต การกินอยู่ สิ่งแวดล้อม ไปจนถึงศีลธรรมจรรยา</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/articles" className="button-light">เริ่มอ่านบทความ <ArrowRight size={17} /></Link>
              <a href="#mission" className="button-ghost">รู้จักแนวคิด <ArrowDownRight size={17} /></a>
            </div>
          </div>
        </section>

        <section id="mission" className="paper-grid border-b border-[#243932]/10 py-20 md:py-28">
          <div className="container grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
            <div><p className="eyebrow">จุดตั้งต้น</p><div className="mt-6 grid h-16 w-16 place-items-center rounded-full border border-[#243932]/15 bg-[#fbf9f3] text-[#b8653d]"><Compass size={26} strokeWidth={1.5} /></div></div>
            <div>
              <h2 className="font-serif-thai text-3xl font-semibold leading-[1.45] tracking-tight md:text-5xl">เราไม่ต้องรีบมีคำตอบเสมอไป แต่อาจเริ่มจากการเห็นคำถามของชีวิตให้ชัดขึ้น</h2>
              <p className="mt-7 max-w-2xl text-base leading-8 text-[#5f6d66]">พื้นทางความคิดชวนผู้อ่านเชื่อมความรู้ ความรู้สึก และความรับผิดชอบเข้าด้วยกัน เนื้อหาทุกชิ้นจึงมุ่งให้บริบท แสดงแหล่งอ้างอิง และเคารพความซับซ้อนของชีวิตจริง</p>
            </div>
          </div>
        </section>

        <section className="container py-20 md:py-28">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div><p className="eyebrow">เส้นทางของความคิด</p><h2 className="mt-4 font-serif-thai text-3xl font-semibold md:text-5xl">เริ่มต้นจากสิ่งที่ใกล้ตัว</h2></div>
            <Link href="/articles" className="inline-flex items-center gap-2 text-sm font-semibold text-[#b8653d]">ดูบทความทั้งหมด <ArrowRight size={16} /></Link>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {TOPICS.map((topic, index) => (
              <Link key={topic.id} href={`/articles?topic=${topic.id}`} className="topic-card group" style={{ "--topic-accent": topic.accent } as React.CSSProperties}>
                <span className="text-xs font-semibold tracking-widest text-[#7b877f]">0{index + 1}</span>
                <h3 className="mt-12 font-serif-thai text-2xl font-semibold text-[#243932]">{topic.label}</h3>
                <p className="mt-3 text-sm leading-6 text-[#65736c]">{topic.description}</p>
                <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#b8653d]">สำรวจ <ArrowRight size={15} /></span>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-y border-[#243932]/10 bg-[#ece7da] py-20 md:py-28">
          <div className="container">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="eyebrow">จากบรรณาธิการ</p><h2 className="mt-4 font-serif-thai text-3xl font-semibold md:text-5xl">ชวนอ่านอย่างค่อยเป็นค่อยไป</h2></div><BookOpen className="text-[#b8653d]" size={32} strokeWidth={1.3} /></div>
            <div className="mt-10"><ArticleCard article={featuredArticle} featured /></div>
          </div>
        </section>

        <section className="container py-20 md:py-28">
          <div className="rounded-[2rem] bg-[#b8653d] px-7 py-12 text-[#fff9ed] md:px-14 md:py-16">
            <div className="grid gap-9 md:grid-cols-[1fr_auto] md:items-end"><div><Sprout size={33} strokeWidth={1.4} /><h2 className="mt-6 max-w-2xl font-serif-thai text-3xl font-semibold leading-[1.4] md:text-5xl">ความเปลี่ยนแปลงที่ยั่งยืน อาจเริ่มจากการสังเกตสิ่งเล็ก ๆ ในวันนี้</h2></div><Link href="/articles" className="button-light w-fit text-[#a8502d]">ไปยังห้องสมุด <ArrowRight size={17} /></Link></div>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
