require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

async function callClaude(prompt, maxTokens) {
  const r = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens || 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const d = await r.json();
  const text = (d.content && d.content[0]) ? d.content[0].text : '';
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

function parentLabel(g) { return g === 'mom' ? '\u05d0\u05de\u05d0' : '\u05d0\u05d1\u05d0'; }
function childLabel(g)  { return g === 'girl' ? '\u05d1\u05ea' : '\u05d1\u05df'; }

app.post('/api/activity', async (req, res) => {
  try {
    const { parentGender, interests, tradition, childName, childAge, childGender, childInterests, relation, pastActivities } = req.body;
    const past = (pastActivities && pastActivities.length) ? 'Do not repeat: ' + pastActivities.join(', ') + '. ' : '';
    const pLabel = parentLabel(parentGender);
    const cLabel = childLabel(childGender);

    const lines = [
      'You are Bondy. Design a meaningful parent-child bonding activity in Hebrew.',
      'Parent: ' + pLabel + ', interests: ' + (interests||[]).join(',') + ', tradition: ' + (tradition||'secular'),
      'Child: name=' + (childName||'') + ' age=' + (childAge||'') + ' gender=' + cLabel + ' interests: ' + (childInterests||[]).join(',') + ' relation=' + (relation||''),
      past,
      'Rules: Use ' + pLabel + ' for parent. Use child name ' + (childName||'') + '. Nature emojis only. Hebrew text ONLY.',
      'Return ONLY valid JSON:',
      '{"emoji":"","title":"","description":"","why":"","duration":"","steps":["","","",""],"questions":["","",""],"tip":"","dailyQuestion":""}'
    ];

    const activity = await callClaude(lines.join('\n'), 1200);
    res.json({ success: true, activity });
  } catch (e) {
    console.error('activity error:', e.message);
    res.json({ success: false, error: e.message });
  }
});

app.post('/api/questions', async (req, res) => {
  try {
    const { childAge, childName, childGender, childInterests, parentGender } = req.body;
    const pLabel = parentLabel(parentGender);
    const cLabel = childLabel(childGender);

    const lines = [
      'Create 8 fun Hebrew conversation questions for a parent and child.',
      'Parent: ' + pLabel + '. Child: ' + (childName||'') + ' (' + cLabel + ', age ' + (childAge||'8') + ').',
      'Child interests: ' + (childInterests||[]).join(',') + '.',
      'Mix: dreams, imagination, values, funny scenarios, memories.',
      'CRITICAL: Hebrew characters ONLY. No Arabic, no English.',
      'Return ONLY a JSON array of 8 strings: ["q1","q2",...]'
    ];

    const result = await callClaude(lines.join('\n'), 800);
    const qs = Array.isArray(result) ? result : (result.questions || []);
    res.json({ success: true, questions: qs });
  } catch (e) {
    console.error('questions error:', e.message);
    res.json({ success: false, error: e.message });
  }
});

app.post('/api/daily-learning', async (req, res) => {
  try {
    const { tradition, childAge, childName, childGender, parentGender } = req.body;
    const pLabel = parentLabel(parentGender);
    const cLabel = childLabel(childGender);

    const sourceMap = {
      secular:     'Pirkei Avot - choose a mishna with a universal human message. Explanation: simple, modern, no religious jargon.',
      traditional: 'Pirkei Avot or Psalms - choose a warm connecting verse. Explanation: close to the heart, connecting tradition to life.',
      religious:   'Mishna, Pirkei Avot or a short daily halacha. Explanation: accessible religious language with depth.',
      haredi:      'Gemara, daily halacha or mussar. Explanation: deep, accessible yeshiva-style language.'
    };
    const sourceInstruction = sourceMap[tradition] || sourceMap.secular;
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);

    const lines = [
      'You are a Jewish educator creating a daily learning unit for a parent and child.',
      'Tradition level: ' + (tradition||'secular'),
      'Source to use: ' + sourceInstruction,
      'Parent: ' + pLabel + '. Child: ' + (childName||'') + ' (' + cLabel + ', age ' + (childAge||'8') + ').',
      'Day seed (use to pick a specific text, rotate through the year): ' + dayOfYear,
      'Rules:',
      '- The quote must be a REAL, ACCURATE Jewish text with correct source attribution.',
      '- ALL text fields must be in Hebrew only.',
      '- The discussion_question must be age-appropriate for a ' + (childAge||'8') + ' year old.',
      '- sefaria_url: direct link to the exact passage on sefaria.org',
      'Return ONLY valid JSON:',
      '{"source":"","source_he":"","quote":"","quote_translation":"","explanation":"","discussion_question":"","emoji":"","sefaria_url":""}'
    ];

    const learning = await callClaude(lines.join('\n'), 1000);
    res.json({ success: true, learning });
  } catch (e) {
    console.error('daily-learning error:', e.message);
    res.json({ success: false, error: e.message });
  }
});

app.get('/api/health', (req, res) => { res.json({ status: 'ok' }); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Bondy Server running on port ' + PORT));
