export interface Writer {
  id: string;
  name: string;
  slug: string;
  bio: string;
  articleCount: number;
  photoUrl?: string;
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string;
  articleCount: number;
  type: "article" | "query";
}

export interface Issue {
  id: string;
  year: number;
  month: number;
  volume: number;
  issueNumber: number;
  title: string;
  isSpecial: boolean;
  articleCount: number;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  bodyHtml: string;
  writer: Writer;
  topic: Topic;
  issue: Issue;
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
  coverUrl: string;
  fileUrl: string;
}
