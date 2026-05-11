export type LibraryItem = {
  title: string;
  author: string;
  url: string;
  category: string;
};

export type Category = {
  name: string;
  slug: string;
};

export const categories: Category[] = [
  { name: "Startups", slug: "startups" },
  { name: "AI & Technology", slug: "ai-technology" },
  { name: "Writing & Thinking", slug: "writing-thinking" },
  { name: "Wealth & Career", slug: "wealth-career" },
  { name: "Life & Philosophy", slug: "life-philosophy" },
];

export const libraryItems: LibraryItem[] = [
  // --- Startups ---
  { title: "How to Start Google", author: "Paul Graham", url: "https://www.paulgraham.com/google.html", category: "Startups" },
  { title: "Do Things that Don't Scale", author: "Paul Graham", url: "https://www.paulgraham.com/ds.html", category: "Startups" },
  { title: "Founder Mode", author: "Paul Graham", url: "https://www.paulgraham.com/foundermode.html", category: "Startups" },
  { title: "How to Get Startup Ideas", author: "Paul Graham", url: "https://www.paulgraham.com/startupideas.html", category: "Startups" },
  { title: "Startup = Growth", author: "Paul Graham", url: "https://www.paulgraham.com/growth.html", category: "Startups" },
  { title: "Before the Startup", author: "Paul Graham", url: "https://www.paulgraham.com/before.html", category: "Startups" },
  { title: "Default Alive or Default Dead?", author: "Paul Graham", url: "https://www.paulgraham.com/aord.html", category: "Startups" },
  { title: "How to Raise Money", author: "Paul Graham", url: "https://www.paulgraham.com/fr.html", category: "Startups" },
  { title: "Frighteningly Ambitious Startup Ideas", author: "Paul Graham", url: "https://www.paulgraham.com/ambitious.html", category: "Startups" },
  { title: "Relentlessly Resourceful", author: "Paul Graham", url: "https://www.paulgraham.com/relres.html", category: "Startups" },
  { title: "Maker's Schedule, Manager's Schedule", author: "Paul Graham", url: "https://www.paulgraham.com/makersschedule.html", category: "Startups" },
  { title: "Schlep Blindness", author: "Paul Graham", url: "https://www.paulgraham.com/schlep.html", category: "Startups" },
  { title: "The Airbnbs", author: "Paul Graham", url: "https://www.paulgraham.com/airbnbs.html", category: "Startups" },
  { title: "Startups in 13 Sentences", author: "Paul Graham", url: "https://www.paulgraham.com/13sentences.html", category: "Startups" },
  { title: "How to Be Successful", author: "Sam Altman", url: "https://blog.samaltman.com/how-to-be-successful", category: "Startups" },
  { title: "Startup Advice, Briefly", author: "Sam Altman", url: "https://blog.samaltman.com/startup-advice-briefly", category: "Startups" },
  { title: "Idea Generation", author: "Sam Altman", url: "https://blog.samaltman.com/idea-generation", category: "Startups" },
  { title: "Advice for Generalists", author: "NextPlay", url: "https://nextplayso.substack.com/p/advice-for-generalists", category: "Startups" },
  { title: "Better, Faster, Cheaper", author: "Initialized Capital", url: "https://medium.com/initialized-capital/better-faster-cheaper-cf510c1fc32", category: "Startups" },

  // --- AI & Technology ---
  { title: "Machines of Loving Grace", author: "Dario Amodei", url: "https://darioamodei.com/essay/machines-of-loving-grace", category: "AI & Technology" },
  { title: "The Adolescence of Technology", author: "Dario Amodei", url: "https://darioamodei.com/essay/the-adolescence-of-technology", category: "AI & Technology" },
  { title: "Superlinear Returns", author: "Paul Graham", url: "https://www.paulgraham.com/superlinear.html", category: "AI & Technology" },
  { title: "The Reddits", author: "Paul Graham", url: "https://www.paulgraham.com/reddits.html", category: "AI & Technology" },
  { title: "What Microsoft Is this the Altair Basic of?", author: "Paul Graham", url: "https://www.paulgraham.com/altair.html", category: "AI & Technology" },
  { title: "The Hardware Renaissance", author: "Paul Graham", url: "https://www.paulgraham.com/hw.html", category: "AI & Technology" },

  // --- Writing & Thinking ---
  { title: "How to Do Great Work", author: "Paul Graham", url: "https://www.paulgraham.com/greatwork.html", category: "Writing & Thinking" },
  { title: "How to Think for Yourself", author: "Paul Graham", url: "https://www.paulgraham.com/think.html", category: "Writing & Thinking" },
  { title: "Putting Ideas into Words", author: "Paul Graham", url: "https://www.paulgraham.com/words.html", category: "Writing & Thinking" },
  { title: "How to Write Usefully", author: "Paul Graham", url: "https://www.paulgraham.com/useful.html", category: "Writing & Thinking" },
  { title: "Write Simply", author: "Paul Graham", url: "https://www.paulgraham.com/simply.html", category: "Writing & Thinking" },
  { title: "The Best Essay", author: "Paul Graham", url: "https://www.paulgraham.com/best.html", category: "Writing & Thinking" },
  { title: "Writes and Write-Nots", author: "Paul Graham", url: "https://www.paulgraham.com/writes.html", category: "Writing & Thinking" },
  { title: "Good Writing", author: "Paul Graham", url: "https://www.paulgraham.com/goodwriting.html", category: "Writing & Thinking" },
  { title: "The Need to Read", author: "Paul Graham", url: "https://www.paulgraham.com/read.html", category: "Writing & Thinking" },
  { title: "How to Get New Ideas", author: "Paul Graham", url: "https://www.paulgraham.com/getideas.html", category: "Writing & Thinking" },
  { title: "Crazy New Ideas", author: "Paul Graham", url: "https://www.paulgraham.com/newideas.html", category: "Writing & Thinking" },

  // --- Wealth & Career ---
  { title: "How to Get Rich", author: "Naval Ravikant", url: "https://nav.al/rich", category: "Wealth & Career" },
  { title: "How People Get Rich Now", author: "Paul Graham", url: "https://www.paulgraham.com/richnow.html", category: "Wealth & Career" },
  { title: "How to Work Hard", author: "Paul Graham", url: "https://www.paulgraham.com/hwh.html", category: "Wealth & Career" },
  { title: "Economic Inequality", author: "Paul Graham", url: "https://www.paulgraham.com/ineq.html", category: "Wealth & Career" },
  { title: "What Doesn't Seem Like Work?", author: "Paul Graham", url: "https://www.paulgraham.com/work.html", category: "Wealth & Career" },
  { title: "When To Do What You Love", author: "Paul Graham", url: "https://www.paulgraham.com/when.html", category: "Wealth & Career" },
  { title: "The Days Are Long but the Decades Are Short", author: "Sam Altman", url: "https://blog.samaltman.com/the-days-are-long-but-the-decades-are-short", category: "Wealth & Career" },
  { title: "What I Wish Someone Had Told Me", author: "Sam Altman", url: "https://blog.samaltman.com/what-i-wish-someone-had-told-me", category: "Wealth & Career" },

  // --- Life & Philosophy ---
  { title: "Life is Short", author: "Paul Graham", url: "https://www.paulgraham.com/vb.html", category: "Life & Philosophy" },
  { title: "Having Kids", author: "Paul Graham", url: "https://www.paulgraham.com/kids.html", category: "Life & Philosophy" },
  { title: "The Bus Ticket Theory of Genius", author: "Paul Graham", url: "https://www.paulgraham.com/genius.html", category: "Life & Philosophy" },
  { title: "Keep Your Identity Small", author: "Paul Graham", url: "https://www.paulgraham.com/identity.html", category: "Life & Philosophy" },
  { title: "What I Worked On", author: "Paul Graham", url: "https://www.paulgraham.com/worked.html", category: "Life & Philosophy" },
  { title: "Is There Such a Thing as Good Taste?", author: "Paul Graham", url: "https://www.paulgraham.com/goodtaste.html", category: "Life & Philosophy" },
  { title: "The Right Kind of Stubborn", author: "Paul Graham", url: "https://www.paulgraham.com/persistence.html", category: "Life & Philosophy" },
  { title: "How to Lose Time and Money", author: "Paul Graham", url: "https://www.paulgraham.com/selfindulgence.html", category: "Life & Philosophy" },
  { title: "Cities and Ambition", author: "Paul Graham", url: "https://www.paulgraham.com/cities.html", category: "Life & Philosophy" },
  { title: "Earnestness", author: "Paul Graham", url: "https://www.paulgraham.com/earnest.html", category: "Life & Philosophy" },
];
