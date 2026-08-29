export interface Writer {
  id: string;
  name: string;
  slug: string;
  bio: string;
  articleCount: number;
  queryCount?: number;
  photoUrl?: string;
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string;
  articleCount: number;
  queryCount?: number;
  type: "article" | "query";
}

export interface Issue {
  id: string;
  year: number;
  month: number;
  volume: number;
  issueNumber: number;
  title: string;
  description: string | null;
  isSpecial: boolean;
  articleCount: number;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  bodyHtml: string;
  questionHtml?: string;
  answerHtml?: string;
  writer: Writer;
  topic: Topic;
  issue: Issue | null;
  translator?: { name: string; slug: string } | null;
  type: "article" | "query";
  createdAt: string;
  readingTime: number;
}

export interface EBook {
  id: string;
  title: string;
  author: string;
  translator?: string;
  description: string;
  coverUrl: string | null;
  fileUrl: string;
}
