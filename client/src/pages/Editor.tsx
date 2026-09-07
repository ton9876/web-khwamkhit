import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArticleReference, TopicId, TOPICS, formatThaiDate, getTopic } from "@shared/editorial";
import { ArrowLeft, Check, FileImage, FilePenLine, Loader2, Plus, Save, Send, UploadCloud } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useRoute } from "wouter";

type FormState = {
  slug: string;
  title: string;
  excerpt: string;
  topic: TopicId;
  body: string;
  coverImageKey: string | null;
  coverImageUrl: string | null;
  coverAlt: string;
  videoUrl: string;
  references: ArticleReference[];
};

const emptyForm: FormState = {
  slug: "",
  title: "",
  excerpt: "",
  topic: "living",
  body: "",
  coverImageKey: null,
  coverImageUrl: null,
  coverAlt: "",
  videoUrl: "",
  references: [],
};

type EditableArticle = {
  slug: string;
  title: string;
  excerpt: string;
  topic: TopicId;
  body: string[];
  coverImageKey: string | null;
  coverImageUrl: string | null;
  coverAlt: string | null;
  videoUrl: string | null;
  references: ArticleReference[];
};

function toForm(article: EditableArticle): FormState {
  return {
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    topic: article.topic,
    body: article.body.join("\n\n"),
    coverImageKey: article.coverImageKey,
    coverImageUrl: article.coverImageUrl,
    coverAlt: article.coverAlt || "",
    videoUrl: article.videoUrl || "",
    references: article.references || [],
  };
}

function EditorShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f6f2e9]"><Loader2 className="animate-spin text-[#b8653d]" /></div>;
  if (!user) {
    return <div className="grid min-h-screen place-items-center bg-[#f6f2e9] p-6 text-center"><div><p className="eyebrow">พื้นที่บรรณาธิการ</p><h1 className="mt-4 font-serif-thai text-3xl">เข้าสู่ระบบเพื่อจัดการบทความ</h1><Button onClick={() => startLogin()} className="mt-7 bg-[#243932]">เข้าสู่ระบบ</Button></div></div>;
  }
  if (user.role !== "admin") return <div className="grid min-h-screen place-items-center bg-[#f6f2e9] p-6 text-center"><div><p className="eyebrow">การเข้าถึงถูกจำกัด</p><h1 className="mt-4 font-serif-thai text-3xl">บัญชีนี้ยังไม่มีสิทธิ์บรรณาธิการ</h1><Link href="/" className="mt-7 inline-flex text-sm font-semibold text-[#b8653d]">กลับสู่หน้าแรก</Link></div></div>;
  return <DashboardLayout>{children}</DashboardLayout>;
}

export function EditorDashboard() {
  const { user } = useAuth();
  const { data: articles, isLoading } = trpc.articles.adminList.useQuery(undefined, { enabled: user?.role === "admin" });

  return <EditorShell><section className="mx-auto max-w-5xl py-4 md:py-8"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="eyebrow">โต๊ะทำงานบรรณาธิการ</p><h1 className="mt-3 font-serif-thai text-3xl font-semibold text-[#243932] md:text-5xl">บทความและร่องรอยความคิด</h1><p className="mt-3 text-sm text-[#65736c]">สร้างฉบับร่าง ตรวจทานที่มา แล้วจึงเผยแพร่สู่ผู้อ่าน</p></div><Link href="/editor/articles/new" className="button-ink w-fit"><Plus size={16} /> เขียนบทความใหม่</Link></div>
    <div className="mt-10 overflow-hidden rounded-2xl border border-[#243932]/10 bg-[#fbf9f3]">{isLoading ? <div className="grid min-h-52 place-items-center"><Loader2 className="animate-spin text-[#b8653d]" /></div> : articles?.length ? <div className="divide-y divide-[#243932]/10">{articles.map((article) => <div key={article.id} className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-7"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${article.status === "published" ? "bg-[#dfe7d8] text-[#426044]" : "bg-[#eee8db] text-[#776a54]"}`}>{article.status === "published" ? "เผยแพร่แล้ว" : "ฉบับร่าง"}</span><span className="text-xs text-[#7b877f]">{getTopic(article.topic).label}</span></div><h2 className="mt-2 truncate font-serif-thai text-xl font-semibold text-[#243932]">{article.title}</h2><p className="mt-1 text-xs text-[#7b877f]">แก้ไขล่าสุด {formatThaiDate(article.updatedAt.toString())}</p></div><Link href={`/editor/articles/${article.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#b8653d]">แก้ไข <FilePenLine size={16} /></Link></div>)}</div> : <div className="px-7 py-16 text-center"><FilePenLine className="mx-auto text-[#b8653d]" size={30} strokeWidth={1.4} /><p className="mt-4 font-serif-thai text-2xl">ยังไม่มีบทความในคลัง</p><p className="mt-2 text-sm text-[#65736c]">เริ่มจากฉบับร่างหนึ่งชิ้น แล้วค่อย ๆ ปรับจนพร้อมเผยแพร่</p><Link href="/editor/articles/new" className="mt-6 inline-flex text-sm font-semibold text-[#b8653d]">สร้างบทความแรก</Link></div>}</div>
  </section></EditorShell>;
}

function articlePayload(form: FormState) {
  return {
    slug: form.slug.trim(), title: form.title.trim(), excerpt: form.excerpt.trim(), topic: form.topic,
    body: form.body.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean),
    coverImageKey: form.coverImageKey, coverImageUrl: form.coverImageUrl, coverAlt: form.coverAlt.trim() || null,
    videoUrl: form.videoUrl.trim(), references: form.references,
  };
}

function readAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์ภาพได้")); reader.onload = () => resolve(String(reader.result).split(",")[1] || ""); reader.readAsDataURL(file); });
}

export function EditorArticleForm() {
  const [isNewRoute] = useRoute("/editor/articles/new");
  const [, params] = useRoute("/editor/articles/:id");
  const isNew = Boolean(isNewRoute) || !params?.id;
  const id = Number(params?.id || 0);
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: current, isLoading } = trpc.articles.getForEditor.useQuery({ id }, { enabled: !isNew && user?.role === "admin" });
  const [form, setForm] = useState<FormState>(emptyForm);
  const upload = trpc.media.uploadImage.useMutation({ onSuccess: ({ key, url }) => { setForm((prev) => ({ ...prev, coverImageKey: key, coverImageUrl: url })); toast.success("อัปโหลดภาพแล้ว"); }, onError: (error) => toast.error(error.message) });
  const create = trpc.articles.create.useMutation({ onSuccess: async ({ id: newId }) => { await utils.articles.adminList.invalidate(); toast.success("บันทึกบทความแล้ว"); setLocation(`/editor/articles/${newId}`); }, onError: (error) => toast.error(error.message) });
  const update = trpc.articles.update.useMutation({ onSuccess: async () => { await utils.articles.adminList.invalidate(); await utils.articles.getForEditor.invalidate({ id }); toast.success("บันทึกการเปลี่ยนแปลงแล้ว"); }, onError: (error) => toast.error(error.message) });

  useEffect(() => { if (current) setForm(toForm(current)); }, [current]);
  const saving = create.isPending || update.isPending;
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));
  const addReference = () => set("references", [...form.references, { title: "", url: "", author: "", publisher: "", publishedAt: "", note: "" }]);
  const updateReference = (index: number, field: keyof ArticleReference, value: string) => set("references", form.references.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));

  const save = (publish: boolean) => (event: FormEvent) => { event.preventDefault(); const article = articlePayload(form); if (isNew) create.mutate({ article, publish }); else update.mutate({ id, article, publish }); };
  const onFile = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) { toast.error("ขนาดไฟล์ภาพต้องไม่เกิน 5 MB"); return; } try { upload.mutate({ filename: file.name, mimeType: file.type, base64: await readAsBase64(file) }); } catch (error) { toast.error(error instanceof Error ? error.message : "อัปโหลดภาพไม่สำเร็จ"); } };

  if (!isNew && isLoading) return <EditorShell><div className="grid min-h-80 place-items-center"><Loader2 className="animate-spin text-[#b8653d]" /></div></EditorShell>;
  if (!isNew && !current) return <EditorShell><div className="py-16 text-center"><p className="font-serif-thai text-2xl">ไม่พบบทความนี้</p><Link href="/editor" className="mt-4 inline-flex text-sm font-semibold text-[#b8653d]">กลับไปบทความทั้งหมด</Link></div></EditorShell>;

  return <EditorShell><section className="mx-auto max-w-4xl py-4 md:py-8"><Link href="/editor" className="inline-flex items-center gap-2 text-sm font-semibold text-[#557067]"><ArrowLeft size={16} /> กลับไปบทความทั้งหมด</Link><div className="mt-8 flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><p className="eyebrow">{isNew ? "บทความใหม่" : current?.status === "published" ? "กำลังเผยแพร่" : "ฉบับร่าง"}</p><h1 className="mt-3 font-serif-thai text-3xl font-semibold text-[#243932] md:text-5xl">{isNew ? "เขียนสิ่งที่อยากชวนคิด" : "ทบทวนและปรับถ้อยคำ"}</h1></div>{current?.status === "published" ? <Link href={`/articles/${current.slug}`} className="text-sm font-semibold text-[#b8653d]" target="_blank">เปิดหน้าสาธารณะ</Link> : null}</div>
    <form className="mt-10 space-y-7 rounded-2xl border border-[#243932]/10 bg-[#fbf9f3] p-5 md:p-8" onSubmit={save(false)}>
      <div className="grid gap-6 md:grid-cols-[1fr_220px]"><div className="space-y-2"><Label htmlFor="title">ชื่อเรื่อง</Label><Input id="title" value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="ชื่อเรื่องที่ชวนให้หยุดคิด" className="border-[#243932]/15 bg-white" required /></div><div className="space-y-2"><Label htmlFor="topic">หัวข้อ</Label><select id="topic" value={form.topic} onChange={(event) => set("topic", event.target.value as TopicId)} className="flex h-10 w-full rounded-md border border-[#243932]/15 bg-white px-3 text-sm">{TOPICS.map((topic) => <option key={topic.id} value={topic.id}>{topic.label}</option>)}</select></div></div>
      <div className="space-y-2"><Label htmlFor="slug">ลิงก์บทความ (ภาษาอังกฤษ)</Label><Input id="slug" value={form.slug} onChange={(event) => set("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="a-short-english-link" className="border-[#243932]/15 bg-white" required /><p className="text-xs text-[#7b877f]">ใช้ตัวอักษรอังกฤษ ตัวเลข และขีดกลาง เพื่อสร้างลิงก์ที่อ่านง่าย</p></div>
      <div className="space-y-2"><Label htmlFor="excerpt">คำโปรย</Label><Textarea id="excerpt" value={form.excerpt} onChange={(event) => set("excerpt", event.target.value)} placeholder="สรุปสิ่งที่ผู้อ่านจะได้จากบทความชิ้นนี้" className="min-h-24 border-[#243932]/15 bg-white" required /></div>
      <div className="space-y-2"><Label htmlFor="body">เนื้อหาบทความ</Label><Textarea id="body" value={form.body} onChange={(event) => set("body", event.target.value)} placeholder="เขียนเนื้อหาเป็นย่อหน้า โดยเว้นหนึ่งบรรทัดระหว่างย่อหน้า" className="min-h-80 border-[#243932]/15 bg-white leading-7" required /><p className="text-xs text-[#7b877f]">เว้นหนึ่งบรรทัดเพื่อแยกย่อหน้าเมื่อแสดงผลบนหน้าสาธารณะ</p></div>
      <div className="rounded-xl border border-[#243932]/10 bg-[#f6f2e9] p-5"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-start"><div><p className="font-semibold text-[#243932]">ภาพปกบทความ</p><p className="mt-1 text-sm text-[#65736c]">รองรับ JPG, PNG, WEBP หรือ GIF ขนาดไม่เกิน 5 MB</p></div><label className="button-ink w-fit text-sm"><UploadCloud size={16} /> {upload.isPending ? "กำลังอัปโหลด" : "เลือกภาพ"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onFile} className="hidden" disabled={upload.isPending} /></label></div>{form.coverImageUrl ? <div className="mt-5 grid gap-4 md:grid-cols-[180px_1fr]"><img src={form.coverImageUrl} alt={form.coverAlt || "ตัวอย่างภาพปก"} className="aspect-[4/3] w-full rounded-lg object-cover" /><div className="space-y-2"><Label htmlFor="coverAlt">คำอธิบายภาพ (Alt text)</Label><Input id="coverAlt" value={form.coverAlt} onChange={(event) => set("coverAlt", event.target.value)} placeholder="อธิบายภาพอย่างกระชับ" className="border-[#243932]/15 bg-white" /></div></div> : <div className="mt-5 flex items-center gap-2 text-sm text-[#7b877f]"><FileImage size={16} /> ยังไม่ได้เลือกภาพปก ระบบจะใช้ภาพลวดลายพื้นฐานแทน</div>}</div>
      <div className="space-y-2"><Label htmlFor="video">URL คลิปวิดีโอประกอบ (ไม่บังคับ)</Label><Input id="video" type="url" value={form.videoUrl} onChange={(event) => set("videoUrl", event.target.value)} placeholder="YouTube หรือ Vimeo URL" className="border-[#243932]/15 bg-white" /></div>
      <div className="rounded-xl border border-[#243932]/10 bg-[#f6f2e9] p-5"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><p className="font-semibold text-[#243932]">แหล่งอ้างอิง</p><p className="mt-1 text-sm text-[#65736c]">บทความที่เผยแพร่ต้องมีอย่างน้อยหนึ่งแหล่งอ้างอิงพร้อมลิงก์</p></div><button type="button" onClick={addReference} className="inline-flex items-center gap-2 text-sm font-semibold text-[#b8653d]"><Plus size={16} /> เพิ่มแหล่งอ้างอิง</button></div><div className="mt-5 space-y-5">{form.references.map((reference, index) => <div key={index} className="rounded-lg border border-[#243932]/10 bg-white p-4"><div className="flex justify-between"><p className="text-sm font-semibold">แหล่งอ้างอิง {index + 1}</p><button type="button" onClick={() => set("references", form.references.filter((_, itemIndex) => itemIndex !== index))} className="text-xs text-[#b8653d]">ลบ</button></div><div className="mt-3 grid gap-3 md:grid-cols-2"><Input value={reference.title} onChange={(event) => updateReference(index, "title", event.target.value)} placeholder="ชื่อบทความหรือแหล่งข้อมูล" className="border-[#243932]/15" /><Input type="url" value={reference.url} onChange={(event) => updateReference(index, "url", event.target.value)} placeholder="https://..." className="border-[#243932]/15" /><Input value={reference.author || ""} onChange={(event) => updateReference(index, "author", event.target.value)} placeholder="ผู้เขียน (ไม่บังคับ)" className="border-[#243932]/15" /><Input value={reference.publisher || ""} onChange={(event) => updateReference(index, "publisher", event.target.value)} placeholder="สำนักพิมพ์/เว็บไซต์ (ไม่บังคับ)" className="border-[#243932]/15" /><Input value={reference.publishedAt || ""} onChange={(event) => updateReference(index, "publishedAt", event.target.value)} placeholder="วันที่เผยแพร่ (ไม่บังคับ)" className="border-[#243932]/15" /><Input value={reference.note || ""} onChange={(event) => updateReference(index, "note", event.target.value)} placeholder="หมายเหตุ (ไม่บังคับ)" className="border-[#243932]/15" /></div></div>)}</div></div>
      <div className="flex flex-wrap justify-end gap-3 border-t border-[#243932]/10 pt-6"><Button type="submit" variant="outline" disabled={saving} className="gap-2 border-[#243932]/20 bg-white text-[#243932]"><Save size={16} /> บันทึกฉบับร่าง</Button><Button type="button" disabled={saving} onClick={(event) => save(true)(event as unknown as FormEvent)} className="gap-2 bg-[#b8653d] hover:bg-[#9f4929]"><Send size={16} /> เผยแพร่บทความ</Button></div>
    </form>
  </section></EditorShell>;
}
