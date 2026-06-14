const questions = [
  {
    id: "env_1",
    difficulty: "Easy",
    tags: ["Biodiversity"],
    question: "Which of the following is known as the 'Lungs of the World'?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Western Ghats" },
      { id: 'b', label: 'B', text: "Amazon Rainforest" },
      { id: 'c', label: 'C', text: "Taiga Forest" },
      { id: 'd', label: 'D', text: "Sundarbans" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Amazon</span> produces roughly <span class=\"text-green\" style=\"font-weight: 800;\">20% of Earth's oxygen</span>."
  },
  {
    id: "env_2",
    difficulty: "Medium",
    tags: ["Pollution"],
    question: "Which gas is primarily responsible for the 'Greenhouse Effect'?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Nitrogen" },
      { id: 'b', label: 'B', text: "Oxygen" },
      { id: 'c', label: 'C', text: "Carbon Dioxide" },
      { id: 'd', label: 'D', text: "Argon" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">CO2</span> traps heat in the atmosphere, leading to <span class=\"text-green\" style=\"font-weight: 800;\">Global Warming</span>."
  },
  {
    id: "env_3",
    difficulty: "Medium",
    tags: ["Conservation"],
    question: "The 'Kyoto Protocol' is associated with:",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Climate Change" },
      { id: 'b', label: 'B', text: "Ozone Depletion" },
      { id: 'c', label: 'C', text: "Wetlands" },
      { id: 'd', label: 'D', text: "Nuclear Waste" }
    ],
    explanation: "Adopted in 1997, it aimed to reduce <span class=\"text-blue\" style=\"font-weight: 800;\">Greenhouse Gas</span> emissions to fight <span class=\"text-green\" style=\"font-weight: 800;\">Climate Change</span>."
  },
  {
    id: "env_4",
    difficulty: "Easy",
    tags: ["Ozone Layer"],
    question: "Which layer of the atmosphere contains the Ozone layer?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Troposphere" },
      { id: 'b', label: 'B', text: "Stratosphere" },
      { id: 'c', label: 'C', text: "Mesosphere" },
      { id: 'd', label: 'D', text: "Thermosphere" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Stratosphere</span> protects us by absorbing harmful <span class=\"text-green\" style=\"font-weight: 800;\">UV radiation</span>."
  },
  {
    id: "env_5",
    difficulty: "Medium",
    tags: ["Ecology"],
    question: "What is the primary source of energy for most ecosystems?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Geothermal Heat" },
      { id: 'b', label: 'B', text: "Chemical Energy" },
      { id: 'c', label: 'C', text: "Sunlight" },
      { id: 'd', label: 'D', text: "Wind" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Sun</span> provides energy for <span class=\"text-green\" style=\"font-weight: 800;\">Photosynthesis</span>, the base of most food chains."
  },
  {
    id: "env_6",
    difficulty: "Hard",
    tags: ["Red Data Book"],
    question: "Which organization publishes the 'Red Data Book'?",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "WWF" },
      { id: 'b', label: 'B', text: "UNEP" },
      { id: 'c', label: 'C', text: "Greenpeace" },
      { id: 'd', label: 'D', text: "IUCN" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">IUCN</span> Red List tracks the global conservation status of <span class=\"text-green\" style=\"font-weight: 800;\">biological species</span>."
  },
  {
    id: "env_7",
    difficulty: "Medium",
    tags: ["Wetlands"],
    question: "The 'Ramsar Convention' is related to the conservation of:",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Drylands" },
      { id: 'b', label: 'B', text: "Wetlands" },
      { id: 'c', label: 'C', text: "Oceans" },
      { id: 'd', label: 'D', text: "Forests" }
    ],
    explanation: "Signed in <span class=\"text-blue\" style=\"font-weight: 800;\">Ramsar, Iran</span> in 1971, it focuses on the sustainable use of <span class=\"text-green\" style=\"font-weight: 800;\">Wetlands</span>."
  },
  {
    id: "env_8",
    difficulty: "Easy",
    tags: ["Days"],
    question: "When is 'World Environment Day' celebrated annually?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "June 5" },
      { id: 'b', label: 'B', text: "April 22" },
      { id: 'c', label: 'C', text: "September 16" },
      { id: 'd', label: 'D', text: "October 4" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">June 5th</span> is the UN's principal vehicle for encouraging worldwide awareness for the <span class=\"text-green\" style=\"font-weight: 800;\">environment</span>."
  },
  {
    id: "env_9",
    difficulty: "Hard",
    tags: ["Agriculture"],
    question: "The process of enrichment of water by nutrients is called:",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Nitrification" },
      { id: 'b', label: 'B', text: "Desalination" },
      { id: 'c', label: 'C', text: "Eutrophication" },
      { id: 'd', label: 'D', text: "Acidification" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Eutrophication</span> often leads to <span class=\"text-green\" style=\"font-weight: 800;\">Algal Blooms</span> and oxygen depletion in water bodies."
  },
  {
    id: "env_10",
    difficulty: "Medium",
    tags: ["Renewable Energy"],
    question: "Which of the following is NOT a greenhouse gas?",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "Methane" },
      { id: 'b', label: 'B', text: "Nitrous Oxide" },
      { id: 'c', label: 'C', text: "Water Vapor" },
      { id: 'd', label: 'D', text: "Nitrogen" }
    ],
    explanation: "While <span class=\"text-blue\" style=\"font-weight: 800;\">Nitrogen</span> makes up 78% of the air, it is <span class=\"text-green\" style=\"font-weight: 800;\">not a greenhouse gas</span>."
  }
];

export const staticEnvironmentBank = questions.map(q => ({
  ...q,
  category_id: "environment"
}));
