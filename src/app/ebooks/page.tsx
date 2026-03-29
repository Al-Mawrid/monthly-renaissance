import Link from "next/link";
import { BookOpen, Download, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllEbooks } from "@/lib/queries";

export const metadata = {
  title: "E-Books",
  description: "Free downloadable e-books on Islamic scholarship and thought.",
};

export default async function EBooksPage() {
  const ebooks = await getAllEbooks();
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">E-Books</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Free downloadable publications covering Islamic law, theology, ethics,
          and more.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {ebooks.map((book) => (
          <div
            key={book.id}
            className="flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:shadow-sm transition-shadow"
          >
            {/* Cover placeholder */}
            <div className="h-48 bg-gradient-to-br from-primary/5 to-primary/15 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-primary/40" />
            </div>

            <div className="flex flex-col flex-1 p-5">
              <h2 className="font-semibold leading-snug">{book.title}</h2>

              <div className="flex flex-col gap-0.5 mt-2 text-sm text-muted-foreground">
                <span>{book.author}</span>
                {book.translator && (
                  <span className="text-xs">
                    Translated by {book.translator}
                  </span>
                )}
              </div>

              <p className="text-sm text-muted-foreground mt-3 line-clamp-3 flex-1">
                {book.description}
              </p>

              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full"
              >
                <Download className="mr-2 h-3.5 w-3.5" />
                Download PDF
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
