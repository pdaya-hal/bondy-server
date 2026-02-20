require(‘dotenv’).config();
const express = require(‘express’);
const cors = require(‘cors’);
const { createClient } = require(’@supabase/supabase-js’);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(‘public’));

const supabase = createClient(process.env.SUPABASE_URL || ‘’, process.env.SUPABASE_ANON_KEY || ‘’);

app.post(’/api/activity’, async (req, res) => {
try {
const { parentName, parentGender, interests, tradition, childName, childAge, childGender, childInterests, relation, pastActivities } = req.body;
const pastStr = (pastActivities && pastActivities.length) ? ‘Do not repeat these activities: ’ + pastActivities.join(’, ‘) + ‘. ’ : ‘’;
const parentLabel = parentGender === ‘mom’ ? ‘\u05d0\u05de\u05d0’ : ‘\u05d0\u05d1\u05d0’;
const childLabel = childGender === ‘girl’ ? ‘\u05d1\u05ea’ : ‘\u05d1\u05df’;
const prompt = ‘You are Bondy. Design a meaningful parent-child bonding activity in Hebrew.\n’ +
‘Parent: ’ + parentLabel + ‘, interests: ’ + (interests||[]).join(’,’) + ‘, tradition: ’ + (tradition||‘secular’) + ‘\n’ +
‘Child: name=’ + (childName||’’) + ’ age=’ + (childAge||’’) + ’ gender=’ + childLabel + ’ interests: ’ + (childInterests||[]).join(’,’) + ’ relation=’ + (relation||’’) + ‘\n’ +
pastStr +
‘Rules: Use ’ + parentLabel + ’ for parent (never their personal name). Use child name ’ + (childName||’’) + ‘. Use nature and home emojis only. CRITICAL: Hebrew text ONLY - no Arabic or English characters.\n’ +
‘Return ONLY valid JSON in Hebrew:\n’ +
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
console.error(‘activity error:’, e.message);
res.json({ success: false, error: e.message });
}
});

app.post(’/api/questions’, async (req, res) => {
try {
const { childAge, childName, childGender, childInterests, parentName, parentGender } = req.body;
const parentLabel = parentGender === ‘mom’ ? ‘\u05d0\u05de\u05d0’ : ‘\u05d0\u05d1\u05d0’;
const childLabel = childGender === ‘girl’ ? ‘\u05d1\u05ea’ : ‘\u05d1\u05df’;
const prompt = ‘Create 8 fun, imaginative Hebrew conversation questions for a parent and child.\n’ +
‘Parent: ’ + parentLabel + ‘. Child: ’ + (childName||’’) + ’ (’ + childLabel + ‘, age ’ + (childAge||‘8’) + ‘).\n’ +
‘Child interests: ’ + (childInterests||[]).join(’,’) + ‘.\n’ +
‘Mix: dreams, imagination, values, funny scenarios, childhood memories.\n’ +
‘CRITICAL: Use ONLY Hebrew characters. No Arabic, no English, no other languages.\n’ +
‘Return ONLY a JSON array of 8 Hebrew question strings: [“q1”,“q2”,…]’;

```
const r = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
  body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800, messages: [{ role: 'user', content: prompt }] })
});
const d = await r.json();
const text = (d.content && d.content[0]) ? d.content[0].text : '';
const result = JSON.parse(text.replace(/```json|```/g, '').trim());
const qs = Array.isArray(result) ? result : (result.questions || []);
res.json({ success: true, questions: qs });
```

} catch (e) {
console.error(‘questions error:’, e.message);
res.json({ success: false, error: e.message });
}
});

app.get(’/api/health’, (req, res) => { res.json({ status: ‘ok’ }); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(’Bondy Server running on port ’ + PORT));
