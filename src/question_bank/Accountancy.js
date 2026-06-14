const questions = [
  {
    id: "acc_1",
    difficulty: "Easy",
    tags: ["Basics"],
    question: "Who is known as the 'Father of Accounting'?",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Adam Smith" },
      { id: 'b', label: 'B', text: "Luca Pacioli" },
      { id: 'c', label: 'C', text: "Marshall" },
      { id: 'd', label: 'D', text: "Piyush Goyal" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Luca Pacioli</span> published the first work on <span class=\"text-green\" style=\"font-weight: 800;\">Double-Entry Bookkeeping</span> in 1494."
  },
  {
    id: "acc_2",
    difficulty: "Medium",
    tags: ["Double Entry"],
    question: "The basic accounting equation is:",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Assets = Liabilities + Equity" },
      { id: 'b', label: 'B', text: "Assets = Liabilities - Equity" },
      { id: 'c', label: 'C', text: "Equity = Assets + Liabilities" },
      { id: 'd', label: 'D', text: "Liabilities = Assets + Equity" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Accounting Equation</span> must always balance in a <span class=\"text-green\" style=\"font-weight: 800;\">double-entry system</span>."
  },
  {
    id: "acc_3",
    difficulty: "Medium",
    tags: ["Journal"],
    question: "The process of recording transactions in a journal is called:",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Posting" },
      { id: 'b', label: 'B', text: "Casting" },
      { id: 'c', label: 'C', text: "Journalizing" },
      { id: 'd', label: 'D', text: "Balancing" }
    ],
    explanation: "<span class=\"text-blue\" style=\"font-weight: 800;\">Journalizing</span> is the first step in the accounting cycle, recorded in <span class=\"text-green\" style=\"font-weight: 800;\">chronological order</span>."
  },
  {
    id: "acc_4",
    difficulty: "Easy",
    tags: ["Ledger"],
    question: "A Ledger is a book of:",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Original Entry" },
      { id: 'b', label: 'B', text: "Final Entry" },
      { id: 'c', label: 'C', text: "Secondary Entry" },
      { id: 'd', label: 'D', text: "Cash Entry" }
    ],
    explanation: "While the Journal is the book of prime entry, the <span class=\"text-blue\" style=\"font-weight: 800;\">Ledger</span> is where transactions are <span class=\"text-green\" style=\"font-weight: 800;\">permanently stored</span>."
  },
  {
    id: "acc_5",
    difficulty: "Medium",
    tags: ["Cash Book"],
    question: "Cash Book is a type of:",
    correctId: 'd',
    options: [
      { id: 'a', label: 'A', text: "Ledger" },
      { id: 'b', label: 'B', text: "Journal" },
      { id: 'c', label: 'C', text: "Trial Balance" },
      { id: 'd', label: 'D', text: "Subsidiary Journal" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Cash Book</span> serves the purpose of both a <span class=\"text-green\" style=\"font-weight: 800;\">journal and a ledger</span>."
  },
  {
    id: "acc_6",
    difficulty: "Hard",
    tags: ["BRS"],
    question: "Bank Reconciliation Statement (BRS) is prepared by:",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Bank" },
      { id: 'b', label: 'B', text: "Creditor" },
      { id: 'c', label: 'C', text: "Account Holder" },
      { id: 'd', label: 'D', text: "Auditor" }
    ],
    explanation: "BRS is prepared by the <span class=\"text-blue\" style=\"font-weight: 800;\">customer</span> to match their cash book balance with the <span class=\"text-green\" style=\"font-weight: 800;\">bank passbook</span>."
  },
  {
    id: "acc_7",
    difficulty: "Hard",
    tags: ["Depreciation"],
    question: "Which method of depreciation provides a constant charge every year?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Straight Line Method" },
      { id: 'b', label: 'B', text: "Written Down Value Method" },
      { id: 'c', label: 'C', text: "Annuity Method" },
      { id: 'd', label: 'D', text: "Sinking Fund Method" }
    ],
    explanation: "In <span class=\"text-blue\" style=\"font-weight: 800;\">SLM</span>, the amount of <span class=\"text-green\" style=\"font-weight: 800;\">depreciation</span> remains fixed throughout the asset's life."
  },
  {
    id: "acc_8",
    difficulty: "Easy",
    tags: ["Errors"],
    question: "Omission of a transaction from recording is an error of:",
    correctId: 'b',
    options: [
      { id: 'a', label: 'A', text: "Commission" },
      { id: 'b', label: 'B', text: "Omission" },
      { id: 'c', label: 'C', text: "Principle" },
      { id: 'd', label: 'D', text: "Compensating" }
    ],
    explanation: "An <span class=\"text-blue\" style=\"font-weight: 800;\">error of omission</span> occurs when a transaction is <span class=\"text-green\" style=\"font-weight: 800;\">completely or partially left out</span>."
  },
  {
    id: "acc_9",
    difficulty: "Medium",
    tags: ["Final Accounts"],
    question: "Gross Profit is calculated in which account?",
    correctId: 'a',
    options: [
      { id: 'a', label: 'A', text: "Trading Account" },
      { id: 'b', label: 'B', text: "Profit & Loss Account" },
      { id: 'c', label: 'C', text: "Balance Sheet" },
      { id: 'd', label: 'D', text: "Cash Flow Statement" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Trading Account</span> shows the result of buying and selling of goods, i.e., <span class=\"text-green\" style=\"font-weight: 800;\">Gross Profit/Loss</span>."
  },
  {
    id: "acc_10",
    difficulty: "Hard",
    tags: ["Concepts"],
    question: "Which concept states that every transaction has a two-fold effect?",
    correctId: 'c',
    options: [
      { id: 'a', label: 'A', text: "Business Entity Concept" },
      { id: 'b', label: 'B', text: "Money Measurement Concept" },
      { id: 'c', label: 'C', text: "Dual Aspect Concept" },
      { id: 'd', label: 'D', text: "Going Concern Concept" }
    ],
    explanation: "The <span class=\"text-blue\" style=\"font-weight: 800;\">Dual Aspect Concept</span> is the foundation of <span class=\"text-green\" style=\"font-weight: 800;\">Double-Entry Accounting</span>."
  }
];

export const staticAccountancyBank = questions.map(q => ({
  ...q,
  category_id: "accountancy"
}));
