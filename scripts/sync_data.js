import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const TARGET_DIR = path.resolve(__dirname, '../src/question_bank');

// Helper to normalize the category key to filename-safe format
const getCategoryFilename = (catId) => {
  return catId.toLowerCase().replace(/[^a-z0-9_-]/g, '');
};

async function syncData() {
  try {
    console.log('Starting Supabase Database-to-Code Sync...');
    
    // Ensure target directory exists
    if (!fs.existsSync(TARGET_DIR)) {
      fs.mkdirSync(TARGET_DIR, { recursive: true });
    }

    // 1. Fetch and compile Exams
    console.log('Fetching exams from Supabase...');
    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select('*');

    if (examsError) throw examsError;

    const visibleExams = (exams || []).filter(
      (exam) => exam.status !== 'hidden' && exam.status !== 'unpublished'
    );

    const examsPath = path.join(TARGET_DIR, 'exams.json');
    fs.writeFileSync(examsPath, JSON.stringify(visibleExams, null, 2), 'utf-8');
    console.log(`Successfully compiled ${visibleExams.length} exams into ${examsPath}`);

    // 2. Fetch and compile Questions
    console.log('Fetching published questions from Supabase...');
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, category_id, question, options, correct_id, explanation, difficulty, tags, pyq, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (questionsError) throw questionsError;

    const questionsList = questions || [];
    console.log(`Fetched ${questionsList.length} published questions.`);

    // Group questions by category_id
    const groupedQuestions = {};
    questionsList.forEach((q) => {
      const catId = q.category_id || 'general';
      if (!groupedQuestions[catId]) {
        groupedQuestions[catId] = [];
      }
      
      // Normalize question object format
      groupedQuestions[catId].push({
        id: q.id,
        category_id: catId,
        tags: Array.isArray(q.tags) ? q.tags : [],
        difficulty: q.difficulty || null,
        question: q.question,
        correctId: q.correct_id || q.correctId || 'a',
        options: Array.isArray(q.options) ? q.options : [],
        explanation: q.explanation || '',
        pyq: q.pyq || null,
        created_at: q.created_at
      });
    });

    // Define the 18 categories and their original static JS filenames
    const CATEGORY_MAP = {
      'accountancy': 'Accountancy.js',
      'ancient-history': 'AncientHistory.js',
      'computer-awareness': 'ComputerAwareness.js',
      'current-affairs': 'CurrentAffairs.js',
      'english': 'English.js',
      'environment': 'Environment.js',
      'general-science': 'GeneralScience.js',
      'indian-economy': 'IndianEconomy.js',
      'indian-geography': 'IndianGeography.js',
      'indian-polity': 'IndianPolity.js',
      'jk-affairs': 'JKAffairs.js',
      'maths': 'Maths.js',
      'medieval-history': 'MedievalHistory.js',
      'modern-history': 'ModernHistory.js',
      'physical-geography': 'PhysicalGeography.js',
      'reasoning': 'Reasoning.js',
      'static-gk': 'StaticGK.js',
      'world-geography': 'WorldGeography.js'
    };

    const registryEntries = [];

    for (const [catId, jsFilename] of Object.entries(CATEGORY_MAP)) {
      let mergedQuestions = [];
      const jsPath = path.join(TARGET_DIR, jsFilename);

      // 1. If static JS file exists, import questions from it
      if (fs.existsSync(jsPath)) {
        try {
          const module = await import(pathToFileURL(jsPath).href);
          const keys = Object.keys(module);
          const arrayKey = keys.find(k => Array.isArray(module[k]));
          if (arrayKey) {
            const staticQuestions = module[arrayKey].map(q => ({
              id: q.id,
              category_id: catId,
              tags: Array.isArray(q.tags) ? q.tags : [],
              difficulty: q.difficulty || null,
              question: q.question,
              correctId: q.correctId || q.correct_id || 'a',
              correct_id: q.correctId || q.correct_id || 'a',
              options: Array.isArray(q.options) ? q.options : [],
              explanation: q.explanation || '',
              pyq: q.pyq || null,
              created_at: q.created_at || new Date(0).toISOString()
            }));
            mergedQuestions.push(...staticQuestions);
            console.log(`Loaded ${staticQuestions.length} static questions from ${jsFilename}`);
          }
        } catch (err) {
          console.error(`Failed to load static file ${jsFilename}:`, err);
        }
      }

      // 2. Merge database questions (preferring DB version if duplicate ID exists)
      const dbQuestions = groupedQuestions[catId] || [];
      dbQuestions.forEach(dbQ => {
        const normalizedDbQ = {
          id: dbQ.id,
          category_id: catId,
          tags: dbQ.tags,
          difficulty: dbQ.difficulty,
          question: dbQ.question,
          correctId: dbQ.correctId || dbQ.correct_id || 'a',
          correct_id: dbQ.correctId || dbQ.correct_id || 'a',
          options: dbQ.options,
          explanation: dbQ.explanation,
          pyq: dbQ.pyq,
          created_at: dbQ.created_at
        };

        const existingIdx = mergedQuestions.findIndex(q => q.id === dbQ.id);
        if (existingIdx !== -1) {
          mergedQuestions[existingIdx] = normalizedDbQ;
        } else {
          mergedQuestions.push(normalizedDbQ);
        }
      });

      // 3. Write compiled questions to JSON
      const jsonFilename = `${catId}.json`;
      const jsonPath = path.join(TARGET_DIR, jsonFilename);
      fs.writeFileSync(jsonPath, JSON.stringify(mergedQuestions, null, 2), 'utf-8');
      console.log(`Successfully compiled category "${catId}" -> ${jsonFilename} (${mergedQuestions.length} total questions)`);

      // 4. Register in registry
      registryEntries.push(`  "${catId}": () => import('./${jsonFilename}')`);

      // 5. Clean up the old JS file (if it exists) to avoid duplicates/mismatch
      if (fs.existsSync(jsPath)) {
        fs.unlinkSync(jsPath);
        console.log(`Deleted deprecated file ${jsFilename}`);
      }
    }

    // Write registry.js
    const registryContent = `// Automatically generated by scripts/sync_data.js. Do not edit manually.
export const CATEGORY_LOADERS = {
${registryEntries.join(',\n')}
};
`;
    const registryPath = path.join(TARGET_DIR, 'registry.js');
    fs.writeFileSync(registryPath, registryContent, 'utf-8');
    console.log(`Successfully generated dynamic import registry at ${registryPath}`);

    console.log('Database-to-Code sync completed successfully.');
  } catch (err) {
    console.error('Fatal sync error:', err);
    process.exit(1);
  }
}

syncData();
