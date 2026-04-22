import { BookOpen, Download } from "lucide-react";
import { getAllEbooks } from "@/lib/queries";

export const metadata = {
  title: "E-Books",
  description: "Free downloadable e-books on Islamic scholarship and thought.",
};

export const dynamic = "force-dynamic";

export default async function EBooksPage() {
  const ebooks = await getAllEbooks();
  return (
    <div>
      <div className="border-b" style={{ borderColor: "var(--foreground)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-14">
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div>
              <div className="mr-eyebrow mb-2.5" style={{ color: "var(--mr-saffron-700)" }}>
                — The library —
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight leading-none">
                E-Books &amp; monographs
              </h1>
              <p className="font-serif text-[17px] text-muted-foreground mt-4 max-w-xl leading-relaxed">
                Free downloadable publications covering Islamic law, theology, ethics, and more.
              </p>
            </div>
            <div className="text-right">
              <div className="font-serif font-semibold leading-none" style={{ fontSize: 60, color: "var(--mr-clay-700)" }}>
                {ebooks.length}
              </div>
              <div className="mr-eyebrow mt-1">titles catalogued</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-12">
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          style={{ gap: 1, background: "var(--border)", border: "1px solid var(--border)" }}
        >
          {ebooks.map((book) => (
            <div
              key={book.id}
              className="mr-hover-card flex flex-col"
              style={{ background: "var(--card)" }}
            >
              <div
                className="relative h-48 flex items-center justify-center border-b"
                style={{
                  background:
                    "linear-gradient(135deg, var(--mr-cream) 0%, var(--mr-saffron-50) 100%)",
                  borderColor: "var(--border)",
                }}
              >
                <span className="mr-corner tl" />
                <span className="mr-corner tr" />
                <span className="mr-corner bl" />
                <span className="mr-corner br" />
                <BookOpen className="h-10 w-10" style={{ color: "var(--mr-saffron-700)", opacity: 0.5 }} />
              </div>
              <div className="flex flex-col flex-1 p-5">
                <h2 className="font-serif text-[17px] font-semibold leading-snug">{book.title}</h2>
                <div className="flex flex-col gap-0.5 mt-2 text-[13px] text-muted-foreground">
                  <span>By <span className="text-foreground">{book.author}</span></span>
                  {book.translator && <span className="text-[12px]">Translated by {book.translator}</span>}
                </div>
                <p className="text-[13px] text-muted-foreground mt-3 line-clamp-3 flex-1 leading-relaxed">
                  {book.description}
                </p>
                <button className="mt-4 mr-btn mr-btn-outline justify-center">
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
