// openai.ts
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// ---- Load schema (v2.2+) ----
const schemaPath = path.join(__dirname, '../../schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

// ---- Model choice ----
// Balance of speed + precision for narrative extraction:
const MODEL = 'gpt-4o'; // solid upgrade from 4o-mini for longer, nuanced answers
// If you want extra-deep intent extraction, swap to 'o3-mini' (slower/$$).

// ---- UI filter: enforce iced/hot + caffeine before the model ever sees items ----
type UIFlags = {
  temp?: 'iced' | 'hot' | 'any';
  caffeine?: 'any' | 'no_caffeine' | 'caffeinated_only';
};

function filterDrinksForUI(all: any[], ui: UIFlags) {
  return all.filter((d) => {
    if (ui.temp && ui.temp !== 'any' && !(d.forms || []).includes(ui.temp)) return false;
    if (ui.caffeine === 'no_caffeine' && d.caffeine_profile !== 'no-caffeine') return false;
    if (ui.caffeine === 'caffeinated_only' && d.caffeine_profile === 'no-caffeine') return false;
    return true;
  });
}

function buildMenu(drinks: any[]) {
  return drinks.map((d: any) => `${d.name}: ${d.tags.join(', ')}`).join('\n');
}

// ---- Questions: ask exactly one at a time (your locked set) ----
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
function buildSystemPrompt(filteredMenu: string) {
  return `You are a drink specialist at an outdoor cafe.
Ask ONE short, open, vessel-style question at a time — no parentheses, no labels — then wait.
Interpret narrative answers using the schema's tags. Recommend ONE drink from MENU.

MENU:
${filteredMenu}

IMPORTANT: You MUST ask AT LEAST 4 questions before making a recommendation.
Do NOT output a DRINK recommendation until you have gathered at least 4 responses.

Question rules:
- Only pick from this question list; ask exactly one at a time:
${QUESTION_POOL.map((q, i) => `${i + 1}. ${q}`).join('\n')}
- Encourage story-like answers. No stacked questions.
- Ask questions that haven't been asked yet.

Scoring hints (summarized):
- Citrus/zest/clean/crisp/tonic → sour + citrus + not-milky (tonics).
- Foam/silk/hug/round/vanilla/maple → creamy + cozy (lattes/hojicha/matcha).
- "Not sweet/clean" → slightly-sweet/medium-sweet only. "Dessert/treat" → sweet.
- "Curious about yuzu/tonic" nudges adventurous/tonic options if tags fit.

Only after 4+ questions, when ready to recommend, output EXACTLY:
DRINK: [Name only]
WHY: [Under 10 words, casual tone]
CONFIDENCE: [1-10]`;
}

// ---- Public API ----
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

if (!process.env.OPENAI_API_KEY) {
  console.error('⚠️  OPENAI_API_KEY missing');
}

// Ask the next question (model chooses which one to ask next from the pool)
export async function getNextQuestion(messages: any[], ui: UIFlags) {
  const allowed = filterDrinksForUI(schema.drinks, ui);
  const MENU = buildMenu(allowed);
  const SYSTEM_PROMPT = buildSystemPrompt(MENU);

  const resp = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    temperature: 0.7,
    max_completion_tokens: 120, // correct param for modern models
    stream: false
  });

  return resp.choices[0].message.content;
}

// Make the final recommendation using the same context (call when you’re ready to pick)
export async function getFinalRecommendation(messages: any[], ui: UIFlags) {
  const allowed = filterDrinksForUI(schema.drinks, ui);
  const MENU = buildMenu(allowed);
  const SYSTEM_PROMPT = buildSystemPrompt(MENU);

  // Nudge the model to stop asking and decide now
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

  return resp.choices[0].message.content;
}
