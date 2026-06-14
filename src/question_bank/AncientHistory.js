const questions = [
  {
    id: "anc_1",
    difficulty: "Medium",
    tags: ["Indus Valley"],
    question: "Which Indus Valley site is known for having a dockyard?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Harappa" },
      { id: 'b', label: 'B', text: "Mohenjo-daro" },
      { id: 'c', label: 'C', text: "Lothal" },
      { id: 'd', label: 'D', text: "Kalibangan" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Lothal</span> in Gujarat was a major <span class=\"text-green\" style=\"font-weight: 800;\">port city</span> of the Harappan civilization."
  },
  {
    id: "anc_2",
    difficulty: "Easy",
    tags: ["Buddhism"],
    question: "Where did Gautam Buddha attain enlightenment?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Sarnath" },
      { id: 'b', label: 'B', text: "Bodh Gaya" },
      { id: 'c', label: 'C', text: "Lumbini" },
      { id: 'd', label: 'D', text: "Kushinagar" }
    ],
    explanation: "Buddha attained enlightenment under a <span class=\"text-blue\" style=\"font-weight: 800;\">Pipal tree</span> at <span class=\"text-green\" style=\"font-weight: 800;\">Bodh Gaya</span>, Bihar."
  },
  {
    id: "anc_3",
    difficulty: "Medium",
    tags: ["Mauryan Empire"],
    question: "Who was the author of the book 'Arthashastra'?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Chanakya (Kautilya)" },
      { id: 'b', label: 'B', text: "Megasthenes" },
      { id: 'c', label: 'C', text: "Ashoka" },
      { id: 'd', label: 'D', text: "Chandragupta Maurya" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Kautilya</span> wrote the Arthashastra, a treatise on <span class=\"text-green\" style=\"font-weight: 800;\">statecraft and economics</span>."
  },
  {
    id: "anc_4",
    difficulty: "Medium",
    tags: ["Gupta Empire"],
    question: "Which Gupta ruler is known as the 'Napoleon of India'?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Chandragupta I" },
      { id: 'b', label: 'B', text: "Chandragupta II" },
      { id: 'c', label: 'C', text: "Samudragupta" },
      { id: 'd', label: 'D', text: "Skandagupta" }
    ],
    explanation: "Historian <span class=\"text-blue\" style=\"font-weight: 800;\">V.A. Smith</span> called <span class=\"text-green\" style=\"font-weight: 800;\">Samudragupta</span> the Napoleon of India due to his military conquests."
  },
  {
    id: "anc_5",
    difficulty: "Hard",
    tags: ["Vedic Age"],
    question: "Which of the following is the oldest Veda?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Rigveda" },
      { id: 'b', label: 'B', text: "Samaveda" },
      { id: 'c', label: 'C', text: "Yajurveda" },
      { id: 'd', label: 'D', text: "Atharvaveda" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Rigveda</span> is the oldest of the four Vedas, containing over <span class=\"text-green\" style=\"font-weight: 800;\">1,000 hymns</span>."
  },
  {
    id: "anc_6",
    difficulty: "Medium",
    tags: ["Janapadas"],
    question: "Which city was the capital of the Magadha Empire?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Vaishali" },
      { id: 'b', label: 'B', text: "Pataliputra" },
      { id: 'c', label: 'C', text: "Taxila" },
      { id: 'd', label: 'D', text: "Ujjain" }
    ],
    explanation: "Magadha's capital shifted from Rajgir to <span class=\"text-blue\" style=\"font-weight: 800;\">Pataliputra</span> (modern Patna) under <span class=\"text-green\" style=\"font-weight: 800;\">Udayin</span>."
  },
  {
    id: "anc_7",
    difficulty: "Hard",
    tags: ["Literature"],
    question: "Who wrote 'Abhigyan Shakuntalam'?",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "Bhasa" },
      { id: 'b', label: 'B', text: "Vishakhadatta" },
      { id: 'c', label: 'C', text: "Harsha" },
      { id: 'd', label: 'D', text: "Kalidasa" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Kalidasa</span>, the 'Shakespeare of India', wrote this masterpiece during the <span class=\"text-green\" style=\"font-weight: 800;\">Gupta Period</span>."
  },
  {
    id: "anc_8",
    difficulty: "Medium",
    tags: ["Jainism"],
    question: "Who was the 24th Tirthankara of Jainism?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Rishabhanatha" },
      { id: 'b', label: 'B', text: "Vardhamana Mahavira" },
      { id: 'c', label: 'C', text: "Parshvanatha" },
      { id: 'd', label: 'D', text: "Arishtanemi" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Lord Mahavira</span> was the final <span class=\"text-green\" style=\"font-weight: 800;\">Tirthankara</span> who organized Jainism in its present form."
  },
  {
    id: "anc_9",
    difficulty: "Hard",
    tags: ["Rock Edicts"],
    question: "The Kalinga War was fought by which Mauryan king?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Bindusara" },
      { id: 'b', label: 'B', text: "Chandragupta" },
      { id: 'c', label: 'C', text: "Ashoka" },
      { id: 'd', label: 'D', text: "Dasharatha" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Kalinga War (261 BC)</span> transformed <span class=\"text-green\" style=\"font-weight: 800;\">Ashoka</span>, leading him to embrace Buddhism."
  },
  {
    id: "anc_10",
    difficulty: "Medium",
    tags: ["Invasions"],
    question: "In which year did Alexander the Great invade India?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "326 BC" },
      { id: 'b', label: 'B', text: "261 BC" },
      { id: 'c', label: 'C', text: "712 AD" },
      { id: 'd', label: 'D', text: "1001 AD" }
    ],
    explanation: "Alexander crossed the Indus and fought the <span class=\"text-blue\" style=\"font-weight: 800;\">Battle of Hydaspes</span> against King <span class=\"text-green\" style=\"font-weight: 800;\">Porus</span> in 326 BC."
  }
];

export const staticAncientHistoryBank = questions.map(q => ({
  ...q,
  category_id: "ancient-history"
}));
