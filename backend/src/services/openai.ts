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
const MODEL = 'gpt-4o';

// ---- STRICT MENU ENFORCEMENT ----
// These are the ONLY drinks allowed - no exceptions
const STRICT_ALLOWED_DRINKS = [
  'Summer Tonic',
  'Latte',
  'Maple Latte',
  'Matcha Latte',
  'Strawberry Matcha Latte',
  'Blueberry Matcha Latte',
  'Matcha Cloud'
];

// Common hallucinations to catch and redirect
const HALLUCINATION_MAP: Record<string, string> = {
  // Flat White variations -> Latte
  'Flat White': 'Latte',
  'flat white': 'Latte',
  'Flatwhite': 'Latte',
  'FlatWhite': 'Latte',
  
  // Yuzu/Citrus variations -> Summer Tonic
  'Yuzu Tonic': 'Summer Tonic',
  'yuzu tonic': 'Summer Tonic',
  'Yuzu Espresso Tonic': 'Summer Tonic',
  'Citrus Tonic': 'Summer Tonic',
  'Espresso Tonic': 'Summer Tonic',
  
  // Generic coffee drinks -> Latte
  'Cappuccino': 'Latte',
  'cappuccino': 'Latte',
  'Americano': 'Latte',
  'americano': 'Latte',
  'Cortado': 'Latte',
  'cortado': 'Latte',
  
  // Matcha variations
  'Iced Matcha': 'Matcha Latte',
  'Hot Matcha': 'Matcha Latte',
  'Matcha': 'Matcha Latte',
  
  // Berry variations
  'Berry Matcha': 'Strawberry Matcha Latte',
  'Mixed Berry Matcha': 'Strawberry Matcha Latte'
};

// ---- Helpers ----
function buildMenu(drinks: any[]) {
  return drinks.map((d: any) => `${d.name}: ${d.tags.join(', ')}`).join('\n');
}

function extractDrinkName(text: string): string | null {
  const m = text.match(/^\s*DRINK:\s*(.+)\s*$/mi);
  return m ? m[1].trim() : null;
}

function strictValidateDrink(name: string | null): string | null {
  if (!name) return null;
  
  // Direct match
  if (STRICT_ALLOWED_DRINKS.includes(name)) {
    return name;
  }
  
  // Check hallucination map
  if (HALLUCINATION_MAP[name]) {
    return HALLUCINATION_MAP[name];
  }
  
  // Case-insensitive match
  const lowerName = name.toLowerCase();
  const found = STRICT_ALLOWED_DRINKS.find(
    d => d.toLowerCase() === lowerName
  );
  if (found) return found;
  
  // Fuzzy match with very strict threshold
  const best = findClosestDrink(name);
  if (best.distance <= 3) { // Very strict threshold
    return best.drink;
  }
  
  return null;
}

function findClosestDrink(input: string): { drink: string; distance: number } {
  let bestDrink = STRICT_ALLOWED_DRINKS[0];
  let bestDistance = Infinity;
  
  const normalizedInput = input.toLowerCase().trim();
  
  for (const drink of STRICT_ALLOWED_DRINKS) {
    const distance = levenshtein(normalizedInput, drink.toLowerCase());
    if (distance < bestDistance) {
      bestDistance = distance;
      bestDrink = drink;
    }
  }
  
  return { drink: bestDrink, distance: bestDistance };
}

function levenshtein(a: string, b: string): number {
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

// ---- System prompt builder ----
function buildSystemPrompt() {
  const menuStr = STRICT_ALLOWED_DRINKS.map((name, i) => 
    `${i + 1}. ${name}`
  ).join('\n');
  
  return `You are a drink specialist at an outdoor cafe. Your job is to recommend ONE drink from our EXACT menu.

CRITICAL RULES:
1. You can ONLY recommend these EXACT drinks (no variations, no other names):
${menuStr}

2. NEVER mention, suggest, or reference ANY drink not on this list.
3. If someone's preferences suggest citrus/tonic, recommend "Summer Tonic" (NOT "Yuzu Tonic" or any other name).
4. If someone wants a simple coffee with milk, recommend "Latte" (NOT "Flat White" or "Cappuccino").
5. You MUST ask AT LEAST 4 questions before recommending.

Ask ONE question at a time from this list (vessel-style, open, no parentheses):
- Tell me about your best cafe memory.
- What tastes are you chasing today?
- Describe your perfect first sip.
- What do you want to taste last after it's gone?
- What tiny detail would make you smile?
- What's a flavor you've been curious about lately?
- What would you change about your usual?

When ready to recommend, output EXACTLY:
DRINK: [Exact name from the list above]
WHY: [Under 10 words, casual tone]
CONFIDENCE: [1-10]

Remember: Only use the EXACT drink names from the numbered list. No exceptions.`;
}

// ---- Validation helper ----
function validateAndFixResponse(response: string): string {
  const drinkName = extractDrinkName(response);
  if (!drinkName) return response;
  
  const validDrink = strictValidateDrink(drinkName);
  if (validDrink && validDrink !== drinkName) {
    // Replace the drink name in the response
    return response.replace(
      /DRINK:\s*.+$/mi,
      `DRINK: ${validDrink}`
    );
  }
  
  return response;
}

// ---- OpenAI client ----
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });
if (!process.env.OPENAI_API_KEY) {
  console.error('⚠️  OPENAI_API_KEY missing');
}

// ---- Public API ----
export async function getNextQuestion(messages: any[]) {
  const SYSTEM_PROMPT = buildSystemPrompt();
  
  console.log('Strict menu enforcement active. Allowed drinks:', STRICT_ALLOWED_DRINKS);
  
  const resp = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    temperature: 0.7,
    max_completion_tokens: 120,
    stream: false
  });

  const content = resp.choices[0].message.content || '';
  
  // Check if response contains a recommendation
  if (content.includes('DRINK:')) {
    return validateAndFixResponse(content);
  }
  
  return content;
}

export async function getFinalRecommendation(messages: any[]) {
  const SYSTEM_PROMPT = buildSystemPrompt();
  
  // Add extra enforcement in the decision prompt
  const enforcementPrompt = `
REMINDER: You MUST choose from ONLY these drinks:
${STRICT_ALLOWED_DRINKS.map((d, i) => `${i + 1}. ${d}`).join('\n')}

Based on the conversation, pick the BEST match from the above list.
Output the EXACT name as shown above.`;
  
  const decisiveMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages,
    { role: 'user', content: 'Make the final pick now.' + enforcementPrompt }
  ];

  const resp = await openai.chat.completions.create({
    model: MODEL,
    messages: decisiveMessages,
    temperature: 0.3, // Lower temp for more consistent output
    max_completion_tokens: 150,
    stream: false
  });

  let output = resp.choices[0].message.content ?? '';
  const drinkName = extractDrinkName(output);
  
  // Validate the drink
  const validDrink = strictValidateDrink(drinkName);
  
  if (!validDrink) {
    // Force a valid selection - pick based on conversation context
    console.warn(`Invalid drink "${drinkName}" detected. Forcing valid selection.`);
    
    // Emergency fallback with explicit instruction
    const repair = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
        { role: 'assistant', content: output },
        { 
          role: 'user', 
          content: `ERROR: "${drinkName}" is NOT on our menu.
          
You MUST choose from EXACTLY these options:
${STRICT_ALLOWED_DRINKS.map((d, i) => `${i + 1}. "${d}"`).join('\n')}

Pick the number and name that best matches the conversation. Output in the required format with the EXACT name.` 
        }
      ],
      temperature: 0.1, // Very low temp for correction
      max_completion_tokens: 120,
      stream: false
    });
    
    output = repair.choices[0].message.content ?? output;
    
    // Final validation
    const finalDrink = extractDrinkName(output);
    const finalValid = strictValidateDrink(finalDrink);
    
    if (!finalValid) {
      // Ultimate fallback - choose based on simple heuristics
      console.error('Final validation failed. Using heuristic fallback.');
      const fallback = selectFallbackDrink(messages);
      output = `DRINK: ${fallback}\nWHY: Based on your preferences\nCONFIDENCE: 5`;
    } else if (finalValid !== finalDrink) {
      output = output.replace(/DRINK:\s*.+$/mi, `DRINK: ${finalValid}`);
    }
  } else if (validDrink !== drinkName) {
    // Fix the drink name
    output = output.replace(/DRINK:\s*.+$/mi, `DRINK: ${validDrink}`);
  }

  return output;
}

// Emergency fallback selector based on conversation keywords
function selectFallbackDrink(messages: any[]): string {
  const conversation = messages.map(m => m.content).join(' ').toLowerCase();
  
  // Simple keyword matching
  if (conversation.includes('matcha')) {
    if (conversation.includes('strawberry')) return 'Strawberry Matcha Latte';
    if (conversation.includes('blueberry')) return 'Blueberry Matcha Latte';
    if (conversation.includes('cloud') || conversation.includes('light')) return 'Matcha Cloud';
    return 'Matcha Latte';
  }
  
  if (conversation.includes('citrus') || conversation.includes('tonic') || 
      conversation.includes('yuzu') || conversation.includes('sour') ||
      conversation.includes('refreshing') || conversation.includes('summer')) {
    return 'Summer Tonic';
  }
  
  if (conversation.includes('maple') || conversation.includes('cozy') || 
      conversation.includes('fall') || conversation.includes('autumn')) {
    return 'Maple Latte';
  }
  
  // Default to regular Latte
  return 'Latte';
}