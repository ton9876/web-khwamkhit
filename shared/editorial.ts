export const TOPICS = [
  { id: "living", label: "การใช้ชีวิต", description: "ความสัมพันธ์ การเลี้ยงดู และการอยู่กับความเปลี่ยนแปลง", accent: "#b8653d" },
  { id: "food", label: "การกินอยู่", description: "อาหาร บ้าน และความพอดีในชีวิตประจำวัน", accent: "#c79a45" },
  { id: "environment", label: "สิ่งแวดล้อม", description: "การใช้ทรัพยากรและการเห็นความเชื่อมโยงกับส่วนรวม", accent: "#71845e" },
  { id: "ethics", label: "คุณธรรมความดี", description: "ความรับผิดชอบ การอยู่ร่วมกัน และการเลือกอย่างมีสติ", accent: "#3f6b62" },
] as const;

export type TopicId = (typeof TOPICS)[number]["id"];
export type ArticleStatus = "draft" | "submitted" | "changes_requested" | "approved" | "published";

export type ArticleReference = {
  title: string;
  author?: string;
  publisher?: string;
  publishedAt?: string;
  url: string;
  note?: string;
};

export type EditorialArticle = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  topic: TopicId;
  status: ArticleStatus;
  authorId?: number | null;
  authorName?: string | null;
  reviewNote?: string | null;
  body: string[];
  coverImageUrl?: string | null;
  coverAlt?: string | null;
  videoUrl?: string | null;
  publishedAt: string | Date | null;
  updatedAt: string | Date;
  references: ArticleReference[];
};

export const STARTER_ARTICLE: EditorialArticle = {
  id: 1,
  slug: "when-the-world-moves-too-fast-for-parents",
  title: "เมื่อโลกเปลี่ยนเร็วเกินกว่าจะตามทัน เราจะอยู่ข้างลูกอย่างไร",
  excerpt:
    "ชวนมองแรงกดดันจากการเปรียบเทียบและการสร้างผลงานของเด็ก ผ่านคำถามง่าย ๆ ว่า สิ่งที่ลูกกำลังทำอยู่ เขาได้เลือกด้วยตัวเองหรือไม่",
  topic: "living",
  status: "published",
  coverImageUrl: "/manus-storage/phuenthang-hero_3326df0c.png",
  coverAlt: "สวนเขตร้อนยามเช้าที่เงียบสงบ",
  videoUrl: null,
  publishedAt: "2026-09-06T00:00:00.000Z",
  updatedAt: "2026-09-06T00:00:00.000Z",
  body: [
    "ในโลกที่เปลี่ยนเร็ว การเลี้ยงดูลูกอาจทำให้เรารู้สึกว่าต้องตัดสินใจให้ถูกอยู่ตลอดเวลา ต้องเรียนเพิ่มหรือไม่ ต้องมีผลงานแบบไหน และควรเดินตามจังหวะของคนอื่นมากเพียงใด คำถามเหล่านี้สะท้อนความรักและความหวังดีของพ่อแม่ได้พร้อมกับแรงกดดันที่ค่อย ๆ สะสมโดยไม่รู้ตัว",
    "บทความต้นทางเรื่องการแข่งขันของผู้ปกครองชวนให้เห็นว่า การเปรียบเทียบเรื่องกิจกรรมหรือความสำเร็จของลูกอาจทำให้การเลี้ยงดูถูกขับเคลื่อนด้วยการแข่งกันมากกว่าการทำความเข้าใจเด็กแต่ละคน เราจึงอาจเริ่มด้วยการหยุดถามตัวเองว่า สิ่งที่ลูกกำลังทำตอบรับความสนใจและจังหวะชีวิตของเขาหรือไม่",
    "เวลาว่าง การได้ลองทำสิ่งต่าง ๆ ด้วยตนเอง การเผชิญความผิดหวังเล็ก ๆ และการมีผู้ใหญ่รับฟังอย่างไม่รีบร้อน ล้วนเป็นพื้นที่เรียนรู้ที่มีคุณค่า บทความนี้ไม่ได้เสนอสูตรสำเร็จสำหรับทุกครอบครัว แต่ชวนให้ค่อย ๆ คืนพื้นที่ดังกล่าวให้เหมาะกับบริบทของแต่ละบ้าน",
    "อาจเริ่มจากเรื่องเล็ก เช่น ลดกิจกรรมที่แน่นเกินไปหนึ่งอย่าง ถามความเห็นของลูกก่อนตัดสินใจแทน หรืออยู่เคียงข้างเมื่อเขาผิดหวังโดยไม่รีบแก้ปัญหาให้ทันที การเลือกเช่นนี้ไม่ใช่การละเลยอนาคต แต่เป็นการให้ความสำคัญกับการเติบโตที่มองเห็นตัวตนและความรับผิดชอบของเด็กไปพร้อมกัน",
    "เนื้อหานี้เป็นข้อชวนคิดเชิงบรรณาธิการ ไม่ใช่คำแนะนำด้านสุขภาพจิตหรือการแพทย์เฉพาะบุคคล หากครอบครัวกังวลต่อสุขภาวะของตนเองหรือบุตรหลาน ควรปรึกษาผู้เชี่ยวชาญที่มีใบอนุญาตโดยตรง",
  ],
  references: [
    {
      title: "How to Resist Competitive Parenting",
      author: "Eileen Kennedy-Moore, Ph.D.",
      publisher: "Psychology Today",
      publishedAt: "31 มีนาคม 2019",
      url: "https://www.psychologytoday.com/ca/blog/growing-friendships/201903/how-resist-competitive-parenting",
      note: "ใช้เป็นจุดตั้งต้นของข้อชวนคิด ไม่ใช่หลักฐานทางการแพทย์สำหรับการวินิจฉัยหรือรักษา",
    },
  ],
};

export function getTopic(id: TopicId) {
  return TOPICS.find((topic) => topic.id === id) ?? TOPICS[0];
}

export function formatThaiDate(value: string | Date) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
