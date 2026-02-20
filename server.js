require(‘dotenv’).config();
const express = require(‘express’);
const cors = require(‘cors’);
const { createClient } = require(’@supabase/supabase-js’);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(‘public’));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post(’/api/activity’, async (req, res) => {
try {
const { parentName, parentGender, interests, tradition, childName, childAge, childGender, childInterests, relation, pastActivities, lang } = req.body;
const pastStr = (pastActivities && pastActivities.length) ? ‘Do not repeat: ’ + pastActivities.join(’, ‘) + ‘. ’ : ‘’;
const outputLang = lang === ‘en’ ? ‘English’ : ‘Hebrew’;
const prompt = ‘You are Bondy. Design a parent-child bonding activity in ’ + outputLang + ‘.\n’ +
‘Parent: ’ + (parentName||’’) + ’ (’ + (parentGender===‘mom’ ? ‘אמא’ : ‘אבא’) + ‘), interests: ’ + (interests||[]).join(’,’) + ‘, tradition: ’ + (tradition||’’) + ‘\n’ +
‘Child: name=’ + (childName||’’) + ’ age=’ + (childAge||’’) + ’ gender=’ + (childGender===‘girl’ ? ‘girl/bat’ : ‘boy/ben’) + ’ interests: ’ + (childInterests||[]).join(’,’) + ’ relation=’ + (relation||’’) + ‘\n’ +
pastStr + ‘\n’ +
‘Rules: ALWAYS use ’ + (parentGender===‘mom’ ? ‘אמא’ : ‘אבא’) + ’ for the parent (NOT their name). Use child name ’ + (childName||’’) + ‘. Only these emojis: 🌿 🔥 🌊 🏔 🌙 ⭐ 🍃 🌻 🕊 🪵 🌾 🍳 🎣 🌲 🧺 🪴 🏕 🌅 🍂 🌈\n’ +
‘Return ONLY valid JSON in Hebrew with no extra text:\n’ +
‘{“emoji”:””,“title”:””,“description”:””,“why”:””,“duration”:””,“steps”:[””,””,””,””],“questions”:[””,””,””],“tip”:””,“dailyQuestion”:””}’;

```
const r = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
  body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1200, messages: [{ role: 'user', content: prompt }] })
});
const d = await r.json();
const text = (d.content && d.content[0]) ? d.content[0].text : '';
const activity = JSON.parse(text.replace(/```json|```/g, '').trim());
res.json({ success: true, activity });
```

} catch (e) {
console.error(‘activity:’, e.message);
res.json({ success: true, activity: { emoji: ‘🌿’, title: ‘nature walk’, description: ‘walk together’, why: ‘bonding’, duration: ‘1hr’, steps: [‘go outside’,‘explore’,‘sit together’,‘share’], questions: [‘what did you see?’,‘favorite moment?’,‘what did you enjoy?’], tip: ‘invite a friend if reluctant’, dailyQuestion: ‘if you could travel anywhere, where?’ } });
}
});

app.post(’/api/questions’, async (req, res) => {
try {
const { childAge, childName, childGender, childInterests, parentName, parentGender, lang } = req.body;
const outputLang = lang === ‘en’ ? ‘English’ : ‘Hebrew’;
const childLabel = childGender === ‘girl’ ? ‘בת’ : ‘בן’;
const parentLabel = parentGender === ‘mom’ ? ‘אמא’ : ‘אבא’;
const prompt = ‘Create 8 Hebrew conversation questions for a parent and child.\n’ +
‘Parent: ’ + parentLabel + ‘. Child: ’ + (childName||’’) + ’ (’ + childLabel + ‘, age ’ + (childAge||‘8’) + ‘).\n’ +
‘Child interests: ’ + (childInterests||[]).join(’,’) + ‘.\n’ +
‘Questions should be fun, deep, imaginative. Mix easy and thought-provoking.\n’ +
‘Return ONLY valid JSON:\n’ +
‘Return ONLY a JSON array of 8 question strings in Hebrew, no extra text:\n[“שאלה1”,“שאלה2”,…]’;
const r = await fetch(‘https://api.anthropic.com/v1/messages’, {
method: ‘POST’,
headers: { ‘Content-Type’: ‘application/json’, ‘x-api-key’: process.env.ANTHROPIC_API_KEY, ‘anthropic-version’: ‘2023-06-01’ },
body: JSON.stringify({ model: ‘claude-sonnet-4-20250514’, max_tokens: 800, messages: [{ role: ‘user’, content: prompt }] })
});
const d = await r.json();
const text = (d.content && d.content[0]) ? d.content[0].text : ‘’;
const result = JSON.parse(text.replace(/`json|`/g, ‘’).trim());
const qs = Array.isArray(result) ? result : (result.questions || []);
res.json({ success: true, questions: qs });
} catch (e) {
res.json({ success: false, error: e.message });
}
});

app.post(’/api/nearby’, async (req, res) => {
try {
const { lat, lng, childAge } = req.body;
const apiKey = process.env.GOOGLE_PLACES_KEY;
if (!apiKey) {
return res.json({ success: true, places: [
{ name: ‘park nearby’, distance: “500m”, emoji: ‘🌿’, tip: ‘great for a short walk’ },
{ name: ‘playground’, distance: “800m”, emoji: ‘🌲’, tip: ’good for age ’ + childAge }
]});
}
const types = [‘park’, ‘museum’];
const results = [];
for (const type of types) {
const url = ‘https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=’ + lat + ‘,’ + lng + ‘&radius=5000&type=’ + type + ‘&language=he&key=’ + apiKey;
const r = await fetch(url);
const d = await r.json();
if (d.results) {
const emojiMap = { park: ‘🌿’, museum: ‘🌅’ };
d.results.slice(0, 2).forEach(p => {
const dist = Math.round(Math.sqrt(Math.pow((p.geometry.location.lat - lat) * 111000, 2) + Math.pow((p.geometry.location.lng - lng) * 111000, 2)));
results.push({ name: p.name, distance: dist > 1000 ? (Math.round(dist/100)/10) + ‘km’ : dist + ‘m’, emoji: emojiMap[type] || ‘📍’, tip: ’rated ’ + (p.rating || ‘?’) + ‘/5’ });
});
}
}
res.json({ success: true, places: results.slice(0, 4) });
} catch (e) {
res.json({ success: false, error: e.message });
}
});

app.post(’/api/memories’, async (req, res) => {
try {
const { userId, activityTitle, activityEmoji, feeling, quote } = req.body;
const { data, error } = await supabase.from(‘memories’).insert([{ user_id: userId, activity_title: activityTitle, activity_emoji: activityEmoji, feeling, quote, created_at: new Date().toISOString() }]).select();
if (error) throw error;
res.json({ success: true, memory: data[0] });
} catch (e) { res.json({ success: false, error: e.message }); }
});

app.get(’/api/memories/:userId’, async (req, res) => {
try {
const { data, error } = await supabase.from(‘memories’).select(’*’).eq(‘user_id’, req.params.userId).order(‘created_at’, { ascending: false });
if (error) throw error;
res.json({ success: true, memories: data });
} catch (e) { res.json({ success: false, error: e.message }); }
});

app.post(’/api/profile’, async (req, res) => {
try {
const { userId, parentName, gender, interests, tradition, childName, childAge, relation } = req.body;
const { data, error } = await supabase.from(‘profiles’).upsert([{ user_id: userId, parent_name: parentName, gender, interests, tradition, child_name: childName, child_age: childAge, relation, updated_at: new Date().toISOString() }], { onConflict: ‘user_id’ }).select();
if (error) throw error;
res.json({ success: true, profile: data[0] });
} catch (e) { res.json({ success: false, error: e.message }); }
});

app.get(’/api/profile/:userId’, async (req, res) => {
try {
const { data, error } = await supabase.from(‘profiles’).select(’*’).eq(‘user_id’, req.params.userId).single();
if (error && error.code !== ‘PGRST116’) throw error;
res.json({ success: true, profile: data || null });
} catch (e) { res.json({ success: false, error: e.message }); }
});

app.get(’/api/health’, (req, res) => { res.json({ status: ‘ok’ }); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(’Bondy Server on port ’ + PORT));
