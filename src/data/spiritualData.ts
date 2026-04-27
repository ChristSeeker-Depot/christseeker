export const VERSES = [
  { 
    text: "Be still, and know that I am God.", 
    reference: "Psalm 46:10",
    reflection: "In a world of constant noise and anxious striving, God commands us to stop fighting. 'Be still' translates from a word meaning 'to let go' or 'drop your weapons'. It is an invitation to surrender our frantic efforts and rest in His sovereign power."
  },
  { 
    text: "Come to me, all who labor and are heavy laden, and I will give you rest.", 
    reference: "Matthew 11:28",
    reflection: "Jesus does not demand that we fix ourselves before approaching Him. The invitation is explicitly for the exhausted and the burdened. The 'rest' He offers is a deep, soul-level peace found only in His grace."
  },
  { 
    text: "The Lord is my shepherd; I shall not want.", 
    reference: "Psalm 23:1",
    reflection: "A shepherd provides, protects, and guides. To say 'I shall not want' does not mean we will have everything we desire, but rather that we have everything we truly need in the presence of the Shepherd."
  },
  { 
    text: "For God gave us a spirit not of fear but of power and love and self-control.", 
    reference: "2 Timothy 1:7",
    reflection: "Fear paralyzes, but the Holy Spirit empowers. When you feel overwhelmed by anxiety or timidity, remember that your spiritual DNA is characterized by divine power, selfless love, and disciplined clarity."
  },
  { 
    text: "Cast all your anxiety on him because he cares for you.", 
    reference: "1 Peter 5:7",
    reflection: "The word 'cast' implies throwing something forcefully away from yourself. God invites us to hurl our worries onto His shoulders. Why? Simply because He cares deeply and intimately for you."
  },
  { 
    text: "I can do all things through him who strengthens me.", 
    reference: "Philippians 4:13",
    reflection: "Often taken out of context to mean personal ambition, Paul actually wrote this from prison. It means that whether in poverty or wealth, sickness or health, Christ provides the exact strength needed to endure and remain faithful."
  },
  { 
    text: "Trust in the Lord with all your heart, and do not lean on your own understanding.", 
    reference: "Proverbs 3:5",
    reflection: "Human logic is limited by our perspective. Trusting God requires a surrender of our need to figure everything out. It is choosing to rest the full weight of our confidence on His character, even when the path is obscured."
  }
];

export const SONGS = [
  { 
    title: "10,000 Reasons (Bless the Lord)", 
    artist: "Matt Redman",
    theme: "Adoration & Thanksgiving",
    lyrics: "The sun comes up, it's a new day dawning / It's time to sing Your song again / Whatever may pass, and whatever lies before me / Let me be singing when the evening comes."
  },
  { 
    title: "In Christ Alone", 
    artist: "Stuart Townend & Keith Getty",
    theme: "The Gospel & Assurance",
    lyrics: "In Christ alone my hope is found / He is my light, my strength, my song / This Cornerstone, this solid Ground / Firm through the fiercest drought and storm."
  },
  { 
    title: "Amazing Grace (My Chains Are Gone)", 
    artist: "Chris Tomlin",
    theme: "Grace & Redemption",
    lyrics: "My chains are gone, I've been set free / My God, my Savior has ransomed me / And like a flood His mercy rains / Unending love, amazing grace."
  },
  { 
    title: "Here I Am to Worship", 
    artist: "Tim Hughes",
    theme: "Surrender & Awe",
    lyrics: "Here I am to worship, here I am to bow down / Here I am to say that You're my God / You're altogether lovely, altogether worthy / Altogether wonderful to me."
  },
  { 
    title: "Be Thou My Vision", 
    artist: "Traditional Hymn",
    theme: "Focus & Guidance",
    lyrics: "Be Thou my vision, O Lord of my heart / Naught be all else to me, save that Thou art / Thou my best thought, by day or by night / Waking or sleeping, Thy presence my light."
  },
  { 
    title: "Shine Jesus Shine", 
    artist: "Graham Kendrick",
    theme: "Revival & Light",
    lyrics: "Lord, the light of Your love is shining / In the midst of the darkness, shining / Jesus, Light of the world, shine upon us / Set us free by the truth You now bring us."
  },
  { 
    title: "Build My Life", 
    artist: "Housefires",
    theme: "Commitment & Foundation",
    lyrics: "And I will build my life upon Your love / It is a firm foundation / And I will put my trust in You alone / And I will not be shaken."
  }
];

export const PRAYER_GUIDES: Record<string, { title: string; text: string }[]> = {
  'Anglican': [
    { title: "Morning Prayer", text: "O Lord, open our lips, and our mouth shall proclaim your praise. Let your ways be known upon earth, your saving power among the nations." },
    { title: "Evening Prayer", text: "Lighten our darkness, we beseech thee, O Lord; and by thy great mercy defend us from all perils and dangers of this night; for the love of thy only Son, our Saviour Jesus Christ." },
    { title: "The Collect for Purity", text: "Almighty God, to whom all hearts are open, all desires known, and from whom no secrets are hidden: cleanse the thoughts of our hearts by the inspiration of your Holy Spirit." }
  ],
  'Catholic': [
    { title: "The Rosary", text: "Reflect on the mysteries of salvation. Begin with the Apostles' Creed, Our Father, and Hail Marys, meditating deeply on the life of Christ." },
    { title: "The Angelus", text: "The Angel of the Lord declared unto Mary. And she conceived of the Holy Spirit. Pray this traditional devotion focusing on the Incarnation." },
    { title: "Prayer of St. Francis", text: "Lord, make me an instrument of your peace. Where there is hatred, let me sow love; where there is injury, pardon; where there is doubt, faith." }
  ],
  'Baptist': [
    { title: "Extemporaneous Praise", text: "Take time to thank God for His specific graces today. Speak from the heart, lifting up the things you are grateful for." },
    { title: "Intercession for the Lost", text: "Pray fervently for friends and family who do not know Christ. Ask the Holy Spirit to open their eyes to the Gospel." },
    { title: "Prayer for the Church", text: "Pray for your local pastor, the elders, and the congregation. Ask God to unify the body and empower it for local mission." }
  ],
  'Reformed': [
    { title: "Prayer of Confession", text: "Acknowledge God's sovereign holiness. Confess your specific sins, resting in the absolute assurance of pardon through Christ's finished work." },
    { title: "Prayer of Illumination", text: "Before reading the Word, pray that the Holy Spirit would open your eyes to behold wondrous things out of God's Law." },
    { title: "The Lord's Prayer (Pattern)", text: "Use the Lord's prayer as a framework: Adore God's name, submit to His kingdom, ask for provision, seek forgiveness, and pray for deliverance." }
  ],
  'Pentecostal': [
    { title: "Spirit-led Intercession", text: "Yield to the Holy Spirit. Pray in the Spirit and with understanding, seeking God's miraculous power, healing, and manifest presence." },
    { title: "Warfare Prayer", text: "Put on the full armor of God. Pray actively against spiritual strongholds in your life, your family, and your city, claiming the victory of Jesus." },
    { title: "Prayer for Spiritual Gifts", text: "Ask the Father to pour out His Spirit afresh. Pray for an increase in the gifts of prophecy, healing, and faith for the edification of the church." }
  ],
  'Orthodox': [
    { title: "The Jesus Prayer", text: "Lord Jesus Christ, Son of God, have mercy on me, a sinner. Repeat this slowly, coordinating it with the rhythm of your breath." },
    { title: "Morning Trisagion Prayers", text: "Holy God, Holy Mighty, Holy Immortal, have mercy on us. Pray this ancient hymn, acknowledging the Trinity." },
    { title: "Prayer of St. Ephrem", text: "O Lord and Master of my life, take from me the spirit of sloth, despair, lust of power, and idle talk. But give rather the spirit of chastity, humility, patience, and love." }
  ],
  'Non-Denominational': [
    { title: "A.C.T.S. Method", text: "Adoration, Confession, Thanksgiving, and Supplication. Spend 5 minutes in each specific area as you converse with God." },
    { title: "Praying the Psalms", text: "Open to a Psalm (e.g., Psalm 27 or 51) and read it aloud, turning the verses into your own personal prayer to God." },
    { title: "Silent Listening", text: "Spend 10 minutes in complete silence. Do not ask for anything. Simply sit in God's presence and listen for the gentle whisper of the Holy Spirit." }
  ]
};

// Helper to get consistent daily index based on Europe/London
export function getDailyIndex(arrayLength: number): number {
  const options: Intl.DateTimeFormatOptions = { timeZone: 'Europe/London', year: 'numeric', month: 'numeric', day: 'numeric' };
  const formatter = new Intl.DateTimeFormat('en-GB', options);
  const dateParts = formatter.formatToParts(new Date());
  
  let day = 1, month = 1, year = 2024;
  for (const part of dateParts) {
    if (part.type === 'day') day = parseInt(part.value, 10);
    if (part.type === 'month') month = parseInt(part.value, 10);
    if (part.type === 'year') year = parseInt(part.value, 10);
  }
  
  const seed = year * 10000 + month * 100 + day;
  return seed % arrayLength;
}
