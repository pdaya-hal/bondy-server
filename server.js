require(‘dotenv’).config();
const express = require(‘express’);
const cors = require(‘cors’);
const { createClient } = require(’@supabase/supabase-js’);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(‘public’));

const supabase = createClient(
process.env.SUPABASE_URL,
process.env.SUPABASE_ANON_KEY
);

const EMOJI_PALETTE = ‘🌿 🔥 🌊 🏔️ 🌙 ⭐ 🍃 🌻 🕊️ 🪵 🌾 🍳 🎣 🌲 🧺 🪴 🏕️ 🌅 🍂 🌈’;

app.post(’/api/activity’, async (req, res) => {
try {
const { parentName, interests, tradition, childName, childAge, relation, pastActivities } = req.body;
const tradHeb = { secular: ‘חילוני’, traditional: ‘מסורתי’, religious: ‘דתי’, seeking: ‘מחפש’ };
const pastStr = pastActivities && pastActivities.length ? ‘Do not repeat: ’ + pastActivities.join(’, ’) + ’. ’ : ‘’;

```
const lines = [
  'You are Bondy, designing parent-child bonding activities. Respond in Hebrew.',
  'Parent: ' + parentName + ', interests: ' + (interests||[]).join(',') + ', tradition: ' + (tradHeb[tradition]||'secular'),
  'Child: name=' + childName + ' age=' + childAge + ' relation=' + relation,
  pastStr,
  'Use child name and "אבא"/"אמא" not parent name. Use ONLY these emojis: ' + EMOJI_PALETTE,
  'Return ONLY valid JSON in Hebrew:',
  '{"emoji":"","title":"","description":"","why":"","duration":"","steps":["","","",""],"questions":["","",""],"tip":"","dailyQuestion":""}'
];

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
  body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1200, messages: [{ role: 'user', content: lines.join('\n') }] })
});

const data = await response.json();
const text = (data.content && data.content[0]) ? data.content[0].text : '';
const activity = JSON.parse(text.replace(/```json|```/g, '').trim());
res.json({ success: true, activity });
```

} catch (error) {
console.error(‘Activity error:’, error.message);
res.json({ success: true, activity: { emoji: ‘🌿’, title: ‘טיול גילוי בטבע’, description: ‘יציאה לגלות את הטבע ביחד’, why: ‘הטבע פותח שיחות שלא קורות בבית’, duration: ‘שעה-שעתיים’, steps: [‘תנו לילד לבחור כיוון’,‘אספו 5 דברים מעניינים’,‘שבו ביחד בלי טלפונים’,‘כל אחד מספר את הרגע הכי טוב’], questions: [‘אם היית עץ — איזה עץ?’,‘מה הדבר הכי יפה שראית?’,‘מה היית מתגעגע מהבית?’], tip: ‘הציעו להביא חבר אם לא רוצה’, dailyQuestion: ‘אם יכולת לטייל לכל מקום — לאן?’ } });
}
});

app.post(’/api/questions’, async (req, res) => {
try {
const { childAge } = req.body;
const lines = [
‘Create 6 Hebrew conversation questions for family dinner, child age ’ + childAge + ‘.’,
‘Cover: dreams, funny, values, future, past, imagination.’,
‘Return ONLY valid JSON:’,
‘{“questions”:[{“text”:””,“cat”:“dream”},{“text”:””,“cat”:“fun”},{“text”:””,“cat”:“values”},{“text”:””,“cat”:“future”},{“text”:””,“cat”:“past”},{“text”:””,“cat”:“imagine”}]}’
];
const response = await fetch(‘https://api.anthropic.com/v1/messages’, {
method: ‘POST’,
headers: { ‘Content-Type’: ‘application/json’, ‘x-api-key’: process.env.ANTHROPIC_API_KEY, ‘anthropic-version’: ‘2023-06-01’ },
body: JSON.stringify({ model: ‘claude-sonnet-4-20250514’, max_tokens: 800, messages: [{ role: ‘user’, content: lines.join(’\n’) }] })
});
const data = await response.json();
const text = (data.content && data.content[0]) ? data.content[0].text : ‘’;
const result = JSON.parse(text.replace(/`json|`/g, ‘’).trim());
res.json({ success: true, questions: result.questions });
} catch (error) {
res.json({ success: false, error: error.message });
}
});

app.post(’/api/nearby’, async (req, res) => {
try {
const { lat, lng, childAge } = req.body;
const apiKey = process.env.GOOGLE_PLACES_KEY;
if (!apiKey) {
return res.json({ success: true, places: [
{ name: ‘פארק קרוב’, distance: “500מ’”, emoji: ‘🌿’, tip: ‘מושלם לטיול קצר’ },
{ name: ‘מגרש משחקים’, distance: “800מ’”, emoji: ‘🌲’, tip: ‘אידיאלי לגיל ’ + childAge }
]});
}
const types = [‘park’, ‘museum’];
const results = [];
for (const type of types) {
const url = ‘https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=’ + lat + ‘,’ + lng + ‘&radius=5000&type=’ + type + ‘&language=he&key=’ + apiKey;
const r = await fetch(url);
const data = await r.json();
if (data.results) {
const emojiMap = { park: ‘🌿’, museum: ‘🌅’ };
data.results.slice(0, 2).forEach(place => {
const dist = Math.round(Math.sqrt(Math.pow((place.geometry.location.lat - lat) * 111000, 2) + Math.pow((place.geometry.location.lng - lng) * 111000, 2)));
results.push({ name: place.name, distance: dist > 1000 ? (Math.round(dist/100)/10) + ‘ק”מ’ : dist + “מ’”, emoji: emojiMap[type] || ‘📍’, tip: ’מדורג ’ + (place.rating || ‘?’) + ‘/5’ });
});
}
}
res.json({ success: true, places: results.slice(0, 4) });
} catch (error) {
res.json({ success: false, error: error.message });
}
});

app.post(’/api/memories’, async (req, res) => {
try {
const { userId, activityTitle, activityEmoji, feeling, quote } = req.body;
const { data, error } = await supabase.from(‘memories’).insert([{ user_id: userId, activity_title: activityTitle, activity_emoji: activityEmoji, feeling, quote, created_at: new Date().toISOString() }]).select();
if (error) throw error;
res.json({ success: true, memory: data[0] });
} catch (error) { res.json({ success: false, error: error.message }); }
});

app.get(’/api/memories/:userId’, async (req, res) => {
try {
const { data, error } = await supabase.from(‘memories’).select(’*’).eq(‘user_id’, req.params.userId).order(‘created_at’, { ascending: false });
if (error) throw error;
res.json({ success: true, memories: data });
} catch (error) { res.json({ success: false, error: error.message }); }
});

app.post(’/api/profile’, async (req, res) => {
try {
const { userId, parentName, gender, interests, tradition, childName, childAge, relation } = req.body;
const { data, error } = await supabase.from(‘profiles’).upsert([{ user_id: userId, parent_name: parentName, gender, interests, tradition, child_name: childName, child_age: childAge, relation, updated_at: new Date().toISOString() }], { onConflict: ‘user_id’ }).select();
if (error) throw error;
res.json({ success: true, profile: data[0] });
} catch (error) { res.json({ success: false, error: error.message }); }
});

app.get(’/api/profile/:userId’, async (req, res) => {
try {
const { data, error } = await supabase.from(‘profiles’).select(’*’).eq(‘user_id’, req.params.userId).single();
if (error && error.code !== ‘PGRST116’) throw error;
res.json({ success: true, profile: data || null });
} catch (error) { res.json({ success: false, error: error.message }); }
});

app.get(’/api/health’, (req, res) => { res.json({ status: ‘ok’ }); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(’Bondy Server on port ’ + PORT));
