const questions = [
  {
    id: "geo_i_1",
    difficulty: "Easy",
    tags: ["Rivers"],
    question: "Which river is known as the 'Dakshin Ganga'?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Krishna" },
      { id: 'b', label: 'B', text: "Godavari" },
      { id: 'c', label: 'C', text: "Cauvery" },
      { id: 'd', label: 'D', text: "Mahanadi" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Godavari</span> is the largest peninsular river and is called <span class=\"text-green\" style=\"font-weight: 800;\">Dakshin Ganga</span> due to its size and age."
  },
  {
    id: "geo_i_2",
    difficulty: "Medium",
    tags: ["Mountains"],
    question: "Which is the highest peak in India?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Mount Everest" },
      { id: 'b', label: 'B', text: "Nanda Devi" },
      { id: 'c', label: 'C', text: "Kanchenjunga" },
      { id: 'd', label: 'D', text: "Anamudi" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Kanchenjunga</span> is the highest peak located in India (Sikkim), while K2 is in POK."
  },
  {
    id: "geo_i_3",
    difficulty: "Medium",
    tags: ["Climate"],
    question: "Which state receives the first monsoon rains in India?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Kerala" },
      { id: 'b', label: 'B', text: "Tamil Nadu" },
      { id: 'c', label: 'C', text: "Maharashtra" },
      { id: 'd', label: 'D', text: "West Bengal" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">South-West Monsoon</span> typically hits the <span class=\"text-green\" style=\"font-weight: 800;\">Kerala coast</span> by June 1st."
  },
  {
    id: "geo_i_4",
    difficulty: "Hard",
    tags: ["Soil"],
    question: "Black soil is most suitable for the cultivation of which crop?",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "Wheat" },
      { id: 'b', label: 'B', text: "Rice" },
      { id: 'c', label: 'C', text: "Tea" },
      { id: 'd', label: 'D', text: "Cotton" }
    ],
    explanation: "Also known as <span class=\"text-blue\" style=\"font-weight: 800;\">Regur Soil</span>, black soil is ideal for <span class=\"text-green\" style=\"font-weight: 800;\">cotton cultivation</span>."
  },
  {
    id: "geo_i_5",
    difficulty: "Medium",
    tags: ["Boundaries"],
    question: "Which Indian state has the longest coastline?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Maharashtra" },
      { id: 'b', label: 'B', text: "Gujarat" },
      { id: 'c', label: 'C', text: "Andhra Pradesh" },
      { id: 'd', label: 'D', text: "Tamil Nadu" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Gujarat</span> has the longest coastline in India, stretching over <span class=\"text-green\" style=\"font-weight: 800;\">1600 km</span>."
  },
  {
    id: "geo_i_6",
    difficulty: "Hard",
    tags: ["Islands"],
    question: "The 'Ten Degree Channel' separates which two landmasses?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "India and Sri Lanka" },
      { id: 'b', label: 'B', text: "Lakshadweep and Maldives" },
      { id: 'c', label: 'C', text: "Andaman and Nicobar" },
      { id: 'd', label: 'D', text: "Daman and Diu" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Ten Degree Channel</span> lies on the 10-degree latitude and separates the <span class=\"text-green\" style=\"font-weight: 800;\">Andaman Islands</span> from the Nicobar Islands."
  },
  {
    id: "geo_i_7",
    difficulty: "Medium",
    tags: ["Agriculture"],
    question: "Which state is known as the 'Sugar Bowl of India'?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Uttar Pradesh" },
      { id: 'b', label: 'B', text: "Punjab" },
      { id: 'c', label: 'C', text: "Haryana" },
      { id: 'd', label: 'D', text: "Bihar" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Uttar Pradesh</span> is the largest producer of <span class=\"text-green\" style=\"font-weight: 800;\">sugarcane</span> in India."
  },
  {
    id: "geo_i_8",
    difficulty: "Hard",
    tags: ["National Parks"],
    question: "Where is the Kaziranga National Park located?",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "West Bengal" },
      { id: 'b', label: 'B', text: "Uttarakhand" },
      { id: 'c', label: 'C', text: "Madhya Pradesh" },
      { id: 'd', label: 'D', text: "Assam" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Kaziranga</span> in Assam is famous for its <span class=\"text-green\" style=\"font-weight: 800;\">One-horned Rhinoceros</span>."
  },
  {
    id: "geo_i_9",
    difficulty: "Medium",
    tags: ["Rivers"],
    question: "Which river passes through the rift valley of India?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Ganga" },
      { id: 'b', label: 'B', text: "Narmada" },
      { id: 'c', label: 'C', text: "Yamuna" },
      { id: 'd', label: 'D', text: "Luni" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Narmada and Tapi</span> are major rivers that flow through <span class=\"text-green\" style=\"font-weight: 800;\">rift valleys</span>."
  },
  {
    id: "geo_i_10",
    difficulty: "Easy",
    tags: ["Neighbors"],
    question: "Which country shares the longest border with India?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "China" },
      { id: 'b', label: 'B', text: "Pakistan" },
      { id: 'c', label: 'C', text: "Bangladesh" },
      { id: 'd', label: 'D', text: "Nepal" }
    ],
    explanation: "India shares a <span class=\"text-blue\" style=\"font-weight: 800;\">4,096 km</span> long border with <span class=\"text-green\" style=\"font-weight: 800;\">Bangladesh</span>."
  }
];

export const staticIndianGeographyBank = questions.map(q => ({
  ...q,
  category_id: "indian-geography"
}));
