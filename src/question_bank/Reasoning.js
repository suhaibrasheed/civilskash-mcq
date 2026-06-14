const questions = [
  {
    id: "re_1",
    difficulty: "Easy",
    tags: ["Series"],
    question: "Complete the series: 2, 4, 8, 16, ?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "24" },
      { id: 'b', label: 'B', text: "30" },
      { id: 'c', label: 'C', text: "32" },
      { id: 'd', label: 'D', text: "48" }
    ],
    explanation: "Each number is <span class=\"text-blue\" style=\"font-weight: 800;\">doubled</span> to get the next. <span class=\"text-green\" style=\"font-weight: 800;\">16 * 2 = 32</span>."
  },
  {
    id: "re_2",
    difficulty: "Medium",
    tags: ["Coding-Decoding"],
    question: "If 'APPLE' is coded as 'BQQMF', how is 'MANGO' coded?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "NBOHP" },
      { id: 'b', label: 'B', text: "NBOHP" },
      { id: 'c', label: 'C', text: "LBMFN" },
      { id: 'd', label: 'D', text: "OBOIP" }
    ],
    explanation: "Each letter is replaced by the <span class=\"text-blue\" style=\"font-weight: 800;\">next letter</span> in the alphabet. <span class=\"text-green\" style=\"font-weight: 800;\">M→N, A→B, N→O, G→H, O→P</span>."
  },
  {
    id: "re_3",
    difficulty: "Medium",
    tags: ["Blood Relations"],
    question: "Pointing to a photograph, a man says, 'She is the daughter of the only son of my grandfather.' Who is the woman in the photograph to the man?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Sister" },
      { id: 'b', label: 'B', text: "Mother" },
      { id: 'c', label: 'C', text: "Daughter" },
      { id: 'd', label: 'D', text: "Cousin" }
    ],
    explanation: "Only son of grandfather is the <span class=\"text-blue\" style=\"font-weight: 800;\">father</span>. Daughter of father is the <span class=\"text-green\" style=\"font-weight: 800;\">sister</span>."
  },
  {
    id: "re_4",
    difficulty: "Easy",
    tags: ["Odd One Out"],
    question: "Find the odd one out:",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "New Delhi" },
      { id: 'b', label: 'B', text: "Paris" },
      { id: 'c', label: 'C', text: "Tokyo" },
      { id: 'd', label: 'D', text: "Mumbai" }
    ],
    explanation: "New Delhi, Paris, and Tokyo are <span class=\"text-blue\" style=\"font-weight: 800;\">capitals</span> of their respective countries, while <span class=\"text-green\" style=\"font-weight: 800;\">Mumbai</span> is not."
  },
  {
    id: "re_5",
    difficulty: "Hard",
    tags: ["Direction Sense"],
    question: "A man walks 5 km East, then turns right and walks 12 km. How far is he from the starting point?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "15 km" },
      { id: 'b', label: 'B', text: "12 km" },
      { id: 'c', label: 'C', text: "13 km" },
      { id: 'd', label: 'D', text: "17 km" }
    ],
    explanation: "Using <span class=\"text-blue\" style=\"font-weight: 800;\">Pythagoras theorem</span>: √(5² + 12²) = √(25 + 144) = √169 = <span class=\"text-green\" style=\"font-weight: 800;\">13 km</span>."
  },
  {
    id: "re_6",
    difficulty: "Medium",
    tags: ["Ranking"],
    question: "In a row of 40 students, Rohan is 14th from the left. What is his rank from the right?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "26th" },
      { id: 'b', label: 'B', text: "27th" },
      { id: 'c', label: 'C', text: "25th" },
      { id: 'd', label: 'D', text: "28th" }
    ],
    explanation: "Total = (Left + Right - 1). <span class=\"text-blue\" style=\"font-weight: 800;\">40 = 14 + R - 1</span>. R = 40 - 13 = <span class=\"text-green\" style=\"font-weight: 800;\">27th</span>."
  },
  {
    id: "re_7",
    difficulty: "Hard",
    tags: ["Syllogism"],
    question: "Statements: All cats are dogs. All dogs are animals. Conclusion: ?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "All cats are animals" },
      { id: 'b', label: 'B', text: "Some animals are not cats" },
      { id: 'c', label: 'C', text: "All animals are cats" },
      { id: 'd', label: 'D', text: "No cat is an animal" }
    ],
    explanation: "Since cats are dogs and dogs are animals, <span class=\"text-blue\" style=\"font-weight: 800;\">all cats</span> must be <span class=\"text-green\" style=\"font-weight: 800;\">animals</span>."
  },
  {
    id: "re_8",
    difficulty: "Medium",
    tags: ["Analogy"],
    question: "Doctor : Hospital :: Teacher : ?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Students" },
      { id: 'b', label: 'B', text: "Books" },
      { id: 'c', label: 'C', text: "School" },
      { id: 'd', label: 'D', text: "Blackboard" }
    ],
    explanation: "A doctor works in a hospital, so a <span class=\"text-blue\" style=\"font-weight: 800;\">teacher</span> works in a <span class=\"text-green\" style=\"font-weight: 800;\">school</span>."
  },
  {
    id: "re_9",
    difficulty: "Hard",
    tags: ["Missing Number"],
    question: "Find the missing number in the matrix: [2, 3, 13], [4, 5, 41], [3, 4, ?]",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "20" },
      { id: 'b', label: 'B', text: "30" },
      { id: 'c', label: 'C', text: "24" },
      { id: 'd', label: 'D', text: "25" }
    ],
    explanation: "Pattern is <span class=\"text-blue\" style=\"font-weight: 800;\">a² + b² = c</span>. 3² + 4² = 9 + 16 = <span class=\"text-green\" style=\"font-weight: 800;\">25</span>."
  },
  {
    id: "re_10",
    difficulty: "Medium",
    tags: ["Alphabet Series"],
    question: "Complete the series: A, C, F, J, ?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "M" },
      { id: 'b', label: 'B', text: "O" },
      { id: 'c', label: 'C', text: "N" },
      { id: 'd', label: 'D', text: "P" }
    ],
    explanation: "The gap increases: <span class=\"text-blue\" style=\"font-weight: 800;\">+1, +2, +3, +4</span>. J(10) + 5 = 15 = <span class=\"text-green\" style=\"font-weight: 800;\">O</span>."
  }
];

export const staticReasoningBank = questions.map(q => ({
  ...q,
  category_id: "reasoning"
}));
