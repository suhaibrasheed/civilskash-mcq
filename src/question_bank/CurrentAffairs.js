const questions = [
  {
    id: "ca_1",
    difficulty: "Medium",
    tags: ["International"],
    question: "Which country hosted the G20 Summit in 2023?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "India" },
      { id: 'b', label: 'B', text: "Brazil" },
      { id: 'c', label: 'C', text: "Indonesia" },
      { id: 'd', label: 'D', text: "South Africa" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">India</span> hosted the 18th G20 Summit in New Delhi under the theme <span class=\"text-green\" style=\"font-weight: 800;\">Vasudhaiva Kutumbakam</span>."
  },
  {
    id: "ca_2",
    difficulty: "Easy",
    tags: ["Environment"],
    question: "Where was COP28 (UN Climate Change Conference) held?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Glasgow, UK" },
      { id: 'b', label: 'B', text: "Sharm El-Sheikh, Egypt" },
      { id: 'c', label: 'C', text: "Dubai, UAE" },
      { id: 'd', label: 'D', text: "Baku, Azerbaijan" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">COP28</span> was held in <span class=\"text-green\" style=\"font-weight: 800;\">Dubai, UAE</span> in late 2023."
  },
  {
    id: "ca_3",
    difficulty: "Medium",
    tags: ["Space"],
    question: "What is the name of India's first solar mission?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Chandrayaan-3" },
      { id: 'b', label: 'B', text: "Aditya-L1" },
      { id: 'c', label: 'C', text: "Gaganyaan" },
      { id: 'd', label: 'D', text: "Mangalyaan-2" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Aditya-L1</span> is India's first dedicated space mission to study the <span class=\"text-green\" style=\"font-weight: 800;\">Sun</span>."
  },
  {
    id: "ca_4",
    difficulty: "Easy",
    tags: ["Sports"],
    question: "Which country won the ICC Men's Cricket World Cup 2023?",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "India" },
      { id: 'b', label: 'B', text: "South Africa" },
      { id: 'c', label: 'C', text: "New Zealand" },
      { id: 'd', label: 'D', text: "Australia" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Australia</span> defeated India in the final to win their <span class=\"text-green\" style=\"font-weight: 800;\">6th World Cup title</span>."
  },
  {
    id: "ca_5",
    difficulty: "Medium",
    tags: ["Awards"],
    question: "Who was awarded the Nobel Peace Prize 2023?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Narges Mohammadi" },
      { id: 'b', label: 'B', text: "Maria Ressa" },
      { id: 'c', label: 'C', text: "Ales Bialiatski" },
      { id: 'd', label: 'D', text: "Dmitry Muratov" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Narges Mohammadi</span>, an Iranian activist, won for her fight against the <span class=\"text-green\" style=\"font-weight: 800;\">oppression of women</span> in Iran."
  },
  {
    id: "ca_6",
    difficulty: "Medium",
    tags: ["Economy"],
    question: "Which state recently became the first in India to implement the Uniform Civil Code (UCC)?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Goa" },
      { id: 'b', label: 'B', text: "Gujarat" },
      { id: 'c', label: 'C', text: "Uttarakhand" },
      { id: 'd', label: 'D', text: "Assam" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Uttarakhand</span> is the first state in independent India to pass a bill for <span class=\"text-green\" style=\"font-weight: 800;\">Uniform Civil Code</span>."
  },
  {
    id: "ca_7",
    difficulty: "Easy",
    tags: ["Technology"],
    question: "Which company developed the AI model 'Gemini'?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "OpenAI" },
      { id: 'b', label: 'B', text: "Google" },
      { id: 'c', label: 'C', text: "Meta" },
      { id: 'd', label: 'D', text: "Microsoft" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Gemini</span> is a family of multimodal large language models developed by <span class=\"text-green\" style=\"font-weight: 800;\">Google DeepMind</span>."
  },
  {
    id: "ca_8",
    difficulty: "Medium",
    tags: ["International"],
    question: "Which country officially joined NATO as its 32nd member in 2024?",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "Finland" },
      { id: 'b', label: 'B', text: "Ukraine" },
      { id: 'c', label: 'C', text: "Moldova" },
      { id: 'd', label: 'D', text: "Sweden" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Sweden</span> became the 32nd member of NATO in March 2024, following <span class=\"text-green\" style=\"font-weight: 800;\">Finland's</span> entry."
  },
  {
    id: "ca_9",
    difficulty: "Hard",
    tags: ["Space"],
    question: "Where did Chandrayaan-3 land on the Moon?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Sea of Tranquility" },
      { id: 'b', label: 'B', text: "Lunar North Pole" },
      { id: 'c', label: 'C', text: "Lunar South Pole" },
      { id: 'd', label: 'D', text: "Ocean of Storms" }
    ],
    explanation: "India became the <span class=\"text-blue\" style=\"font-weight: 800;\">first country</span> to soft-land near the Moon's <span class=\"text-green\" style=\"font-weight: 800;\">South Pole</span>."
  },
  {
    id: "ca_10",
    difficulty: "Medium",
    tags: ["Economy"],
    question: "Who is the current Governor of the Reserve Bank of India (as of May 2024)?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Shaktikanta Das" },
      { id: 'b', label: 'B', text: "Urjit Patel" },
      { id: 'c', label: 'C', text: "Raghuram Rajan" },
      { id: 'd', label: 'D', text: "Nirmala Sitharaman" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Shaktikanta Das</span> is the 25th Governor of the <span class=\"text-green\" style=\"font-weight: 800;\">RBI</span>."
  }
];

export const staticCurrentAffairsBank = questions.map(q => ({
  ...q,
  category_id: "current-affairs"
}));
