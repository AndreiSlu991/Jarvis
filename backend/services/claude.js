import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-sonnet-4-6';

let client = null;
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

async function complete(systemPrompt, userMessage, maxTokens = 2048) {
  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }]
  });
  return res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
}

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON found in model response');
  return JSON.parse(match[0]);
}

export async function generateDailyBriefing(userData) {
  const system =
    'You are Jarvis, a personal assistant. Write a short, motivating morning briefing in markdown. ' +
    'Sections: greeting, habits to focus on today, open tasks, a one-line tip. Keep it under 250 words. ' +
    'Be concrete and personal, never generic filler.';
  return complete(system, `Today is ${userData.date}. Here is my data:\n${JSON.stringify(userData, null, 2)}`);
}

export async function generateWeeklyMenu(preferences = {}) {
  const system =
    'You are a meal planner. Return ONLY valid JSON, no prose, shaped as: ' +
    '{"meals": {"monday": {"breakfast": "...", "lunch": "...", "dinner": "..."}, ...all 7 days...}, ' +
    '"shopping_list": [{"item": "...", "quantity": "...", "category": "...", "checked": false}]}. ' +
    'Simple, healthy, Romanian-friendly home cooking. Group shopping list by category.';
  const text = await complete(system, `Generate a weekly menu. Preferences: ${JSON.stringify(preferences)}`, 4096);
  return extractJson(text);
}

export async function generateFitnessAdvice(userData) {
  const system =
    'You are a fitness coach for a 15-minute morning workout using a kettlebell and resistance bands. ' +
    'Return ONLY valid JSON: {"intensity": "low|moderate|high", "rationale": "...", ' +
    '"exercises": [{"name": "...", "sets": n, "reps": "...", "equipment": "kettlebell|bands|bodyweight"}]}. ' +
    'Adapt intensity to HRV and sleep: low HRV or poor sleep means lighter mobility-focused work.';
  const text = await complete(system, `Recent data:\n${JSON.stringify(userData, null, 2)}`);
  return extractJson(text);
}

export async function extractActionItems(transcript) {
  const system =
    'Extract action items from this meeting transcript. Return ONLY valid JSON: ' +
    '{"title": "short meeting title", "summary": "2-3 sentences", ' +
    '"action_items": [{"text": "...", "owner": "...", "due": "...", "done": false}]}.';
  const text = await complete(system, transcript.slice(0, 100000), 4096);
  return extractJson(text);
}

export async function chat(messages, systemPrompt = 'You are Jarvis, a helpful personal assistant.') {
  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages
  });
  return res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
}
