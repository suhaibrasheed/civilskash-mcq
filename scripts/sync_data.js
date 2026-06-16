import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
const STATE_FILE = path.join(TARGET_DIR, 'last_sync.json');

// Helper to normalize the category key to filename-safe format
const getCategoryFilename = (catId) => {
  return catId.toLowerCase().replace(/[^a-z0-9_-]/g, '');
};

async function syncData() {
  try {
    console.log('Starting Supabase Database-to-Code Incremental Sync...');

    // Ensure target directory exists
    if (!fs.existsSync(TARGET_DIR)) {
      fs.mkdirSync(TARGET_DIR, { recursive: true });
    }

    // Determine the last sync timestamp
    let lastSyncAt = '1970-01-01T00:00:00.000Z';
    if (fs.existsSync(STATE_FILE)) {
      try {
        const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
        if (state && state.last_sync_at) {
          lastSyncAt = state.last_sync_at;
          console.log(`Loaded last sync timestamp: ${lastSyncAt}`);
        }
      } catch (e) {
        console.warn(`Warning: Could not parse state file. Defaulting to epoch. Error: ${e.message}`);
      }
    } else {
      console.log(`State file not found. Performing full/epoch-based fetch...`);
    }

    // 1. Fetch only updated Questions
    console.log(`Fetching questions updated since ${lastSyncAt}...`);
    const { data: updatedQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .gt('updated_at', lastSyncAt);

    if (questionsError) throw questionsError;

    const hasQuestionUpdates = updatedQuestions && updatedQuestions.length > 0;
    if (hasQuestionUpdates) {
      console.log(`Fetched ${updatedQuestions.length} updated questions.`);
    } else {
      console.log('No new question updates found.');
    }

    // 2. Fetch and compile Exams (Always fetch since exams are tiny, but only write if changed)
    console.log('Fetching exams from Supabase...');
    const { data: exams, error: examsError } = await supabase
      .from('exams')
      .select('*');

    if (examsError) throw examsError;

    const visibleExams = (exams || []).filter(
      (exam) => exam.status !== 'hidden' && exam.status !== 'unpublished'
    );

    const examsPath = path.join(TARGET_DIR, 'exams.json');
    let existingExams = [];
    if (fs.existsSync(examsPath)) {
      try {
        existingExams = JSON.parse(fs.readFileSync(examsPath, 'utf-8'));
      } catch (e) {
        existingExams = [];
      }
    }

    let examsChanged = false;
    if (JSON.stringify(visibleExams) !== JSON.stringify(existingExams)) {
      fs.writeFileSync(examsPath, JSON.stringify(visibleExams, null, 2), 'utf-8');
      console.log(`Successfully compiled and updated ${visibleExams.length} exams into ${examsPath}`);
      examsChanged = true;
    } else {
      console.log('No changes detected in exams.');
    }

    // If no questions updated and no exams updated, exit cleanly without touching sync state
    if (!hasQuestionUpdates && !examsChanged) {
      console.log('No new updates found for questions or exams. Exiting cleanly.');
      return;
    }

    let maxUpdatedAt = lastSyncAt;

    // 3. Process the updated questions & categories (if any)
    if (hasQuestionUpdates) {
      const files = fs.readdirSync(TARGET_DIR);
      const categoryFiles = files.filter(
        (file) => file.endsWith('.json') && file !== 'exams.json' && file !== 'last_sync.json'
      );

      const categoriesData = {};
      for (const file of categoryFiles) {
        const filenameKey = file.replace('.json', '');
        try {
          const content = fs.readFileSync(path.join(TARGET_DIR, file), 'utf-8');
          categoriesData[filenameKey] = JSON.parse(content);
        } catch (e) {
          categoriesData[filenameKey] = [];
        }
      }

      const modifiedCategories = new Set();

      for (const q of updatedQuestions) {
        const targetCatId = q.category_id || 'general';
        const targetFilenameKey = getCategoryFilename(targetCatId);

        // Track the maximum updated_at timestamp among successfully fetched questions
        if (q.updated_at && new Date(q.updated_at) > new Date(maxUpdatedAt)) {
          maxUpdatedAt = q.updated_at;
        }

        // Remove this question from any category it might currently reside in
        for (const filenameKey of Object.keys(categoriesData)) {
          const index = categoriesData[filenameKey].findIndex((item) => item.id === q.id);
          if (index !== -1) {
            categoriesData[filenameKey].splice(index, 1);
            modifiedCategories.add(filenameKey);
          }
        }

        // If the updated question is published, add/insert it into its target category
        if (q.status === 'published') {
          if (!categoriesData[targetFilenameKey]) {
            categoriesData[targetFilenameKey] = [];
          }

          const normalized = {
            id: q.id,
            category_id: targetCatId,
            tags: Array.isArray(q.tags) ? q.tags : [],
            difficulty: q.difficulty || null,
            question: q.question,
            correctId: q.correct_id || 'a',
            options: Array.isArray(q.options) ? q.options : [],
            explanation: q.explanation || '',
            pyq: q.pyq || null,
            created_at: q.created_at
          };

          categoriesData[targetFilenameKey].push(normalized);
          modifiedCategories.add(targetFilenameKey);
        }
      }

      // Write only the modified categories back to disk (sorted by created_at desc)
      for (const filenameKey of modifiedCategories) {
        const filePath = path.join(TARGET_DIR, `${filenameKey}.json`);
        const data = categoriesData[filenameKey] || [];

        if (data.length === 0) {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Deleted empty category file: ${filenameKey}.json`);
          }
        } else {
          data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
          console.log(`Updated category file: ${filenameKey}.json (${data.length} questions)`);
        }
      }
    }

    // 4. Regenerate registry.js based on current files
    const updatedFiles = fs.readdirSync(TARGET_DIR);
    const registryEntries = [];

    for (const file of updatedFiles) {
      if (file.endsWith('.json') && file !== 'exams.json' && file !== 'last_sync.json') {
        const filePath = path.join(TARGET_DIR, file);
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          if (Array.isArray(content) && content.length > 0) {
            const catId = content[0].category_id || file.replace('.json', '');
            registryEntries.push(`  "${catId}": () => import('./${file}')`);
          } else {
            const catId = file.replace('.json', '');
            registryEntries.push(`  "${catId}": () => import('./${file}')`);
          }
        } catch (e) {
          const catId = file.replace('.json', '');
          registryEntries.push(`  "${catId}": () => import('./${file}')`);
        }
      }
    }

    const registryContent = `// Automatically generated by scripts/sync_data.js. Do not edit manually.
export const CATEGORY_LOADERS = {
${registryEntries.join(',\n')}
};
`;
    const registryPath = path.join(TARGET_DIR, 'registry.js');
    let existingRegistry = '';
    if (fs.existsSync(registryPath)) {
      existingRegistry = fs.readFileSync(registryPath, 'utf-8');
    }

    if (registryContent !== existingRegistry) {
      fs.writeFileSync(registryPath, registryContent, 'utf-8');
      console.log(`Successfully generated dynamic import registry at ${registryPath}`);
    }

    // 5. Update the Sync State (Only if questions were updated)
    if (hasQuestionUpdates && maxUpdatedAt !== lastSyncAt) {
      fs.writeFileSync(
        STATE_FILE,
        JSON.stringify({ last_sync_at: maxUpdatedAt }, null, 2),
        'utf-8'
      );
      console.log(`Sync state updated to ${maxUpdatedAt} in ${STATE_FILE}`);
    }

    console.log('Database-to-Code sync completed successfully.');
  } catch (err) {
    console.error('Fatal sync error:', err);
    process.exit(1);
  }
}

syncData();
