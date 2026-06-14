const questions = [
  {
    id: "wgeo_1",
    difficulty: "Easy",
    tags: ["Continents"],
    question: "Which is the smallest continent by land area?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Europe" },
      { id: 'b', label: 'B', text: "Australia" },
      { id: 'c', label: 'C', text: "Antarctica" },
      { id: 'd', label: 'D', text: "South America" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Australia</span> is the smallest continent and is also known as the <span class=\"text-green\" style=\"font-weight: 800;\">Island Continent</span>."
  },
  {
    id: "wgeo_2",
    difficulty: "Medium",
    tags: ["Mountains"],
    question: "Which is the longest mountain range in the world?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Himalayas" },
      { id: 'b', label: 'B', text: "Rockies" },
      { id: 'c', label: 'C', text: "Andes" },
      { id: 'd', label: 'D', text: "Alps" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Andes</span> in South America stretch over <span class=\"text-green\" style=\"font-weight: 800;\">7,000 km</span>."
  },
  {
    id: "wgeo_3",
    difficulty: "Medium",
    tags: ["Oceans"],
    question: "Which ocean is 'S' shaped?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Atlantic Ocean" },
      { id: 'b', label: 'B', text: "Pacific Ocean" },
      { id: 'c', label: 'C', text: "Indian Ocean" },
      { id: 'd', label: 'D', text: "Arctic Ocean" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Atlantic Ocean</span> has a characteristic <span class=\"text-green\" style=\"font-weight: 800;\">S-shape</span> and is the second largest ocean."
  },
  {
    id: "wgeo_4",
    difficulty: "Hard",
    tags: ["Atmosphere"],
    question: "Which layer of the atmosphere is closest to Earth?",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "Stratosphere" },
      { id: 'b', label: 'B', text: "Mesosphere" },
      { id: 'c', label: 'C', text: "Exosphere" },
      { id: 'd', label: 'D', text: "Troposphere" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Troposphere</span> is the lowest layer where all <span class=\"text-green\" style=\"font-weight: 800;\">weather phenomena</span> occur."
  },
  {
    id: "wgeo_5",
    difficulty: "Medium",
    tags: ["Canals"],
    question: "The Panama Canal connects which two oceans?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Atlantic and Indian" },
      { id: 'b', label: 'B', text: "Atlantic and Pacific" },
      { id: 'c', label: 'C', text: "Indian and Pacific" },
      { id: 'd', label: 'D', text: "Arctic and Atlantic" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Panama Canal</span> is a critical waterway connecting the <span class=\"text-green\" style=\"font-weight: 800;\">Atlantic and Pacific</span> oceans."
  },
  {
    id: "wgeo_6",
    difficulty: "Hard",
    tags: ["Lakes"],
    question: "Which is the largest freshwater lake in the world by surface area?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Lake Baikal" },
      { id: 'b', label: 'B', text: "Lake Victoria" },
      { id: 'c', label: 'C', text: "Lake Superior" },
      { id: 'd', label: 'D', text: "Caspian Sea" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Lake Superior</span> is the largest, while Lake Baikal is the deepest and holds the most <span class=\"text-green\" style=\"font-weight: 800;\">freshwater volume</span>."
  },
  {
    id: "wgeo_7",
    difficulty: "Medium",
    tags: ["Volcanoes"],
    question: "The 'Ring of Fire' is associated with which ocean?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Pacific Ocean" },
      { id: 'b', label: 'B', text: "Atlantic Ocean" },
      { id: 'c', label: 'C', text: "Indian Ocean" },
      { id: 'd', label: 'D', text: "Arctic Ocean" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Ring of Fire</span> is a major area in the basin of the <span class=\"text-green\" style=\"font-weight: 800;\">Pacific Ocean</span> where many earthquakes and volcanic eruptions occur."
  },
  {
    id: "wgeo_8",
    difficulty: "Easy",
    tags: ["Time Zones"],
    question: "What is the Prime Meridian line?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "0° Latitude" },
      { id: 'b', label: 'B', text: "0° Longitude" },
      { id: 'c', label: 'C', text: "180° Longitude" },
      { id: 'd', label: 'D', text: "90° North" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Prime Meridian</span> passes through <span class=\"text-green\" style=\"font-weight: 800;\">Greenwich, London</span> and is at 0° longitude."
  },
  {
    id: "wgeo_9",
    difficulty: "Hard",
    tags: ["Islands"],
    question: "Which is the largest island in the world?",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "New Guinea" },
      { id: 'b', label: 'B', text: "Borneo" },
      { id: 'c', label: 'C', text: "Madagascar" },
      { id: 'd', label: 'D', text: "Greenland" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Greenland</span> is the world's largest island, located between the <span class=\"text-green\" style=\"font-weight: 800;\">Arctic and Atlantic</span> oceans."
  },
  {
    id: "wgeo_10",
    difficulty: "Medium",
    tags: ["Rivers"],
    question: "Which river flows through the most countries?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Danube" },
      { id: 'b', label: 'B', text: "Nile" },
      { id: 'c', label: 'C', text: "Amazon" },
      { id: 'd', label: 'D', text: "Mekong" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Danube</span> flows through or forms part of the border of <span class=\"text-green\" style=\"font-weight: 800;\">10 countries</span> in Europe."
  }
];

export const staticWorldGeographyBank = questions.map(q => ({
  ...q,
  category_id: "world-geography"
}));
