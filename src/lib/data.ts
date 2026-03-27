// Sample data for design review — will be replaced with real DB data later

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

// --- Sample Writers ---
export const writers: Writer[] = [
  {
    id: "1",
    name: "Javed Ahmad Ghamidi",
    slug: "javed-ahmad-ghamidi",
    bio: "Javed Ahmad Ghamidi is a Pakistani Muslim theologian, Quran scholar, Islamic modernist, and educationist. He is the founding president of Al-Mawrid Institute of Islamic Sciences and the chief editor of the monthly Renaissance journal.",
    articleCount: 187,
  },
  {
    id: "2",
    name: "Shehzad Saleem",
    slug: "shehzad-saleem",
    bio: "Shehzad Saleem is a noted scholar, author and translator. He has translated several works of Javed Ahmad Ghamidi from Urdu into English, and is the former editor of Renaissance journal.",
    articleCount: 142,
  },
  {
    id: "3",
    name: "Dr. Shehzad Saleem",
    slug: "dr-shehzad-saleem",
    bio: "A prominent scholar specializing in Quranic studies and Islamic jurisprudence, with a focus on making classical Islamic scholarship accessible to contemporary audiences.",
    articleCount: 95,
  },
  {
    id: "4",
    name: "Moiz Amjad",
    slug: "moiz-amjad",
    bio: "Moiz Amjad is an Islamic scholar and researcher affiliated with Al-Mawrid, specializing in responding to queries on Islamic beliefs and practices.",
    articleCount: 78,
  },
  {
    id: "5",
    name: "Jhangeer Hanif",
    slug: "jhangeer-hanif",
    bio: "Jhangeer Hanif is a research scholar at Al-Mawrid and a regular contributor to Renaissance, writing on topics of Islamic law, ethics, and contemporary issues.",
    articleCount: 63,
  },
  {
    id: "6",
    name: "Tariq Mahmood Hashmi",
    slug: "tariq-mahmood-hashmi",
    bio: "Tariq Mahmood Hashmi is a scholar and writer who has contributed extensively to the discourse on Hadith studies and Islamic history.",
    articleCount: 45,
  },
];

// --- Sample Topics ---
export const topics: Topic[] = [
  { id: "1", name: "Quranic Studies", slug: "quranic-studies", description: "Exegesis, interpretation, and thematic study of the Quran", articleCount: 89, type: "article" },
  { id: "2", name: "Hadith & Sunnah", slug: "hadith-sunnah", description: "Study and analysis of Prophetic traditions", articleCount: 67, type: "article" },
  { id: "3", name: "Islamic Law", slug: "islamic-law", description: "Jurisprudence, legal theory, and contemporary applications of Islamic law", articleCount: 54, type: "article" },
  { id: "4", name: "Ethics & Morality", slug: "ethics-morality", description: "Islamic ethical framework and moral philosophy", articleCount: 48, type: "article" },
  { id: "5", name: "Islamic History", slug: "islamic-history", description: "Historical events, figures, and civilizations in Islam", articleCount: 42, type: "article" },
  { id: "6", name: "Contemporary Issues", slug: "contemporary-issues", description: "Modern challenges and Islam's response to current affairs", articleCount: 38, type: "article" },
  { id: "7", name: "Belief & Theology", slug: "belief-theology", description: "Core tenets of faith, theological discourse, and creedal matters", articleCount: 35, type: "article" },
  { id: "8", name: "Worship & Rituals", slug: "worship-rituals", description: "Prayer, fasting, pilgrimage, and other acts of worship", articleCount: 31, type: "query" },
  { id: "9", name: "Social Issues", slug: "social-issues", description: "Family, community, gender, and societal concerns", articleCount: 27, type: "query" },
  { id: "10", name: "Interfaith Dialogue", slug: "interfaith-dialogue", description: "Engagement and discourse with other faiths and worldviews", articleCount: 19, type: "article" },
];

// --- Sample Issues ---
function generateIssues(): Issue[] {
  const issues: Issue[] = [];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Generate a selection of issues from various years
  const years = [2026, 2025, 2024, 2023, 2022, 2020, 2015, 2010, 2005, 2000, 1995, 1991];
  let vol = 36;

  for (const year of years) {
    const maxMonth = year === 2026 ? 3 : 12;
    const startMonth = year === 1991 ? 3 : 1;
    for (let m = maxMonth; m >= startMonth; m--) {
      issues.push({
        id: `${year}-${String(m).padStart(2, "0")}`,
        year,
        month: m,
        volume: vol,
        issueNumber: m,
        title: `${months[m - 1]} ${year}`,
        isSpecial: false,
        articleCount: Math.floor(Math.random() * 5) + 6,
      });
    }
    vol--;
    if (issues.length > 40) break;
  }
  return issues;
}

export const issues: Issue[] = generateIssues();

// --- Sample Articles ---
export const sampleArticleBody = `
<p>The Quran, in its own unique style, presents arguments for the existence and oneness of God that appeal to both the intellect and the heart. It does not merely assert theological claims but invites the reader to reflect, observe, and reason.</p>

<p>One of the most striking aspects of the Quranic discourse is its emphasis on <em>tafakkur</em> (reflection) and <em>tadabbur</em> (pondering). The reader is constantly urged to look at the natural world, at human history, and at the depths of their own soul to find signs (<span class="ArabicInLineText" dir="rtl">آيات</span>) that point to a transcendent Creator.</p>

<h2>The Argument from Design</h2>

<p>The Quran presents what philosophers would later call the "teleological argument" in a remarkably accessible way. Consider the following verse:</p>

<blockquote class="arabic-quote" dir="rtl">
إِنَّ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ وَاخْتِلَافِ اللَّيْلِ وَالنَّهَارِ لَآيَاتٍ لِّأُولِي الْأَلْبَابِ
</blockquote>

<p>"Indeed, in the creation of the heavens and the earth and the alternation of the night and the day are signs for those of understanding." (3:190)</p>

<p>This verse does not demand blind acceptance. Instead, it points to observable phenomena — the vastness of the cosmos, the precision of celestial mechanics, the rhythmic cycle of day and night — and invites the reader to draw their own conclusions. The Quran's audience is described as <span class="ArabicInLineText" dir="rtl">أُولِي الْأَلْبَابِ</span> — "people of understanding" — those who engage their rational faculties.</p>

<h2>Historical Context and Scholarly Tradition</h2>

<p>The classical Muslim scholars developed sophisticated frameworks for understanding these Quranic arguments. Imam al-Ghazali, in his monumental <em>Ihya Ulum al-Din</em>, dedicated extensive sections to discussing how contemplation of the natural world leads to knowledge of God.<sup class="FootNoteLink" id="fnref1"><a href="#fn1">1</a></sup></p>

<p>Similarly, Ibn Rushd (Averroes) argued in his <em>Fasl al-Maqal</em> that the Quran actually mandates the use of rational inquiry and philosophical reasoning. He wrote that "the Law commands the study of philosophy" and that demonstration (burhan) is the highest form of scriptural interpretation.<sup class="FootNoteLink" id="fnref2"><a href="#fn2">2</a></sup></p>

<p>This rich intellectual tradition demonstrates that Islam has never been opposed to reason. On the contrary, the Quran positions rational thought as a pathway to faith, not an obstacle to it.</p>

<h2>The Moral Argument</h2>

<p>Beyond cosmological and teleological arguments, the Quran also presents what we might call a moral argument for God's existence. Human beings possess an innate moral sense — a capacity to distinguish right from wrong that transcends cultural conditioning.</p>

<p>The Quran refers to this innate disposition as <span class="ArabicInLineText" dir="rtl">فِطْرَة</span> (fitrah):</p>

<blockquote class="arabic-quote" dir="rtl">
فَأَقِمْ وَجْهَكَ لِلدِّينِ حَنِيفًا ۚ فِطْرَتَ اللَّهِ الَّتِي فَطَرَ النَّاسَ عَلَيْهَا
</blockquote>

<p>"So direct your face toward the religion, inclining to truth. [Adhere to] the fitrah of Allah upon which He has created [all] people." (30:30)</p>

<p>This concept of fitrah suggests that the recognition of God is not something externally imposed but something deeply woven into the fabric of human nature itself.</p>

<div class="FootNote" id="fn1">
<p><sup>1</sup> Al-Ghazali, <em>Ihya Ulum al-Din</em>, Book 35: "Kitab al-Tafakkur" (The Book of Contemplation). See also Frank Griffel, <em>Al-Ghazali's Philosophical Theology</em> (Oxford University Press, 2009).</p>
</div>

<div class="FootNote" id="fn2">
<p><sup>2</sup> Ibn Rushd, <em>Fasl al-Maqal</em> (The Decisive Treatise), translated by Charles Butterworth (Brigham Young University Press, 2001), p. 1-8.</p>
</div>
`;

export const articles: Article[] = [
  {
    id: "1",
    title: "The Quranic Argument for the Existence of God",
    slug: "quranic-argument-existence-of-god",
    excerpt: "The Quran presents arguments for the existence and oneness of God that appeal to both the intellect and the heart, inviting readers to reflect, observe, and reason.",
    bodyHtml: sampleArticleBody,
    writer: writers[0],
    topic: topics[0],
    issue: issues[0],
    type: "article",
    createdAt: "2026-03-01",
    readingTime: 12,
  },
  {
    id: "2",
    title: "Understanding the Concept of Sunnah",
    slug: "understanding-concept-of-sunnah",
    excerpt: "A comprehensive exploration of what constitutes the Sunnah of the Prophet, distinguishing between his personal practices and those that carry religious authority.",
    bodyHtml: "<p>Sample content for article on Sunnah...</p>",
    writer: writers[0],
    topic: topics[1],
    issue: issues[0],
    type: "article",
    createdAt: "2026-03-01",
    readingTime: 15,
  },
  {
    id: "3",
    title: "The Ethics of Disagreement in Islam",
    slug: "ethics-of-disagreement-in-islam",
    excerpt: "How the Islamic tradition provides a sophisticated framework for managing intellectual and juristic disagreement while maintaining unity and mutual respect.",
    bodyHtml: "<p>Sample content for article on ethics of disagreement...</p>",
    writer: writers[1],
    topic: topics[3],
    issue: issues[0],
    type: "article",
    createdAt: "2026-03-01",
    readingTime: 10,
  },
  {
    id: "4",
    title: "Revisiting the Punishment for Apostasy",
    slug: "revisiting-punishment-for-apostasy",
    excerpt: "A critical re-examination of the classical position on apostasy in light of Quranic principles of religious freedom and the historical context of early Islamic law.",
    bodyHtml: "<p>Sample content for article on apostasy...</p>",
    writer: writers[0],
    topic: topics[2],
    issue: issues[1],
    type: "article",
    createdAt: "2026-02-01",
    readingTime: 18,
  },
  {
    id: "5",
    title: "The Role of Consensus in Islamic Law",
    slug: "role-of-consensus-in-islamic-law",
    excerpt: "An analysis of ijma (consensus) as a source of Islamic law, its historical development, and its relevance in contemporary Muslim societies.",
    bodyHtml: "<p>Sample content for article on consensus...</p>",
    writer: writers[1],
    topic: topics[2],
    issue: issues[1],
    type: "article",
    createdAt: "2026-02-01",
    readingTime: 14,
  },
  {
    id: "6",
    title: "Islam and the Modern State",
    slug: "islam-and-the-modern-state",
    excerpt: "Exploring the relationship between Islamic principles and modern governance, arguing for a nuanced understanding that respects both tradition and contemporary realities.",
    bodyHtml: "<p>Sample content for article on modern state...</p>",
    writer: writers[0],
    topic: topics[5],
    issue: issues[2],
    type: "article",
    createdAt: "2026-01-01",
    readingTime: 20,
  },
  {
    id: "7",
    title: "The Quran on Religious Pluralism",
    slug: "quran-on-religious-pluralism",
    excerpt: "How the Quran addresses the reality of religious diversity and provides a framework for coexistence rooted in mutual respect and shared moral values.",
    bodyHtml: "<p>Sample content for article on pluralism...</p>",
    writer: writers[2],
    topic: topics[9],
    issue: issues[2],
    type: "article",
    createdAt: "2026-01-01",
    readingTime: 11,
  },
  {
    id: "8",
    title: "Reflections on Surah Al-Kahf",
    slug: "reflections-surah-al-kahf",
    excerpt: "A thematic exploration of the four narratives in Surah Al-Kahf and their enduring relevance to the challenges faced by believers in every age.",
    bodyHtml: "<p>Sample content for Surah Al-Kahf reflections...</p>",
    writer: writers[0],
    topic: topics[0],
    issue: issues[3],
    type: "article",
    createdAt: "2025-12-01",
    readingTime: 16,
  },
];

// --- Sample Queries ---
export const queries: Article[] = [
  {
    id: "q1",
    title: "Is Music Prohibited in Islam?",
    slug: "is-music-prohibited-in-islam",
    excerpt: "A reader asks about the Islamic ruling on music and whether all forms of music are forbidden or only certain types.",
    bodyHtml: "<p>Sample query response on music in Islam...</p>",
    writer: writers[0],
    topic: topics[7],
    issue: issues[0],
    type: "query",
    createdAt: "2026-03-01",
    readingTime: 8,
  },
  {
    id: "q2",
    title: "Women Leading Prayers",
    slug: "women-leading-prayers",
    excerpt: "Can a woman lead the congregational prayer? A detailed response examining the evidence from the Quran, Hadith, and classical scholarship.",
    bodyHtml: "<p>Sample query response on women leading prayers...</p>",
    writer: writers[3],
    topic: topics[8],
    issue: issues[1],
    type: "query",
    createdAt: "2026-02-01",
    readingTime: 10,
  },
  {
    id: "q3",
    title: "The Concept of Jihad in Islam",
    slug: "concept-of-jihad-in-islam",
    excerpt: "Addressing common misconceptions about jihad and explaining its proper meaning in the light of the Quran and Sunnah.",
    bodyHtml: "<p>Sample query response on jihad...</p>",
    writer: writers[0],
    topic: topics[6],
    issue: issues[2],
    type: "query",
    createdAt: "2026-01-01",
    readingTime: 12,
  },
];

// --- Sample E-Books ---
export const ebooks: EBook[] = [
  {
    id: "1",
    title: "Islam: A Comprehensive Introduction",
    author: "Javed Ahmad Ghamidi",
    translator: "Shehzad Saleem",
    description: "A comprehensive overview of the Islamic faith covering beliefs, practices, ethics, and law, presented in a systematic and accessible manner.",
    coverUrl: "/ebooks/islam-intro-cover.jpg",
    fileUrl: "/ebooks/islam-intro.pdf",
  },
  {
    id: "2",
    title: "The Islamic Law of Jihad",
    author: "Javed Ahmad Ghamidi",
    translator: "Shehzad Saleem",
    description: "An authoritative examination of the Islamic law of jihad, clarifying widespread misconceptions and presenting the Quranic framework for armed conflict.",
    coverUrl: "/ebooks/jihad-cover.jpg",
    fileUrl: "/ebooks/jihad.pdf",
  },
  {
    id: "3",
    title: "Meezan: A Comprehensive Introduction to Islam",
    author: "Javed Ahmad Ghamidi",
    translator: "Shehzad Saleem",
    description: "The magnum opus of Javed Ahmad Ghamidi, presenting his understanding of Islam derived from the Quran and Sunnah in a comprehensive framework.",
    coverUrl: "/ebooks/meezan-cover.jpg",
    fileUrl: "/ebooks/meezan.pdf",
  },
  {
    id: "4",
    title: "The Social Law of Islam",
    author: "Javed Ahmad Ghamidi",
    translator: "Shehzad Saleem",
    description: "A detailed exposition of the social laws outlined in the Quran, including marriage, divorce, inheritance, and family relations.",
    coverUrl: "/ebooks/social-law-cover.jpg",
    fileUrl: "/ebooks/social-law.pdf",
  },
  {
    id: "5",
    title: "The Political Law of Islam",
    author: "Javed Ahmad Ghamidi",
    translator: "Shehzad Saleem",
    description: "An exploration of the political principles derived from the Quran and the Prophetic practice, and their application in contemporary Muslim societies.",
    coverUrl: "/ebooks/political-law-cover.jpg",
    fileUrl: "/ebooks/political-law.pdf",
  },
  {
    id: "6",
    title: "The Penal Law of Islam",
    author: "Javed Ahmad Ghamidi",
    translator: "Shehzad Saleem",
    description: "A scholarly analysis of the Quranic penal code, addressing hudud, qisas, and ta'zir punishments within their proper textual and historical context.",
    coverUrl: "/ebooks/penal-law-cover.jpg",
    fileUrl: "/ebooks/penal-law.pdf",
  },
];

// Helper to get month name
export function getMonthName(month: number): string {
  return ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][month - 1];
}

// Group issues by year
export function groupIssuesByYear(issueList: Issue[]): Record<number, Issue[]> {
  return issueList.reduce(
    (acc, issue) => {
      if (!acc[issue.year]) acc[issue.year] = [];
      acc[issue.year].push(issue);
      return acc;
    },
    {} as Record<number, Issue[]>
  );
}
