import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreedClause {
  text: string;
  scripture: string;
  note?: string;
}

interface Creed {
  id: string;
  title: string;
  date: string;
  intro: string;
  clauses: CreedClause[];
}

const CREEDS: Creed[] = [
  {
    id: 'apostles',
    title: "Apostles' Creed",
    date: 'c. 2nd Century',
    intro: 'The oldest summary of the Christian faith, used in baptism and worship since the early church.',
    clauses: [
      {
        text: 'I believe in God, the Father Almighty, Creator of heaven and earth.',
        scripture: 'Genesis 1:1; Matthew 6:9',
        note: "Affirms monotheism and God's sovereign creative power over all reality.",
      },
      {
        text: 'And in Jesus Christ, His only Son, our Lord,',
        scripture: 'John 3:16; Acts 2:36',
        note: '"Lord" (Kyrios) is the Greek equivalent of the Hebrew YHWH -- a confession of Christ\'s full divinity.',
      },
      {
        text: 'who was conceived by the Holy Spirit and born of the Virgin Mary,',
        scripture: 'Luke 1:35; Matthew 1:23',
        note: 'The Incarnation: God became fully human without ceasing to be fully God.',
      },
      {
        text: 'suffered under Pontius Pilate, was crucified, died, and was buried.',
        scripture: '1 Corinthians 15:3-4; Luke 23:46',
        note: 'The historical specificity guards against docetism -- Christ truly suffered, truly died.',
      },
      {
        text: 'He descended to the dead. On the third day He rose again.',
        scripture: '1 Peter 3:18-19; 1 Corinthians 15:4',
        note: 'The resurrection is the cornerstone of the faith; without it, we are still in our sins (1 Cor 15:17).',
      },
      {
        text: 'He ascended into heaven and is seated at the right hand of the Father Almighty.',
        scripture: 'Acts 1:9-11; Hebrews 1:3',
        note: "The ascension affirms Christ's exaltation and His ongoing intercessory role.",
      },
      {
        text: 'From there He will come to judge the living and the dead.',
        scripture: 'Acts 10:42; 2 Timothy 4:1',
        note: 'A future, bodily, visible return -- the Second Coming -- to consummate history.',
      },
      {
        text: 'I believe in the Holy Spirit,',
        scripture: 'John 14:26; Acts 2:38',
        note: 'The Third Person of the Trinity, co-equal and co-eternal with Father and Son.',
      },
      {
        text: 'the holy catholic Church, the communion of saints,',
        scripture: 'Ephesians 5:27; Hebrews 12:22-23',
        note: '"Catholic" means universal -- the whole body of believers across all times and places.',
      },
      {
        text: 'the forgiveness of sins,',
        scripture: 'Ephesians 1:7; 1 John 1:9',
        note: "Central to the gospel -- total pardon is possible through Christ's atoning work.",
      },
      {
        text: 'the resurrection of the body, and life everlasting. Amen.',
        scripture: '1 Corinthians 15:42-44; John 11:25',
        note: 'The Christian hope is not a disembodied soul in heaven, but a resurrected, glorified body.',
      },
    ],
  },
  {
    id: 'nicene',
    title: 'Nicene Creed',
    date: 'AD 325 / 381',
    intro: 'Formulated at the Councils of Nicaea and Constantinople to defend the full divinity of Christ against Arianism. Used in the liturgy of most Christian traditions worldwide.',
    clauses: [
      {
        text: 'We believe in one God, the Father Almighty, Maker of heaven and earth, of all things visible and invisible.',
        scripture: 'Colossians 1:16; Isaiah 44:24',
        note: '"Invisible" affirms God\'s sovereignty over the spiritual realm as well as the physical.',
      },
      {
        text: 'And in one Lord Jesus Christ, the only-begotten Son of God, begotten of the Father before all ages; God of God, Light of Light, true God of true God, begotten, not made, of one substance with the Father.',
        scripture: 'John 1:1-3; Hebrews 1:3; Colossians 2:9',
        note: '"Of one substance" (homoousios) was the decisive term against Arius, who taught Christ was a created being. Christ is not a lesser god -- He is fully God.',
      },
      {
        text: 'Through Him all things were made. For us and for our salvation He came down from heaven: He was incarnate of the Holy Spirit and the Virgin Mary and became truly human.',
        scripture: 'John 1:14; Philippians 2:7-8; Colossians 1:16',
      },
      {
        text: 'For our sake He was crucified under Pontius Pilate; He suffered death and was buried. On the third day He rose again, in accordance with the Scriptures.',
        scripture: '1 Corinthians 15:3-4; Psalm 16:10',
      },
      {
        text: 'He ascended into heaven and is seated at the right hand of the Father. He will come again in glory to judge the living and the dead, and His kingdom will have no end.',
        scripture: 'Acts 1:9-11; Daniel 7:14; Luke 1:33',
        note: '"His kingdom will have no end" -- a direct counter to those who claimed the Son\'s authority would ultimately be subordinated to the Father.',
      },
      {
        text: 'We believe in the Holy Spirit, the Lord, the giver of life, who proceeds from the Father, who with the Father and the Son is worshipped and glorified, who has spoken through the prophets.',
        scripture: 'John 15:26; 2 Peter 1:21; Romans 8:2',
        note: 'The Council of 381 added this expanded pneumatology (doctrine of the Spirit) to affirm the Spirit\'s full divinity against the "Pneumatomachi" (Spirit-fighters).',
      },
      {
        text: 'We believe in one holy catholic and apostolic Church. We acknowledge one baptism for the forgiveness of sins. We look for the resurrection of the dead, and the life of the world to come. Amen.',
        scripture: 'Ephesians 4:5; Acts 2:38; 1 Corinthians 15:52',
      },
    ],
  },
  {
    id: 'chalcedon',
    title: 'Chalcedonian Definition',
    date: 'AD 451',
    intro: 'Defined at the Fourth Ecumenical Council, settling the great Christological controversies. It affirms Christ is one Person in two complete natures -- fully God and fully man -- without mixture, confusion, separation, or division.',
    clauses: [
      {
        text: 'Following the holy fathers, we all with one accord teach men to acknowledge one and the same Son, our Lord Jesus Christ.',
        scripture: 'Hebrews 13:8; Colossians 1:15',
        note: 'Grounds the definition in continuity with the apostolic tradition, not novelty.',
      },
      {
        text: 'Complete in His deity and complete in His humanity, truly God and truly man, consisting of a reasonable soul and body.',
        scripture: 'John 1:14; Colossians 2:9; Hebrews 2:17',
        note: 'Against Apollinarianism, which denied Christ a human mind. Christ is complete in both natures.',
      },
      {
        text: 'Consubstantial with the Father as regards His deity, and consubstantial with us as regards His humanity; like us in all things apart from sin.',
        scripture: 'Hebrews 4:15; Philippians 2:7',
        note: 'The term "consubstantial with us" ensures the reality of the Incarnation -- Christ truly shares in our human nature.',
      },
      {
        text: 'Acknowledged in two natures, without confusion, without change, without division, without separation.',
        scripture: 'John 10:30; John 14:28',
        note: 'The four "withouts" each refute a specific heresy: confusion (Eutyches), change (Apollinarius), division (Nestorius), separation (Nestorius). An elegant theological boundary.',
      },
      {
        text: 'The distinction of natures being in no way abolished because of the union, but rather the characteristic property of each nature being preserved.',
        scripture: 'Romans 9:5; Galatians 4:4',
      },
      {
        text: 'And concurring into one Person and one Subsistence -- not parted or divided into two persons, but one and the same Son and only-begotten God, Word, Lord Jesus Christ.',
        scripture: 'John 1:1; Philippians 2:9-11',
        note: 'One Person (hypostasis), two natures. This is the orthodox summary that has guided the church for over 1,500 years.',
      },
    ],
  },
];

export default function CreedLibraryPage() {
  const [activeCreed, setActiveCreed] = useState(CREEDS[0]);
  const [expandedClause, setExpandedClause] = useState<number | null>(null);

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen" style={{ color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
      <header className="flex items-center gap-3 mb-8">
        <Link to="/">
          <motion.div whileTap={{ scale: 0.9 }} className="p-2 opacity-70 hover:opacity-100">
            <ArrowLeft className="w-5 h-5" />
          </motion.div>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Historic Creeds</h1>
          <p className="text-xs opacity-50">The faith once delivered to the saints</p>
        </div>
      </header>

      {/* Creed Selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {CREEDS.map(creed => (
          <motion.button
            key={creed.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => { setActiveCreed(creed); setExpandedClause(null); }}
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeCreed.id === creed.id
                ? 'text-white border-transparent'
                : 'opacity-60 hover:opacity-100 border-[var(--bg-card-border)]'
            }`}
            style={activeCreed.id === creed.id ? { background: 'var(--accent)', borderColor: 'transparent' } : { background: 'var(--bg-card)' }}
          >
            {creed.title}
          </motion.button>
        ))}
      </div>

      {/* Active Creed */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCreed.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
        >
          {/* Creed Header Card */}
          <div className="glass-panel p-6 rounded-3xl mb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">{activeCreed.title}</h2>
                <p className="text-xs opacity-50">{activeCreed.date}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed opacity-70">{activeCreed.intro}</p>
          </div>

          {/* Clauses */}
          <div className="space-y-3">
            {activeCreed.clauses.map((clause, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-panel rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedClause(expandedClause === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-start justify-between gap-3"
                >
                  <p className="text-sm leading-relaxed font-medium flex-1">{clause.text}</p>
                  <div className="shrink-0 mt-0.5">
                    {expandedClause === i
                      ? <ChevronUp className="w-4 h-4 opacity-40" />
                      : <ChevronDown className="w-4 h-4 opacity-40" />}
                  </div>
                </button>

                <AnimatePresence>
                  {expandedClause === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-5"
                    >
                      <div className="border-t pt-4" style={{ borderColor: 'var(--bg-card-border)' }}>
                        {/* Scripture Badge */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {clause.scripture.split(';').map(ref => (
                            <span
                              key={ref}
                              className="text-[11px] font-bold px-3 py-1 rounded-full"
                              style={{ background: 'var(--accent)', color: '#fff', opacity: 0.9 }}
                            >
                              📖 {ref.trim()}
                            </span>
                          ))}
                        </div>
                        {clause.note && (
                          <p className="text-xs leading-relaxed opacity-70 italic">{clause.note}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Footer note */}
          <p className="text-[10px] opacity-30 text-center mt-8 px-4">
            These creeds represent the ecumenical consensus of the historic Christian church.
            They are presented for study and devotion, not to replace personal reading of Holy Scripture.
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
