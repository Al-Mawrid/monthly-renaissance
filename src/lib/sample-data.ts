import type { Writer, Topic, Issue, Article, EBook } from "./types";

// ─── Sample data used when the database is unavailable ──────────

const sampleWriters: Writer[] = [
  {
    id: "1",
    name: "Shehzad Saleem",
    slug: "shehzad-saleem",
    bio: "Dr. Shehzad Saleem is the editor of Renaissance and a scholar of Islamic thought. He has written extensively on Qur'anic hermeneutics, the methodology of Hadith criticism, and the interface of Islam with modernity. He studied under Javed Ahmad Ghamidi for over two decades and has taught at Al-Mawrid Institute, Lahore.",
    articleCount: 124,
    photoUrl: undefined,
  },
  {
    id: "2",
    name: "Javed Ahmad Ghamidi",
    slug: "javed-ahmad-ghamidi",
    bio: "Javed Ahmad Ghamidi is a Pakistani Islamic scholar, Quran commentator, and educationist. He is the founder of Al-Mawrid Institute of Islamic Sciences and the author of Mizan, a comprehensive explication of Islam. He was a student of Amin Ahsan Islahi and has devoted his life to presenting Islam in its original, rational, and humane form.",
    articleCount: 97,
    photoUrl: undefined,
  },
  {
    id: "3",
    name: "Jhangeer Hanif",
    slug: "jhangeer-hanif",
    bio: "Jhangeer Hanif is a scholar affiliated with Al-Mawrid who specialises in the study of Islamic jurisprudence and comparative religion. He has contributed widely to Renaissance on topics ranging from the philosophy of Islamic law to contemporary social questions.",
    articleCount: 41,
    photoUrl: undefined,
  },
  {
    id: "4",
    name: "Tariq Mahmood Hashmi",
    slug: "tariq-mahmood-hashmi",
    bio: "Tariq Mahmood Hashmi is a researcher and scholar at Al-Mawrid. His primary areas of interest are Hadith sciences, Islamic history, and the biography of the Prophet ﷺ. He has authored several academic works on Sunnah and its role in Islamic law.",
    articleCount: 38,
    photoUrl: undefined,
  },
];

const sampleIssue: Issue = {
  id: "2026-03",
  year: 2026,
  month: 3,
  volume: 36,
  issueNumber: 3,
  title: "March 2026 — Vol. 36, No. 3",
  isSpecial: false,
  articleCount: 9,
};

const sampleIssue2: Issue = {
  id: "2026-02",
  year: 2026,
  month: 2,
  volume: 36,
  issueNumber: 2,
  title: "February 2026 — Vol. 36, No. 2",
  isSpecial: false,
  articleCount: 7,
};

const sampleIssue3: Issue = {
  id: "2026-01",
  year: 2026,
  month: 1,
  volume: 36,
  issueNumber: 1,
  title: "January 2026 — Vol. 36, No. 1",
  isSpecial: false,
  articleCount: 8,
};

const sampleTopics: Topic[] = [
  {
    id: "1",
    name: "Qur'anic Exegesis",
    slug: "quranic-exegesis",
    description: "In-depth commentary and interpretation of the Qur'an in light of language, context, and classical scholarship.",
    articleCount: 87,
    type: "article",
  },
  {
    id: "2",
    name: "Hadith and Sunnah",
    slug: "hadith-and-sunnah",
    description: "Critical analysis of prophetic traditions — their transmission, methodology, and application.",
    articleCount: 74,
    type: "article",
  },
  {
    id: "3",
    name: "Islamic Law",
    slug: "islamic-law",
    description: "Principles and applications of Islamic jurisprudence, ijtihad, and fiqh in classical and modern contexts.",
    articleCount: 62,
    type: "article",
  },
  {
    id: "4",
    name: "Contemporary Issues",
    slug: "contemporary-issues",
    description: "Modern challenges examined in the light of Islamic thought and values.",
    articleCount: 58,
    type: "article",
  },
  {
    id: "5",
    name: "History and Biography",
    slug: "history-and-biography",
    description: "Islamic history, the Sirah of the Prophet ﷺ, and biographical studies of key scholars.",
    articleCount: 42,
    type: "article",
  },
  {
    id: "6",
    name: "Faith and Belief",
    slug: "faith-and-belief",
    description: "Core tenets of Islamic theology — tawhid, prophethood, the hereafter, and their rational foundations.",
    articleCount: 37,
    type: "article",
  },
  {
    id: "7",
    name: "Ethics and Morality",
    slug: "ethics-and-morality",
    description: "Islamic moral philosophy, personal character, and social ethics.",
    articleCount: 29,
    type: "query",
  },
  {
    id: "8",
    name: "Worship and Practice",
    slug: "worship-and-practice",
    description: "The five pillars, ritual worship, and their deeper spiritual significance.",
    articleCount: 33,
    type: "query",
  },
];

const articleBody1 = `
<p>The Qur'an establishes justice — <span class="ArabicInLineText">عَدْل</span> (<em>ʿadl</em>) — as one of the foundational obligations of human civilisation. Allah says:</p>

<div dir="rtl" class="arabic-block" style="font-family:'Amiri',serif;font-size:1.3rem;line-height:2.2;text-align:right;margin:1.5rem 0;padding:1rem 1.5rem;border-right:4px solid #b45309;">
إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ وَإِيتَاءِ ذِي الْقُرْبَىٰ وَيَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ وَالْبَغْيِ ۚ يَعِظُكُمْ لَعَلَّكُمْ تَذَكَّرُونَ
</div>

<p><em>"Indeed, Allah commands justice, the doing of good, and giving to relatives, and He forbids immorality, bad conduct, and oppression. He admonishes you that perhaps you will be reminded."</em><a href="#fn1" class="FootNoteLink"><sup>1</sup></a> (16:90)</p>

<p>The term <span class="ArabicInLineText">عَدْل</span> in Arabic carries a range of meanings: balance, equity, proportion, and the restoration of what has been disrupted. Classical lexicographers such as Ibn Fāris note that the root <span class="ArabicInLineText">ع-د-ل</span> fundamentally denotes straightness and correspondence — a standard against which things are measured.<a href="#fn2" class="FootNoteLink"><sup>2</sup></a></p>

<h3>Justice as a Societal Obligation</h3>

<p>What distinguishes the Qur'anic conception of justice from many philosophical traditions is its grounding not merely in social contract or utility, but in divine command. The verse above pairs <span class="ArabicInLineText">عَدْل</span> with <span class="ArabicInLineText">إِحْسَان</span> — excellence and benevolence. This pairing is significant: justice is the minimum; <em>ihsan</em> is the aspiration. A society that achieves only formal justice without moral excellence remains incomplete in the Qur'anic vision.</p>

<p>The Prophet ﷺ reinforced this in a well-known hadith recorded by Imam Muslim:</p>

<div dir="rtl" class="arabic-block" style="font-family:'Amiri',serif;font-size:1.25rem;line-height:2.2;text-align:right;margin:1.5rem 0;padding:1rem 1.5rem;border-right:4px solid #b45309;">
انْصُرْ أَخَاكَ ظَالِمًا أَوْ مَظْلُومًا
</div>

<p><em>"Support your brother whether he is an oppressor or the one being oppressed."</em> When asked how one supports an oppressor, he replied: <em>"By preventing him from his oppression — that is your support of him."</em><a href="#fn3" class="FootNoteLink"><sup>3</sup></a></p>

<h3>Implications for Modern Governance</h3>

<p>Contemporary Muslim scholars have debated whether the Qur'anic model of justice mandates a specific political form. Ghamidi argues that the Qur'an is silent on institutional structures, leaving these to human wisdom and context, while insisting that whatever system is adopted must deliver substantive equity to all members of society — <span class="ArabicInLineText">مسلم وغير مسلم</span> (Muslim and non-Muslim alike).<a href="#fn4" class="FootNoteLink"><sup>4</sup></a></p>

<hr class="footnote-divider" style="margin-top:2.5rem;margin-bottom:1rem;border:none;border-top:1px solid #d1d5db;width:40%;">
<ol class="footnotes">
  <li id="fn1" class="FootNote">Al-Qur'an, Surah al-Nahl 16:90. All translations are the author's own unless otherwise stated.</li>
  <li id="fn2" class="FootNote">Ibn Fāris, <em>Maqāyīs al-Lughah</em>, entry: <span class="ArabicInLineText">عدل</span>.</li>
  <li id="fn3" class="FootNote">Sahih al-Bukhari, Kitab al-Mazalim, hadith no. 2443.</li>
  <li id="fn4" class="FootNote">Javed Ahmad Ghamidi, <em>Mizan</em> (Lahore: Al-Mawrid, 2008), pp. 412–415.</li>
</ol>
`.trim();

const articleBody2 = `
<p>The science of Hadith criticism — <span class="ArabicInLineText">عِلْمُ الرِّجَال</span> (<em>ʿilm al-rijāl</em>) and <span class="ArabicInLineText">عِلْمُ الدِّرَايَة</span> (<em>ʿilm al-dirāyah</em>) — represents one of the most sophisticated intellectual achievements of the Islamic tradition. No other pre-modern civilisation developed a comparably rigorous apparatus for evaluating the authenticity of attributed speech.</p>

<h3>The Two Pillars of Hadith Evaluation</h3>

<p>Classical scholars evaluated a hadith along two axes:</p>

<ul>
  <li><strong><span class="ArabicInLineText">السَّنَد</span> (isnād / chain of transmission)</strong> — Who reported this, from whom, through what chain?</li>
  <li><strong><span class="ArabicInLineText">الْمَتْن</span> (matn / text)</strong> — Is the content of the report internally consistent, linguistically sound, and free of <span class="ArabicInLineText">شُذُوذ</span> (anomaly) or <span class="ArabicInLineText">عِلَّة</span> (hidden defect)?</li>
</ul>

<p>Imam al-Shāfi'ī articulated the foundational principle that a report from the Prophet ﷺ constitutes a binding proof in religion, provided its chain is established as authentic — a position that generated centuries of productive scholarly debate.<a href="#fn1" class="FootNoteLink"><sup>1</sup></a></p>

<h3>The Critique of Isnad-Centrism</h3>

<p>Modern scholars — most notably Ignaz Goldziher and later Joseph Schacht — argued that the isnād system was itself susceptible to fabrication, and that the chains of transmission were often projected backward to give spurious reports the veneer of prophetic authority. While Muslim scholars have mounted compelling rebuttals to the most extreme versions of this thesis, the critique has prompted a valuable internal conversation.<a href="#fn2" class="FootNoteLink"><sup>2</sup></a></p>

<p>Amin Ahsan Islahi and his student Ghamidi have argued from within the tradition that <span class="ArabicInLineText">مَتْن</span>-criticism must be given greater weight: a hadith whose text contradicts the Qur'an, established Sunnah, or sound reason cannot be accepted regardless of the strength of its isnād. The Prophet ﷺ himself is reported to have said:</p>

<div dir="rtl" class="arabic-block" style="font-family:'Amiri',serif;font-size:1.25rem;line-height:2.2;text-align:right;margin:1.5rem 0;padding:1rem 1.5rem;border-right:4px solid #b45309;">
إِذَا رُوِيَ لَكُمْ عَنِّي حَدِيثٌ فَاعْرِضُوهُ عَلَى كِتَابِ اللَّهِ فَإِنْ وَافَقَهُ فَأَنَا قُلْتُهُ وَإِنْ خَالَفَهُ فَلَمْ أَقُلْهُ
</div>

<p><em>"If a hadith is narrated to you from me, then compare it to the Book of Allah: if it agrees with it, I said it; if it contradicts it, I did not say it."</em><a href="#fn3" class="FootNoteLink"><sup>3</sup></a></p>

<hr class="footnote-divider" style="margin-top:2.5rem;margin-bottom:1rem;border:none;border-top:1px solid #d1d5db;width:40%;">
<ol class="footnotes">
  <li id="fn1" class="FootNote">Al-Shāfi'ī, <em>al-Risālah</em>, ed. Ahmad Shakir (Cairo, 1940), §§ 370–390.</li>
  <li id="fn2" class="FootNote">For a rigorous rebuttal see M. M. Azami, <em>On Schacht's Origins of Muhammadan Jurisprudence</em> (Riyadh: King Saud University, 1985).</li>
  <li id="fn3" class="FootNote">This report is classified as <span class="ArabicInLineText">ضعيف</span> (weak) by most hadith specialists, but the principle it encapsulates finds support in the authenticated traditions of the Prophet ﷺ.</li>
</ol>
`.trim();

const articleBody3 = `
<p>The word <span class="ArabicInLineText">صَلَاة</span> appears in the Qur'an in two distinct but related senses: as a general orientation of the heart toward God, and as the specific ritual prayer — the five daily prayers that constitute one of the five pillars of Islam. Understanding this distinction helps us grasp both the letter and the spirit of the obligation.</p>

<p>Allah says in Surah al-Baqarah:</p>

<div dir="rtl" class="arabic-block" style="font-family:'Amiri',serif;font-size:1.3rem;line-height:2.2;text-align:right;margin:1.5rem 0;padding:1rem 1.5rem;border-right:4px solid #b45309;">
حَافِظُوا عَلَى الصَّلَوَاتِ وَالصَّلَاةِ الْوُسْطَىٰ وَقُومُوا لِلَّهِ قَانِتِينَ
</div>

<p><em>"Maintain with care the [obligatory] prayers and [in particular] the middle prayer, and stand before Allah devoutly obedient."</em> (2:238)</p>

<p>The phrase <span class="ArabicInLineText">قُومُوا لِلَّهِ قَانِتِينَ</span> — "stand before Allah in a state of devout attention" — captures the interior dimension of prayer that formal performance alone cannot supply. The great commentator Fakhr al-Dīn al-Rāzī observed that <span class="ArabicInLineText">قُنُوت</span> here denotes sustained humility and inner presence, without which the physical acts of prayer become an empty ritual.<a href="#fn1" class="FootNoteLink"><sup>1</sup></a></p>

<h3>Prayer in the Age of Distraction</h3>

<p>The modern challenge is not primarily theological but attentional. Neuroscientists describe the contemporary mind as subject to <span class="EnglishQuote">"continuous partial attention"</span> — a state of perpetual, shallow alertness driven by digital stimulation. The Qur'anic prescription for prayer — its fixed times, its bodily postures, its demand for linguistic precision — functions as a structured interruption of this state, a mandatory return to presence.</p>

<p>The Prophet ﷺ described the optimal state of prayer as <span class="ArabicInLineText">إِحْسَان</span>: <em>"to worship Allah as though you see Him, and though you do not see Him, He certainly sees you."</em><a href="#fn2" class="FootNoteLink"><sup>2</sup></a> This is not an aspirational ideal but the baseline the tradition sets.</p>

<hr class="footnote-divider" style="margin-top:2.5rem;margin-bottom:1rem;border:none;border-top:1px solid #d1d5db;width:40%;">
<ol class="footnotes">
  <li id="fn1" class="FootNote">Fakhr al-Dīn al-Rāzī, <em>Mafātīḥ al-Ghayb</em> (Beirut: Dār Iḥyā' al-Turāth al-ʿArabī, 1420 AH), vol. 6, p. 449.</li>
  <li id="fn2" class="FootNote">Sahih Muslim, Kitab al-Iman, Hadith no. 8 (the Hadith of Jibril ؑ).</li>
</ol>
`.trim();

const articleBody4 = `
<p>The concept of <span class="ArabicInLineText">اجْتِهَاد</span> (<em>ijtihād</em>) — independent legal reasoning in matters not explicitly settled by the Qur'an and authenticated Sunnah — has been central to the dynamism of Islamic jurisprudence throughout history. The classical formula held that ijtihād was a collective obligation (<span class="ArabicInLineText">فَرْضُ كِفَايَة</span>): so long as qualified scholars practised it, the wider community was absolved.</p>

<h3>The Gate of Ijtihad: Open or Closed?</h3>

<p>The popular claim that <span class="ArabicInLineText">بَابُ الاجْتِهَاد</span> — the gate of ijtihād — was closed sometime in the fourth Islamic century has been challenged by modern scholarship. Wael Hallaq's landmark study demonstrated that the alleged closure was a later scholarly myth: ijtihād continued in practice under different names and institutional forms.<a href="#fn1" class="FootNoteLink"><sup>1</sup></a></p>

<p>The more pressing contemporary question is not whether ijtihād is permissible, but who is qualified to exercise it and within what hermeneutical framework. The Qur'an itself provides only general moral and legal principles; it does not codify a complete legal system. Allah says:</p>

<div dir="rtl" class="arabic-block" style="font-family:'Amiri',serif;font-size:1.3rem;line-height:2.2;text-align:right;margin:1.5rem 0;padding:1rem 1.5rem;border-right:4px solid #b45309;">
وَأَنزَلْنَا إِلَيْكَ الذِّكْرَ لِتُبَيِّنَ لِلنَّاسِ مَا نُزِّلَ إِلَيْهِمْ وَلَعَلَّهُمْ يَتَفَكَّرُونَ
</div>

<p><em>"And We revealed to you the message that you may make clear to the people what was sent down to them, and that they might reflect."</em> (16:44)</p>

<p>The operative word is <span class="ArabicInLineText">يَتَفَكَّرُونَ</span> — that they might reflect. Reflection, reason, and contextual judgment are not supplements to revelation but are invited by it. Ghamidi's framework identifies three tiers of Islamic law: Qur'anic injunctions (absolutely binding), prophetic Sunnah (binding as established practice), and fiqh (scholarly opinion, revisable in light of changed circumstances).<a href="#fn2" class="FootNoteLink"><sup>2</sup></a></p>

<hr class="footnote-divider" style="margin-top:2.5rem;margin-bottom:1rem;border:none;border-top:1px solid #d1d5db;width:40%;">
<ol class="footnotes">
  <li id="fn1" class="FootNote">Wael B. Hallaq, "Was the Gate of Ijtihad Closed?", <em>International Journal of Middle East Studies</em> 16, no. 1 (1984): 3–41.</li>
  <li id="fn2" class="FootNote">Javed Ahmad Ghamidi, <em>Mizan</em>, pp. 7–18.</li>
</ol>
`.trim();

const articleBody5 = `
<p>Among the most debated questions in Islamic intellectual history is the role of reason (<span class="ArabicInLineText">عَقْل</span>) in relation to revelation (<span class="ArabicInLineText">نَقْل</span>). The classical schools staked out positions ranging from the Mu'tazilite conviction that reason is the primary criterion of religious truth, to the Ash'arite compromise that reason validates the fact of revelation but cannot independently determine religious obligations.</p>

<h3>Qur'an's Own Testimony</h3>

<p>What is often overlooked in this debate is the Qur'an's own self-presentation. It repeatedly invites its reader to reason (<span class="ArabicInLineText">أَفَلَا تَعْقِلُونَ</span> — "will you not reason?"), to observe the natural world as a sign (<span class="ArabicInLineText">آيَة</span>), and to reflect on history. It does not present itself as a substitute for reason but as a guide that orients and elevates it.</p>

<div dir="rtl" class="arabic-block" style="font-family:'Amiri',serif;font-size:1.3rem;line-height:2.2;text-align:right;margin:1.5rem 0;padding:1rem 1.5rem;border-right:4px solid #b45309;">
إِنَّ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ وَاخْتِلَافِ اللَّيْلِ وَالنَّهَارِ لَآيَاتٍ لِّأُولِي الْأَلْبَابِ
</div>

<p><em>"Indeed, in the creation of the heavens and the earth and the alternation of the night and the day are signs for those of understanding."</em> (3:190)</p>

<p>The phrase <span class="ArabicInLineText">أُولِي الْأَلْبَابِ</span> — "people of sound intellect" — occurs seventeen times in the Qur'an. It is the Qur'an's preferred designation for its ideal reader: one who combines attentive observation of the world with reflective self-examination.</p>

<hr class="footnote-divider" style="margin-top:2.5rem;margin-bottom:1rem;border:none;border-top:1px solid #d1d5db;width:40%;">
<ol class="footnotes">
  <li id="fn1" class="FootNote">For a comprehensive account see Majid Fakhry, <em>A History of Islamic Philosophy</em>, 3rd ed. (New York: Columbia University Press, 2004), chs. 3–5.</li>
</ol>
`.trim();

const queryBody1 = `
<p><strong>Question:</strong> A reader asks whether celebrating birthdays has any basis in Islam, or whether it constitutes an impermissible innovation (<span class="ArabicInLineText">بِدْعَة</span>).</p>

<p><strong>Answer:</strong> The concept of <span class="ArabicInLineText">بِدْعَة</span> — religious innovation — applies specifically to acts of worship introduced into the religion without divine sanction. The Prophet ﷺ warned:</p>

<div dir="rtl" class="arabic-block" style="font-family:'Amiri',serif;font-size:1.25rem;line-height:2.2;text-align:right;margin:1.5rem 0;padding:1rem 1.5rem;border-right:4px solid #b45309;">
وَإِيَّاكُمْ وَمُحْدَثَاتِ الْأُمُورِ فَإِنَّ كُلَّ مُحْدَثَةٍ بِدْعَةٌ وَكُلَّ بِدْعَةٍ ضَلَالَةٌ
</div>

<p><em>"Beware of newly invented matters, for every newly invented matter is an innovation, and every innovation is misguidance."</em><a href="#fn1" class="FootNoteLink"><sup>1</sup></a></p>

<p>However, birthday celebrations are not acts of worship — they are social customs (<span class="ArabicInLineText">عَادَات</span>). In matters of social custom, the default ruling in Islamic jurisprudence is permissibility (<span class="ArabicInLineText">الأَصْلُ فِي الْأَشْيَاءِ الإِبَاحَة</span>), unless a specific prohibition exists. No such prohibition exists for birthday commemorations per se. What may become impermissible are specific elements within a celebration — music with lewd content, mixed gatherings involving prohibited acts, excessive extravagance — not the act of marking the passing of a year.</p>

<p>The obligation remains to exercise moderation and to ensure that any celebration upholds the dignity and values Islam enjoins.</p>

<hr class="footnote-divider" style="margin-top:2.5rem;margin-bottom:1rem;border:none;border-top:1px solid #d1d5db;width:40%;">
<ol class="footnotes">
  <li id="fn1" class="FootNote">Sunan Abi Dawud, Kitab al-Sunnah, Hadith no. 4607; graded sahih.</li>
</ol>
`.trim();

const queryBody2 = `
<p><strong>Question:</strong> A reader asks whether there is a basis in the Qur'an or Sunnah for the prohibition on music, and whether all forms of music are equally restricted.</p>

<p><strong>Answer:</strong> The classical position, represented by the majority of Hanafi, Shafi'i, and Hanbali jurists, is that instrumental music is generally prohibited. They cite the verse:</p>

<div dir="rtl" class="arabic-block" style="font-family:'Amiri',serif;font-size:1.25rem;line-height:2.2;text-align:right;margin:1.5rem 0;padding:1rem 1.5rem;border-right:4px solid #b45309;">
وَمِنَ النَّاسِ مَن يَشْتَرِي لَهْوَ الْحَدِيثِ لِيُضِلَّ عَن سَبِيلِ اللَّهِ
</div>

<p><em>"And of the people is he who buys the amusement of speech to mislead [others] from the way of Allah."</em> (31:6)</p>

<p>Many commentators, including Ibn Mas'ud and later Ibn al-Qayyim, interpreted <span class="ArabicInLineText">لَهْوَ الْحَدِيثِ</span> ("amusement of speech") as a reference to music and song. However, this interpretation is not unanimous. Ibn Hazm, for instance, rejected it as unsupported by the text.</p>

<p>A nuanced position holds that the prohibition targets music that is lewdly purposed, that incites to sin, or that becomes a barrier to religious obligation — not music as an aesthetic form in itself. The <span class="ArabicInLineText">دُف</span> (frame drum) was explicitly permitted at celebrations by the Prophet ﷺ.<a href="#fn1" class="FootNoteLink"><sup>1</sup></a> The question is therefore one of context, content, and effect rather than absolute prohibition of all musical sound.</p>

<hr class="footnote-divider" style="margin-top:2.5rem;margin-bottom:1rem;border:none;border-top:1px solid #d1d5db;width:40%;">
<ol class="footnotes">
  <li id="fn1" class="FootNote">Sahih al-Bukhari, Kitab al-Nikah, Hadith no. 5147.</li>
</ol>
`.trim();

const queryBody3 = `
<p><strong>Question:</strong> Is it permissible for a woman to lead the Friday congregational prayer (<span class="ArabicInLineText">صَلَاةُ الجُمُعَة</span>) for a mixed congregation?</p>

<p><strong>Answer:</strong> The overwhelming scholarly consensus (<span class="ArabicInLineText">إِجْمَاع</span>) throughout Islamic history has held that the Friday prayer must be led by a male imam when the congregation includes men. This position rests on several foundations:</p>

<p>First, the Prophet ﷺ and all four rightly-guided caliphs led congregational prayers exclusively, and the practice of the earliest Muslim communities was uniformly consistent on this point. Second, the Sunnah establishes the imam's role in relation to a general community, and the community in the early period invariably comprised men as the primary recipients of this obligation — Friday prayer is not individually obligatory upon women in the first place.</p>

<p>A minority contemporary view, advanced by scholars such as Amina Wadud, holds that no explicit Qur'anic text prohibits women leading mixed congregations, and that the historical practice reflects cultural context rather than divine command. This view remains a clear minority position and has not found acceptance in any mainstream school of Islamic jurisprudence.</p>

<p>The more practically significant question — whether women may lead other women in prayer — is resolved by explicit hadith: <span class="ArabicInLineText">تَؤُمُّ الْمَرْأَةُ الْمَرْأَةَ</span> — "a woman may lead women."<a href="#fn1" class="FootNoteLink"><sup>1</sup></a></p>

<hr class="footnote-divider" style="margin-top:2.5rem;margin-bottom:1rem;border:none;border-top:1px solid #d1d5db;width:40%;">
<ol class="footnotes">
  <li id="fn1" class="FootNote">Sunan Abi Dawud, Kitab al-Salah, Hadith no. 591; Ibn Majah, Kitab Iqamat al-Salah, Hadith no. 1134.</li>
</ol>
`.trim();

const sampleArticles: Article[] = [
  {
    id: "1",
    title: "The Concept of Justice in the Qur'an",
    slug: "concept-of-justice-in-the-quran",
    excerpt:
      "An exploration of the Qur'anic framework for justice — how ʿadl and iḥsān together define a moral order that extends beyond formal equity to encompass genuine benevolence and social responsibility.",
    bodyHtml: articleBody1,
    writer: sampleWriters[1],
    topic: sampleTopics[0],
    issue: sampleIssue,
    type: "article",
    createdAt: "2026-03-01",
    readingTime: 12,
  },
  {
    id: "2",
    title: "Understanding Hadith Methodology: Isnād and Matn Criticism",
    slug: "understanding-hadith-methodology",
    excerpt:
      "A systematic overview of the twin pillars of hadith evaluation — chain criticism and textual criticism — and how modern scholarship has renewed the case for matn-centred analysis.",
    bodyHtml: articleBody2,
    writer: sampleWriters[0],
    topic: sampleTopics[1],
    issue: sampleIssue,
    type: "article",
    createdAt: "2026-03-05",
    readingTime: 10,
  },
  {
    id: "3",
    title: "Prayer in the Modern World: Presence in an Age of Distraction",
    slug: "prayer-in-the-modern-world",
    excerpt:
      "The Qur'anic prescription for ṣalāh — its fixed times, bodily postures, and demand for inner presence — as a structured counterweight to the perpetual, shallow alertness of the digital age.",
    bodyHtml: articleBody3,
    writer: sampleWriters[2],
    topic: sampleTopics[5],
    issue: sampleIssue,
    type: "article",
    createdAt: "2026-03-10",
    readingTime: 7,
  },
  {
    id: "4",
    title: "The Role of Ijtihad in Contemporary Fiqh",
    slug: "role-of-ijtihad-in-contemporary-fiqh",
    excerpt:
      "Is the gate of ijtihād truly closed? An examination of the historical myth, the continuing practice of independent legal reasoning, and its urgency for Muslim communities navigating new realities.",
    bodyHtml: articleBody4,
    writer: sampleWriters[1],
    topic: sampleTopics[2],
    issue: sampleIssue,
    type: "article",
    createdAt: "2026-03-15",
    readingTime: 11,
  },
  {
    id: "5",
    title: "Reason and Revelation: Companions, Not Rivals",
    slug: "reason-and-revelation",
    excerpt:
      "The Qur'an's invitation to reason — ʿaql — is not a supplement to revelation but intrinsic to it. A rereading of the ulū al-albāb passages and their implications for Islamic intellectual culture.",
    bodyHtml: articleBody5,
    writer: sampleWriters[0],
    topic: sampleTopics[5],
    issue: sampleIssue2,
    type: "article",
    createdAt: "2026-02-08",
    readingTime: 9,
  },
  {
    id: "6",
    title: "The Ethics of Disagreement in Classical Islam",
    slug: "ethics-of-disagreement-in-classical-islam",
    excerpt:
      "How the greatest scholars of the tradition — Mālik, al-Shāfiʿī, Ahmad ibn Hanbal — navigated profound intellectual differences with grace, and what their example demands of us today.",
    bodyHtml: articleBody1,
    writer: sampleWriters[3],
    topic: sampleTopics[3],
    issue: sampleIssue2,
    type: "article",
    createdAt: "2026-02-14",
    readingTime: 8,
  },
  {
    id: "7",
    title: "The Prophet ﷺ as a Model of Moral Excellence",
    slug: "the-prophet-as-model-of-moral-excellence",
    excerpt:
      "The Qur'an describes the Prophet ﷺ as possessing an exalted character (68:4). What does this mean for Muslims today, and how does the Sirah translate into practical moral formation?",
    bodyHtml: articleBody3,
    writer: sampleWriters[1],
    topic: sampleTopics[4],
    issue: sampleIssue3,
    type: "article",
    createdAt: "2026-01-06",
    readingTime: 13,
  },
];

const sampleQueries: Article[] = [
  {
    id: "q1",
    title: "Is Celebrating Birthdays Permissible?",
    slug: "is-celebrating-birthdays-permissible",
    excerpt:
      "A reader asks about the Islamic perspective on birthday celebrations. Are they an impermissible bidʿah, or do they fall within the permitted sphere of social custom?",
    bodyHtml: queryBody1,
    writer: sampleWriters[0],
    topic: sampleTopics[3],
    issue: sampleIssue,
    type: "query",
    createdAt: "2026-03-08",
    readingTime: 4,
  },
  {
    id: "q2",
    title: "The Islamic Position on Music",
    slug: "islamic-position-on-music",
    excerpt:
      "Is all music prohibited in Islam, or does the prohibition target only music that leads to sin? An examination of the classical texts and a nuanced contemporary reading.",
    bodyHtml: queryBody2,
    writer: sampleWriters[1],
    topic: sampleTopics[6],
    issue: sampleIssue,
    type: "query",
    createdAt: "2026-03-11",
    readingTime: 5,
  },
  {
    id: "q3",
    title: "Can Women Lead Congregational Prayer?",
    slug: "can-women-lead-congregational-prayer",
    excerpt:
      "A question about the scholarly positions on women leading mixed and single-sex congregational prayers, with a review of the relevant hadith and the limits of scholarly consensus.",
    bodyHtml: queryBody3,
    writer: sampleWriters[0],
    topic: sampleTopics[7],
    issue: sampleIssue2,
    type: "query",
    createdAt: "2026-02-19",
    readingTime: 6,
  },
];

const sampleEbooks: EBook[] = [
  {
    id: "1",
    title: "Mizan: An Introduction",
    author: "Javed Ahmad Ghamidi",
    description:
      "A distillation of Ghamidi's monumental work Mizan, presenting his comprehensive explication of Islam — its beliefs, worship, ethics, and law — in accessible English.",
    coverUrl: "/ebooks/placeholder-cover.jpg",
    fileUrl: "#",
  },
  {
    id: "2",
    title: "The Sources of Islam",
    author: "Javed Ahmad Ghamidi",
    translator: "Shehzad Saleem",
    description:
      "An examination of the Qur'an and Sunnah as the twin sources of Islamic guidance, with a detailed account of how each is to be understood and applied.",
    coverUrl: "/ebooks/placeholder-cover.jpg",
    fileUrl: "#",
  },
  {
    id: "3",
    title: "Renaissance Essays on Islamic Law",
    author: "Shehzad Saleem",
    description:
      "A collection of essays from the pages of Renaissance addressing key questions in Islamic jurisprudence — from the scope of ijtihad to the ethics of civil disobedience.",
    coverUrl: "/ebooks/placeholder-cover.jpg",
    fileUrl: "#",
  },
];

export const sample = {
  latestIssue: sampleIssue,
  featuredArticle: sampleArticles[0],
  recentArticles: sampleArticles.slice(1, 5),
  latestQueries: sampleQueries,
  featuredWriters: sampleWriters,
  featuredTopics: sampleTopics.slice(0, 6),
  allIssues: [sampleIssue, sampleIssue2, sampleIssue3],
  allArticleSlugs: sampleArticles.map((a) => a.slug),
  allIssueSlugs: [sampleIssue.id, sampleIssue2.id, sampleIssue3.id],
  allWriters: sampleWriters,
  allWriterSlugs: sampleWriters.map((w) => w.slug),
  allTopics: sampleTopics,
  allTopicSlugs: sampleTopics.map((t) => t.slug),
  allEbooks: sampleEbooks,
  queryWriters: [sampleWriters[0], sampleWriters[1]],
  queryTopics: sampleTopics.slice(6).map((t) => ({ ...t, type: "query" as const })),
  getArticle: (slug: string) => sampleArticles.find((a) => a.slug === slug) ?? sampleArticles[0],
  getWriter: (slug: string) => sampleWriters.find((w) => w.slug === slug) ?? sampleWriters[0],
  getTopic: (slug: string) => sampleTopics.find((t) => t.slug === slug) ?? sampleTopics[0],
};
