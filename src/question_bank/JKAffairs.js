const questions = [
  {
    id: "jkg_1",
    difficulty: "Medium",
    tags: ["JK Geography"],
    question: "Which river forms the backbone of Kashmir Valley?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Chenab" },
      { id: 'b', label: 'B', text: "Ravi" },
      { id: 'c', label: 'C', text: "Jhelum" },
      { id: 'd', label: 'D', text: "Indus" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Jhelum</span> flows through the entire Kashmir Valley and is its main drainage artery. It originates from <span class=\"text-green\" style=\"font-weight: 800;\">Verinag</span>."
  },
  {
    id: "jkg_2",
    difficulty: "Medium",
    tags: ["JK Geography"],
    question: "The Karewa deposits of Kashmir are famous for:",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Coal" },
      { id: 'b', label: 'B', text: "Gold" },
      { id: 'c', label: 'C', text: "Saffron cultivation" },
      { id: 'd', label: 'D', text: "Petroleum" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Karewas</span> are lacustrine deposits ideal for <span class=\"text-green\" style=\"font-weight: 800;\">saffron farming</span>, especially in Pampore."
  },
  {
    id: "jkg_3",
    difficulty: "Medium",
    tags: ["JK Geography"],
    question: "Which pass connects Kashmir Valley with Ladakh?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Zoji La" },
      { id: 'b', label: 'B', text: "Banihal Pass" },
      { id: 'c', label: 'C', text: "Rohtang Pass" },
      { id: 'd', label: 'D', text: "Khardung La" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Zoji La</span> is a strategic pass linking <span class=\"text-green\" style=\"font-weight: 800;\">Srinagar with Leh</span>."
  },
  {
    id: "jkg_4",
    difficulty: "Medium",
    tags: ["JK Geography"],
    question: "The cold desert region in J&K is:",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Jammu" },
      { id: 'b', label: 'B', text: "Kashmir Valley" },
      { id: 'c', label: 'C', text: "Ladakh" },
      { id: 'd', label: 'D', text: "Pir Panjal" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Ladakh</span> has an arid, high-altitude <span class=\"text-green\" style=\"font-weight: 800;\">cold desert</span> climate due to rain shadow effect."
  },
  {
    id: "jkg_5",
    difficulty: "Medium",
    tags: ["JK Geography"],
    question: "Wular Lake is located on which river?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Indus" },
      { id: 'b', label: 'B', text: "Jhelum" },
      { id: 'c', label: 'C', text: "Chenab" },
      { id: 'd', label: 'D', text: "Ravi" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Wular Lake</span> is one of Asia’s largest freshwater lakes and is fed by <span class=\"text-green\" style=\"font-weight: 800;\">Jhelum</span>."
  },
  {
    id: "jkg_6",
    difficulty: "Medium",
    tags: ["JK Geography"],
    question: "The Shivalik range in J&K is mainly found in:",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Ladakh" },
      { id: 'b', label: 'B', text: "Jammu region" },
      { id: 'c', label: 'C', text: "Kashmir Valley" },
      { id: 'd', label: 'D', text: "Zanskar" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Shivaliks</span> form the outermost Himalayas, mostly in <span class=\"text-green\" style=\"font-weight: 800;\">Jammu foothills</span>."
  },
  {
    id: "jkg_7",
    difficulty: "Medium",
    tags: ["JK Geography"],
    question: "Which soil type is dominant in Kashmir Valley?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Laterite" },
      { id: 'b', label: 'B', text: "Alluvial" },
      { id: 'c', label: 'C', text: "Desert soil" },
      { id: 'd', label: 'D', text: "Black soil" }
    ],
    explanation: "Valley floor has fertile <span class=\"text-blue\" style=\"font-weight: 800;\">alluvial soil</span> deposited by <span class=\"text-green\" style=\"font-weight: 800;\">rivers</span>."
  },
  {
    id: "jkg_8",
    difficulty: "Medium",
    tags: ["JK Geography"],
    question: "Dachigam National Park is famous for:",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Snow Leopard" },
      { id: 'b', label: 'B', text: "Hangul" },
      { id: 'c', label: 'C', text: "Yak" },
      { id: 'd', label: 'D', text: "Red Panda" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Hangul</span> (Kashmir stag) is endemic and conserved in <span class=\"text-green\" style=\"font-weight: 800;\">Dachigam</span>."
  },
  {
    id: "jkg_9",
    difficulty: "Medium",
    tags: ["JK Geography"],
    question: "Which river does NOT originate in J&K?",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "Jhelum" },
      { id: 'b', label: 'B', text: "Chenab" },
      { id: 'c', label: 'C', text: "Ravi" },
      { id: 'd', label: 'D', text: "Beas" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Beas</span> originates in <span class=\"text-green\" style=\"font-weight: 800;\">Himachal Pradesh</span>, while others pass through or originate in J&K."
  },
  {
    id: "jkg_10",
    difficulty: "Medium",
    tags: ["JK Geography"],
    question: "The Pir Panjal range separates:",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Jammu & Ladakh" },
      { id: 'b', label: 'B', text: "Kashmir Valley & Ladakh" },
      { id: 'c', label: 'C', text: "Jammu & Kashmir Valley" },
      { id: 'd', label: 'D', text: "Zanskar & Ladakh" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Pir Panjal</span> acts as a climatic and physical barrier between <span class=\"text-green\" style=\"font-weight: 800;\">Jammu plains and Kashmir Valley</span>."
  },
  {
    id: "jkh_1",
    difficulty: "Medium",
    tags: ["JK History"],
    question: "Who was the founder of the Dogra dynasty in J&K?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Gulab Singh" },
      { id: 'b', label: 'B', text: "Ranbir Singh" },
      { id: 'c', label: 'C', text: "Hari Singh" },
      { id: 'd', label: 'D', text: "Zorawar Singh" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Gulab Singh</span> became ruler after the <span class=\"text-green\" style=\"font-weight: 800;\">Treaty of Amritsar</span> (1846)."
  },
  {
    id: "jkh_2",
    difficulty: "Medium",
    tags: ["JK History"],
    question: "Treaty of Amritsar (1846) was signed between:",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "British & Maharaja Ranjit Singh" },
      { id: 'b', label: 'B', text: "British & Gulab Singh" },
      { id: 'c', label: 'C', text: "Sikhs & Afghans" },
      { id: 'd', label: 'D', text: "Mughals & Dogras" }
    ],
    explanation: "British sold Kashmir to <span class=\"text-blue\" style=\"font-weight: 800;\">Gulab Singh</span> for <span class=\"text-green\" style=\"font-weight: 800;\">75 lakh rupees</span>."
  },
  {
    id: "jkh_3",
    difficulty: "Medium",
    tags: ["JK History"],
    question: "Who was the last ruler of princely state of J&K?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Gulab Singh" },
      { id: 'b', label: 'B', text: "Ranbir Singh" },
      { id: 'c', label: 'C', text: "Hari Singh" },
      { id: 'd', label: 'D', text: "Karan Singh" }
    ],
    explanation: "He signed the <span class=\"text-blue\" style=\"font-weight: 800;\">Instrument of Accession</span> in <span class=\"text-green\" style=\"font-weight: 800;\">1947</span>."
  },
  {
    id: "jkh_4",
    difficulty: "Medium",
    tags: ["JK History"],
    question: "The “Quit Kashmir Movement” (1946) was led by:",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Sheikh Abdullah" },
      { id: 'b', label: 'B', text: "Jawaharlal Nehru" },
      { id: 'c', label: 'C', text: "Hari Singh" },
      { id: 'd', label: 'D', text: "Bakshi Ghulam Mohammad" }
    ],
    explanation: "Movement was against <span class=\"text-blue\" style=\"font-weight: 800;\">Dogra rule</span> demanding <span class=\"text-green\" style=\"font-weight: 800;\">democratic reforms</span>."
  },
  {
    id: "jkh_5",
    difficulty: "Medium",
    tags: ["JK History"],
    question: "Zorawar Singh is known for:",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Land reforms" },
      { id: 'b', label: 'B', text: "Military expeditions in Ladakh & Tibet" },
      { id: 'c', label: 'C', text: "Treaty negotiations" },
      { id: 'd', label: 'D', text: "Religious reforms" }
    ],
    explanation: "He expanded <span class=\"text-blue\" style=\"font-weight: 800;\">Dogra rule</span> into <span class=\"text-green\" style=\"font-weight: 800;\">Ladakh and Baltistan</span>."
  },
  {
    id: "jkh_6",
    difficulty: "Medium",
    tags: ["JK History"],
    question: "Ranbir Penal Code (RPC) was introduced by:",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Gulab Singh" },
      { id: 'b', label: 'B', text: "Ranbir Singh" },
      { id: 'c', label: 'C', text: "Hari Singh" },
      { id: 'd', label: 'D', text: "Sheikh Abdullah" }
    ],
    explanation: "RPC was modeled on <span class=\"text-blue\" style=\"font-weight: 800;\">IPC</span> and applied in <span class=\"text-green\" style=\"font-weight: 800;\">J&K</span>."
  },
  {
    id: "jkh_7",
    difficulty: "Medium",
    tags: ["JK History"],
    question: "Kashmir became part of India in:",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "1946" },
      { id: 'b', label: 'B', text: "1947" },
      { id: 'c', label: 'C', text: "1950" },
      { id: 'd', label: 'D', text: "1952" }
    ],
    explanation: "Accession happened on <span class=\"text-blue\" style=\"font-weight: 800;\">26 October 1947</span>."
  },
  {
    id: "jkh_8",
    difficulty: "Medium",
    tags: ["JK History"],
    question: "Who led the National Conference?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Gulab Singh" },
      { id: 'b', label: 'B', text: "Sheikh Abdullah" },
      { id: 'c', label: 'C', text: "Hari Singh" },
      { id: 'd', label: 'D', text: "Prem Nath Dogra" }
    ],
    explanation: "He was the <span class=\"text-blue\" style=\"font-weight: 800;\">central political figure</span> in modern <span class=\"text-green\" style=\"font-weight: 800;\">Kashmir</span>."
  },
  {
    id: "jkh_9",
    difficulty: "Medium",
    tags: ["JK History"],
    question: "The capital of Dogra rulers during winter was:",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Srinagar" },
      { id: 'b', label: 'B', text: "Leh" },
      { id: 'c', label: 'C', text: "Jammu" },
      { id: 'd', label: 'D', text: "Anantnag" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Jammu</span> was winter capital; <span class=\"text-green\" style=\"font-weight: 800;\">Srinagar</span> summer capital."
  },
  {
    id: "jkh_10",
    difficulty: "Medium",
    tags: ["JK History"],
    question: "Which event triggered accession of J&K to India?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "British withdrawal" },
      { id: 'b', label: 'B', text: "Tribal invasion from Pakistan" },
      { id: 'c', label: 'C', text: "Internal revolt" },
      { id: 'd', label: 'D', text: "Economic crisis" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Pakistan-backed tribal invasion</span> forced Hari Singh to seek <span class=\"text-green\" style=\"font-weight: 800;\">India’s help</span>."
  },
  {
    id: "jkh_11",
    difficulty: "Medium",
    tags: ["JK History"],
    question: "The famous Lohar Devta Temple is in which district of Union Territory of Jammu & Kashmir?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Shopian" },
      { id: 'b', label: 'B', text: "Poonch" },
      { id: 'c', label: 'C', text: "Pulwama" },
      { id: 'd', label: 'D', text: "Anantnag" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Lohar Devta Temple</span> is a significant religious site located in the <span class=\"text-green\" style=\"font-weight: 800;\">Pulwama</span> district."
  },
];

export const staticJKAffairsBank = questions.map(q => ({
  ...q,
  category_id: "jk-affairs"
}));
