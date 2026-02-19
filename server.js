require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.post('/api/activity', async (req, res) => {
  try {
    const { parentName, interests, tradition, childName, childAge, relation } = req.body;
    const tradMap = { secular: 'חילוני', traditional: 'מסורתי', religious: 'דתי', seeking: 'מחפש' };
    const prompt = 'אתה Bondy — עוזר שמעצב פעילויות לחיזוק קשר הורה–ילד בעברית.\n' +
      'פרופיל הורה: שם ' + parentName + ', תחומי עניין: ' + (interests || []).join(', ') + ', מסורת: ' + (tradMap[tradition] || 'חילוני') + '\n' +
      'פרופיל ילד: שם ' + childName + ', גיל ' + childAge + ', מצב קשר: ' + relation + '\n' +
      'צור פעילות שבועית אחת מותאמת אישית. החזר JSON בלבד בעברית, ללא טקסט נוסף:\n' +
      '{"emoji":"","title":"","description":"","why":"","duration":"","steps":["","","",""],"questions":["","",""],"tip":"","dailyQuestion":""}';

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
    const text = data.content && data.content[0] ? data.content[0].text : '';
    const clean = text.replace(/```json|```/g, '').trim();
    const activity = JSON.parse(clean);
    res.json({ success: true, activity });
  } catch (error) {
    console.error('Activity error:', error);
    res.json({
      success: true,
      activity: {
        emoji: '🥾',
        title: 'טיול גילוי בטבע',
        description: 'יציאה לגלות את הטבע הקרוב ביחד',
        why: 'הטבע פותח שיחות שלא קורות בתוך הבית',
        duration: 'שעה-שעתיים',
        steps: ['תנו לילד לבחור כיוון', 'אספו 5 דברים מעניינים בדרך', 'שבו ביחד בלי טלפונים', 'כל אחד מספר את הרגע הכי טוב'],
        questions: ['אם היית עץ — איזה עץ?', 'מה הדבר הכי יפה שראית?', 'מה היית מתגעגע מהבית?'],
        tip: 'אם הילד לא רוצה — הציעו להביא חבר',
        dailyQuestion: 'אם יכולת לטייל לכל מקום — לאן?'
      }
    });
  }
});

app.post('/api/questions', async (req, res) => {
  try {
    const { childAge, childName } = req.body;
    const prompt = 'צור 6 שאלות שיחה לארוחת ערב משפחתית בעברית, לילד גיל ' + childAge + '. החזר JSON בלבד: {"questions":[{"text":"","cat":"dream"}]}';

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
    const text = data.content && data.content[0] ? data.content[0].text : '';
    const clean = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    res.json({ success: true, questions: result.questions });
  } catch (error) {
    console.error('Questions error:', error);
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/memories', async (req, res) => {
  try {
    const { userId, activityTitle, activityEmoji, feeling, quote } = req.body;
    const { data, error } = await supabase
      .from('memories')
      .insert([{ user_id: userId, activity_title: activityTitle, activity_emoji: activityEmoji, feeling, quote, created_at: new Date().toISOString() }])
      .select();
    if (error) throw error;
    res.json({ success: true, memory: data[0] });
  } catch (error) {
    console.error('Memory error:', error);
    res.json({ success: false, error: error.message });
  }
});

app.get('/api/memories/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, memories: data });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/profile', async (req, res) => {
  try {
    const { userId, parentName, gender, interests, tradition, childName, childAge, relation } = req.body;
    const { data, error } = await supabase
      .from('profiles')
      .upsert([{ user_id: userId, parent_name: parentName, gender, interests, tradition, child_name: childName, child_age: childAge, relation, updated_at: new Date().toISOString() }], { onConflict: 'user_id' })
      .select();
    if (error) throw error;
    res.json({ success: true, profile: data[0] });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get('/api/profile/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', req.params.userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    res.json({ success: true, profile: data || null });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Bondy server is running!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Bondy Server running on port ' + PORT);
});
