const questions = [
  {
    id: "pol_1",
    difficulty: "Easy",
    tags: ["Constitution"],
    question: "Who was the chairman of the Drafting Committee of the Indian Constitution?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Dr. Rajendra Prasad" },
      { id: 'b', label: 'B', text: "Dr. B.R. Ambedkar" },
      { id: 'c', label: 'C', text: "Jawaharlal Nehru" },
      { id: 'd', label: 'D', text: "Sardar Vallabhbhai Patel" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Dr. B.R. Ambedkar</span> is known as the <span class=\"text-green\" style=\"font-weight: 800;\">Father of the Indian Constitution</span>."
  },
  {
    id: "pol_2",
    difficulty: "Medium",
    tags: ["Fundamental Rights"],
    question: "Which article of the Indian Constitution empowers the Supreme Court to issue writs?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Article 226" },
      { id: 'b', label: 'B', text: "Article 44" },
      { id: 'c', label: 'C', text: "Article 32" },
      { id: 'd', label: 'D', text: "Article 21" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Article 32</span> is described by Ambedkar as the <span class=\"text-green\" style=\"font-weight: 800;\">'Heart and Soul'</span> of the Constitution."
  },
  {
    id: "pol_3",
    difficulty: "Medium",
    tags: ["Directive Principles"],
    question: "The concept of 'Welfare State' is found in which part of the Indian Constitution?",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "Preamble" },
      { id: 'b', label: 'B', text: "Fundamental Rights" },
      { id: 'c', label: 'C', text: "Fundamental Duties" },
      { id: 'd', label: 'D', text: "Directive Principles of State Policy" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">DPSPs</span> (Part IV) aim at establishing a <span class=\"text-green\" style=\"font-weight: 800;\">Social and Economic democracy</span>."
  },
  {
    id: "pol_4",
    difficulty: "Easy",
    tags: ["President"],
    question: "What is the minimum age required to become the President of India?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "25 years" },
      { id: 'b', label: 'B', text: "30 years" },
      { id: 'c', label: 'C', text: "35 years" },
      { id: 'd', label: 'D', text: "40 years" }
    ],
    explanation: "Under <span class=\"text-blue\" style=\"font-weight: 800;\">Article 58</span>, a person must be at least <span class=\"text-green\" style=\"font-weight: 800;\">35 years</span> of age to be eligible for election as President."
  },
  {
    id: "pol_5",
    difficulty: "Medium",
    tags: ["Panchayati Raj"],
    question: "Which Constitutional Amendment Act gave constitutional status to Panchayati Raj Institutions?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "73rd Amendment Act" },
      { id: 'b', label: 'B', text: "74th Amendment Act" },
      { id: 'c', label: 'C', text: "42nd Amendment Act" },
      { id: 'd', label: 'D', text: "44th Amendment Act" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">73rd Amendment Act of 1992</span> added <span class=\"text-green\" style=\"font-weight: 800;\">Part IX</span> to the Constitution."
  },
  {
    id: "pol_6",
    difficulty: "Hard",
    tags: ["Emergency"],
    question: "Which Article deals with 'Financial Emergency'?",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "Article 352" },
      { id: 'b', label: 'B', text: "Article 356" },
      { id: 'c', label: 'C', text: "Article 350" },
      { id: 'd', label: 'D', text: "Article 360" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Article 360</span> provides for Financial Emergency, which has <span class=\"text-green\" style=\"font-weight: 800;\">never been declared</span> in India so far."
  },
  {
    id: "pol_7",
    difficulty: "Medium",
    tags: ["Parliament"],
    question: "The 'Joint Sitting' of both Houses of Parliament is presided over by:",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "President of India" },
      { id: 'b', label: 'B', text: "Speaker of Lok Sabha" },
      { id: 'c', label: 'C', text: "Chairman of Rajya Sabha" },
      { id: 'd', label: 'D', text: "Prime Minister" }
    ],
    explanation: "While the President calls the joint sitting, it is <span class=\"text-blue\" style=\"font-weight: 800;\">presided over</span> by the <span class=\"text-green\" style=\"font-weight: 800;\">Speaker</span>."
  },
  {
    id: "pol_8",
    difficulty: "Easy",
    tags: ["Citizenship"],
    question: "In which year was the Citizenship Act passed?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "1955" },
      { id: 'b', label: 'B', text: "1950" },
      { id: 'c', label: 'C', text: "1947" },
      { id: 'd', label: 'D', text: "1960" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Citizenship Act, 1955</span> provides for the acquisition and termination of Indian <span class=\"text-green\" style=\"font-weight: 800;\">citizenship</span>."
  },
  {
    id: "pol_9",
    difficulty: "Medium",
    tags: ["Elections"],
    question: "The 'Model Code of Conduct' for political parties is issued by:",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Supreme Court" },
      { id: 'b', label: 'B', text: "Parliament" },
      { id: 'c', label: 'C', text: "Election Commission of India" },
      { id: 'd', label: 'D', text: "Ministry of Law" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">ECI</span> ensures free and fair elections by enforcing the <span class=\"text-green\" style=\"font-weight: 800;\">Model Code of Conduct</span>."
  },
  {
    id: "pol_10",
    difficulty: "Hard",
    tags: ["Amendments"],
    question: "Which Amendment is known as the 'Mini-Constitution' of India?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "44th Amendment" },
      { id: 'b', label: 'B', text: "42nd Amendment" },
      { id: 'c', label: 'C', text: "24th Amendment" },
      { id: 'd', label: 'D', text: "73rd Amendment" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">42nd Amendment Act (1976)</span> brought massive changes and is called the <span class=\"text-green\" style=\"font-weight: 800;\">Mini-Constitution</span>."
  }
];

export const staticIndianPolityBank = questions.map(q => ({
  ...q,
  category_id: "indian-polity"
}));
