const questions = [
  {
    id: "sci_stat_1",
    difficulty: "Hard",
    tags: ["Physics", "Thermodynamics", "Concept", "PYQ: JKSSB FAA 2023"],
    question: "Calculate the work done $W$ by an ideal gas expanding isothermally from volume $V_1$ to $V_2$ at temperature $T$.",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "$W = nRT(V_2 - V_1)$" },
      { id: 'b', label: 'B', text: "$W = nRT \\ln(\\frac{V_2}{V_1})$" },
      { id: 'c', label: 'C', text: "$W = P(V_2 - V_1)$" },
      { id: 'd', label: 'D', text: "$W = \\frac{nRT}{V_2 - V_1}$" }
    ],
    explanation: "For an isothermal process, $T$ is constant. The work done is given by $W = \\int_{V_1}^{V_2} P \\, dV = nRT \\ln(\\frac{V_2}{V_1})$."
  },
  {
    id: "sci_stat_2",
    difficulty: "Easy",
    tags: ["Physics", "Mechanics", "PYQ: SSC CGL 2022"],
    question: "Which of the following represents Newton's Second Law of Motion?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Every action has an equal and opposite reaction." },
      { id: 'b', label: 'B', text: "$v = u + at$" },
      { id: 'c', label: 'C', text: "$F = ma$" },
      { id: 'd', label: 'D', text: "An object at rest stays at rest." }
    ],
    explanation: "Newton's Second Law states $F = ma$."
  },
  {
    id: "sci_stat_3",
    difficulty: "Easy",
    tags: ["Chemistry", "Atomic Structure", "PYQ: JKSSB FAA 2022"],
    question: "What is the atomic number of Carbon?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "6" },
      { id: 'b', label: 'B', text: "12" },
      { id: 'c', label: 'C', text: "14" },
      { id: 'd', label: 'D', text: "8" }
    ],
    explanation: "Carbon has 6 protons, so its atomic number is 6."
  },
  {
    id: "sci_stat_4",
    difficulty: "Easy",
    tags: ["Biology", "Cell Biology", "PYQ: SSC CGL 2023"],
    question: "Which organelle is known as the powerhouse of the cell?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Nucleus" },
      { id: 'b', label: 'B', text: "Mitochondria" },
      { id: 'c', label: 'C', text: "Ribosome" },
      { id: 'd', label: 'D', text: "Endoplasmic Reticulum" }
    ],
    explanation: "Mitochondria generate most of the cell's supply of ATP, used as a source of chemical energy."
  },
  {
    id: "sci_stat_5",
    difficulty: "Easy",
    tags: ["Physics", "Optics"],
    question: "What is the speed of light in a vacuum?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "$3 \\times 10^8 \\text{ m/s}$" },
      { id: 'b', label: 'B', text: "$3 \\times 10^5 \\text{ m/s}$" },
      { id: 'c', label: 'C', text: "$3 \\times 10^6 \\text{ m/s}$" },
      { id: 'd', label: 'D', text: "$3 \\times 10^9 \\text{ m/s}$" }
    ],
    explanation: "The speed of light in a vacuum is approximately $3 \\times 10^8 \\text{ m/s}$."
  },
  {
    id: "sci_stat_6",
    difficulty: "Easy",
    tags: ["Chemistry", "Acids and Bases"],
    question: "What is the pH of pure water at $25^\\circ\\text{C}$?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "0" },
      { id: 'b', label: 'B', text: "7" },
      { id: 'c', label: 'C', text: "14" },
      { id: 'd', label: 'D', text: "10" }
    ],
    explanation: "Pure water is neutral, with a pH of 7 at $25^\\circ\\text{C}$."
  },
  {
    id: "sci_stat_7",
    difficulty: "Easy",
    tags: ["Biology", "Human Anatomy"],
    question: "How many bones are in the adult human body?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "208" },
      { id: 'b', label: 'B', text: "205" },
      { id: 'c', label: 'C', text: "206" },
      { id: 'd', label: 'D', text: "210" }
    ],
    explanation: "The adult human skeleton is made up of 206 bones."
  },
  {
    id: "sci_stat_8",
    difficulty: "Medium",
    tags: ["Physics", "Electromagnetism"],
    question: "What is the SI unit of electrical resistance?",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "Volt" },
      { id: 'b', label: 'B', text: "Ampere" },
      { id: 'c', label: 'C', text: "Joule" },
      { id: 'd', label: 'D', text: "Ohm" }
    ],
    explanation: "The ohm (symbol: $\\Omega$) is the SI derived unit of electrical resistance."
  },
  {
    id: "sci_stat_9",
    difficulty: "Medium",
    tags: ["Chemistry", "Periodic Table"],
    question: "Which of the following is a noble gas?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Nitrogen" },
      { id: 'b', label: 'B', text: "Argon" },
      { id: 'c', label: 'C', text: "Oxygen" },
      { id: 'd', label: 'D', text: "Hydrogen" }
    ],
    explanation: "Argon is a noble gas, found in Group 18 of the periodic table."
  },
  {
    id: "sci_stat_10",
    difficulty: "Easy",
    tags: ["Biology", "Botany"],
    question: "What is the process by which plants make their food?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Respiration" },
      { id: 'b', label: 'B', text: "Transpiration" },
      { id: 'c', label: 'C', text: "Photosynthesis" },
      { id: 'd', label: 'D', text: "Digestion" }
    ],
    explanation: "Photosynthesis is the process used by plants, algae and certain bacteria to harness energy from sunlight and turn it into chemical energy."
  },
  {
    id: "sci_stat_11",
    difficulty: "Medium",
    tags: ["Physics", "Kinematics"],
    question: "Acceleration is defined as the rate of change of:",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Velocity" },
      { id: 'b', label: 'B', text: "Distance" },
      { id: 'c', label: 'C', text: "Speed" },
      { id: 'd', label: 'D', text: "Displacement" }
    ],
    explanation: "Acceleration is the rate of change of velocity of an object with respect to time."
  },
  {
    id: "sci_stat_12",
    difficulty: "Medium",
    tags: ["Chemistry", "States of Matter"],
    question: "The process of a solid changing directly into a gas is called:",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Evaporation" },
      { id: 'b', label: 'B', text: "Condensation" },
      { id: 'c', label: 'C', text: "Sublimation" },
      { id: 'd', label: 'D', text: "Melting" }
    ],
    explanation: "Sublimation is the transition of a substance directly from the solid to the gas state, without passing through the liquid state."
  }
];

export const staticScienceBank = questions.map(q => ({
  ...q,
  category_id: "general-science"
}));
