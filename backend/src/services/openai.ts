// openai.ts
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// ---- Load schema ----
const schemaPath = path.join(__dirname, '../../schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

// ---- Model choice ----
// Balance of speed + precision for narrative extraction
const MODEL = 'gpt-4o'; // swap to 'o3-mini' if you need deeper reasoning

// ---- Helpers ----
function buildMenu(drinks: any[]) {
  return drinks.map((d: any) => `${d.name}: ${d.tags.join(', ')}`).join('\n');
}

function allowedNameSet(drinks: any[]) {
  return new Set(drinks.map((d: any) => d.name));
}

function extractDrinkName(text: string): string | null {
  const m = text.match(/^\s*DRINK:\s*(.+)\s*$/mi);
  return m ? m[1].trim() : null;
}

// Optional alias map for common off-menu hallucinations / synonyms
const NAME_ALIASES: Record<string, string> = {
  'Yuzu Tonic': 'Summer Tonic',
  'yuzu tonic': 'Summer Tonic',
  'Yuzu Espresso Tonic': 'Summer Tonic',
  'Latte': 'Latte/Flat White',
  'Flat White': 'Latte/Flat White'
};

function normalizeToAllowed(name: string, allowed: Set<string>): string | null {
  const mapped = NAME_ALIASES[name] ?? name;
  if (allowed.has(mapped)) return mapped;

  // Fuzzy fallback (Levenshtein)
  const arr = Array.from(allowed);
  let bestName = '';
  let bestDist = Infinity;
  const a = mapped.toLowerCase();
  for (const cand of arr) {
    const d = levenshtein(a, cand.toLowerCase());
    if (d < bestDist) { bestDist = d; bestName = cand; }
  }
  return bestDist <= 6 ? bestName : null; // conservative threshold
}

function levenshtein(a: string, b: string) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

// ---- Questions: one at a time ----
const QUESTION_POOL = [
  'Tell me about your best cafe memory.',
  'What tastes are you chasing today?',
  'Describe your perfect first sip.',
  'What do you want to taste last after it’s gone?',
  'What tiny detail would make you smile?',
  'What’s a flavor you’ve been curious about lately?',
  'What would you change about your usual?'
];

// ---- System prompt builder ----
function buildSystemPrompt(filteredMenu: string, allowedNames: string[]) {
  return `You are a drink specialist at an outdoor cafe.
Ask ONE short, open, vessel-style question at a time — no parentheses, no labels — then wait.
Interpret narrative answers using the schema's tags.

MENU (descriptions):
${filteredMenu}

ALLOWED_DRINK_NAMES (exact strings):
${allowedNames.join(' | ')}

Hard rules:
- You MUST pick exactly one name from ALLOWED_DRINK_NAMES. Never invent names.
- If a citrus tonic fits, the correct pick is "Summer Tonic".
- Do NOT mention or reference items not in ALLOWED_DRINK_NAMES anywhere.

You MUST ask AT LEAST 4 questions before recommending.
Ask one at a time from this list (no repeats):
1) Tell me about your best cafe memory.
2) What tastes are you chasing today?
3) Describe your perfect first sip.
4) What do you want to taste last after it’s gone?
5) What tiny detail would make you smile?
6) What’s a flavor you’ve been curious about lately?
7) What would you change about your usual?

When ready to recommend, output EXACTLY:
DRINK: [Name only]
WHY: [Under 10 words, casual tone]
CONFIDENCE: [1-10]`;
}

// ---- OpenAI client ----
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
if (!process.env.OPENAI_API_KEY) {
  console.error('⚠️  OPENAI_API_KEY missing');
}

// ---- Public API ----
export async function getNextQuestion(messages: any[]) {
  const allowed = schema.drinks; // no UI filtering
  if (!allowed.length) throw new Error('No drinks available from schema.');
  const allowedNames = allowed.map((d: any) => d.name);
  const MENU = buildMenu(allowed);
  const SYSTEM_PROMPT = buildSystemPrompt(MENU, allowedNames);

  // Helpful trace
  console.log('Allowed names:', allowedNames);

  const resp = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    temperature: 0.7,
    max_completion_tokens: 120,
    stream: false
  });

  return resp.choices[0].message.content;
}

export async function getFinalRecommendation(messages: any[]) {
  const allowed = schema.drinks; // no UI filtering
  if (!allowed.length) throw new Error('No drinks available from schema.');
  const allowedNames = allowed.map((d: any) => d.name);
  const allowedSet = allowedNameSet(allowed);
  const MENU = buildMenu(allowed);
  const SYSTEM_PROMPT = buildSystemPrompt(MENU, allowedNames);

  // Nudge the model to decide now
  const decisiveMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages,
    { role: 'user', content: 'Make the final pick now.' }
  ];

  const resp = await openai.chat.completions.create({
    model: MODEL,
    messages: decisiveMessages,
    temperature: 0.5,
    max_completion_tokens: 150,
    stream: false
  });

  let out = resp.choices[0].message.content ?? '';
  let picked = extractDrinkName(out);

  // Hard guard: enforce menu
  if (!picked || !allowedSet.has(picked)) {
    const normalized = picked ? normalizeToAllowed(picked, allowedSet) : null;
    if (normalized) {
      // Local rewrite
      out = out.replace(/^\s*DRINK:\s*.*$/mi, `DRINK: ${normalized}`);
    } else {
      // One repair pass that *forces* a valid choice
      const repair = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
          { role: 'assistant', content: out },
          { role: 'user', content: `The drink you chose is NOT in ALLOWED_DRINK_NAMES. Choose one of: ${allowedNames.join(' | ')}. Output exactly in the required format.` }
        ],
        temperature: 0.3,
        max_completion_tokens: 120,
        stream: false
      });
      out = repair.choices[0].message.content ?? out;
    }
  }

  return out;
}
