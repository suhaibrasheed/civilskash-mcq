const questions = [
  {
    id: "eco_1",
    difficulty: "Medium",
    tags: ["Banking"],
    question: "Which bank is known as the 'Banker's Bank' in India?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "State Bank of India" },
      { id: 'b', label: 'B', text: "Reserve Bank of India" },
      { id: 'c', label: 'C', text: "NABARD" },
      { id: 'd', label: 'D', text: "HDFC Bank" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">RBI</span> regulates all other banks and acts as the <span class=\"text-green\" style=\"font-weight: 800;\">central bank</span> of the country."
  },
  {
    id: "eco_2",
    difficulty: "Easy",
    tags: ["Planning"],
    question: "Who is the Chairperson of NITI Aayog?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Prime Minister" },
      { id: 'b', label: 'B', text: "Finance Minister" },
      { id: 'c', label: 'C', text: "President" },
      { id: 'd', label: 'D', text: "Governor of RBI" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Prime Minister</span> of India is the ex-officio <span class=\"text-green\" style=\"font-weight: 800;\">Chairperson of NITI Aayog</span>."
  },
  {
    id: "eco_3",
    difficulty: "Medium",
    tags: ["Taxation"],
    question: "What does GST stand for?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "General Sales Tax" },
      { id: 'b', label: 'B', text: "Government Service Tax" },
      { id: 'c', label: 'C', text: "Goods and Services Tax" },
      { id: 'd', label: 'D', text: "Global Standard Tax" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">GST</span> is an indirect tax used in India on the supply of <span class=\"text-green\" style=\"font-weight: 800;\">goods and services</span>."
  },
  {
    id: "eco_4",
    difficulty: "Hard",
    tags: ["Inflation"],
    question: "What is 'Stagflation'?",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "High inflation with high growth" },
      { id: 'b', label: 'B', text: "Low inflation with low growth" },
      { id: 'c', label: 'C', text: "Deflation with high unemployment" },
      { id: 'd', label: 'D', text: "High inflation with stagnant growth and high unemployment" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Stagflation</span> is a dangerous economic condition where <span class=\"text-green\" style=\"font-weight: 800;\">prices rise</span> but the economy does not grow."
  },
  {
    id: "eco_5",
    difficulty: "Medium",
    tags: ["GDP"],
    question: "The 'Base Year' for calculating GDP in India is currently:",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "2004-05" },
      { id: 'b', label: 'B', text: "2011-12" },
      { id: 'c', label: 'C', text: "2015-16" },
      { id: 'd', label: 'D', text: "2018-19" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">CSO</span> shifted the base year for GDP from 2004-05 to <span class=\"text-green\" style=\"font-weight: 800;\">2011-12</span> in 2015."
  },
  {
    id: "eco_6",
    difficulty: "Hard",
    tags: ["Exchanges"],
    question: "Which is the oldest stock exchange in Asia?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Bombay Stock Exchange (BSE)" },
      { id: 'b', label: 'B', text: "National Stock Exchange (NSE)" },
      { id: 'c', label: 'C', text: "Tokyo Stock Exchange" },
      { id: 'd', label: 'D', text: "Shanghai Stock Exchange" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">BSE</span>, established in 1875, is <span class=\"text-green\" style=\"font-weight: 800;\">Asia's oldest stock exchange</span>."
  },
  {
    id: "eco_7",
    difficulty: "Medium",
    tags: ["Sectors"],
    question: "Which sector contributes the most to India's GDP?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Primary (Agriculture)" },
      { id: 'b', label: 'B', text: "Secondary (Industry)" },
      { id: 'c', label: 'C', text: "Tertiary (Services)" },
      { id: 'd', label: 'D', text: "Quaternary" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Service Sector</span> accounts for more than <span class=\"text-green\" style=\"font-weight: 800;\">50%</span> of India's Gross Value Added."
  },
  {
    id: "eco_8",
    difficulty: "Easy",
    tags: ["Currency"],
    question: "Who signs the ₹1 currency note in India?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Governor of RBI" },
      { id: 'b', label: 'B', text: "Finance Secretary" },
      { id: 'c', label: 'C', text: "Finance Minister" },
      { id: 'd', label: 'D', text: "President" }
    ],
    explanation: "While other notes bear the RBI Governor's signature, the <span class=\"text-blue\" style=\"font-weight: 800;\">Re. 1 note</span> is signed by the <span class=\"text-green\" style=\"font-weight: 800;\">Finance Secretary</span>."
  },
  {
    id: "eco_9",
    difficulty: "Hard",
    tags: ["FDI"],
    question: "What is FPI?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Foreign Portfolio Investment" },
      { id: 'b', label: 'B', text: "Foreign Private Investment" },
      { id: 'c', label: 'C', text: "Financial Portfolio Index" },
      { id: 'd', label: 'D', text: "Fixed Price Investment" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">FPI</span> consists of securities and other financial assets held by investors in <span class=\"text-green\" style=\"font-weight: 800;\">another country</span>."
  },
  {
    id: "eco_10",
    difficulty: "Medium",
    tags: ["Agriculture"],
    question: "The 'Green Revolution' in India was mainly focused on which crops?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Pulses and Oilseeds" },
      { id: 'b', label: 'B', text: "Cotton and Jute" },
      { id: 'c', label: 'C', text: "Wheat and Rice" },
      { id: 'd', label: 'D', text: "Tea and Coffee" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Green Revolution</span> led by M.S. Swaminathan primarily boosted the production of <span class=\"text-green\" style=\"font-weight: 800;\">Wheat and Rice</span>."
  }
];

export const staticIndianEconomyBank = questions.map(q => ({
  ...q,
  category_id: "indian-economy"
}));
