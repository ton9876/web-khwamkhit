import { Leaf, Menu, PenLine, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const navigation = [
  { label: "หน้าแรก", href: "/" },
  { label: "บทความ", href: "/articles" },
  { label: "แนวคิด", href: "/#mission" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-[#f6f2e9] text-[#243932]">
      <header className="sticky top-0 z-50 border-b border-[#243932]/10 bg-[#f6f2e9]/92 backdrop-blur-xl">
        <div className="container flex h-[76px] items-center justify-between">
          <Link href="/" className="group flex items-center gap-3" aria-label="พื้นทางความคิด หน้าแรก">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#243932] text-[#f6f2e9] transition-transform duration-200 group-hover:-rotate-12">
              <Leaf size={19} strokeWidth={1.7} />
            </span>
            <span>
              <span className="block font-serif-thai text-xl font-semibold leading-none tracking-tight">พื้นทางความคิด</span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.17em] text-[#7c877d]">Thoughtful ground</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="เมนูหลัก">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors hover:text-[#b8653d] ${
                  location === item.href ? "text-[#b8653d]" : "text-[#44584f]"
                }`}
              >
                {item.label}
              </a>
            ))}
            <Link href="/editor" className="button-ink text-sm">
              <PenLine size={15} />
              ส่งบทความ
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-full border border-[#243932]/15 text-[#243932] md:hidden"
            aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
            aria-expanded={open}
          >
            {open ? <X size={19} /> : <Menu size={20} />}
          </button>
        </div>
        {open ? (
          <div className="border-t border-[#243932]/10 bg-[#f6f2e9] px-5 py-5 md:hidden">
            <nav className="mx-auto flex max-w-lg flex-col gap-4" aria-label="เมนูบนมือถือ">
              {navigation.map((item) => (
                <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="text-base text-[#44584f]">
                  {item.label}
                </a>
              ))}
              <Link href="/editor" onClick={() => setOpen(false)} className="mt-2 inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#b8653d]">
                <PenLine size={15} /> ส่งบทความ
              </Link>
            </nav>
          </div>
        ) : null}
      </header>
      {children}
      <footer className="border-t border-[#243932]/10 bg-[#243932] py-12 text-[#eae4d6]">
        <div className="container grid gap-8 md:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="font-serif-thai text-2xl">พื้นทางความคิด</p>
            <p className="mt-3 max-w-md text-sm leading-7 text-[#eae4d6]/70">พื้นที่สำหรับทำความเข้าใจชีวิต การกินอยู่ สิ่งแวดล้อม และการอยู่ร่วมกันอย่างมีความหมาย</p>
          </div>
          <div className="text-sm leading-7 text-[#eae4d6]/70 md:justify-self-end md:text-right">
            <p>เนื้อหามุ่งชวนคิดและแสดงที่มาอย่างชัดเจน</p>
            <p>ไม่ใช่คำวินิจฉัยหรือคำแนะนำทางการแพทย์</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
