const questions = [
  {
    id: "comp_1",
    difficulty: "Easy",
    tags: ["Basics"],
    question: "What is the full form of CPU?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Central Processing Unit" },
      { id: 'b', label: 'B', text: "Central Programming Unit" },
      { id: 'c', label: 'C', text: "Computer Processing Unit" },
      { id: 'd', label: 'D', text: "Central Peripheral Unit" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">CPU</span> is often called the <span class=\"text-green\" style=\"font-weight: 800;\">brain of the computer</span>."
  },
  {
    id: "comp_2",
    difficulty: "Medium",
    tags: ["Memory"],
    question: "Which of the following is a volatile memory?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "ROM" },
      { id: 'b', label: 'B', text: "RAM" },
      { id: 'c', label: 'C', text: "Hard Disk" },
      { id: 'd', label: 'D', text: "SSD" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">RAM</span> loses its data when the <span class=\"text-green\" style=\"font-weight: 800;\">power is turned off</span>."
  },
  {
    id: "comp_3",
    difficulty: "Medium",
    tags: ["Networking"],
    question: "What does HTTP stand for?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "HyperText Transfer Protocol" },
      { id: 'b', label: 'B', text: "HyperText Type Protocol" },
      { id: 'c', label: 'C', text: "HyperText Transfer Protocol" },
      { id: 'd', label: 'D', text: "HighText Transfer Protocol" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">HTTP</span> is the foundation of data communication for the <span class=\"text-green\" style=\"font-weight: 800;\">World Wide Web</span>."
  },
  {
    id: "comp_4",
    difficulty: "Easy",
    tags: ["Software"],
    question: "Which of the following is an operating system?",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "MS Word" },
      { id: 'b', label: 'B', text: "Google Chrome" },
      { id: 'c', label: 'C', text: "VLC Player" },
      { id: 'd', label: 'D', text: "Linux" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Linux</span> is a family of open-source <span class=\"text-green\" style=\"font-weight: 800;\">operating systems</span>."
  },
  {
    id: "comp_5",
    difficulty: "Hard",
    tags: ["Security"],
    question: "What is 'Phishing'?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Attempt to obtain sensitive info by disguising as a trustworthy entity" },
      { id: 'b', label: 'B', text: "A type of computer virus" },
      { id: 'c', label: 'C', text: "A programming language" },
      { id: 'd', label: 'D', text: "A hardware component" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Phishing</span> is a cyber attack that uses <span class=\"text-green\" style=\"font-weight: 800;\">email or malicious websites</span> to steal data."
  },
  {
    id: "comp_6",
    difficulty: "Medium",
    tags: ["Storage"],
    question: "One Terabyte (TB) is equal to:",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "1024 Megabytes" },
      { id: 'b', label: 'B', text: "1024 Gigabytes" },
      { id: 'c', label: 'C', text: "1000 Gigabytes" },
      { id: 'd', label: 'D', text: "1024 Kilobytes" }
    ],
    explanation: "In binary systems, <span class=\"text-blue\" style=\"font-weight: 800;\">1 TB = 1024 GB</span>."
  },
  {
    id: "comp_7",
    difficulty: "Medium",
    tags: ["Input/Output"],
    question: "Which of the following is both an input and output device?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Keyboard" },
      { id: 'b', label: 'B', text: "Monitor" },
      { id: 'c', label: 'C', text: "Touch Screen" },
      { id: 'd', label: 'D', text: "Printer" }
    ],
    explanation: "A <span class=\"text-blue\" style=\"font-weight: 800;\">Touch Screen</span> accepts input through touch and <span class=\"text-green\" style=\"font-weight: 800;\">displays output</span>."
  },
  {
    id: "comp_8",
    difficulty: "Hard",
    tags: ["Database"],
    question: "What does SQL stand for?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Structured Query Language" },
      { id: 'b', label: 'B', text: "Standard Query Language" },
      { id: 'c', label: 'C', text: "Simple Query Language" },
      { id: 'd', label: 'D', text: "Sequential Query Language" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">SQL</span> is used for managing and manipulating <span class=\"text-green\" style=\"font-weight: 800;\">relational databases</span>."
  },
  {
    id: "comp_9",
    difficulty: "Easy",
    tags: ["Generations"],
    question: "Which component was used in the First Generation of computers?",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "Transistors" },
      { id: 'b', label: 'B', text: "Integrated Circuits" },
      { id: 'c', label: 'C', text: "Microprocessors" },
      { id: 'd', label: 'D', text: "Vacuum Tubes" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Vacuum Tubes</span> were the primary components of <span class=\"text-green\" style=\"font-weight: 800;\">first-generation computers</span> like ENIAC."
  },
  {
    id: "comp_10",
    difficulty: "Medium",
    tags: ["Extensions"],
    question: "What is the file extension of a PowerPoint presentation?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: ".docx" },
      { id: 'b', label: 'B', text: ".pptx" },
      { id: 'c', label: 'C', text: ".xlsx" },
      { id: 'd', label: 'D', text: ".pdf" }
    ],
    explanation: "Microsoft PowerPoint uses the <span class=\"text-blue\" style=\"font-weight: 800;\">.pptx</span> extension for modern <span class=\"text-green\" style=\"font-weight: 800;\">presentations</span>."
  }
];

export const staticComputerAwarenessBank = questions.map(q => ({
  ...q,
  category_id: "computer-awareness"
}));
