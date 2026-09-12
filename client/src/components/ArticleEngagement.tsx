import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Copy, Heart, MessageCircle, Share2, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = { articleId: number; title: string };

export default function ArticleEngagement({ articleId, title }: Props) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.engagement.get.useQuery({ articleId });
  const [comment, setComment] = useState("");
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const setEngagement = (next: NonNullable<typeof data>) => utils.engagement.get.setData({ articleId }, next);

  const rate = trpc.engagement.rate.useMutation({
    onSuccess: setEngagement,
    onError: (error) => toast.error(error.message),
  });
  const vote = trpc.engagement.vote.useMutation({
    onSuccess: setEngagement,
    onError: (error) => toast.error(error.message),
  });
  const commentMutation = trpc.engagement.comment.useMutation({
    onSuccess: (next) => {
      setComment("");
      setEngagement(next);
      toast.success("เพิ่มความคิดเห็นแล้ว");
    },
    onError: (error) => toast.error(error.message),
  });

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard?.writeText(shareUrl);
    toast.success("คัดลอกลิงก์บทความแล้ว");
  };

  const nativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title, text: `อ่านบทความ: ${title}`, url: shareUrl });
    } else {
      await copyLink();
    }
  };

  const requireLogin = () => {
    toast.info("กรุณาเข้าสู่ระบบก่อนร่วมแสดงความคิดเห็นหรือให้คะแนน");
    startLogin();
  };

  return (
    <section className="border-t border-[#243932]/10 bg-[#f6f2e9] py-14 md:py-20">
      <div className="container max-w-4xl">
        <div className="grid gap-8 rounded-[1.6rem] border border-[#243932]/10 bg-[#fbf9f3] p-6 shadow-[0_18px_45px_-35px_rgba(28,54,45,0.6)] md:grid-cols-[1fr_1.2fr] md:p-8">
          <div>
            <p className="eyebrow">ร่วมเดินทางต่อ</p>
            <h2 className="mt-3 font-serif-thai text-3xl font-semibold text-[#243932]">ส่งต่อความคิดนี้</h2>
            <p className="mt-3 text-sm leading-7 text-[#65736c]">แบ่งปันบทความให้คนที่คุณคิดว่าน่าจะได้หยุดคิดไปด้วยกัน</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={nativeShare} className="gap-2 border-[#243932]/15 bg-white"><Share2 size={16} /> แชร์</Button>
              <Button type="button" variant="outline" onClick={copyLink} className="gap-2 border-[#243932]/15 bg-white"><Copy size={16} /> คัดลอกลิงก์</Button>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-md border border-[#243932]/15 bg-white px-3 text-sm font-semibold text-[#243932]">Facebook</a>
              <a href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-md border border-[#243932]/15 bg-white px-3 text-sm font-semibold text-[#243932]">LINE</a>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#243932]">ให้คะแนนบทความ</p>
                  <p className="mt-1 text-sm text-[#65736c]">{isLoading ? "กำลังสรุปผล" : `${(data?.ratingAverage ?? 0).toFixed(1)} / 5 จาก ${data?.ratingCount ?? 0} คน`}</p>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button key={value} type="button" aria-label={`ให้ ${value} ดาว`} onClick={() => user ? rate.mutate({ articleId, rating: value }) : requireLogin()} className="rounded p-1 transition hover:bg-[#e8dfc4]"><Star size={21} fill={(data?.viewerRating ?? 0) >= value ? "#c79a45" : "transparent"} color="#c79a45" /></button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-[#243932]/10 pt-5">
              <div><p className="font-semibold text-[#243932]">โหวตว่าบทความนี้มีคุณค่า</p><p className="mt-1 text-sm text-[#65736c]">{data?.voteCount ?? 0} คนโหวตแล้ว</p></div>
              <Button type="button" variant="outline" onClick={() => user ? vote.mutate({ articleId }) : requireLogin()} className={`gap-2 border-[#243932]/15 bg-white ${data?.viewerVoted ? "text-[#b8653d]" : "text-[#243932]"}`}><Heart size={17} fill={data?.viewerVoted ? "currentColor" : "none"} /> {data?.viewerVoted ? "โหวตแล้ว" : "โหวต"}</Button>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <div className="flex items-center gap-2"><MessageCircle size={19} className="text-[#b8653d]" /><h2 className="font-serif-thai text-3xl font-semibold text-[#243932]">ความคิดเห็น</h2><span className="text-sm text-[#7b877f]">{data?.comments.length ?? 0}</span></div>
          <div className="mt-5 rounded-2xl border border-[#243932]/10 bg-[#fbf9f3] p-5">
            {user ? (
              <form onSubmit={(event) => { event.preventDefault(); commentMutation.mutate({ articleId, body: comment }); }}>
                <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="เขียนความคิดเห็นอย่างสุภาพและสร้างสรรค์" className="min-h-24 border-[#243932]/15 bg-white" maxLength={2000} />
                <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-[#7b877f]">ความคิดเห็นของคุณจะแสดงใต้บทความ</span><Button type="submit" disabled={comment.trim().length < 2 || commentMutation.isPending} className="bg-[#243932]">แสดงความคิดเห็น</Button></div>
              </form>
            ) : (
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><p className="text-sm text-[#65736c]">เข้าสู่ระบบเพื่อให้คะแนน โหวต และร่วมแสดงความคิดเห็น</p><Button type="button" onClick={() => startLogin()} className="bg-[#243932]">เข้าสู่ระบบ</Button></div>
            )}
          </div>
          <div className="mt-5 space-y-3">
            {data?.comments.map((item) => (
              <article key={item.id} className="rounded-xl border border-[#243932]/10 bg-[#fbf9f3] p-5"><div className="flex items-center justify-between gap-3"><p className="font-semibold text-[#243932]">{item.authorName}</p><time className="text-xs text-[#7b877f]">{new Date(item.createdAt).toLocaleDateString("th-TH")}</time></div><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#53645c]">{item.body}</p></article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
