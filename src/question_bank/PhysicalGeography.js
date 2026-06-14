const questions = [
  {
    id: "geo_p_1",
    difficulty: "Medium",
    tags: ["Atmosphere"],
    question: "Which layer of the atmosphere contains the Ionosphere?",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "Troposphere" },
      { id: 'b', label: 'B', text: "Stratosphere" },
      { id: 'c', label: 'C', text: "Mesosphere" },
      { id: 'd', label: 'D', text: "Thermosphere" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Ionosphere</span> is a part of the <span class=\"text-green\" style=\"font-weight: 800;\">Thermosphere</span> and is responsible for radio communication."
  },
  {
    id: "geo_p_2",
    difficulty: "Easy",
    tags: ["Earth's Structure"],
    question: "What is the outermost layer of the Earth?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Crust" },
      { id: 'b', label: 'B', text: "Mantle" },
      { id: 'c', label: 'C', text: "Outer Core" },
      { id: 'd', label: 'D', text: "Inner Core" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Crust</span> is the thin, rocky outermost shell of Earth, ranging from <span class=\"text-green\" style=\"font-weight: 800;\">5km to 70km</span> in thickness."
  },
  {
    id: "geo_p_3",
    difficulty: "Medium",
    tags: ["Rocks"],
    question: "Basalt is an example of which type of rock?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Sedimentary" },
      { id: 'b', label: 'B', text: "Igneous" },
      { id: 'c', label: 'C', text: "Metamorphic" },
      { id: 'd', label: 'D', text: "Organic" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Basalt</span> is an extrusive <span class=\"text-green\" style=\"font-weight: 800;\">igneous rock</span> formed from the rapid cooling of magnesium-rich and iron-rich lava."
  },
  {
    id: "geo_p_4",
    difficulty: "Hard",
    tags: ["Winds"],
    question: "What are the local hot winds in the North Indian plains called during summer?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Chinook" },
      { id: 'b', label: 'B', text: "Mistral" },
      { id: 'c', label: 'C', text: "Loo" },
      { id: 'd', label: 'D', text: "Foehn" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Loo</span> is a strong, dusty, gusty, hot and dry summer wind from the <span class=\"text-green\" style=\"font-weight: 800;\">west</span>."
  },
  {
    id: "geo_p_5",
    difficulty: "Medium",
    tags: ["Oceans"],
    question: "Which is the largest and deepest ocean on Earth?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Pacific Ocean" },
      { id: 'b', label: 'B', text: "Atlantic Ocean" },
      { id: 'c', label: 'C', text: "Indian Ocean" },
      { id: 'd', label: 'D', text: "Arctic Ocean" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Pacific Ocean</span> covers about one-third of the Earth's surface and contains the <span class=\"text-green\" style=\"font-weight: 800;\">Mariana Trench</span>."
  },
  {
    id: "geo_p_6",
    difficulty: "Hard",
    tags: ["Solar System"],
    question: "Which planet is known as the 'Morning Star' or 'Evening Star'?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Mars" },
      { id: 'b', label: 'B', text: "Venus" },
      { id: 'c', label: 'C', text: "Mercury" },
      { id: 'd', label: 'D', text: "Jupiter" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Venus</span> is the brightest natural object in the night sky after the Moon, often seen around <span class=\"text-green\" style=\"font-weight: 800;\">sunrise or sunset</span>."
  },
  {
    id: "geo_p_7",
    difficulty: "Medium",
    tags: ["Landforms"],
    question: "What is a piece of land surrounded by water on three sides called?",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "Island" },
      { id: 'b', label: 'B', text: "Isthmus" },
      { id: 'c', label: 'C', text: "Strait" },
      { id: 'd', label: 'D', text: "Peninsula" }
    ],
    explanation: "A <span class=\"text-blue\" style=\"font-weight: 800;\">Peninsula</span> (e.g., India) is surrounded by water on three sides and connected to a <span class=\"text-green\" style=\"font-weight: 800;\">mainland</span>."
  },
  {
    id: "geo_p_8",
    difficulty: "Easy",
    tags: ["Earth's Motion"],
    question: "The seasons on Earth are caused by:",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Earth's Rotation" },
      { id: 'b', label: 'B', text: "Earth's Distance from Sun" },
      { id: 'c', label: 'C', text: "Earth's Axial Tilt" },
      { id: 'd', label: 'D', text: "Ocean Currents" }
    ],
    explanation: "Earth's <span class=\"text-blue\" style=\"font-weight: 800;\">23.5° axial tilt</span> combined with its revolution around the Sun causes the <span class=\"text-green\" style=\"font-weight: 800;\">changing seasons</span>."
  },
  {
    id: "geo_p_9",
    difficulty: "Hard",
    tags: ["Hydrosphere"],
    question: "What is the average salinity of the world's oceans?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "30 parts per thousand" },
      { id: 'b', label: 'B', text: "35 parts per thousand" },
      { id: 'c', label: 'C', text: "40 parts per thousand" },
      { id: 'd', label: 'D', text: "25 parts per thousand" }
    ],
    explanation: "The average salinity is about <span class=\"text-blue\" style=\"font-weight: 800;\">3.5%</span> or <span class=\"text-green\" style=\"font-weight: 800;\">35 g of salt per 1000 g</span> of water."
  },
  {
    id: "geo_p_10",
    difficulty: "Medium",
    tags: ["Climate"],
    question: "What instrument is used to measure atmospheric pressure?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Barometer" },
      { id: 'b', label: 'B', text: "Hygrometer" },
      { id: 'c', label: 'C', text: "Anemometer" },
      { id: 'd', label: 'D', text: "Seismograph" }
    ],
    explanation: "A <span class=\"text-blue\" style=\"font-weight: 800;\">Barometer</span> measures the <span class=\"text-green\" style=\"font-weight: 800;\">pressure</span> exerted by the weight of air."
  }
];

export const staticPhysicalGeographyBank = questions.map(q => ({
  ...q,
  category_id: "physical-geography"
}));
