require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_ANON_KEY || "");

app.post("/api/activity", async (req, res) => {
  try {
    const { parentName, parentGender, interests, tradition, childName, childAge, childGender, childInterests, relation, pastActivities } = req.body;
    const pastCount = (pastActivities && pastActivities.length) ? pastActivities.length : 0;
    const pastStr = pastCount > 0 ? "פעילויות שכבר עשו - אל תחזור עליהן: " + pastActivities.join(", ") + ". " : "";

    const parentLabel = parentGender === "mom" ? "אמא" : "אבא";
    const childLabel = childGender === "girl" ? "בת" : "בן";

    let difficultyInstruction;
    if (pastCount === 0) {
      difficultyInstruction = "רמת קושי: קלה מאוד - ניצחון ראשון.\nחובה: פעילות בבית בלבד, 10-15 דקות, ללא ציוד מיוחד, ללא יציאה.\nדוגמאות: שיחה עם שאלה מיוחדת, משחק מהיר בסלון, סיפור שממציאים ביחד, ציור ביחד.\nמטרה: ניצחון קטן שגורם לרצות עוד.";
    } else if (pastCount <= 3) {
      difficultyInstruction = "רמת קושי: קלה - מתחילים.\nפעילות פשוטה בבית או ליד הבית, 20-30 דקות, ציוד בסיסי.\nדוגמאות: בישול פשוט ביחד, יצירה מחומרים בבית, חצר הבניין, משחק קופסה.";
    } else if (pastCount <= 8) {
      difficultyInstruction = "רמת קושי: בינונית - מתחזקים.\nפעילות עם קצת הכנה, אפשר גם קרוב לבית, 30-45 דקות.\nדוגמאות: פרויקט קטן, בישול מתכון חדש, טיול שכונתי עם משימה, מתנה בעבודת יד.";
    } else {
      difficultyInstruction = "רמת קושי: מאתגרת - קשר עמוק.\nפעילות שדורשת תכנון או יציאה, חוויה משותפת עמוקה.\nדוגמאות: יציאה לפארק, בניית פרויקט לאורך ימים, חוויה חדשה ביחד.";
    }

    const genderNote = parentGender === "mom"
      ? "חשוב מאוד: כתוב בלשון נקבה לגבי ההורה בכל המשפטים. לדוגמה: 'האמא יוצאת', 'היא בונה', 'כשהיא', 'רחל ו" + (childName||"הילד") + " יוצאות'."
      : "כתוב בלשון זכר לגבי ההורה. לדוגמה: 'האבא יוצא', 'הוא בונה'.";

    const childGenderNote = childGender === "girl"
      ? "כתוב בלשון נקבה לגבי הילדה."
      : "כתוב בלשון זכר לגבי הילד.";

    const lines = [
      "אתה Bondy, אפליקציה לחיזוק קשר הורה-ילד.",
      "תכנן פעילות קצרה, ישימה ומחברת בעברית.",
      "",
      "פרטי המשפחה:",
      "הורה: " + parentLabel + " " + (parentName||"") + " | מגדר: " + (parentGender === "mom" ? "נקבה" : "זכר"),
      "תחומי עניין של ההורה: " + (interests||[]).join(", "),
      "ילד/ה: " + (childName||"") + " | " + childLabel + " | גיל " + (childAge||"8"),
      "תחומי עניין של הילד/ה: " + (childInterests||[]).join(", "),
      "מצב הקשר: " + (relation||"good"),
      pastStr,
      "",
      difficultyInstruction,
      "",
      genderNote,
      childGenderNote,
      "",
      "עברית בלבד. אמוג'י טבע בלבד. החזר JSON תקני בלבד:",
      '{"emoji":"","title":"","description":"","why":"","duration":"","steps":["","","",""],"questions":["","",""],"tip":"","dailyQuestion":""}'
    ];

    const prompt = lines.join("\n");

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1200, messages: [{ role: "user", content: prompt }] })
    });
    const d = await r.json();
    const text = (d.content && d.content[0]) ? d.content[0].text : "";
    const activity = JSON.parse(text.replace(/```json|```/g, "").trim());
    res.json({ success: true, activity });
  } catch (e) {
    console.error("activity error:", e.message);
    res.json({ success: false, error: e.message });
  }
});

app.post("/api/questions", async (req, res) => {
  try {
    const { childAge, childName, childGender, childInterests, parentGender } = req.body;
    const parentLabel = parentGender === "mom" ? "אמא" : "אבא";
    const childLabel = childGender === "girl" ? "בת" : "בן";
    const lines = [
      "צור 8 שאלות שיחה כיפיות בעברית להורה וילד/ה.",
      "הורה: " + parentLabel + ". ילד/ה: " + (childName||"") + " (" + childLabel + ", גיל " + (childAge||"8") + ").",
      "תחומי עניין: " + (childInterests||[]).join(", ") + ".",
      "שלב: חלומות, דמיון, ערכים, תרחישים מצחיקים, זיכרונות.",
      "עברית בלבד ללא יוצא מן הכלל.",
      'החזר JSON array של 8 מחרוזות בלבד: ["q1","q2",...]'
    ];
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, messages: [{ role: "user", content: lines.join("\n") }] })
    });
    const d = await r.json();
    const text = (d.content && d.content[0]) ? d.content[0].text : "";
    const result = JSON.parse(text.replace(/```json|```/g, "").trim());
    const qs = Array.isArray(result) ? result : (result.questions || []);
    res.json({ success: true, questions: qs });
  } catch (e) {
    console.error("questions error:", e.message);
    res.json({ success: false, error: e.message });
  }
});

app.post("/api/daily-learning", async (req, res) => {
  try {
    const { tradition, childAge, childName, childGender, parentGender } = req.body;
    const parentLabel = parentGender === "mom" ? "אמא" : "אבא";
    const childLabel = childGender === "girl" ? "בת" : "בן";

    const sourceMap = {
      secular:     "פרקי אבות - בחר משנה עם מסר אנושי אוניברסלי. פירוש: פשוט, מודרני, ללא שפה דתית.",
      traditional: "פרקי אבות או תהילים - בחר פסוק חם ומחבר. פירוש: קרוב ללב, מחבר מסורת לחיים.",
      religious:   "משנה, פרקי אבות או הלכה יומית קצרה. פירוש: בשפה דתית נגישה, עם עומק.",
      haredi:      "גמרא, הלכה יומית או מוסר. פירוש: לעומק, בשפת בית מדרש נגישה."
    };
    const sourceInstruction = sourceMap[tradition] || sourceMap.secular;
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);

    const lines = [
      "אתה מחנך יהודי שיוצר יחידת לימוד יומית להורה וילד/ה.",
      "רמת מסורת: " + (tradition||"secular"),
      "מקור: " + sourceInstruction,
      "הורה: " + parentLabel + ". ילד/ה: " + (childName||"") + " (" + childLabel + ", גיל " + (childAge||"8") + ").",
      "יום בשנה (לבחירת טקסט ספציפי): " + dayOfYear,
      "",
      "כללים:",
      "- הציטוט חייב להיות טקסט יהודי אמיתי ומדויק עם ייחוס נכון.",
      "- עברית בלבד בכל השדות.",
      "- שאלת הדיון מותאמת לגיל " + (childAge||"8") + ".",
      "- sefaria_url: קישור לטקסט המדויק בספריא (לדוגמה: https://www.sefaria.org/Pirkei_Avot.1.1)",
      "החזר JSON תקני בלבד:",
      '{"source":"","source_he":"","quote":"","quote_translation":"","explanation":"","discussion_question":"","emoji":"","sefaria_url":""}'
    ];

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: lines.join("\n") }] })
    });
    const d = await r.json();
    const text = (d.content && d.content[0]) ? d.content[0].text : "";
    const learning = JSON.parse(text.replace(/```json|```/g, "").trim());
    res.json({ success: true, learning });
  } catch (e) {
    console.error("daily-learning error:", e.message);
    res.json({ success: false, error: e.message });
  }
});

app.get("/api/health", (req, res) => { res.json({ status: "ok" }); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Bondy Server running on port " + PORT));
