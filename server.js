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
    const { parentName, parentGender, interests, tradition, timeAvail, lang, childName, childAge, childGender, childInterests, relation, pastActivities, previousActivity } = req.body;
    const isEn = lang === "en";
    const pastCount = (pastActivities && pastActivities.length) ? pastActivities.length : 0;
    const pastStr = pastCount > 0 ? "פעילויות שכבר עשו - אל תחזור עליהן: " + pastActivities.join(", ") + ". " : "";
    const prevStr = previousActivity
      ? (isEn
        ? "CRITICAL INSTRUCTION: The previous activity was \"" + previousActivity.title + "\". You MUST choose a COMPLETELY DIFFERENT category. " +
          "If previous was music/singing → choose cooking, sports, art, or crafts. " +
          "If previous was art/drawing → choose music, cooking, sports, or games. " +
          "If previous was cooking → choose music, art, sports, or building. " +
          "The new activity must feel NOTHING like the previous one. Different room, different skills, different mood."
        : "הנחיה קריטית: הפעילות הקודמת הייתה \"" + previousActivity.title + "\". חובה לבחור קטגוריה שונה לחלוטין. " +
          "אם הקודמת הייתה מוזיקה/שירה → בחר בישול, ספורט, אמנות או יצירה. " +
          "אם הקודמת הייתה ציור/אמנות → בחר מוזיקה, בישול, ספורט או משחקים. " +
          "אם הקודמת הייתה בישול → בחר מוזיקה, אמנות, ספורט או בנייה. " +
          "הפעילות החדשה חייבת להרגיש שונה לחלוטין — חדר אחר, כישורים אחרים, מצב רוח אחר.")
      : "";

    const parentLabel = isEn ? (parentGender === "mom" ? "Mom" : "Dad") : (parentGender === "mom" ? "אמא" : "אבא");
    const childLabel = isEn ? (childGender === "girl" ? "girl" : "boy") : (childGender === "girl" ? "בת" : "בן");

    let difficultyInstruction;
    if (isEn) {
      if (pastCount === 0) {
        difficultyInstruction = "Difficulty: Very easy — first win.\nMust be: at home, 10-15 min, no special equipment, no going out.\nExamples: a special conversation question, quick living room game, making up a story together, drawing together.\nGoal: a small win that makes them want more.";
      } else if (pastCount <= 3) {
        difficultyInstruction = "Difficulty: Easy — getting started.\nSimple activity at home or nearby, 20-30 min, basic supplies.\nExamples: simple cooking together, crafts from household items, building hallway game.";
      } else if (pastCount <= 8) {
        difficultyInstruction = "Difficulty: Medium — building momentum.\nActivity with a bit of preparation, can be nearby, 30-45 min.\nExamples: small project, new recipe, neighborhood walk with a mission, handmade gift.";
      } else {
        difficultyInstruction = "Difficulty: Challenging — deep connection.\nActivity requiring planning or going out, a meaningful shared experience.\nExamples: trip to a park, multi-day project, a new experience together.";
      }
    } else {
      if (pastCount === 0) {
        difficultyInstruction = "רמת קושי: קלה מאוד - ניצחון ראשון.\nחובה: פעילות בבית בלבד, 10-15 דקות, ללא ציוד מיוחד, ללא יציאה.\nדוגמאות: שיחה עם שאלה מיוחדת, משחק מהיר בסלון, סיפור שממציאים ביחד, ציור ביחד.\nמטרה: ניצחון קטן שגורם לרצות עוד.";
      } else if (pastCount <= 3) {
        difficultyInstruction = "רמת קושי: קלה - מתחילים.\nפעילות פשוטה בבית או ליד הבית, 20-30 דקות, ציוד בסיסי.\nדוגמאות: בישול פשוט ביחד, יצירה מחומרים בבית, חצר הבניין, משחק קופסה.";
      } else if (pastCount <= 8) {
        difficultyInstruction = "רמת קושי: בינונית - מתחזקים.\nפעילות עם קצת הכנה, אפשר גם קרוב לבית, 30-45 דקות.\nדוגמאות: פרויקט קטן, בישול מתכון חדש, טיול שכונתי עם משימה, מתנה בעבודת יד.";
      } else {
        difficultyInstruction = "רמת קושי: מאתגרת - קשר עמוק.\nפעילות שדורשת תכנון או יציאה, חוויה משותפת עמוקה.\nדוגמאות: יציאה לפארק, בניית פרויקט לאורך ימים, חוויה חדשה ביחד.";
      }
    }

    const timeMapHe = {
      short: "זמן פנוי: 10-15 דקות בלבד. הפעילות חייבת להיות קצרה מאוד וישירה.",
      medium: "זמן פנוי: כחצי שעה. פעילות עם קצת עומק.",
      long: "זמן פנוי: שעה ויותר. אפשר להשקיע בחוויה עמוקה."
    };
    const timeMapEn = {
      short: "Available time: 10-15 minutes only. Activity must be very short and direct.",
      medium: "Available time: about 30 minutes. Activity with some depth.",
      long: "Available time: an hour or more. Can invest in a deep experience."
    };
    const timeMap = isEn ? timeMapEn : timeMapHe;
    const timeInstruction = timeMap[timeAvail] || timeMap.short;

    const genderNote = isEn
      ? (parentGender === "mom" ? "Use she/her for the parent in all sentences." : "Use he/him for the parent in all sentences.")
      : (parentGender === "mom"
        ? "חשוב מאוד: כתוב בלשון נקבה לגבי ההורה בכל המשפטים. לדוגמה: 'האמא יוצאת', 'היא בונה', 'כשהיא', 'רחל ו" + (childName||"הילד") + " יוצאות'."
        : "כתוב בלשון זכר לגבי ההורה. לדוגמה: 'האבא יוצא', 'הוא בונה'.");

    const childGenderNote = isEn
      ? (childGender === "girl" ? "Use she/her for the child." : "Use he/him for the child.")
      : (childGender === "girl" ? "כתוב בלשון נקבה לגבי הילדה." : "כתוב בלשון זכר לגבי הילד.");

    const lines = [
      isEn ? "You are Bondy, an app for strengthening the parent-child bond. Design a short, practical, connecting activity in English." : "אתה Bondy, אפליקציה לחיזוק קשר הורה-ילד. תכנן פעילות קצרה, ישימה ומחברת בעברית.",
      "",
      "פרטי המשפחה:",
      "הורה: " + parentLabel + " " + (parentName||"") + " | מגדר: " + (parentGender === "mom" ? "נקבה" : "זכר"),
      "תחומי עניין של ההורה: " + (interests||[]).join(", "),
      "ילד/ה: " + (childName||"") + " | " + childLabel + " | גיל " + (childAge||"8"),
      "תחומי עניין של הילד/ה: " + (childInterests||[]).join(", "),
      "מצב הקשר: " + (relation||"good"),
      pastStr,
      prevStr,
      "",
      difficultyInstruction,
      "",
      genderNote,
      childGenderNote,
      "",
      "עקרונות פעילות מחברת:",
      "- שיחה בתוך הפעילות, לא רק עשייה — שאלות שיוצרות קשר",
      "- רגע שבו הילד/ה מרגיש/ה נשמע/ת ורצוי/ה",
      "- סיום עם תחושת הצלחה משותפת",
      isEn ? "- Refer to parent as '" + parentLabel + "', not by first name. Example: '" + parentLabel + " and " + (childName||"child") + "'" : "- " + parentLabel + " (לא שם פרטי) — לדוגמה: '" + parentLabel + " ו" + (childName||"הילד") + "'",
      timeInstruction,
      "",
      "חומרים מותרים בלבד (מה שיש בכל בית):",
      "✅ מותר: נייר, עפרונות/צבעים, קרטון מקופסאות, כלי מטבח בסיסיים, ספרים, כריות, שמיכות, חוטים/גומיות, קלטת, מספריים, אוכל בסיסי שיש בבית.",
      "❌ אסור: זרעים, עציצים, חומרים מיוחדים, כלי עבודה, ציוד שקונים בחנות, כל דבר שדורש קנייה מראש.",
      "",
      isEn ? "English only. Nature emojis only. Return ONLY valid JSON:" : "עברית בלבד. אמוג'י טבע בלבד. החזר JSON תקני בלבד:",
      "IMPORTANT: The 'description' field must start with an inviting sentence like 'אתם הולכים ל...' or 'You're about to...' followed by 1-2 sentences describing what you'll do together. Do NOT mention parent/child names in description.",
      '{"emoji":"","title":"","description":"","why":"","duration":"","materials":["",""],"steps":["","","",""],"questions":["","",""],"tip":"","dailyQuestion":""}'
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
    const { childAge, childName, childGender, childInterests, parentGender, lang } = req.body;
    const isEn = lang === "en";
    const parentLabel = isEn ? (parentGender === "mom" ? "Mom" : "Dad") : (parentGender === "mom" ? "אמא" : "אבא");
    const childLabel = isEn ? (childGender === "girl" ? "girl" : "boy") : (childGender === "girl" ? "בת" : "בן");
    const lines = [
      isEn ? "Create 8 fun conversation questions in English for a parent and child." : "צור 8 שאלות שיחה כיפיות בעברית להורה וילד/ה.",
      "הורה: " + parentLabel + ". ילד/ה: " + (childName||"") + " (" + childLabel + ", גיל " + (childAge||"8") + ").",
      "תחומי עניין: " + (childInterests||[]).join(", ") + ".",
      "שלב: חלומות, דמיון, ערכים, תרחישים מצחיקים, זיכרונות.",
      isEn ? "English only. No other languages." : "עברית בלבד ללא יוצא מן הכלל.",
      'Return ONLY a JSON array of 8 strings: ["q1","q2",...]'
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
    const { tradition, childAge, childName, childGender, parentGender, lang } = req.body;
    const isEn = lang === "en";
    const parentLabel = isEn ? (parentGender === "mom" ? "Mom" : "Dad") : (parentGender === "mom" ? "אמא" : "אבא");
    const childLabel = isEn ? (childGender === "girl" ? "girl" : "boy") : (childGender === "girl" ? "בת" : "בן");

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
