# New Website Issues

Source: user-provided transcript of `renaissance-new-website-issues.mp4` (29 August 2026).

Scope: this is an issue inventory only. No implementation work has been performed.

## 1. Topic query pages display articles instead of queries

The `/queries` topic navigation is not presenting the query/Q&A content it promises.

- Example: **Scriptures** reports **2 queries**, but opens a listing of **34 articles**.
- Example: **Beliefs** reports **3 queries**, but its results are also articles; only one actual query is available.
- Topic pages should show the queries assigned to that topic, rather than an article listing.
- The displayed query count must match the content shown on the page.

## 2. Writer pages omit the queries answered by that writer

Writer profile/listing pages show article totals and articles, but do not surface the queries/Q&As the writer answered.

- Example: **Tariq Mahmood Haashmi** shows 11 articles, while many of his answered queries are absent.
- Queries should be discoverable from the relevant writer page and be included in the writer’s content totals or clearly distinguished from articles.
- The writer-to-query relationship needs to be available in the site’s public navigation and listings.

## 3. Query search is incomplete or unreliable

Searching for known query content does not consistently return a result.

- Searches such as **Shia** and **Sunni** returned no matches in the recording.
- **Zulm** returned the query *Implication of the Word Zulm*, demonstrating that query search can work for some terms.
- Search needs to cover query titles and relevant query/question content consistently, with expected matching behavior.

## 4. Queries are not discoverable through their topic/category pages

Queries that are known to belong to a category cannot reliably be found by browsing that category.

- Example: *The Throne of Queen Bilqis* can be found only by manually searching its exact title.
- That query is categorized under **Quran**, but it could not be found through the Quran topic pages shown in the recording.
- Query categorization should drive the public topic navigation so each query appears under its assigned topic(s).

## 5. Query pages do not clearly separate the question from the answer

The new website does not make the Q&A structure legible within a query.

- The earlier presentation used explicit **Question** and **Answer** sections.
- On the new site, readers must infer where the question ends and the answer begins.
- Query detail pages need clear, visible question and answer boundaries/labels.

## Suggested validation cases (for later implementation)

- Browse a query topic and confirm it renders queries—not articles—and that the count is correct.
- Open Tariq Mahmood Haashmi’s writer page and confirm all of his queries, including *Implication of the Word Zulm*, are discoverable.
- Search for **Shia**, **Sunni**, and **Zulm** and confirm query results are relevant and complete.
- Find *The Throne of Queen Bilqis* through its Quran category without relying on an exact-title search.
- Open a query and confirm the question and answer are visibly distinct.
