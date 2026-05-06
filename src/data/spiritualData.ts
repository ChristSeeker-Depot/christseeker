

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
