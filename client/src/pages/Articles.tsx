import ArticleCard from "@/components/ArticleCard";
import PublicLayout from "@/components/PublicLayout";
import { TOPICS, TopicId } from "@shared/editorial";
import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";

export default function Articles() {
  const [selected, setSelected] = useState<TopicId | "all">("all");
  const queryInput = useMemo(() => (selected === "all" ? undefined : { topic: selected }), [selected]);
  const { data: articles, isLoading } = trpc.articles.listPublished.useQuery(queryInput);

  return (
    <PublicLayout>
      <main>
        <section className="paper-grid border-b border-[#243932]/10 py-16 md:py-24">
          <div className="container">
            <p className="eyebrow">ห้องสมุดบทความ</p>
            <h1 className="mt-5 max-w-3xl font-serif-thai text-4xl font-semibold leading-[1.32] tracking-tight md:text-6xl">ความคิดที่ค่อย ๆ เติบโตจากชีวิตประจำวัน</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#5f6d66]">สำรวจข้อชวนคิดจากสี่พื้นที่ของชีวิต เลือกหัวข้อที่อยากเริ่มต้น แล้วค่อย ๆ อ่านตามจังหวะของตนเอง</p>
          </div>
        </section>

        <section className="container py-12 md:py-16">
          <div className="flex flex-wrap gap-2" aria-label="เลือกหัวข้อบทความ">
            <button type="button" onClick={() => setSelected("all")} className={`filter-pill ${selected === "all" ? "filter-pill-active" : ""}`}>ทั้งหมด</button>
            {TOPICS.map((topic) => (
              <button key={topic.id} type="button" onClick={() => setSelected(topic.id)} className={`filter-pill ${selected === topic.id ? "filter-pill-active" : ""}`}>{topic.label}</button>
            ))}
          </div>

          {isLoading ? (
            <div className="mt-10 grid min-h-60 place-items-center rounded-[1.5rem] border border-[#243932]/10 bg-[#fbf9f3] text-sm text-[#65736c]">กำลังเปิดชั้นหนังสือ…</div>
          ) : articles?.length ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => <ArticleCard key={article.id} article={article} />)}
            </div>
          ) : (
            <div className="mt-10 rounded-[1.5rem] border border-dashed border-[#243932]/20 bg-[#fbf9f3] px-8 py-16 text-center">
              <p className="font-serif-thai text-2xl">กำลังค่อย ๆ รวบรวมเนื้อหา</p>
              <p className="mt-3 text-sm text-[#65736c]">หัวข้อนี้จะมีบทความใหม่ในลำดับถัดไป</p>
            </div>
          )}
        </section>
      </main>
    </PublicLayout>
  );
}
