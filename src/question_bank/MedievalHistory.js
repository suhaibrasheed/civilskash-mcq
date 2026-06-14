const questions = [
  {
    id: "med_1",
    difficulty: "Medium",
    tags: ["Delhi Sultanate"],
    question: "Who was the first female ruler of the Delhi Sultanate?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Chand Bibi" },
      { id: 'b', label: 'B', text: "Razia Sultan" },
      { id: 'c', label: 'C', text: "Nur Jahan" },
      { id: 'd', label: 'D', text: "Rani Padmini" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Razia Sultan</span>, daughter of Iltutmish, was the only <span class=\"text-green\" style=\"font-weight: 800;\">female ruler</span> of the Delhi Sultanate."
  },
  {
    id: "med_2",
    difficulty: "Easy",
    tags: ["Mughal Empire"],
    question: "Who was the founder of the Mughal Empire in India?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Babur" },
      { id: 'b', label: 'B', text: "Humayun" },
      { id: 'c', label: 'C', text: "Akbar" },
      { id: 'd', label: 'D', text: "Sher Shah Suri" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Babur</span> defeated Ibrahim Lodi in the <span class=\"text-green\" style=\"font-weight: 800;\">First Battle of Panipat (1526)</span> to establish the Mughal Empire."
  },
  {
    id: "med_3",
    difficulty: "Medium",
    tags: ["Monuments"],
    question: "The Qutub Minar was completed by which ruler?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Qutb-ud-din Aibak" },
      { id: 'b', label: 'B', text: "Alauddin Khalji" },
      { id: 'c', label: 'C', text: "Iltutmish" },
      { id: 'd', label: 'D', text: "Firoz Shah Tughlaq" }
    ],
    explanation: "While Qutb-ud-din Aibak started it, <span class=\"text-blue\" style=\"font-weight: 800;\">Iltutmish</span> completed the <span class=\"text-green\" style=\"font-weight: 800;\">Qutub Minar</span>."
  },
  {
    id: "med_4",
    difficulty: "Hard",
    tags: ["Marathas"],
    question: "In which year was Shivaji Maharaj crowned as Chhatrapati?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "1664" },
      { id: 'b', label: 'B', text: "1674" },
      { id: 'c', label: 'C', text: "1684" },
      { id: 'd', label: 'D', text: "1700" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Shivaji Maharaj</span> was crowned at Raigad Fort in <span class=\"text-green\" style=\"font-weight: 800;\">1674</span>."
  },
  {
    id: "med_5",
    difficulty: "Medium",
    tags: ["Bhakti Movement"],
    question: "Which Bhakti saint was a contemporary of Shivaji?",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "Kabir" },
      { id: 'b', label: 'B', text: "Tulsidas" },
      { id: 'c', label: 'C', text: "Chaitanya Mahaprabhu" },
      { id: 'd', label: 'D', text: "Sant Tukaram" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Sant Tukaram</span> was a 17th-century poet-saint and a <span class=\"text-green\" style=\"font-weight: 800;\">contemporary</span> of Shivaji."
  },
  {
    id: "med_6",
    difficulty: "Hard",
    tags: ["Vijayanagara"],
    question: "Who was the most famous ruler of the Vijayanagara Empire?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Krishnadevaraya" },
      { id: 'b', label: 'B', text: "Harihara I" },
      { id: 'c', label: 'C', text: "Bukka Raya I" },
      { id: 'd', label: 'D', text: "Devaraya II" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Krishnadevaraya</span> (1509–1529) presided over the golden age of the <span class=\"text-green\" style=\"font-weight: 800;\">Vijayanagara Empire</span>."
  },
  {
    id: "med_7",
    difficulty: "Medium",
    tags: ["Administration"],
    question: "The 'Zabt' system of land revenue was introduced by:",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Sher Shah Suri" },
      { id: 'b', label: 'B', text: "Akbar" },
      { id: 'c', label: 'C', text: "Raja Todar Mal" },
      { id: 'd', label: 'D', text: "Malik Ambar" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Raja Todar Mal</span>, Akbar's finance minister, developed the <span class=\"text-green\" style=\"font-weight: 800;\">Zabt/Dahshala system</span>."
  },
  {
    id: "med_8",
    difficulty: "Easy",
    tags: ["Travelers"],
    question: "Ibn Battuta visited India during the reign of which Sultan?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Alauddin Khalji" },
      { id: 'b', label: 'B', text: "Muhammad bin Tughlaq" },
      { id: 'c', label: 'C', text: "Ghiyasuddin Tughlaq" },
      { id: 'd', label: 'D', text: "Sikandar Lodi" }
    ],
    explanation: "The Moroccan traveler <span class=\"text-blue\" style=\"font-weight: 800;\">Ibn Battuta</span> reached India in 1333 during <span class=\"text-green\" style=\"font-weight: 800;\">Muhammad bin Tughlaq's</span> reign."
  },
  {
    id: "med_9",
    difficulty: "Hard",
    tags: ["Battles"],
    question: "The Second Battle of Tarain (1192) was fought between:",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Prithviraj Chauhan and Muhammad Ghori" },
      { id: 'b', label: 'B', text: "Babur and Ibrahim Lodi" },
      { id: 'c', label: 'C', text: "Humayun and Sher Shah" },
      { id: 'd', label: 'D', text: "Akbar and Hemu" }
    ],
    explanation: "Muhammad Ghori's victory in the <span class=\"text-blue\" style=\"font-weight: 800;\">Second Battle of Tarain</span> paved the way for <span class=\"text-green\" style=\"font-weight: 800;\">Muslim rule</span> in India."
  },
  {
    id: "med_10",
    difficulty: "Medium",
    tags: ["Religion"],
    question: "Who founded the 'Din-i-Ilahi'?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Babur" },
      { id: 'b', label: 'B', text: "Humayun" },
      { id: 'c', label: 'C', text: "Akbar" },
      { id: 'd', label: 'D', text: "Aurangzeb" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Akbar</span> introduced <span class=\"text-green\" style=\"font-weight: 800;\">Din-i-Ilahi</span> (Divine Faith) in 1582 as a syncretic religion."
  }
];

export const staticMedievalHistoryBank = questions.map(q => ({
  ...q,
  category_id: "medieval-history"
}));
