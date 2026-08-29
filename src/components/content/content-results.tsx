import Link from "next/link";
import { Clock, FileText, MessageCircleQuestion, User } from "lucide-react";
import type { Article } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export function ContentResults({
  items,
  emptyMessage,
  showWriter = false,
}: {
  items: Article[];
  emptyMessage: string;
  showWriter?: boolean;
}) {
  if (items.length === 0) {
    return <p className="py-12 text-center text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isQuery = item.type === "query";
        const TypeIcon = isQuery ? MessageCircleQuestion : FileText;

        return (
          <Link
            key={`${item.type}-${item.id}`}
            href={`/articles/${item.slug}`}
            className="group flex flex-col gap-1.5 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1 border-border px-1.5 py-0 text-[10px] text-muted-foreground"
              >
                <TypeIcon className="h-3 w-3" aria-hidden />
                {isQuery ? "Query" : "Article"}
              </Badge>
              <Badge
                variant="outline"
                className="border-border px-1.5 py-0 text-[10px] text-muted-foreground"
              >
                {item.topic.name}
              </Badge>
            </div>
            <h2 className="font-semibold leading-snug transition-colors group-hover:text-primary">
              {item.title}
            </h2>
            <p className="line-clamp-2 text-sm text-muted-foreground">{item.excerpt}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {showWriter && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" aria-hidden />
                  {item.writer.name}
                </span>
              )}
              {item.issue && <span>{item.issue.title}</span>}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden />
                {item.readingTime} min
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
