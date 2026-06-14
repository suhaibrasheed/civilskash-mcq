const questions = [
  {
    id: "mod_1",
    difficulty: "Easy",
    tags: ["Freedom Struggle"],
    question: "In which year did the 'Quit India Movement' start?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "1930" },
      { id: 'b', label: 'B', text: "1940" },
      { id: 'c', label: 'C', text: "1942" },
      { id: 'd', label: 'D', text: "1945" }
    ],
    explanation: "Launched by <span class=\"text-blue\" style=\"font-weight: 800;\">Mahatma Gandhi</span> in August <span class=\"text-green\" style=\"font-weight: 800;\">1942</span> with the slogan 'Do or Die'."
  },
  {
    id: "mod_2",
    difficulty: "Medium",
    tags: ["British Rule"],
    question: "Who was the first Governor-General of Bengal?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Robert Clive" },
      { id: 'b', label: 'B', text: "Warren Hastings" },
      { id: 'c', label: 'C', text: "Lord Cornwallis" },
      { id: 'd', label: 'D', text: "Lord Dalhousie" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Warren Hastings</span> became the first Governor-General under the <span class=\"text-green\" style=\"font-weight: 800;\">Regulating Act of 1773</span>."
  },
  {
    id: "mod_3",
    difficulty: "Medium",
    tags: ["Revolt of 1857"],
    question: "Who led the 1857 revolt in Lucknow?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Begum Hazrat Mahal" },
      { id: 'b', label: 'B', text: "Rani Laxmi Bai" },
      { id: 'c', label: 'C', text: "Nana Saheb" },
      { id: 'd', label: 'D', text: "Kunwar Singh" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Begum Hazrat Mahal</span> led the rebellion in <span class=\"text-green\" style=\"font-weight: 800;\">Lucknow</span> against the British Annexation of Awadh."
  },
  {
    id: "mod_4",
    difficulty: "Easy",
    tags: ["INC"],
    question: "Who was the founder of the Indian National Congress?",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "W.C. Bonnerjee" },
      { id: 'b', label: 'B', text: "Dadabhai Naoroji" },
      { id: 'c', label: 'C', text: "Annie Besant" },
      { id: 'd', label: 'D', text: "A.O. Hume" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">INC</span> was founded in <span class=\"text-green\" style=\"font-weight: 800;\">1885</span> by retired British officer Allan Octavian Hume."
  },
  {
    id: "mod_5",
    difficulty: "Medium",
    tags: ["Gandhian Era"],
    question: "Where did Mahatma Gandhi start his first Satyagraha in India?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Kheda" },
      { id: 'b', label: 'B', text: "Champaran" },
      { id: 'c', label: 'C', text: "Ahmedabad" },
      { id: 'd', label: 'D', text: "Bardoli" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Champaran Satyagraha (1917)</span> was Gandhi's first civil disobedience movement against the <span class=\"text-green\" style=\"font-weight: 800;\">Indigo system</span>."
  },
  {
    id: "mod_6",
    difficulty: "Hard",
    tags: ["Social Reforms"],
    question: "Who founded the 'Satyashodhak Samaj'?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Dr. B.R. Ambedkar" },
      { id: 'b', label: 'B', text: "Raja Ram Mohan Roy" },
      { id: 'c', label: 'C', text: "Jyotirao Phule" },
      { id: 'd', label: 'D', text: "Ishwar Chandra Vidyasagar" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Jyotirao Phule</span> founded the society in 1873 to focus on the <span class=\"text-green\" style=\"font-weight: 800;\">education of lower castes</span> and women."
  },
  {
    id: "mod_7",
    difficulty: "Medium",
    tags: ["Partitions"],
    question: "The partition of Bengal was announced in 1905 by:",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Lord Minto" },
      { id: 'b', label: 'B', text: "Lord Curzon" },
      { id: 'c', label: 'C', text: "Lord Hardinge" },
      { id: 'd', label: 'D', text: "Lord Canning" }
    ],
    explanation: "The partition was a <span class=\"text-blue\" style=\"font-weight: 800;\">'Divide and Rule'</span> tactic by <span class=\"text-green\" style=\"font-weight: 800;\">Lord Curzon</span>, leading to the Swadeshi Movement."
  },
  {
    id: "mod_8",
    difficulty: "Easy",
    tags: ["Personalities"],
    question: "Who is known as the 'Grand Old Man of India'?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Dadabhai Naoroji" },
      { id: 'b', label: 'B', text: "Gopal Krishna Gokhale" },
      { id: 'c', label: 'C', text: "Bal Gangadhar Tilak" },
      { id: 'd', label: 'D', text: "Surendranath Banerjee" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Dadabhai Naoroji</span> was a pioneer of the drain theory and the <span class=\"text-green\" style=\"font-weight: 800;\">first Indian</span> to be a British MP."
  },
  {
    id: "mod_9",
    difficulty: "Medium",
    tags: ["Movements"],
    question: "The 'Dandi March' was a protest against which tax?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Land Tax" },
      { id: 'b', label: 'B', text: "Income Tax" },
      { id: 'c', label: 'C', text: "Salt Tax" },
      { id: 'd', label: 'D', text: "Textile Tax" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Salt March (1930)</span> marked the beginning of the <span class=\"text-green\" style=\"font-weight: 800;\">Civil Disobedience Movement</span>."
  },
  {
    id: "mod_10",
    difficulty: "Hard",
    tags: ["Acts"],
    question: "Which Act introduced 'Dyarchy' at the provincial level?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Morley-Minto Reforms 1909" },
      { id: 'b', label: 'B', text: "Montagu-Chelmsford Reforms 1919" },
      { id: 'c', label: 'C', text: "Government of India Act 1935" },
      { id: 'd', label: 'D', text: "Indian Councils Act 1892" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">1919 Act</span> introduced <span class=\"text-green\" style=\"font-weight: 800;\">Dyarchy</span>, dividing provincial subjects into Reserved and Transferred."
  }
];

export const staticModernHistoryBank = questions.map(q => ({
  ...q,
  category_id: "modern-history"
}));
