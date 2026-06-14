const questions = [
  {
    id: "sgk_1",
    difficulty: "Easy",
    tags: ["Important Days"],
    question: "When is 'Human Rights Day' celebrated?",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "October 24" },
      { id: 'b', label: 'B', text: "November 14" },
      { id: 'c', label: 'C', text: "December 1" },
      { id: 'd', label: 'D', text: "December 10" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Human Rights Day</span> is observed every year on <span class=\"text-green\" style=\"font-weight: 800;\">10th December</span>."
  },
  {
    id: "sgk_2",
    difficulty: "Medium",
    tags: ["Awards"],
    question: "Who was the first Indian to win a Nobel Prize?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "C.V. Raman" },
      { id: 'b', label: 'B', text: "Rabindranath Tagore" },
      { id: 'c', label: 'C', text: "Mother Teresa" },
      { id: 'd', label: 'D', text: "Hargobind Khorana" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Rabindranath Tagore</span> won the Nobel Prize in <span class=\"text-green\" style=\"font-weight: 800;\">Literature in 1913</span>."
  },
  {
    id: "sgk_3",
    difficulty: "Easy",
    tags: ["Sports"],
    question: "Which trophy is associated with the game of Hockey?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Ranji Trophy" },
      { id: 'b', label: 'B', text: "Santosh Trophy" },
      { id: 'c', label: 'C', text: "Aga Khan Cup" },
      { id: 'd', label: 'D', text: "Durand Cup" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Aga Khan Cup</span> is a prestigious <span class=\"text-green\" style=\"font-weight: 800;\">Hockey</span> tournament in India."
  },
  {
    id: "sgk_4",
    difficulty: "Medium",
    tags: ["Organizations"],
    question: "Where is the headquarters of the World Health Organization (WHO)?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Geneva" },
      { id: 'b', label: 'B', text: "New York" },
      { id: 'c', label: 'C', text: "Paris" },
      { id: 'd', label: 'D', text: "Rome" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">WHO</span> is headquartered in <span class=\"text-green\" style=\"font-weight: 800;\">Geneva, Switzerland</span>."
  },
  {
    id: "sgk_5",
    difficulty: "Hard",
    tags: ["Space"],
    question: "Which was the first satellite launched by India?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Rohini" },
      { id: 'b', label: 'B', text: "Aryabhata" },
      { id: 'c', label: 'C', text: "Bhaskara" },
      { id: 'd', label: 'D', text: "Apple" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Aryabhata</span> was India's first satellite, launched in <span class=\"text-green\" style=\"font-weight: 800;\">1975</span> using a Soviet rocket."
  },
  {
    id: "sgk_6",
    difficulty: "Medium",
    tags: ["Monuments"],
    question: "Who built the Red Fort in Delhi?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Akbar" },
      { id: 'b', label: 'B', text: "Humayun" },
      { id: 'c', label: 'C', text: "Shah Jahan" },
      { id: 'd', label: 'D', text: "Aurangzeb" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Shah Jahan</span> commissioned the construction of the <span class=\"text-green\" style=\"font-weight: 800;\">Red Fort</span> in 1638."
  },
  {
    id: "sgk_7",
    difficulty: "Easy",
    tags: ["Geography"],
    question: "Which is the largest desert in the world?",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "Thar" },
      { id: 'b', label: 'B', text: "Gobi" },
      { id: 'c', label: 'C', text: "Sahara" },
      { id: 'd', label: 'D', text: "Antarctic Desert" }
    ],
    explanation: "While the Sahara is the largest hot desert, the <span class=\"text-blue\" style=\"font-weight: 800;\">Antarctic Desert</span> is the largest <span class=\"text-green\" style=\"font-weight: 800;\">overall desert</span> by area."
  },
  {
    id: "sgk_8",
    difficulty: "Hard",
    tags: ["Books"],
    question: "Who is the author of 'The Discovery of India'?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Jawaharlal Nehru" },
      { id: 'b', label: 'B', text: "Mahatma Gandhi" },
      { id: 'c', label: 'C', text: "Sardar Patel" },
      { id: 'd', label: 'D', text: "Subhash Chandra Bose" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Jawaharlal Nehru</span> wrote this book during his imprisonment in <span class=\"text-green\" style=\"font-weight: 800;\">Ahmednagar Fort (1942–1946)</span>."
  },
  {
    id: "sgk_9",
    difficulty: "Medium",
    tags: ["Cities"],
    question: "Which city is known as the 'Pink City' of India?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Jodhpur" },
      { id: 'b', label: 'B', text: "Jaipur" },
      { id: 'c', label: 'C', text: "Udaipur" },
      { id: 'd', label: 'D', text: "Bikaner" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Jaipur</span> was painted pink to welcome <span class=\"text-green\" style=\"font-weight: 800;\">Prince Albert</span> in 1876."
  },
  {
    id: "sgk_10",
    difficulty: "Easy",
    tags: ["Music"],
    question: "Sitar is associated with which famous musician?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Zakir Hussain" },
      { id: 'b', label: 'B', text: "Bismillah Khan" },
      { id: 'c', label: 'C', text: "Pt. Ravi Shankar" },
      { id: 'd', label: 'D', text: "Amjad Ali Khan" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Pt. Ravi Shankar</span> was a world-renowned <span class=\"text-green\" style=\"font-weight: 800;\">Sitar maestro</span>."
  }
];

export const staticStaticGKBank = questions.map(q => ({
  ...q,
  category_id: "static-gk"
}));
