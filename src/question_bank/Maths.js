const questions = [
  {
    id: "math_1",
    difficulty: "Easy",
    tags: ["Percentage"],
    question: "What is 20% of 150?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "25" },
      { id: 'b', label: 'B', text: "30" },
      { id: 'c', label: 'C', text: "35" },
      { id: 'd', label: 'D', text: "40" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">20% of 150</span> is calculated as <span class=\"text-green\" style=\"font-weight: 800;\">(20/100) * 150 = 30</span>."
  },
  {
    id: "math_2",
    difficulty: "Medium",
    tags: ["Profit and Loss"],
    question: "A person buys an article for ₹500 and sells it for ₹600. What is the profit percentage?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "10%" },
      { id: 'b', label: 'B', text: "15%" },
      { id: 'c', label: 'C', text: "20%" },
      { id: 'd', label: 'D', text: "25%" }
    ],
    explanation: "Profit = ₹100. <span class=\"text-blue\" style=\"font-weight: 800;\">Profit % = (100/500) * 100</span>, which equals <span class=\"text-green\" style=\"font-weight: 800;\">20%</span>."
  },
  {
    id: "math_3",
    difficulty: "Medium",
    tags: ["Averages"],
    question: "The average of first five prime numbers is:",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "5.6" },
      { id: 'b', label: 'B', text: "5.4" },
      { id: 'c', label: 'C', text: "5.8" },
      { id: 'd', label: 'D', text: "6" }
    ],
    explanation: "First five primes are <span class=\"text-blue\" style=\"font-weight: 800;\">2, 3, 5, 7, 11</span>. Sum = 28. Average = <span class=\"text-green\" style=\"font-weight: 800;\">28/5 = 5.6</span>."
  },
  {
    id: "math_4",
    difficulty: "Easy",
    tags: ["Ratio and Proportion"],
    question: "If A:B = 2:3 and B:C = 4:5, find A:C.",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "2:5" },
      { id: 'b', label: 'B', text: "4:15" },
      { id: 'c', label: 'C', text: "1:2" },
      { id: 'd', label: 'D', text: "8:15" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">A/C = (A/B) * (B/C)</span> = (2/3) * (4/5) = <span class=\"text-green\" style=\"font-weight: 800;\">8/15</span>."
  },
  {
    id: "math_5",
    difficulty: "Hard",
    tags: ["Time and Work"],
    question: "A can do a work in 10 days and B in 15 days. In how many days can they do it together?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "5" },
      { id: 'b', label: 'B', text: "6" },
      { id: 'c', label: 'C', text: "7" },
      { id: 'd', label: 'D', text: "8" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Combined work rate</span> = 1/10 + 1/15 = 5/30 = 1/6. So, they take <span class=\"text-green\" style=\"font-weight: 800;\">6 days</span>."
  },
  {
    id: "math_6",
    difficulty: "Medium",
    tags: ["Simple Interest"],
    question: "Find the Simple Interest on ₹2000 at 5% p.a. for 3 years.",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "₹200" },
      { id: 'b', label: 'B', text: "₹250" },
      { id: 'c', label: 'C', text: "₹300" },
      { id: 'd', label: 'D', text: "₹350" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">SI = (P*R*T)/100</span> = (2000 * 5 * 3)/100 = <span class=\"text-green\" style=\"font-weight: 800;\">₹300</span>."
  },
  {
    id: "math_7",
    difficulty: "Hard",
    tags: ["Geometry"],
    question: "What is the area of a circle with a radius of 7 cm? (Use π = 22/7)",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "154 sq. cm" },
      { id: 'b', label: 'B', text: "144 sq. cm" },
      { id: 'c', label: 'C', text: "164 sq. cm" },
      { id: 'd', label: 'D', text: "132 sq. cm" }
    ],
    explanation: "Area = <span class=\"text-blue\" style=\"font-weight: 800;\">πr²</span> = (22/7) * 7 * 7 = <span class=\"text-green\" style=\"font-weight: 800;\">154 sq. cm</span>."
  },
  {
    id: "math_8",
    difficulty: "Medium",
    tags: ["Number System"],
    question: "Which of the following is a prime number?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "21" },
      { id: 'b', label: 'B', text: "27" },
      { id: 'c', label: 'C', text: "31" },
      { id: 'd', label: 'D', text: "35" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">31</span> has only two factors, 1 and itself, so it is a <span class=\"text-green\" style=\"font-weight: 800;\">prime number</span>."
  },
  {
    id: "math_9",
    difficulty: "Medium",
    tags: ["Speed, Time and Distance"],
    question: "A train moves at 72 km/h. What is its speed in m/s?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "15" },
      { id: 'b', label: 'B', text: "20" },
      { id: 'c', label: 'C', text: "25" },
      { id: 'd', label: 'D', text: "30" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">To convert km/h to m/s</span>, multiply by 5/18. 72 * (5/18) = <span class=\"text-green\" style=\"font-weight: 800;\">20 m/s</span>."
  },
  {
    id: "math_10",
    difficulty: "Hard",
    tags: ["Algebra"],
    question: "Solve for x: 3x + 5 = 20.",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "5" },
      { id: 'b', label: 'B', text: "15" },
      { id: 'c', label: 'C', text: "7.5" },
      { id: 'd', label: 'D', text: "4" }
    ],
    explanation: "3x = 15, so <span class=\"text-blue\" style=\"font-weight: 800;\">x = 15/3</span> which equals <span class=\"text-green\" style=\"font-weight: 800;\">5</span>."
  }
];

export const staticMathsBank = questions.map(q => ({
  ...q,
  category_id: "maths"
}));
