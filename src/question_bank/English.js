const questions = [
  {
    id: "eng_1",
    difficulty: "Easy",
    tags: ["Synonyms"],
    question: "What is a synonym for 'Abundant'?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Scarce" },
      { id: 'b', label: 'B', text: "Plentiful" },
      { id: 'c', label: 'C', text: "Meager" },
      { id: 'd', label: 'D', text: "Rare" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Abundant</span> means existing in large quantities; its synonym is <span class=\"text-green\" style=\"font-weight: 800;\">Plentiful</span>."
  },
  {
    id: "eng_2",
    difficulty: "Medium",
    tags: ["Idioms"],
    question: "What does the idiom 'Beat around the bush' mean?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "To cut the grass" },
      { id: 'b', label: 'B', text: "To be direct" },
      { id: 'c', label: 'C', text: "To avoid the main topic" },
      { id: 'd', label: 'D', text: "To plant a tree" }
    ],
    explanation: "To <span class=\"text-blue\" style=\"font-weight: 800;\">beat around the bush</span> is to discuss a matter without coming to the <span class=\"text-green\" style=\"font-weight: 800;\">point</span>."
  },
  {
    id: "eng_3",
    difficulty: "Easy",
    tags: ["Antonyms"],
    question: "What is the antonym of 'Fragile'?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Robust" },
      { id: 'b', label: 'B', text: "Weak" },
      { id: 'c', label: 'C', text: "Delicate" },
      { id: 'd', label: 'D', text: "Brittle" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Fragile</span> means easily broken, while <span class=\"text-green\" style=\"font-weight: 800;\">Robust</span> means strong and healthy."
  },
  {
    id: "eng_4",
    difficulty: "Medium",
    tags: ["One Word Substitution"],
    question: "A person who hates mankind is called:",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "Philanthropist" },
      { id: 'b', label: 'B', text: "Optimist" },
      { id: 'c', label: 'C', text: "Misogynist" },
      { id: 'd', label: 'D', text: "Misanthrope" }
    ],
    explanation: "A <span class=\"text-blue\" style=\"font-weight: 800;\">Misanthrope</span> is someone who dislikes and avoids <span class=\"text-green\" style=\"font-weight: 800;\">other people</span>."
  },
  {
    id: "eng_5",
    difficulty: "Hard",
    tags: ["Grammar"],
    question: "Choose the correctly spelled word:",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Accomodation" },
      { id: 'b', label: 'B', text: "Accommodation" },
      { id: 'c', label: 'C', text: "Acommodation" },
      { id: 'd', label: 'D', text: "Accommodasion" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Accommodation</span> is spelled with <span class=\"text-green\" style=\"font-weight: 800;\">double 'c' and double 'm'</span>."
  },
  {
    id: "eng_6",
    difficulty: "Medium",
    tags: ["Prepositions"],
    question: "She is proficient ______ English.",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "at" },
      { id: 'b', label: 'B', text: "with" },
      { id: 'c', label: 'C', text: "in" },
      { id: 'd', label: 'D', text: "for" }
    ],
    explanation: "The adjective <span class=\"text-blue\" style=\"font-weight: 800;\">proficient</span> is followed by the preposition <span class=\"text-green\" style=\"font-weight: 800;\">'in'</span>."
  },
  {
    id: "eng_7",
    difficulty: "Hard",
    tags: ["Voices"],
    question: "Change to Passive Voice: 'The cat killed the mouse.'",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "The mouse was killed by the cat." },
      { id: 'b', label: 'B', text: "The mouse is killed by the cat." },
      { id: 'c', label: 'C', text: "The cat was killed by the mouse." },
      { id: 'd', label: 'D', text: "The mouse has been killed by the cat." }
    ],
    explanation: "In passive voice, the <span class=\"text-blue\" style=\"font-weight: 800;\">object becomes the subject</span> and the verb form changes (Past Simple → was + V3)."
  },
  {
    id: "eng_8",
    difficulty: "Medium",
    tags: ["Narration"],
    question: "Direct Speech: He said, 'I am busy.' Indirect Speech: ?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "He said that he is busy." },
      { id: 'b', label: 'B', text: "He said that he was busy." },
      { id: 'c', label: 'C', text: "He said that I was busy." },
      { id: 'd', label: 'D', text: "He says that he was busy." }
    ],
    explanation: "When the reporting verb is in the past, the <span class=\"text-blue\" style=\"font-weight: 800;\">tense of the reported speech</span> changes (Present Simple → Past Simple)."
  },
  {
    id: "eng_9",
    difficulty: "Hard",
    tags: ["Phrasal Verbs"],
    question: "The meeting was ______ due to bad weather.",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "called off" },
      { id: 'b', label: 'B', text: "called on" },
      { id: 'c', label: 'C', text: "called in" },
      { id: 'd', label: 'D', text: "called off" }
    ],
    explanation: "To <span class=\"text-blue\" style=\"font-weight: 800;\">call off</span> means to <span class=\"text-green\" style=\"font-weight: 800;\">cancel</span> something."
  },
  {
    id: "eng_10",
    difficulty: "Medium",
    tags: ["Articles"],
    question: "He is ______ honest man.",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "a" },
      { id: 'b', label: 'B', text: "an" },
      { id: 'c', label: 'C', text: "the" },
      { id: 'd', label: 'D', text: "no article" }
    ],
    explanation: "Although 'honest' starts with a consonant, it has a <span class=\"text-blue\" style=\"font-weight: 800;\">vowel sound</span>, so <span class=\"text-green\" style=\"font-weight: 800;\">'an'</span> is used."
  }
];

export const staticEnglishBank = questions.map(q => ({
  ...q,
  category_id: "english"
}));
