-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEAM', 'MEMBER');

-- CreateTable
CREATE TABLE "writers" (
    "id" SERIAL NOT NULL,
    "old_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT,
    "display_on_site" BOOLEAN NOT NULL DEFAULT true,
    "is_query_writer" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT,

    CONSTRAINT "writers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" SERIAL NOT NULL,
    "old_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "display" BOOLEAN NOT NULL DEFAULT true,
    "ranking" INTEGER NOT NULL DEFAULT 0,
    "display_in_list" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issues" (
    "id" SERIAL NOT NULL,
    "old_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "volume_number" TEXT,
    "issue_number" TEXT,
    "issue_date" TIMESTAMP(3),
    "display" BOOLEAN NOT NULL DEFAULT true,
    "is_special" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" SERIAL NOT NULL,
    "old_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "body_html" TEXT NOT NULL,
    "topic_id" INTEGER NOT NULL,
    "writer_id" INTEGER NOT NULL,
    "translator_id" INTEGER,
    "date_added" TIMESTAMP(3),
    "display" BOOLEAN NOT NULL DEFAULT true,
    "is_important" BOOLEAN NOT NULL DEFAULT false,
    "is_editorial" BOOLEAN NOT NULL DEFAULT false,
    "editorial_issue_id" INTEGER,
    "is_issue_intro" BOOLEAN NOT NULL DEFAULT false,
    "intro_issue_id" INTEGER,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "query_entries" (
    "id" SERIAL NOT NULL,
    "old_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "question_html" TEXT NOT NULL,
    "answer_html" TEXT,
    "questioner" TEXT,
    "questioner_email" TEXT,
    "topic_id" INTEGER NOT NULL,
    "writer_id" INTEGER NOT NULL,
    "date_added" TIMESTAMP(3),
    "display" BOOLEAN NOT NULL DEFAULT true,
    "is_important" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "query_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_issue_links" (
    "article_id" INTEGER NOT NULL,
    "issue_id" INTEGER NOT NULL,

    CONSTRAINT "article_issue_links_pkey" PRIMARY KEY ("article_id","issue_id")
);

-- CreateTable
CREATE TABLE "query_issue_links" (
    "query_id" INTEGER NOT NULL,
    "issue_id" INTEGER NOT NULL,

    CONSTRAINT "query_issue_links_pkey" PRIMARY KEY ("query_id","issue_id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" SERIAL NOT NULL,
    "old_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_ebook" BOOLEAN NOT NULL DEFAULT false,
    "is_book" BOOLEAN NOT NULL DEFAULT false,
    "writer_id" INTEGER,
    "translator_id" INTEGER,
    "display" BOOLEAN NOT NULL DEFAULT true,
    "file_name" TEXT NOT NULL,
    "post_date" TIMESTAMP(3),

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" SERIAL NOT NULL,
    "old_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "date_added" TIMESTAMP(3),
    "display" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_categories" (
    "id" SERIAL NOT NULL,
    "old_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "ranking" INTEGER NOT NULL DEFAULT 0,
    "display" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "video_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "links" (
    "id" SERIAL NOT NULL,
    "old_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "date_added" TIMESTAMP(3),
    "display" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "link_categories" (
    "id" SERIAL NOT NULL,
    "old_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "ranking" INTEGER NOT NULL DEFAULT 0,
    "display" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "link_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "writers_old_id_key" ON "writers"("old_id");

-- CreateIndex
CREATE UNIQUE INDEX "writers_slug_key" ON "writers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "writers_user_id_key" ON "writers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "topics_old_id_key" ON "topics"("old_id");

-- CreateIndex
CREATE UNIQUE INDEX "topics_slug_key" ON "topics"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "issues_old_id_key" ON "issues"("old_id");

-- CreateIndex
CREATE UNIQUE INDEX "issues_slug_key" ON "issues"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "articles_old_id_key" ON "articles"("old_id");

-- CreateIndex
CREATE UNIQUE INDEX "query_entries_old_id_key" ON "query_entries"("old_id");

-- CreateIndex
CREATE UNIQUE INDEX "books_old_id_key" ON "books"("old_id");

-- CreateIndex
CREATE UNIQUE INDEX "videos_old_id_key" ON "videos"("old_id");

-- CreateIndex
CREATE UNIQUE INDEX "video_categories_old_id_key" ON "video_categories"("old_id");

-- CreateIndex
CREATE UNIQUE INDEX "links_old_id_key" ON "links"("old_id");

-- CreateIndex
CREATE UNIQUE INDEX "link_categories_old_id_key" ON "link_categories"("old_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- AddForeignKey
ALTER TABLE "writers" ADD CONSTRAINT "writers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_writer_id_fkey" FOREIGN KEY ("writer_id") REFERENCES "writers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_translator_id_fkey" FOREIGN KEY ("translator_id") REFERENCES "writers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "query_entries" ADD CONSTRAINT "query_entries_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "query_entries" ADD CONSTRAINT "query_entries_writer_id_fkey" FOREIGN KEY ("writer_id") REFERENCES "writers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_issue_links" ADD CONSTRAINT "article_issue_links_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_issue_links" ADD CONSTRAINT "article_issue_links_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "query_issue_links" ADD CONSTRAINT "query_issue_links_query_id_fkey" FOREIGN KEY ("query_id") REFERENCES "query_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "query_issue_links" ADD CONSTRAINT "query_issue_links_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_writer_id_fkey" FOREIGN KEY ("writer_id") REFERENCES "writers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_translator_id_fkey" FOREIGN KEY ("translator_id") REFERENCES "writers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "video_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "link_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
