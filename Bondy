require(‘dotenv’).config();
const express = require(‘express’);
const cors = require(‘cors’);
const { createClient } = require(’@supabase/supabase-js’);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(‘public’));

// Supabase client
const supabase = createClient(
process.env.SUPABASE_URL,
process.env.SUPABASE_ANON_KEY
);

// ════════════════════════════════════════
// ROUTE: Generate Activity with Claude AI
// POST /api/activity
// Body: { parentName, interests, tradition, childName, childAge, relation }
// ════════════════════════════════════════
app.post(’/api/activity’, async (req, res) => {
try {
const { parentName, interests, tradition, childName, childAge, relation } = req.body;

```
const tradMap = {
  secular: 'חילוני',
  traditional: 'מסורתי',
  religious: 'דתי',
  seeking: 'מחפש'
};

const prompt = `אתה Bondy — עוזר שמעצב פעילויות לחיזוק קשר הורה–ילד בעברית.
```

פרופיל הורה: שם ${parentName}, תחומי עניין: ${interests?.join(’, ‘) || ‘כללי’}, מסורת: ${tradMap[tradition] || ‘חילוני’}
פרופיל ילד: שם ${childName}, גיל ${childAge}, מצב קשר: ${relation}
צור פעילות שבועית אחת מותאמת אישית. החזר JSON בלבד בעברית, ללא טקסט נוסף:
{
“emoji”: “אמוג’י אחד”,
“title”: “שם הפעילות”,
“description”: “משפט קצר למה מתאים לפרופיל”,
“why”: “הסבר קצר למה יחזק את הקשר”,
“duration”: “כמה זמן”,
“steps”: [“שלב 1”, “שלב 2”, “שלב 3”, “שלב 4”],
“questions”: [“שאלה לשיחה 1”, “שאלה לשיחה 2”, “שאלה לשיחה 3”],
“tip”: “טיפ אחד אם הילד מתנגד”,
“dailyQuestion”: “שאלה יפה לארוחת ערב הערב”
}`;

```
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }]
  })
});

const data = await response.json();
const text = data.content?.[0]?.text || '';
const clean = text.replace(/```json|```/g, '').trim();
const activity = JSON.parse(clean);

res.json({ success: true, activity });
```

} catch (error) {
console.error(‘Activity generation error:’, error);
// Fallback activity
res.json({
success: true,
activity: {
emoji: ‘🥾’,
title: ‘טיול גילוי בטבע’,
description: ‘יציאה לגלות את הטבע הקרוב ביחד’,
why: ‘הטבע פותח שיחות שלא קורות בתוך הבית’,
duration: ‘שעה-שעתיים’,
steps: [
‘תנו לילד לבחור את הכיוון — ימין או שמאל’,
‘אספו ביחד 5 דברים מעניינים שמצאתם בדרך’,
‘שבו במקום יפה ושתו משהו ביחד, בלי טלפונים’,
‘כל אחד מספר מה היה הרגע הכי טוב שלו’
],
questions: [
‘אם היית עץ — איזה עץ היית?’,
‘מה הדבר הכי יפה שראית היום?’,
‘אם יכולת לגור בטבע — מה היית מתגעגע/ת מהבית?’
],
tip: ‘אם הילד לא רוצה לצאת — הציעו לו/לה להביא חבר/ה’,
dailyQuestion: ‘אם יכולת לטייל לכל מקום בעולם — לאן היית בוחר/ת?’
}
});
}
});

// ════════════════════════════════════════
// ROUTE: Generate Questions
// POST /api/questions
// Body: { childAge, childName }
// ════════════════════════════════════════
app.post(’/api/questions’, async (req, res) => {
try {
const { childAge, childName } = req.body;

```
const prompt = `צור 6 שאלות שיחה קצרות, מעניינות ומגוונות לארוחת ערב משפחתית בעברית, מותאמות לילד בגיל ${childAge}. 
```

השאלות צריכות לכסות נושאים שונים: חלומות, מצחיק, ערכים, עתיד, עבר, דמיון.
החזר JSON בלבד: {“questions”: [{“text”: “שאלה”, “cat”: “dream|fun|values|future|past|imagine”}, …]}`;

```
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }]
  })
});

const data = await response.json();
const text = data.content?.[0]?.text || '';
const clean = text.replace(/```json|```/g, '').trim();
const result = JSON.parse(clean);

res.json({ success: true, questions: result.questions });
```

} catch (error) {
console.error(‘Questions error:’, error);
res.json({ success: false, error: error.message });
}
});

// ════════════════════════════════════════
// ROUTE: Save Memory
// POST /api/memories
// Body: { userId, activityTitle, activityEmoji, feeling, quote }
// ════════════════════════════════════════
app.post(’/api/memories’, async (req, res) => {
try {
const { userId, activityTitle, activityEmoji, feeling, quote } = req.body;

```
const { data, error } = await supabase
  .from('memories')
  .insert([{
    user_id: userId,
    activity_title: activityTitle,
    activity_emoji: activityEmoji,
    feeling,
    quote,
    created_at: new Date().toISOString()
  }])
  .select();

if (error) throw error;
res.json({ success: true, memory: data[0] });
```

} catch (error) {
console.error(‘Save memory error:’, error);
res.json({ success: false, error: error.message });
}
});

// ════════════════════════════════════════
// ROUTE: Get Memories
// GET /api/memories/:userId
// ════════════════════════════════════════
app.get(’/api/memories/:userId’, async (req, res) => {
try {
const { userId } = req.params;

```
const { data, error } = await supabase
  .from('memories')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

if (error) throw error;
res.json({ success: true, memories: data });
```

} catch (error) {
console.error(‘Get memories error:’, error);
res.json({ success: false, error: error.message });
}
});

// ════════════════════════════════════════
// ROUTE: Save / Update User Profile
// POST /api/profile
// Body: { userId, parentName, gender, interests, tradition, childName, childAge, relation }
// ════════════════════════════════════════
app.post(’/api/profile’, async (req, res) => {
try {
const { userId, parentName, gender, interests, tradition, childName, childAge, relation } = req.body;

```
const { data, error } = await supabase
  .from('profiles')
  .upsert([{
    user_id: userId,
    parent_name: parentName,
    gender,
    interests,
    tradition,
    child_name: childName,
    child_age: childAge,
    relation,
    updated_at: new Date().toISOString()
  }], { onConflict: 'user_id' })
  .select();

if (error) throw error;
res.json({ success: true, profile: data[0] });
```

} catch (error) {
console.error(‘Save profile error:’, error);
res.json({ success: false, error: error.message });
}
});

// ════════════════════════════════════════
// ROUTE: Get User Profile
// GET /api/profile/:userId
// ════════════════════════════════════════
app.get(’/api/profile/:userId’, async (req, res) => {
try {
const { userId } = req.params;

```
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
  .single();

if (error && error.code !== 'PGRST116') throw error;
res.json({ success: true, profile: data || null });
```

} catch (error) {
console.error(‘Get profile error:’, error);
res.json({ success: false, error: error.message });
}
});

// ════════════════════════════════════════
// START SERVER
// ════════════════════════════════════════
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log(`✅ Bondy Server running on port ${PORT}`);
});
