import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useWilds, WildsStrip, WildsScreen, WildsCeremony } from "./wilds.jsx";
import { useGarden, GardenTablet, GardenScreen } from "./garden.jsx";

function StreakFlame({ n }) {
  const big = n >= 30;
  return (
    <div style={{ position: "relative", width: 48, height: 48, display: "grid", placeItems: "center" }}>
      <Icon name="fire" size={48} color={big ? "#C97B2D" : AMBER} />
      <span style={{ position: "absolute", top: "56%", left: "50%", transform: "translate(-50%,-50%)", fontSize: n >= 100 ? 12.5 : 15, fontWeight: 900, color: "#FFFDF6", textShadow: "0 1px 3px rgba(120,60,10,.6)", letterSpacing: "-.02em" }}>{n}</span>
    </div>
  );
}

const HERO_IMG = "./hero.jpg";
const LOGO = "./logo.png";
const KCAL_IMG = "./kcal-art.jpg";
const RANKS_IMG = "./ranks-header.jpg";
const PROFILE_IMG = "./profile-header.jpg";
const TEAM_IMG = "./team-header.jpg";
const IMGS = { calories: "./kcal-art.jpg", steps: "./cat-steps.jpg", water: "./cat-water.jpg", workout: "./cat-workout.jpg", sleep: "./cat-sleep.jpg", meditation: "./cat-meditation.jpg", reading: "./cat-reading.jpg", fasting: "./cat-fasting.jpg", focus: "./cat-focus.jpg", journal: "./cat-journal.jpg" };
const ZEN = ["./zen-1.jpg", "./zen-2.jpg", "./zen-3.jpg"];
// --- embedded illustration assets (Grok, base64) ---

/* ================================================================
   RALLY — Better Together · v2
   ----------------------------------------------------------------
   Categories & scoring:
     Steps    — 1 pt / 100 steps · uncapped
     Water    — 100 pts at 3 L · health-capped at 4 L
     Sleep    — 10 pts / hour · cap 100
     Workout  — quick log (any duration = 100) OR drill down
                (Strength → lift + weight/reps/sets · Cardio/Mobility/
                Sports → type + minutes · Custom). Details are tracked
                on your profile but pool into ONE "Workout" score = 100
                for a logged session, +partial for extra volume.
     Meditation — 10 pts / min · cap 100
     Reading    — 10 pts / page · cap 100
     Journal    — yes/no · 100
   Team score = raw SUM of members. Individual board runs alongside.
   Character gear from real monthly stats. Shared storage syncs group.
   ================================================================ */

const INK = "#262B22", MUT = "#9A9283", CREAM = "#F3ECE1", CARD = "#FFFDF8", LINE = "#EDE5D6", GREEN = "#2A5445", GREEN_D = "#1F4033", LIME = "#E8863A", FIELD = "#F3ECE1", AMBER = "#E8863A", FOREST = "#2A5445";
const SAGE = "#6FA36B", LEAF = "#8CBE73";

const CATS = [
  { id: "steps", name: "Steps", color: "#5B9E5D", pale: "#EAF3EA", type: "steps", hint: "1 pt per 100 steps · no cap" },
  { id: "water", name: "Hydration", color: "#4E9BD8", pale: "#EAF3FB", type: "water", hint: "100 pts at 3 L · capped for safety" },
  { id: "sleep", name: "Sleep", color: "#E0A438", pale: "#FBF3E2", type: "unit", unit: "hrs", step: 0.5, big: 1, hint: "10 pts per hour · capped at 100" },
  { id: "workout", name: "Workout", color: "#8B6FC9", pale: "#F1EDF9", type: "workout", hint: "Log a session, or tap + to track the details" },
  { id: "meditation", name: "Meditation", color: "#4FA898", pale: "#E9F5F2", type: "unit", unit: "min", step: 5, big: 10, hint: "10 pts per minute · capped at 100" },
  { id: "reading", name: "Reading", color: "#C9678B", pale: "#F9ECF1", type: "unit", unit: "pages", step: 1, big: 10, hint: "10 pts per page · capped at 100" },
  { id: "focus", name: "Focus", color: "#5E7FA8", pale: "#E9EFF7", type: "unit", unit: "min", step: 5, big: 25, hint: "2 pts per minute · capped at 100" },
  { id: "fasting", name: "Fasting", color: "#7A8C4F", pale: "#F0F3E3", type: "bool", desc: "Kept my fasting window today" },
  { id: "calories", name: "Calories burned", color: "#E8863A", pale: "#FBEEDD", type: "unit", unit: "kcal", step: 50, big: 100, hint: "1 pt per 10 kcal · capped at 100" },
  { id: "journal", name: "Journal", color: "#C9814E", pale: "#F9F0E8", type: "bool", desc: "A few lines is plenty" },
];

const WORKOUT_TREE = {
  strength: { name: "Strength", mode: "lift", items: ["Bench Press", "Incline Bench", "Squat", "Deadlift", "Overhead Press", "Barbell Row", "Dumbbell Row", "Lat Pulldown", "Leg Press", "Romanian Deadlift", "Pull-ups", "Dips", "Bicep Curl", "Tricep Ext", "Lateral Raise"] },
  cardio: { name: "Cardio", mode: "min", items: ["Running", "Cycling", "Rowing", "Elliptical", "Stair Climber", "Jump Rope", "Swimming", "Hiking", "HIIT"] },
  mobility: { name: "Mobility", mode: "min", items: ["Yoga", "Stretching", "Pilates", "Foam Rolling"] },
  sports: { name: "Sports", mode: "min", items: ["Basketball", "Soccer", "Tennis", "Pickleball", "Volleyball", "Baseball", "Football", "Hockey", "Golf", "Badminton"] },
};

const TITLES = ["10K Machine", "Iron Engine", "Trailblazer", "Zen Circuit", "Page Turner", "Night Owl", "Steady Hand", "Comeback Kid", "PR Chaser"];
const SHIELD_COLORS = ["#5B9E5D", "#4E9BD8", "#8B6FC9", "#D96A4E", "#E0A438", "#4FA898"];
const WATER_CAP_ML = 4000, WATER_GOAL_ML = 3000;

/* ---- Daily bonus challenges: auto-complete off the day's log ---- */
const CHALLENGES = [
  { id: "c_steps", name: "Hit 10,000 steps", icon: "steps", color: "#5B9E5D", bonus: 200, done: (l) => (Number(l.steps) || 0) >= 10000 },
  { id: "c_water", name: "Drink 3 L of water", icon: "water", color: "#4E9BD8", bonus: 150, done: (l) => (Number(l.water) || 0) >= 3000 },
  { id: "c_workout", name: "Complete a workout", icon: "workout", color: "#8B6FC9", bonus: 200, done: (l) => ptsWorkout(l) > 0 },
  { id: "c_sleep", name: "Sleep 8+ hours", icon: "sleep", color: "#E0A438", bonus: 150, done: (l) => (Number(l.sleep) || 0) >= 8 },
  { id: "c_mind", name: "Meditate 10+ min", icon: "meditation", color: "#4FA898", bonus: 100, done: (l) => (Number(l.meditation) || 0) >= 10 },
  { id: "c_read", name: "Read 10+ pages", icon: "reading", color: "#C9678B", bonus: 100, done: (l) => (Number(l.reading) || 0) >= 10 },
];
const CUSTOM_CH = { id: "c_custom", name: "Team pick", icon: "goals", color: "#2A5445", bonus: 100, done: (l) => !!l.cc };
const chDayIndex = (start) => Math.floor((Date.now() - start) / 86400000) + 1;
const WILDCARD = { id: "c_wild", name: "Wildcard", icon: "bolt", color: "#E8863A", bonus: 150, done: (l) => !!l.wild };
CHALLENGES.push(WILDCARD); CHALLENGES.push(CUSTOM_CH);
const WILDCARDS = [
  "Take your workout outside today",
  "Do 20 push-ups the moment you read this",
  "Walk a route you've never taken before",
  "No phone for the first 30 min after waking",
  "Take the stairs every single time today",
  "Drink a glass of water before every meal",
  "Text a teammate one genuine compliment",
  "Stretch for 5 minutes before bed",
  "Eat something green with every meal",
  "Do a wall-sit during your next TV episode",
  "Go to bed 30 minutes earlier tonight",
  "Learn one new word and use it out loud",
  "Take a photo of something beautiful on a walk",
  "Cold water for the last 20s of your shower",
  "No sugar today — read the labels",
  "Call someone you haven't talked to in a month",
  "Eat one meal with zero screens",
  "Do 50 squats spread across the day",
  "Park far away or get off one stop early",
  "Write down 3 wins before bed",
  "Hold a 1-minute plank — twice",
  "No snoozing — up on the first alarm",
  "Compliment a stranger today",
  "Walk during every phone call",
  "Try a food you've never eaten",
  "No caffeine after noon",
  "Do your least favorite chore first",
  "Balance on one foot while brushing teeth",
  "Send a voice note instead of texting today",
  "10 minutes of sunlight before 10am",
  "Take a different route to work or school",
  "Do push-ups every time you check social media",
  "Eat dinner before 7pm tonight",
  "No complaints for the whole day",
  "Dance to one full song — commit",
  "Write a thank-you message to someone",
  "Carry water everywhere you go today",
  "Do 25 jumping jacks every odd hour",
  "Read 5 pages of something outside your taste",
  "Sit on the floor instead of the couch tonight",
  "Take the longest walking path available today",
  "No eating after 9pm",
  "Learn to say hello in a new language",
  "Do a 2-minute cold face plunge",
  "Sketch or doodle something for 5 minutes",
  "Give away or donate one item you don't use",
  "Take a picture of the sky and share it in chat",
  "Do calf raises while waiting in any line",
  "Make your bed like a drill sergeant is coming",
  "Zero added salt today — taste your food",
  "Hum or sing in the shower — loudly",
  "Ask a teammate what they're working toward",
  "Walk barefoot on grass for a few minutes",
  "Try box breathing before a stressful moment",
  "Eat a meal with your non-dominant hand",
  "Plan tomorrow in 3 bullet points tonight",
  "Do a random act of kindness — report back in chat",
  "Stand for every meeting or call today",
  "Watch a sunset or sunrise start to finish",
  "Go the whole day without saying 'I can't'",
];
const wildcardOf = (dateKey) => { const h = [...String(dateKey)].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0; return WILDCARDS[h % WILDCARDS.length]; };
const challengeBonus = (l = {}) => CHALLENGES.reduce((s, c) => s + (c.done(l) ? c.bonus : 0), 0);

/* ---- Multi-team membership (v32) ----
   One body, one daily log, many teams. p.teams holds every joined code;
   p.sinceMap fences scoring per team by join date. Legacy single p.team
   records read transparently; p.team keeps mirroring teams[0] so any
   stale client still sees a sane value during migration week. */
const teamsOf = (p) => p?.teams || (p?.team ? [p.team] : []);
const inTeam = (p, code) => teamsOf(p).includes(code);
const sinceOf = (p, code) => (p?.sinceMap && p.sinceMap[code]) || (p?.team === code ? p.since : undefined);
const sinceOk = (p, d, code) => { const s = code ? sinceOf(p, code) : p.since; return !s || d >= s; };
/* ---- Team activity feed (shared, capped) ---- */
const FK = (code) => `rt1:f:${code}`;
const CK = (code) => `rt1:c:${code}`;
async function chatPost(code, msg) {
  try {
    const cur = (await sGet(CK(code), true)) || [];
    const next = [...cur, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, ts: Date.now(), ...msg }].slice(-60);
    await sSet(CK(code), next, true); return next;
  } catch { return null; }
}
async function feedPost(code, ev) {
  try {
    const cur = (await sGet(FK(code), true)) || [];
    const next = [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ts: Date.now(), ...ev }, ...cur].slice(0, 40);
    await sSet(FK(code), next, true);
  } catch { }
}
const AK = (code) => `rt1:a:${code}`;
const GK = "rt1:grat";
async function feedCheer(code, evId, pid) {
  try {
    const cur = (await sGet(FK(code), true)) || [];
    const next = cur.map((e) => { if (e.id !== evId) return e; const ch = e.cheers || []; return { ...e, cheers: ch.includes(pid) ? ch.filter((x) => x !== pid) : [...ch, pid] }; });
    await sSet(FK(code), next, true);
    return next;
  } catch { return null; }
}
const agoStr = (ts) => { const m = Math.floor((Date.now() - ts) / 60000); if (m < 1) return "just now"; if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`; };

/* ---- Breathe space: affirmations, mantras, box breathing, focus ---- */
const AFFIRMATIONS = [
  "Discipline is choosing between what you want now and what you want most.",
  "You do not rise to the level of your goals. You fall to the level of your systems.",
  "How you do anything is how you do everything.",
  "The days are long but the decades are short. Spend today on purpose.",
  "A year from now you will wish you had started today.",
  "You are what you repeatedly do. Excellence is a habit, not an act.",
  "Motivation gets you going. Habit keeps you going.",
  "Take care of your body. It's the only place you have to live.",
  "The best time to plant a tree was twenty years ago. The second best time is now.",
  "It is not the mountain we conquer, but ourselves.",
  "Hard choices, easy life. Easy choices, hard life.",
  "What you do every day matters more than what you do once in a while.",
];
const QUOTES = [
  { t: "Waste no more time arguing about what a good man should be. Be one.", by: "Marcus Aurelius" },
  { t: "Dwell on the beauty of life. Watch the stars, and see yourself running with them.", by: "Marcus Aurelius" },
  { t: "Very little is needed to make a happy life; it is all within yourself.", by: "Marcus Aurelius" },
  { t: "The impediment to action advances action. What stands in the way becomes the way.", by: "Marcus Aurelius" },
  { t: "If it is not right, do not do it; if it is not true, do not say it.", by: "Marcus Aurelius" },
  { t: "Confine yourself to the present.", by: "Marcus Aurelius" },
  { t: "The soul becomes dyed with the color of its thoughts.", by: "Marcus Aurelius" },
  { t: "Luck is what happens when preparation meets opportunity.", by: "Seneca" },
  { t: "Difficulties strengthen the mind, as labor does the body.", by: "Seneca" },
  { t: "He who is brave is free.", by: "Seneca" },
  { t: "Begin at once to live, and count each separate day as a separate life.", by: "Seneca" },
  { t: "While we are postponing, life speeds by.", by: "Seneca" },
  { t: "No man was ever wise by chance.", by: "Seneca" },
  { t: "Hang on to your youthful enthusiasms — you'll be able to use them better when you're older.", by: "Seneca" },
  { t: "Wealth consists not in having great possessions, but in having few wants.", by: "Epictetus" },
  { t: "First say to yourself what you would be; and then do what you have to do.", by: "Epictetus" },
  { t: "No man is free who is not master of himself.", by: "Epictetus" },
  { t: "It's not what happens to you, but how you react to it that matters.", by: "Epictetus" },
  { t: "Don't explain your philosophy. Embody it.", by: "Epictetus" },
  { t: "Only the educated are free.", by: "Epictetus" },
  { t: "He who laughs at himself never runs out of things to laugh at.", by: "Epictetus" },
  { t: "A journey of a thousand miles begins with a single step.", by: "Lao Tzu" },
  { t: "When I let go of what I am, I become what I might be.", by: "Lao Tzu" },
  { t: "Mastering others is strength. Mastering yourself is true power.", by: "Lao Tzu" },
  { t: "Do the difficult things while they are easy and do the great things while they are small.", by: "Lao Tzu" },
  { t: "A good traveler has no fixed plans, and is not intent on arriving.", by: "Lao Tzu" },
  { t: "Muddy water, let stand, becomes clear.", by: "Lao Tzu" },
  { t: "Respond to anger with silence.", by: "Lao Tzu" },
  { t: "It does not matter how slowly you go as long as you do not stop.", by: "Confucius" },
  { t: "The man who moves a mountain begins by carrying away small stones.", by: "Confucius" },
  { t: "Our greatest glory is not in never falling, but in rising every time we fall.", by: "Confucius" },
  { t: "When it is obvious that the goals cannot be reached, don't adjust the goals, adjust the action steps.", by: "Confucius" },
  { t: "Wherever you go, go with all your heart.", by: "Confucius" },
  { t: "The superior man is modest in his speech but exceeds in his actions.", by: "Confucius" },
  { t: "Better a diamond with a flaw than a pebble without.", by: "Confucius" },
  { t: "What you seek is seeking you.", by: "Rumi" },
  { t: "Raise your words, not voice. It is rain that grows flowers, not thunder.", by: "Rumi" },
  { t: "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.", by: "Rumi" },
  { t: "Set your life on fire. Seek those who fan your flames.", by: "Rumi" },
  { t: "You were born with wings, why prefer to crawl through life?", by: "Rumi" },
  { t: "Let the beauty of what you love be what you do.", by: "Rumi" },
  { t: "Where there is ruin, there is hope for a treasure.", by: "Rumi" },
  { t: "Not all those who wander are lost.", by: "J.R.R. Tolkien" },
  { t: "It always seems impossible until it's done.", by: "Old proverb" },
  { t: "Go confidently in the direction of your dreams. Live the life you have imagined.", by: "Henry David Thoreau" },
  { t: "What you get by achieving your goals is not as important as what you become by achieving your goals.", by: "Henry David Thoreau" },
  { t: "An early-morning walk is a blessing for the whole day.", by: "Henry David Thoreau" },
  { t: "Heaven is under our feet as well as over our heads.", by: "Henry David Thoreau" },
  { t: "Live in each season as it passes; breathe the air, drink the drink, taste the fruit.", by: "Henry David Thoreau" },
  { t: "It's not what you look at that matters, it's what you see.", by: "Henry David Thoreau" },
  { t: "The only way to make sense out of change is to plunge into it, move with it, and join the dance.", by: "Alan Watts" },
  { t: "Do not go where the path may lead, go instead where there is no path and leave a trail.", by: "Ralph Waldo Emerson" },
  { t: "The only person you are destined to become is the person you decide to be.", by: "Ralph Waldo Emerson" },
  { t: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", by: "Ralph Waldo Emerson" },
  { t: "Write it on your heart that every day is the best day in the year.", by: "Ralph Waldo Emerson" },
  { t: "Once you make a decision, the universe conspires to make it happen.", by: "Ralph Waldo Emerson" },
  { t: "The first wealth is health.", by: "Ralph Waldo Emerson" },
  { t: "Energy and persistence conquer all things.", by: "Benjamin Franklin" },
  { t: "Well done is better than well said.", by: "Benjamin Franklin" },
  { t: "Early to bed and early to rise makes a man healthy, wealthy, and wise.", by: "Benjamin Franklin" },
  { t: "You may delay, but time will not.", by: "Benjamin Franklin" },
  { t: "Little strokes fell great oaks.", by: "Benjamin Franklin" },
  { t: "An investment in knowledge pays the best interest.", by: "Benjamin Franklin" },
  { t: "It is health that is real wealth and not pieces of gold and silver.", by: "Mahatma Gandhi" },
  { t: "The future depends on what you do today.", by: "Mahatma Gandhi" },
  { t: "Strength does not come from physical capacity. It comes from an indomitable will.", by: "Mahatma Gandhi" },
  { t: "In a gentle way, you can shake the world.", by: "Mahatma Gandhi" },
  { t: "Simplicity is the ultimate sophistication.", by: "Leonardo da Vinci" },
  { t: "Learning never exhausts the mind.", by: "Leonardo da Vinci" },
  { t: "Time stays long enough for anyone who will use it.", by: "Leonardo da Vinci" },
  { t: "I have been impressed with the urgency of doing. Knowing is not enough; we must apply.", by: "Leonardo da Vinci" },
  { t: "Walking is man's best medicine.", by: "Hippocrates" },
  { t: "Let food be thy medicine and medicine be thy food.", by: "Hippocrates" },
  { t: "Healing is a matter of time, but it is sometimes also a matter of opportunity.", by: "Hippocrates" },
  { t: "To keep the body in good health is a duty; otherwise we shall not be able to keep our mind strong and clear.", by: "Buddha (attributed)" },
  { t: "Drop by drop is the water pot filled.", by: "Buddha (attributed)" },
  { t: "You yourself, as much as anybody in the entire universe, deserve your love and affection.", by: "Buddha (attributed)" },
  { t: "Peace comes from within. Do not seek it without.", by: "Buddha (attributed)" },
  { t: "Each morning we are born again. What we do today is what matters most.", by: "Buddha (attributed)" },
  { t: "There is no path to happiness: happiness is the path.", by: "Buddha (attributed)" },
  { t: "The mind is everything. What you think you become.", by: "Buddha (attributed)" },
  { t: "Quality is not an act, it is a habit.", by: "Aristotle" },
  { t: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", by: "Will Durant, on Aristotle" },
  { t: "Patience is bitter, but its fruit is sweet.", by: "Aristotle" },
  { t: "Through discipline comes freedom.", by: "Aristotle" },
  { t: "Pleasure in the job puts perfection in the work.", by: "Aristotle" },
  { t: "Knowing yourself is the beginning of all wisdom.", by: "Aristotle" },
  { t: "The secret of getting ahead is getting started.", by: "Mark Twain" },
  { t: "Continuous improvement is better than delayed perfection.", by: "Mark Twain" },
  { t: "The two most important days in your life are the day you are born and the day you find out why.", by: "Mark Twain" },
  { t: "Courage is resistance to fear, mastery of fear — not absence of fear.", by: "Mark Twain" },
  { t: "Twenty years from now you will be more disappointed by the things you didn't do than by the ones you did do.", by: "Mark Twain" },
  { t: "A man who carries a cat by the tail learns something he can learn in no other way.", by: "Mark Twain" },
  { t: "Do something every day that you don't want to do.", by: "Mark Twain" },
  { t: "Nothing in life is to be feared, it is only to be understood.", by: "Marie Curie" },
  { t: "I was taught that the way of progress was neither swift nor easy.", by: "Marie Curie" },
  { t: "Be less curious about people and more curious about ideas.", by: "Marie Curie" },
  { t: "Life shrinks or expands in proportion to one's courage.", by: "Anaïs Nin" },
  { t: "And the day came when the risk to remain tight in a bud was more painful than the risk it took to blossom.", by: "Anaïs Nin" },
  { t: "We don't see things as they are, we see them as we are.", by: "Anaïs Nin" },
  { t: "It is never too late to be what you might have been.", by: "George Eliot" },
  { t: "The strongest principle of growth lies in human choice.", by: "George Eliot" },
  { t: "What do we live for, if it is not to make life less difficult for each other?", by: "George Eliot" },
  { t: "Nothing great was ever achieved without enthusiasm.", by: "Ralph Waldo Emerson" },
  { t: "He that can have patience can have what he will.", by: "Benjamin Franklin" },
  { t: "Everything you can imagine is real.", by: "Pablo Picasso" },
  { t: "Action is the foundational key to all success.", by: "Pablo Picasso" },
  { t: "I am always doing that which I cannot do, in order that I may learn how to do it.", by: "Pablo Picasso" },
  { t: "In the middle of difficulty lies opportunity.", by: "Albert Einstein" },
  { t: "Life is like riding a bicycle. To keep your balance, you must keep moving.", by: "Albert Einstein" },
  { t: "A person who never made a mistake never tried anything new.", by: "Albert Einstein" },
  { t: "Weak people revenge. Strong people forgive. Intelligent people ignore.", by: "Albert Einstein (attributed)" },
  { t: "Look deep into nature, and then you will understand everything better.", by: "Albert Einstein" },
  { t: "Out of clutter, find simplicity.", by: "Albert Einstein" },
  { t: "The best way out is always through.", by: "Robert Frost" },
  { t: "In three words I can sum up everything I've learned about life: it goes on.", by: "Robert Frost" },
  { t: "Two roads diverged in a wood, and I took the one less traveled by.", by: "Robert Frost" },
  { t: "Hope is the thing with feathers that perches in the soul.", by: "Emily Dickinson" },
  { t: "Forever is composed of nows.", by: "Emily Dickinson" },
  { t: "We never know how high we are till we are called to rise.", by: "Emily Dickinson" },
  { t: "Not knowing when the dawn will come, I open every door.", by: "Emily Dickinson" },
  { t: "If your ship doesn't come in, swim out to meet it.", by: "Jonathan Winters" },
  { t: "Tough times never last, but tough people do.", by: "Robert H. Schuller" },
  { t: "Fall seven times, stand up eight.", by: "Japanese proverb" },
  { t: "The best time to plant a tree was twenty years ago. The second best time is now.", by: "Chinese proverb" },
  { t: "Vision without action is a daydream. Action without vision is a nightmare.", by: "Japanese proverb" },
  { t: "A smooth sea never made a skilled sailor.", by: "Proverb" },
  { t: "Slow and steady wins the race.", by: "Aesop" },
  { t: "No act of kindness, no matter how small, is ever wasted.", by: "Aesop" },
  { t: "After the rain, the sun will reappear. There is life. After the pain, the joy will still be here.", by: "Walt Whitman (adapted)" },
  { t: "Keep your face always toward the sunshine, and shadows will fall behind you.", by: "Walt Whitman" },
  { t: "Happiness, not in another place but this place… not for another hour, but this hour.", by: "Walt Whitman" },
  { t: "Be curious, not judgmental.", by: "Walt Whitman (attributed)" },
  { t: "Either you run the day or the day runs you.", by: "Jim Rohn" },
  { t: "Take care of your body. It's the only place you have to live.", by: "Jim Rohn" },
  { t: "Motivation is what gets you started. Habit is what keeps you going.", by: "Jim Rohn" },
  { t: "Discipline is the bridge between goals and accomplishment.", by: "Jim Rohn" },
  { t: "What is not started today is never finished tomorrow.", by: "Johann Wolfgang von Goethe" },
  { t: "Knowing is not enough; we must apply. Willing is not enough; we must do.", by: "Johann Wolfgang von Goethe" },
  { t: "Whatever you can do, or dream you can, begin it. Boldness has genius, power and magic in it.", by: "Johann Wolfgang von Goethe (attributed)" },
  { t: "Rest is not idleness — to lie sometimes on the grass under trees is by no means a waste of time.", by: "John Lubbock" },
  { t: "Earth and sky, woods and fields, are excellent schoolmasters.", by: "John Lubbock" },
  { t: "In every walk with nature one receives far more than he seeks.", by: "John Muir" },
  { t: "The mountains are calling and I must go.", by: "John Muir" },
  { t: "Of all the paths you take in life, make sure a few of them are dirt.", by: "John Muir" },
  { t: "The power of imagination makes us infinite.", by: "John Muir" },
  { t: "One touch of nature makes the whole world kin.", by: "William Shakespeare" },
  { t: "Our bodies are our gardens, to the which our wills are gardeners.", by: "William Shakespeare" },
  { t: "Self-love, my liege, is not so vile a sin as self-neglecting.", by: "William Shakespeare" },
  { t: "How poor are they that have not patience! What wound did ever heal but by degrees?", by: "William Shakespeare" },
  { t: "You have power over your mind, not outside events. Realize this, and you will find strength.", by: "Marcus Aurelius" },
  { t: "It is not that we have a short time to live, but that we waste a lot of it.", by: "Seneca" },
  { t: "Nature does not hurry, yet everything is accomplished.", by: "Lao Tzu" },
  { t: "The quieter you become, the more you are able to hear.", by: "Rumi" },
  { t: "I have lived through many catastrophes in my life. Most of them never happened.", by: "Mark Twain" },
  { t: "It is not the mountain we conquer, but ourselves.", by: "Edmund Hillary" },
  { t: "We suffer more often in imagination than in reality.", by: "Seneca" },
  { t: "The happiness of your life depends upon the quality of your thoughts.", by: "Marcus Aurelius" },
  { t: "Adopt the pace of nature: her secret is patience.", by: "Ralph Waldo Emerson" },
  { t: "Every man is the builder of a temple, called his body.", by: "Henry David Thoreau" },
  { t: "He who conquers himself is the mightiest warrior.", by: "Confucius" },
  { t: "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.", by: "Thich Nhat Hanh" },
  { t: "Do not pray for an easy life; pray for the strength to endure a difficult one.", by: "Bruce Lee" },
  { t: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", by: "Ralph Waldo Emerson" },
  { t: "The impediment to action advances action. What stands in the way becomes the way.", by: "Marcus Aurelius" },
  { t: "Between stimulus and response there is a space. In that space is our power to choose.", by: "Viktor Frankl" },
];
const dailyPick = (arr, salt = 0) => { const h = [...today()].reduce((a, c) => a * 33 + c.charCodeAt(0), 5 + salt) >>> 0; return arr[h % arr.length]; };

function ZenBG({ z, style }) {
  return z.startsWith("linear") ? <div style={{ ...style, background: z }} /> : <img src={z} alt="" style={{ ...style, objectFit: "cover" }} />;
}
function BrowseTeams({ allTeams, allPlayers, onJoin, onClose, busy }) {
  const pub = allTeams.filter((t) => t.public).map((t) => {
    const members = allPlayers.filter((p) => inTeam(p, t.code)); if (members.length === 0) return null;
    return { ...t, count: members.length };
  }).filter((t) => t.count > 0).sort((a, b) => b.count - a.count);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", flexDirection: "column", justifyContent: "flex-end" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(30,34,26,.45)", backdropFilter: "blur(2px)" }} />
      <div style={{ position: "relative", background: "#FFFDF8", borderRadius: "30px 30px 0 0", maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 18px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="rh" style={{ fontSize: 21 }}>Public teams</div>
          <button className="rghost" onClick={onClose}>Close</button>
        </div>
        <div style={{ padding: "0 18px 24px", overflowY: "auto" }}>
          {pub.length === 0 && <div style={{ fontSize: 13.5, color: "#9A9283", fontWeight: 700, padding: "20px 0", textAlign: "center" }}>No public teams yet — be the first to start one everyone can join.</div>}
          {pub.map((t) => (
            <div key={t.code} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1.5px dashed #EFE9D6" }}>
              <TeamCrest team={t} size={40} active />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{t.name}</div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9A9283" }}>{t.count} member{t.count === 1 ? "" : "s"} · {MODE_OF(t) === "party" ? "solo team" : "team battle"}</div>
              </div>
              <button className="rbtn" disabled={busy} style={{ width: "auto", padding: "10px 18px", fontSize: 13.5 }} onClick={() => onJoin(t)}>Join</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GymHub({ logs = {}, onClose }) {
  const days = Object.entries(logs).filter(([, l]) => (l.workoutSets || []).length > 0 || l.workoutQuick).sort((a, b) => b[0].localeCompare(a[0]));
  const prs = {};
  for (const [d, l] of days) for (const s of (l.workoutSets || [])) {
    if (s.type !== "strength" || !s.weight) continue;
    if (!prs[s.name] || s.weight > prs[s.name].weight) prs[s.name] = { weight: s.weight, reps: s.reps, d };
  }
  const prList = Object.entries(prs).sort((a, b) => b[1].weight - a[1].weight);
  const maxPr = Math.max(...prList.map(([, v]) => v.weight), 1);
  const fmtD = (d) => new Date(d + "T12:00:00").toLocaleString("en-US", { month: "short", day: "numeric" });
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", flexDirection: "column", justifyContent: "flex-end" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(30,34,26,.45)", backdropFilter: "blur(2px)" }} />
      <div style={{ position: "relative", background: "#FFFDF8", borderRadius: "30px 30px 0 0", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ position: "relative", height: 118, flexShrink: 0 }}>
          <img src={IMGS.workout} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(25,30,22,.12) 0%, rgba(25,30,22,.55) 100%)" }} />
          <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 12, right: 12, width: 34, height: 34, borderRadius: 99, border: "none", background: "rgba(255,253,248,.85)", display: "grid", placeItems: "center", cursor: "pointer" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A5240" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
          <div style={{ position: "absolute", left: 18, bottom: 11 }}>
            <div className="rh" style={{ fontSize: 23, color: "#FFF", textShadow: "0 1px 10px rgba(15,20,14,.5)" }}>Your lift book</div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,.9)", textShadow: "0 1px 6px rgba(15,20,14,.5)" }}>{days.length} session{days.length === 1 ? "" : "s"} logged · {prList.length} exercises tracked</div>
          </div>
        </div>
        <div style={{ padding: "16px 18px 24px", overflowY: "auto" }}>
          {prList.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div className="rlabel" style={{ marginBottom: 10 }}>All-time PRs · heaviest set per exercise</div>
              {prList.map(([name, v]) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                  <span style={{ width: 108, fontSize: 12.5, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
                  <div style={{ flex: 1, height: 14, background: "#F1EADD", borderRadius: 99, overflow: "hidden" }}><div style={{ width: `${(v.weight / maxPr) * 100}%`, height: "100%", background: "#8B6FC9", borderRadius: 99 }} /></div>
                  <span style={{ width: 108, textAlign: "right", fontSize: 12, fontWeight: 800 }}>{v.weight} lb × {v.reps || "?"} <span style={{ color: "#9A9283", fontWeight: 700 }}>· {fmtD(v.d)}</span></span>
                </div>
              ))}
            </div>
          )}
          <div className="rlabel" style={{ marginBottom: 10 }}>Past workouts</div>
          {days.length === 0 && <div style={{ fontSize: 13, color: "#9A9283", fontWeight: 700 }}>No sessions yet — your history builds here as you log.</div>}
          {days.slice(0, 30).map(([d, l]) => {
            const s = l.workoutSets || [];
            const vol = s.reduce((a, x) => a + (x.weight || 0) * (x.reps || 0) * (x.sets || 1), 0);
            return (
              <div key={d} style={{ padding: "11px 0", borderBottom: "1.5px dashed #EFE9D6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 800 }}>{new Date(d + "T12:00:00").toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#9A9283" }}>{vol > 0 ? `${vol.toLocaleString()} lb vol` : ""}{l.workoutMin ? ` · ${l.workoutMin} min` : ""}{s.length === 0 && l.workoutQuick ? "quick session" : ""}</span>
                </div>
                {s.length > 0 && <div style={{ fontSize: 12, fontWeight: 600, color: "#6A6250", lineHeight: 1.6 }}>{s.map((x, i) => <span key={i}>{x.name}{x.weight ? ` ${x.weight}×${x.reps}` : x.min ? ` ${x.min}m` : ""}{i < s.length - 1 ? "  ·  " : ""}</span>)}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const GRATITUDE_QUOTES = [
  { t: "I am grateful for this body that carries me through every single day.", by: "Affirmation" },
  { t: "Today I choose to notice what is going right.", by: "Affirmation" },
  { t: "I am thankful for the breath in my lungs and the strength in my legs.", by: "Affirmation" },
  { t: "Small joys are still joys, and my life is full of them.", by: "Affirmation" },
  { t: "I am grateful for the people who check in on me.", by: "Affirmation" },
  { t: "My morning coffee, warm and unhurried, is a gift.", by: "Affirmation" },
  { t: "I appreciate how far I have come, even when the road felt slow.", by: "Affirmation" },
  { t: "I am thankful for a bed to rest in and a reason to get up.", by: "Affirmation" },
  { t: "Gratitude turns what I have into enough.", by: "Affirmation" },
  { t: "I am grateful for the lessons hidden inside hard days.", by: "Affirmation" },
  { t: "Someone laughed with me recently, and that mattered.", by: "Affirmation" },
  { t: "I am thankful for clean water, warm food, and quiet moments.", by: "Affirmation" },
  { t: "My body healed something this week without being asked.", by: "Affirmation" },
  { t: "I am grateful for second chances, especially the ones I gave myself.", by: "Affirmation" },
  { t: "Today is unrepeatable, and I get to live it.", by: "Affirmation" },
  { t: "I appreciate the friends who feel like home.", by: "Affirmation" },
  { t: "I am thankful for music that understands me.", by: "Affirmation" },
  { t: "The sun rose again today, and so did I.", by: "Affirmation" },
  { t: "I am grateful for the strength I didn't know I had until I needed it.", by: "Affirmation" },
  { t: "I appreciate every meal made with care, including the simple ones.", by: "Affirmation" },
  { t: "I am thankful for the ability to learn, change, and begin again.", by: "Affirmation" },
  { t: "Rest is a gift, and today I accept it.", by: "Affirmation" },
  { t: "I am grateful for laughter that arrives at exactly the right time.", by: "Affirmation" },
  { t: "My past self worked hard for the life I have now. Thank you.", by: "Affirmation" },
  { t: "I am thankful for fresh air and the freedom to walk in it.", by: "Affirmation" },
  { t: "I notice and appreciate the kindness of strangers.", by: "Affirmation" },
  { t: "I am grateful for my five senses and everything they let me experience.", by: "Affirmation" },
  { t: "Today I am thankful for progress, not perfection.", by: "Affirmation" },
  { t: "I appreciate the roof over my head and the safety it gives me.", by: "Affirmation" },
  { t: "I am grateful for the family I was given and the family I chose.", by: "Affirmation" },
  { t: "Every heartbeat is something I never had to earn.", by: "Affirmation" },
  { t: "I am thankful for books, stories, and ideas that expand me.", by: "Affirmation" },
  { t: "I appreciate my own resilience — I have survived every hard day so far.", by: "Affirmation" },
  { t: "I am grateful for the seasons and the reminder that everything changes.", by: "Affirmation" },
  { t: "Someone believed in me once, and it changed things. Thank you.", by: "Affirmation" },
  { t: "I am thankful for slow mornings and soft evenings.", by: "Affirmation" },
  { t: "I appreciate the work my hands can do.", by: "Affirmation" },
  { t: "I am grateful for forgiveness — given, received, and self-directed.", by: "Affirmation" },
  { t: "Today I choose gratitude over comparison.", by: "Affirmation" },
  { t: "I am thankful for the technology that keeps me close to people I love.", by: "Affirmation" },
  { t: "I appreciate nature's patience: trees grow slowly and still become mighty.", by: "Affirmation" },
  { t: "I am grateful for my health, in all the ways it shows up for me.", by: "Affirmation" },
  { t: "A stranger smiled at me once and I still remember it.", by: "Affirmation" },
  { t: "I am thankful for warm showers and clean clothes.", by: "Affirmation" },
  { t: "I appreciate the courage it took to become who I am.", by: "Affirmation" },
  { t: "I am grateful for pets and animals that love without conditions.", by: "Affirmation" },
  { t: "Today I am thankful for the meal in front of me.", by: "Affirmation" },
  { t: "I appreciate quiet — the world's most underrated luxury.", by: "Affirmation" },
  { t: "I am grateful that I get to try again tomorrow.", by: "Affirmation" },
  { t: "My struggles taught me things comfort never could.", by: "Affirmation" },
  { t: "I am thankful for teachers, formal and accidental.", by: "Affirmation" },
  { t: "I appreciate my past for shaping me and my future for waiting for me.", by: "Affirmation" },
  { t: "I am grateful for hands to hold and shoulders to lean on.", by: "Affirmation" },
  { t: "Sunlight through a window is a small miracle I refuse to ignore.", by: "Affirmation" },
  { t: "I am thankful for my sense of humor — it has carried me far.", by: "Affirmation" },
  { t: "I appreciate every person who stayed.", by: "Affirmation" },
  { t: "I am grateful for the chance to be someone's reason to smile today.", by: "Affirmation" },
  { t: "Today I honor the ordinary: it is quietly extraordinary.", by: "Affirmation" },
  { t: "I am thankful for growth I can feel but not always see.", by: "Affirmation" },
  { t: "I appreciate rain, and what it does for everything that grows.", by: "Affirmation" },
  { t: "I am grateful for my mind, curious and still learning.", by: "Affirmation" },
  { t: "I have enough. I am enough. Today, that is plenty.", by: "Affirmation" },
  { t: "I am thankful for the invisible work my body does every second.", by: "Affirmation" },
  { t: "I appreciate honest conversations, even the uncomfortable ones.", by: "Affirmation" },
  { t: "I am grateful for beginnings, endings, and the courage both require.", by: "Affirmation" },
  { t: "Someone cooked for me once with love. I still taste it.", by: "Affirmation" },
  { t: "I am thankful for this exact, imperfect, irreplaceable day.", by: "Affirmation" },
  { t: "I appreciate the streets I know by heart and the places still unknown.", by: "Affirmation" },
  { t: "I am grateful for sleep and the mercy of waking rested.", by: "Affirmation" },
  { t: "Today I am thankful for one small thing I usually overlook.", by: "Affirmation" },
  { t: "I appreciate my own company more than I used to.", by: "Affirmation" },
  { t: "I am grateful for every risk that taught me I could.", by: "Affirmation" },
  { t: "Kindness costs nothing and I received some today.", by: "Affirmation" },
  { t: "I am thankful for the freedom to choose my thoughts.", by: "Affirmation" },
  { t: "I appreciate old photographs and the proof of joy they hold.", by: "Affirmation" },
  { t: "I am grateful for hobbies that ask nothing but my presence.", by: "Affirmation" },
  { t: "My heart has been broken and it still works. Thank you, heart.", by: "Affirmation" },
  { t: "I am thankful for the earth beneath me — steady, generous, alive.", by: "Affirmation" },
  { t: "I appreciate deadlines missed and disasters that never came.", by: "Affirmation" },
  { t: "I am grateful for the doctors, helpers, and healers of the world.", by: "Affirmation" },
  { t: "Today I choose to be thankful before I am asked to be.", by: "Affirmation" },
  { t: "I am thankful for my voice and the things it can say kindly.", by: "Affirmation" },
  { t: "I appreciate every version of me that got me here.", by: "Affirmation" },
  { t: "I am grateful for windows, light, and things that open.", by: "Affirmation" },
  { t: "A good stretch in the morning is gratitude in motion.", by: "Affirmation" },
  { t: "I am thankful for challenges that turned out to be doorways.", by: "Affirmation" },
  { t: "I appreciate the meals shared and the stories told over them.", by: "Affirmation" },
  { t: "I am grateful for silence after a long day.", by: "Affirmation" },
  { t: "Today I am thankful for someone I have never thanked out loud.", by: "Affirmation" },
  { t: "I appreciate my own patience, still under construction.", by: "Affirmation" },
  { t: "I am grateful for the small routines that hold my days together.", by: "Affirmation" },
  { t: "Warm socks. Cold water. Fresh air. Thank you.", by: "Affirmation" },
  { t: "I am thankful for the people who tell me the truth gently.", by: "Affirmation" },
  { t: "I appreciate time — the only gift everyone receives daily.", by: "Affirmation" },
  { t: "I am grateful for what my hands built, my feet walked, my heart held.", by: "Affirmation" },
  { t: "Today, being alive is achievement enough, and I am grateful for it.", by: "Affirmation" },
  { t: "I appreciate the person reading this — me — for showing up again.", by: "Affirmation" },
  { t: "I am thankful that gratitude itself is free, renewable, and mine.", by: "Affirmation" },
  { t: "The best things in my life were never things.", by: "Affirmation" },
  { t: "Reflect upon your present blessings, of which every man has many.", by: "Charles Dickens" },
  { t: "Enjoy the little things, for one day you may look back and realize they were the big things.", by: "Robert Brault" },
  { t: "Wear gratitude like a cloak and it will feed every corner of your life.", by: "Rumi" },
  { t: "Gratitude turns what we have into enough.", by: "Aesop (attributed)" },
  { t: "Give thanks for a little and you will find a lot.", by: "Hausa proverb" },
  { t: "The root of joy is gratefulness.", by: "David Steindl-Rast" },
  { t: "As we express our gratitude, we must never forget that the highest appreciation is not to utter words, but to live by them.", by: "John F. Kennedy" },
  { t: "Feeling gratitude and not expressing it is like wrapping a present and not giving it.", by: "William Arthur Ward" },
  { t: "Gratitude is the fairest blossom which springs from the soul.", by: "Henry Ward Beecher" },
  { t: "He who receives a benefit with gratitude repays the first installment on his debt.", by: "Seneca" },
  { t: "Nothing is more honorable than a grateful heart.", by: "Seneca" },
  { t: "Let us rise up and be thankful — for if we didn't learn a lot today, at least we learned a little.", by: "Buddha (attributed)" },
  { t: "Piglet noticed that even though he had a Very Small Heart, it could hold a rather large amount of Gratitude.", by: "A. A. Milne" },
  { t: "Gratitude is riches. Complaint is poverty.", by: "Doris Day" },
  { t: "When you are grateful, fear disappears and abundance appears.", by: "Old saying" },
  { t: "Gratitude is not only the greatest of virtues, but the parent of all the others.", by: "Cicero" },
  { t: "If the only prayer you ever say in your entire life is thank you, it will be enough.", by: "Meister Eckhart" },
  { t: "It is not joy that makes us grateful; it is gratitude that makes us joyful.", by: "David Steindl-Rast" },
  { t: "When you arise in the morning, think of what a precious privilege it is to be alive.", by: "Marcus Aurelius" },
  { t: "He is a wise man who does not grieve for the things which he has not, but rejoices for those which he has.", by: "Epictetus" },
  { t: "Wear gratitude like a cloak and it will feed every corner of your life.", by: "Rumi" },
  { t: "Gratitude makes sense of our past, brings peace for today, and creates a vision for tomorrow.", by: "Melody Beattie" },
  { t: "Enjoy the little things, for one day you may look back and realize they were the big things.", by: "Robert Brault" },
  { t: "Gratitude is the fairest blossom which springs from the soul.", by: "Henry Ward Beecher" },
  { t: "The highest appreciation is not to utter words, but to live by them.", by: "John F. Kennedy" },
];
const MOODS = [
  { id: 1, c: "#C96A5A", mouth: "M8 16.5 Q12 13.5 16 16.5" },
  { id: 2, c: "#C9963A", mouth: "M8 15.5 Q12 14.5 16 15.5" },
  { id: 3, c: "#9A9283", mouth: "M8 15.5 H16" },
  { id: 4, c: "#7FA88E", mouth: "M8 14.5 Q12 17 16 14.5" },
  { id: 5, c: "#2A5445", mouth: "M7.5 14 Q12 18.5 16.5 14" },
];
function MoodFace({ m, size = 26, active = true }) {
  const mid = typeof m === "object" && m ? m.id : m;
  const M = MOODS.find((x) => x.id === mid) || MOODS[2];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill={active ? M.c : "#EDE5D6"} opacity={active ? 1 : .9} />
      <circle cx="8.6" cy="9.6" r="1.3" fill="#FFFDF4" /><circle cx="15.4" cy="9.6" r="1.3" fill="#FFFDF4" />
      <path d={M.mouth} fill="none" stroke="#FFFDF4" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
const gv = (x) => (typeof x === "string" ? { t: x } : (x || {}));
function JournalSheet({ log, setLog, gratMap, moodMap, setMoodMap, onClose }) {
  const [qSeed, setQSeed] = useState(0);
  const q = GRATITUDE_QUOTES[(([...today()].reduce((a, c) => a * 31 + c.charCodeAt(0), 3) >>> 0) + qSeed) % GRATITUDE_QUOTES.length];
  const cur = gv(gratMap[today()]);
  const text = log.grat ?? cur.t ?? "";
  const mood = log.mood ?? cur.mood ?? null;
  const past = Object.entries(gratMap).map(([d, x]) => [d, gv(x)]).filter(([d, x]) => d !== today() && (x.t || x.mood)).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14);
  const save = () => { setLog((l) => ({ ...l, grat: text, journal: l.journal || text.trim().length > 0 || !!mood })); onClose(); };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={save} style={{ position: "absolute", inset: 0, background: "rgba(30,34,26,.45)", backdropFilter: "blur(2px)" }} />
      <div style={{ position: "relative", background: "#FFFDF8", borderRadius: "30px 30px 0 0", maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ position: "relative", height: 130, flexShrink: 0 }}>
          <img src={IMGS.journal} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 55%" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(25,30,22,.12) 0%, rgba(25,30,22,.55) 100%)" }} />
          <button onClick={save} aria-label="Close" style={{ position: "absolute", top: 12, right: 12, width: 34, height: 34, borderRadius: 99, border: "none", background: "rgba(255,253,248,.85)", display: "grid", placeItems: "center", cursor: "pointer" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A5240" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
          <div style={{ position: "absolute", left: 18, bottom: 12 }}>
            <div className="rh" style={{ fontSize: 24, color: "#FFF", textShadow: "0 1px 10px rgba(15,20,14,.5)" }}>Journal</div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,.9)", textShadow: "0 1px 6px rgba(15,20,14,.5)" }}>Private to this device {"·"} +100 pts for showing up</div>
          </div>
        </div>
        <div style={{ padding: "16px 18px 22px", overflowY: "auto" }}>
          <div style={{ background: "#F5EFE3", borderRadius: 18, padding: "13px 15px", display: "flex", gap: 11, alignItems: "flex-start", marginBottom: 13 }}>
            <div className="rh" style={{ fontSize: 28, lineHeight: .6, color: "#B9AE96", marginTop: 7 }}>{"“"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, fontStyle: "italic", color: "#4A5240", lineHeight: 1.45 }}>{q.t}</div>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: "#9A9283", marginTop: 5 }}>{"—"} {q.by}</div>
            </div>
            <button className="rpill" onClick={() => setQSeed((s) => s + 1)} style={{ padding: "7px 11px" }}>{"↻"}</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: "#8A8272", marginRight: "auto" }}>How was today?</span>
            {MOODS.map((M) => (
              <button key={M.id} onClick={() => setLog((l) => ({ ...l, mood: l.mood === M.id ? null : M.id }))} aria-pressed={mood === M.id} style={{ border: "none", background: "none", cursor: "pointer", padding: 2, borderRadius: 99, outline: mood === M.id ? `2.5px solid ${M.c}` : "none", outlineOffset: 2 }}>
                <MoodFace m={M.id} size={27} active={mood === M.id || mood === null} />
              </button>
            ))}
          </div>
          <textarea className="rin" rows={5} maxLength={800} value={text} onChange={(e) => setLog((l) => ({ ...l, grat: e.target.value }))} placeholder={"What are you grateful for today? What happened? How do you feel?"} style={{ resize: "none", lineHeight: 1.55, fontWeight: 500, fontSize: 15 }} />
          <button className="rbtn" onClick={save} style={{ marginTop: 12 }}>{text.trim() ? "Done · marked as journaled" : "Close"}</button>
          {past.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div className="rlabel" style={{ marginBottom: 8 }}>Earlier entries</div>
              {past.map(([d, x]) => (
                <div key={d} style={{ padding: "10px 0", borderBottom: "1.5px dashed #EFE9D6" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                    {x.mood && <MoodFace m={x.mood} size={17} />}
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#9A9283" }}>{new Date(d + "T12:00:00").toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                  </div>
                  {x.t && <div style={{ fontSize: 13.5, fontWeight: 600, color: "#4A5240", lineHeight: 1.5 }}>{x.t}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
const BREATH_PATTERNS = [
  { id: "box", label: "4-4-4-4", name: "Box breathing", steps: [["Inhale", 4, 1], ["Hold", 4, 1], ["Exhale", 4, 0.72], ["Hold", 4, 0.72]] },
  { id: "478", label: "4-7-8", name: "4-7-8 relax", steps: [["Inhale", 4, 1], ["Hold", 7, 1], ["Exhale", 8, 0.72]] },
  { id: "calm", label: "Calm", name: "Coherent 5-5", steps: [["Inhale", 5, 1], ["Exhale", 5, 0.72]] },
  { id: "deep", label: "Deep", name: "Deep release", steps: [["Inhale", 6, 1], ["Hold", 2, 1], ["Exhale", 8, 0.72]] },
];
function BreathBox({ onDone, light }) {
  const [pat, setPat] = useState(0);
  const [run, setRun] = useState(false);
  const [t, setT] = useState(0);
  const P = BREATH_PATTERNS[pat];
  const cycleLen = P.steps.reduce((s, x) => s + x[1], 0);
  const CYCLES = 4, totalLen = cycleLen * CYCLES;
  useEffect(() => {
    if (!run) return;
    const id = setInterval(() => setT((x) => x + 0.1), 100);
    return () => clearInterval(id);
  }, [run]);
  const finished = t >= totalLen;
  useEffect(() => { if (finished && run) { setRun(false); onDone && onDone(); } }, [finished, run]); // eslint-disable-line
  let rem = t % cycleLen, idx = 0;
  while (rem >= P.steps[idx][1]) { rem -= P.steps[idx][1]; idx++; }
  const [label, dur, scale] = P.steps[idx];
  const secsLeft = Math.ceil(dur - rem);
  const cycle = Math.min(Math.floor(t / cycleLen) + 1, CYCLES);
  const R = 84, C = 2 * Math.PI * R;
  const tx = light ? "#FFFFFF" : "#2A5445", sub = light ? "rgba(255,255,255,.75)" : "#9A9283";
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: 208, height: 208, margin: "0 auto" }}>
        <div style={{ position: "absolute", inset: 14, borderRadius: 999, background: light ? "rgba(255,255,255,.14)" : "#E7EFE7", backdropFilter: light ? "blur(5px)" : "none", border: light ? "1.5px solid rgba(255,255,255,.45)" : "none", transform: `scale(${run ? scale : 0.9})`, transition: `transform ${dur - 0.1}s cubic-bezier(.4,0,.4,1)` }} />
        <svg width="208" height="208" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
          <circle cx="104" cy="104" r={R} fill="none" stroke={light ? "rgba(255,255,255,.3)" : "#EDE5D6"} strokeWidth="5" />
          <circle cx="104" cy="104" r={R} fill="none" stroke={light ? "#FFFFFF" : "#2A5445"} strokeWidth="5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={run ? C * (1 - rem / dur) : C} style={{ transition: run ? "stroke-dashoffset .12s linear" : "none" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: tx, textShadow: light ? "0 1px 8px rgba(20,30,25,.4)" : "none" }}>{run ? label : finished ? "Well done" : "Ready?"}</div>
            {run && <div className="rh" style={{ fontSize: 44, lineHeight: 1.05, color: tx, textShadow: light ? "0 1px 10px rgba(20,30,25,.45)" : "none" }}>{secsLeft}</div>}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: sub, margin: "10px 0 12px", textShadow: light ? "0 1px 6px rgba(20,30,25,.4)" : "none" }}>{run ? `Cycle ${cycle} / ${CYCLES} · ${P.name}` : P.name}</div>
      <button className="rbtn" style={{ maxWidth: 200, margin: "0 auto", background: light ? "rgba(20,26,18,.75)" : undefined, backdropFilter: light ? "blur(4px)" : undefined }} onClick={() => { if (run) { setRun(false); } else { setT(0); setRun(true); } }}>{run ? "Stop" : finished ? "Again" : "Begin"}</button>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
        {BREATH_PATTERNS.map((p, i) => (
          <button key={p.id} onClick={() => { setPat(i); setT(0); setRun(false); }} style={{ width: 62, padding: "9px 0", borderRadius: 16, border: `1.5px solid ${i === pat ? (light ? "#FFFFFF" : "#2A5445") : (light ? "rgba(255,255,255,.4)" : "#E3DBC8")}`, background: i === pat ? (light ? "rgba(255,255,255,.28)" : "#E7EFE7") : (light ? "rgba(255,255,255,.12)" : "transparent"), backdropFilter: light ? "blur(4px)" : "none", color: light ? "#FFF" : "#4A5240", fontWeight: 800, fontSize: 11.5, cursor: "pointer" }}>{p.label}</button>
        ))}
      </div>
    </div>
  );
}
function FocusTimer({ minutes, onBank }) {
  const [startTs, setStartTs] = useState(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!startTs) return; const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, [startTs]);
  const secs = startTs ? Math.floor((now - startTs) / 1000) : 0;
  const mm = String(Math.floor(secs / 60)).padStart(2, "0"), ss = String(secs % 60).padStart(2, "0");
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div className="rh" style={{ fontSize: 40, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums", flex: 1 }}>{mm}:{ss}</div>
        {!startTs
          ? <button className="rbtn" style={{ width: "auto", padding: "12px 26px" }} onClick={() => { setStartTs(Date.now()); setNow(Date.now()); }}>Start</button>
          : <button className="rbtn2" style={{ width: "auto", padding: "12px 22px", border: "2px solid #2A5445", color: "#2A5445" }} onClick={() => { const m = Math.floor(secs / 60); setStartTs(null); if (m >= 1) onBank(m); }}>Stop {Math.floor(secs / 60) >= 1 ? `· bank ${Math.floor(secs / 60)}m` : ""}</button>}
      </div>
      <div style={{ display: "flex", gap: 7, marginTop: 11, alignItems: "center" }}>
        <button className="rpill" onClick={() => onBank(5)}>+5 min</button>
        <button className="rpill" onClick={() => onBank(25)}>+25 pomodoro</button>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9A9283", marginLeft: "auto" }}>{minutes || 0} min today · 2 pts/min</div>
      </div>
    </div>
  );
}

/* ---- Pitch a custom team challenge ---- */
function PitchCard({ onPitch }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [days, setDays] = useState(30);
  if (!open) return (
    <button className="rp rtap" onClick={() => setOpen(true)} style={{ padding: "15px 18px", width: "100%", border: `2px dashed #D8CDB6`, background: "#FAF6ED", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 13, boxShadow: "none" }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: "#EFE9DA", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="goals" size={19} color="#7A7260" /></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>Pitch a team challenge</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#9A9283" }}>Your idea, everyone checks in daily {"·"} +100 a day</div>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#9A9283" }}>+</div>
    </button>
  );
  return (
    <div className="rp" style={{ padding: "16px 18px" }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", color: "#9A9283", marginBottom: 8 }}>PITCH A TEAM CHALLENGE</div>
      <input className="rin" maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={'e.g. "20 push-ups every day"'} style={{ marginBottom: 10 }} />
      <div style={{ display: "flex", gap: 7, marginBottom: 12 }}>
        {[[7, "1 week"], [14, "2 weeks"], [30, "1 month"]].map(([d, l]) => (
          <button key={d} className={`rchip ${days === d ? "on" : ""}`} onClick={() => setDays(d)} style={{ flex: 1 }}>{l}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="rbtn2" onClick={() => setOpen(false)} style={{ flex: 1 }}>Cancel</button>
        <button className="rbtn" disabled={title.trim().length < 3} onClick={() => { onPitch(title.trim(), days); setOpen(false); setTitle(""); }} style={{ flex: 1 }}>Start it</button>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#9A9283", marginTop: 9 }}>One team pick runs at a time. Everyone sees it and checks in from this tab.</div>
    </div>
  );
}

/* ---- Gratitude jar: one token per journaled day this month ---- */
function GratitudeJar({ logs = {}, size = 150 }) {
  const entries = Object.entries(logs).filter(([d, l]) => d.slice(0, 7) === today().slice(0, 7) && l.journal);
  const n = entries.length;
  const toks = [];
  const shapes = ["leaf", "heart"];
  const cols = ["#7A8C4F", "#E8863A", "#5B9E5D", "#C9814E"];
  for (let i = 0; i < Math.min(n, 24); i++) {
    const row = Math.floor(i / 4), col = i % 4;
    toks.push({ x: 47 + col * 13 + (row % 2 ? 5 : 0), y: 118 - row * 11, k: shapes[i % 2], c: cols[i % 4], r: (i * 37) % 50 - 25 });
  }
  return (
    <svg viewBox="0 0 140 150" width={size} height={size * 1.07} aria-label={`${n} gratitude entries this month`}>
      <ellipse cx="70" cy="143" rx="52" ry="5" fill="#E4D9C4" />
      <path d="M52 18 h36 v8 c8 4 14 12 14 22 v78 c0 9 -8 14 -16 14 H54 c-8 0 -16 -5 -16 -14 V48 c0 -10 6 -18 14 -22 Z" fill="#FDFBF4" stroke="#3A3F33" strokeWidth="3" strokeLinejoin="round" opacity=".92" />
      <rect x="49" y="12" width="42" height="9" rx="4" fill="#F1EADD" stroke="#3A3F33" strokeWidth="3" />
      {toks.map((t, i) => (
        <g key={i} transform={`translate(${t.x},${t.y}) rotate(${t.r})`}>
          {t.k === "leaf"
            ? <path d="M0 -6 C6 -3 6 5 0 7 C-6 5 -6 -3 0 -6 Z M0 -4 V5" fill={t.c} stroke="#3A3F33" strokeWidth="1.4" strokeLinejoin="round" />
            : <path d="M0 6 C-7 1 -6 -6 -1 -5 C0 -4.4 0 -4.4 1 -5 C6 -6 7 1 0 6 Z" fill={t.c} stroke="#3A3F33" strokeWidth="1.4" strokeLinejoin="round" />}
        </g>
      ))}
      <path d="M56 30 q -8 8 -8 20 M84 26 q 6 3 8 10" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".8" />
    </svg>
  );
}

/* ---- Month stats: stacked bars with back/forward navigation ---- */
function MonthChart({ logs = {} }) {
  const [off, setOff] = useState(0);
  const [sel, setSel] = useState(null);
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + off);
  const y = base.getFullYear(), m = base.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  const key = (d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const daily = Array.from({ length: days }, (_, i) => {
    const l = logs[key(i + 1)];
    return { d: i + 1, k: key(i + 1), l, total: l ? dayScore(l) : 0 };
  });
  const max = Math.max(...daily.map((x) => x.total), 400);
  const total = daily.reduce((s, x) => s + x.total, 0);
  const active = daily.filter((x) => x.total > 0).length;
  const avg = active ? Math.round(total / active) : 0;
  const best = daily.reduce((b, x) => (x.total > b.total ? x : b), { total: 0, d: null });
  const kcalMo = daily.reduce((s, x) => s + (x.l ? kcalOf(x.l) : 0), 0);
  const selDay = sel ? daily.find((x) => x.k === sel) : null;
  const H = 104;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button className="rpill" onClick={() => { setOff(off - 1); setSel(null); }} style={{ padding: "6px 12px" }}>‹</button>
        <div className="rh" style={{ fontSize: 15 }}>{base.toLocaleString("en-US", { month: "long", year: "numeric" })}</div>
        <button className="rpill" onClick={() => { setOff(Math.min(off + 1, 0)); setSel(null); }} disabled={off >= 0} style={{ padding: "6px 12px" }}>›</button>
      </div>
      <div style={{ position: "relative" }}>
        {avg > 0 && <div style={{ position: "absolute", left: 0, right: 0, bottom: (avg / max) * H + 18, borderTop: "1.5px dashed #C9BFA6", zIndex: 1, pointerEvents: "none" }}><span style={{ position: "absolute", right: 0, top: -14, fontSize: 8.5, fontWeight: 800, color: "#A79E8B", background: "#FFFDF8", padding: "0 3px" }}>avg {avg}</span></div>}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: H, marginBottom: 4 }}>
          {daily.map((x) => (
            <button key={x.d} onClick={() => setSel(sel === x.k ? null : x.k)} style={{ flex: 1, height: "100%", borderRadius: 3, overflow: "hidden", border: "none", cursor: "pointer", padding: 0, background: sel === x.k ? "#F3E8CF" : x.k === today() ? "#EFE7D4" : "transparent" }}>
              {/* inner div does the stacking — Safari ignores flex layout on <button> itself */}
              <div style={{ display: "flex", flexDirection: "column-reverse", height: "100%", width: "100%" }}>
                {x.l && CATS.map((c) => {
                  const p = catPts(c.id, x.l);
                  return p > 0 ? <div key={c.id} style={{ height: `${(p / max) * 100}%`, background: c.color, minHeight: 1.5, opacity: sel && sel !== x.k ? .45 : 1 }} /> : null;
                })}
              </div>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>
          {daily.map((x) => (
            <span key={x.d} style={{ flex: 1, textAlign: "center", fontSize: 7.5, fontWeight: 800, color: sel === x.k ? "#6A6250" : "#C4BBA6" }}>{(x.d === 1 || x.d % 7 === 1 || x.d === days || sel === x.k) ? x.d : ""}</span>
          ))}
        </div>
      </div>
      {selDay && (
        <div style={{ background: "#F8F3E9", borderRadius: 15, padding: "12px 14px", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
            <span style={{ fontWeight: 800, fontSize: 13.5 }}>{new Date(selDay.k + "T12:00:00").toLocaleString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
            <span className="rh" style={{ fontSize: 17, color: FOREST }}>{selDay.total.toLocaleString()} pts</span>
          </div>
          {selDay.l ? (
            <>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {CATS.filter((c) => catPts(c.id, selDay.l) > 0).map((c) => (
                  <span key={c.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: c.pale, borderRadius: 99, padding: "4px 10px", fontSize: 11, fontWeight: 800, color: "#5A6248" }}><Icon name={CAT_ICON[c.id]} size={12} color={c.color} />{c.name} {catPts(c.id, selDay.l)}</span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 14, marginTop: 9, fontSize: 11.5, fontWeight: 800, color: "#8A8272" }}>
                {(Number(selDay.l.steps) || 0) > 0 && <span>{Number(selDay.l.steps).toLocaleString()} steps</span>}
                {(Number(selDay.l.workoutMin) || 0) > 0 && <span>{selDay.l.workoutMin} min workout</span>}
                <span>~{kcalOf(selDay.l).toLocaleString()} kcal</span>
              </div>
            </>
          ) : <div style={{ fontSize: 12.5, fontWeight: 700, color: "#9A9283" }}>Nothing logged this day.</div>}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[["Total", total.toLocaleString(), "pts"], ["Active days", `${active}`, `of ${days}`], ["Avg / active day", avg.toLocaleString(), "pts"], ["Best day", best.d ? best.total.toLocaleString() : "—", best.d ? `on the ${best.d}` : ""], ["Burned (est.)", `~${kcalMo.toLocaleString()}`, "kcal"], ["Per week pace", active ? Math.round(total / Math.max(active / 7, 1)).toLocaleString() : "0", "pts"]].map(([n, v, u]) => (
          <div key={n} style={{ background: "#F8F3E9", borderRadius: 15, padding: "11px 12px", minWidth: 0, overflow: "hidden" }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: "#9A9283", letterSpacing: ".04em", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{String(n).toUpperCase()}</div>
            <div className="rh" style={{ fontSize: 18, lineHeight: 1.1 }}>{v}</div>
            {u ? <div style={{ fontSize: 10, fontWeight: 700, color: "#9A9283", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u}</div> : null}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        {CATS.map((c) => <span key={c.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 800, color: "#8A8272" }}><span style={{ width: 8, height: 8, borderRadius: 3, background: c.color }} />{c.name}</span>)}
      </div>
    </div>
  );
}

/* ---- Month calendar heatmap of logged days ---- */
function MonthCalendar({ logs = {}, grat = {} }) {
  const [off, setOff] = useState(0);
  const [sel, setSel] = useState(null);
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + off);
  const y = base.getFullYear(), m = base.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const key = (d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const monthName = base.toLocaleString("en-US", { month: "long", year: "numeric" });
  const shade = (pts) => pts <= 0 ? "#F1EADD" : pts < 300 ? "#CBD9C6" : pts < 700 ? "#7FA88E" : FOREST;
  const selLog = sel ? logs[sel] : null;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <button className="rpill" onClick={() => { setOff(off - 1); setSel(null); }} style={{ padding: "6px 12px" }}>{"‹"}</button>
        <div className="rh" style={{ fontSize: 15 }}>{monthName}</div>
        <button className="rpill" onClick={() => { setOff(Math.min(off + 1, 0)); setSel(null); }} disabled={off >= 0} style={{ padding: "6px 12px" }}>{"›"}</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5, marginBottom: 4 }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: 10, fontWeight: 800, color: MUT }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 5 }}>
        {Array.from({ length: first }).map((_, i) => <div key={`b${i}`} />)}
        {Array.from({ length: days }).map((_, i) => {
          const d = i + 1, k = key(d), l = logs[k], pts = l ? dayScore(l) : 0;
          const isToday = k === today(), isSel = k === sel;
          return (
            <button key={k} onClick={() => setSel(isSel ? null : k)} style={{ aspectRatio: "1", borderRadius: 9, background: shade(pts), border: isSel ? `2.5px solid ${AMBER}` : isToday ? `2.5px solid ${INK}` : "2.5px solid transparent", cursor: "pointer", fontSize: 10.5, fontWeight: 800, color: pts >= 300 ? "#FFF" : "#8A8272", display: "grid", placeItems: "center" }}>{d}</button>
          );
        })}
      </div>
      {sel && (
        <div style={{ marginTop: 11, background: "#F8F3E9", borderRadius: 14, padding: "11px 13px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontWeight: 800, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}>{gv(grat[sel]).mood ? <MoodFace m={gv(grat[sel]).mood} size={17} /> : null}{new Date(sel + "T12:00:00").toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
            <span className="rh" style={{ fontSize: 15, color: FOREST }}>{selLog ? dayScore(selLog).toLocaleString() : 0} pts</span>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 7, flexWrap: "wrap" }}>
            {selLog ? CATS.filter((c) => catPts(c.id, selLog) > 0).map((c) => (
              <span key={c.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: c.pale, borderRadius: 99, padding: "4px 10px", fontSize: 11, fontWeight: 800, color: "#5A6248" }}><Icon name={CAT_ICON[c.id]} size={13} color={c.color} />{catPts(c.id, selLog)}</span>
            )) : <span style={{ fontSize: 12, fontWeight: 700, color: MUT }}>Nothing logged this day.</span>}
            {gv(grat[sel]).t && <div style={{ width: "100%", fontSize: 12.5, fontWeight: 600, color: "#6A6250", fontStyle: "italic" }}>{"“"}{gv(grat[sel]).t}{"”"}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Team crest: custom emblem if set, else seeded shield ---- */
/* ---- Team crests (v34.3): 50 finished, individually composed crests.
   The modular parts composer is retired. Legacy teams with an old {frame,
   border, field, emblem, accent} recipe keep rendering it untouched via
   crestPartsRecipe — nobody sees a broken crest mid-migration — until the
   team picks one of the fifty, which is a one-way, one-tap upgrade. ---- */
const CREST_IDS = ["crest-01", "crest-02", "crest-03", "crest-04", "crest-05", "crest-06", "crest-07", "crest-08", "crest-09", "crest-10", "crest-11", "crest-12", "crest-13", "crest-14", "crest-15", "crest-16", "crest-17", "crest-18", "crest-19", "crest-20", "crest-21", "crest-22", "crest-23", "crest-24", "crest-25", "crest-26", "crest-27", "crest-28", "crest-29", "crest-30", "crest-31", "crest-32", "crest-33", "crest-34", "crest-35", "crest-36", "crest-37", "crest-38", "crest-39", "crest-40", "crest-41", "crest-42", "crest-43", "crest-44", "crest-45", "crest-46", "crest-47", "crest-48", "crest-49", "crest-50"];
const crestHash = (s = "") => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const crestIdOf = (team) => {
  if (team?.crestId) return team.crestId; /* new: one of the fifty */
  if (team?.crest) return null; /* legacy modular recipe — handled separately, never silently swapped */
  return CREST_IDS[crestHash(team?.code || team?.name || "x") % CREST_IDS.length];
};
const crestSrc = (id) => `./crest2/${id}.webp`;
/* ---- Legacy modular-parts renderer (unchanged) — only for teams that
   never migrated and have an old-style saved recipe. ---- */
const CREST_PART_COUNTS = { frame: 4, border: 6, field: 8, emblem: 24, accent: 6 };
const crestPart = (slot, n) => `./crest/parts/crest-part-${slot}-${String(n).padStart(2, "0")}.webp`;
function TeamCrest({ team, size = 52, active }) {
  if (!team) return null;
  const id = crestIdOf(team);
  if (!id && team.crest) {
    /* legacy composited recipe, preserved exactly as it always rendered */
    return (
      <div style={{ position: "relative", width: size, height: size, opacity: active === false ? .8 : 1 }} aria-hidden="true">
        {["field", "frame", "border", "emblem", "accent"].map((slot) => (
          <img key={slot} src={crestPart(slot, team.crest[slot] || 1)} alt="" width={size} height={size}
            style={{ position: "absolute", inset: 0, width: size, height: size, imageRendering: "pixelated" }} draggable={false} />
        ))}
      </div>
    );
  }
  return (
    <img src={crestSrc(id)} alt="" width={size} height={size}
      style={{ width: size, height: size, imageRendering: "pixelated", opacity: active === false ? .8 : 1, display: "block" }} draggable={false} />
  );
}

/* ---- Personal crest: same 50-crest bank, circular presentation so it
   never reads as a team mark. Falls back to nothing (callers keep their
   initials roundel) when the player hasn't picked. ---- */
function PlayerCrest({ p, size = 40 }) {
  if (!p?.crestId) return null;
  return (
    <span style={{ width: size, height: size, borderRadius: 999, overflow: "hidden", display: "inline-grid", placeItems: "center", background: "#FAF6ED", border: "2px solid #EDE5D6", flexShrink: 0 }}>
      <img src={crestSrc(p.crestId)} alt="" width={Math.round(size * .82)} height={Math.round(size * .82)} style={{ width: Math.round(size * .82), height: Math.round(size * .82), imageRendering: "pixelated" }} draggable={false} />
    </span>
  );
}

/* ---- Crest picker: browse all 50, tap to adopt (founder / solo team only) ---- */
function CrestPickerSheet({ team, current, title, onPick, onClose }) {
  const cur = current !== undefined ? current : crestIdOf(team);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 76, display: "flex", flexDirection: "column", justifyContent: "flex-end" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(30,34,26,.5)", backdropFilter: "blur(2px)" }} />
      <div style={{ position: "relative", background: "#FFFDF8", borderRadius: "30px 30px 0 0", maxHeight: "82vh", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 18px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="rh" style={{ fontSize: 21 }}>{title || "Choose a crest"}</div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9A9283" }}>{team ? "50 to pick from — tap one to set it for the whole team." : "50 to pick from — this becomes your personal mark everywhere."}</div>
          </div>
          <button className="rghost" onClick={onClose}>Close</button>
        </div>
        <div style={{ padding: "10px 16px 26px", overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 9 }}>
          {CREST_IDS.map((id) => {
            const on = id === cur;
            return (
              <button key={id} onClick={() => onPick(id)} style={{ background: on ? "#F1F7EC" : "#FAF6ED", border: on ? `2.5px solid ${FOREST}` : "2px solid #EDE5D6", borderRadius: 14, padding: 6, cursor: "pointer", display: "grid", placeItems: "center" }}>
                <img src={crestSrc(id)} alt="" width={52} height={52} style={{ width: 52, height: 52, imageRendering: "pixelated" }} draggable={false} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---- Team challenge: rotates daily, target scales with team size ----
   Per-member quotas sit just under the personal goals, so a team only
   clears it if most people genuinely show up — no one-person freebies. */
const TEAM_CH = [
  { id: "steps", icon: "steps", per: 8000, label: (t) => `${t.toLocaleString()} steps together`, fmt: (v, t) => `${v.toLocaleString()} / ${t.toLocaleString()}`, get: (l) => Number(l.steps) || 0 },
  { id: "water", icon: "water", per: 2500, label: (t) => `${(t / 1000).toLocaleString()} litres together`, fmt: (v, t) => `${(v / 1000).toFixed(1)} / ${(t / 1000).toLocaleString()} l`, get: (l) => Number(l.water) || 0 },
  { id: "workout", icon: "workout", per: 30, label: (t) => `${t} workout minutes together`, fmt: (v, t) => `${v} / ${t} min`, get: (l) => Number(l.workoutMin) || (ptsWorkout(l) > 0 ? 30 : 0) },
  { id: "meditation", icon: "meditation", per: 10, label: (t) => `${t} mindful minutes together`, fmt: (v, t) => `${v} / ${t} min`, get: (l) => Number(l.meditation) || 0 },
  { id: "reading", icon: "reading", per: 8, label: (t) => `${t} pages read together`, fmt: (v, t) => `${v} / ${t} pages`, get: (l) => Number(l.reading) || 0 },
  { id: "everyone", icon: "team", per: 1, label: () => "Everyone logs a workout", fmt: (v, t) => `${v} / ${t} members`, get: (l) => (ptsWorkout(l) > 0 ? 1 : 0) },
];
const teamChallengeOf = (dateKey) => { const d = new Date(dateKey + "T12:00:00"); return TEAM_CH[d.getDay() % TEAM_CH.length]; };

/* ---- XP: lifetime, drives account level. Level curve is gentle. ---- */
const totalXP = (logs = {}) => Object.values(logs || {}).reduce((s, l) => s + dayScore(l) + challengeBonus(l), 0);
const LEVELS = Array.from({ length: 40 }, (_, i) => Math.round(500 * Math.pow(i + 1, 1.35)));
const levelOf = (xp) => { let lv = 1, need = LEVELS[0], prev = 0; for (let i = 0; i < LEVELS.length; i++) { if (xp < LEVELS[i]) { lv = i + 1; need = LEVELS[i]; prev = i ? LEVELS[i - 1] : 0; break; } lv = i + 2; need = LEVELS[i + 1] || LEVELS[i]; prev = LEVELS[i]; } return { lv, into: xp - prev, span: Math.max(need - prev, 1), need }; };


/* ================================================================
   CHARACTER EVOLUTION — v33 (pixel athlete-adventurers)
   Data-driven: classes, tiers, and art are configuration. Class,
   appearance, and evolution tier are stored independently. Only
   Pathfinder has pilot art; other classes are wired but "soon".
   ================================================================ */
const CHAR_TIERS = [
  { id: "tier-1", name: "Wanderer", min: 1 },
  { id: "tier-2", name: "Trailblazer", min: 8 },
  { id: "tier-3", name: "Adventurer", min: 16 },
  { id: "tier-4", name: "Wayfinder", min: 28 },
  { id: "tier-5", name: "Legend", min: 40 },
];
const charTierOf = (lv) => { let t = CHAR_TIERS[0]; for (const x of CHAR_TIERS) if (lv >= x.min) t = x; return t; };
const charNextTier = (lv) => CHAR_TIERS.find((x) => x.min > lv) || null;
const CHAR_CLASSES = [
  { id: "pathfinder", name: "Pathfinder", tag: "Steps, trails, the long way round", art: true },
  { id: "vanguard", name: "Vanguard", tag: "Strength and training", art: true },
  { id: "sage", name: "Sage", tag: "Reading and deep focus", art: true },
  { id: "monk", name: "Monk", tag: "Breath and stillness", art: true },
  { id: "guardian", name: "Guardian", tag: "Sleep and recovery", art: true },
  { id: "tidecaller", name: "Tidecaller", tag: "Hydration and endurance", art: true },
];
/* Generated from the accepted 635-file library — paths are scanned, not assumed. */
const CHAR_FILES = {"pathfinder":{"wanderer":{"base":"char/pathfinder/wanderer/characters/01-pathfinder-wanderer-base.webp","idle":["char/pathfinder/wanderer/poses/02-pathfinder-wanderer-idle-f1.webp","char/pathfinder/wanderer/poses/02-pathfinder-wanderer-idle-f2.webp","char/pathfinder/wanderer/poses/02-pathfinder-wanderer-idle-f3.webp","char/pathfinder/wanderer/poses/02-pathfinder-wanderer-idle-f4.webp","char/pathfinder/wanderer/poses/02-pathfinder-wanderer-idle-f5.webp","char/pathfinder/wanderer/poses/02-pathfinder-wanderer-idle-f6.webp","char/pathfinder/wanderer/poses/02-pathfinder-wanderer-idle-f7.webp","char/pathfinder/wanderer/poses/02-pathfinder-wanderer-idle-f8.webp"],"levelup":"char/pathfinder/wanderer/poses/03-pathfinder-wanderer-levelup.webp"},"trailblazer":{"base":"char/pathfinder/trailblazer/characters/01-pathfinder-trailblazer-base.webp","idle":["char/pathfinder/trailblazer/poses/02-pathfinder-trailblazer-idle-f1.webp","char/pathfinder/trailblazer/poses/02-pathfinder-trailblazer-idle-f2.webp","char/pathfinder/trailblazer/poses/02-pathfinder-trailblazer-idle-f3.webp","char/pathfinder/trailblazer/poses/02-pathfinder-trailblazer-idle-f4.webp","char/pathfinder/trailblazer/poses/02-pathfinder-trailblazer-idle-f5.webp","char/pathfinder/trailblazer/poses/02-pathfinder-trailblazer-idle-f6.webp","char/pathfinder/trailblazer/poses/02-pathfinder-trailblazer-idle-f7.webp","char/pathfinder/trailblazer/poses/02-pathfinder-trailblazer-idle-f8.webp"],"levelup":"char/pathfinder/trailblazer/poses/03-pathfinder-trailblazer-levelup.webp"},"adventurer":{"base":"char/pathfinder/adventurer/characters/01-pathfinder-adventurer-base.webp","idle":["char/pathfinder/adventurer/poses/02-pathfinder-adventurer-idle-f1.webp","char/pathfinder/adventurer/poses/02-pathfinder-adventurer-idle-f2.webp","char/pathfinder/adventurer/poses/02-pathfinder-adventurer-idle-f3.webp","char/pathfinder/adventurer/poses/02-pathfinder-adventurer-idle-f4.webp","char/pathfinder/adventurer/poses/02-pathfinder-adventurer-idle-f5.webp","char/pathfinder/adventurer/poses/02-pathfinder-adventurer-idle-f6.webp","char/pathfinder/adventurer/poses/02-pathfinder-adventurer-idle-f7.webp","char/pathfinder/adventurer/poses/02-pathfinder-adventurer-idle-f8.webp"],"levelup":"char/pathfinder/adventurer/poses/03-pathfinder-adventurer-levelup.webp","celeb":{"milestone-complete":"char/pathfinder/adventurer/celebrations/03-pathfinder-adventurer-celebration-milestone-complete.webp","card-earned":"char/pathfinder/adventurer/celebrations/03-pathfinder-adventurer-celebration-card-earned.webp","team-victory":"char/pathfinder/adventurer/celebrations/03-pathfinder-adventurer-celebration-team-victory.webp","badge-unlock":"char/pathfinder/adventurer/celebrations/03-pathfinder-adventurer-celebration-badge-unlock.webp"}},"wayfinder":{"base":"char/pathfinder/wayfinder/characters/01-pathfinder-wayfinder-base.webp","idle":["char/pathfinder/wayfinder/poses/02-pathfinder-wayfinder-idle-f1.webp","char/pathfinder/wayfinder/poses/02-pathfinder-wayfinder-idle-f2.webp","char/pathfinder/wayfinder/poses/02-pathfinder-wayfinder-idle-f3.webp","char/pathfinder/wayfinder/poses/02-pathfinder-wayfinder-idle-f4.webp","char/pathfinder/wayfinder/poses/02-pathfinder-wayfinder-idle-f5.webp","char/pathfinder/wayfinder/poses/02-pathfinder-wayfinder-idle-f6.webp","char/pathfinder/wayfinder/poses/02-pathfinder-wayfinder-idle-f7.webp","char/pathfinder/wayfinder/poses/02-pathfinder-wayfinder-idle-f8.webp"],"levelup":"char/pathfinder/wayfinder/poses/03-pathfinder-wayfinder-levelup.webp"},"legend":{"base":"char/pathfinder/legend/characters/01-pathfinder-legend-base.webp","idle":["char/pathfinder/legend/poses/02-pathfinder-legend-idle-f1.webp","char/pathfinder/legend/poses/02-pathfinder-legend-idle-f2.webp","char/pathfinder/legend/poses/02-pathfinder-legend-idle-f3.webp","char/pathfinder/legend/poses/02-pathfinder-legend-idle-f4.webp","char/pathfinder/legend/poses/02-pathfinder-legend-idle-f5.webp","char/pathfinder/legend/poses/02-pathfinder-legend-idle-f6.webp","char/pathfinder/legend/poses/02-pathfinder-legend-idle-f7.webp","char/pathfinder/legend/poses/02-pathfinder-legend-idle-f8.webp"],"levelup":"char/pathfinder/legend/poses/03-pathfinder-legend-levelup.webp"}},"vanguard":{"wanderer":{"base":"char/vanguard/wanderer/characters/01-vanguard-wanderer-base.webp","idle":["char/vanguard/wanderer/poses/02-vanguard-wanderer-idle-f1.webp","char/vanguard/wanderer/poses/02-vanguard-wanderer-idle-f2.webp","char/vanguard/wanderer/poses/02-vanguard-wanderer-idle-f3.webp","char/vanguard/wanderer/poses/02-vanguard-wanderer-idle-f4.webp","char/vanguard/wanderer/poses/02-vanguard-wanderer-idle-f5.webp","char/vanguard/wanderer/poses/02-vanguard-wanderer-idle-f6.webp","char/vanguard/wanderer/poses/02-vanguard-wanderer-idle-f7.webp","char/vanguard/wanderer/poses/02-vanguard-wanderer-idle-f8.webp"],"levelup":"char/vanguard/wanderer/poses/03-vanguard-wanderer-levelup.webp"},"trailblazer":{"base":"char/vanguard/trailblazer/characters/01-vanguard-trailblazer-base.webp","idle":["char/vanguard/trailblazer/poses/02-vanguard-trailblazer-idle-f1.webp","char/vanguard/trailblazer/poses/02-vanguard-trailblazer-idle-f2.webp","char/vanguard/trailblazer/poses/02-vanguard-trailblazer-idle-f3.webp","char/vanguard/trailblazer/poses/02-vanguard-trailblazer-idle-f4.webp","char/vanguard/trailblazer/poses/02-vanguard-trailblazer-idle-f5.webp","char/vanguard/trailblazer/poses/02-vanguard-trailblazer-idle-f6.webp","char/vanguard/trailblazer/poses/02-vanguard-trailblazer-idle-f7.webp","char/vanguard/trailblazer/poses/02-vanguard-trailblazer-idle-f8.webp"],"levelup":"char/vanguard/trailblazer/poses/03-vanguard-trailblazer-levelup.webp"},"adventurer":{"base":"char/vanguard/adventurer/characters/01-vanguard-adventurer-base.webp","idle":["char/vanguard/adventurer/poses/02-vanguard-adventurer-idle-f1.webp","char/vanguard/adventurer/poses/02-vanguard-adventurer-idle-f2.webp","char/vanguard/adventurer/poses/02-vanguard-adventurer-idle-f3.webp","char/vanguard/adventurer/poses/02-vanguard-adventurer-idle-f4.webp","char/vanguard/adventurer/poses/02-vanguard-adventurer-idle-f5.webp","char/vanguard/adventurer/poses/02-vanguard-adventurer-idle-f6.webp","char/vanguard/adventurer/poses/02-vanguard-adventurer-idle-f7.webp","char/vanguard/adventurer/poses/02-vanguard-adventurer-idle-f8.webp"],"levelup":"char/vanguard/adventurer/poses/03-vanguard-adventurer-levelup.webp","celeb":{"milestone-complete":"char/vanguard/adventurer/celebrations/03-vanguard-adventurer-celebration-milestone-complete.webp","card-earned":"char/vanguard/adventurer/celebrations/03-vanguard-adventurer-celebration-card-earned.webp","team-victory":"char/vanguard/adventurer/celebrations/03-vanguard-adventurer-celebration-team-victory.webp","badge-unlock":"char/vanguard/adventurer/celebrations/03-vanguard-adventurer-celebration-badge-unlock.webp"}},"wayfinder":{"base":"char/vanguard/wayfinder/characters/01-vanguard-wayfinder-base.webp","idle":["char/vanguard/wayfinder/poses/02-vanguard-wayfinder-idle-f1.webp","char/vanguard/wayfinder/poses/02-vanguard-wayfinder-idle-f2.webp","char/vanguard/wayfinder/poses/02-vanguard-wayfinder-idle-f3.webp","char/vanguard/wayfinder/poses/02-vanguard-wayfinder-idle-f4.webp","char/vanguard/wayfinder/poses/02-vanguard-wayfinder-idle-f5.webp","char/vanguard/wayfinder/poses/02-vanguard-wayfinder-idle-f6.webp","char/vanguard/wayfinder/poses/02-vanguard-wayfinder-idle-f7.webp","char/vanguard/wayfinder/poses/02-vanguard-wayfinder-idle-f8.webp"],"levelup":"char/vanguard/wayfinder/poses/03-vanguard-wayfinder-levelup.webp"},"legend":{"base":"char/vanguard/legend/characters/01-vanguard-legend-base.webp","idle":["char/vanguard/legend/poses/02-vanguard-legend-idle-f1.webp","char/vanguard/legend/poses/02-vanguard-legend-idle-f2.webp","char/vanguard/legend/poses/02-vanguard-legend-idle-f3.webp","char/vanguard/legend/poses/02-vanguard-legend-idle-f4.webp","char/vanguard/legend/poses/02-vanguard-legend-idle-f5.webp","char/vanguard/legend/poses/02-vanguard-legend-idle-f6.webp","char/vanguard/legend/poses/02-vanguard-legend-idle-f7.webp","char/vanguard/legend/poses/02-vanguard-legend-idle-f8.webp"],"levelup":"char/vanguard/legend/poses/03-vanguard-legend-levelup.webp"}},"sage":{"wanderer":{"base":"char/sage/wanderer/characters/01-sage-wanderer-base.webp","idle":["char/sage/wanderer/poses/02-sage-wanderer-idle-f1.webp","char/sage/wanderer/poses/02-sage-wanderer-idle-f2.webp","char/sage/wanderer/poses/02-sage-wanderer-idle-f3.webp","char/sage/wanderer/poses/02-sage-wanderer-idle-f4.webp","char/sage/wanderer/poses/02-sage-wanderer-idle-f5.webp","char/sage/wanderer/poses/02-sage-wanderer-idle-f6.webp","char/sage/wanderer/poses/02-sage-wanderer-idle-f7.webp","char/sage/wanderer/poses/02-sage-wanderer-idle-f8.webp"],"levelup":"char/sage/wanderer/poses/03-sage-wanderer-levelup.webp"},"trailblazer":{"base":"char/sage/trailblazer/characters/01-sage-trailblazer-base.webp","idle":["char/sage/trailblazer/poses/02-sage-trailblazer-idle-f1.webp","char/sage/trailblazer/poses/02-sage-trailblazer-idle-f2.webp","char/sage/trailblazer/poses/02-sage-trailblazer-idle-f3.webp","char/sage/trailblazer/poses/02-sage-trailblazer-idle-f4.webp","char/sage/trailblazer/poses/02-sage-trailblazer-idle-f5.webp","char/sage/trailblazer/poses/02-sage-trailblazer-idle-f6.webp","char/sage/trailblazer/poses/02-sage-trailblazer-idle-f7.webp","char/sage/trailblazer/poses/02-sage-trailblazer-idle-f8.webp"],"levelup":"char/sage/trailblazer/poses/03-sage-trailblazer-levelup.webp"},"adventurer":{"base":"char/sage/adventurer/characters/01-sage-adventurer-base.webp","idle":["char/sage/adventurer/poses/02-sage-adventurer-idle-f1.webp","char/sage/adventurer/poses/02-sage-adventurer-idle-f2.webp","char/sage/adventurer/poses/02-sage-adventurer-idle-f3.webp","char/sage/adventurer/poses/02-sage-adventurer-idle-f4.webp","char/sage/adventurer/poses/02-sage-adventurer-idle-f5.webp","char/sage/adventurer/poses/02-sage-adventurer-idle-f6.webp","char/sage/adventurer/poses/02-sage-adventurer-idle-f7.webp","char/sage/adventurer/poses/02-sage-adventurer-idle-f8.webp"],"levelup":"char/sage/adventurer/poses/03-sage-adventurer-levelup.webp","celeb":{"milestone-complete":"char/sage/adventurer/celebrations/03-sage-adventurer-celebration-milestone-complete.webp","card-earned":"char/sage/adventurer/celebrations/03-sage-adventurer-celebration-card-earned.webp","team-victory":"char/sage/adventurer/celebrations/03-sage-adventurer-celebration-team-victory.webp","badge-unlock":"char/sage/adventurer/celebrations/03-sage-adventurer-celebration-badge-unlock.webp"}},"wayfinder":{"base":"char/sage/wayfinder/characters/01-sage-wayfinder-base.webp","idle":["char/sage/wayfinder/poses/02-sage-wayfinder-idle-f1.webp","char/sage/wayfinder/poses/02-sage-wayfinder-idle-f2.webp","char/sage/wayfinder/poses/02-sage-wayfinder-idle-f3.webp","char/sage/wayfinder/poses/02-sage-wayfinder-idle-f4.webp","char/sage/wayfinder/poses/02-sage-wayfinder-idle-f5.webp","char/sage/wayfinder/poses/02-sage-wayfinder-idle-f6.webp","char/sage/wayfinder/poses/02-sage-wayfinder-idle-f7.webp","char/sage/wayfinder/poses/02-sage-wayfinder-idle-f8.webp"],"levelup":"char/sage/wayfinder/poses/03-sage-wayfinder-levelup.webp"},"legend":{"base":"char/sage/legend/characters/01-sage-legend-base.webp","idle":["char/sage/legend/poses/02-sage-legend-idle-f1.webp","char/sage/legend/poses/02-sage-legend-idle-f2.webp","char/sage/legend/poses/02-sage-legend-idle-f3.webp","char/sage/legend/poses/02-sage-legend-idle-f4.webp","char/sage/legend/poses/02-sage-legend-idle-f5.webp","char/sage/legend/poses/02-sage-legend-idle-f6.webp","char/sage/legend/poses/02-sage-legend-idle-f7.webp","char/sage/legend/poses/02-sage-legend-idle-f8.webp"],"levelup":"char/sage/legend/poses/03-sage-legend-levelup.webp"}},"monk":{"wanderer":{"base":"char/monk/wanderer/characters/01-monk-wanderer-base.webp","idle":["char/monk/wanderer/poses/02-monk-wanderer-idle-f1.webp","char/monk/wanderer/poses/02-monk-wanderer-idle-f2.webp","char/monk/wanderer/poses/02-monk-wanderer-idle-f3.webp","char/monk/wanderer/poses/02-monk-wanderer-idle-f4.webp","char/monk/wanderer/poses/02-monk-wanderer-idle-f5.webp","char/monk/wanderer/poses/02-monk-wanderer-idle-f6.webp","char/monk/wanderer/poses/02-monk-wanderer-idle-f7.webp","char/monk/wanderer/poses/02-monk-wanderer-idle-f8.webp"],"levelup":"char/monk/wanderer/poses/03-monk-wanderer-levelup.webp"},"trailblazer":{"base":"char/monk/trailblazer/characters/01-monk-trailblazer-base.webp","idle":["char/monk/trailblazer/poses/02-monk-trailblazer-idle-f1.webp","char/monk/trailblazer/poses/02-monk-trailblazer-idle-f2.webp","char/monk/trailblazer/poses/02-monk-trailblazer-idle-f3.webp","char/monk/trailblazer/poses/02-monk-trailblazer-idle-f4.webp","char/monk/trailblazer/poses/02-monk-trailblazer-idle-f5.webp","char/monk/trailblazer/poses/02-monk-trailblazer-idle-f6.webp","char/monk/trailblazer/poses/02-monk-trailblazer-idle-f7.webp","char/monk/trailblazer/poses/02-monk-trailblazer-idle-f8.webp"],"levelup":"char/monk/trailblazer/poses/03-monk-trailblazer-levelup.webp"},"adventurer":{"base":"char/monk/adventurer/characters/01-monk-adventurer-base.webp","idle":["char/monk/adventurer/poses/02-monk-adventurer-idle-f1.webp","char/monk/adventurer/poses/02-monk-adventurer-idle-f2.webp","char/monk/adventurer/poses/02-monk-adventurer-idle-f3.webp","char/monk/adventurer/poses/02-monk-adventurer-idle-f4.webp","char/monk/adventurer/poses/02-monk-adventurer-idle-f5.webp","char/monk/adventurer/poses/02-monk-adventurer-idle-f6.webp","char/monk/adventurer/poses/02-monk-adventurer-idle-f7.webp","char/monk/adventurer/poses/02-monk-adventurer-idle-f8.webp"],"levelup":"char/monk/adventurer/poses/03-monk-adventurer-levelup.webp","celeb":{"milestone-complete":"char/monk/adventurer/celebrations/03-monk-adventurer-celebration-milestone-complete.webp","card-earned":"char/monk/adventurer/celebrations/03-monk-adventurer-celebration-card-earned.webp","team-victory":"char/monk/adventurer/celebrations/03-monk-adventurer-celebration-team-victory.webp","badge-unlock":"char/monk/adventurer/celebrations/03-monk-adventurer-celebration-badge-unlock.webp"}},"wayfinder":{"base":"char/monk/wayfinder/characters/01-monk-wayfinder-base.webp","idle":["char/monk/wayfinder/poses/02-monk-wayfinder-idle-f1.webp","char/monk/wayfinder/poses/02-monk-wayfinder-idle-f2.webp","char/monk/wayfinder/poses/02-monk-wayfinder-idle-f3.webp","char/monk/wayfinder/poses/02-monk-wayfinder-idle-f4.webp","char/monk/wayfinder/poses/02-monk-wayfinder-idle-f5.webp","char/monk/wayfinder/poses/02-monk-wayfinder-idle-f6.webp","char/monk/wayfinder/poses/02-monk-wayfinder-idle-f7.webp","char/monk/wayfinder/poses/02-monk-wayfinder-idle-f8.webp"],"levelup":"char/monk/wayfinder/poses/03-monk-wayfinder-levelup.webp"},"legend":{"base":"char/monk/legend/characters/01-monk-legend-base.webp","idle":["char/monk/legend/poses/02-monk-legend-idle-f1.webp","char/monk/legend/poses/02-monk-legend-idle-f2.webp","char/monk/legend/poses/02-monk-legend-idle-f3.webp","char/monk/legend/poses/02-monk-legend-idle-f4.webp","char/monk/legend/poses/02-monk-legend-idle-f5.webp","char/monk/legend/poses/02-monk-legend-idle-f6.webp","char/monk/legend/poses/02-monk-legend-idle-f7.webp","char/monk/legend/poses/02-monk-legend-idle-f8.webp"],"levelup":"char/monk/legend/poses/03-monk-legend-levelup.webp"}},"guardian":{"wanderer":{"base":"char/guardian/wanderer/characters/01-guardian-wanderer-base.webp","idle":["char/guardian/wanderer/poses/02-guardian-wanderer-idle-f1.webp","char/guardian/wanderer/poses/02-guardian-wanderer-idle-f2.webp","char/guardian/wanderer/poses/02-guardian-wanderer-idle-f3.webp","char/guardian/wanderer/poses/02-guardian-wanderer-idle-f4.webp","char/guardian/wanderer/poses/02-guardian-wanderer-idle-f5.webp","char/guardian/wanderer/poses/02-guardian-wanderer-idle-f6.webp","char/guardian/wanderer/poses/02-guardian-wanderer-idle-f7.webp","char/guardian/wanderer/poses/02-guardian-wanderer-idle-f8.webp"],"levelup":"char/guardian/wanderer/poses/03-guardian-wanderer-levelup.webp"},"trailblazer":{"base":"char/guardian/trailblazer/characters/01-guardian-trailblazer-base.webp","idle":["char/guardian/trailblazer/poses/02-guardian-trailblazer-idle-f1.webp","char/guardian/trailblazer/poses/02-guardian-trailblazer-idle-f2.webp","char/guardian/trailblazer/poses/02-guardian-trailblazer-idle-f3.webp","char/guardian/trailblazer/poses/02-guardian-trailblazer-idle-f4.webp","char/guardian/trailblazer/poses/02-guardian-trailblazer-idle-f5.webp","char/guardian/trailblazer/poses/02-guardian-trailblazer-idle-f6.webp","char/guardian/trailblazer/poses/02-guardian-trailblazer-idle-f7.webp","char/guardian/trailblazer/poses/02-guardian-trailblazer-idle-f8.webp"],"levelup":"char/guardian/trailblazer/poses/03-guardian-trailblazer-levelup.webp"},"adventurer":{"base":"char/guardian/adventurer/characters/01-guardian-adventurer-base.webp","idle":["char/guardian/adventurer/poses/02-guardian-adventurer-idle-f1.webp","char/guardian/adventurer/poses/02-guardian-adventurer-idle-f2.webp","char/guardian/adventurer/poses/02-guardian-adventurer-idle-f3.webp","char/guardian/adventurer/poses/02-guardian-adventurer-idle-f4.webp","char/guardian/adventurer/poses/02-guardian-adventurer-idle-f5.webp","char/guardian/adventurer/poses/02-guardian-adventurer-idle-f6.webp","char/guardian/adventurer/poses/02-guardian-adventurer-idle-f7.webp","char/guardian/adventurer/poses/02-guardian-adventurer-idle-f8.webp"],"levelup":"char/guardian/adventurer/poses/03-guardian-adventurer-levelup.webp","celeb":{"milestone-complete":"char/guardian/adventurer/celebrations/03-guardian-adventurer-celebration-milestone-complete.webp","card-earned":"char/guardian/adventurer/celebrations/03-guardian-adventurer-celebration-card-earned.webp","team-victory":"char/guardian/adventurer/celebrations/03-guardian-adventurer-celebration-team-victory.webp","badge-unlock":"char/guardian/adventurer/celebrations/03-guardian-adventurer-celebration-badge-unlock.webp"}},"wayfinder":{"base":"char/guardian/wayfinder/characters/01-guardian-wayfinder-base.webp","idle":["char/guardian/wayfinder/poses/02-guardian-wayfinder-idle-f1.webp","char/guardian/wayfinder/poses/02-guardian-wayfinder-idle-f2.webp","char/guardian/wayfinder/poses/02-guardian-wayfinder-idle-f3.webp","char/guardian/wayfinder/poses/02-guardian-wayfinder-idle-f4.webp","char/guardian/wayfinder/poses/02-guardian-wayfinder-idle-f5.webp","char/guardian/wayfinder/poses/02-guardian-wayfinder-idle-f6.webp","char/guardian/wayfinder/poses/02-guardian-wayfinder-idle-f7.webp","char/guardian/wayfinder/poses/02-guardian-wayfinder-idle-f8.webp"],"levelup":"char/guardian/wayfinder/poses/03-guardian-wayfinder-levelup.webp"},"legend":{"base":"char/guardian/legend/characters/01-guardian-legend-base.webp","idle":["char/guardian/legend/poses/02-guardian-legend-idle-f1.webp","char/guardian/legend/poses/02-guardian-legend-idle-f2.webp","char/guardian/legend/poses/02-guardian-legend-idle-f3.webp","char/guardian/legend/poses/02-guardian-legend-idle-f4.webp","char/guardian/legend/poses/02-guardian-legend-idle-f5.webp","char/guardian/legend/poses/02-guardian-legend-idle-f6.webp","char/guardian/legend/poses/02-guardian-legend-idle-f7.webp","char/guardian/legend/poses/02-guardian-legend-idle-f8.webp"],"levelup":"char/guardian/legend/poses/03-guardian-legend-levelup.webp"}},"tidecaller":{"wanderer":{"base":"char/tidecaller/wanderer/characters/01-tidecaller-wanderer-base.webp","idle":["char/tidecaller/wanderer/poses/02-tidecaller-wanderer-idle-f1.webp","char/tidecaller/wanderer/poses/02-tidecaller-wanderer-idle-f2.webp","char/tidecaller/wanderer/poses/02-tidecaller-wanderer-idle-f3.webp","char/tidecaller/wanderer/poses/02-tidecaller-wanderer-idle-f4.webp","char/tidecaller/wanderer/poses/02-tidecaller-wanderer-idle-f5.webp","char/tidecaller/wanderer/poses/02-tidecaller-wanderer-idle-f6.webp","char/tidecaller/wanderer/poses/02-tidecaller-wanderer-idle-f7.webp","char/tidecaller/wanderer/poses/02-tidecaller-wanderer-idle-f8.webp"],"levelup":"char/tidecaller/wanderer/poses/03-tidecaller-wanderer-levelup.webp"},"trailblazer":{"base":"char/tidecaller/trailblazer/characters/01-tidecaller-trailblazer-base.webp","idle":["char/tidecaller/trailblazer/poses/02-tidecaller-trailblazer-idle-f1.webp","char/tidecaller/trailblazer/poses/02-tidecaller-trailblazer-idle-f2.webp","char/tidecaller/trailblazer/poses/02-tidecaller-trailblazer-idle-f3.webp","char/tidecaller/trailblazer/poses/02-tidecaller-trailblazer-idle-f4.webp","char/tidecaller/trailblazer/poses/02-tidecaller-trailblazer-idle-f5.webp","char/tidecaller/trailblazer/poses/02-tidecaller-trailblazer-idle-f6.webp","char/tidecaller/trailblazer/poses/02-tidecaller-trailblazer-idle-f7.webp","char/tidecaller/trailblazer/poses/02-tidecaller-trailblazer-idle-f8.webp"],"levelup":"char/tidecaller/trailblazer/poses/03-tidecaller-trailblazer-levelup.webp"},"adventurer":{"base":"char/tidecaller/adventurer/characters/01-tidecaller-adventurer-base.webp","idle":["char/tidecaller/adventurer/poses/02-tidecaller-adventurer-idle-f1.webp","char/tidecaller/adventurer/poses/02-tidecaller-adventurer-idle-f2.webp","char/tidecaller/adventurer/poses/02-tidecaller-adventurer-idle-f3.webp","char/tidecaller/adventurer/poses/02-tidecaller-adventurer-idle-f4.webp","char/tidecaller/adventurer/poses/02-tidecaller-adventurer-idle-f5.webp","char/tidecaller/adventurer/poses/02-tidecaller-adventurer-idle-f6.webp","char/tidecaller/adventurer/poses/02-tidecaller-adventurer-idle-f7.webp","char/tidecaller/adventurer/poses/02-tidecaller-adventurer-idle-f8.webp"],"levelup":"char/tidecaller/adventurer/poses/03-tidecaller-adventurer-levelup.webp","celeb":{"milestone-complete":"char/tidecaller/adventurer/celebrations/03-tidecaller-adventurer-celebration-milestone-complete.webp","card-earned":"char/tidecaller/adventurer/celebrations/03-tidecaller-adventurer-celebration-card-earned.webp","team-victory":"char/tidecaller/adventurer/celebrations/03-tidecaller-adventurer-celebration-team-victory.webp","badge-unlock":"char/tidecaller/adventurer/celebrations/03-tidecaller-adventurer-celebration-badge-unlock.webp"}},"wayfinder":{"base":"char/tidecaller/wayfinder/characters/01-tidecaller-wayfinder-base.webp","idle":["char/tidecaller/wayfinder/poses/02-tidecaller-wayfinder-idle-f1.webp","char/tidecaller/wayfinder/poses/02-tidecaller-wayfinder-idle-f2.webp","char/tidecaller/wayfinder/poses/02-tidecaller-wayfinder-idle-f3.webp","char/tidecaller/wayfinder/poses/02-tidecaller-wayfinder-idle-f4.webp","char/tidecaller/wayfinder/poses/02-tidecaller-wayfinder-idle-f5.webp","char/tidecaller/wayfinder/poses/02-tidecaller-wayfinder-idle-f6.webp","char/tidecaller/wayfinder/poses/02-tidecaller-wayfinder-idle-f7.webp","char/tidecaller/wayfinder/poses/02-tidecaller-wayfinder-idle-f8.webp"],"levelup":"char/tidecaller/wayfinder/poses/03-tidecaller-wayfinder-levelup.webp"},"legend":{"base":"char/tidecaller/legend/characters/01-tidecaller-legend-base.webp","idle":["char/tidecaller/legend/poses/02-tidecaller-legend-idle-f1.webp","char/tidecaller/legend/poses/02-tidecaller-legend-idle-f2.webp","char/tidecaller/legend/poses/02-tidecaller-legend-idle-f3.webp","char/tidecaller/legend/poses/02-tidecaller-legend-idle-f4.webp","char/tidecaller/legend/poses/02-tidecaller-legend-idle-f5.webp","char/tidecaller/legend/poses/02-tidecaller-legend-idle-f6.webp","char/tidecaller/legend/poses/02-tidecaller-legend-idle-f7.webp","char/tidecaller/legend/poses/02-tidecaller-legend-idle-f8.webp"],"levelup":"char/tidecaller/legend/poses/03-tidecaller-legend-levelup.webp"}}};
const charArt = (classId, tierId) => {
  const tiers = CHAR_FILES[classId]; if (!tiers) return null;
  const names = { "tier-1": "wanderer", "tier-2": "trailblazer", "tier-3": "adventurer", "tier-4": "wayfinder", "tier-5": "legend" };
  const e = tiers[names[tierId]] || tiers["adventurer"];
  if (!e) return null;
  return { base: "./" + e.base, idle: e.idle.map((x) => "./" + x), levelup: e.levelup ? "./" + e.levelup : "./" + e.base, celeb: tiers["adventurer"]?.celeb || {}, fps: 6 };
};
const classCrest = (classId) => `./crest/class/crest-class-${classId}.webp`;

/* Idle player: integer-scaled pixel art, pauses offscreen / hidden /
   reduced-motion, static base as fallback for everything. */
function CharacterHero({ level, classId, size = 1 }) {
  const art = charArt(classId, charTierOf(level).id);
  const W = Math.round(250 * size), H = Math.round(350 * size);
  const [frame, setFrame] = useState(0);
  const [failed, setFailed] = useState(false);
  const okRef = useRef([]);
  const [ready, setReady] = useState(false);
  const boxRef = useRef(null);
  const visRef = useRef(true);
  const tier = charTierOf(level);
  const cls = CHAR_CLASSES.find((c) => c.id === classId) || CHAR_CLASSES[0];
  useEffect(() => {
    if (!art) return;
    let live = true;
    okRef.current = Array(8).fill(false);
    const baseIm = new Image(); baseIm.onerror = () => { if (live) setFailed(true); }; baseIm.src = art.base;
    art.idle.forEach((s, i) => { const im = new Image(); im.onload = () => { okRef.current[i] = true; if (live && okRef.current.filter(Boolean).length >= 2) setReady(true); }; im.src = s; });
    const t = setTimeout(() => { if (live && okRef.current.some(Boolean)) setReady(true); }, 1600);
    return () => { live = false; clearTimeout(t); };
  }, [classId, charTierOf(level).id]); // eslint-disable-line
  useEffect(() => {
    if (!art || failed || !ready) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let io = null;
    if ("IntersectionObserver" in window && boxRef.current) {
      io = new IntersectionObserver(([e]) => { visRef.current = e.isIntersecting; });
      io.observe(boxRef.current);
    }
    const t = setInterval(() => {
      if (document.hidden || !visRef.current) return;
      setFrame((f) => { let n = (f + 1) % 8, guard = 0; while (!okRef.current[n] && guard++ < 8) n = (n + 1) % 8; return n; });
    }, Math.round(1000 / (art.fps || 6)));
    return () => { clearInterval(t); if (io) io.disconnect(); };
  }, [ready, failed, classId]); // eslint-disable-line
  if (!art || failed) {
    return (
      <div style={{ width: W, height: H, display: "grid", placeItems: "center", background: size >= 1 ? "#F7F2E7" : "transparent", borderRadius: 18 }}>
        <Icon name="me" size={Math.round(W * .22)} color="#B3AA97" />
      </div>
    );
  }
  const src2 = ready && okRef.current[frame] ? art.idle[frame] : art.base;
  return (
    <div ref={boxRef} style={{ position: "relative", width: W, height: H }}>
      <img src={src2} alt={`${cls.name}, ${tier.name}`} width={W} height={H}
        style={{ width: W, height: H, imageRendering: "pixelated", display: "block" }} draggable={false}
        onError={() => setFailed(true)} />
    </div>
  );
}


/* ---- Choose your path: class picker (art for all six is live) ---- */
function ClassPickerSheet({ me, onPick, onClose }) {
  const cur = me.charClass || "pathfinder";
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 75, display: "flex", flexDirection: "column", justifyContent: "flex-end" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(30,34,26,.5)", backdropFilter: "blur(2px)" }} />
      <div style={{ position: "relative", background: "#FFFDF8", borderRadius: "30px 30px 0 0", maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 18px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="rh" style={{ fontSize: 21 }}>Choose your path</div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9A9283" }}>Identity only — every class scores the same. Switch anytime.</div>
          </div>
          <button className="rghost" onClick={onClose}>Close</button>
        </div>
        <div style={{ padding: "8px 16px 26px", overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {CHAR_CLASSES.map((c) => {
            const art = charArt(c.id, "tier-1");
            const on = c.id === cur;
            return (
              <button key={c.id} onClick={() => onPick(c.id)} style={{ textAlign: "center", background: on ? "#F1F7EC" : "#FAF6ED", border: on ? `2.5px solid ${FOREST}` : "2px solid #EDE5D6", borderRadius: 20, padding: "12px 8px 10px", cursor: "pointer" }}>
                {art ? <img src={art.base} alt="" width={100} height={140} style={{ width: 100, height: 140, imageRendering: "pixelated" }} draggable={false} /> : null}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 6 }}>
                  <img src={classCrest(c.id)} alt="" width={20} height={20} style={{ width: 20, height: 20, imageRendering: "pixelated" }} draggable={false} />
                  <span style={{ fontWeight: 800, fontSize: 13.5 }}>{c.name}</span>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#9A9283", marginTop: 2 }}>{c.tag}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---- Celebration pop: brief, bottom-anchored, reduced-motion aware ---- */
function CelebrationPop({ celeb, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2600); return () => clearTimeout(t); }, []); // eslint-disable-line
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 108, zIndex: 72, display: "grid", placeItems: "center", pointerEvents: "none" }}>
      <div className={reduced ? "" : "popin"} style={{ background: "#FFFDF8", borderRadius: 22, padding: "12px 18px 10px", boxShadow: "0 18px 44px rgba(40,34,20,.3)", textAlign: "center", border: "1.5px solid #EDE5D6" }}>
        {celeb.img && <img src={celeb.img} alt="" width={110} height={154} style={{ width: 110, height: 154, imageRendering: "pixelated" }} draggable={false} />}
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", color: "#B4671F" }}>{celeb.kicker}</div>
        <div className="rh" style={{ fontSize: 16 }}>{celeb.text}</div>
      </div>
    </div>
  );
}

/* Evolution moment: brief, skippable, reduced-motion aware */
function EvolutionSheet({ level, classId, onClose }) {
  const art = charArt(classId, charTierOf(level).id);
  const tier = charTierOf(level);
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 80, display: "grid", placeItems: "center", background: "rgba(26,30,22,.78)", backdropFilter: "blur(3px)" }} onClick={onClose}>
      <div style={{ textAlign: "center", padding: 20 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ position: "relative", width: 250, height: 350, margin: "0 auto" }}>
          {!reduced && <div className="cwburst" style={{ position: "absolute", inset: -40, background: "radial-gradient(circle, rgba(233,178,74,.55) 0%, rgba(233,178,74,0) 65%)", borderRadius: 999 }} />}
          {art
            ? <img src={art.levelup} alt="" width={250} height={350} style={{ position: "relative", width: 250, height: 350, imageRendering: "pixelated" }} draggable={false} />
            : <div style={{ position: "relative", width: 250, height: 350, display: "grid", placeItems: "center" }}><Icon name="trophy" size={80} color="#E9B24A" /></div>}
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".14em", color: "#D8CFB8", marginTop: 14 }}>EVOLUTION</div>
        <div className="rh" style={{ fontSize: 30, color: "#FFFDF8", marginTop: 2 }}>{tier.name}</div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#C9C0AC", marginTop: 6 }}>Level {level} — your habits made this happen.</div>
        <button className="rbtn" onClick={onClose} style={{ marginTop: 18, padding: "13px 38px", fontSize: 14 }}>Keep going</button>
      </div>
    </div>
  );
}

/* ---- Badges: milestone achievements from full log history ---- */
const streakOf = (logs = {}) => { let s = 0; const d = new Date(); if (dayScore(logs[dk(d)]) === 0) d.setDate(d.getDate() - 1); while (dayScore(logs[dk(d)]) > 0) { s++; d.setDate(d.getDate() - 1); } return s; };
const BADGES = [
  { id: "b_streak7", name: "7-Day Streak", icon: "fire", color: "#5E9E5B", tint: "#EAF3EA", get: (L, logs) => streakOf(logs) >= 7 },
  { id: "b_streak30", name: "30-Day Streak", icon: "bolt", color: "#E0A438", tint: "#FBF3E2", get: (L, logs) => streakOf(logs) >= 30 },
  { id: "b_early", name: "Early Bird", icon: "sleep", color: "#E0A438", tint: "#FBF3E2", get: (L, logs) => Object.values(logs || {}).filter((l) => (Number(l.sleep) || 0) >= 7).length >= 5 },
  { id: "b_hydro", name: "Hydration Hero", icon: "water", color: "#4E9BD8", tint: "#EAF3FB", get: (L, logs) => Object.values(logs || {}).filter((l) => (Number(l.water) || 0) >= 3000).length >= 7 },
  { id: "b_sleep", name: "Sleep Champ", icon: "sleep", color: "#B78A2E", tint: "#FBF3E2", get: (L, logs) => Object.values(logs || {}).filter((l) => (Number(l.sleep) || 0) >= 8).length >= 7 },
  { id: "b_iron", name: "Iron Will", icon: "workout", color: "#8B6FC9", tint: "#F1EDF9", get: (L, logs) => Object.values(logs || {}).filter((l) => ptsWorkout(l) > 0).length >= 10 },
  { id: "b_steps", name: "Road Warrior", icon: "steps", color: "#5E9E5B", tint: "#EAF3EA", get: (L, logs) => Object.values(logs || {}).reduce((s, l) => s + (Number(l.steps) || 0), 0) >= 200000 },
  { id: "b_scholar", name: "Bookworm", icon: "reading", color: "#C9678B", tint: "#F9ECF1", get: (L, logs) => Object.values(logs || {}).filter((l) => (Number(l.reading) || 0) >= 10).length >= 7 },
  { id: "b_zen", name: "Zen Master", icon: "meditation", color: "#4FA898", tint: "#E9F5F2", get: (L, logs) => Object.values(logs || {}).filter((l) => (Number(l.meditation) || 0) >= 10).length >= 7 },
];
const earnedBadges = (logs = {}) => BADGES.filter((b) => b.get(BADGES, logs));

const ptsSteps = (v) => Math.round((Number(v) || 0) / 100);
const ptsWater = (ml) => Math.round((Math.min(Number(ml) || 0, WATER_GOAL_ML) / WATER_GOAL_ML) * 100);
const ptsUnit = (v) => Math.min(Math.round((Number(v) || 0) * 10), 100);
/* workout: a logged session is 100; extra duration adds a little, capped at 200 total */
const ptsWorkout = (l = {}) => {
  if (!l.workoutDone && !(l.workoutSets?.length)) return 0;
  const min = Number(l.workoutMin) || 0;
  return Math.min(100 + Math.round(min / 3), 220);
};
const catPts = (id, l = {}) => {
  switch (id) {
    case "steps": return ptsSteps(l.steps);
    case "water": return ptsWater(l.water);
    case "sleep": { const v = Number(l.sleep) || 0; return v >= 7 ? Math.min(Math.round(v * 10), 100) : 0; }
    case "meditation": return ptsUnit(l.meditation);
    case "reading": return ptsUnit(l.reading);
    case "journal": return l.journal ? 100 : 0;
    case "fasting": return l.fasting ? 100 : 0;
    case "focus": return Math.min(Math.round((Number(l.focus) || 0) * 2), 100);
    case "calories": return Math.min(Math.round((Number(l.calories) || 0) / 10), 100);
    case "workout": return ptsWorkout(l);
    default: return 0;
  }
};
const dayBase = (l = {}) => CATS.reduce((s, c) => s + catPts(c.id, l), 0);
const dayScore = (l = {}) => dayBase(l) + challengeBonus(l);
/* ==== Premium motion: canvas ember burst, flame tip, layered water ==== */
function EmberBurst({ kind = "fire", onDone }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = cv.offsetWidth, H = cv.offsetHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
    const PAL = {
      fire: ["#E8863A", "#F2A75B", "#FBE3B9", "#D96F25"],
      stars: ["#F0C25E", "#FFFDF4", "#E8B54A", "#FFF6D8"],
      waterfx: ["#5EA3D6", "#9CC9EA", "#FFFFFF", "#4E93C9"],
      leaves: ["#5B9E5D", "#7A8C4F", "#A8B36A", "#E8863A"],
      petals: ["#EFB7CC", "#E39BB8", "#F6D8E4", "#D989A8"],
      motes: ["#F0C25E", "#FBE7B4", "#E8B54A", "#FFFDF4"],
      pulse: ["#78A0CD", "#DCEBFA", "#5E7FA8", "#FFFFFF"],
    };
    const cols = PAL[kind] || PAL.fire;
    const ps = Array.from({ length: 46 }, () => ({
      x: W * (0.22 + Math.random() * 0.56), y: H - 12,
      vx: (Math.random() - 0.5) * 6.4, vy: -(3 + Math.random() * 5.2),
      r: 1.2 + Math.random() * 1.7, c: cols[Math.floor(Math.random() * cols.length)],
      life: 1, px: 0, py: 0,
    }));
    let t0 = null, raf;
    const step = (t) => {
      if (!t0) t0 = t; const k = (t - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = "round";
      for (const p of ps) {
        p.px = p.x; p.py = p.y;
        p.x += p.vx; p.y += p.vy; p.vy += 0.17; p.vx *= 0.985;
        p.life = Math.max(0, 1 - k * 1.2);
        ctx.globalAlpha = p.life;
        ctx.strokeStyle = p.c; ctx.lineWidth = p.r * 1.5;
        ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (k < 1) raf = requestAnimationFrame(step); else onDone && onDone();
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line
  return <canvas ref={ref} style={{ position: "absolute", inset: "-44px -14px -8px -14px", width: "calc(100% + 28px)", height: "calc(100% + 52px)", pointerEvents: "none", zIndex: 3 }} />;
}
const FXKIND = { steps: "leaves", workout: "fire", calories: "fire", sleep: "stars", meditation: "petals", reading: "motes", focus: "pulse", water: "waterfx" };
function RowFX({ kind = "fire" }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = cv.offsetWidth, H = cv.offsetHeight, BAR = H - 8; // bar line sits near bottom
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
    const R = (a, b) => a + Math.random() * (b - a);
    // crisp fire sprite (small, hot core)
    let sprite = null;
    if (kind === "fire") {
      sprite = document.createElement("canvas"); sprite.width = sprite.height = 32;
      const sc = sprite.getContext("2d");
      const g = sc.createRadialGradient(16, 16, 0, 16, 16, 16);
      g.addColorStop(0, "rgba(255,244,214,1)"); g.addColorStop(0.18, "rgba(255,214,140,.95)");
      g.addColorStop(0.5, "rgba(238,140,52,.55)"); g.addColorStop(0.8, "rgba(200,84,24,.12)"); g.addColorStop(1, "rgba(200,84,24,0)");
      sc.fillStyle = g; sc.fillRect(0, 0, 32, 32);
    }
    const CFG = {
      fire:   { n: 20, mk: () => ({ x: R(6, W - 6), y: BAR + R(-2, 2), vy: R(0.45, 1.0), r: R(2.2, 4.6), life: Math.random(), dk: R(0.014, 0.022), ph: R(0, 6.28), amp: R(0.8, 1.8), fr: R(0.07, 0.11) }) },
      stars:  { n: 9,  mk: () => ({ x: R(8, W - 8), y: R(4, BAR - 6), tw: R(0, 6.28), sp: R(0.03, 0.06), r: R(1.6, 3.2), gold: Math.random() < 0.5 }) },
      leaves: { n: 7,  mk: () => ({ x: R(-10, W), y: R(2, BAR - 4), vx: R(0.35, 0.7), sway: R(0, 6.28), rot: R(0, 6.28), vr: R(-0.03, 0.03), r: R(2.4, 4), c: ["#5B9E5D", "#7A8C4F", "#A8B36A"][Math.floor(Math.random() * 3)] }) },
      petals: { n: 6,  mk: () => ({ x: R(8, W - 8), y: BAR + R(0, 6), vy: R(0.16, 0.34), sway: R(0, 6.28), rot: R(0, 6.28), r: R(2.2, 3.6), life: Math.random(), dk: 0.005 }) },
      motes:  { n: 10, mk: () => ({ x: R(0, W), y: R(2, BAR), vx: R(0.1, 0.28), vy: R(-0.08, 0.06), r: R(0.8, 1.7), tw: R(0, 6.28), sp: R(0.02, 0.05) }) },
      pulse:  { n: 0,  mk: () => ({}) },
      waterfx:{ n: 6,  mk: () => ({ x: R(8, W - 8), y: BAR - R(2, 5), tw: R(0, 6.28), sp: R(0.05, 0.09), r: R(1.4, 2.4) }) },
    };
    const cfg = CFG[kind] || CFG.fire;
    const ps = Array.from({ length: cfg.n }, cfg.mk);
    let raf, t = 0, alive = true;
    const star = (x, y, r, a, col) => {
      ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();
      ctx.globalAlpha = a * 0.6; ctx.beginPath(); ctx.moveTo(x - r * 0.5, y - r * 0.5); ctx.lineTo(x + r * 0.5, y + r * 0.5); ctx.moveTo(x + r * 0.5, y - r * 0.5); ctx.lineTo(x - r * 0.5, y + r * 0.5); ctx.stroke();
      ctx.globalAlpha = a; ctx.fillStyle = "#FFF"; ctx.beginPath(); ctx.arc(x, y, 0.9, 0, 7); ctx.fill();
    };
    const step = () => {
      if (!alive) return;
      t++;
      ctx.clearRect(0, 0, W, H);
      if (kind === "fire") {
        const pool = ctx.createLinearGradient(0, H, 0, BAR - 4);
        pool.addColorStop(0, "rgba(232,134,58,.34)"); pool.addColorStop(1, "rgba(232,134,58,0)");
        ctx.fillStyle = pool; ctx.fillRect(0, BAR - 4, W, H - BAR + 4);
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < ps.length; i++) {
          const p = ps[i]; p.y -= p.vy; p.life -= p.dk;
          if (p.life <= 0 || p.y < 4) ps[i] = cfg.mk();
          const wob = Math.sin(t * p.fr + p.ph) * p.amp;
          const s = p.r * (0.5 + p.life * 0.8);
          ctx.globalAlpha = Math.max(p.life, 0) * 0.85;
          ctx.drawImage(sprite, p.x + wob - s, p.y - s, s * 2, s * 2);
        }
        ctx.globalCompositeOperation = "source-over";
      } else if (kind === "stars") {
        for (const p of ps) { p.tw += p.sp; const a = 0.35 + 0.65 * Math.abs(Math.sin(p.tw)); star(p.x, p.y, p.r * (0.7 + 0.4 * Math.abs(Math.sin(p.tw))), a, p.gold ? "#F0C25E" : "#FFFDF4"); }
      } else if (kind === "leaves") {
        for (let i = 0; i < ps.length; i++) {
          const p = ps[i]; p.x += p.vx; p.sway += 0.04; p.rot += p.vr; p.y += Math.sin(p.sway) * 0.25;
          if (p.x > W + 10) ps[i] = { ...cfg.mk(), x: -8 };
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = 0.9;
          ctx.fillStyle = p.c; ctx.beginPath(); ctx.moveTo(0, -p.r); ctx.quadraticCurveTo(p.r, 0, 0, p.r); ctx.quadraticCurveTo(-p.r, 0, 0, -p.r); ctx.fill();
          ctx.strokeStyle = "rgba(46,60,40,.5)"; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(0, -p.r * 0.7); ctx.lineTo(0, p.r * 0.7); ctx.stroke(); ctx.restore();
        }
      } else if (kind === "petals") {
        if (t % 150 === 0) { ps.push({ ring: true, x: R(W * 0.2, W * 0.8), y: BAR, r: 1, life: 1 }); }
        for (let i = ps.length - 1; i >= 0; i--) {
          const p = ps[i];
          if (p.ring) { p.r += 0.55; p.life -= 0.02; if (p.life <= 0) { ps.splice(i, 1); continue; } ctx.globalAlpha = p.life * 0.5; ctx.strokeStyle = "#D989A8"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, Math.PI, 2 * Math.PI); ctx.stroke(); continue; }
          p.y -= p.vy; p.sway += 0.03; p.life -= p.dk; const sx = Math.sin(p.sway) * 6;
          if (p.life <= 0 || p.y < 2) ps[i] = cfg.mk();
          ctx.save(); ctx.translate(p.x + sx, p.y); ctx.rotate(p.rot + Math.sin(p.sway) * 0.5); ctx.globalAlpha = Math.min(p.life * 1.4, 0.92);
          ctx.fillStyle = "#EFB7CC"; ctx.beginPath(); ctx.ellipse(0, 0, p.r * 1.35, p.r * 0.8, 0, 0, 7); ctx.fill();
          ctx.fillStyle = "#E39BB8"; ctx.beginPath(); ctx.ellipse(p.r * 0.3, 0, p.r * 0.6, p.r * 0.4, 0, 0, 7); ctx.fill(); ctx.restore();
        }
      } else if (kind === "motes") {
        for (let i = 0; i < ps.length; i++) {
          const p = ps[i]; p.x += p.vx; p.y += p.vy; p.tw += p.sp;
          if (p.x > W + 4) ps[i] = { ...cfg.mk(), x: -3 };
          const a = 0.3 + 0.6 * Math.abs(Math.sin(p.tw));
          ctx.globalAlpha = a * 0.45; ctx.fillStyle = "#F0C25E"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 2.2, 0, 7); ctx.fill();
          ctx.globalAlpha = a; ctx.fillStyle = "#FBE7B4"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
        }
      } else if (kind === "pulse") {
        const k = (t % 110) / 110; const x = k * (W + 40) - 20;
        const g = ctx.createLinearGradient(x - 26, 0, x + 4, 0);
        g.addColorStop(0, "rgba(94,127,168,0)"); g.addColorStop(0.85, "rgba(120,160,205,.5)"); g.addColorStop(1, "rgba(190,215,240,.95)");
        ctx.fillStyle = g; ctx.fillRect(x - 26, BAR - 5, 30, 8);
        ctx.globalAlpha = 0.9; ctx.fillStyle = "#DCEBFA"; ctx.beginPath(); ctx.arc(Math.min(Math.max(x + 2, 4), W - 4), BAR - 1, 2.2, 0, 7); ctx.fill();
      } else if (kind === "waterfx") {
        for (const p of ps) { p.tw += p.sp; const a = 0.3 + 0.7 * Math.abs(Math.sin(p.tw)); star(p.x, p.y, p.r, a, "#FFFFFF"); }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, [kind]);
  return <canvas ref={ref} style={{ position: "absolute", left: -4, right: -4, bottom: -3, height: 36, width: "calc(100% + 8px)", pointerEvents: "none", zIndex: 2 }} />;
}
function WaterBar({ pct, surging }) {
  return (
    <div style={{ position: "relative", flex: 1, height: 14, background: "#EAF2F7", borderRadius: 99, overflow: "hidden", boxShadow: "inset 0 1px 3px rgba(60,90,110,.18)" }}>
      <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${Math.min(pct * 100, 100)}%`, borderRadius: 99, overflow: "hidden", transition: "width .55s cubic-bezier(.3,.8,.3,1)" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#63A8DC 0%,#4E93C9 55%,#3E7FB4 100%)" }} />
        <div className={`wave w1 ${surging ? "surge" : ""}`} />
        <div className={`wave w2 ${surging ? "surge" : ""}`} />
        <span className="bub b1" /><span className="bub b2" /><span className="bub b3" />
        <div style={{ position: "absolute", top: 1.5, left: 6, right: 6, height: 3.5, borderRadius: 99, background: "rgba(255,255,255,.4)" }} />
      </div>
    </div>
  );
}
const FASTS = [
  { h: 12, label: "12:12 · gentle" },
  { h: 14, label: "14:10" },
  { h: 16, label: "16:8 · classic" },
  { h: 18, label: "18:6" },
  { h: 20, label: "20:4 · warrior" },
  { h: 23, label: "OMAD" },
];
const FAST_LABEL = (v) => { const f = FASTS.find((x) => x.h === Number(v)); return f ? f.label.split(" ·")[0] : "Fast"; };
const buzz = (p = 12) => { try { navigator.vibrate && navigator.vibrate(p); } catch { } };
const kcalOf = (l = {}) => Math.round((Number(l.steps) || 0) * 0.04 + (Number(l.workoutMin) || 0) * 6);

const dk = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const today = () => dk(new Date());
const mKey = () => today().slice(0, 7);
const mName = () => new Date().toLocaleDateString(undefined, { month: "long" });
const greet = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };
const slug = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "player";
const code5 = () => { const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; let c = ""; for (let i = 0; i < 5; i++) c += A[Math.floor(Math.random() * A.length)]; return c; };

import { sSet, sGet, sList, sDel } from "./storage";
const PK = (id) => `rt1:p:${id}`, TK = (c) => `rt1:t:${c}`, ME = "rt1:me";

/* lightweight (non-secret) passcode hash — good enough for a friend test,
   NOT real security. Real auth comes with the backend later. */
function hashPass(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); }
const recoveryCode = () => { const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; let c = ""; for (let i = 0; i < 8; i++) c += A[Math.floor(Math.random() * A.length)]; return c.slice(0, 4) + "-" + c.slice(4); };
/* find a player account by name (case-insensitive) across the shared store */
async function findAccount(name) {
  const keys = await sList("rt1:p:", true);
  const want = name.trim().toLowerCase();
  for (const k of keys) { const p = await sGet(k, true); if (p && p.name.trim().toLowerCase() === want) return p; }
  return null;
}
async function findByRecovery(rc) {
  const keys = await sList("rt1:p:", true);
  const want = rc.trim().toUpperCase();
  for (const k of keys) { const p = await sGet(k, true); if (p && (p.recovery || "").toUpperCase() === want) return p; }
  return null;
}

/* ================================================================
   Landing — sleek editorial scene: layered paper hills, big type
   ================================================================ */
function LandingScene() {
  return (
    <svg viewBox="0 0 440 210" style={{ width: "100%", display: "block", borderRadius: 22 }} role="img" aria-label="A calm layered valley at dawn">
      <defs>
        <linearGradient id="lsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EBD9C4" /><stop offset="45%" stopColor="#E4D3C8" /><stop offset="100%" stopColor="#D9CFD0" />
        </linearGradient>
        <linearGradient id="lh1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8FB08A" /><stop offset="100%" stopColor="#7DA079" /></linearGradient>
        <linearGradient id="lh2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6E9A6B" /><stop offset="100%" stopColor="#5E8A5C" /></linearGradient>
        <linearGradient id="lh3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4C7A4E" /><stop offset="100%" stopColor="#3E6B42" /></linearGradient>
        <linearGradient id="lriv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#CFE0DC" /><stop offset="100%" stopColor="#A7C4C4" /></linearGradient>
      </defs>
      <rect width="440" height="210" fill="url(#lsky)" />
      {/* soft sun */}
      <circle cx="326" cy="66" r="30" fill="#F4E3C0" opacity=".85" />
      <circle cx="326" cy="66" r="30" fill="none" stroke="#EAD3A8" strokeWidth="1" opacity=".6" />
      {/* layered ridgelines */}
      <path d="M0 128 Q 70 104 150 120 Q 250 140 340 112 Q 400 96 440 108 L440 210 L0 210 Z" fill="url(#lh1)" opacity=".55" />
      <path d="M0 150 Q 90 124 190 142 Q 300 162 440 132 L440 210 L0 210 Z" fill="url(#lh2)" opacity=".8" />
      <path d="M0 178 Q 120 150 250 170 Q 360 186 440 166 L440 210 L0 210 Z" fill="url(#lh3)" />
      {/* winding river catching light */}
      <path d="M232 210 C 226 188, 250 176, 244 160 C 238 146, 258 138, 256 126" stroke="url(#lriv)" strokeWidth="13" fill="none" strokeLinecap="round" opacity=".9" />
      <path d="M232 210 C 226 188, 250 176, 244 160 C 238 146, 258 138, 256 126" stroke="#EAF2EF" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="1 12" opacity=".8" />
      {/* minimal pines on the ridge */}
      {[[40, 150], [58, 156], [392, 150], [410, 156]].map(([x, y], i) => (
        <path key={i} d={`M ${x} ${y} l -6 0 l 6 -16 l 6 16 l -6 0 l 0 6`} fill="#3E6B42" opacity=".9" />
      ))}
      {/* two birds */}
      <path d="M 150 60 q 5 -5 10 0 q 5 -5 10 0 M 186 52 q 4 -4 8 0 q 4 -4 8 0" stroke="#7A6E63" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ================================================================
   Icon set — one coherent custom SVG glyph system (no emoji)
   ================================================================ */
function Icon({ name, size = 20, color = "currentColor", stroke = 2 }) {
  const p = { fill: "none", stroke: color, strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round" };
  const g = {
    steps: <><path d="M9 4c-1.5 0-2.5 1.5-2.5 4 0 1.8.3 3.5.3 5.2 0 1.3-.8 2.3-.8 3.6 0 1.5 1 2.7 2.5 2.7s2.4-1.2 2.6-2.7c.2-1.6.4-2.9.4-4.4 0-2.2.5-3.9.5-5.6C12.5 5.2 11 4 9 4Z" {...p} /><path d="M6.3 14.4c1.5.5 3 .5 4.5 0" {...p} /></>,
    water: <path d="M12 3.5c3.4 4 6 6.9 6 10.2A6 6 0 0 1 6 13.7c0-3.3 2.6-6.2 6-10.2Z" {...p} />,
    sleep: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" {...p} />,
    workout: <><path d="M6.5 9v6M17.5 9v6M4 10.5v3M20 10.5v3M6.5 12h11" {...p} /></>,
    meditation: <><circle cx="12" cy="6.5" r="2.2" {...p} /><path d="M12 8.7c-1 2-3.5 3-5.5 3.3M12 8.7c1 2 3.5 3 5.5 3.3M6 17.5c1.5-2 4-3 6-3s4.5 1 6 3" {...p} /></>,
    reading: <><path d="M12 6c-1.8-1.3-4-1.8-6.5-1.5v12C8 16.2 10.2 16.7 12 18M12 6c1.8-1.3 4-1.8 6.5-1.5v12C16 16.2 13.8 16.7 12 18M12 6v12" {...p} /></>,
    journal: <><path d="M5 4.5h11a2 2 0 0 1 2 2V20l-2.5-1.5L13 20V4.5M8 8.5h6M8 12h5" {...p} /></>,
    fasting: <><circle cx="12" cy="13" r="7.5" {...p} /><path d="M12 9.5v3.5l2.6 1.8M10 2.5h4" {...p} /></>,
    focus: <><circle cx="12" cy="12" r="8" {...p} /><circle cx="12" cy="12" r="2" fill={color} stroke="none" /><path d="M12 4v2.5M12 17.5V20M4 12h2.5M17.5 12H20" {...p} /></>,
    flag: <><path d="M6 21V4" {...p} /><path d="M6 5h11l-2.5 3.5L17 12H6" {...p} /></>,
    star: <path d="M12 4l2.3 4.8 5.2.7-3.8 3.6 1 5.2L12 15.9 7.3 18.3l1-5.2L4.5 9.5l5.2-.7Z" fill={color} stroke={color} strokeWidth="1" strokeLinejoin="round" />,
    home: <><path d="M4 11.5 12 4l8 7.5M6.5 10V20h11V10" {...p} /></>,
    goals: <><circle cx="12" cy="12" r="8.5" {...p} /><circle cx="12" cy="12" r="4.2" {...p} /><circle cx="12" cy="12" r="0.6" fill={color} stroke={color} /></>,
    team: <><circle cx="8.5" cy="9" r="3" {...p} /><circle cx="16.5" cy="10.5" r="2.4" {...p} /><path d="M3.5 19c.4-4 3-5 5-5s4.6 1 5 5M14 18c.6-3 2.3-3.5 3.5-3.5 2 0 3.3 1 3.5 3.5" {...p} /></>,
    ranks: <><path d="M5 20v-7M12 20V5M19 20v-9" {...p} /></>,
    me: <><circle cx="12" cy="8" r="4" {...p} /><path d="M4.5 20c.6-4.5 4-6 7.5-6s6.9 1.5 7.5 6" {...p} /></>,
    fire: <path d="M12 3c2 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.3.5-2.3 1-3 .3 1 1 1.6 1.8 1.8C10.5 8 11 5.5 12 3Z" fill={color} stroke={color} strokeWidth="1.2" strokeLinejoin="round" />,
    bolt: <path d="M13 3 5 13h5l-1 8 8-11h-5Z" fill={color} stroke={color} strokeWidth="1.2" strokeLinejoin="round" />,
    trophy: <><path d="M7 5h10v3a5 5 0 0 1-10 0ZM7 6H4.5v1.5A2.5 2.5 0 0 0 7 10M17 6h2.5v1.5A2.5 2.5 0 0 1 17 10M10 13.5h4M9.5 18.5h5M12 13.5v5" {...p} /></>,
    check: <path d="M5 12.5 9.5 17 19 6.5" {...p} strokeWidth={stroke + 0.6} />,
    plus: <path d="M12 6v12M6 12h12" {...p} strokeWidth={stroke + 0.4} />,
  }[name];
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block" }}>{g}</svg>;
}
const CAT_ICON = { steps: "steps", water: "water", sleep: "sleep", workout: "workout", meditation: "meditation", reading: "reading", journal: "journal", fasting: "fasting", focus: "focus", calories: "fire" };

function LeafSprig({ side = "right", size = 78, style }) {
  const flip = side === "left";
  return (
    <svg viewBox="0 0 90 70" width={size} height={size * 0.78} aria-hidden="true"
      style={{ transform: flip ? "scaleX(-1)" : "none", ...style }}>
      <path d="M 8 8 Q 45 14 78 46" stroke="#6FA36B" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      {[[20, 14, -28], [33, 20, -22], [46, 27, -16], [58, 35, -10], [70, 44, -4]].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x},${y}) rotate(${r})`}>
          <path d="M0 0 Q 9 -7 17 -1 Q 9 6 0 0 Z" fill={i % 2 ? "#8CBE73" : "#6FA36B"} />
          <path d="M2 0 Q 9 -3 15 -1" stroke="#4F7D43" strokeWidth=".8" fill="none" opacity=".5" />
        </g>
      ))}
      {[[16, 10], [30, 15]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y}) rotate(30)`}>
          <path d="M0 0 Q 7 -5 13 -1 Q 7 5 0 0 Z" fill="#A9D48C" />
        </g>
      ))}
    </svg>
  );
}

/* Emblem crest — rounded hexagon shield with a themed emblem */
const CREST_THEMES = [
  { key: "laurel", bg: "#5E9E5B", bg2: "#4C8A4A", ring: "#E7C24D" },
  { key: "mountain", bg: "#8B6FC9", bg2: "#7458B0", ring: "#CDB8EE" },
  { key: "wave", bg: "#4E9BD8", bg2: "#3D82BC", ring: "#BFE0F2" },
  { key: "flame", bg: "#D97A4E", bg2: "#BE6238", ring: "#F2C24A" },
  { key: "sun", bg: "#E0A438", bg2: "#C98A22", ring: "#FBE7A1" },
  { key: "leaf", bg: "#4FA898", bg2: "#3C8E7F", ring: "#BFE6DC" },
];
/* ================================================================
   Roundel avatar — initial + icon sigil, variable color/icon/style.
   Pure code, replaces the character. Each account stores {color,icon}.
   ================================================================ */
const ROUNDEL_COLORS = ["#5E9E5B","#3F7B41","#4E9BD8","#39749F","#8B6FC9","#6B4FA8","#D96A4E","#C24E36","#E0A438","#C9814E","#4FA898","#C9678B"];
const ROUNDEL_ICONS = ["leaf","mountain","sun","bolt","sprout","wave","flame","star","moon","book","compass","crown"];
function shadeHex(hex, amt) { const n = parseInt(hex.slice(1), 16); let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt; r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b)); return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`; }
function seededAvatar(name = "") { const h = [...String(name)].reduce((a, c) => a + c.charCodeAt(0), 0); return { color: ROUNDEL_COLORS[h % ROUNDEL_COLORS.length], icon: ROUNDEL_ICONS[(h * 7) % ROUNDEL_ICONS.length], variant: h % 3 }; }
function initialsOf(name = "") { const parts = String(name).trim().split(/\s+/); if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase(); return String(name).trim().slice(0, 2).toUpperCase() || "?"; }

function Sigil({ kind, tone = "#FFFDF4" }) {
  const p = { fill: "none", stroke: tone, strokeWidth: 2.6, strokeLinecap: "round", strokeLinejoin: "round", opacity: .92 };
  const f = { fill: tone, opacity: .92 };
  switch (kind) {
    case "leaf": return <path d="M50 60 Q66 48 60 30 Q50 24 42 32 Q36 50 50 60 Z M50 34 V56" {...p} />;
    case "mountain": return <path d="M32 60 L44 38 L52 50 L58 40 L68 60 Z" {...f} />;
    case "sun": return <g {...p}><circle cx="50" cy="46" r="8" />{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <line key={a} x1="50" y1="30" x2="50" y2="34" transform={`rotate(${a} 50 46)`} />)}</g>;
    case "bolt": return <path d="M54 28 L40 50 h8 l-4 16 L60 42 h-8 Z" {...f} />;
    case "sprout": return <g {...p}><path d="M50 62 V44" /><path d="M50 46 Q38 44 36 34 Q48 34 50 46" /><path d="M50 44 Q62 42 64 32 Q52 32 50 44" /></g>;
    case "wave": return <g {...p}><path d="M32 44 q6 -7 12 0 q6 7 12 0 q6 -7 12 0" /><path d="M32 54 q6 -7 12 0 q6 7 12 0 q6 -7 12 0" /></g>;
    case "flame": return <path d="M50 28 q10 9 0 20 q-4 5 0 10 q-11 -5 -7 -16 q2 -8 7 -14 Z" {...f} />;
    case "star": return <path d="M50 28 l4 10 11 1 -8 7 2 11 -9 -6 -9 6 2 -11 -8 -7 11 -1 Z" {...f} />;
    case "moon": return <path d="M60 46 A14 14 0 1 1 46 32 A11 11 0 0 0 60 46 Z" {...f} />;
    case "book": return <g {...p}><path d="M50 34 Q42 30 34 32 v20 Q42 50 50 54 Q58 50 66 52 V32 Q58 30 50 34 Z" /><path d="M50 34 V54" /></g>;
    case "compass": return <g {...p}><circle cx="50" cy="44" r="13" /><path d="M50 36 L54 46 L50 52 L46 46 Z" fill="#FFFDF4" /></g>;
    case "crown": return <path d="M34 54 L34 40 L42 47 L50 36 L58 47 L66 40 L66 54 Z" {...f} />;
    default: return null;
  }
}
/* p = player-ish object; falls back to name-seed if no stored avatar */
function Avatar({ player, name, size = 72 }) {
  const nm = player?.name ?? name ?? "?";
  if (player?.crestId) {
    /* personal pixel crest — circular frame distinguishes it from square team crests */
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", border: `${Math.max(2, size * .04)}px solid #FFFFFF`, boxShadow: "0 2px 8px rgba(90,74,48,.22)", background: "#F6F0E2", display: "grid", placeItems: "center", flexShrink: 0 }} aria-label={`${nm} crest`}>
        <img src={`./crest2/${player.crestId}.webp`} alt="" width={size} height={size} style={{ width: "88%", height: "88%", imageRendering: "pixelated" }} draggable={false} />
      </div>
    );
  }
  const av = (player && player.color && player.icon) ? { color: player.color, icon: player.icon, variant: player.variant ?? 1 } : seededAvatar(nm);
  const inits = initialsOf(nm);
  const uid = `av${nm}${av.color.replace("#", "")}${av.icon}${av.variant}`.replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-label={`${nm} avatar`}>
      <defs><linearGradient id={uid} x1="0" y1="0" x2="0.4" y2="1"><stop offset="0%" stopColor={av.color} /><stop offset="100%" stopColor={shadeHex(av.color, -18)} /></linearGradient></defs>
      <circle cx="50" cy="50" r="47" fill={`url(#${uid})`} />
      <circle cx="50" cy="50" r="47" fill="none" stroke="#FFFFFF" strokeWidth="3" opacity=".55" />
      {av.variant !== 2 && <path d="M50 6 A44 44 0 0 1 90 46 L50 46 Z" fill="#FFFFFF" opacity=".12" />}
      {av.variant === 2 && <circle cx="50" cy="50" r="40" fill="none" stroke="#FFFDF4" strokeWidth="1.4" strokeDasharray="2 5" opacity=".5" />}
      <g transform="translate(0,-6)"><Sigil kind={av.icon} /></g>
      <text x="50" y="80" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="22" fill="#FFFDF4">{inits}</text>
      {av.variant === 1 && <path d="M22 70 Q50 84 78 70" stroke="#FFFDF4" strokeWidth="1.6" fill="none" opacity=".5" />}
    </svg>
  );
}

function Shield({ seed = "", size = 52, active }) {
  const h = [...String(seed)].reduce((a, c) => a + c.charCodeAt(0), 0);
  const t = CREST_THEMES[h % CREST_THEMES.length];
  const uid = `cr${h}`;
  return (
    <svg viewBox="0 0 72 80" width={size} height={size * 1.1} aria-hidden="true">
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.bg} /><stop offset="100%" stopColor={t.bg2} /></linearGradient>
      </defs>
      {/* hexagon shield */}
      <path d="M36 3 L64 17 V47 C64 60 52 70 36 77 C20 70 8 60 8 47 V17 Z" fill={`url(#${uid})`} opacity={active ? 1 : .95} />
      <path d="M36 3 L64 17 V47 C64 60 52 70 36 77 C20 70 8 60 8 47 V17 Z" fill="none" stroke={t.ring} strokeWidth="2.5" opacity=".9" />
      <path d="M36 9 L58 20 V45 C58 56 48 64.5 36 70.5 C24 64.5 14 56 14 45 V20 Z" fill="#FFFFFF" opacity=".14" />
      <g fill="#FFFDF4">
        {t.key === "laurel" && (<>
          <path d="M36 24 l3 8 8 1 -6 5.5 2 8 -7 -4.5 -7 4.5 2 -8 -6 -5.5 8 -1 Z" opacity=".95" />
          <path d="M20 34 q 4 12 15 15 M52 34 q -4 12 -15 15" stroke="#FFFDF4" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity=".85" />
        </>)}
        {t.key === "mountain" && (<>
          <path d="M16 52 L30 30 L38 42 L45 32 L56 52 Z" />
          <path d="M30 30 L34 36 L27 40 Z" fill={t.bg2} opacity=".6" />
        </>)}
        {t.key === "wave" && <path d="M16 44 q 8 -9 16 0 q 8 9 16 0 M18 52 q 8 -7 14 0 q 8 7 14 0" fill="none" stroke="#FFFDF4" strokeWidth="4" strokeLinecap="round" />}
        {t.key === "flame" && <path d="M36 24 q 12 10 0 24 q -5 6 0 12 q -14 -7 -9 -21 q 3 -8 9 -15 Z" />}
        {t.key === "sun" && (<><circle cx="36" cy="42" r="8" />{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <rect key={a} x="35" y="24" width="2" height="6" rx="1" transform={`rotate(${a} 36 42)`} />)}</>)}
        {t.key === "leaf" && <path d="M36 26 Q 50 34 44 50 Q 36 58 28 50 Q 22 34 36 26 Z M36 30 V 50" stroke={t.bg2} strokeWidth="1.5" />}
      </g>
    </svg>
  );
}

/* Illustration slot — a framed placeholder where Grok art drops in.
   Renders a soft painted landscape now so it looks intentional. */
function ArtSlot({ h = 150, label, kind = "scene", round = 16, src, pos = "center", children }) {
  return (
    <div style={{ position: "relative", height: h, borderRadius: round, overflow: "hidden", background: kind === "sky" ? "linear-gradient(#AFD8EC,#DCEBE0 70%,#EFEAD2)" : "linear-gradient(135deg,#CDE4F0,#DDECDF)" }}>
      {src ? (
        <img src={src} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: pos }} />
      ) : (
        <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true">
          <circle cx="320" cy="46" r="40" fill="#FBEFC4" opacity=".7" /><circle cx="320" cy="46" r="16" fill="#FBE7A1" />
          <path d="M-10 150 L70 96 L140 140 L210 90 L320 150 Z" fill="#A6C0D6" opacity=".6" />
          <path d="M-10 168 Q 120 120 260 150 Q 360 172 410 138 L410 210 L-10 210 Z" fill="#94BA74" />
          <path d="M-10 210 Q 130 172 300 192 Q 380 202 410 186 L410 210 Z" fill="#7CA95F" />
          {[[40,150],[58,156],[360,150],[378,156]].map(([x,y],i)=>(<path key={i} d={`M ${x} ${y} l -7 0 l 7 -18 l 7 18 l -7 0 l 0 6`} fill="#3E6B42" opacity=".9"/>))}
        </svg>
      )}
      {children}
      {label && <div style={{ position: "absolute", bottom: 8, right: 10, fontSize: 9.5, fontWeight: 800, color: "#3E5A4A", background: "#FFFFFFAA", borderRadius: 99, padding: "2px 8px", letterSpacing: ".04em" }}>{label}</div>}
    </div>
  );
}

function Badge({ badge, earned, size = 64 }) {
  return (
    <div style={{ textAlign: "center", width: size + 6, opacity: earned ? 1 : .45 }}>
      <div style={{ position: "relative", width: size, height: size, margin: "0 auto" }}>
        <svg viewBox="0 0 64 64" width={size} height={size}>
          <path d="M32 2 L58 17 V47 L32 62 L6 47 V17 Z" fill={earned ? badge.tint : "#F1EEE3"} stroke={earned ? badge.color : "#E4DDCB"} strokeWidth="2.2" />
          <path d="M32 8 L52 20 V44 L32 56 L12 44 V20 Z" fill="#FFFFFF" opacity=".45" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: earned ? badge.color : "#B7B29C" }}>
          <Icon name={badge.icon} size={size * 0.42} color={earned ? badge.color : "#B7B29C"} stroke={2.2} />
        </div>
      </div>
      <div style={{ fontSize: 10.5, fontWeight: 800, color: earned ? INK : MUT, marginTop: 3, lineHeight: 1.15 }}>{badge.name}</div>
    </div>
  );
}

function tierOf(v, t1, t2, t3) { return v >= t3 ? 3 : v >= t2 ? 2 : v >= t1 ? 1 : 0; }

/* ================================================================
   Character — flat-geometric hooded adventurer.
   Evolves with real stats: cloak (workouts), boots (steps),
   aura (meditation), staff+crystal (reading/journal). Palette
   shifts warmer/brighter as overall level climbs. No faces, no
   Mii — bold shapes, thick outline, storybook-flat.
   ================================================================ */
const CLOAK = ["#7C93B0", "#5E9E5B", "#4E9BD8", "#C9814E"];   // tier 0..3
const CLOAK_D = ["#63779A", "#3F7B41", "#39749F", "#A5643A"];
const BOOT = ["#6B5F49", "#7C6B4E", "#9AA7B4", "#E0A438"];
function Character({ gear = {}, size = 150, tone = "#E7B98C" }) {
  const boots = gear.boots || 0, chest = gear.chest || 0, aura = gear.aura || 0, sigil = gear.sigil || 0;
  const c = CLOAK[chest], cd = CLOAK_D[chest];
  const OUT = "#2E3830";
  return (
    <svg viewBox="0 0 120 150" width={size} height={size * 1.25} role="img" aria-label="Your adventurer">
      {/* aura rings */}
      {aura > 0 && [...Array(aura)].map((_, i) => (
        <circle key={i} cx="60" cy="74" r={44 + i * 7} fill="none" stroke="#6FC3B0" strokeWidth="2" strokeDasharray="1 9" opacity={.55 - i * .12} />
      ))}
      {/* ground shadow */}
      <ellipse cx="60" cy="140" rx="27" ry="5.5" fill="#2E3830" opacity=".1" />

      {/* staff (sigil) behind body */}
      {sigil > 0 && (
        <g>
          <rect x="90" y="40" width="4.5" height="92" rx="2.2" fill="#8A6A45" stroke={OUT} strokeWidth="2" />
          <path d="M92 40 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0" fill={["", "#E0A438", "#C9678B", "#8B6FC9"][sigil]} stroke={OUT} strokeWidth="2.4" />
          {sigil > 1 && <path d="M92 34 l1.4 3 3.2.4 -2.3 2.3 .6 3.2 -2.9-1.5 -2.9 1.5 .6-3.2 -2.3-2.3 3.2-.4Z" fill="#FBF3D6" />}
        </g>
      )}

      {/* boots */}
      <path d="M45 120 h13 v10 q0 4 -4 4 h-13 q-3 0 -3-3 q0-4 3-6 Z" fill={BOOT[boots]} stroke={OUT} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M62 120 h13 q3 2 3 6 q0 3 -3 3 h-13 q-4 0 -4-4 Z" fill={BOOT[boots]} stroke={OUT} strokeWidth="2.4" strokeLinejoin="round" />
      {boots > 1 && <g stroke="#FFFDF4" strokeWidth="2" strokeLinecap="round" opacity=".85"><path d="M40 126h6M38 130h7" /><path d="M80 126h-6M82 130h-7" /></g>}

      {/* legs */}
      <rect x="50" y="96" width="9" height="26" rx="4" fill="#3C4550" stroke={OUT} strokeWidth="2.2" />
      <rect x="61" y="96" width="9" height="26" rx="4" fill="#343C46" stroke={OUT} strokeWidth="2.2" />

      {/* cloak / robe body */}
      <path d="M38 66 Q34 108 60 108 Q86 108 82 66 Q72 56 60 56 Q48 56 38 66 Z" fill={c} stroke={OUT} strokeWidth="2.6" strokeLinejoin="round" />
      {/* cloak trim tiers */}
      {chest > 0 && <path d="M46 100 Q60 106 74 100" fill="none" stroke={cd} strokeWidth="4" strokeLinecap="round" />}
      {chest > 1 && <path d="M60 60 V104" stroke="#FFFDF4" strokeWidth="2" opacity=".5" strokeLinecap="round" />}
      {chest > 2 && <g fill="#FBF3D6" stroke={OUT} strokeWidth="1.6"><circle cx="60" cy="72" r="3.4" /></g>}

      {/* pauldrons at high tier */}
      {chest > 1 && <><path d="M38 66 q-8 2 -9 12 q6 3 12 0 Z" fill={cd} stroke={OUT} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M82 66 q8 2 9 12 q-6 3 -12 0 Z" fill={cd} stroke={OUT} strokeWidth="2.2" strokeLinejoin="round" /></>}

      {/* arms peeking */}
      <path d="M40 70 q-7 8 -6 20" fill="none" stroke={cd} strokeWidth="6" strokeLinecap="round" />
      <path d="M80 70 q7 8 6 20" fill="none" stroke={cd} strokeWidth="6" strokeLinecap="round" />

      {/* hood + head */}
      <path d="M60 20 Q42 22 42 44 Q42 54 60 56 Q78 54 78 44 Q78 22 60 20 Z" fill={c} stroke={OUT} strokeWidth="2.6" strokeLinejoin="round" />
      {/* face shadow inside hood */}
      <ellipse cx="60" cy="42" rx="12" ry="13" fill={tone} stroke={OUT} strokeWidth="2.2" />
      <path d="M48 34 Q42 24 54 22 Q60 18 66 22 Q78 24 72 34" fill={c} stroke={OUT} strokeWidth="2.4" strokeLinejoin="round" />
      {/* simple friendly eyes */}
      <circle cx="55" cy="43" r="1.8" fill={OUT} /><circle cx="65" cy="43" r="1.8" fill={OUT} />
      <path d="M56 48 Q60 50.5 64 48" stroke={OUT} strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* count-up number for the hero score */
function CountUp({ value, ms = 900, style, className }) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    let raf, t0; const start = from.current, delta = value - start;
    const step = (t) => { if (!t0) t0 = t; const k = Math.min((t - t0) / ms, 1); const cur = Math.round(start + delta * (1 - Math.pow(1 - k, 3))); setV(cur); if (k < 1) raf = requestAnimationFrame(step); else from.current = value; };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return <div className={className} style={style}>{v.toLocaleString()}</div>;
}

function StackChart({ logs }) {
  const days = useMemo(() => { const out = []; for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); out.push(dk(d)); } return out; }, []);
  const max = Math.max(...days.map((d) => dayScore(logs?.[d])), 400);
  const W = 420, H = 130, bw = W / 14 - 7;
  return (
    <svg viewBox={`0 0 ${W} ${H + 22}`} style={{ width: "100%", display: "block" }} role="img" aria-label="Daily points, last 14 days">
      {[0.5, 1].map((f) => (
        <g key={f}><line x1="0" x2={W} y1={H - H * f} y2={H - H * f} stroke={LINE} strokeDasharray="3 5" />
          <text x={W - 2} y={H - H * f - 3} textAnchor="end" fontSize="9" fill={MUT} fontWeight="700">{Math.round(max * f)}</text></g>
      ))}
      {days.map((d, i) => {
        let y = H; const x = i * (W / 14) + 3;
        return (
          <g key={d}>
            {CATS.map((c) => { const p = catPts(c.id, logs?.[d]); if (!p) return null; const h = (p / max) * H; y -= h; return <rect key={c.id} x={x} y={y} width={bw} height={Math.max(h - 1, 0)} rx="2" fill={c.color} />; })}
            <text x={x + bw / 2} y={H + 13} textAnchor="middle" fontSize="8.5" fill={i === 13 ? INK : MUT} fontWeight={i === 13 ? "800" : "600"}>{i === 13 ? "today" : d.slice(8)}</text>
          </g>
        );
      })}
    </svg>
  );
}

const Ic = {
  breathe: (a) => <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={a ? "#FFFFFF" : "#8E9284"} strokeWidth="2.1" strokeLinecap="round"><path d="M3.5 8.5h9a2.6 2.6 0 1 0-2.6-2.6M3.5 13h13.5a2.8 2.8 0 1 1-2.8 2.8M3.5 17.5h6.5" /></svg>,
  home: (a) => <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={a ? "#FFFFFF" : "#8E9284"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11 L12 3 L21 11 M6 10 V20 H18 V10" /></svg>,
  ranks: (a) => <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={a ? "#FFFFFF" : "#8E9284"} strokeWidth="2.2" strokeLinecap="round"><path d="M5 20 V12 M12 20 V5 M19 20 V9" /></svg>,
  team: (a) => <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={a ? "#FFFFFF" : "#8E9284"} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><circle cx="8.5" cy="9" r="3.2" /><circle cx="16.5" cy="10.5" r="2.6" /><path d="M3.5 19 Q 4 14.5 8.5 14.5 Q 13 14.5 13.5 19 M 13.8 18 Q 14.6 14.8 16.5 14.8 Q 19.8 14.8 20.5 18.5" /></svg>,
  me: (a) => <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={a ? "#FFFFFF" : "#8E9284"} strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4.5 20 Q 6 14.5 12 14.5 Q 18 14.5 19.5 20" /></svg>,
  goals: (a) => <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={a ? "#FFFFFF" : "#8E9284"} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="0.6" fill={a ? "#FFFFFF" : "#8E9284"} /></svg>,
};

/* ================================================================
   Workout drawer — quick log or drill-down
   ================================================================ */
function WorkoutSheet({ log, setLog, onClose, allLogs = {}, onHub }) {
  const sets = log.workoutSets || [];
  const [cat, setCat] = useState(null);
  const [item, setItem] = useState("");
  const [custom, setCustom] = useState("");
  const lastOf = (name) => {
    const days = Object.keys(allLogs).sort().reverse();
    for (const d of days) { const s = (allLogs[d]?.workoutSets || []).filter((x) => x.name === name); if (s.length) { const b = s[s.length - 1]; return { ...b, d }; } }
    return null;
  };
  const [weight, setWeight] = useState("");
  const [restLen, setRestLen] = useState(90);
  const [restEnd, setRestEnd] = useState(null);
  const [restNow, setRestNow] = useState(Date.now());
  useEffect(() => { if (!restEnd) return; const id = setInterval(() => setRestNow(Date.now()), 250); return () => clearInterval(id); }, [restEnd]);
  const restLeft = restEnd ? Math.max(0, Math.ceil((restEnd - restNow) / 1000)) : 0;
  useEffect(() => { if (restEnd && restLeft === 0) { setRestEnd(null); try { navigator.vibrate && navigator.vibrate([120, 60, 120]); } catch { } } }, [restLeft, restEnd]);
  const historyOf = (name) => {
    const days = Object.keys(allLogs).sort().reverse().filter((d) => d !== today());
    const out = [];
    for (const d of days) { const s = (allLogs[d]?.workoutSets || []).filter((x) => x.name === name); if (s.length) { out.push({ d, s }); if (out.length >= 3) break; } }
    return out;
  };
  const [reps, setReps] = useState("");
  const [nsets, setNsets] = useState("");
  const [mins, setMins] = useState("");

  const tree = cat ? WORKOUT_TREE[cat] : null;
  const chosen = item === "__custom" ? custom.trim() : item;

  const addEntry = () => {
    if (!cat || !chosen) return;
    const e = tree.mode === "lift"
      ? { type: "strength", name: chosen, weight: Number(weight) || 0, reps: Number(reps) || 0, sets: Number(nsets) || 0 }
      : { type: cat, name: chosen, min: Number(mins) || 0 };
    const addMin = tree.mode === "lift" ? 0 : (Number(mins) || 0);
    setLog((l) => ({ ...l, workoutDone: true, workoutSets: [...(l.workoutSets || []), e], workoutMin: (Number(l.workoutMin) || 0) + addMin }));
    setItem(""); setCustom(""); setWeight(""); setReps(""); setNsets(""); setMins("");
  };
  const removeEntry = (i) => setLog((l) => { const arr = [...(l.workoutSets || [])]; const [rm] = arr.splice(i, 1); return { ...l, workoutSets: arr, workoutMin: Math.max(0, (Number(l.workoutMin) || 0) - (rm.min || 0)), workoutDone: arr.length > 0 || l.workoutQuick }; });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(30,28,20,.42)", zIndex: 60, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 528, maxHeight: "90vh", display: "flex", flexDirection: "column", background: "#FFFDF8", borderRadius: "28px 28px 0 0", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ position: "relative", height: 110, flexShrink: 0 }}>
          <img src={IMGS.workout} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 60%" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(25,30,22,.1) 0%, rgba(25,30,22,.55) 100%)" }} />
          <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 7 }}>
            {onHub && <button onClick={onHub} style={{ borderRadius: 99, border: "none", background: "rgba(255,253,248,.88)", padding: "7px 13px", fontWeight: 800, fontSize: 12.5, cursor: "pointer" }}>History & PRs</button>}
            <button onClick={onClose} aria-label="Done" style={{ borderRadius: 99, border: "none", background: "rgba(255,253,248,.88)", padding: "7px 15px", fontWeight: 800, fontSize: 12.5, cursor: "pointer" }}>Done</button>
          </div>
          <div style={{ position: "absolute", left: 18, bottom: 10 }}>
            <div className="rh" style={{ fontSize: 23, color: "#FFF", textShadow: "0 1px 10px rgba(15,20,14,.5)" }}>Workout</div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,.9)", textShadow: "0 1px 6px rgba(15,20,14,.5)" }}>Quick log, or track every set</div>
          </div>
        </div>
        <div style={{ padding: 16, overflowY: "auto" }}>
        {(() => {
          const strength = sets.filter((x) => x.type === "strength");
          const volume = strength.reduce((s, x) => s + (x.weight || 0) * (x.reps || 0) * (x.sets || 1), 0);
          const exNames = [...new Set(sets.map((x) => x.name))];
          return sets.length > 0 ? (
            <div style={{ background: "#F1F7EC", borderRadius: 16, padding: "12px 14px", marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".08em", color: GREEN_D, marginBottom: 5 }}>TODAY'S SESSION</div>
              <div style={{ display: "flex", gap: 14, alignItems: "baseline", flexWrap: "wrap" }}>
                <span className="rh" style={{ fontSize: 19 }}>{exNames.length}<span className="unit">exercise{exNames.length === 1 ? "" : "s"}</span></span>
                <span className="rh" style={{ fontSize: 19 }}>{sets.length}<span className="unit">entries</span></span>
                {volume > 0 && <span className="rh" style={{ fontSize: 19 }}>{volume.toLocaleString()}<span className="unit">lb volume</span></span>}
                {(Number(log.workoutMin) || 0) > 0 && <span className="rh" style={{ fontSize: 19 }}>{log.workoutMin}<span className="unit">min</span></span>}
              </div>
            </div>
          ) : null;
        })()}

        {/* quick log */}
        <div className="rp" style={{ padding: 14, marginTop: 10, background: "#FBF9F2", boxShadow: "none" }}>
          <div style={{ fontWeight: 800, fontSize: 13.5, marginBottom: 8 }}>Quick log <span style={{ color: MUT, fontWeight: 600 }}>· fastest, just counts the session</span></div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="rpill" onClick={() => setLog((l) => ({ ...l, workoutDone: true, workoutQuick: true, workoutMin: Math.max(0, (Number(l.workoutMin) || 0) - 15) }))}>−15m</button>
            <div style={{ flex: 1, textAlign: "center", fontWeight: 800 }}>{log.workoutMin || 0} min</div>
            <button className="rpill" style={{ background: "#F1EDF9", borderColor: "#8B6FC9", color: "#6B4FA8" }} onClick={() => setLog((l) => ({ ...l, workoutDone: true, workoutQuick: true, workoutMin: (Number(l.workoutMin) || 0) + 15 }))}>+15m</button>
          </div>
        </div>

        {/* drill down */}
        <div style={{ fontWeight: 800, fontSize: 13.5, margin: "16px 0 8px" }}>Track the details <span style={{ color: MUT, fontWeight: 600 }}>· optional, shows on your profile</span></div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {Object.entries(WORKOUT_TREE).map(([k, v]) => (
            <button key={k} className={`rchip ${cat === k ? "on" : ""}`} onClick={() => { setCat(cat === k ? null : k); setItem(""); }}>{v.name}</button>
          ))}
        </div>

        {tree && (
          <div className="rp" style={{ padding: 14, background: "#FBF9F2", boxShadow: "none" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {tree.items.map((it) => (
                <button key={it} className={`rchip ${item === it ? "on" : ""}`} onClick={() => setItem(it)}>{it}</button>
              ))}
              <button className={`rchip ${item === "__custom" ? "on" : ""}`} onClick={() => setItem("__custom")}>+ Custom</button>
            </div>
            {item === "__custom" && (
              <input className="rin" style={{ marginBottom: 10 }} maxLength={24} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Name this exercise" />
            )}
            {chosen && tree.mode === "lift" && (() => {
              const nm = item === "__custom" ? custom : item;
              const todaySets = sets.filter((x) => x.name === nm && x.type === "strength");
              const hist = nm ? historyOf(nm) : [];
              const logSet = () => {
                if (!weight && !reps) return;
                setLog((l) => ({ ...l, workoutDone: true, workoutSets: [...(l.workoutSets || []), { name: nm, type: "strength", weight: Number(weight) || 0, reps: Number(reps) || 0, sets: 1 }] }));
                setRestEnd(Date.now() + restLen * 1000);
              };
              const repeatLast = () => { const p = todaySets[todaySets.length - 1]; if (p) { setWeight(String(p.weight || "")); setReps(String(p.reps || "")); setLog((l) => ({ ...l, workoutDone: true, workoutSets: [...(l.workoutSets || []), { ...p }] })); setRestEnd(Date.now() + restLen * 1000); } };
              return (
                <div style={{ marginBottom: 10 }}>
                  {hist.length > 0 && (
                    <div style={{ background: "#F1EDF9", borderRadius: 12, padding: "9px 12px", marginBottom: 9 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".07em", color: "#8B6FC9", marginBottom: 4 }}>HISTORY — BEAT IT</div>
                      {hist.map((h) => (
                        <div key={h.d} style={{ display: "flex", gap: 8, fontSize: 12, fontWeight: 700, color: "#5B4990", padding: "2px 0" }}>
                          <span style={{ width: 52, color: "#9A8CC4" }}>{new Date(h.d + "T12:00:00").toLocaleString("en-US", { month: "short", day: "numeric" })}</span>
                          <span>{h.s.map((x) => x.weight ? `${x.weight}×${x.reps}` : `${x.mins}m`).join("  ·  ")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {todaySets.length > 0 && (
                    <div style={{ marginBottom: 9 }}>
                      {todaySets.map((s, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 11px", background: "#F4FAF2", borderRadius: 11, marginBottom: 5 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: FOREST, width: 40 }}>SET {i + 1}</span>
                          <span style={{ flex: 1, fontWeight: 800, fontSize: 14 }}>{s.weight ? `${s.weight} lb × ${s.reps}` : `${s.reps} reps`}</span>
                          <button onClick={() => { const idx = (log.workoutSets || []).lastIndexOf(s); setLog((l) => ({ ...l, workoutSets: l.workoutSets.filter((_, j) => j !== idx) })); }} style={{ border: "none", background: "none", color: "#B0685A", fontWeight: 800, cursor: "pointer", fontSize: 15 }}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, marginBottom: 9 }}>
                    <div><div className="rlabel" style={{ marginBottom: 4 }}>Weight</div><input className="rin" type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="lbs" /></div>
                    <div><div className="rlabel" style={{ marginBottom: 4 }}>Reps</div><input className="rin" type="number" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} placeholder="8" /></div>
                    <div style={{ alignSelf: "end" }}><button className="rbtn" onClick={logSet} disabled={!weight && !reps} style={{ padding: "13px 16px", width: "auto" }}>Log set</button></div>
                  </div>
                  <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
                    {todaySets.length > 0 && <button className="rpill" onClick={repeatLast}>Repeat set</button>}
                    {restEnd
                      ? <button className="rpill" onClick={() => setRestEnd(null)} style={{ background: FOREST, color: "#FFF" }}>Rest {Math.floor(restLeft / 60)}:{String(restLeft % 60).padStart(2, "0")} — skip</button>
                      : <span style={{ display: "flex", gap: 5, alignItems: "center" }}><span style={{ fontSize: 11, fontWeight: 800, color: MUT }}>REST</span>{[60, 90, 120, 180].map((s) => <button key={s} className={`rchip ${restLen === s ? "on" : ""}`} style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => setRestLen(s)}>{s}s</button>)}</span>}
                  </div>
                </div>
              );
            })()}
            {chosen && tree.mode === "min" && (
              <div style={{ marginBottom: 10 }}><div className="rlabel" style={{ marginBottom: 4 }}>Minutes</div><input className="rin" type="number" inputMode="numeric" value={mins} onChange={(e) => setMins(e.target.value)} placeholder="45" /></div>
            )}
            {chosen && tree.mode === "min" && <button className="rbtn" onClick={addEntry} style={{ padding: 12 }}>Add {chosen}</button>}
          </div>
        )}

        {/* logged entries */}
        {sets.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div className="rlabel" style={{ marginBottom: 8 }}>Today's session</div>
            {sets.map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#FBF9F2", borderRadius: 12, marginBottom: 6 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5 }}>{e.name}</div>
                  <div style={{ fontSize: 11.5, color: MUT, fontWeight: 700 }}>
                    {e.type === "strength" ? `${e.weight} lb · ${e.reps} reps × ${e.sets} sets` : `${e.min} min`}
                  </div>
                </div>
                <button className="rghost" onClick={() => removeEntry(i)}>Remove</button>
              </div>
            ))}
          </div>
        )}

        <button className="rbtn" style={{ marginTop: 16 }} onClick={onClose}>Save workout · +{ptsWorkout(log)} pts</button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================ */
/* ================================================================
   CASTLE WARS — v30
   ----------------------------------------------------------------
   Weekly siege riding the Mon–Sun battle window. Each completed day
   is a ROUND (best-of-7): the team with the higher round score
   (day points + card effects) knocks one of the rival's 4 towers
   down. First to 4 topples the castle and banks the BOUNTY —
   a % of the rival's weekly points ADDED to the winner. Nothing is
   ever subtracted from anyone's real logged points. Castles rebuild
   fresh every Monday.
   Cards drop from habit milestones (50% / 100% of daily goals),
   bank across the week, and swing daily rounds within a roster-
   aware cap so volume alone can't bury a smaller team.
   All knobs live in CW_CFG.
   ================================================================ */
const CW_CFG = {
  towerBounty: [0.02, 0.03, 0.04, 0.06],  // % of rival's weekly pts banked per tower (15% max, final tower pays most)
  towers: 4,              // rounds needed to topple
  capPerMember: 60,       // daily card-output cap = min(rosters) × this
  capFloor: 120,          // …but never below this
  capPctOfRound: 0.25,    // …and never below 25% of the smaller side's habit base,
                          //    so percentage-tier cards stay meaningful as rounds grow
  dragonBite: 60,         // dragon damage per day until shooed
  snailDelay: 3,          // War Snail lands this many days later
  rarityW: { common: 55, junk: 20, uncommon: 20, rare: 5 },
};

/* fx types: atk (+you) · hit (−them) · siphon (−them +you) · block ·
   blockall · buff (×2 your cards today) · threat (dragon) ·
   cleanse (block + shoo dragon) · steal · intel · delay · joke */
const CW_CARDS = [
  /* junk (10) — flat, tiny, funny */
  { id: "stale-bread", name: "Stale Bread", e: "🍞", r: "junk", fx: "atk", m: 3, fl: "It's not a weapon. It's barely food." },
  { id: "angry-chicken", name: "Angry Chicken", e: "🐔", r: "junk", fx: "hit", m: 5, fl: "It has chosen violence. It has chosen poorly." },
  { id: "overripe-tomato", name: "Overripe Tomato", e: "🍅", r: "junk", fx: "hit", m: 7, fl: "A statement, not a strategy." },
  { id: "bucket-of-mud", name: "Bucket of Mud", e: "🪣", r: "junk", fx: "hit", m: 8, fl: "Someone is going to have to clean that." },
  { id: "squeaky-catapult", name: "Squeaky Catapult", e: "🎯", r: "junk", fx: "hit", m: 10, fl: "The wheel has needed oil since the last siege." },
  { id: "motivational-goose", name: "Motivational Goose", e: "🪿", r: "junk", fx: "atk", m: 6, fl: "It honks. Morale is... affected." },
  { id: "off-key-trumpeter", name: "Off-Key Trumpeter", e: "🎺", r: "junk", fx: "joke", m: 0, fl: "The horn was in tune. The trumpeter was not." },
  { id: "confused-peasant", name: "Confused Peasant", e: "🧑‍🌾", r: "junk", fx: "joke", m: 0, fl: "He was looking for the market." },
  { id: "decorative-banner", name: "Decorative Banner", e: "🎏", r: "junk", fx: "joke", m: 0, fl: "Purely ceremonial. Extremely handsome." },
  { id: "sleepy-sentry", name: "Sleepy Sentry", e: "😴", r: "junk", fx: "joke", m: 0, fl: "Post held. Eyes closed." },
  /* common (20) — flat */
  { id: "pebble-sling", name: "Pebble Sling", e: "🪨", r: "common", fx: "atk", m: 30, fl: "Small, fast, and free." },
  { id: "slingstone", name: "Slingstone", e: "🥌", r: "common", fx: "atk", m: 40, fl: "Old weapon. Still works." },
  { id: "archery-volley", name: "Archery Volley", e: "🏹", r: "common", fx: "atk", m: 50, fl: "Loose!" },
  { id: "war-drums", name: "War Drums", e: "🥁", r: "common", fx: "atk", m: 60, fl: "The rhythm carries the line forward." },
  { id: "longbow-rain", name: "Longbow Rain", e: "🌧️", r: "common", fx: "atk", m: 70, fl: "The sky darkens on purpose." },
  { id: "javelin-volley", name: "Javelin Volley", e: "🗡️", r: "common", fx: "atk", m: 80, fl: "Thrown with feeling." },
  { id: "torch-toss", name: "Torch Toss", e: "🔥", r: "common", fx: "hit", m: 50, fl: "Fire finds the timber." },
  { id: "ember-arrows", name: "Ember Arrows", e: "🎇", r: "common", fx: "hit", m: 55, fl: "Each one carries a small argument." },
  { id: "battering-ram", name: "Battering Ram", e: "🐏", r: "common", fx: "hit", m: 65, fl: "Patience, applied violently." },
  { id: "boulder-drop", name: "Boulder Drop", e: "🗿", r: "common", fx: "hit", m: 75, fl: "Gravity is undefeated." },
  { id: "caltrops", name: "Caltrops", e: "✴️", r: "common", fx: "hit", m: 45, fl: "The ground is now a problem." },
  { id: "wicker-shield", name: "Wicker Shield", e: "🧺", r: "common", fx: "block", m: 0, fl: "It's what we had." },
  { id: "oak-shield", name: "Oak Shield", e: "🛡️", r: "common", fx: "block", m: 0, fl: "Older than the argument." },
  { id: "palisade", name: "Palisade", e: "🪵", r: "common", fx: "block", m: 0, fl: "Wood, sharpened, arranged with intent." },
  { id: "shield-wall", name: "Shield Wall", e: "⛨", r: "common", fx: "block", m: 0, fl: "Together, or not at all." },
  { id: "mend-the-wall", name: "Mend the Wall", e: "🧱", r: "common", fx: "cleanse", m: 0, fl: "Fast hands, wet mortar." },
  { id: "bucket-brigade", name: "Bucket Brigade", e: "💧", r: "common", fx: "cleanse", m: 0, fl: "A line of people beats a fire." },
  { id: "falcon-scout", name: "Falcon Scout", e: "🦅", r: "common", fx: "intel", m: 0, fl: "It sees everything and tells one person." },
  { id: "signal-fire", name: "Signal Fire", e: "🔥", r: "common", fx: "chain", m: 15, fl: "One flame answers another." },
  { id: "rally-cry", name: "Rally Cry", e: "📣", r: "common", fx: "chain", m: 20, fl: "Voices carry further than arrows." },
  /* uncommon (18) — percentage-based */
  { id: "siege-ballista", name: "Siege Ballista", e: "🏹", r: "uncommon", fx: "atk", m: 8, pct: 1, fl: "Precision at scale." },
  { id: "fire-arrows", name: "Fire Arrows", e: "🔥", r: "uncommon", fx: "atk", m: 7, pct: 1, fl: "Aim for the roofs." },
  { id: "banner-of-courage", name: "Banner of Courage", e: "🚩", r: "uncommon", fx: "atk", m: 6, pct: 1, fl: "The colours do half the work." },
  { id: "trebuchet", name: "Trebuchet", e: "🎯", r: "uncommon", fx: "hit", m: 9, pct: 1, fl: "Physics, in a bad mood." },
  { id: "sappers-tunnel", name: "Sapper's Tunnel", e: "⛏️", r: "uncommon", fx: "hit", m: 8, pct: 1, fl: "The wall falls from underneath." },
  { id: "night-raid", name: "Night Raid", e: "🌙", r: "uncommon", fx: "siphon", m: 6, pct: 1, fl: "Quiet boots, full sacks." },
  { id: "fox-thief", name: "Fox Thief", e: "🦊", r: "uncommon", fx: "siphon", m: 7, pct: 1, fl: "Theirs, briefly. Yours, now." },
  { id: "pickpocket", name: "Pickpocket", e: "🫳", r: "uncommon", fx: "steal", m: 1, fl: "You had it a moment ago." },
  { id: "oil-pot", name: "Oil Pot", e: "🏺", r: "uncommon", fx: "hit", m: 7, pct: 1, fl: "Slick, then bright." },
  { id: "iron-portcullis", name: "Iron Portcullis", e: "⚙️", r: "uncommon", fx: "block", m: 0, bn: 2, fl: "Two answers to two questions." },
  { id: "stone-mason", name: "Stone Mason", e: "🪨", r: "uncommon", fx: "cleanse", m: 0, fl: "He was going to fix it anyway." },
  { id: "mirror-shield", name: "Mirror Shield", e: "🪞", r: "uncommon", fx: "reflect", m: 0, bn: 1, fl: "Your idea, returned." },
  { id: "war-snail", name: "War Snail", e: "🐌", r: "uncommon", fx: "delay", m: 10, pct: 1, fl: "It is coming. Slowly. Inevitably." },
  { id: "echo-horn", name: "Echo Horn", e: "📯", r: "uncommon", fx: "atk", m: 5, pct: 1, fx2: "echo", fl: "The sound comes back tomorrow." },
  { id: "rally-horn", name: "Rally Horn", e: "📯", r: "uncommon", fx: "buff", m: 0, fl: "Everything, louder." },
  { id: "chain-shot", name: "Chain Shot", e: "⛓️", r: "uncommon", fx: "hit", m: 6, pct: 1, fx2: "shatter", fl: "Two balls, one chain, no shields." },
  { id: "grease-the-steps", name: "Grease the Steps", e: "🫙", r: "uncommon", fx: "lock", m: 0, fl: "Their next move slips." },
  { id: "double-or-nothing", name: "Double or Nothing", e: "🪙", r: "uncommon", fx: "gamble", m: 12, pct: 1, fl: "The coin decides. It usually lies." },
  /* rare (12) — percentage-based, heavier */
  { id: "royal-champion", name: "Royal Champion", e: "👑", r: "rare", fx: "atk", m: 15, pct: 1, fl: "One name the other side already knows." },
  { id: "siege-tower", name: "Siege Tower", e: "🗼", r: "rare", fx: "hit", m: 14, pct: 1, fl: "It arrives, and then it is on the wall." },
  { id: "dragon-perch", name: "Dragon Perch", e: "🐉", r: "rare", fx: "threat", m: 8, pct: 1, fl: "It has decided your tower is comfortable." },
  { id: "tempest", name: "Tempest", e: "⛈️", r: "rare", fx: "blockall", m: 0, fl: "Nothing flies today." },
  { id: "greek-fire", name: "Greek Fire", e: "🔥", r: "rare", fx: "hit", m: 16, pct: 1, fl: "Water makes it worse." },
  { id: "the-turncoat", name: "The Turncoat", e: "🗝️", r: "rare", fx: "siphon", m: 12, pct: 1, fl: "He knew where the gate hinges were." },
  { id: "mirror-of-kings", name: "Mirror of Kings", e: "🪞", r: "rare", fx: "reflect", m: 0, bn: 2, fl: "Twice returned, twice as rude." },
  { id: "sappers-chorus", name: "Sappers' Chorus", e: "⛏️", r: "rare", fx: "hit", m: 12, pct: 1, fx2: "echo", fl: "Tomorrow it happens again." },
  { id: "iron-vanguard", name: "Iron Vanguard", e: "🛡️", r: "rare", fx: "block", m: 0, bn: 3, fl: "Three walls where one stood." },
  { id: "the-long-winter", name: "The Long Winter", e: "❄️", r: "rare", fx: "hit", m: 10, pct: 1, fx2: "linger", fl: "Nobody fights well cold." },
  { id: "thief-of-hours", name: "Thief of Hours", e: "🕰️", r: "rare", fx: "steal", m: 2, fl: "Gone before the guard turned." },
  { id: "wardens-gambit", name: "Warden's Gambit", e: "🎲", r: "rare", fx: "gamble", m: 25, pct: 1, gl: 10, fl: "Bold. Possibly stupid." },
  /* legendary (4) */
  { id: "the-sleeping-giant", name: "The Sleeping Giant", e: "⛰️", r: "legendary", fx: "atk", m: 30, pct: 1, fl: "It was a hill. It is standing up." },
  { id: "eclipse", name: "Eclipse", e: "🌑", r: "legendary", fx: "blockall", m: 0, fx2: "hit", m2: 15, fl: "The day simply stops." },
  { id: "the-kingmaker", name: "The Kingmaker", e: "👑", r: "legendary", fx: "siphon", m: 20, pct: 1, fl: "Loyalty was always negotiable." },
  { id: "phoenix-banner", name: "Phoenix Banner", e: "🐦‍🔥", r: "legendary", fx: "cleanse", m: 0, bn: 99, fx2: "atk", m2: 20, fl: "Burn it down. Raise it again." },
];
const CW_BY_ID = Object.fromEntries(CW_CARDS.map((c) => [c.id, c]));
/* legacy bank/played entries from the 40-card deck resolve to their v2 successors */
const CW_OLD = { javelin: "javelin-volley", archery: "archery-volley", pebble: "pebble-sling", sling: "slingstone", drums: "war-drums", longbow: "longbow-rain", ram: "battering-ram", torch: "torch-toss", ember: "ember-arrows", boulder: "boulder-drop", oakshield: "oak-shield", wicker: "wicker-shield", shieldwall: "shield-wall", mend: "mend-the-wall", falcon: "falcon-scout", chicken: "angry-chicken", bread: "stale-bread", snail: "war-snail", trumpet: "off-key-trumpeter", peasant: "confused-peasant", mud: "bucket-of-mud", goose: "motivational-goose", squeak: "squeaky-catapult", banner: "decorative-banner", tomato: "overripe-tomato", ballista: "siege-ballista", firearrow: "fire-arrows", courage: "banner-of-courage", sapper: "sappers-tunnel", fox: "fox-thief", nightraid: "night-raid", horn: "rally-horn", mason: "stone-mason", dragon: "dragon-perch", champion: "royal-champion", siegetower: "siege-tower" };
const cwCardOf = (id) => CW_BY_ID[id] || CW_BY_ID[CW_OLD[id]] || null;
const CW_RARITY = {
  common: { name: "Common", frame: "#D8CDB6", bg: "#F6F0E2", ink: "#6A6250", glow: "none" },
  junk: { name: "Curio", frame: "#C9BFA9", bg: "#F1EBDC", ink: "#8A8272", glow: "none" },
  uncommon: { name: "Uncommon", frame: "#2A5445", bg: "#EAF1EA", ink: "#2A5445", glow: "0 0 0 1.5px #2A544522" },
  rare: { name: "Rare", frame: "#D9A13F", bg: "#FBF3DF", ink: "#8A6A1E", glow: "0 4px 18px rgba(217,161,63,.35)" },
  legendary: { name: "Legendary", frame: "#7C4FC9", bg: "#F3EDFB", ink: "#5A3596", glow: "0 4px 22px rgba(124,79,201,.4)" },
};
const CW_ROLL_TABLES = [
  { min: 1.5, w: { junk: 0, common: 25, uncommon: 45, rare: 25, legendary: 5 } },
  { min: 1.0, w: { junk: 10, common: 40, uncommon: 35, rare: 13, legendary: 2 } },
  { min: 0,   w: { junk: 30, common: 50, uncommon: 18, rare: 2, legendary: 0 } },
];
const cwRoll = (quality = 0.5) => {
  const w = (CW_ROLL_TABLES.find((t) => quality >= t.min) || CW_ROLL_TABLES[2]).w;
  const keys = Object.keys(w); const tot = keys.reduce((s, k) => s + w[k], 0);
  let x = Math.random() * tot, r = "common";
  for (const k of keys) { if (x < w[k]) { r = k; break; } x -= w[k]; }
  const pool = CW_CARDS.filter((c) => c.r === r);
  return pool[Math.floor(Math.random() * pool.length)];
};
/* Monday-locked siege bracket: adjacent pairing on LAST week's final
   standings, deterministic on every device (pts desc, code alpha tiebreak).
   Odd team out gets a bye. One locked rival covers battle + siege. */
function cwBracket(codesWithPts) {
  const order = [...codesWithPts].sort((a, b) => b.pts - a.pts || (a.code < b.code ? -1 : 1));
  const pairs = {};
  for (let i = 0; i + 1 < order.length; i += 2) { pairs[order[i].code] = order[i + 1].code; pairs[order[i + 1].code] = order[i].code; }
  return pairs;
}
/* ---- Team modes ---- */
const MODE_OF = (t) => (t && t.mode) || "battle";
const MODES = [
  { id: "battle", name: "Team battle", desc: "Weekly rival, castle siege, cards — the full war." },
  { id: "party", name: "Solo team", desc: "Friendly leaderboard with playful card jostling. No castles." },
];
/* Party mode: cards nudge a display-only "party score" per member.
   Real logged points are never touched; net swing per member is
   clamped to a roster-aware weekly cap. Deterministic by timestamp. */
const CW_PARTY_FX = ["atk", "hit", "siphon", "block", "joke"];
function partyResolve(state, memberIds, cap) {
  const swing = {}, shields = {};
  memberIds.forEach((id) => { swing[id] = 0; shields[id] = 0; });
  const plays = [...(state?.played || [])].sort((a, b) => a.ts - b.ts);
  const events = [];
  for (const p of plays) {
    const c = cwCardOf(p.cardId);
    if (!c || !CW_PARTY_FX.includes(c.fx)) continue;
    if (c.fx === "block") { if (shields[p.pid] !== undefined) shields[p.pid]++; events.push({ ...p, kind: "block" }); continue; }
    if (c.fx === "atk") { if (swing[p.pid] !== undefined) swing[p.pid] += c.m; events.push({ ...p, kind: "atk" }); continue; }
    if (c.fx === "joke") { events.push({ ...p, kind: "joke" }); continue; }
    const t = p.target;
    if (swing[t] === undefined) continue;
    if (shields[t] > 0) { shields[t]--; events.push({ ...p, kind: "blocked" }); continue; }
    if (c.fx === "hit") swing[t] -= c.m;
    if (c.fx === "siphon") { swing[t] -= c.m; if (swing[p.pid] !== undefined) swing[p.pid] += c.m; }
    events.push({ ...p, kind: c.fx });
  }
  for (const id of memberIds) swing[id] = Math.max(-cap, Math.min(cap, swing[id]));
  return { swing, events };
}
const CWK = (code, wk) => `rt1:cw:${code}:${wk}`;
const cwBlank = () => ({ bank: [], played: [], drawn: {}, intel: {} });
/* milestone goals for card draws — mirrors the celebration goals */
const CW_GOALS = { steps: 10000, water: 3000, sleep: 8, meditation: 10, reading: 10, focus: 50, calories: 1000, workout: 60 };
const cwPct = (l = {}, id) => {
  if (id === "workout") return (Number(l.workoutMin) || 0) / 60;
  if (id === "journal" || id === "fasting") return l[id] ? 1 : 0;
  return (Number(l[id]) || 0) / CW_GOALS[id];
};
const CW_MILE_CATS = [...Object.keys(CW_GOALS), "journal", "fasting"];
/* which milestones did this save newly cross? */
const cwCrossings = (prev = {}, next = {}) => {
  const out = [];
  for (const id of CW_MILE_CATS) {
    const a = cwPct(prev, id), b = cwPct(next, id);
    for (const thr of (id === "journal" || id === "fasting" ? [1] : [0.5, 1])) {
      if (b >= thr && a < thr) out.push({ cat: id, thr });
    }
  }
  return out;
};
const cwCap = (nA, nB) => Math.max(CW_CFG.capFloor, Math.min(nA || 1, nB || 1) * CW_CFG.capPerMember);
const cwDayIdx = (keys, day) => keys.indexOf(day);

/* ---- deterministic round resolution for one day ----
   Inputs are both teams' full week cw states + base day points.
   Order of operations is fixed by card timestamps, so every device
   computes identical results from the same shared data. */
function cwResolveDay(dayKey, keys, mine, foe, myCode, foeCode, myBase, foeBase, capMin) {
  /* effective cap scales with the day's habit output — a flat 120 made every
     card past the first two invisible once rounds reached the thousands */
  const cap = Math.max(capMin || CW_CFG.capFloor, Math.round(Math.min(myBase || 0, foeBase || 0) * CW_CFG.capPctOfRound));
  const dIdx = cwDayIdx(keys, dayKey);
  const playedOn = (st, code, tgt) => (st?.played || []).filter((p) => p.day === dayKey && (!p.target || p.target === tgt)).sort((a, b) => a.ts - b.ts);
  const mineP = playedOn(mine, myCode, foeCode), foeP = playedOn(foe, foeCode, myCode);
  /* magnitude of a play: play-time override (gambles/chains) beats card default;
     pct cards scale off the OPPOSING side's habit base — stable, feedback-free */
  const magOf = (p, c, oppBase) => { const raw = p.mv != null ? p.mv : c.m; return c.pct ? Math.round((raw / 100) * Math.max(0, oppBase)) : raw; };
  const mag2Of = (c, oppBase) => c.m2 ? Math.round((c.m2 / 100) * Math.max(0, oppBase)) : 0;
  const dragonBite = (attacker, defender, defBase) => {
    let bite = 0;
    for (const p of (attacker?.played || [])) {
      const dc = cwCardOf(p.cardId); if (dc?.fx !== "threat") continue;
      const plant = cwDayIdx(keys, p.day);
      if (plant < 0 || plant > dIdx) continue;
      const shoo = (defender?.played || []).filter((q) => cwDayIdx(keys, q.day) >= plant && q.ts > p.ts).sort((a, b) => a.ts - b.ts)[0];
      const shooIdx = shoo ? cwDayIdx(keys, shoo.day) : 99;
      if (dIdx >= plant && dIdx < shooIdx) bite += dc.pct ? Math.round((dc.m / 100) * Math.max(0, defBase)) : dc.m;
    }
    return bite;
  };
  const consumed = (attacker, defender) => {
    const ids = new Set();
    for (const p of (attacker?.played || [])) {
      if (cwCardOf(p.cardId)?.fx !== "threat") continue;
      const plant = cwDayIdx(keys, p.day);
      if (plant < 0) continue;
      const shoo = (defender?.played || []).filter((q) => cwDayIdx(keys, q.day) >= plant && q.ts > p.ts).sort((a, b) => a.ts - b.ts)[0];
      if (shoo) ids.add(shoo.id);
    }
    return ids;
  };
  const mineConsumed = consumed(foe, mine), foeConsumed = consumed(mine, foe);
  /* pass 1: what lands. Locks void the attacker's next card; shatter wipes
     blocks; reflectors bounce attacks back at their sender. */
  const landPass = (atkCards, atkConsumed, defCards, defConsumed) => {
    const tempest = defCards.some((p) => !defConsumed.has(p.id) && cwCardOf(p.cardId)?.fx === "blockall");
    const shattered = atkCards.some((p) => !atkConsumed.has(p.id) && (cwCardOf(p.cardId)?.fx === "shatter" || cwCardOf(p.cardId)?.fx2 === "shatter"));
    const blockers = shattered ? [] : defCards.filter((p) => !defConsumed.has(p.id) && ["block", "cleanse"].includes(cwCardOf(p.cardId)?.fx)).flatMap((p) => Array(cwCardOf(p.cardId)?.bn || 1).fill(cwCardOf(p.cardId).name));
    const reflectors = defCards.filter((p) => !defConsumed.has(p.id) && cwCardOf(p.cardId)?.fx === "reflect").flatMap((p) => Array(cwCardOf(p.cardId)?.bn || 1).fill(cwCardOf(p.cardId).name));
    /* locks: each defender lock voids the attacker's first later card */
    const locked = new Set();
    for (const lk of defCards.filter((p) => !defConsumed.has(p.id) && cwCardOf(p.cardId)?.fx === "lock")) {
      const victim = atkCards.find((p) => p.ts > lk.ts && !locked.has(p.id) && !atkConsumed.has(p.id) && cwCardOf(p.cardId)?.fx !== "joke");
      if (victim) locked.add(victim.id);
    }
    const events = []; let reflectDmg = 0;
    for (const p of atkCards) {
      const c = cwCardOf(p.cardId); if (!c || !["atk", "hit", "siphon", "gamble", "chain"].includes(c.fx)) continue;
      if (atkConsumed.has(p.id)) { events.push({ ...p, gone: "shoo" }); continue; }
      if (locked.has(p.id)) { events.push({ ...p, gone: "lock" }); continue; }
      if (tempest) { events.push({ ...p, gone: "storm" }); continue; }
      if (reflectors.length > 0) { const by = reflectors.shift(); events.push({ ...p, gone: "reflect", by }); reflectDmg += magOf(p, c, 0) || (c.pct ? 0 : c.m); continue; }
      if (blockers.length > 0) { const by = blockers.shift(); events.push({ ...p, gone: "block", by }); continue; }
      events.push(p);
    }
    return { events, reflectDmg };
  };
  const mineLand = landPass(mineP, mineConsumed, foeP, foeConsumed);
  const foeLand = landPass(foeP, foeConsumed, mineP, mineConsumed);
  const mineLanded = mineLand.events, foeLanded = foeLand.events;
  const hornOf = (cards, cons) => cards.some((p) => !cons.has(p.id) && cwCardOf(p.cardId)?.fx === "buff") ? 2 : 1;
  const myHorn = hornOf(mineP, mineConsumed), foeHorn = hornOf(foeP, foeConsumed);
  /* pass 2: sum landed effects (pct scaled off opposing base) */
  const sumFx = (events, horn, which, oppBase) => events.reduce((s, p) => {
    if (p.gone) return s;
    const c = cwCardOf(p.cardId);
    if (which === "add") return s + ((c.fx === "atk" || c.fx === "siphon" || c.fx === "gamble" || c.fx === "chain") ? magOf(p, c, oppBase) * horn : 0);
    return s + ((c.fx === "hit" || c.fx === "siphon") ? magOf(p, c, oppBase) * horn : 0);
  }, 0);
  /* reflected attacks strike their sender at flat value */
  const myReflected = mineLand.reflectDmg;  /* my attacks, bounced back onto me */
  const foeReflected = foeLand.reflectDmg;
  /* secondary effects on defensive cards: eclipse's hit, phoenix's surge */
  const secFx = (cards, cons, oppBase) => cards.reduce((acc, p) => {
    const c = cwCardOf(p.cardId); if (!c || !c.fx2 || cons.has(p.id)) return acc;
    if (c.fx2 === "hit" && c.m2) acc.cut += mag2Of(c, oppBase);
    if (c.fx2 === "atk" && c.m2) acc.add += mag2Of(c, oppBase);
    return acc;
  }, { add: 0, cut: 0 });
  const mySec = secFx(mineP, mineConsumed, foeBase), foeSec = secFx(foeP, foeConsumed, myBase);
  /* echoes and lingering effects from YESTERDAY's plays */
  const carryOf = (st, cons, oppBase, kind) => (st?.played || []).reduce((s, p) => {
    if (cons.has(p.id)) return s;
    const c = cwCardOf(p.cardId); if (!c) return s;
    const pIdx = cwDayIdx(keys, p.day);
    if (c.fx2 === "echo" && pIdx === dIdx - 1) { const v = c.pct ? Math.round((c.m / 200) * Math.max(0, oppBase)) : Math.round(c.m / 2); return s + (kind === c.fx ? v : 0); }
    if (c.fx2 === "linger" && pIdx === dIdx - 1) { const v = c.pct ? Math.round((c.m / 100) * Math.max(0, oppBase)) : c.m; return s + (kind === c.fx ? v : 0); }
    if (c.fx === "delay" && pIdx === dIdx - CW_CFG.snailDelay) { const v = c.pct ? Math.round((c.m / 100) * Math.max(0, oppBase)) : c.m; return s + (kind === "atk" ? v : 0); }
    return s;
  }, 0);
  const myAdd = sumFx(mineLanded, myHorn, "add", foeBase) + carryOf(mine, mineConsumed, foeBase, "atk") + mySec.add;
  const myCutOnFoe = sumFx(mineLanded, myHorn, "cut", foeBase) + carryOf(mine, mineConsumed, foeBase, "hit") + mySec.cut;
  const foeAdd = sumFx(foeLanded, foeHorn, "add", myBase) + carryOf(foe, foeConsumed, myBase, "atk") + foeSec.add;
  const foeCutOnMe = sumFx(foeLanded, foeHorn, "cut", myBase) + carryOf(foe, foeConsumed, myBase, "hit") + foeSec.cut;
  const clamp = (v) => Math.max(-cap, Math.min(cap, v));
  const myDelta = clamp(myAdd - foeCutOnMe - myReflected - dragonBite(foe, mine, myBase));
  const foeDelta = clamp(foeAdd - myCutOnFoe - foeReflected - dragonBite(mine, foe, foeBase));
  return { my: Math.max(0, myBase + myDelta), foe: Math.max(0, foeBase + foeDelta), myDelta, foeDelta, cap, myCapped: Math.abs(myAdd - foeCutOnMe - myReflected) > cap, foeCapped: Math.abs(foeAdd - myCutOnFoe - foeReflected) > cap, myEvents: foeLanded, foeEvents: mineLanded };
}

/* full-week siege state: resolved rounds, towers, clinch */
function cwWeekState(keys, mine, foe, myCode, foeCode, dayBaseOf, cap, minDay) {
  const tk = today();
  const rounds = [];
  let myWins = 0, foeWins = 0, clinch = null;
  for (const k of keys) {
    if (minDay && k < minDay) { rounds.push({ day: k, state: "quiet" }); continue; } /* neither side can win a day before both teams existed */
    if (k >= tk) { rounds.push({ day: k, state: k === tk ? "live" : "future" }); continue; }
    if (clinch) { rounds.push({ day: k, state: "over" }); continue; }
    const mb = dayBaseOf(myCode, k), fb = dayBaseOf(foeCode, k);
    const r = cwResolveDay(k, keys, mine, foe, myCode, foeCode, mb, fb, cap);
    if (r.my === 0 && r.foe === 0) { rounds.push({ day: k, state: "quiet" }); continue; }
    const win = r.my > r.foe ? "my" : r.foe > r.my ? "foe" : "tie";
    if (win === "my") myWins++; if (win === "foe") foeWins++;
    rounds.push({ day: k, state: win, my: r.my, foe: r.foe });
    if (myWins >= CW_CFG.towers) clinch = { by: "my", day: k };
    else if (foeWins >= CW_CFG.towers) clinch = { by: "foe", day: k };
  }
  return { rounds, myWins: Math.min(myWins, CW_CFG.towers), foeWins: Math.min(foeWins, CW_CFG.towers), clinch };
}

/* dragon currently perched on `code`'s castle? (for UI) */
function cwDragonOn(keys, attacker, defender) {
  const tk = today();
  for (const p of (attacker?.played || [])) {
    if (cwCardOf(p.cardId)?.fx !== "threat") continue;
    const shoo = (defender?.played || []).filter((q) => q.ts > p.ts && cwDayIdx(keys, q.day) >= cwDayIdx(keys, p.day)).sort((a, b) => a.ts - b.ts)[0];
    if (!shoo && p.day <= tk) return true;
  }
  return false;
}

/* ---- Card face: painted-parchment placeholder art (Ram swaps in real art later) ---- */
function CWCardFace({ card, size = 96, lift = false }) {
  const R = CW_RARITY[card.r];
  const w = size, h = Math.round(size * 1.38);
  return (
    <div style={{ width: w, height: h, borderRadius: Math.round(size * .13), background: R.bg, border: `2px solid ${R.frame}`, boxShadow: R.glow === "none" ? "0 3px 10px rgba(90,74,48,.14)" : R.glow, position: "relative", overflow: "hidden", flexShrink: 0, transform: lift ? "translateY(-3px)" : "none", transition: "transform .15s ease" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 90% at 50% 0%, #FFFFFF66 0%, transparent 55%), radial-gradient(140% 70% at 50% 115%, ${R.frame}33 0%, transparent 60%)` }} />
      <div style={{ position: "absolute", top: Math.round(size * .055), left: 0, right: 0, textAlign: "center", fontSize: Math.max(8, size * .085), fontWeight: 800, letterSpacing: ".08em", color: R.ink, textTransform: "uppercase" }}>{R.name}</div>
      <div style={{ position: "absolute", top: "16%", left: "10%", right: "10%", height: "44%", borderRadius: Math.round(size * .09), background: "#FFFDF8", border: `1.5px solid ${R.frame}88`, overflow: "hidden", display: "grid", placeItems: "center" }}>
        <img src={`./cards/card-${card.id}.webp`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated" }} draggable={false}
          onError={(e) => { e.target.style.display = "none"; e.target.parentElement.innerHTML = `<span style="font-size:${size * .26}px;font-weight:800;color:${R.frame};font-family:Georgia,serif">${card.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>`; }} />
      </div>
      <div style={{ position: "absolute", top: "63%", left: 4, right: 4, textAlign: "center", fontWeight: 800, fontSize: Math.max(8.5, size * .1), color: "#3A4034", lineHeight: 1.12, padding: "0 2px" }}>{card.name}</div>
      <div style={{ position: "absolute", bottom: Math.round(size * .06), left: 4, right: 4, textAlign: "center", fontSize: Math.max(7.5, size * .082), fontWeight: 700, color: R.ink }}>
        {(() => { const u = card.pct ? "%" : ""; const base = card.fx === "atk" ? `+${card.m}${u} round` : card.fx === "hit" ? `−${card.m}${u} to them` : card.fx === "siphon" ? `steal ${card.m}${u}` : card.fx === "block" ? (card.bn > 1 ? `blocks ${card.bn} cards` : "blocks a card") : card.fx === "blockall" ? "blocks all today" : card.fx === "buff" ? "cards ×2 today" : card.fx === "threat" ? `−${card.m}${u}/day` : card.fx === "cleanse" ? (card.bn > 9 ? "cleanses everything" : "block + shoo") : card.fx === "steal" ? (card.m > 1 ? `steal ${card.m} cards` : "steal a card") : card.fx === "intel" ? "reveal bank" : card.fx === "delay" ? `+${card.m}${u} in ${CW_CFG.snailDelay}d` : card.fx === "reflect" ? (card.bn > 1 ? `bounces ${card.bn} attacks` : "bounces an attack") : card.fx === "lock" ? "voids their next card" : card.fx === "gamble" ? `${card.m * 2}${u} or ${card.gl ? `−${card.gl}${u}` : "nothing"}` : card.fx === "chain" ? `+${card.m} per logger` : "…vibes"; const extra = card.fx2 === "echo" ? " · echoes" : card.fx2 === "linger" ? " · 2 days" : card.fx2 === "shatter" ? " · breaks shields" : card.fx2 === "hit" ? ` · −${card.m2}%` : card.fx2 === "atk" ? ` · +${card.m2}%` : ""; return base + extra; })()}
      </div>
    </div>
  );
}

/* ---- Castle: 4 towers over a wall; fallen towers crumble ---- */
function CWCastle({ standing = 4, color = "#2A5445", size = 118, shaking = false, dragon = false, flip = false }) {
  const t = CW_CFG.towers;
  return (
    <svg width={size} height={size * .78} viewBox="0 0 120 94" className={shaking ? "cwshake" : ""} style={{ transform: flip ? "scaleX(-1)" : "none", overflow: "visible" }}>
      <ellipse cx="60" cy="88" rx="52" ry="5" fill="#26522218" />
      <rect x="14" y="58" width="92" height="28" rx="3" fill={color} opacity=".92" />
      {[0, 1, 2].map((i) => <rect key={i} x={26 + i * 30} y={66} width="10" height="12" rx="2" fill="#FFFDF8" opacity=".28" />)}
      {[20 + 0 * 24, 20 + 1 * 24, 20 + 2 * 24, 20 + 3 * 24].map((x, i) => {
        const up = i < standing;
        return up ? (
          <g key={i}>
            <rect x={x - 7} y={24} width={16} height={38} rx={2.5} fill={color} />
            {[-6, -1, 4].map((o) => <rect key={o} x={x + o} y={19} width={4.5} height={7} rx={1} fill={color} />)}
            <rect x={x - 3} y={36} width={7} height={9} rx={2} fill="#FFFDF8" opacity=".3" />
            <path d={`M${x + 1} 19 l0 -8 l9 2.6 l-9 3.2 Z`} fill="#E8863A" />
          </g>
        ) : (
          <g key={i} opacity=".8">
            <rect x={x - 8} y={52} width={18} height={10} rx={2} fill={color} opacity=".55" />
            <circle cx={x - 4} cy={50} r={3.4} fill={color} opacity=".5" />
            <circle cx={x + 5} cy={51.5} r={2.6} fill={color} opacity=".45" />
            <circle cx={x + 1} cy={46.5} r={2.2} fill={color} opacity=".35" />
          </g>
        );
      })}
      {dragon && <g transform="translate(60,8)"><path d="M-14 2 Q-18 -8 -8 -9 Q-10 -3 -4 0 Z" fill="#8A4A3A"/><path d="M14 2 Q18 -8 8 -9 Q10 -3 4 0 Z" fill="#8A4A3A"/><ellipse cx="0" cy="3" rx="10" ry="5" fill="#8A4A3A"/><circle cx="9" cy="-1" r="4" fill="#8A4A3A"/><circle cx="10.5" cy="-2" r="1" fill="#F6DA9E"/></g>}
    </svg>
  );
}

/* ---- castle theme: castles wear the team's crest colors ----
   Custom crests map to the nearest theme family; seeded crests use the
   exact crest hash. If both sides share a theme, the rival fights in
   "away colors" (next theme in the wheel) so the battlefield stays legible. */
const cwHex2rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function cwThemeOf(team) {
  if (!team) return CREST_THEMES[0];
  if (team.color && team.icon) {
    const [r, g, b] = cwHex2rgb(team.color);
    let best = CREST_THEMES[0], bd = 1e9;
    for (const t of CREST_THEMES) {
      const [r2, g2, b2] = cwHex2rgb(t.bg);
      const d = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2;
      if (d < bd) { bd = d; best = t; }
    }
    return best;
  }
  const h = [...String(team.name || "")].reduce((a, c) => a + c.charCodeAt(0), 0);
  return CREST_THEMES[h % CREST_THEMES.length];
}
const cwAwayTheme = (t) => CREST_THEMES[(CREST_THEMES.indexOf(t) + 1) % CREST_THEMES.length];

/* ---- painted castle: procedural gouache set, keyed by towers standing ---- */
function CWCastleArt({ standing = 4, color = "green", size = 150, shaking = false, dragon = false, flip = false }) {
  const n = Math.max(0, Math.min(4, standing));
  return (
    <div className={shaking ? "cwshake" : ""} style={{ position: "relative", width: "100%", maxWidth: size, aspectRatio: "1000 / 703", margin: "0 auto", transform: flip ? "scaleX(-1)" : "none" }}>
      <img src={`cw-castle-${color}-${n}.jpg`} alt=""
        style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }} draggable={false} />
      {dragon && (
        <svg width={Math.round(size * .3)} height={Math.round(size * .18)} viewBox="0 0 44 26" style={{ position: "absolute", top: "-4%", left: "50%", transform: `translateX(-50%)${flip ? " scaleX(-1)" : ""}` }}>
          <path d="M8 16 Q2 4 14 3 Q11 10 18 13 Z" fill="#8A4A3A"/>
          <path d="M36 16 Q42 4 30 3 Q33 10 26 13 Z" fill="#8A4A3A"/>
          <ellipse cx="22" cy="17" rx="11" ry="5.5" fill="#8A4A3A"/>
          <circle cx="32" cy="13" r="4.2" fill="#8A4A3A"/>
          <circle cx="33.6" cy="12" r="1.1" fill="#F6DA9E"/>
        </svg>
      )}
    </div>
  );
}

/* ---- flying-card attack FX across the battle panel ---- */
function CWFly({ fx, onDone }) {
  useEffect(() => { const id = setTimeout(onDone, 950); return () => clearTimeout(id); }, [onDone]);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5, overflow: "hidden" }}>
      <div className="cwfly" style={{ position: "absolute", top: "38%", left: 0, width: 22, height: 30, borderRadius: 5, background: "linear-gradient(160deg,#FBF3DF,#F1E4C4)", border: "2px solid #D9A13F", boxShadow: "0 3px 8px rgba(40,30,10,.3)" }} />
      {fx.boom && <div className="cwboom" style={{ position: "absolute", top: "28%", right: "7%", width: 40, height: 40, borderRadius: 99, background: "radial-gradient(circle, #F6DA9E 0%, #E8863A 45%, transparent 70%)" }} />}
    </div>
  );
}

/* ---- drawn-card toast: cards flip in after a save ---- */
function CWDrawToast({ cards, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, display: "grid", placeItems: "center" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(30,34,26,.5)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "relative", textAlign: "center", padding: 20 }} onClick={(e) => e.stopPropagation()}>
        <div className="rh" style={{ fontSize: 24, color: "#FFF", textShadow: "0 2px 12px rgba(15,20,14,.6)", marginBottom: 4 }}>{cards.length === 1 ? "Card earned!" : `${cards.length} cards earned!`}</div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,.85)", marginBottom: 16 }}>Milestones hit — ammunition for the siege</div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {cards.map((c, i) => (
            <div key={i} className="cwdeal" style={{ animationDelay: `${i * .16}s` }}>
              <CWCardFace card={c} size={104} />
            </div>
          ))}
        </div>
        <button className="rbtn" onClick={onClose} style={{ width: "auto", padding: "12px 30px", marginTop: 20, fontSize: 14 }}>To the armoury</button>
      </div>
    </div>
  );
}

/* ---- Deck sheet: your team's card bank ---- */
function CWDeckSheet({ cw, foeCw, me, roster, foe, capInfo, intelOn, onPlay, onClose, busyId, mode = "battle", onPlayParty }) {
  const [picking, setPicking] = useState(null);
  const bank = cw?.bank || [];
  const mineCards = bank.filter((b) => b.pid === me.id);
  const teamCards = bank.filter((b) => b.pid !== me.id);
  const foeBank = foeCw?.bank || [];
  const nameOf = (pid) => roster.find((p) => p.id === pid)?.name || "teammate";
  const hornUsed = (cw?.played || []).some((p) => p.day === today() && cwCardOf(p.cardId)?.fx === "buff");
  const Group = ({ list, playable, label }) => (
    <div style={{ marginBottom: 16 }}>
      <div className="rlabel" style={{ marginBottom: 9 }}>{label}</div>
      {list.length === 0 && <div style={{ fontSize: 12.5, fontWeight: 700, color: "#9A9283" }}>{playable ? "No cards yet — hit 50% or 100% of any habit today to draw." : "Nothing banked from the squad yet."}</div>}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {list.map((b) => {
          const c = cwCardOf(b.cardId); if (!c) return null;
          const hornLock = c.fx === "buff" && hornUsed;
          return (
            <div key={b.id} style={{ width: 110 }}>
              <CWCardFace card={c} size={110} />
              {!playable && <div style={{ fontSize: 9.5, fontWeight: 800, color: "#9A9283", textAlign: "center", marginTop: 3 }}>{nameOf(b.pid)}'s</div>}
              {playable && mode === "battle" && (
                <button className="rbtn" disabled={!foe || busyId === b.id || hornLock} onClick={() => onPlay(b)} style={{ width: "100%", padding: "7px 0", fontSize: 11.5, marginTop: 5, opacity: !foe || hornLock ? .5 : 1 }}>
                  {busyId === b.id ? "…" : hornLock ? "Used today" : !foe ? "No rival" : "Play"}
                </button>
              )}
              {playable && mode === "party" && (() => {
                const okType = CW_PARTY_FX.includes(c.fx);
                const needsTarget = ["hit", "siphon"].includes(c.fx);
                if (!okType) return <div style={{ fontSize: 9.5, fontWeight: 800, color: "#B3AA97", textAlign: "center", marginTop: 5 }}>battle-only card</div>;
                if (picking === b.id) return (
                  <div style={{ marginTop: 5 }}>
                    {roster.filter((p) => p.id !== me.id).map((p) => (
                      <button key={p.id} className="rbtn" disabled={busyId === b.id} onClick={() => { setPicking(null); onPlayParty(b, p.id); }} style={{ width: "100%", padding: "6px 0", fontSize: 10.5, marginTop: 3 }}>{p.name}</button>
                    ))}
                    <button className="rghost" onClick={() => setPicking(null)} style={{ width: "100%", marginTop: 3, fontSize: 10 }}>Cancel</button>
                  </div>
                );
                return (
                  <button className="rbtn" disabled={busyId === b.id} onClick={() => needsTarget ? setPicking(b.id) : onPlayParty(b, null)} style={{ width: "100%", padding: "7px 0", fontSize: 11.5, marginTop: 5 }}>
                    {busyId === b.id ? "…" : needsTarget ? "Pick a victim" : "Play"}
                  </button>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", flexDirection: "column", justifyContent: "flex-end" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(30,34,26,.45)", backdropFilter: "blur(2px)" }} />
      <div style={{ position: "relative", background: "#FFFDF8", borderRadius: "30px 30px 0 0", maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 18px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="rh" style={{ fontSize: 21 }}>The armoury</div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9A9283" }}>Cards drop at 50% & 100% of daily goals · bank them all week</div>
          </div>
          <button className="rghost" onClick={onClose}>Close</button>
        </div>
        <div style={{ margin: "6px 18px 4px", background: "#FBF3E2", borderRadius: 13, padding: "8px 13px", fontSize: 11.5, fontWeight: 700, color: "#8A6A1E", display: "flex", justifyContent: "space-between" }}>
          <span>Today's card power</span><span>{capInfo.used} / {capInfo.cap} used</span>
        </div>
        <div style={{ padding: "10px 18px 26px", overflowY: "auto" }}>
          <Group list={mineCards} playable label={`Your cards · ${mineCards.length}`} />
          <Group list={teamCards} playable={false} label={`Squad's bank · ${teamCards.length}`} />
          {intelOn && foe && (
            <div style={{ marginTop: 4 }}>
              <div className="rlabel" style={{ marginBottom: 9 }}>Falcon intel · {foe.name}'s bank ({foeBank.length})</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {foeBank.length === 0 && <div style={{ fontSize: 12.5, fontWeight: 700, color: "#9A9283" }}>Their armoury is empty.</div>}
                {foeBank.map((b) => cwCardOf(b.cardId) && <CWCardFace key={b.id} card={cwCardOf(b.cardId)} size={80} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   PERSONAL HABITS & CONSISTENCY — v30.5
   ----------------------------------------------------------------
   Private custom habits: synced per-account under rt1:cx:{id},
   a key the scoring layer never reads. Display-only by design —
   they never touch team scores, cards, XP, badges or leaderboards.
   Includes the Consistency dashboard (heatmap, streaks, trends).
   ================================================================ */
const CXK = (id) => `rt1:cx:${id}`;
const CX_TYPES = [
  { id: "toggle", name: "Done / not done", unit: "", step: 1 },
  { id: "count", name: "Count", unit: "×", step: 1 },
  { id: "minutes", name: "Minutes", unit: "min", step: 5 },
  { id: "pages", name: "Pages", unit: "pages", step: 1 },
  { id: "distance", name: "Distance", unit: "km", step: 0.5 },
];
const CX_FREQS = [
  { id: "daily", name: "Daily", kind: "daily" },
  { id: "3x", name: "3× a week", kind: "perweek", n: 3 },
  { id: "5x", name: "5× a week", kind: "perweek", n: 5 },
  { id: "weekly", name: "Weekly", kind: "perweek", n: 1 },
  { id: "monthly", name: "Monthly", kind: "monthly" },
];
const CX_ICONS = ["star", "bolt", "fire", "flag", "trophy", "focus", "reading", "meditation", "workout", "steps"];
const CX_COLORS = ["#5E9E5B", "#4E9BD8", "#8B6FC9", "#D96A4E", "#E0A438", "#4FA898", "#C9678B", "#39749F"];
const cxTypeOf = (t) => CX_TYPES.find((x) => x.id === t) || CX_TYPES[0];
const cxFreqOf = (f) => CX_FREQS.find((x) => x.id === f) || CX_FREQS[0];
const cxVal = (cx, date, id) => { const v = cx?.logs?.[date]?.[id]; return v === true ? 1 : Number(v) || 0; };
const cxDone = (def, v) => def.type === "toggle" ? v >= 1 : v >= (Number(def.goal) || 1);
const cxDatesBack = (n) => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return dk(d); });
const cxWeekOf = (dateStr) => { const d = new Date(dateStr + "T12:00"); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return dk(d); };
/* frequency-aware streaks: daily = consecutive days; N-per-week =
   consecutive weeks meeting N (the current, unfinished week never
   breaks a streak); monthly = consecutive months with a completion. */
function cxStreak(def, cx) {
  const f = cxFreqOf(def.freq);
  if (f.kind === "daily") {
    let cur = 0, best = 0, run = 0;
    const days = cxDatesBack(370).reverse();
    for (const d of days) { if (cxDone(def, cxVal(cx, d, def.id))) { run++; best = Math.max(best, run); } else if (d !== today()) run = 0; }
    // current streak: walk back from today (today only counts if done)
    const back = cxDatesBack(370);
    for (let i = 0; i < back.length; i++) {
      const done = cxDone(def, cxVal(cx, back[i], def.id));
      if (done) cur++;
      else if (i === 0) continue; // today not done yet doesn't break
      else break;
    }
    return { cur, best: Math.max(best, cur), unit: "day" };
  }
  // group completions by week or month
  const buckets = {};
  for (const [date, day] of Object.entries(cx?.logs || {})) {
    const v = day?.[def.id]; if (!v) continue;
    if (!cxDone(def, v === true ? 1 : Number(v) || 0)) continue;
    const b = f.kind === "monthly" ? date.slice(0, 7) : cxWeekOf(date);
    buckets[b] = (buckets[b] || 0) + 1;
  }
  const need = f.kind === "monthly" ? 1 : f.n;
  const step = (key, back) => {
    if (f.kind === "monthly") { const d = new Date(key + "-15T12:00"); d.setMonth(d.getMonth() - back); return d.toISOString().slice(0, 7); }
    const d = new Date(key + "T12:00"); d.setDate(d.getDate() - back * 7); return dk(d);
  };
  const nowKey = f.kind === "monthly" ? today().slice(0, 7) : cxWeekOf(today());
  let cur = 0;
  for (let i = 0; i < 120; i++) {
    const k = step(nowKey, i);
    if ((buckets[k] || 0) >= need) cur++;
    else if (i === 0) continue; // current period in progress never breaks
    else break;
  }
  let best = cur;
  const keys = Object.keys(buckets).sort();
  let run = 0, prev = null;
  for (const k of keys) {
    if ((buckets[k] || 0) < need) { run = 0; prev = null; continue; }
    run = prev && step(k, 1) === prev ? run + 1 : 1;
    best = Math.max(best, run); prev = k;
  }
  return { cur, best, unit: f.kind === "monthly" ? "month" : "week" };
}

/* wellness-category daily streak from the player's real logs */
function wellnessStreak(catId, logs = {}) {
  let cur = 0, best = 0, run = 0;
  const days = cxDatesBack(370).reverse();
  for (const d of days) { if (cwPct(logs[d] || {}, catId) >= 1) { run++; best = Math.max(best, run); } else if (d !== today()) run = 0; }
  const back = cxDatesBack(370);
  for (let i = 0; i < back.length; i++) {
    if (cwPct(logs[back[i]] || {}, catId) >= 1) cur++;
    else if (i === 0) continue;
    else break;
  }
  return { cur, best: Math.max(best, cur), unit: "day" };
}

/* ---- Consistency dashboard sheet ---- */
function ConsistencySheet({ me, cx, onClose }) {
  const [sel, setSel] = useState("all");
  const defs = cx?.defs || [];
  const custom = defs.find((d) => d.id === sel);
  const wellness = CATS.find((c) => c.id === sel);
  const WEEKS = 16;
  const intensity = (date) => {
    if (sel === "all") { const s = me.logs?.[date] ? dayScore(me.logs[date]) : 0; return Math.min(1, s / 700); }
    if (custom) { const v = cxVal(cx, date, custom.id); return custom.type === "toggle" ? (v ? 1 : 0) : Math.min(1, v / (Number(custom.goal) || 1)); }
    return Math.min(1, cwPct(me.logs?.[date] || {}, sel));
  };
  const baseCol = custom ? custom.color : wellness ? wellness.color : FOREST;
  const monday = new Date(); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) - (WEEKS - 1) * 7);
  const grid = Array.from({ length: WEEKS }, (_, w) => Array.from({ length: 7 }, (_, d) => {
    const dt = new Date(monday); dt.setDate(monday.getDate() + w * 7 + d);
    const key = dk(dt);
    return { key, future: key > today(), v: intensity(key) };
  }));
  const last30 = cxDatesBack(30).reverse();
  const seriesVal = (d) => sel === "all" ? (me.logs?.[d] ? dayScore(me.logs[d]) : 0) : custom ? cxVal(cx, d, custom.id) : Math.round(cwPct(me.logs?.[d] || {}, sel) * 100);
  const series = last30.map(seriesVal);
  const maxV = Math.max(1, ...series);
  const active30 = last30.filter((d) => intensity(d) > 0).length;
  const done30 = last30.filter((d) => intensity(d) >= 1).length;
  const streaks = sel === "all"
    ? [] : custom ? [{ name: custom.name, s: cxStreak(custom, cx), color: custom.color }] : [{ name: wellness.name, s: wellnessStreak(sel, me.logs), color: wellness.color }];
  const allStreaks = sel === "all" ? [
    ...CATS.filter((c) => !["journal", "fasting"].includes(c.id)).map((c) => ({ name: c.name, s: wellnessStreak(c.id, me.logs), color: c.color })),
    ...defs.map((d) => ({ name: d.name, s: cxStreak(d, cx), color: d.color, personal: true })),
  ].filter((x) => x.s.best > 0).sort((a, b) => b.s.cur - a.s.cur) : streaks;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", flexDirection: "column", justifyContent: "flex-end" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(30,34,26,.45)", backdropFilter: "blur(2px)" }} />
      <div style={{ position: "relative", background: "#FFFDF8", borderRadius: "30px 30px 0 0", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 18px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="rh" style={{ fontSize: 21 }}>Consistency</div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9A9283" }}>Show up. Watch the grid fill in.</div>
          </div>
          <button className="rghost" onClick={onClose}>Close</button>
        </div>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "2px 18px 10px", flexShrink: 0 }}>
          {[{ id: "all", name: "Everything" }, ...CATS.filter((c) => !["journal", "fasting"].includes(c.id)), ...defs].map((c) => (
            <button key={c.id} className={`rchip ${sel === c.id ? "on" : ""}`} onClick={() => setSel(c.id)} style={{ flexShrink: 0 }}>{c.name}</button>
          ))}
        </div>
        <div style={{ padding: "0 18px 28px", overflowY: "auto" }}>
          {/* heatmap */}
          <div style={{ background: "#FAF6ED", borderRadius: 18, padding: "14px 12px 10px" }}>
            <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
              {grid.map((col, w) => (
                <div key={w} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {col.map((cell) => (
                    <div key={cell.key} title={cell.key} style={{ width: 13, height: 13, borderRadius: 3.5, background: cell.future ? "transparent" : cell.v <= 0 ? "#EFE8D9" : baseCol, opacity: cell.future ? 0 : cell.v <= 0 ? 1 : .25 + cell.v * .75 }} />
                  ))}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 9.5, fontWeight: 800, color: "#B3AA97", padding: "0 4px" }}>
              <span>{WEEKS} weeks ago</span><span>this week</span>
            </div>
          </div>
          {/* stats strip */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 }}>
            {[["Active days · 30d", `${active30}`], ["Goal hit · 30d", `${done30}`], ["Hit rate", `${Math.round((done30 / 30) * 100)}%`]].map(([l, v]) => (
              <div key={l} style={{ background: "#FAF6ED", borderRadius: 14, padding: "10px 8px", textAlign: "center" }}>
                <div className="rh" style={{ fontSize: 20 }}>{v}</div>
                <div style={{ fontSize: 9, fontWeight: 800, color: "#9A9283", letterSpacing: ".04em" }}>{l.toUpperCase()}</div>
              </div>
            ))}
          </div>
          {/* 30-day trend */}
          <div className="rlabel" style={{ margin: "16px 0 8px" }}>Last 30 days</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 64, background: "#FAF6ED", borderRadius: 14, padding: "8px 10px" }}>
            {series.map((v, i) => <div key={i} style={{ flex: 1, height: `${Math.max(3, (v / maxV) * 100)}%`, background: baseCol, opacity: v > 0 ? .85 : .18, borderRadius: 3 }} />)}
          </div>
          {/* streaks */}
          <div className="rlabel" style={{ margin: "16px 0 8px" }}>Streaks</div>
          {allStreaks.length === 0 && <div style={{ fontSize: 12.5, fontWeight: 700, color: "#9A9283" }}>No streaks yet — hit a goal today to start one.</div>}
          {allStreaks.map((x) => (
            <div key={x.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
              <span style={{ width: 10, height: 10, borderRadius: 4, background: x.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontWeight: 800, fontSize: 13 }}>{x.name}{x.personal ? <span style={{ fontSize: 9, fontWeight: 800, color: "#B3AA97" }}> · personal</span> : null}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: x.s.cur > 0 ? "#1F4033" : "#B3AA97" }}>{x.s.cur} {x.s.unit}{x.s.cur === 1 ? "" : "s"}</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "#B3AA97" }}>best {x.s.best}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- Personal habit manager (create / edit / delete) ---- */
function CXManageSheet({ cx, onSave, onClose }) {
  const blank = { id: "", name: "", icon: "star", color: CX_COLORS[0], type: "toggle", goal: 1, freq: "daily" };
  const [edit, setEdit] = useState(null);
  const defs = cx?.defs || [];
  const save = () => {
    if (!edit.name.trim()) return;
    const def = { ...edit, id: edit.id || `cx${Date.now().toString(36)}`, name: edit.name.trim().slice(0, 24), goal: Math.max(edit.type === "toggle" ? 1 : 0.5, Number(edit.goal) || 1) };
    const next = { ...cx, defs: edit.id ? defs.map((d) => d.id === def.id ? def : d) : [...defs, def] };
    onSave(next); setEdit(null);
  };
  const remove = (id) => { if (!window.confirm("Delete this habit and its history?")) return; const logs = { ...(cx.logs || {}) }; for (const d of Object.keys(logs)) { if (logs[d]?.[id] !== undefined) { const { [id]: _, ...rest } = logs[d]; logs[d] = rest; } } onSave({ defs: defs.filter((d) => d.id !== id), logs }); setEdit(null); };
  const T = cxTypeOf(edit?.type);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 70, display: "flex", flexDirection: "column", justifyContent: "flex-end" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(30,34,26,.45)", backdropFilter: "blur(2px)" }} />
      <div style={{ position: "relative", background: "#FFFDF8", borderRadius: "30px 30px 0 0", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "18px 18px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="rh" style={{ fontSize: 21 }}>{edit ? (edit.id ? "Edit habit" : "New personal habit") : "Personal habits"}</div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9A9283" }}>Private to you — never scored, never shared.</div>
          </div>
          <button className="rghost" onClick={() => edit ? setEdit(null) : onClose()}>{edit ? "Back" : "Close"}</button>
        </div>
        <div style={{ padding: "8px 18px 28px", overflowY: "auto" }}>
          {!edit && (<>
            {defs.map((d) => (
              <button key={d.id} className="rtap" onClick={() => setEdit({ ...d })} style={{ width: "100%", background: "#FAF6ED", border: "none", borderRadius: 16, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, marginBottom: 8, cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 38, height: 38, borderRadius: 13, background: d.color, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={d.icon} size={18} color="#FFFDF4" /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14.5 }}>{d.name}</div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: "#9A9283" }}>{cxTypeOf(d.type).name}{d.type !== "toggle" ? ` · goal ${d.goal} ${cxTypeOf(d.type).unit}` : ""} · {cxFreqOf(d.freq).name.toLowerCase()}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#B3AA97" }}>Edit</span>
              </button>
            ))}
            {defs.length >= 20
              ? <div style={{ fontSize: 12, fontWeight: 700, color: "#9A9283", textAlign: "center", padding: "8px 0" }}>Twenty habits is plenty — retire one before adding more.</div>
              : <button className="rbtn" onClick={() => setEdit({ ...blank })} style={{ width: "100%", padding: "13px 0", fontSize: 14 }}>Add a habit</button>}
          </>)}
          {edit && (<>
            <div className="rlabel" style={{ marginBottom: 7 }}>Name</div>
            <input className="rin" maxLength={24} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="Guitar practice, Duolingo, Skincare…" />
            <div className="rlabel" style={{ margin: "14px 0 7px" }}>Icon</div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {CX_ICONS.map((ic) => (
                <button key={ic} onClick={() => setEdit({ ...edit, icon: ic })} style={{ width: 40, height: 40, borderRadius: 13, border: edit.icon === ic ? `2.5px solid ${edit.color}` : "2px solid #EDE5D6", background: edit.icon === ic ? edit.color : "#FAF6ED", display: "grid", placeItems: "center", cursor: "pointer" }}>
                  <Icon name={ic} size={17} color={edit.icon === ic ? "#FFFDF4" : "#8A8272"} />
                </button>
              ))}
            </div>
            <div className="rlabel" style={{ margin: "14px 0 7px" }}>Color</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CX_COLORS.map((c) => (
                <button key={c} onClick={() => setEdit({ ...edit, color: c })} style={{ width: 32, height: 32, borderRadius: 99, background: c, border: edit.color === c ? "3px solid #262B22" : "3px solid transparent", cursor: "pointer" }} />
              ))}
            </div>
            <div className="rlabel" style={{ margin: "14px 0 7px" }}>Measure</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {CX_TYPES.map((t) => <button key={t.id} className={`rchip ${edit.type === t.id ? "on" : ""}`} onClick={() => setEdit({ ...edit, type: t.id })}>{t.name}</button>)}
            </div>
            {edit.type !== "toggle" && (<>
              <div className="rlabel" style={{ margin: "14px 0 7px" }}>Goal ({T.unit || "count"})</div>
              <input className="rin" type="number" inputMode="decimal" value={edit.goal} onChange={(e) => setEdit({ ...edit, goal: e.target.value })} />
            </>)}
            <div className="rlabel" style={{ margin: "14px 0 7px" }}>How often</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {CX_FREQS.map((f) => <button key={f.id} className={`rchip ${edit.freq === f.id ? "on" : ""}`} onClick={() => setEdit({ ...edit, freq: f.id })}>{f.name}</button>)}
            </div>
            <button className="rbtn" onClick={save} style={{ width: "100%", padding: "14px 0", fontSize: 15, marginTop: 18, opacity: edit.name.trim() ? 1 : .5 }}>Save habit</button>
            {edit.id && <button onClick={() => remove(edit.id)} style={{ width: "100%", padding: "12px 0", fontSize: 12.5, fontWeight: 800, color: "#B0685A", background: "none", border: "none", marginTop: 6, cursor: "pointer" }}>Delete habit</button>}
          </>)}
        </div>
      </div>
    </div>
  );
}

/* ---- Lifetime equivalents: playful units for Profile ---- */
function lifetimeEquivalents(logs = {}) {
  const sum = (f) => Object.values(logs || {}).reduce((s, l) => s + (f(l) || 0), 0);
  const steps = sum((l) => Number(l.steps) || 0);
  const waterMl = sum((l) => Number(l.water) || 0);
  const pages = sum((l) => Number(l.reading) || 0);
  const medMin = sum((l) => Number(l.meditation) || 0);
  const woMin = sum((l) => Number(l.workoutMin) || 0);
  const kcal = sum((l) => Number(l.calories) || 0);
  const fmt = (v) => v >= 10 ? Math.round(v).toLocaleString() : v >= 1 ? (Math.round(v * 10) / 10).toString() : (Math.round(v * 100) / 100).toString();
  const out = [];
  if (steps / 55000 >= 0.05) out.push({ icon: "steps", color: "#5E9E5B", v: fmt(steps / 55000), label: "marathons walked", sub: `${steps.toLocaleString()} lifetime steps` });
  if (waterMl / 150000 >= 0.05) out.push({ icon: "water", color: "#4E9BD8", v: fmt(waterMl / 150000), label: "bathtubs of water", sub: `${Math.round(waterMl / 1000).toLocaleString()} litres drunk` });
  if (pages / 320 >= 0.05) out.push({ icon: "reading", color: "#D96A4E", v: fmt(pages / 320), label: "novels finished", sub: `${pages.toLocaleString()} pages read` });
  if (medMin / 120 >= 0.05) out.push({ icon: "meditation", color: "#8B6FC9", v: fmt(medMin / 120), label: "movie-lengths of calm", sub: `${medMin.toLocaleString()} mindful minutes` });
  if (woMin / 90 >= 0.05) out.push({ icon: "workout", color: "#C9678B", v: fmt(woMin / 90), label: "full football matches", sub: `${woMin.toLocaleString()} workout minutes` });
  if (kcal / 2270 >= 0.05) out.push({ icon: "fire", color: "#E0A438", v: fmt(kcal / 2270), label: "whole pizzas burned", sub: `${kcal.toLocaleString()} kcal logged` });
  return out;
}

class Boundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error("Rally render error:", err, info); }
  render() {
    if (this.state.err) {
      return (
        <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: 30, textAlign: "center" }}>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: 20, color: "#262B22", marginBottom: 8 }}>This screen hit a snag</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#9A9283", marginBottom: 12, maxWidth: 300 }}>Your data is safe — nothing was lost. Reload to get back in.</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#B0685A", background: "#F8F1EC", borderRadius: 12, padding: "10px 12px", marginBottom: 16, maxWidth: 320, wordBreak: "break-word", textAlign: "left", fontFamily: "monospace" }}>
              {String(this.state.err?.message || this.state.err)}
              {this.state.err?.stack ? "\n" + String(this.state.err.stack).split("\n").slice(1, 3).join("\n") : ""}
            </div>
            <button onClick={() => { this.setState({ err: null }); window.location.reload(); }} style={{ background: "#262B22", color: "#fff", border: "none", borderRadius: 99, padding: "13px 26px", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "'Plus Jakarta Sans'" }}>Reload Rally</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Rally() {
  const [phase, setPhase] = useState("loading");
  const [me, setMe] = useState(null);
  const [team, setTeam] = useState(null);
  const [roster, setRoster] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [tab, setTab] = useState("home");
  const [log, setLog] = useState({});
  const [savedLog, setSavedLog] = useState({});
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [email, setEmail] = useState("");
  const [pkCode, setPkCode] = useState("");
  const [pkName, setPkName] = useState("");
  const [pkPublic, setPkPublic] = useState(false);
  const [pkMode, setPkMode] = useState("battle");
  const [fPublic, setFPublic] = useState(false);
  const [fMode, setFMode] = useState("battle");
  const [browseOpen, setBrowseOpen] = useState(false);
  const [teamSide, setTeamSide] = useState("us");
  const [fastOpen, setFastOpen] = useState(false);
  const [burstRow, setBurstRow] = useState(null);
  const [surge, setSurge] = useState(null);
  const prevPctRef = useRef({});
  useEffect(() => {
    const goals = { steps: 10000, water: WATER_GOAL_ML, sleep: 8, meditation: 10, reading: 10, focus: 50, calories: 1000, workout: 60 };
    const cur = {};
    for (const [id, g] of Object.entries(goals)) {
      const v = id === "workout" ? (Number(log.workoutMin) || 0) : (Number(log[id]) || 0);
      cur[id] = v / g;
    }
    for (const id of Object.keys(cur)) {
      if (cur[id] >= 1 && (prevPctRef.current[id] || 0) < 1 && prevPctRef.current._init) {
        setBurstRow(id); buzz([16, 34, 16]);
      }
    }
    if (log.water !== prevPctRef.current._w && prevPctRef.current._init) { setSurge("water"); setTimeout(() => setSurge(null), 900); }
    prevPctRef.current = { ...cur, _w: log.water, _init: true };
  }, [log]); // eslint-disable-line
  const [pendingJoin, setPendingJoin] = useState(null);
  const [view, setView] = useState(null);
  const [localOnly, setLocalOnly] = useState(false);
  const [copied, setCopied] = useState(false);
  const [woOpen, setWoOpen] = useState(false);
  const [openCat, setOpenCat] = useState(null);
  const [feed, setFeed] = useState([]);
  const [awards, setAwards] = useState({});
  const [emblemOpen, setEmblemOpen] = useState(false);
  const [mantraSeed, setMantraSeed] = useState(0);
  const [zenIdx, setZenIdx] = useState(0);
  const [zenFull, setZenFull] = useState(null); // null | "breath" | "focus"
  const [journalOpen, setJournalOpen] = useState(false);
  const [gymOpen, setGymOpen] = useState(false);
  const [shout, setShout] = useState("");
  const [chat, setChat] = useState([]);
  const [editName, setEditName] = useState(null);
  const [rankMode, setRankMode] = useState("month");
  const [chartTab, setChartTab] = useState("month");
  const [feedFilter, setFeedFilter] = useState("all");
  const [feedMore, setFeedMore] = useState(false);
  const [peekTeam, setPeekTeam] = useState(null);
  const [teamTab, setTeamTab] = useState("contrib");
  const [healthOpen, setHealthOpen] = useState(false);
  /* ---- Castle Wars state ---- */
  const [cwMine, setCwMine] = useState(null);
  const [cwFoe, setCwFoe] = useState(null);
  const [cwTick, setCwTick] = useState(0);
  const [deckOpen, setDeckOpen] = useState(false);
  const [drawToast, setDrawToast] = useState(null);
  const wds = useWilds({ me, setMe, teamCode: team?.code, feedPost });
  const gdn = useGarden({ me, dayScore });
  const [cwFx, setCwFx] = useState(null);
  const [cwBusyId, setCwBusyId] = useState(null);
  const [cwShake, setCwShake] = useState(false);
  /* ---- Personal habits (private, synced, never scored) ---- */
  const [cx, setCx] = useState({ defs: [], logs: {} });
  const [cxManageOpen, setCxManageOpen] = useState(false);
  const [evoShow, setEvoShow] = useState(null);
  const [classPick, setClassPick] = useState(false);
  const [crestPickOpen, setCrestPickOpen] = useState(false);
  const [myCrestPick, setMyCrestPick] = useState(false);
  const saveMyCrest = async (id) => {
    setMyCrestPick(false);
    if (!me?.id) return;
    try { const fresh = (await sGet(PK(me.id), true)) || me; const upd = { ...fresh, crestId: id }; await sSet(PK(me.id), upd, true); setMe(upd); refresh(); } catch { }
  };
  const saveCrestId = async (id) => {
    setCrestPickOpen(false);
    if (!team) return;
    try { const fresh = (await sGet(TK(team.code), true)) || team; const upd = { ...fresh, crestId: id }; await sSet(TK(team.code), upd, true); setTeam(upd); refresh(); } catch { }
  };
  const [celeb, setCeleb] = useState(null);
  const celebArt = (kind) => (charArt(me?.charClass || "pathfinder", "tier-3")?.celeb || {})[kind];
  const fireCeleb = (kind, kicker, text) => setCeleb({ img: celebArt(kind) ? "./" + celebArt(kind) : null, kicker, text });
  const saveCharClass = async (cid) => {
    setClassPick(false);
    if (!me?.id) return;
    try { const fresh = (await sGet(PK(me.id), true)) || me; const upd = { ...fresh, charClass: cid }; await sSet(PK(me.id), upd, true); setMe(upd); } catch { }
  };
  /* one-time class prompt for accounts that never chose */
  useEffect(() => {
    if (!me?.id || me.charClass) return;
    const k = `rt1:classPrompted:${me.id}`;
    if (!localStorage.getItem(k)) { localStorage.setItem(k, "1"); setClassPick(true); }
  }, [me?.id]); // eslint-disable-line
  /* level-up pop for non-tier levels + badge + weekly-victory celebrations */
  useEffect(() => {
    if (!me?.id) return;
    const lv = levelOf(totalXP(me.logs)).lv;
    const k = `rt1:lastLv:${me.id}`;
    const prev = Number(localStorage.getItem(k) || 0);
    localStorage.setItem(k, String(lv));
    if (prev > 0 && lv > prev && charTierOf(lv).id === charTierOf(prev).id)
      fireCeleb("milestone-complete", "LEVEL UP", `Level ${lv}`);
  }, [me?.logs]); // eslint-disable-line
  useEffect(() => {
    if (!me?.id) return;
    const Lz = levelOf(totalXP(me.logs || {}));
    const earned = BADGES.filter((b) => { try { return b.get(Lz, me.logs || {}); } catch { return false; } }).map((b) => b.name);
    const k = `rt1:badgesSeen:${me.id}`;
    const seen = JSON.parse(localStorage.getItem(k) || "null");
    localStorage.setItem(k, JSON.stringify(earned));
    if (seen === null) return;
    const fresh = earned.filter((n) => !seen.includes(n));
    if (fresh.length) fireCeleb("badge-unlock", "BADGE UNLOCKED", fresh[0]);
  }, [me?.logs]); // eslint-disable-line
  useEffect(() => {
    if (!me?.id) return;
    const lv = levelOf(totalXP(me.logs)).lv;
    const tier = charTierOf(lv);
    const key = `rt1:tierSeen:${me.id}`;
    const seen = localStorage.getItem(key);
    if (seen === null) { localStorage.setItem(key, tier.id); return; } /* existing accounts adopt current tier quietly */
    if (seen !== tier.id && CHAR_TIERS.findIndex((t) => t.id === tier.id) > CHAR_TIERS.findIndex((t) => t.id === seen)) {
      setEvoShow(lv);
      localStorage.setItem(key, tier.id);
    }
  }, [me?.id, me?.logs]); // eslint-disable-line
  const [gridOpen, setGridOpen] = useState(false);
  useEffect(() => {
    if (!me?.id) { setCx({ defs: [], logs: {} }); return; }
    let live = true;
    sGet(CXK(me.id), true).then((v) => { if (live) setCx(v && v.defs ? v : { defs: [], logs: {} }); });
    return () => { live = false; };
  }, [me?.id]); // eslint-disable-line
  const cxSave = (next) => { setCx(next); if (me?.id) sSet(CXK(me.id), next, true); };
  const cxSet = (defId, val) => {
    const day = { ...(cx.logs?.[today()] || {}) };
    if (val === undefined || val === 0 || val === false) delete day[defId]; else day[defId] = val;
    cxSave({ ...cx, logs: { ...(cx.logs || {}), [today()]: day } });
  };
  const [moodMap, setMoodMap] = useState({});
  useEffect(() => { sGet("rt1:mood", false).then((m) => setMoodMap(m || {})); }, []);
  const [gratMap, setGratMap] = useState({});
  useEffect(() => { sGet(GK, false).then((g) => setGratMap(g || {})); }, []);
  const [fName, setFName] = useState(""), [fTeam, setFTeam] = useState(""), [fCode, setFCode] = useState("");
  const [fPass, setFPass] = useState(""), [fRecovery, setFRecovery] = useState("");
  const [showRecovery, setShowRecovery] = useState("");
  const [titleEdit, setTitleEdit] = useState("");

  const loadAll = useCallback(async () => {
    const [pk, tk, ak] = await Promise.all([sList("rt1:p:", true), sList("rt1:t:", true), sList("rt1:a:", true)]);
    const [players, teams, aws] = await Promise.all([Promise.all(pk.map((k) => sGet(k, true))), Promise.all(tk.map((k) => sGet(k, true))), Promise.all(ak.map((k) => sGet(k, true)))]);
    const ps = players.filter(Boolean), ts = teams.filter(Boolean);
    const aw = {}; ak.forEach((k, i) => { if (aws[i]) aw[k.slice(6)] = aws[i]; });
    setAllTeams(ts); setAllPlayers(ps); setAwards(aw);
    return { ps, ts };
  }, []);

  useEffect(() => {
    (async () => {
      const saved = await sGet(ME, false);
      const { ps, ts } = await loadAll();
      if (saved?.id) {
        const mine = ps.find((p) => p.id === saved.id);
        if (mine) {
          const t = ts.find((x) => x.code === mine.team);
          const codes0 = teamsOf(mine); const act0 = localStorage.getItem("rt1:active");
          const code0 = codes0.includes(act0) ? act0 : codes0[0];
          const t0 = code0 ? (ts.find((x) => x.code === code0) || t) : null;
          setMe(mine); setTeam(t0 || null); setRoster(code0 ? ps.filter((p) => inTeam(p, code0)) : [mine]);
          const l = mine.logs?.[today()] || {}; setLog(l); setSavedLog(l); setTitleEdit(mine.title || "");
          setPhase("app"); return;
        }
      }
      setPhase("landing");
    })();
  }, [loadAll]);

  const refresh = useCallback(async () => { const { ps } = await loadAll(); setCwTick((t) => t + 1); if (me) { const ac = team?.code || teamsOf(me)[0]; if (ac) { setRoster(ps.filter((p) => inTeam(p, ac))); sGet(FK(ac), true).then((f) => setFeed(f || [])); sGet(CK(ac), true).then((c) => setChat(c || [])); } else setRoster([me]); } return ps; }, [loadAll, me, team]);

  const createTeam = async () => {
    setBusy(true); setErr("");
    try {
    const nameTaken = await findAccount(fName);
    if (nameTaken) { setErr("That username is already in use — pick another, or tap Log in if it's you."); setBusy(false); return; }
    let id = slug(fName); if (await sGet(PK(id), true)) id = `${id}-${Math.floor(Math.random() * 900 + 100)}`;
    const joining = pendingJoin;
    const solo = !joining && fMode === "solo";
    const t = solo ? null : (joining || { code: code5(), name: fTeam.trim(), created: Date.now(), founder: id, public: !!fPublic, mode: fMode });
    const code = t ? t.code : null;
    const rc = recoveryCode();
    const av = seededAvatar(fName); const p = { id, name: fName.trim(), team: code, teams: code ? [code] : [], sinceMap: code ? { [code]: today() } : {}, title: "", joined: Date.now(), logs: {}, pass: hashPass(fPass), recovery: rc, email: (email || "").trim() || undefined, since: code ? today() : undefined, color: av.color, icon: av.icon, variant: av.variant };
    const m1 = (joining || solo) ? "ok" : await sSet(TK(code), t, true), m2 = await sSet(PK(id), p, true);
    if (m1 === "local" || m2 === "local") setLocalOnly(true);
    await sSet(ME, { id }, false);
    if (code) { localStorage.setItem("rt1:active", code); feedPost(code, { pid: id, name: p.name, icon: joining ? "team" : "flag", text: joining ? "joined the team" : `founded ${t.name}` }); }
    const others = joining ? (await refresh()).filter((x) => inTeam(x, code) && x.id !== id) : [];
    setMe(p); setTeam(t); setRoster(t ? [...others, p] : [p]); setShowRecovery(rc); setPendingJoin(null); setPhase(solo ? "app" : "lobby"); setBusy(false);
    } catch (e) { setErr("Something went wrong — try again. (" + (e?.message || e) + ")"); setBusy(false); }
  };

  const joinTeam = async () => {
    setBusy(true); setErr("");
    try {
    const nameTaken = await findAccount(fName);
    if (nameTaken) { setErr("That username is already in use — pick another, or tap Log in if it's you."); setBusy(false); return; }
    const code = fCode.trim().toUpperCase();
    const t = await sGet(TK(code), true);
    if (!t) { setErr("No team found with that code — double-check with your captain."); setBusy(false); return; }
    let id = slug(fName); if (await sGet(PK(id), true)) id = `${id}-${Math.floor(Math.random() * 900 + 100)}`;
    const rc = recoveryCode();
    const av = seededAvatar(fName); const p = { id, name: fName.trim(), team: code, teams: [code], sinceMap: { [code]: today() }, title: "", joined: Date.now(), logs: {}, pass: hashPass(fPass), recovery: rc, email: (email || "").trim() || undefined, since: today(), color: av.color, icon: av.icon, variant: av.variant };
    if ((await sSet(PK(id), p, true)) === "local") setLocalOnly(true);
    await sSet(ME, { id }, false);
    const ps = await refresh();
    feedPost(code, { pid: id, name: p.name, icon: "team", text: `joined the team` });
    setMe(p); setTeam(t); setRoster([...(ps.filter((x) => inTeam(x, code) && x.id !== id)), p]); setShowRecovery(rc); setPhase("lobby"); setBusy(false);
    } catch (e) { setErr("Something went wrong — try again. (" + (e?.message || e) + ")"); setBusy(false); }
  };

  const logIn = async () => {
    setBusy(true); setErr("");
    const { ps: all0 } = await loadAll();
    const matches = all0.filter((p) => p.name.toLowerCase() === fName.trim().toLowerCase());
    if (matches.length === 0) { setErr("No account with that name yet. Create a team or join one to get started."); setBusy(false); return; }
    const acct = matches.find((p) => !p.pass || p.pass === hashPass(fPass));
    if (!acct) { setErr("Wrong passcode. Try again, or use your recovery code below."); setBusy(false); return; }
    await sSet(ME, { id: acct.id }, false);
    const t = await sGet(TK(acct.team), true);
    const ps = await refresh();
    setMe(acct); setTeam(t || null); setRoster(teamsOf(acct)[0] ? ps.filter((x) => inTeam(x, teamsOf(acct)[0])) : [acct]);
    const l = acct.logs?.[today()] || {}; setLog(l); setSavedLog(l); setTitleEdit(acct.title || "");
    setPhase("app"); setBusy(false);
  };

  const restoreByRecovery = async () => {
    setBusy(true); setErr("");
    const acct = await findByRecovery(fRecovery);
    if (!acct) { setErr("No account matches that recovery code."); setBusy(false); return; }
    await sSet(ME, { id: acct.id }, false);
    const t = await sGet(TK(acct.team), true);
    const ps = await refresh();
    setMe(acct); setTeam(t || null); setRoster(teamsOf(acct)[0] ? ps.filter((x) => inTeam(x, teamsOf(acct)[0])) : [acct]);
    const l = acct.logs?.[today()] || {}; setLog(l); setSavedLog(l); setTitleEdit(acct.title || "");
    setPhase(t ? "app" : "landing"); setBusy(false);
  };

  const saveToday = async () => {
    if (!me) return; setSaving(true);
    const fresh = (await sGet(PK(me.id), true)) || me;
    const { grat, mood, ...syncLog } = log;
    syncLog.src = "manual"; // wearable-sync ready: synced categories will tag "watch"
    const upd = { ...fresh, logs: { ...(fresh.logs || {}), [today()]: syncLog } };
    if ((await sSet(PK(me.id), upd, true)) === "local") setLocalOnly(true);
    if (grat !== undefined || mood !== undefined) { const prev = gv(gratMap[today()]); const g = { ...gratMap, [today()]: { t: grat ?? prev.t ?? "", mood: mood ?? prev.mood ?? null } }; setGratMap(g); sSet(GK, g, false); }
    const newly = CHALLENGES.filter((c) => c.done(log) && !c.done(savedLog));
    const posts = [];
    if (dayScore(savedLog) === 0 && dayScore(log) > 0 && newly.length === 0) for (const tc of teamsOf(me)) posts.push(feedPost(tc, { pid: me.id, name: me.name, icon: "check", text: `logged their day · ${dayScore(log).toLocaleString()} pts` }));
    for (const c of newly) for (const tc of teamsOf(me)) posts.push(feedPost(tc, { pid: me.id, name: me.name, icon: c.icon, text: c.id === "c_wild" ? `nailed the wildcard: ${wildcardOf(today())}` : c.id === "c_custom" ? `checked in on “${team?.custom?.title || "the team pick"}” — +100` : `${c.name.toLowerCase().replace("hit ", "hit ").replace("complete a", "completed a")} — +${c.bonus}` }));
    /* ---- Castle Wars: milestone crossings draw cards ---- */
    try {
      const crossings = cwCrossings(savedLog, log);
      if (crossings.length > 0) {
        const myCodes = teamsOf(me);
        let toastCards = null;
        for (const tc of myCodes) {
          const tObj = allTeams.find((x) => x.code === tc);
          const key = CWK(tc, weekKeys(0)[0]);
          const cwFresh = (await sGet(key, true)) || cwBlank();
          cwFresh.drawn = cwFresh.drawn || {};
          const drawnCards = [];
          for (const x of crossings) {
            const dKey = `${me.id}|${today()}|${x.cat}|${x.thr}`;
            if (cwFresh.drawn[dKey]) continue;
            cwFresh.drawn[dKey] = true;
            let card = cwRoll(x.thr);
            if (tObj && MODE_OF(tObj) === "party") { let guard = 0; while (!CW_PARTY_FX.includes(card.fx) && guard++ < 60) card = cwRoll(x.thr); }
            cwFresh.bank = [...(cwFresh.bank || []), { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, cardId: card.id, pid: me.id, ts: Date.now() }];
            drawnCards.push(card);
          }
          if (drawnCards.length > 0) {
            await sSet(key, cwFresh, true);
            if (tc === team?.code) { setCwMine(cwFresh); toastCards = drawnCards; }
            else if (!toastCards) toastCards = drawnCards;
            posts.push(feedPost(tc, { pid: me.id, name: me.name, icon: "bolt", text: `earned ${drawnCards.length === 1 ? `a card — ${drawnCards[0].name}` : `${drawnCards.length} cards`}` }));
          }
        }
        if (toastCards) setDrawToast(toastCards);
      }
    } catch { }
    await Promise.all(posts);
    setMe(upd); setSavedLog(log); setFlash(true); buzz([18, 40, 18]); setTimeout(() => setFlash(false), 1600); refresh(); setSaving(false);
  };
  const saveTitle = async (t) => {
    if (!me) return;
    const fresh = (await sGet(PK(me.id), true)) || me; const upd = { ...fresh, title: t };
    if ((await sSet(PK(me.id), upd, true)) === "local") setLocalOnly(true);
    setMe(upd); refresh();
  };
  const saveAvatar = async (patch) => {
    if (!me) return;
    const fresh = (await sGet(PK(me.id), true)) || me; const upd = { ...fresh, ...patch };
    if ((await sSet(PK(me.id), upd, true)) === "local") setLocalOnly(true);
    setMe(upd); refresh();
  };
  const deleteProfile = async () => {
    if (!me) return;
    const last = team && roster.length <= 1;
    const msg = last
      ? `Delete your account permanently? You're the last member of ${team.name}, so the team will be disbanded too. Your logs, streaks and history will be gone for good. This cannot be undone.`
      : "Delete your account permanently? Your logs, streaks and history will be gone for good, and you'll be removed from your team. This cannot be undone.";
    if (!confirm(msg)) return;
    if (!confirm("Last chance — really delete everything?")) return;
    if (team && last) { for (const k of [TK(team.code), FK(team.code), CK(team.code), AK(team.code)]) await sDel(k, true); }
    else if (team) { feedPost(team.code, { pid: me.id, name: me.name, icon: "flag", text: "left the team" }); }
    await sDel(PK(me.id), true);
    await sDel(ME, false);
    try { localStorage.removeItem(GK); localStorage.removeItem("rt1:mood"); } catch { }
    setMe(null); setTeam(null); setRoster([]); setLog({}); setSavedLog({}); setGratMap({}); setMoodMap({}); setPhase("landing");
  };

  const logout = async () => {
    if (!confirm("Log out on this device? Your account stays safe — log back in with your name and passcode.")) return;
    await sDel(ME, false); setMe(null); setTeam(null); setRoster([]); setLog({}); setSavedLog({}); setPhase("landing"); setTab("home");
  };
  const saveRename = async (newName) => {
    const nm = newName.trim();
    if (nm.length < 2) return "Name is too short.";
    if (allPlayers.some((p) => p.id !== me.id && p.name.toLowerCase() === nm.toLowerCase())) return "That name's taken by another player — names are unique across Rally.";
    const fresh = (await sGet(PK(me.id), true)) || me; const upd = { ...fresh, name: nm };
    if ((await sSet(PK(me.id), upd, true)) === "local") setLocalOnly(true);
    setMe(upd); refresh(); return null;
  };
  /* Optimistic prefs: update UI instantly, persist once after typing settles.
     The old await-before-setMe pattern made every keystroke race the last one —
     the composite ft/in height inputs corrupted themselves on fast typing. */
  const prefsTimer = useRef(null);
  const queuePrefsPersist = (upd) => {
    clearTimeout(prefsTimer.current);
    prefsTimer.current = setTimeout(async () => {
      try {
        const fresh = (await sGet(PK(upd.id), true)) || upd;
        const merged = { ...fresh, health: upd.health, units: upd.units };
        if ((await sSet(PK(upd.id), merged, true)) === "local") setLocalOnly(true);
      } catch { }
    }, 600);
  };
  const savePrefsHealth = (patch) => {
    setMe((m) => { const upd = { ...m, health: { ...(m.health || {}), ...patch } }; queuePrefsPersist(upd); return upd; });
  };
  const savePrefs = (patch) => {
    setMe((m) => { const upd = { ...m, units: { ...(m.units || {}), ...patch } }; queuePrefsPersist(upd); return upd; });
  };
  const saveTeamCustom = async (custom) => {
    if (!team) return;
    const fresh = (await sGet(TK(team.code), true)) || team; const upd = { ...fresh, custom };
    if ((await sSet(TK(team.code), upd, true)) === "local") setLocalOnly(true);
    setTeam(upd); refresh();
    if (custom) feedPost(team.code, { pid: me?.id, name: me?.name || "Someone", icon: "goals", text: `pitched a team challenge: “${custom.title}” — ${custom.days} days!` });
  };
  const saveTeamEmblem = async (patch) => {
    if (!team) return;
    const fresh = (await sGet(TK(team.code), true)) || team; const upd = { ...fresh, ...patch };
    if ((await sSet(TK(team.code), upd, true)) === "local") setLocalOnly(true);
    setTeam(upd); refresh();
  };
  const leave = async () => {
    if (!me) return;
    if (!confirm("Leave this team? Your account, logs and streaks stay with you — you can join or start another team right away.")) return;
    const fresh = (await sGet(PK(me.id), true)) || me;
    const rem = teamsOf(fresh).filter((c) => c !== team.code);
    const sm = { ...(fresh.sinceMap || {}) }; delete sm[team.code];
    const upd = { ...fresh, teams: rem, team: rem[0] || null, sinceMap: sm };
    await sSet(PK(me.id), upd, true);
    const nxt = teamsOf(upd)[0] ? allTeams.find((x) => x.code === teamsOf(upd)[0]) : null;
    if (nxt) localStorage.setItem("rt1:active", nxt.code);
    setMe(upd); setTeam(nxt || null); setRoster(nxt ? allPlayers.filter((x) => inTeam(x, nxt.code)) : [upd]); setPhase("app"); refresh();
  };

  /* Adopt a team onto an EXISTING account (from pickteam) */
  const adoptGuard = useRef(false);
  const adoptTeam = async (code, newTeamName = null, isPublic = false, directTeam = null, mode = "battle") => {
    if (adoptGuard.current) return; adoptGuard.current = true; setTimeout(() => { adoptGuard.current = false; }, 2500);
    setBusy(true); setErr("");
    let t;
    if (directTeam) {
      t = directTeam;
    } else if (newTeamName) {
      const c = code5();
      t = { code: c, name: newTeamName.trim(), created: Date.now(), founder: me.id, public: !!isPublic, mode };
      await sSet(TK(c), t, true);
    } else {
      t = await sGet(TK(code.toUpperCase()), true);
      if (!t) { setErr("No team found with that code."); setBusy(false); return; }
    }
    const fresh = (await sGet(PK(me.id), true)) || me;
    const nteams = [...new Set([...teamsOf(fresh), t.code])];
    const upd = { ...fresh, teams: nteams, team: nteams[0], since: fresh.since || today(), sinceMap: { ...(fresh.sinceMap || {}), [t.code]: today() } };
    localStorage.setItem("rt1:active", t.code);
    await sSet(PK(me.id), upd, true);
    feedPost(t.code, { pid: me.id, name: me.name, icon: newTeamName ? "flag" : "team", text: newTeamName ? `founded ${t.name}` : "joined the team" });
    const ps = await refresh();
    setMe(upd); setTeam(t); setRoster([...(ps.filter((x) => inTeam(x, t.code) && x.id !== me.id)), upd]); setPhase("app"); setBusy(false);
  };

  /* Founder-only disband: orphans members gracefully, wipes team rows */
  const disband = async () => {
    if (!team || !me) return;
    if (!confirm(`Disband ${team.name} for everyone? Each member keeps their own account, logs and streaks — they'll just pick a new team. This can't be undone.`)) return;
    const ps = await refresh();
    for (const p of ps.filter((x) => inTeam(x, team.code))) {
      const rem2 = teamsOf(p).filter((c) => c !== team.code);
      const sm2 = { ...(p.sinceMap || {}) }; delete sm2[team.code];
      const upd = { ...p, teams: rem2, team: rem2[0] || null, sinceMap: sm2 };
      await sSet(PK(p.id), upd, true);
    }
    for (const k of [TK(team.code), FK(team.code), CK(team.code), AK(team.code)]) await sDel(k, true);
    const remM = teamsOf(me).filter((c) => c !== team.code);
    const smM = { ...(me.sinceMap || {}) }; delete smM[team.code];
    const meFresh = { ...me, teams: remM, team: remM[0] || null, sinceMap: smM };
    const nxt2 = teamsOf(meFresh)[0] ? allTeams.find((x) => x.code === teamsOf(meFresh)[0]) : null;
    if (nxt2) localStorage.setItem("rt1:active", nxt2.code);
    setMe(meFresh); setTeam(nxt2 || null); setRoster(nxt2 ? allPlayers.filter((x) => inTeam(x, nxt2.code)) : [meFresh]); setPhase("app"); refresh();
  };

  useEffect(() => {
    if (!team || roster.length === 0) return;
    const tc = teamChallengeOf(today());
    const target = tc.per * Math.max(roster.length, 1);
    const val = roster.reduce((s, p) => s + tc.get(p.logs?.[today()] || {}), 0);
    const mine = awards[team.code] || {};
    if (val >= target && !mine[today()]) {
      const upd = { ...mine, [today()]: 300 };
      setAwards((a) => ({ ...a, [team.code]: upd }));
      sSet(AK(team.code), upd, true);
      feedPost(team.code, { pid: me?.id, name: team.name, icon: "trophy", text: `completed the team challenge — +300 banked!` });
    }
  }, [roster, team]); // eslint-disable-line

  const dirty = JSON.stringify(log) !== JSON.stringify(savedLog);
  const myScore = dayScore(log);

  const monthOf = (p) => Object.entries(p.logs || {}).filter(([d]) => d.startsWith(mKey()));
  const totalOf = (p) => monthOf(p).reduce((s, [d, l]) => s + (sinceOk(p, d) ? dayScore(l) : 0), 0);
const allTimeOf = (p) => Object.entries(p.logs || {}).reduce((s, [d, l]) => s + (sinceOk(p, d) ? dayScore(l) : 0), 0);

/* ---- Weekly battle window (Mon–Sun) ---- */
const weekStartOf = (d = new Date()) => { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); x.setHours(0, 0, 0, 0); return x; };
const dk = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const weekKeys = (offset = 0) => { const s = weekStartOf(); s.setDate(s.getDate() + offset * 7); return Array.from({ length: 7 }, (_, i) => { const d = new Date(s); d.setDate(s.getDate() + i); return dk(d); }); };

const weekPtsOf = (p, keys) => keys.reduce((s, k) => s + (p.logs?.[k] && sinceOk(p, k) ? dayScore(p.logs[k]) : 0), 0);
const battleEndsIn = () => { const end = weekStartOf(); end.setDate(end.getDate() + 7); const ms = end - Date.now(); const d = Math.floor(ms / 86400000), h = Math.floor((ms % 86400000) / 3600000); return d > 0 ? `${d}d ${h}h` : `${h}h ${Math.floor((ms % 3600000) / 60000)}m`; };
const awardDateOf = (k) => k.startsWith("w:") ? k.slice(2) : k.startsWith("cw:") ? k.slice(3, 13) : k;
const weekAwards = (aw = {}, keys) => Object.entries(aw).reduce((s, [k, v]) => s + (keys.includes(awardDateOf(k)) ? v : 0), 0);
  const ranked = useMemo(() => { const wkeys = weekKeys(0); const members = team ? allPlayers.filter((p) => inTeam(p, team.code)) : [me].filter(Boolean); return [...members].map((p) => ({ ...p, total: rankMode === "all" ? allTimeOf(p) : rankMode === "week" ? weekPtsOf(p, wkeys) : totalOf(p), days: rankMode === "all" ? Object.keys(p.logs || {}).length : monthOf(p).length })).sort((a, b) => b.total - a.total); }, [allPlayers, team, me, rankMode]);
  const teamTotal = ranked.reduce((s, p) => s + p.total, 0) + (team ? Object.values(awards[team.code] || {}).reduce((s, v) => s + v, 0) : 0);
  const globalBoard = useMemo(() => {
    const by = {};
    const monthKey = today().slice(0, 7);
    const wkeys = weekKeys(0);
    for (const p of allPlayers) { for (const tc of teamsOf(p)) { by[tc] = by[tc] || { total: 0, count: 0 }; by[tc].total += (rankMode === "all" ? allTimeOf(p) : rankMode === "week" ? weekPtsOf(p, wkeys) : totalOf(p)); by[tc].count++; } }
    return [...allTeams].filter((t) => (by[t.code]?.count || 0) > 0).map((t) => { const base = by[t.code] || { total: 0, count: 0 }; const aw = awards[t.code] || {}; const bonus = Object.entries(aw).reduce((s, [d, v]) => s + ((rankMode === "all" || awardDateOf(d).slice(0, 7) === monthKey) ? v : 0), 0); return { ...t, ...base, total: base.count > 0 ? base.total + bonus : 0 }; }).sort((a, b) => b.total - a.total);
  }, [allPlayers, allTeams, awards, rankMode]);
  const myRank = team ? (globalBoard.findIndex((t) => t.code === team.code) + 1) || null : null;
  const weekBoard = useMemo(() => {
    const keys = weekKeys(0);
    const by = {};
    for (const p of allPlayers) { for (const tc of teamsOf(p)) by[tc] = (by[tc] || 0) + weekPtsOf(p, keys); }
    const cnt = {}; for (const p of allPlayers) cnt[p.team] = (cnt[p.team] || 0) + 1;
    return [...allTeams].map((t) => ({ ...t, wk: cnt[t.code] ? (by[t.code] || 0) + weekAwards(awards[t.code], keys) : 0 })).sort((a, b) => b.wk - a.wk);
  }, [allPlayers, allTeams, awards]);
  const myTeams = useMemo(() => teamsOf(me).map((c) => allTeams.find((t) => t.code === c)).filter(Boolean), [me, allTeams]);
  const selectTeam = (t) => {
    if (!t || t.code === team?.code) return;
    localStorage.setItem("rt1:active", t.code);
    setTeam(t); setRoster(allPlayers.filter((p) => inTeam(p, t.code)));
    setCwMine(null); setCwFoe(null);
    sGet(FK(t.code), true).then((f) => setFeed(f || []));
    sGet(CK(t.code), true).then((c) => setChat(c || []));
  };
  const rivalOf = useMemo(() => {
    if (!team || MODE_OF(team) !== "battle") return null;
    const bTeams = allTeams.filter((t) => MODE_OF(t) === "battle" && allPlayers.some((p) => inTeam(p, t.code)));
    if (bTeams.length < 2) return null;
    const prevKeys = weekKeys(-1);
    const by = {};
    for (const p of allPlayers) { for (const tc of teamsOf(p)) by[tc] = (by[tc] || 0) + weekPtsOf(p, prevKeys); }
    const pairs = cwBracket(bTeams.map((t) => ({ code: t.code, pts: (by[t.code] || 0) + weekAwards(awards[t.code] || {}, prevKeys) })));
    const rc = pairs[team.code];
    if (!rc) return null; // bye week
    return weekBoard.find((t) => t.code === rc) || null;
  }, [allTeams, allPlayers, awards, weekBoard, team]);

  /* ---- Castle Wars: load both siege states for the current week ---- */
  const cwWeekKey = weekKeys(0)[0];
  useEffect(() => {
    if (!team) { setCwMine(null); setCwFoe(null); return; }
    let live = true;
    sGet(CWK(team.code, cwWeekKey), true).then((v) => { if (live) setCwMine(v || cwBlank()); });
    if (rivalOf) sGet(CWK(rivalOf.code, cwWeekKey), true).then((v) => { if (live) setCwFoe(v || cwBlank()); });
    else setCwFoe(null);
    return () => { live = false; };
  }, [team?.code, rivalOf?.code, cwWeekKey, cwTick]); // eslint-disable-line

  const cwDayBaseOf = useCallback((code, dayK) => allPlayers.filter((p) => inTeam(p, code)).reduce((s, p) => s + (p.logs?.[dayK] && sinceOk(p, dayK, code) ? dayScore(p.logs[dayK]) : 0), 0), [allPlayers]);
  const cwRosterN = useCallback((code) => Math.max(1, allPlayers.filter((p) => inTeam(p, code)).length), [allPlayers]);
  const cwPerCapita = useMemo(() => !!(team && rivalOf && Math.abs(cwRosterN(team.code) - cwRosterN(rivalOf.code)) >= 2), [team, rivalOf, cwRosterN]);
  const cwBase = useCallback((code, dayK) => { const raw = cwDayBaseOf(code, dayK); return cwPerCapita ? Math.round(raw / cwRosterN(code)) : raw; }, [cwDayBaseOf, cwPerCapita, cwRosterN]);
  const cwCapNow = useMemo(() => team ? cwCap(roster.length, rivalOf ? allPlayers.filter((p) => inTeam(p, rivalOf.code)).length : roster.length) : CW_CFG.capFloor, [team, roster, rivalOf, allPlayers]);
  const cwSiege = useMemo(() => {
    if (!team || !rivalOf) return null;
    const born = [team.created, rivalOf.created].filter(Boolean).map((ts) => dk(new Date(ts))).sort().pop() || null;
    return cwWeekState(weekKeys(0), cwMine || cwBlank(), cwFoe || cwBlank(), team.code, rivalOf.code, cwBase, cwCapNow, born);
  }, [team, rivalOf, cwMine, cwFoe, cwBase, cwCapNow]); // eslint-disable-line
  const cwLive = useMemo(() => {
    if (!team || !rivalOf) return null;
    return cwResolveDay(today(), weekKeys(0), cwMine || cwBlank(), cwFoe || cwBlank(), team.code, rivalOf.code, cwBase(team.code, today()), cwBase(rivalOf.code, today()), cwCapNow);
  }, [team, rivalOf, cwMine, cwFoe, cwBase, cwCapNow]); // eslint-disable-line
  const cwUsedToday = useMemo(() => {
    const played = (cwMine?.played || []).filter((p) => p.day === today());
    return Math.min(cwCapNow, played.reduce((s, p) => s + (cwCardOf(p.cardId)?.m || 0), 0));
  }, [cwMine, cwCapNow]);
  const cwIntelOn = !!(cwMine?.intel?.[today()]);
  const cwMyDragon = useMemo(() => cwSiege ? cwDragonOn(weekKeys(0), cwFoe, cwMine) : false, [cwSiege, cwFoe, cwMine]); // eslint-disable-line
  const cwFoeDragon = useMemo(() => cwSiege ? cwDragonOn(weekKeys(0), cwMine, cwFoe) : false, [cwSiege, cwMine, cwFoe]); // eslint-disable-line

  /* Per-tower bounty: each tower won banks a rising share of the rival's
     weekly points (2/3/4/6% — 15% max). Added to the victor, never taken
     from anyone. Idempotent per tower per week. */
  useEffect(() => {
    if (!cwSiege || !team || !rivalOf || !me) return;
    const mine = awards[team.code] || {};
    const upd = { ...mine };
    let changed = false;
    for (let n = 1; n <= cwSiege.myWins; n++) {
      const k = `cw:${cwWeekKey}:t${n}`;
      if (upd[k]) continue;
      const b = Math.max(25, Math.round((rivalOf.wk || 0) * CW_CFG.towerBounty[n - 1]));
      upd[k] = b; changed = true;
      const toppled = n >= CW_CFG.towers;
      feedPost(team.code, { pid: me.id, name: team.name, icon: "trophy", text: toppled ? `toppled ${rivalOf.name}'s castle! Final tower bounty +${b.toLocaleString()}` : `knocked down ${rivalOf.name}'s tower ${n} — bounty +${b.toLocaleString()}` });
      chatPost(team.code, { cw: true, name: "Castle Wars", text: toppled ? `${rivalOf.name}'s castle has FALLEN. Final bounty +${b.toLocaleString()} banked — walls rebuild Monday.` : `Tower down! ${rivalOf.name} is at ${CW_CFG.towers - n} — bounty +${b.toLocaleString()} banked.` }).then((c) => c && setChat(c));
      chatPost(rivalOf.code, { cw: true, name: "Castle Wars", text: toppled ? `Your castle has fallen to ${team.name}. Walls rebuild Monday — make them pay for it.` : `${team.name} took one of your towers. ${CW_CFG.towers - n} still stand — hold the line.` });
    }
    if (changed) { setAwards((a) => ({ ...a, [team.code]: upd })); sSet(AK(team.code), upd, true); }
  }, [cwSiege?.myWins, team?.code, rivalOf?.code]); // eslint-disable-line

  /* Party mode: play a card at a teammate (or for yourself) */
  const partyPlay = async (inst, targetPid) => {
    if (!team || !me || cwBusyId) return;
    const card = cwCardOf(inst.cardId); if (!card || !CW_PARTY_FX.includes(card.fx)) return;
    setCwBusyId(inst.id);
    try {
      const key = CWK(team.code, cwWeekKey);
      const fresh = (await sGet(key, true)) || cwBlank();
      if (!(fresh.bank || []).some((b) => b.id === inst.id)) { setCwMine(fresh); setCwBusyId(null); return; }
      fresh.bank = fresh.bank.filter((b) => b.id !== inst.id);
      fresh.played = [...(fresh.played || []), { id: inst.id, cardId: inst.cardId, pid: me.id, day: today(), ts: Date.now(), target: targetPid || undefined }];
      const wrote = await sSet(key, fresh, true); setCwMine(fresh);
      if (wrote === "local") feedPost(team.code, { pid: me.id, name: me.name, icon: "bolt", text: `${card.name} may not have synced — check your connection` });
      setTimeout(async () => { /* reconcile: only adopt server state if it's at least as new as ours */
        try { const srv = await sGet(key, true); if (srv && (srv.played || []).length >= (fresh.played || []).length) setCwMine(srv); } catch { }
        setCwTick((t) => t + 1);
      }, 900);
      buzz([14, 30, 14]);
      const tname = targetPid ? (roster.find((p) => p.id === targetPid)?.name || "a teammate") : null;
      const msg = card.fx === "atk" ? `${me.name} surged ahead with ${card.name}!`
        : card.fx === "hit" ? `${me.name} bonked ${tname} with ${card.name}!`
        : card.fx === "siphon" ? `${me.name} pickpocketed ${tname} with ${card.name}!`
        : card.fx === "block" ? `${me.name} raised ${card.name} — try them now.`
        : `${me.name} played ${card.name}. It does nothing. You have all been notified.`;
      const n = await chatPost(team.code, { cw: true, name: "Party games", text: msg });
      if (n) setChat(n);
      feedPost(team.code, { pid: me.id, name: me.name, icon: "bolt", text: `played ${card.name} in the party` });
    } catch { }
    setCwBusyId(null);
  };

  /* Play a card from the armoury */
  const cwPlay = async (inst) => {
    if (!team || !rivalOf || !me || cwBusyId) return;
    const card = cwCardOf(inst.cardId); if (!card) return;
    setCwBusyId(inst.id);
    try {
      const key = CWK(team.code, cwWeekKey);
      const fresh = (await sGet(key, true)) || cwBlank();
      if (!(fresh.bank || []).some((b) => b.id === inst.id)) { setCwMine(fresh); setCwBusyId(null); return; } // already played elsewhere
      fresh.bank = fresh.bank.filter((b) => b.id !== inst.id);
      let msg = "";
      if (card.fx === "steal") {
        const fKey = CWK(rivalOf.code, cwWeekKey);
        const foeFresh = (await sGet(fKey, true)) || cwBlank();
        let pool = foeFresh.bank || [];
        const lifted = [];
        for (let k = 0; k < (card.m || 1) && pool.length > 0; k++) {
          const take = pool[Math.floor(Math.random() * pool.length)];
          pool = pool.filter((b) => b.id !== take.id);
          lifted.push(cwCardOf(take.cardId)?.name || "a card");
          fresh.bank.push({ ...take, pid: me.id, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${k}` });
        }
        foeFresh.bank = pool;
        if (lifted.length > 0) {
          await sSet(fKey, foeFresh, true); setCwFoe(foeFresh);
          msg = `${me.name}'s ${card.name} lifted ${lifted.map((n) => `“${n}”`).join(" and ")} from ${rivalOf.name}'s armoury!`;
        } else msg = `${me.name}'s ${card.name} found ${rivalOf.name}'s armoury empty. Awkward.`;
        fresh.played = [...(fresh.played || []), { id: inst.id, cardId: inst.cardId, pid: me.id, day: today(), ts: Date.now(), target: rivalOf.code }];
      } else if (card.fx === "intel") {
        fresh.intel = { ...(fresh.intel || {}), [today()]: me.id };
        fresh.played = [...(fresh.played || []), { id: inst.id, cardId: inst.cardId, pid: me.id, day: today(), ts: Date.now(), target: rivalOf.code }];
        msg = `${me.name} sent a falcon over ${rivalOf.name}'s walls — their card bank is revealed today.`;
      } else {
        let mv = null, gTxt = "";
        if (card.fx === "gamble") {
          const win = Math.random() < 0.5;
          mv = win ? card.m * 2 : (card.gl ? -card.gl : 0);
          gTxt = win ? `the coin landed — DOUBLE! ${card.name} hits for ${card.m * 2}%!` : (card.gl ? `the coin betrayed them — ${card.name} backfires for −${card.gl}%.` : `the coin landed on nothing. ${card.name} fizzles.`);
        }
        if (card.fx === "chain") {
          const loggedN = roster.filter((p) => p.logs?.[today()]).length || 1;
          mv = card.m * loggedN;
          gTxt = `${card.name} — ${loggedN} teammate${loggedN === 1 ? "" : "s"} answered: +${mv}!`;
        }
        fresh.played = [...(fresh.played || []), { id: inst.id, cardId: inst.cardId, pid: me.id, day: today(), ts: Date.now(), target: rivalOf.code, ...(mv != null ? { mv } : {}) }];
        const pfx = (v) => card.pct ? `${v}% of their round` : `${v}`;
        msg = card.fx === "gamble" || card.fx === "chain" ? `${me.name} played ${card.name} — ${gTxt}`
          : card.fx === "joke" ? `${me.name} played ${card.name}. ${card.fl}`
          : card.fx === "reflect" ? `${me.name} raised ${card.name} — the next attack bounces back!`
          : card.fx === "lock" ? `${me.name} played ${card.name} — ${rivalOf.name}'s next card slips away!`
          : card.fx === "atk" ? `${me.name} played ${card.name} — +${pfx(card.m)} to the round!`
          : card.fx === "hit" ? `${me.name} launched ${card.name} at ${rivalOf.name} — −${card.pct ? card.m + "% of their round" : card.m}!`
          : card.fx === "siphon" ? `${me.name}'s ${card.name} siphoned ${card.pct ? card.m + "% of the round" : card.m + " round-points"} from ${rivalOf.name}!`
          : card.fx === "buff" ? `${me.name} sounded the Rally Horn — the squad's cards hit double today!`
          : card.fx === "threat" ? `${me.name}'s dragon is perched on ${rivalOf.name}'s tower — −${card.m} a day until they shoo it!`
          : card.fx === "blockall" ? `${me.name} summoned a Tempest — nothing gets through today.`
          : ["block", "cleanse"].includes(card.fx) ? `${me.name} raised ${card.name} — the walls hold.`
          : card.fx === "delay" ? `${me.name} deployed the War Snail. It'll get there. Eventually.`
          : `${me.name} played ${card.name}. The rival hears… something.`;
      }
      const wrote = await sSet(key, fresh, true); setCwMine(fresh);
      if (wrote === "local") feedPost(team.code, { pid: me.id, name: me.name, icon: "bolt", text: `${card.name} may not have synced — check your connection` });
      setTimeout(async () => { /* reconcile: only adopt server state if it's at least as new as ours */
        try { const srv = await sGet(key, true); if (srv && (srv.played || []).length >= (fresh.played || []).length) setCwMine(srv); } catch { }
        setCwTick((t) => t + 1);
      }, 900);
      if (["atk", "hit", "siphon", "threat", "delay", "joke"].includes(card.fx)) { setCwFx({ e: card.e, boom: ["hit", "siphon", "threat"].includes(card.fx) }); buzz([14, 30, 14]); }
      if (["hit", "siphon", "threat"].includes(card.fx)) { setCwShake(true); setTimeout(() => setCwShake(false), 700); }
      const n = await chatPost(team.code, { cw: true, name: "Castle Wars", text: msg });
      if (n) setChat(n);
      chatPost(rivalOf.code, { cw: true, name: "Castle Wars", text: msg });
      feedPost(team.code, { pid: me.id, name: me.name, icon: "bolt", text: `played ${card.name} in the siege` });
    } catch { }
    setCwBusyId(null);
  };
  const lastWeekResult = useMemo(() => {
    if (!team || allTeams.length < 2) return null;
    const keys = weekKeys(-1);
    const by = {};
    for (const p of allPlayers) { for (const tc of teamsOf(p)) by[tc] = (by[tc] || 0) + weekPtsOf(p, keys); }
    const board = [...allTeams].map((t) => ({ code: t.code, name: t.name, wk: (by[t.code] || 0) + weekAwards(awards[t.code] || {}, keys) })).sort((a, b) => b.wk - a.wk);
    if (board.every((t) => t.wk === 0)) return null;
    const winner = board[0]; const mine = board.find((t) => t.code === team.code);
    return { won: winner.code === team.code, winner: winner.name, myPts: mine?.wk || 0, topPts: winner.wk, weekKey: keys[0] };
  }, [allPlayers, allTeams, awards, team]);
  useEffect(() => {
    if (!me?.id || !lastWeekResult || !lastWeekResult.won) return;
    const k = `rt1:winSeen:${me.id}:${lastWeekResult.weekKey}`;
    if (localStorage.getItem(k)) return;
    localStorage.setItem(k, "1");
    fireCeleb("team-victory", "WEEKLY VICTORY", `${team?.name || "Your team"} won the week!`);
  }, [lastWeekResult, me?.id]); // eslint-disable-line

  /* Weekly win prize: +500 banked once, idempotent by week key */
  useEffect(() => {
    if (!lastWeekResult?.won || !team) return;
    const k = `w:${lastWeekResult.weekKey}`;
    const mine = awards[team.code] || {};
    if (mine[k]) return;
    const upd = { ...mine, [k]: 500 };
    setAwards((a) => ({ ...a, [team.code]: upd }));
    sSet(AK(team.code), upd, true);
    feedPost(team.code, { pid: me?.id, name: team.name, icon: "trophy", text: `won last week's battle — +500 banked!` });
  }, [lastWeekResult, team]); // eslint-disable-line

  const gearOf = (p) => {
    const es = monthOf(p);
    const steps = es.reduce((s, [, l]) => s + (Number(l.steps) || 0), 0);
    const woMin = es.reduce((s, [, l]) => s + (Number(l.workoutMin) || 0), 0);
    const woDays = es.filter(([, l]) => l.workoutDone || (l.workoutSets?.length)).length;
    const med = es.reduce((s, [, l]) => s + (Number(l.meditation) || 0), 0);
    const mind = es.reduce((s, [, l]) => s + (Number(l.reading) || 0), 0) / 10 + es.filter(([, l]) => l.journal).length;
    return {
      boots: tierOf(steps, 70000, 150000, 250000),
      chest: tierOf(woDays * 60 + woMin, 300, 800, 1500),
      aura: tierOf(med, 60, 150, 300),
      sigil: tierOf(mind, 8, 18, 30),
      raw: { steps, woMin, woDays, med, mind: Math.round(mind) },
    };
  };
  const bestLifts = (p) => {
    const pr = {};
    for (const [, l] of monthOf(p)) for (const e of (l.workoutSets || [])) if (e.type === "strength" && e.weight) { if (!pr[e.name] || e.weight > pr[e.name].weight) pr[e.name] = { weight: e.weight, reps: e.reps }; }
    return Object.entries(pr).sort((a, b) => b[1].weight - a[1].weight).slice(0, 5);
  };
  const autoTag = (p) => {
    const best = CATS.map((c) => ({ c, v: monthOf(p).reduce((s, [, l]) => s + catPts(c.id, l), 0) })).sort((a, b) => b.v - a.v)[0];
    if (!best || best.v === 0) return "Rookie";
    return { steps: "Distance Dealer", water: "Hydro Specialist", sleep: "Recovery Unit", workout: "Iron Engine", meditation: "Calm Operator", reading: "Deep Reader", journal: "Chronicler" }[best.c.id];
  };

  const copyCode = async () => { try { await navigator.clipboard.writeText(team.code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { } };
  const inputNum = (k, v, max = 999999) => setLog((l) => ({ ...l, [k]: Math.max(0, Math.min(max, Number(v) || 0)) }));
  const stepUnit = (id, dir, c) => { buzz(11); setLog((l) => ({ ...l, [id]: Math.max(0, Math.round(((Number(l[id]) || 0) + dir * c.step) * 10) / 10) })); };

  return (
    <div style={{ minHeight: "100vh", background: CREAM, color: INK, fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@500;600;700;800&display=swap');
        *{box-sizing:border-box} input,button{font-family:inherit;color:inherit}
        .rp{background:${CARD};border:none;border-radius:28px;box-shadow:0 6px 24px rgba(90,74,48,.07)}
        .rh{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;letter-spacing:-.02em}
        .rlabel{font-size:11px;font-weight:800;letter-spacing:.09em;color:${MUT};text-transform:uppercase}
        .rbtn{background:${INK};border:none;color:#fff;font-weight:700;font-size:15px;padding:15px 18px;border-radius:99px;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;width:100%;transition:transform .1s ease}
        .rbtn:active:not(:disabled){transform:scale(.98)} .rbtn:disabled{opacity:.4;cursor:default}
        .rbtn2{background:${CARD};border:none;color:${INK};font-weight:700;font-size:15px;padding:15px 18px;border-radius:99px;cursor:pointer;width:100%;font-family:'Plus Jakarta Sans',sans-serif;box-shadow:0 4px 16px rgba(90,74,48,.1)}
        .rin{background:#F6F0E6;border:1.5px solid transparent;border-radius:16px;padding:13px 15px;font-size:16px;font-weight:600;width:100%}
        .rin::placeholder{color:#B5AC99} .rin:focus{outline:none;border-color:${FOREST};background:#fff}
        .rpill{background:#F1EADD;border:none;border-radius:12px;padding:10px 14px;font-weight:800;font-size:14px;cursor:pointer;color:#6A6250}
        .rpill:active{transform:scale(.95)} .rpill:disabled{opacity:.4;cursor:default}
        .rchip{background:#F1EADD;border:1.5px solid transparent;border-radius:99px;padding:7px 13px;font-weight:700;font-size:12.5px;cursor:pointer;color:${MUT}}
        .rchip.on{background:${FOREST};color:#FFF}
        .rtap{cursor:pointer;transition:transform .1s ease} .rtap:active{transform:scale(.97)}
        button:focus-visible,input:focus-visible,.rtap:focus-visible{outline:2.5px solid ${AMBER};outline-offset:2px}
        .rnav{position:fixed;left:16px;right:16px;bottom:14px;background:${INK};border-radius:99px;display:flex;justify-content:space-around;padding:8px 10px;z-index:30;box-shadow:0 10px 30px rgba(38,43,34,.35);max-width:528px;margin:0 auto}
        .rnav button{background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2.5px;font-weight:800;font-size:9.5px;letter-spacing:.02em;color:#8E9284;padding:8px 0;border-radius:99px;flex:1;max-width:96px;margin:0 2px}
        .rnav button.on{color:#FFF;background:${FOREST}}
        .rsave{position:fixed;left:0;right:0;bottom:96px;display:flex;justify-content:center;padding:0 16px;z-index:29}
        .rsave .rbtn{font-size:16px;padding:16px 0;background:linear-gradient(160deg,#F09A4C,#E0762E);box-shadow:0 12px 30px rgba(200,100,30,.4), 0 3px 8px rgba(160,80,20,.35);border:2.5px solid rgba(255,253,248,.6)}
        .rghost{background:none;border:none;color:${MUT};font-weight:700;font-size:12px;cursor:pointer;text-decoration:underline dashed;text-underline-offset:3px}
        .leafcard{position:relative;overflow:hidden}
        .unit{font-size:.52em;font-weight:700;color:${MUT};margin-left:2px}
        .wave{position:absolute;left:-6px;right:-6px;top:-7px;height:16px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 16' preserveAspectRatio='none'%3E%3Cpath d='M0 8 Q10 2 20 8 T40 8 T60 8 T80 8 V16 H0 Z' fill='rgba(255,255,255,0.35)'/%3E%3C/svg%3E");background-size:64px 16px;background-repeat:repeat-x;animation:waveX 2.4s linear infinite}
        .wave.w2{top:-4px;opacity:.55;animation-duration:3.6s;animation-direction:reverse;background-size:88px 16px}
        .wave.surge{animation-duration:.8s}
        @keyframes waveX{from{background-position:0 0}to{background-position:64px 0}}
        .bub{position:absolute;bottom:-4px;width:4px;height:4px;border-radius:99px;background:rgba(255,255,255,.75);animation:bubbleUp 2.8s ease-in infinite}
        .bub.b1{left:22%;animation-delay:.2s}.bub.b2{left:55%;width:3px;height:3px;animation-delay:1.3s}.bub.b3{left:80%;animation-delay:2.1s;width:3px;height:3px}
        @keyframes bubbleUp{0%{opacity:0;transform:translateY(0) scale(.6)}25%{opacity:1}100%{opacity:0;transform:translateY(-13px) scale(1.15)}}
        .fl{transform-origin:50% 100%}
        .fl1{animation:flick1 .62s ease-in-out infinite alternate}.fl2{animation:flick2 .5s ease-in-out infinite alternate}.fl3{animation:flick3 .42s ease-in-out infinite alternate}
        @keyframes flick1{from{transform:scaleY(1) skewX(0)}to{transform:scaleY(1.18) skewX(-4deg)}}
        @keyframes flick2{from{transform:scaleY(.94) skewX(3deg)}to{transform:scaleY(1.14) skewX(-3deg)}}
        @keyframes flick3{from{transform:scaleY(1.08) skewX(-3deg)}to{transform:scaleY(.9) skewX(4deg)}}
        /* ===== Living bars & satisfying motion ===== */
        @keyframes waterFlow{0%{background-position:0 0,0 0}100%{background-position:56px 0,34px 0}}
        @keyframes emberFlow{0%{background-position:0 0}100%{background-position:64px 0}}
        @keyframes goalPop{0%{transform:scaleY(1)}35%{transform:scaleY(1.6)}65%{transform:scaleY(.92)}100%{transform:scaleY(1)}}
        @keyframes glowPulse{0%,100%{box-shadow:0 0 0 0 rgba(232,134,58,0)}40%{box-shadow:0 0 14px 2px rgba(232,134,58,.55)}}
        @keyframes sheen{0%{transform:translateX(-120%) skewX(-18deg)}100%{transform:translateX(240%) skewX(-18deg)}}
        @keyframes tabIn{from{opacity:0}to{opacity:1}}
        @keyframes sparkUp{0%{opacity:0;transform:translateY(2px) scale(.4)}30%{opacity:1}100%{opacity:0;transform:translateY(-16px) scale(1)}}
        .bar-water{background:repeating-linear-gradient(115deg,#4E93C9 0 10px,#5EA3D6 10px 20px,#4E93C9 20px 28px),linear-gradient(180deg,rgba(255,255,255,.32),rgba(255,255,255,0) 55%) !important;background-size:56px 100%,100% 100%;animation:waterFlow 1.6s linear infinite}
        .bar-blaze{background:repeating-linear-gradient(100deg,#E8863A 0 9px,#F2A75B 9px 15px,#D96F25 15px 23px,#F6C07E 23px 27px) !important;background-size:64px 100%;animation:emberFlow .9s linear infinite,goalPop .55s cubic-bezier(.3,1.6,.4,1) 1,glowPulse 1.6s ease 2;transform-origin:center}
        .row-done{animation:glowPulse 1.4s ease 1}
        .bar-shine{position:relative;animation:goalPop .55s cubic-bezier(.3,1.6,.4,1) 1;transform-origin:center}
        .bar-shine::after{content:"";position:absolute;top:0;bottom:0;width:36%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);animation:sheen 2.6s ease-in-out infinite}
        .rtap:active{transform:scale(.96)} .rpill:active,.rchip:active{transform:scale(.93)} .rbtn:active{transform:scale(.97)}
        .rpill,.rchip,.rbtn,.rbtn2{transition:transform .12s cubic-bezier(.3,1.6,.4,1),background .15s ease,box-shadow .15s ease}
        .rbtn{box-shadow:0 6px 16px rgba(38,43,34,.22)} .rbtn:active{box-shadow:0 2px 8px rgba(38,43,34,.25)}
        .sheen{position:relative;overflow:hidden} .sheen::after{content:"";position:absolute;top:0;bottom:0;width:34%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent);animation:sheen 1s ease 1}
        .tab-in{animation:tabIn .28s cubic-bezier(.2,.8,.3,1) both}
        .spark{position:absolute;width:5px;height:5px;border-radius:99px;background:#F2A75B;pointer-events:none;animation:sparkUp .8s ease-out forwards}
        @media (prefers-reduced-motion: reduce){.bar-water,.bar-blaze,.sheen::after,.tab-in,.row-done{animation:none !important}}
        @keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        @keyframes popin{0%{transform:scale(0)}70%{transform:scale(1.25)}100%{transform:scale(1)}}
        .popin{animation:popin .35s cubic-bezier(.3,.9,.4,1.2) both}
        @keyframes cwdeal{0%{opacity:0;transform:translateY(26px) rotateY(95deg) scale(.7)}55%{opacity:1;transform:translateY(-6px) rotateY(-12deg) scale(1.06)}100%{opacity:1;transform:translateY(0) rotateY(0) scale(1)}}
        .cwdeal{animation:cwdeal .55s cubic-bezier(.3,.8,.35,1.1) both;perspective:600px}
        @keyframes cwfly{0%{left:-8%;transform:translateY(0) rotate(0deg);opacity:0}12%{opacity:1}70%{transform:translateY(-26px) rotate(28deg)}100%{left:92%;transform:translateY(6px) rotate(50deg);opacity:0}}
        .cwfly{animation:cwfly .9s cubic-bezier(.35,.1,.6,1) both}
        @keyframes cwboom{0%,55%{opacity:0;transform:scale(.3)}68%{opacity:1;transform:scale(1.35)}100%{opacity:0;transform:scale(1)}}
        .cwboom{animation:cwboom .95s ease both}
        @keyframes cwshake{0%,100%{transform:translateX(0)}20%{transform:translateX(-4px) rotate(-1.2deg)}40%{transform:translateX(4px) rotate(1deg)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}
        .cwshake{animation:cwshake .6s ease}
        .r1{animation:rise .35s ease both}.r2{animation:rise .35s .05s ease both}.r3{animation:rise .35s .1s ease both}.r4{animation:rise .35s .15s ease both}
        @media(min-width:560px){.g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}}
      `}</style>

      {woOpen && <WorkoutSheet log={log} setLog={setLog} allLogs={me.logs || {}} onHub={() => { setWoOpen(false); setGymOpen(true); }} onClose={() => setWoOpen(false)} />}

      <div style={{ maxWidth: 560, margin: "0 auto", padding: phase === "app" ? "0 16px 140px" : "0 16px 40px" }}>

        {localOnly && (
          <div className="rp" style={{ padding: 14, marginTop: 16, borderColor: "#EFE0B8", background: "#FBF6E4", fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>
            <b>Offline.</b> Can't reach the server right now — your logs are kept on this device and will show once the connection is back.
          </div>
        )}

        {phase === "loading" && <div style={{ textAlign: "center", padding: 70, color: MUT, fontWeight: 800 }}>Loading…</div>}

        {/* ===== PICK TEAM (account exists, no team) ===== */}
        {phase === "pickteam" && me && (
          <div style={{ paddingTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 16, opacity: .92 }}><span className="rh" style={{ fontSize: 14.5 }}>Rally</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 8 }}>
              <Avatar player={me} size={54} />
              <div>
                <button onClick={() => setPhase("app")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "2px 0 12px", cursor: "pointer", fontSize: 13.5, fontWeight: 800, color: "#6A6250" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  {myTeams.length > 0 ? "Back to my teams" : "Back — keep going solo"}
                </button>
                <div className="rh" style={{ fontSize: 26, lineHeight: 1.05 }}>Hey, {me.name}</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: MUT }}>Your logs, streaks and XP travel with you.</div>
              </div>
            </div>
            <div className="rp" style={{ padding: 18, marginTop: 12 }}>
              <div className="rlabel" style={{ marginBottom: 8 }}>Join a team</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="rin" maxLength={5} value={pkCode} onChange={(e) => setPkCode(e.target.value.toUpperCase())} placeholder="5-letter code" style={{ textTransform: "uppercase", letterSpacing: ".2em", fontWeight: 800 }} />
                <button className="rbtn" disabled={pkCode.length !== 5 || busy} style={{ width: "auto", padding: "13px 20px" }} onClick={() => adoptTeam(pkCode)}>Join</button>
              </div>
              <button className="rpill" style={{ width: "100%", marginTop: 10 }} onClick={() => setBrowseOpen(true)}>🔍 Browse public teams</button>
            </div>
            <div style={{ textAlign: "center", fontSize: 12, fontWeight: 800, color: MUT, margin: "12px 0" }}>or</div>
            <div className="rp" style={{ padding: 18 }}>
              <div className="rlabel" style={{ marginBottom: 10 }}>Start a new team</div>
              <input className="rin" maxLength={18} value={pkName} onChange={(e) => setPkName(e.target.value)} placeholder="Team name — Hydro Homies, The Strides…" />
              <div style={{ display: "grid", gap: 7, margin: "12px 0 4px" }}>
                {MODES.map((m) => (
                  <button key={m.id} type="button" onClick={() => setPkMode(m.id)} style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12, background: pkMode === m.id ? "#F1F7EC" : "#FAF6ED", border: pkMode === m.id ? `2px solid ${FOREST}` : "2px solid #EDE5D6", borderRadius: 16, padding: "12px 14px", cursor: "pointer" }}>
                    <span style={{ width: 20, height: 20, borderRadius: 99, border: pkMode === m.id ? `6.5px solid ${FOREST}` : "2.5px solid #C9BFA9", flexShrink: 0, boxSizing: "border-box", background: "#FFFDF8" }} />
                    <span>
                      <span style={{ display: "block", fontWeight: 800, fontSize: 14 }}>{m.name}</span>
                      <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "#9A9283", marginTop: 1 }}>{m.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 11, cursor: "pointer" }}>
                <button onClick={() => setPkPublic(!pkPublic)} style={{ width: 42, height: 25, borderRadius: 99, border: "none", background: pkPublic ? FOREST : "#DDD4C2", position: "relative", cursor: "pointer", flexShrink: 0, transition: "background .2s" }}><span style={{ position: "absolute", top: 3, left: pkPublic ? 20 : 3, width: 19, height: 19, borderRadius: 99, background: "#fff", transition: "left .2s" }} /></button>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#6A6250" }}>Public — anyone can find and join this team</span>
              </label>
              <button className="rbtn" disabled={pkName.trim().length < 2 || busy} style={{ width: "100%", padding: "14px 0", fontSize: 15, marginTop: 12 }} onClick={() => adoptTeam(null, pkName, pkPublic, null, pkMode)}>{busy ? "One sec…" : `Create ${pkMode === "party" ? "solo team" : "team"}`}</button>
            </div>
            {err && <div style={{ marginTop: 12, textAlign: "center", fontSize: 13, fontWeight: 800, color: "#B0685A" }}>{err}</div>}
            <div style={{ textAlign: "center", marginTop: 18 }}><button className="rghost" onClick={async () => { await sDel(ME, false); setMe(null); setPhase("landing"); }}>Log out of this device</button></div>
            {browseOpen && <BrowseTeams allTeams={allTeams} allPlayers={allPlayers} busy={busy} onClose={() => setBrowseOpen(false)} onJoin={(t) => { setBrowseOpen(false); adoptTeam(null, null, false, t); }} />}
          </div>
        )}

        {/* ===== LANDING ===== */}
        {phase === "landing" && (
          <div style={{ paddingTop: 20 }}>
            <div className="r1" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div className="rh" style={{ fontSize: 19 }}>Rally</div>
            </div>
            <div className="rh r2" style={{ fontSize: 42, lineHeight: 1, letterSpacing: "-.035em", marginBottom: 10 }}>Better<br />together.</div>
            <div className="r2" style={{ fontSize: 15, fontWeight: 600, color: MUT, marginBottom: 16 }}>Small daily wins. Big life change.</div>
            <div className="r3" style={{ position: "relative", borderRadius: 28, overflow: "hidden", height: 250, boxShadow: "0 16px 36px rgba(90,74,48,.2)", marginBottom: 14 }}>
              <img src={HERO_IMG} alt="Five friends hiking a trail together" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 64%" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(24,32,22,0) 55%, rgba(24,32,22,.5) 100%)" }} />
              <div style={{ position: "absolute", left: 16, bottom: 14, display: "flex", alignItems: "center", gap: 7, background: "#FFFDF8", borderRadius: 99, padding: "8px 14px" }}>
                <Icon name="team" size={16} color={FOREST} /><span style={{ fontWeight: 800, fontSize: 12.5 }}>Your crew, one score</span>
              </div>
            </div>
            <div className="rp r4" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { ic: "trophy", bg: "#FBEEDD", col: AMBER, t: "Team battles", d: "Climb the board together" },
                    { ic: "goals", bg: "#E7EFE7", col: FOREST, t: "Track habits", d: "Steps, sleep & more" },
                    { ic: "bolt", bg: "#FBEEDD", col: AMBER, t: "Challenges", d: "Daily goals, real rewards" },
                    { ic: "ranks", bg: "#E7EFE7", col: FOREST, t: "Progress", d: "Watch yourself level up" },
                  ].map((x) => (
                    <div key={x.t} style={{ background: x.bg, borderRadius: 22, padding: "16px 14px" }}>
                      <div style={{ width: 38, height: 38, borderRadius: 13, background: "#FFFDF8", display: "grid", placeItems: "center", marginBottom: 10 }}><Icon name={x.ic} size={19} color={x.col} /></div>
                      <div style={{ fontWeight: 800, fontSize: 13.5 }}>{x.t}</div>
                      <div style={{ fontSize: 11.5, color: "#7C7565", fontWeight: 600, marginTop: 2, lineHeight: 1.35 }}>{x.d}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              <button className="rbtn" onClick={() => { setErr(""); setPhase("create"); }}>Create a team</button>
              <button className="rbtn2" onClick={() => { setErr(""); setPhase("join"); }}>Join with a code</button>
              <button className="rghost" onClick={() => setBrowseOpen(true)}>or browse public teams →</button>
            </div>
            {browseOpen && <BrowseTeams allTeams={allTeams} allPlayers={allPlayers} busy={busy} onClose={() => setBrowseOpen(false)} onJoin={(t) => { setBrowseOpen(false); setPendingJoin(t); setPhase("create"); }} />}
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <span style={{ fontSize: 13, color: MUT, fontWeight: 600 }}>Already have an account? </span>
              <button className="rghost" onClick={() => { setErr(""); setPhase("login"); }}>Log in</button>
            </div>
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 12.5, color: MUT, fontWeight: 600 }}>Different habits. Different strengths. One team. One goal.</div>
          </div>
        )}

        {/* ===== CREATE / JOIN ===== */}
        {(phase === "create" || phase === "join") && (
          <div style={{ paddingTop: 26, maxWidth: 440, margin: "0 auto" }}>
            <button className="rghost" onClick={() => { setPendingJoin(null); setPhase("landing"); }}>← Back</button>
            <div className="rh" style={{ fontSize: 25, margin: "14px 0 4px" }}>{phase === "create" ? (pendingJoin ? `Join ${pendingJoin.name}` : "Create your team") : "Join a team"}</div>
            <div style={{ color: MUT, fontSize: 14, fontWeight: 500, marginBottom: 18 }}>{phase === "create" ? "You'll get an invite code to send to your crew." : "Your captain has a 5-letter code — grab it."}</div>
            <div className="rp" style={{ padding: 18, display: "grid", gap: 14 }}>
              <div><div className="rlabel" style={{ marginBottom: 7 }}>Your name</div><input className="rin" maxLength={20} value={fName} onChange={(e) => setFName(e.target.value)} placeholder="How the group knows you" /></div>
              {phase === "create"
                ? <><div><div className="rlabel" style={{ marginBottom: 7 }}>{pendingJoin ? "Joining" : "Team name"}</div>{pendingJoin ? <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#F1F7EC", borderRadius: 12 }}><TeamCrest team={pendingJoin} size={30} active /><span style={{ fontWeight: 800 }}>{pendingJoin.name}</span></div> : (fMode !== "solo" ? <input className="rin" maxLength={24} value={fTeam} onChange={(e) => setFTeam(e.target.value)} placeholder="Hydro Homies, The Strides…" /> : <div style={{ fontSize: 11.5, fontWeight: 700, color: "#9A9283", padding: "4px 2px" }}>No team needed — just you, your habits, and the grid.</div>)}
                {!pendingJoin && <div style={{ marginTop: 12 }}>
                  <div className="rlabel" style={{ marginBottom: 7 }}>How do you want to play?</div>
                  {[{ id: "solo", name: "Just me", desc: "Private tracking, streaks and stats. Join or create teams anytime later." }, ...MODES].map((m) => (
                    <button key={m.id} type="button" onClick={() => setFMode(m.id)} style={{ width: "100%", textAlign: "left", background: fMode === m.id ? "#F1F7EC" : "#FAF6ED", border: fMode === m.id ? `2px solid ${FOREST}` : "2px solid #EDE5D6", borderRadius: 14, padding: "10px 13px", marginBottom: 7, cursor: "pointer" }}>
                      <div style={{ fontWeight: 800, fontSize: 13.5 }}>{m.name}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#9A9283" }}>{m.desc}</div>
                    </button>
                  ))}
                </div>}</div>
                    {!pendingJoin && <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
                      <button type="button" onClick={() => setFPublic(!fPublic)} style={{ width: 42, height: 25, borderRadius: 99, border: "none", background: fPublic ? FOREST : "#DDD4C2", position: "relative", cursor: "pointer", flexShrink: 0 }}><span style={{ position: "absolute", top: 3, left: fPublic ? 20 : 3, width: 19, height: 19, borderRadius: 99, background: "#fff", transition: "left .2s" }} /></button>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#6A6250" }}>Public — anyone can find and join</span>
                    </label>}</>
                : <div><div className="rlabel" style={{ marginBottom: 7 }}>Invite code</div><input className="rin" maxLength={5} value={fCode} onChange={(e) => setFCode(e.target.value.toUpperCase())} placeholder="e.g. K7PMD" style={{ letterSpacing: ".3em", fontWeight: 800 }} /></div>}
              <div><div className="rlabel" style={{ marginBottom: 7 }}>Set a passcode</div><input className="rin" type="password" maxLength={20} value={fPass} onChange={(e) => setFPass(e.target.value)} placeholder="So you can log back in" /><div style={{ fontSize: 11, color: MUT, fontWeight: 600, marginTop: 5 }}>Lets you sign in again if you switch phones or clear your browser.</div></div>
              {err && <div style={{ fontSize: 13, fontWeight: 700, color: "#B5533B" }}>{err}</div>}
              <button className="rbtn" disabled={busy || !fName.trim() || !fPass.trim() || (phase === "create" ? (!pendingJoin && fMode !== "solo" && !fTeam.trim()) : fCode.trim().length !== 5)} onClick={phase === "create" ? createTeam : joinTeam}>{busy ? "One sec…" : phase === "create" ? (pendingJoin ? "Join team" : fMode === "solo" ? "Start solo" : "Create team") : "Join team"}</button>
            </div>
          </div>
        )}

        {/* ===== LOG IN ===== */}
        {phase === "login" && (
          <div style={{ paddingTop: 26, maxWidth: 440, margin: "0 auto" }}>
            <button className="rghost" onClick={() => { setPendingJoin(null); setPhase("landing"); }}>← Back</button>
            <div className="rh" style={{ fontSize: 25, margin: "14px 0 4px" }}>Welcome back</div>
            <div style={{ color: MUT, fontSize: 14, fontWeight: 500, marginBottom: 18 }}>Log in to pick up where you left off.</div>
            <div className="rp" style={{ padding: 18, display: "grid", gap: 14 }}>
              <div><div className="rlabel" style={{ marginBottom: 7 }}>Your name</div><input className="rin" maxLength={20} value={fName} onChange={(e) => setFName(e.target.value)} placeholder="The name you signed up with" /></div>
              <div><div className="rlabel" style={{ marginBottom: 7 }}>Passcode</div><input className="rin" type="password" maxLength={20} value={fPass} onChange={(e) => setFPass(e.target.value)} placeholder="Your passcode" /></div>
              {err && <div style={{ fontSize: 13, fontWeight: 700, color: "#B5533B" }}>{err}</div>}
              <button className="rbtn" disabled={busy || !fName.trim() || !fPass.trim()} onClick={logIn}>{busy ? "One sec…" : "Log in"}</button>
              <div style={{ borderTop: `1.5px dashed ${LINE}`, paddingTop: 14 }}>
                <div className="rlabel" style={{ marginBottom: 7 }}>Forgot passcode? Use recovery code</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="rin" maxLength={9} value={fRecovery} onChange={(e) => setFRecovery(e.target.value.toUpperCase())} placeholder="XXXX-XXXX" style={{ letterSpacing: ".14em", fontWeight: 800 }} />
                  <button className="rpill" disabled={busy || fRecovery.trim().length < 8} onClick={restoreByRecovery}>Restore</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== LOBBY ===== */}
        {phase === "lobby" && team && me && (
          <div style={{ paddingTop: 26, maxWidth: 460, margin: "0 auto", textAlign: "center" }}>
            <TeamCrest team={team} size={72} active />
            <div className="rh" style={{ fontSize: 26, marginTop: 8 }}>{team.name}</div>
            <div style={{ color: MUT, fontSize: 13.5, fontWeight: 600 }}>The lobby — gather your crew, then head in.</div>
            <div className="rp" style={{ padding: 18, marginTop: 16 }}>
              <div className="rlabel">Invite code</div>
              <div className="rh" style={{ fontSize: 40, letterSpacing: ".22em", margin: "6px 0 2px", color: GREEN_D }}>{team.code}</div>
              <span style={{ display: "inline-block", fontSize: 10, fontWeight: 800, letterSpacing: ".08em", color: MODE_OF(team) === "party" ? "#39749F" : GREEN_D, background: MODE_OF(team) === "party" ? "#EAF3FA" : "#F1F7EC", borderRadius: 99, padding: "4px 12px", marginBottom: 4 }}>{MODE_OF(team) === "party" ? "SOLO TEAM · FRIENDLY LEADERBOARD" : "TEAM BATTLE MODE"}</span>
              <div style={{ fontSize: 12.5, color: MUT, fontWeight: 600, lineHeight: 1.55 }}>Send friends this app's link, tell them to hit <b>Join with a code</b>, and enter this.</div>
              <button className="rbtn2" style={{ marginTop: 12 }} onClick={copyCode}>{copied ? "✓ Copied" : "Copy code"}</button>
            </div>
            {showRecovery && (
              <div className="rp" style={{ padding: 16, marginTop: 12, borderColor: "#EFD9A6", background: "#FBF6E4", textAlign: "left" }}>
                <div className="rlabel" style={{ color: "#9A7B1E" }}>Save your recovery code</div>
                <div className="rh" style={{ fontSize: 26, letterSpacing: ".16em", margin: "4px 0 4px", color: "#9A7B1E" }}>{showRecovery}</div>
                <div style={{ fontSize: 12, color: "#8A7B4E", fontWeight: 600, lineHeight: 1.5 }}>Screenshot this. If you forget your passcode or switch phones, it's the only way back into your account.</div>
              </div>
            )}
            <div className="rp" style={{ padding: 16, marginTop: 12, textAlign: "left" }}>
              <div className="rlabel" style={{ marginBottom: 8 }}>In the lobby · {roster.length}</div>
              {roster.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1.5px dashed #EFE9D6" }}>
                  <Avatar player={p} size={34} />
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}{p.id === me.id ? " (you)" : ""}</div>
                  {p.joined === Math.min(...roster.map((r) => r.joined)) && <span style={{ fontSize: 10.5, fontWeight: 800, color: "#B9A15C", background: "#FBF3DC", borderRadius: 99, padding: "3px 8px" }}>CAPTAIN</span>}
                </div>
              ))}
              <button className="rpill" style={{ marginTop: 10, width: "100%" }} onClick={refresh}>↻ Check for new joins</button>
            </div>
            <button className="rbtn" style={{ marginTop: 14 }} onClick={() => setPhase("app")}>Enter Rally →</button>
          </div>
        )}

        {/* ===== APP ===== */}
        {phase === "app" && me && (
          <React.Fragment key={tab}>
          <div className="tab-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, paddingTop: 12, paddingBottom: 2 }}>
              <img src={LOGO} alt="" style={{ width: 26, height: 26 }} />
              <span className="rh" style={{ fontSize: 15, letterSpacing: "-.01em" }}>Rally</span>
            </div>

            {/* HOME */}
            {tab === "home" && (
              <div style={{ display: "grid", gap: 12, paddingTop: 8 }}>
                {/* header */}
                <div className="r1" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar player={me} size={46} />
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, color: MUT, fontWeight: 600 }}>{greet()},</div><div className="rh" style={{ fontSize: 28, lineHeight: 1.02 }}>{me.name}</div></div>
                  {streakOf(me.logs) > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}><GardenTablet gd={gdn} /><StreakFlame n={streakOf(me.logs)} /></div>
                  )}
                </div>

                {/* Team hero — painted art, big type */}
                {(() => {
                  const myWk = (weekBoard.find((t) => t.code === team?.code)?.wk) || 0;
                  const rival = rivalOf;
                  const lead = rival ? myWk - rival.wk : null;
                  const share = rival && (myWk + rival.wk) > 0 ? myWk / (myWk + rival.wk) : (myWk > 0 ? 1 : 0.5);
                  return (
                    <div className="r2" style={{ position: "relative", borderRadius: 28, overflow: "hidden", minHeight: 200, boxShadow: "0 16px 36px rgba(90,74,48,.2)" }}>
                      <img src={HERO_IMG} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 64%" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(24,32,22,.55) 0%, rgba(24,32,22,.06) 46%, rgba(24,32,22,.62) 100%)" }} />
                      <div style={{ position: "relative", padding: "18px 20px 16px", display: "flex", flexDirection: "column", minHeight: 200, boxSizing: "border-box" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ color: "#EDE8DA", fontSize: 11.5, fontWeight: 800, letterSpacing: ".12em" }}>{team ? team.name.toUpperCase() : "GOING SOLO"}</div>
                          <div style={{ color: "#FFF", fontSize: 11, fontWeight: 800, background: "#FFFFFF2B", borderRadius: 99, padding: "4px 12px", backdropFilter: "blur(4px)" }}>{(() => { if (!team) return "Solo"; const i = weekBoard.findIndex((t) => t.code === team.code); return i >= 0 ? `#${i + 1} this week` : "New"; })()}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6, margin: "8px 0 0" }}>
                          <CountUp value={myWk} className="rh" style={{ color: "#FFF", fontSize: 52, lineHeight: 1, letterSpacing: "-.03em", textShadow: "0 2px 14px rgba(10,18,10,.5)" }} />
                          <span style={{ color: "#EDE8DA", fontSize: 14, fontWeight: 700 }}>pts</span>
                        </div>
                        <div style={{ color: "#EDE8DA", fontSize: 13, fontWeight: 700, textShadow: "0 1px 6px rgba(10,18,10,.5)" }}>this week's battle · ends in {battleEndsIn()}</div>
                        <div style={{ marginTop: "auto" }}>
                          <div style={{ height: 8, background: "#FFFFFF38", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{ width: `${Math.round(share * 100)}%`, height: "100%", background: AMBER, borderRadius: 99, transition: "width .7s ease" }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                            <span style={{ color: "#EDE8DA", fontSize: 11, fontWeight: 700 }}>{rival ? `vs ${rival.name}` : "No rival team yet"}</span>
                            {rival && <span style={{ color: "#FFF", fontSize: 11, fontWeight: 800 }}>{lead >= 0 ? `+${lead.toLocaleString()} ahead` : `${Math.abs(lead).toLocaleString()} behind`}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Today's plan */}
                <div className="r3" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 4px 0" }}>
                  <div className="rh" style={{ fontSize: 22 }}>Today's plan</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <button className="rtap" onClick={() => setGridOpen(true)} aria-label="Open consistency dashboard" style={{ width: 30, height: 30, borderRadius: 9, border: "2px solid #DDD4C2", background: "#FAF6ED", cursor: "pointer", display: "grid", placeItems: "center", padding: 0 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24">{[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={c * 8} y={r * 8} width="6" height="6" rx="1.8" fill={(r + c) % 2 || (r === 2 && c === 2) ? "#2A5445" : "#C9BFA9"} opacity={r === 0 && c === 2 ? .45 : 1} />))}</svg>
                    </button>
                    {(() => { const n = (cwMine?.bank || []).length; return (
                      <button className="rtap" onClick={() => setDeckOpen(true)} aria-label="Open your card armoury" style={{ position: "relative", width: 26, height: 34, borderRadius: 6, border: `2px solid #D9A13F`, background: "linear-gradient(160deg,#FBF3DF,#F1E4C4)", cursor: "pointer", boxShadow: "2.5px 2.5px 0 -1px #FFFDF8, 2.5px 2.5px 0 0 #D8CDB6", display: "grid", placeItems: "center", padding: 0 }}>
                        <span style={{ color: "#B4671F", display: "grid", placeItems: "center" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M4 4 L15 15 M15 15 L19 19 M13 17 L17 13"/><path d="M20 4 L9 15 M9 15 L5 19 M11 17 L7 13"/></svg></span>
                        {n > 0 && <span className="popin" style={{ position: "absolute", top: -7, right: -8, minWidth: 17, height: 17, borderRadius: 99, background: AMBER, color: "#FFF", fontSize: 10, fontWeight: 800, display: "grid", placeItems: "center", padding: "0 4px", border: "2px solid #FFFDF8" }}>{n}</span>}
                      </button>
                    ); })()}
                    <div style={{ fontSize: 13, fontWeight: 800, color: FOREST }}>{myScore.toLocaleString()} pts{challengeBonus(log) > 0 ? ` · +${challengeBonus(log)}` : ""}</div>
                  </div>
                </div>

                {(() => {
                  const stepsV = Number(log.steps) || 0, waterV = Number(log.water) || 0;
                  const rows = [
                    { id: "steps", name: "Steps", icon: "steps", c: CATS[0], val: stepsV.toLocaleString(), goal: "10,000", pct: stepsV / 10000, pts: ptsSteps(log.steps) },
                    { id: "workout", name: "Workout", icon: "workout", c: CATS[3], val: ptsWorkout(log) ? `${log.workoutMin || 0}m` : "—", goal: "60m", pct: ptsWorkout(log) ? Math.max(Math.min((Number(log.workoutMin) || 0) / 60, 1), .2) : 0, pts: ptsWorkout(log), sheet: true },
                    { id: "water", name: "Hydration", icon: "water", c: CATS[1], val: (me.units?.water === "oz") ? `${Math.round(waterV / 29.574)} oz` : `${waterV / 1000} l`, goal: (me.units?.water === "oz") ? "101 oz" : "3 l", pct: waterV / WATER_GOAL_ML, pts: ptsWater(log.water) },
                    ...CATS.filter((c) => c.type === "unit").map((c) => ({ id: c.id, name: c.name, icon: CAT_ICON[c.id], c, val: `${Number(log[c.id]) || 0} ${c.unit}`, goal: `${c.id === "sleep" ? 8 : c.id === "focus" ? 50 : c.id === "calories" ? 1000 : 10} ${c.unit}`, pct: (Number(log[c.id]) || 0) / (c.id === "sleep" ? 8 : c.id === "focus" ? 50 : c.id === "calories" ? 1000 : 10), pts: catPts(c.id, log) })),
                  ];
                  return rows.map((r, i) => {
                    const isOpen = openCat === r.id;
                    return (
                      <div key={r.id} className="rp" style={{ padding: 0, overflow: "hidden" }}>
                        <button className="rtap" onClick={() => r.sheet ? setWoOpen(true) : setOpenCat(isOpen ? null : r.id)} style={{ width: "100%", background: "none", border: "none", padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, textAlign: "left", cursor: "pointer" }}>
                          <div style={{ position: "relative", width: 48, height: 48, borderRadius: 16, background: r.c.pale, display: "grid", placeItems: "center", flexShrink: 0, overflow: "visible" }}>
                            {IMGS[r.id] ? <img src={IMGS[r.id]} alt="" style={{ width: 48, height: 48, borderRadius: 16, objectFit: "cover" }} /> : <Icon name={r.icon} size={21} color={r.c.color} />}
                            {r.pct >= 1 && <div className="popin" style={{ position: "absolute", top: -5, right: -5, width: 19, height: 19, borderRadius: 99, background: FOREST, border: "2px solid #FFFDF8", display: "grid", placeItems: "center" }}><Icon name="check" size={10} color="#FFF" /></div>}
                            {Object.keys(cwMine?.drawn || {}).some((k) => k.startsWith(`${me.id}|${today()}|${r.id}|`)) && (
                              <div className="popin" role="button" aria-label="Card earned — open armoury" onClick={(e) => { e.stopPropagation(); setDeckOpen(true); }} style={{ position: "absolute", bottom: -6, right: -7, width: 16, height: 21, borderRadius: 4, background: "linear-gradient(160deg,#FBF3DF,#F1E4C4)", border: "1.5px solid #D9A13F", display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "1.5px 1.5px 0 0 #D8CDB6" }}>
                                <span style={{ width: 7, height: 9, borderRadius: 1.5, background: "#D9A13F", display: "block" }} />
                              </div>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                              <span style={{ fontWeight: 800, fontSize: 15.5 }}>{r.name}</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: r.pct >= 1 ? FOREST : r.pts > 0 ? INK : MUT }}>{r.val} <span style={{ color: MUT, fontWeight: 600 }}>/ {r.goal}</span></span>
                            </div>
                            <div style={{ position: "relative", marginTop: 8, display: "flex" }}>
                              {burstRow === r.id && <EmberBurst kind={FXKIND[r.id] || "fire"} onDone={() => setBurstRow(null)} />}
                              {r.id === "water" && r.pct > 0
                                ? <>
                                    <WaterBar pct={r.pct} surging={surge === "water"} />
                                    {r.pct >= 1 && <RowFX kind="waterfx" />}
                                  </>
                                : <div style={{ flex: 1, height: r.pct >= 1 ? 11 : 6, background: "#F1EADD", borderRadius: 99, overflow: "visible", position: "relative", transition: "height .3s ease" }}>
                                    <div style={{ position: "absolute", inset: 0, borderRadius: 99, overflow: "hidden" }}>
                                      <div className={r.pct >= 1 ? (["workout", "calories"].includes(r.id) ? "bar-blaze" : "bar-shine") : ""} style={{ width: `${Math.min(r.pct * 100, 100)}%`, height: "100%", background: r.c.color, borderRadius: 99, transition: "width .6s cubic-bezier(.3,.7,.3,1)" }} />
                                    </div>
                                    {r.pct >= 1 && <RowFX kind={FXKIND[r.id] || "fire"} />}
                                  </div>}
                            </div>
                          </div>
                          <svg width="15" height="15" viewBox="0 0 24 24" style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .2s ease", flexShrink: 0 }}><path d="M9 5l7 7-7 7" fill="none" stroke={MUT} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </button>
                        {isOpen && !r.sheet && (
                          <div style={{ padding: "0 16px 15px" }}>
                            {r.id === "steps" && (
                              <div style={{ display: "flex", gap: 8 }}>
                                <button className="rpill" onClick={() => inputNum("steps", stepsV - 1000)}>−1k</button>
                                <input className="rin" style={{ textAlign: "center", fontWeight: 800 }} type="number" inputMode="numeric" value={log.steps || ""} placeholder="0" onChange={(e) => inputNum("steps", e.target.value)} />
                                <button className="rpill" style={{ background: FOREST, color: "#FFF" }} onClick={() => inputNum("steps", stepsV + 1000)}>+1k</button>
                              </div>
                            )}
                            {r.id === "water" && (
                              <div style={{ display: "flex", gap: 8 }}>
                                <button className="rpill" onClick={() => inputNum("water", waterV - 250, WATER_CAP_ML)}>−</button>
                                <div style={{ flex: 1, alignSelf: "center", fontSize: 12, fontWeight: 700, color: MUT, textAlign: "center" }}>{(me.units?.water === "oz") ? `${Math.round(waterV / 29.574)} of 101 oz · a glass is ~8 oz` : `${waterV / 1000} of 3 litres · +250ml a glass`}</div>
                                <button className="rpill" style={{ background: FOREST, color: "#FFF" }} onClick={() => inputNum("water", waterV + 250, WATER_CAP_ML)}>+ glass</button>
                              </div>
                            )}
                            {["sleep", "meditation", "reading", "focus", "calories"].includes(r.id) && (() => { const c = r.c; return (
                              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <button className="rpill" onClick={() => stepUnit(c.id, -1, c)}>−{c.step}</button>
                                <input className="rin" style={{ textAlign: "center", fontWeight: 800 }} type="number" inputMode="decimal" value={log[c.id] || ""} placeholder="0" onChange={(e) => inputNum(c.id, e.target.value, c.id === "calories" ? 6000 : c.id === "sleep" ? 24 : 999)} />
                                <button className="rpill" style={{ background: FOREST, color: "#FFF" }} onClick={() => stepUnit(c.id, +1, c)}>+{c.step}</button>
                                <button className="rpill" onClick={() => { buzz(11); setLog((l) => ({ ...l, [c.id]: (Number(l[c.id]) || 0) + c.big })); }}>+{c.big}</button>
                              </div>
                            ); })()}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}

                {/* Journal toggle */}
                {CATS.filter((x) => x.type === "bool").map((c) => { const on = !!log[c.id]; const isJ = c.id === "journal"; const isF = c.id === "fasting"; return (
                  <div key={c.id} className="rp" style={{ padding: 0, overflow: "hidden", background: on ? FOREST : CARD }}>
                    <button className="rtap" aria-pressed={on} onClick={() => { if (isJ) setJournalOpen(true); else if (isF) setFastOpen((v) => !v); else { buzz(14); setLog((l) => ({ ...l, [c.id]: !l[c.id] })); } }} style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, width: "100%", border: "none", cursor: "pointer", textAlign: "left", background: "none" }}>
                      <div style={{ width: 48, height: 48, borderRadius: 16, background: on ? "#FFFFFF1E" : c.pale, display: "grid", placeItems: "center", flexShrink: 0 }}>{IMGS[c.id] ? <img src={IMGS[c.id]} alt="" style={{ width: 48, height: 48, borderRadius: 16, objectFit: "cover", opacity: on ? .88 : 1 }} /> : <Icon name={CAT_ICON[c.id]} size={21} color={on ? "#FFF" : c.color} />}</div>
                      <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 15.5, color: on ? "#FFF" : INK }}>{isJ ? "Journal & gratitude" : c.name}</div><div style={{ fontSize: 12, fontWeight: 700, color: on ? "#C9D8CC" : MUT }}>{on ? (isJ ? "+100 pts · tap to keep writing" : isF ? `${FAST_LABEL(log.fasting)} kept · +100 pts` : "+100 pts · nice one") : (isJ ? "Open your journal · quotes inside" : isF ? "Pick your fasting protocol" : c.desc)}</div></div>
                      <div role="button" onClick={(e) => { e.stopPropagation(); buzz(14); setLog((l) => ({ ...l, [c.id]: l[c.id] ? undefined : (c.id === "fasting" ? 16 : true) })); }} style={{ width: 28, height: 28, borderRadius: 99, border: `2.5px solid ${on ? AMBER : "#DDD4C2"}`, background: on ? AMBER : "transparent", display: "grid", placeItems: "center", flexShrink: 0, cursor: "pointer" }}>{on && <Icon name="check" size={15} color="#FFF" />}</div>
                    </button>
                    {isF && fastOpen && (
                      <div style={{ padding: "0 16px 15px", display: "flex", gap: 7, flexWrap: "wrap" }}>
                        {FASTS.map((f) => (
                          <button key={f.h} className={`rchip ${Number(log.fasting) === f.h ? "on" : ""}`} style={on && Number(log.fasting) === f.h ? { background: "#FFFFFF2A", borderColor: "#FFF", color: "#FFF" } : on ? { background: "transparent", borderColor: "#FFFFFF55", color: "#DDE7DC" } : {}} onClick={() => { buzz(14); setLog((l) => ({ ...l, fasting: Number(l.fasting) === f.h ? undefined : f.h })); }}>
                            {f.label}
                          </button>
                        ))}
                        <div style={{ width: "100%", fontSize: 10.5, fontWeight: 700, color: on ? "#C9D8CC" : MUT }}>Flat +100 for keeping any window — consistency over extremes.</div>
                      </div>
                    )}
                  </div>
                ); })}

                {/* Calories burned today (estimate) */}
                {(() => { const k = kcalOf(log); return (
                  <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", padding: "15px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                    <img src={KCAL_IMG} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 45%" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(250,244,230,.92) 34%, rgba(250,244,230,.5) 100%)" }} />
                    <div style={{ position: "relative" }}>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", color: "#8A5A2E" }}>CALORIES BURNED · TODAY</div>
                      <div className="rh" style={{ fontSize: 26 }}>~{k.toLocaleString()}<span className="unit">kcal</span></div>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8A5A2E" }}>estimate from steps + workout minutes · not scored</div>
                    </div>
                  </div>
                ); })()}

                {/* ---- Personal habits (private, never scored) ---- */}
                {(() => {
                  const defs = cx?.defs || [];
                  return (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "6px 2px 10px" }}>
                        <div>
                          <div className="rh" style={{ fontSize: 17 }}>Personal</div>
                          <div style={{ fontSize: 10, fontWeight: 800, color: MUT }}>Private habits · not scored, not shared</div>
                        </div>
                        <button className="rghost" onClick={() => setCxManageOpen(true)}>{defs.length ? "Manage" : "Add a habit"}</button>
                      </div>
                      {defs.map((d) => {
                        const T = cxTypeOf(d.type);
                        const v = cxVal(cx, today(), d.id);
                        const done = cxDone(d, v);
                        const goal = Number(d.goal) || 1;
                        return (
                          <div key={d.id} className="rp" style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                            <div style={{ position: "relative", width: 40, height: 40, borderRadius: 14, background: d.color, display: "grid", placeItems: "center", flexShrink: 0 }}>
                              <Icon name={d.icon} size={17} color="#FFFDF4" />
                              {done && <div className="popin" style={{ position: "absolute", top: -5, right: -5, width: 17, height: 17, borderRadius: 99, background: "#FFFDF8", border: `2px solid ${d.color}`, display: "grid", placeItems: "center" }}><Icon name="check" size={9} color={d.color} /></div>}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                <span style={{ fontWeight: 800, fontSize: 14 }}>{d.name}</span>
                                {d.type !== "toggle" && <span style={{ fontSize: 12, fontWeight: 700, color: done ? d.color : MUT }}>{v} <span style={{ color: MUT, fontWeight: 600 }}>/ {goal}{T.unit ? ` ${T.unit}` : ""}</span></span>}
                              </div>
                              {d.type !== "toggle" && (
                                <div style={{ height: 6, borderRadius: 99, background: "#F1EADD", marginTop: 7, overflow: "hidden" }}>
                                  <div style={{ width: `${Math.min(100, (v / goal) * 100)}%`, height: "100%", background: d.color, borderRadius: 99, transition: "width .4s ease" }} />
                                </div>
                              )}
                              <div style={{ fontSize: 9.5, fontWeight: 700, color: "#B3AA97", marginTop: d.type !== "toggle" ? 5 : 2 }}>{cxFreqOf(d.freq).name}{(() => { const s = cxStreak(d, cx); return s.cur > 0 ? ` · ${s.cur}-${s.unit} streak` : ""; })()}</div>
                            </div>
                            {d.type === "toggle" ? (
                              <button onClick={() => cxSet(d.id, v ? undefined : 1)} style={{ width: 28, height: 28, borderRadius: 99, border: `2.5px solid ${v ? d.color : "#DDD4C2"}`, background: v ? d.color : "transparent", display: "grid", placeItems: "center", flexShrink: 0, cursor: "pointer" }}>{v ? <Icon name="check" size={14} color="#FFF" /> : null}</button>
                            ) : (
                              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                <button onClick={() => cxSet(d.id, Math.max(0, Math.round((v - T.step) * 10) / 10) || undefined)} style={{ width: 28, height: 28, borderRadius: 99, border: "2px solid #DDD4C2", background: "#FAF6ED", fontWeight: 800, color: "#8A8272", cursor: "pointer", fontSize: 15, lineHeight: 1 }}>−</button>
                                <button onClick={() => cxSet(d.id, Math.round((v + T.step) * 10) / 10)} style={{ width: 28, height: 28, borderRadius: 99, border: "none", background: d.color, fontWeight: 800, color: "#FFF", cursor: "pointer", fontSize: 15, lineHeight: 1 }}>+</button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {defs.length === 0 && (
                        <button className="rtap" onClick={() => setCxManageOpen(true)} style={{ width: "100%", border: "2px dashed #DDD4C2", background: "none", borderRadius: 20, padding: "16px", fontSize: 12.5, fontWeight: 700, color: MUT, cursor: "pointer" }}>
                          Track anything that's yours alone — guitar, a language, skincare, the dog's walks. Tap to create one.
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Daily challenge card */}
                {(() => { const tc = teamChallengeOf(today()); const tcTarget = tc.per * Math.max(roster.length, 1); return (
                <div className="rtap" onClick={() => { setTab("challenges"); refresh(); }} style={{ background: FOREST, borderRadius: 28, padding: "18px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 15, background: "#FFFFFF1E", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={tc.icon} size={22} color={AMBER} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", color: "#B9CDBF" }}>TEAM CHALLENGE · TODAY</div>
                    <div className="rh" style={{ fontSize: 16.5, color: "#FFF" }}>{tc.label(tcTarget)}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" fill="none" stroke="#B9CDBF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                ); })()}

                {/* quote */}
                <div style={{ padding: "6px 6px 0", textAlign: "center", fontSize: 12.5, fontWeight: 700, color: MUT, fontStyle: "italic" }}>"Progress, not perfection. Every step forward counts."</div>

                <div style={{ textAlign: "center", display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap" }}>
                  <button className="rghost" onClick={logout}>Log out</button>
                  <button className="rghost" onClick={leave}>Leave team</button>
                  <button className="rghost" style={{ color: "#B0685A" }} onClick={deleteProfile}>Delete account</button>
                </div>
              </div>
            )}

            {/* CHALLENGES */}
            {tab === "challenges" && (() => {
              const doneCount = CHALLENGES.filter((c) => c.done(log)).length;
              const wildTxt = wildcardOf(today());
              const tc = teamChallengeOf(today());
              const tcTarget = tc.per * Math.max(roster.length, 1);
              const tcVal = roster.reduce((s, p) => s + tc.get(p.logs?.[today()] || {}), 0);
              const tcDone = tcVal >= tcTarget;
              return (
                <div style={{ display: "grid", gap: 12, paddingTop: 8 }}>
                  <div className="rh" style={{ fontSize: 30, letterSpacing: "-.03em" }}>Challenges</div>
                  <WildsStrip w={wds} />

                  {/* team daily challenge — rotates daily, scales with team size */}
                  <div style={{ background: FOREST, borderRadius: 28, padding: "18px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".1em", color: "#B9CDBF" }}>TEAM CHALLENGE · TODAY</div>
                      <div style={{ width: 30, height: 30, borderRadius: 10, background: "#FFFFFF1E", display: "grid", placeItems: "center" }}><Icon name={tc.icon} size={16} color={AMBER} /></div>
                    </div>
                    <div className="rh" style={{ fontSize: 22, color: "#FFF", margin: "3px 0 12px" }}>{tc.label(tcTarget)}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 800, marginBottom: 7 }}>
                      <span style={{ color: "#DCE8DE" }}>{tc.fmt(tcVal, tcTarget)}</span>
                      <span style={{ color: tcDone ? AMBER : "#B9CDBF" }}>{tcDone ? "Complete! +300 banked" : `${Math.round(Math.min(tcVal / tcTarget, 1) * 100)}%`}</span>
                    </div>
                    <div style={{ height: 10, background: "#FFFFFF24", borderRadius: 99, overflow: "hidden" }}><div style={{ width: `${Math.min(tcVal / tcTarget, 1) * 100}%`, height: "100%", background: AMBER, borderRadius: 99, transition: "width .5s ease" }} /></div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#8FAE97", marginTop: 9 }}>Scales with your squad — {roster.length} member{roster.length === 1 ? "" : "s"} today. New challenge every day.</div>
                  </div>

                  {/* personal bonus objectives */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "2px 2px 0" }}>
                    <div className="rh" style={{ fontSize: 16 }}>Your daily bonuses</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: GREEN_D }}>{doneCount}/{CHALLENGES.length} done</div>
                  </div>
                  <div style={{ fontSize: 12, color: MUT, fontWeight: 600, marginTop: -8, lineHeight: 1.5 }}>
                    These complete automatically as you log on Home — each one adds bonus points on top.
                  </div>
                  {/* Wildcard — optional, changes daily */}
                  <button className="rp rtap" onClick={() => setLog((l) => ({ ...l, wild: !l.wild }))} style={{ padding: "16px 18px", width: "100%", border: "none", textAlign: "left", cursor: "pointer", background: log.wild ? "#E8863A" : "#FBEEDD" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 13, background: log.wild ? "#FFFFFF26" : "#FFFDF8", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="bolt" size={20} color={log.wild ? "#FFF" : "#E8863A"} /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", color: log.wild ? "#FFF3E6" : "#B37B3F" }}>WILDCARD {"·"} OPTIONAL {"·"} +150</div>
                        <div className="rh" style={{ fontSize: 15.5, color: log.wild ? "#FFF" : INK }}>{wildTxt}</div>
                      </div>
                      <div style={{ width: 26, height: 26, borderRadius: 99, border: `2.5px solid ${log.wild ? "#FFF" : "#E3C9A8"}`, background: log.wild ? "#FFF" : "transparent", display: "grid", placeItems: "center", flexShrink: 0 }}>{log.wild && <Icon name="check" size={14} color="#E8863A" />}</div>
                    </div>
                  </button>
                  {/* Team pick: custom challenge */}
                  {(() => {
                    const cc = team?.custom;
                    const alive = cc && chDayIndex(cc.start) <= cc.days;
                    if (alive) {
                      const day = chDayIndex(cc.start);
                      const wStart = cc.start;
                      const total = roster.reduce((s, p) => s + Object.entries(p.logs || {}).filter(([d, l]) => l.cc && new Date(d + "T12:00:00").getTime() >= wStart - 43200000 && new Date(d + "T12:00:00").getTime() <= wStart + cc.days * 86400000).length, 0);
                      const max = roster.length * cc.days;
                      return (
                        <div className="rp" style={{ padding: "16px 18px", border: `2px solid ${FOREST}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", color: FOREST }}>TEAM PICK {"·"} DAY {Math.min(day, cc.days)} OF {cc.days}</div>
                            <button className="rghost" onClick={() => { if (confirm("End this team challenge for everyone?")) saveTeamCustom(null); }}>End</button>
                          </div>
                          <div className="rh" style={{ fontSize: 19, margin: "3px 0 2px" }}>{cc.title}</div>
                          <div style={{ fontSize: 11.5, color: MUT, fontWeight: 700, marginBottom: 10 }}>pitched by {cc.by} {"·"} +100 pts per check-in</div>
                          <div style={{ height: 9, background: "#F1EADD", borderRadius: 99, overflow: "hidden", marginBottom: 6 }}><div style={{ width: `${Math.min(total / Math.max(max, 1), 1) * 100}%`, height: "100%", background: FOREST, borderRadius: 99, transition: "width .5s ease" }} /></div>
                          <div style={{ fontSize: 11.5, fontWeight: 800, color: MUT, marginBottom: 11 }}>{total} of {max} squad check-ins</div>
                          <button className={log.cc ? "rbtn2" : "rbtn"} onClick={() => setLog((l) => ({ ...l, cc: !l.cc }))} style={log.cc ? { border: `2px solid ${FOREST}`, color: FOREST } : {}}>{log.cc ? "✓ Checked in today" : "I did it today"}</button>
                        </div>
                      );
                    }
                    return <PitchCard onPitch={(title, days) => saveTeamCustom({ id: `${Date.now()}`, title, days, start: Date.now(), by: me.name })} />;
                  })()}

                  {CHALLENGES.filter((c) => c.id !== "c_wild" && c.id !== "c_custom").map((c) => {
                    const done = c.done(log);
                    return (
                      <div key={c.id} className="rp" style={{ padding: "13px 15px", display: "flex", alignItems: "center", gap: 12, borderColor: done ? c.color : LINE, background: done ? `${c.color}0F` : CARD }}>
                        <div style={{ width: 38, height: 38, borderRadius: 12, background: done ? c.color : "#F1EEE3", display: "grid", placeItems: "center" }}>{done ? <Icon name="check" size={17} color="#FFF" /> : <Icon name={c.icon} size={18} color={c.color} />}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: 14 }}>{c.name}</div>
                          <div style={{ fontSize: 11.5, fontWeight: 800, color: done ? c.color : MUT }}>{done ? "Earned" : "Bonus"} +{c.bonus} pts</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* BREATHE */}
            {tab === "breathe" && (
              <>
              <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
                <ZenBG z={ZEN[zenIdx]} style={{ width: "100%", height: "100%" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(22,30,26,.38) 0%, rgba(22,30,26,.05) 30%, rgba(22,30,26,.05) 62%, rgba(22,30,26,.5) 100%)" }} />
              </div>
              <div style={{ display: "grid", gap: 12, paddingTop: 8, position: "relative", zIndex: 1 }}>

                {/* header on the sky */}
                <div className="r1" style={{ textAlign: "center", position: "relative", paddingTop: 8 }}>
                  <button className="rpill" onClick={() => setZenIdx((zenIdx + 1) % ZEN.length)} aria-label="Change scenery" style={{ position: "absolute", right: 0, top: 6, background: "rgba(255,253,248,.28)", backdropFilter: "blur(5px)", color: "#FFF" }}><Icon name="ranks" size={15} color="#FFF" /></button>
                  <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 40, color: "#FFF", letterSpacing: ".01em", textShadow: "0 2px 14px rgba(15,22,18,.5)" }}>Breathe</div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: "rgba(255,255,255,.92)", textShadow: "0 1px 8px rgba(15,22,18,.5)", marginTop: 4, padding: "0 24px", lineHeight: 1.45 }}>{dailyPick(AFFIRMATIONS)}</div>
                </div>

                {/* breathing, directly on the scene */}
                <div className="r2" style={{ position: "relative", padding: "22px 0 8px" }}>
                  <button className="rpill" onClick={() => setZenFull("breath")} aria-label="Fullscreen" style={{ position: "absolute", top: 0, right: 0, padding: "7px 10px", background: "rgba(255,253,248,.28)", backdropFilter: "blur(5px)" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.4" strokeLinecap="round"><path d="M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5" /></svg></button>
                  <BreathBox light onDone={() => setLog((l) => ({ ...l, meditation: (Number(l.meditation) || 0) + 1 }))} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.72)", textAlign: "center", marginTop: 10, textShadow: "0 1px 6px rgba(15,22,18,.5)" }}>Finishing all 4 cycles adds a minute to Meditation.</div>
                </div>

                {/* quote */}
                <div className="rp r3" style={{ padding: "18px 20px", display: "flex", alignItems: "flex-start", gap: 13, background: "rgba(255,253,248,.9)", backdropFilter: "blur(8px)" }}>
                  <div className="rh" style={{ fontSize: 34, lineHeight: .6, color: "#B9AE96", marginTop: 8 }}>{"“"}</div>
                  {(() => { const q = QUOTES[(([...today()].reduce((a, c) => a * 33 + c.charCodeAt(0), 5) >>> 0) + mantraSeed) % QUOTES.length]; return (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15.5, fontWeight: 700, fontStyle: "italic", color: "#4A5240", lineHeight: 1.45 }}>{q.t}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#9A9283", marginTop: 6 }}>{"—"} {q.by}</div>
                  </div>
                  ); })()}
                  <button className="rpill" onClick={() => setMantraSeed((s) => s + 1)} style={{ padding: "8px 12px" }}>{"↻"}</button>
                </div>

                {/* focus */}
                <div className="rp r4" style={{ padding: "18px 20px", position: "relative", background: "rgba(255,253,248,.9)", backdropFilter: "blur(8px)" }}>
                  <button className="rpill" onClick={() => setZenFull("focus")} aria-label="Fullscreen" style={{ position: "absolute", top: 12, right: 12, padding: "7px 10px" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6A6250" strokeWidth="2.4" strokeLinecap="round"><path d="M4 9V4h5M20 15v5h-5M15 4h5v5M9 20H4v-5" /></svg></button>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                    <img src={IMGS.focus} alt="" style={{ width: 34, height: 34, borderRadius: 12, objectFit: "cover" }} />
                    <div style={{ fontWeight: 800, fontSize: 15.5 }}>Focus session</div>
                  </div>
                  <FocusTimer minutes={Number(log.focus) || 0} onBank={(m) => setLog((l) => ({ ...l, focus: (Number(l.focus) || 0) + m }))} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: MUT, marginTop: 10 }}>Banked minutes land in your Focus habit on Home {"—"} hit Save to lock them in.</div>
                </div>
              </div>
              </>
            )}

            {/* RANKS */}
            {tab === "ranks" && !view && (
              <div style={{ display: "grid", gap: 12, paddingTop: 8 }}>
                <div style={{ position: "relative", borderRadius: 28, overflow: "hidden", height: 190, boxShadow: "0 14px 32px rgba(90,74,48,.18)" }}>
                  <img src={RANKS_IMG} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 38%" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(24,30,24,.06) 30%, rgba(24,30,24,.42) 100%)" }} />
                  <div style={{ position: "absolute", left: 18, top: 16 }}>
                    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 34, color: "#2E3327", textShadow: "0 1px 8px rgba(245,240,225,.6)" }}>Ranks</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "#3A4234", textShadow: "0 1px 6px rgba(245,240,225,.55)" }}>Climb higher. Together.</div>
                  </div>
                  <div style={{ position: "absolute", left: 14, right: 14, bottom: 12, display: "flex", background: "rgba(255,253,248,.32)", backdropFilter: "blur(6px)", borderRadius: 99, padding: 4 }}>
                    {[["week", "This week"], ["month", "This month"], ["all", "All-time"]].map(([k, l]) => (
                      <button key={k} onClick={() => setRankMode(k)} style={{ flex: 1, border: "none", borderRadius: 99, padding: "10px 0", fontWeight: 800, fontSize: 13.5, cursor: "pointer", background: rankMode === k ? FOREST : "transparent", color: rankMode === k ? "#FFF" : "#2E3327" }}>{l}</button>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 12.5, color: MUT, fontWeight: 700 }}>{team ? `${team.name} · ` : ""}{rankMode === "all" ? "All-time" : rankMode === "week" ? "This week" : mName()} · tap a player for their card</div>
                <div className="rp" style={{ padding: "6px 16px" }}>
                  {ranked.map((p, i) => (
                    <button key={p.id} className="rtap" onClick={() => setView(p)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < ranked.length - 1 ? "1.5px dashed #EFE9D6" : "none", background: "none", border: "none", width: "100%", textAlign: "left" }}>
                      <div className="rh" style={{ width: 22, fontSize: 16, color: i === 0 ? "#D9A13F" : i === 1 ? "#9AA7B4" : i === 2 ? "#B08154" : MUT }}>{i + 1}</div>
                      <Avatar player={p} size={38} />
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 800, fontSize: 14.5 }}>{p.name}{p.id === me.id ? " (you)" : ""}</div><div style={{ fontSize: 11.5, color: MUT, fontWeight: 700 }}>{p.title || autoTag(p)} · {p.days}d logged</div></div>
                      <div className="rh" style={{ fontSize: 17, color: GREEN_D }}>{p.total.toLocaleString()}</div>
                    </button>
                  ))}
                  {ranked.length === 0 && <div style={{ padding: 16, color: MUT, fontWeight: 700, fontSize: 13.5 }}>No logs yet this month.</div>}
                </div>
              </div>
            )}

            {/* PLAYER CARD */}
            {tab === "ranks" && view && (() => { const g = gearOf(view); const lifts = bestLifts(view); return (
              <div style={{ display: "grid", gap: 12, paddingTop: 8 }}>
                <button className="rghost" style={{ justifySelf: "start" }} onClick={() => setView(null)}>← Leaderboard</button>
                <div className="rp" style={{ padding: 18, display: "flex", gap: 16, alignItems: "center" }}>
                  <Avatar player={view} size={92} />
                  <div><div className="rh" style={{ fontSize: 21 }}>{view.name}</div><div style={{ fontSize: 13, fontWeight: 800, color: GREEN_D }}>{view.title || autoTag(view)}</div><div style={{ fontSize: 12.5, color: MUT, fontWeight: 700, marginTop: 4 }}>{totalOf(view).toLocaleString()} pts · {monthOf(view).length} days · {mName()}</div></div>
                </div>
                {lifts.length > 0 && (
                  <div className="rp" style={{ padding: 16 }}>
                    <div className="rlabel" style={{ marginBottom: 8 }}>Top lifts this month</div>
                    {lifts.map(([n, v]) => (<div key={n} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1.5px dashed #EFE9D6", fontSize: 13.5 }}><span style={{ fontWeight: 700 }}>{n}</span><span style={{ fontWeight: 800, color: FOREST }}>{(me.units?.weight === "kg") ? `${Math.round(v.weight * 0.4536)} kg` : `${v.weight} lb`} × {v.reps}</span></div>))}
                  </div>
                )}
                <div className="rp" style={{ padding: 16 }}><div className="rlabel" style={{ marginBottom: 10 }}>Last 14 days</div><StackChart logs={view.logs} /></div>
                {(() => { const tl = (view.logs || {})[today()] || {}; const es = monthOf(view);
                  const mTotal = es.reduce((s, [, l]) => s + dayScore(l), 0);
                  const best = es.reduce((m, [d, l]) => { const v = dayScore(l); return v > m.v ? { v, d } : m; }, { v: 0, d: null });
                  return (<>
                  <div className="rp" style={{ padding: 16 }}>
                    <div className="rlabel" style={{ marginBottom: 10 }}>Today</div>
                    {dayScore(tl) > 0 ? <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                      {CATS.filter((c) => catPts(c.id, tl) > 0).map((c) => (
                        <span key={c.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#F8F3E9", borderRadius: 99, padding: "6px 11px", fontSize: 11, fontWeight: 800 }}><Icon name={CAT_ICON[c.id]} size={12} color={c.color} />{c.name} {catPts(c.id, tl)}</span>
                      ))}
                      <span style={{ marginLeft: "auto", fontWeight: 900, fontSize: 13, color: FOREST }}>{dayScore(tl).toLocaleString()} pts</span>
                    </div> : <div style={{ fontSize: 12, fontWeight: 700, color: "#B3AA97" }}>Nothing logged yet today.</div>}
                  </div>
                  <div className="rp" style={{ padding: 16 }}>
                    <div className="rlabel" style={{ marginBottom: 10 }}>This month</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9 }}>
                      {[["Total", mTotal.toLocaleString()], ["Active days", `${es.filter(([, l]) => dayScore(l) > 0).length}`], ["Best day", best.d ? best.v.toLocaleString() : "—"]].map(([n, v]) => (
                        <div key={n} style={{ background: "#F8F3E9", borderRadius: 14, padding: "10px 11px", minWidth: 0 }}>
                          <div style={{ fontSize: 9, fontWeight: 800, color: "#9A9283", letterSpacing: ".05em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{String(n).toUpperCase()}</div>
                          <div className="rh" style={{ fontSize: 15, marginTop: 2 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  </>); })()}
              </div>
            ); })()}

            {/* TEAM */}
            {tab === "team" && !team && (
              <div style={{ display: "grid", gap: 12, paddingTop: 8 }}>
                <div className="rp" style={{ padding: "22px 18px", textAlign: "center" }}>
                  <div className="rh" style={{ fontSize: 20 }}>Flying solo</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: MUT, margin: "6px 0 14px", lineHeight: 1.55 }}>It's you vs. you — habits, streaks, and the consistency grid are all yours. Teams are here whenever you want company.</div>
                  <button className="rbtn" style={{ width: "100%", padding: "13px 0", fontSize: 14 }} onClick={() => setGridOpen(true)}>Open my consistency grid</button>
                  <button className="rghost" style={{ marginTop: 12, display: "inline-block" }} onClick={() => setPhase("pickteam")}>Join or create a team</button>
                </div>
              </div>
            )}
            {tab === "team" && team && (() => {
              const foe = globalBoard.find((t) => t.code !== team.code) || null;
              const foeTotal = foe?.total || 0;
              const rl = totalOf; // reuse
              const rivalRoster = rivalOf ? allPlayers.filter((p) => inTeam(p, rivalOf.code)) : [];
              const sideRoster = teamSide === "them" ? rivalRoster : roster;
              const catTotals = CATS.map((c) => ({ c, v: sideRoster.reduce((s, p) => s + monthOf(p).reduce((a, [, l]) => a + catPts(c.id, l), 0), 0) }));
              const maxCat = Math.max(...catTotals.map((x) => x.v), 1);
              const contributors = [...ranked].slice(0, 3);
              return (
              <div style={{ display: "grid", gap: 12, paddingTop: 8 }}>
                <div style={{ position: "relative", borderRadius: 28, overflow: "hidden", height: 210, boxShadow: "0 14px 32px rgba(90,74,48,.18)" }}>
                  <img src={TEAM_IMG} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(24,30,22,.45) 0%, rgba(24,30,22,.12) 45%, rgba(24,30,22,.35) 100%)" }} />
                  <div style={{ position: "absolute", left: 0, right: 0, top: 14, textAlign: "center" }}>
                    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 32, color: "#FFFFFF", textShadow: "0 2px 12px rgba(20,26,18,.6)" }}>{team.name}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,.94)", textShadow: "0 1px 8px rgba(20,26,18,.55)" }}>{roster.length} member{roster.length === 1 ? "" : "s"} · together we rise</div>
                  </div>
                  <div style={{ position: "absolute", left: 16, bottom: 12, right: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div style={{ color: "#FFF", textShadow: "0 1px 8px rgba(15,20,14,.55)" }}>
                      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".1em", color: "rgba(255,255,255,.85)" }}>{mName().toUpperCase()} LEAGUE</div>
                      <div className="rh" style={{ fontSize: 25 }}>{teamTotal.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 700 }}> pts</span></div>
                    </div>
                    <div style={{ background: "rgba(255,253,248,.85)", borderRadius: 99, padding: "6px 13px", fontSize: 12, fontWeight: 800 }}>{myRank ? `#${myRank} of ${globalBoard.length}` : "New"}</div>
                  </div>
                </div>

                {/* Weekly battle */}
                <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 12, paddingBottom: 2 }}>
                  {myTeams.map((t) => (
                    <button key={t.code} className={`rchip ${t.code === team.code ? "on" : ""}`} onClick={() => selectTeam(t)} style={{ flexShrink: 0 }}>
                      {t.name}{MODE_OF(t) === "party" ? " · solo team" : ""}
                    </button>
                  ))}
                  <button className="rchip" onClick={() => setPhase("pickteam")} style={{ flexShrink: 0, borderStyle: "dashed" }}>+ Join another</button>
                </div>
                {/* ---- Party mode: friendly leaderboard with card jostling ---- */}
                {MODE_OF(team) === "party" && (() => {
                  const cap = Math.max(120, roster.length * 60);
                  const res = partyResolve(cwMine || cwBlank(), roster.map((p) => p.id), cap);
                  const rows2 = roster.map((p) => ({ p, pts: weekPtsOf(p, weekKeys(0)), sw: res.swing[p.id] || 0 }))
                    .map((r) => ({ ...r, total: Math.max(0, r.pts + r.sw) })).sort((a, b) => b.total - a.total);
                  const recent = res.events.slice(-5).reverse();
                  const nameOf = (pid) => roster.find((x) => x.id === pid)?.name || "someone";
                  return (
                    <div className="rp" style={{ padding: "16px 16px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <div className="rlabel">This week's party</div>
                        <button className="rghost" onClick={() => setDeckOpen(true)}>Armoury{(cwMine?.bank || []).length > 0 ? ` · ${(cwMine.bank).length}` : ""}</button>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: MUT, marginBottom: 12, lineHeight: 1.45 }}>Friendly week — cards jostle the party score for bragging rights. Real stats and streaks are never touched. Resets Monday.</div>
                      {rows2.map((r, i) => (
                        <div key={r.p.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 0", borderBottom: i < rows2.length - 1 ? "1.5px dashed #F1EADD" : "none", background: r.p.id === me.id ? "#FAF7EE" : "none", borderRadius: 10 }}>
                          <span className="rh" style={{ width: 22, textAlign: "center", fontSize: 14, color: i === 0 ? "#D9A13F" : "#B3AA97" }}>{i + 1}</span>
                          <span style={{ width: 10, height: 10, borderRadius: 4, background: r.p.color || FOREST, flexShrink: 0 }} />
                          <span style={{ flex: 1, fontWeight: 800, fontSize: 13.5 }}>{r.p.name}{r.p.id === me.id ? " (you)" : ""}</span>
                          {r.sw !== 0 && <span style={{ fontSize: 10.5, fontWeight: 800, color: r.sw > 0 ? "#1F4033" : "#B0685A", background: r.sw > 0 ? "#F1F7EC" : "#F8F1EC", borderRadius: 99, padding: "3px 8px" }}>{r.sw > 0 ? `+${r.sw}` : r.sw}</span>}
                          <span className="rh" style={{ fontSize: 15 }}>{r.total.toLocaleString()}</span>
                        </div>
                      ))}
                      <div style={{ fontSize: 9.5, fontWeight: 700, color: "#B3AA97", textAlign: "center", marginTop: 9 }}>Card swings cap at ±{cap} per person per week, so pile-ons stay funny.</div>
                      {recent.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <div className="rlabel" style={{ marginBottom: 6 }}>Shenanigans</div>
                          {recent.map((e) => { const c = cwCardOf(e.cardId); if (!c) return null; return (
                            <div key={e.id} style={{ fontSize: 12, fontWeight: 700, color: "#4A5240", padding: "3.5px 0" }}>
                              {e.kind === "blocked" ? `${nameOf(e.target)} blocked ${nameOf(e.pid)}'s ${c.name}` : e.kind === "atk" ? `${nameOf(e.pid)} surged with ${c.name}` : e.kind === "hit" ? `${nameOf(e.pid)} bonked ${nameOf(e.target)} with ${c.name}` : e.kind === "siphon" ? `${nameOf(e.pid)} pickpocketed ${nameOf(e.target)} with ${c.name}` : e.kind === "block" ? `${nameOf(e.pid)} raised ${c.name}` : `${nameOf(e.pid)} played ${c.name}. Nothing happened. Everyone was notified.`}
                              <span style={{ fontSize: 9.5, color: "#B3AA97", fontWeight: 800 }}> · {agoStr(e.ts)}</span>
                            </div>
                          ); })}
                        </div>
                      )}
                    </div>
                  );
                })()}
                {MODE_OF(team) === "battle" && (() => {
                  const keys = weekKeys(0);
                  const myWk = (weekBoard.find((t) => t.code === team?.code)?.wk) || 0;
                  const foeW = rivalOf;
                  const foeWk = foeW?.wk || 0;
                  const myToday = roster.reduce((s, p) => s + (p.logs?.[today()] ? dayScore(p.logs[today()]) : 0), 0);
                  const foeToday = foeW ? allPlayers.filter((p) => inTeam(p, foeW.code)).reduce((s, p) => s + (p.logs?.[today()] ? dayScore(p.logs[today()]) : 0), 0) : 0;
                  const swing = myToday - foeToday;
                  const lead = myWk - foeWk;
                  return (
                <div className="rp" style={{ padding: "16px 16px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div><div className="rlabel">Weekly league</div><div style={{ fontSize: 10, fontWeight: 800, color: MUT, marginTop: 2 }}>#{Math.max(1, weekBoard.findIndex((t) => t.code === team.code) + 1)} of {weekBoard.length} on the ladder · rival locked till Monday</div></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#FBEEDD", borderRadius: 99, padding: "5px 12px" }}>
                      <Icon name="fire" size={12} color={AMBER} /><span style={{ fontSize: 11, fontWeight: 800, color: "#B4671F" }}>ends in {battleEndsIn()}</span>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
                    <div style={{ textAlign: "center" }}>
                      <TeamCrest team={team} size={58} active />
                      <div className="rh" style={{ fontSize: 15, marginTop: 2 }}>{team.name}</div>
                      <div className="rh" style={{ fontSize: 28, color: GREEN_D, lineHeight: 1 }}>{myWk.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div className="rh" style={{ fontSize: 20, color: "#B7B79E" }}>VS</div>
                      {foeW && <div style={{ fontSize: 10.5, fontWeight: 800, color: lead >= 0 ? GREEN_D : "#B0685A", marginTop: 3 }}>{lead >= 0 ? `+${lead.toLocaleString()}` : lead.toLocaleString()}</div>}
                    </div>
                    <div style={{ textAlign: "center" }}>
                      {foeW ? <TeamCrest team={foeW} size={58} /> : <div style={{ width: 58, height: 64, margin: "0 auto", borderRadius: 16, border: `2px dashed ${LINE}`, display: "grid", placeItems: "center", color: MUT, fontSize: 22 }}>?</div>}
                      <div className="rh" style={{ fontSize: 15, marginTop: 2, color: foeW ? INK : MUT }}>{foeW?.name || "Waiting for a rival…"}</div>
                      <div className="rh" style={{ fontSize: 28, color: "#8B6FC9", lineHeight: 1 }}>{foeWk.toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ height: 12, borderRadius: 99, overflow: "hidden", display: "flex", border: "1.5px solid #E4E9D6", marginTop: 14 }}>
                    <div style={{ width: `${myWk + foeWk ? (myWk / (myWk + foeWk)) * 100 : 50}%`, background: GREEN, transition: "width .7s ease" }} />
                    <div style={{ flex: 1, background: "#8B6FC9" }} />
                  </div>
                  {foeW && <div style={{ fontSize: 11, fontWeight: 800, color: lead >= 0 ? GREEN_D : "#B0685A", textAlign: "center", marginTop: 9 }}>{lead === 0 ? "Week dead even — every point decides it" : lead > 0 ? `Leading the week by ${lead.toLocaleString()}` : `Trailing the week by ${Math.abs(lead).toLocaleString()}`}</div>}
                  {lastWeekResult && (
                    <div style={{ marginTop: 10, background: lastWeekResult.won ? "#F1F7EC" : "#F8F1EC", borderRadius: 13, padding: "9px 13px", display: "flex", alignItems: "center", gap: 8 }}>
                      <Icon name={lastWeekResult.won ? "trophy" : "flag"} size={15} color={lastWeekResult.won ? "#D9A13F" : "#B0685A"} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: lastWeekResult.won ? GREEN_D : "#8A5A4E" }}>{lastWeekResult.won ? `Won last week's battle — +500 banked` : `Last week: ${lastWeekResult.winner} took it (${lastWeekResult.topPts.toLocaleString()} vs your ${lastWeekResult.myPts.toLocaleString()}). Reclaim it.`}</span>
                    </div>
                  )}
                </div>
                  );
                })()}

                {/* ---- Castle Wars ---- */}
                {MODE_OF(team) === "battle" && (() => {
                  const foeW = rivalOf;
                  const myTheme = cwThemeOf(team);
                  let foeTheme = foeW ? cwThemeOf(foeW) : null;
                  if (foeTheme && foeTheme.key === myTheme.key) foeTheme = cwAwayTheme(foeTheme);
                  const MYC = myTheme.bg2, FOEC = foeTheme ? foeTheme.bg2 : "#8B6FC9";
                  const keys = weekKeys(0);
                  const myTowers = CW_CFG.towers - (cwSiege?.foeWins || 0); /* my towers standing = 4 − rounds they won */
                  const foeTowers = CW_CFG.towers - (cwSiege?.myWins || 0);
                  const clinch = cwSiege?.clinch;
                  const dayLetters = ["M", "T", "W", "T", "F", "S", "S"];
                  const liveLead = cwLive ? cwLive.my - cwLive.foe : 0;
                  return (
                    <div className="rp" style={{ padding: "16px 16px 14px", position: "relative", overflow: "hidden" }}>
                      {cwFx && <CWFly fx={cwFx} onDone={() => setCwFx(null)} />}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <div className="rlabel">Castle Wars · daily siege</div>
                        <button className="rghost" onClick={() => setDeckOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          Armoury{(cwMine?.bank || []).length > 0 ? ` · ${(cwMine.bank).length}` : ""}
                        </button>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: MUT, marginBottom: 10, lineHeight: 1.45 }}>Win a day's round, knock down a tower — each one banks a rising bounty (2%, 3%, 4%, then 6% of their week), added to you, never taken from them.{cwPerCapita ? " Rosters are uneven, so rounds score per member — fair fight, any size." : ""}</div>
                      {!foeW ? (
                        <div style={{ fontSize: 13, fontWeight: 700, color: MUT, textAlign: "center", padding: "18px 0", lineHeight: 1.5 }}>{allTeams.length >= 2 ? "Bye week — odd number of teams on the ladder, so your walls rest. A fresh matchup locks Monday." : "The siege begins when a rival team enters the board."}</div>
                      ) : (
                        <>
                          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)", alignItems: "end", gap: 4 }}>
                            <div style={{ textAlign: "center" }}>
                              <CWCastleArt standing={myTowers} color={myTheme.key} size={150} shaking={cwShake} dragon={cwMyDragon} />
                              <div className="rh" style={{ fontSize: 13.5, marginTop: 2 }}>{team.name}</div>
                              <div style={{ fontSize: 10.5, fontWeight: 800, color: myTowers > 1 ? MYC : "#B0685A" }}>{myTowers} tower{myTowers === 1 ? "" : "s"} standing{cwMyDragon ? " · dragon perched!" : ""}</div>
                            </div>
                            <div style={{ textAlign: "center", paddingBottom: 20 }}>
                              <div style={{ background: "#FAF6ED", border: "1.5px solid #EDE5D6", borderRadius: 14, padding: "8px 12px 9px", minWidth: 74 }}>
                                <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: ".1em", color: MUT }}>TOWERS</div>
                                <div className="rh" style={{ fontSize: 24, lineHeight: 1.1, color: INK }}>
                                  <span style={{ color: MYC }}>{cwSiege?.myWins || 0}</span>
                                  <span style={{ color: "#C9C0AC", fontSize: 17 }}> – </span>
                                  <span style={{ color: FOEC }}>{cwSiege?.foeWins || 0}</span>
                                </div>
                                <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 5 }}>
                                  {[0, 1].map((side) => (
                                    <div key={side} style={{ display: "flex", gap: 2.5 }}>
                                      {[0, 1, 2, 3].map((i) => { const won = i < ((side === 0 ? cwSiege?.myWins : cwSiege?.foeWins) || 0); return (
                                        <div key={i} style={{ width: 6.5, height: 9, borderRadius: 2, background: won ? (side === 0 ? MYC : FOEC) : "#EAE2D2", border: won ? "none" : "1px solid #E0D8C6" }} />
                                      ); })}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                              <CWCastleArt standing={foeTowers} color={foeTheme ? foeTheme.key : "mountain"} size={150} dragon={cwFoeDragon} flip />
                              <div className="rh" style={{ fontSize: 13.5, marginTop: 2 }}>{foeW.name}</div>
                              <div style={{ fontSize: 10.5, fontWeight: 800, color: FOEC }}>{foeTowers} tower{foeTowers === 1 ? "" : "s"} standing{cwFoeDragon ? " · dragon perched" : ""}</div>
                            </div>
                          </div>
                          {/* round tracker */}
                          <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: 12 }}>
                            {(cwSiege?.rounds || []).map((r, i) => {
                              const bg = r.state === "my" ? myTheme.bg : r.state === "foe" ? FOEC : r.state === "live" ? "#FBF3E2" : "#F1EADD";
                              const col = r.state === "my" || r.state === "foe" ? "#FFF" : r.state === "live" ? "#B4671F" : "#B3AA97";
                              return (
                                <div key={r.day} style={{ width: 30, textAlign: "center" }}>
                                  <div title={r.day} style={{ height: 30, borderRadius: 10, background: bg, color: col, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, border: r.state === "live" ? `2px solid ${AMBER}` : "2px solid transparent" }}>
                                    {r.state === "my" ? "W" : r.state === "foe" ? "L" : r.state === "tie" ? "=" : r.state === "live" ? "•" : "·"}
                                  </div>
                                  <div style={{ fontSize: 8.5, fontWeight: 800, color: MUT, marginTop: 2 }}>{dayLetters[i]}</div>
                                </div>
                              );
                            })}
                          </div>
                          {/* live round */}
                          {!clinch && cwLive && (
                            <div style={{ marginTop: 11, background: "#FAF6ED", borderRadius: 14, padding: "9px 13px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 800 }}>
                                <span style={{ color: MYC }}>Today's siege round · {cwLive.my.toLocaleString()}</span>
                                <span style={{ color: FOEC }}>{cwLive.foe.toLocaleString()} · them</span>
                              </div>
                              <div style={{ height: 8, borderRadius: 99, overflow: "hidden", display: "flex", marginTop: 6, border: "1.5px solid #E4E9D6" }}>
                                <div style={{ width: `${cwLive.my + cwLive.foe ? (cwLive.my / (cwLive.my + cwLive.foe)) * 100 : 50}%`, background: myTheme.bg, transition: "width .6s ease" }} />
                                <div style={{ flex: 1, background: FOEC }} />
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 800, color: "#A79E8B", marginTop: 4 }}>
                                <span key={`m${cwLive.myDelta}`} className="popin">Habits {(cwLive.my - cwLive.myDelta).toLocaleString()} · Cards <b style={{ color: cwLive.myDelta > 0 ? FOREST : cwLive.myDelta < 0 ? "#B0685A" : "#A79E8B" }}>{cwLive.myDelta >= 0 ? "+" : ""}{cwLive.myDelta.toLocaleString()}</b>{cwLive.myCapped ? <span style={{ color: "#B4671F" }}> · at cap</span> : null}</span>
                                <span key={`f${cwLive.foeDelta}`} className="popin">Habits {(cwLive.foe - cwLive.foeDelta).toLocaleString()} · Cards <b style={{ color: cwLive.foeDelta < 0 ? FOREST : cwLive.foeDelta > 0 ? "#B0685A" : "#A79E8B" }}>{cwLive.foeDelta >= 0 ? "+" : ""}{cwLive.foeDelta.toLocaleString()}</b>{cwLive.foeCapped ? <span style={{ color: "#B4671F" }}> · at cap</span> : null}</span>
                              </div>
                              <div style={{ fontSize: 10.5, fontWeight: 800, color: liveLead >= 0 ? MYC : "#B0685A", textAlign: "center", marginTop: 6 }}>
                                {liveLead === 0 ? "Round tied — one card decides tonight's tower" : liveLead > 0 ? `Winning today's round by ${liveLead.toLocaleString()} — take a tower at midnight` : `Losing today's round by ${Math.abs(liveLead).toLocaleString()} — log or play a card before midnight`}
                                {(cwMine?.played || []).some((p) => p.day === today()) || (cwFoe?.played || []).some((p) => p.day === today()) ? "" : " · no cards played yet today"}
                              </div>
                            </div>
                          )}
                          {clinch && (
                            <div style={{ marginTop: 11, background: clinch.by === "my" ? "#F1F7EC" : "#F8F1EC", borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", gap: 9 }}>
                              <span style={{ fontSize: 12, fontWeight: 800, color: clinch.by === "my" ? GREEN_D : "#8A5A4E" }}>
                                {clinch.by === "my" ? `${foeW.name}'s castle has fallen — bounty banked. Fresh walls Monday.` : `Your castle fell to ${foeW.name}. Rebuild Monday — and remember this.`}
                              </span>
                            </div>
                          )}
                          {/* recent siege log */}
                          {(() => {
                            const logAll = [...(cwMine?.played || []).map((p) => ({ ...p, side: "my" })), ...(cwFoe?.played || []).map((p) => ({ ...p, side: "foe" }))].sort((a, b) => b.ts - a.ts).slice(0, 5);
                            if (logAll.length === 0) return null;
                            return (
                              <div style={{ marginTop: 11 }}>
                                <div className="rlabel" style={{ marginBottom: 6 }}>Siege log</div>
                                {logAll.map((p) => { const c = cwCardOf(p.cardId); if (!c) return null; const who = p.side === "my" ? (roster.find((x) => x.id === p.pid)?.name || team.name) : foeW.name;
                                  const ev = [...(cwLive?.myEvents || []), ...(cwLive?.foeEvents || [])].find((x) => x.id === p.id);
                                  const note = ev?.gone === "block" ? ` — blocked by ${ev.by || "a shield"}` : ev?.gone === "reflect" ? ` — reflected by ${ev.by || "a mirror"}!` : ev?.gone === "storm" ? " — lost in the Tempest" : ev?.gone === "lock" ? " — slipped and was voided" : ev?.gone === "shoo" ? " — spent shooing the dragon" : "";
                                  return (
                                  <div key={`${p.side}-${p.id}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12, fontWeight: 700, color: p.side === "my" ? "#4A5240" : FOEC }}>
                                    <span style={{ flex: 1 }}>{who} {c.fx === "atk" ? `pressed the attack with ${c.name}` : c.fx === "hit" ? `struck the walls with ${c.name}` : c.fx === "siphon" ? `raided with ${c.name}` : ["block", "cleanse", "blockall"].includes(c.fx) ? `held the line with ${c.name}` : c.fx === "buff" ? `sounded the ${c.name}` : c.fx === "threat" ? `unleashed the ${c.name}` : c.fx === "steal" ? `sent in the ${c.name}` : c.fx === "intel" ? `flew the ${c.name}` : `played ${c.name}`}{note && <span style={{ color: "#B4671F" }}>{note}</span>}</span>
                                    <span style={{ fontSize: 10, fontWeight: 800, color: "#B3AA97" }}>{agoStr(p.ts)}</span>
                                  </div>
                                ); })}
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  );
                })()}
                {false && <div>
                <div style={{ height: 12, borderRadius: 99, overflow: "hidden", display: "flex", border: "1.5px solid #E4E9D6", marginTop: 14 }}>                <div style={{ height: 12, borderRadius: 99, overflow: "hidden", display: "flex", border: "1.5px solid #E4E9D6", marginTop: 14 }}>
                    <div style={{ width: `${teamTotal + foeTotal ? (teamTotal / (teamTotal + foeTotal)) * 100 : 50}%`, background: GREEN, transition: "width .7s ease" }} />
                    <div style={{ flex: 1, background: "#8B6FC9" }} />
                  </div>
                </div>
                </div>}

                {/* Team progress by category */}
                <div className="rp" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div className="rlabel">{teamSide === "them" ? `Scouting ${rivalOf?.name || "the rival"}` : "Team progress"}</div>
                    <div style={{ display: "flex", background: "#EFE8D8", borderRadius: 99, padding: 3 }}>
                      {[["us", "Us"], ["them", rivalOf ? "Rival" : "Rival —"]].map(([k, l]) => (
                        <button key={k} disabled={k === "them" && !rivalOf} onClick={() => setTeamSide(k)} style={{ border: "none", borderRadius: 99, padding: "6px 13px", fontWeight: 800, fontSize: 11.5, cursor: rivalOf || k === "us" ? "pointer" : "default", background: teamSide === k ? "#FFFDF8" : "transparent", color: teamSide === k ? INK : "#8A8272", opacity: k === "them" && !rivalOf ? .45 : 1 }}>{l}</button>
                      ))}
                    </div>
                  </div>
                  {teamSide === "them" && rivalOf && <div style={{ fontSize: 11, fontWeight: 700, color: "#8B6FC9", marginBottom: 10 }}>Where {rivalOf.name} earns their points — find the category they're weak in.</div>}
                  {catTotals.filter((x) => x.v > 0 || true).map(({ c, v }) => (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: c.pale, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={CAT_ICON[c.id]} size={16} color={c.color} /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 800, marginBottom: 4 }}><span>{c.name}</span><span style={{ color: MUT }}>{v.toLocaleString()} pts</span></div>
                        <div style={{ height: 7, background: "#EDE9DA", borderRadius: 99, overflow: "hidden" }}><div style={{ width: `${(v / maxCat) * 100}%`, height: "100%", background: c.color, borderRadius: 99 }} /></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top contributors */}
                <div className="rp" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <div className="rlabel">Top contributors</div>
                    <button className="rghost" onClick={() => { setTab("ranks"); refresh(); }}>See all</button>
                  </div>
                  {contributors.map((p, i) => (
                    <div key={p.id} className="rtap" onClick={() => { setTab("ranks"); setView(p); }} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", cursor: "pointer", borderBottom: i < contributors.length - 1 ? "1.5px dashed #EFE9D6" : "none" }}>
                      <div style={{ width: 22, height: 22, borderRadius: 99, background: ["#F5E4B8", "#E4E7EC", "#EFD9C4"][i] || "#EEF0E6", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 11, color: ["#B9860B", "#7C8698", "#A9744A"][i] }}>{i + 1}</div>
                      <Avatar player={p} size={32} />
                      <div style={{ flex: 1, fontWeight: 800, fontSize: 14 }}>{p.name}{p.id === me.id ? " (you)" : ""}</div>
                      <div className="rh" style={{ fontSize: 15, color: p.id === me.id ? GREEN_D : INK }}>{p.total.toLocaleString()} pts</div>
                    </div>
                  ))}
                  {contributors.length === 0 && <div style={{ fontSize: 13, color: MUT, fontWeight: 700 }}>No logs yet — first to log leads.</div>}
                  <div style={{ fontSize: 11.5, color: SAGE, fontWeight: 800, marginTop: 10, textAlign: "center" }}>All contributions count · self-reported for now — wearable sync coming</div>
                </div>

                {/* Team feed */}
                <div className="rp" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <div className="rlabel">Team feed & chat</div>
                    <div style={{ display: "flex", gap: 5 }}>
                      {[["all", "All"], ["chat", "Chat"]].map(([k, l]) => (
                        <button key={k} className={`rchip ${feedFilter === k ? "on" : ""}`} onClick={() => setFeedFilter(k)} style={{ padding: "5px 11px", fontSize: 11 }}>{l}</button>
                      ))}
                    </div>
                    <button className="rghost" onClick={refresh}>Refresh</button>
                  </div>
                  {feedFilter === "chat" && (
                    <div style={{ display: "flex", flexDirection: "column", height: 340 }}>
                      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingBottom: 6 }}>
                        {chat.length === 0 && <div style={{ fontSize: 13, color: MUT, fontWeight: 700, textAlign: "center", marginTop: 26 }}>No messages yet — say hi to the squad.</div>}
                        {chat.map((m) => { if (m.cw) return null; if (false) { const cwText = String(m.text || "").replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{1F1E6}-\u{1F1FF}]/gu, "").replace(/\s{2,}/g, " ").trim(); return (
                          <div key={m.id} style={{ textAlign: "center", margin: "3px 0" }}>
                            <div style={{ display: "inline-block", background: "#FBF3DF", border: "1.5px solid #EAD9AE", borderRadius: 12, padding: "6px 12px", fontSize: 11.5, fontWeight: 700, color: "#8A6A1E", lineHeight: 1.4, maxWidth: "88%" }}>{cwText}</div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: "#B3AA97", marginTop: 2 }}>{agoStr(m.ts)}</div>
                          </div>
                        ); } const mine = m.pid === me.id; const pl = roster.find((p) => p.id === m.pid); return (
                          <div key={m.id} style={{ display: "flex", gap: 8, flexDirection: mine ? "row-reverse" : "row", alignItems: "flex-end" }}>
                            {!mine && (pl ? <Avatar player={pl} size={26} /> : <div style={{ width: 26 }} />)}
                            <div style={{ maxWidth: "76%" }}>
                              {!mine && <div style={{ fontSize: 10, fontWeight: 800, color: MUT, marginBottom: 2, marginLeft: 4 }}>{m.name}</div>}
                              <div style={{ background: mine ? FOREST : "#F1EADD", color: mine ? "#FFF" : INK, borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "9px 13px", fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{m.text}</div>
                              <div style={{ fontSize: 9.5, fontWeight: 700, color: "#B3AA97", marginTop: 2, textAlign: mine ? "right" : "left", padding: "0 4px" }}>{agoStr(m.ts)}</div>
                            </div>
                          </div>
                        ); })}
                      </div>
                      <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: "1.5px dashed #EFE9D6" }}>
                        <input className="rin" maxLength={200} value={shout} onChange={(e) => setShout(e.target.value)} onKeyDown={async (e) => { if (e.key === "Enter" && shout.trim()) { const t = shout.trim(); setShout(""); const n = await chatPost(team.code, { pid: me.id, name: me.name, text: t }); if (n) setChat(n); } }} placeholder="Message the squad…" style={{ flex: 1, padding: "11px 14px", fontSize: 14 }} />
                        <button className="rbtn" disabled={!shout.trim()} style={{ width: "auto", padding: "11px 18px", fontSize: 13.5 }} onClick={async () => { const t = shout.trim(); setShout(""); const n = await chatPost(team.code, { pid: me.id, name: me.name, text: t }); if (n) setChat(n); }}>Send</button>
                      </div>
                    </div>
                  )}
                  {feedFilter !== "chat" && feed.length === 0 && <div style={{ fontSize: 13, color: MUT, fontWeight: 700 }}>Quiet so far {"—"} milestones show up here as the squad logs them.</div>}
                  {feedFilter !== "chat" && feed.length > 8 && <button className="rghost" style={{ width: "100%", marginTop: 6, fontSize: 11.5 }} onClick={() => setFeedMore((x) => !x)}>{feedMore ? "Show fewer" : `Show earlier · ${Math.min(feed.length, 40) - 8} more`}</button>}
                  {feedFilter !== "chat" && feed.slice(0, feedMore ? 40 : 8).map((ev, i) => {
                    const pl = roster.find((p) => p.id === ev.pid);
                    const cheered = (ev.cheers || []).includes(me.id);
                    return (
                      <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: i < Math.min(feed.length, 12) - 1 ? "1.5px dashed #EFE9D6" : "none" }}>
                        {pl ? <Avatar player={pl} size={30} /> : <div style={{ width: 30, height: 30, borderRadius: 99, background: "#EEE8D8", display: "grid", placeItems: "center" }}><Icon name={["steps","water","sleep","workout","meditation","reading","journal","fasting","focus","bolt","goals","trophy","team","fire","star","check","flag"].includes(ev.icon) ? ev.icon : "star"} size={15} color="#8A8272" /></div>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontWeight: 800, fontSize: 13.5 }}>{ev.name}</span>{" "}
                          <span style={{ fontWeight: ev.shout ? 700 : 600, fontSize: 13, color: ev.shout ? INK : "#6A6250", fontStyle: ev.shout ? "italic" : "normal" }}>{ev.shout ? `“${ev.text}”` : ev.text}</span>
                          <div style={{ fontSize: 10.5, fontWeight: 700, color: MUT, marginTop: 1 }}>{agoStr(ev.ts)}</div>
                        </div>
                        <button onClick={async () => { const next = await feedCheer(team.code, ev.id, me.id); if (next) setFeed(next); }} aria-pressed={cheered} style={{ display: "flex", alignItems: "center", gap: 4, border: "none", background: cheered ? "#FBEEDD" : "#F5F0E4", borderRadius: 99, padding: "6px 11px", cursor: "pointer", flexShrink: 0 }}>
                          <Icon name="fire" size={13} color={cheered ? AMBER : "#A79E8B"} /><span style={{ fontSize: 11.5, fontWeight: 800, color: cheered ? "#B4671F" : "#8A8272" }}>{(ev.cheers || []).length || ""}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Emblem editor */}
                <div className="rp" style={{ padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <TeamCrest team={team} size={40} active />
                    <div style={{ flex: 1, fontWeight: 800, fontSize: 14 }}>Team emblem</div>
                    {(team.founder === me.id || roster.length === 1) && (
                      <button onClick={async () => { const fresh = (await sGet(TK(team.code), true)) || team; const upd = { ...fresh, public: !fresh.public }; await sSet(TK(team.code), upd, true); setTeam(upd); refresh(); }} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1.5px solid " + (team.public ? "#CBDCC9" : "#E4DCC9"), background: team.public ? "#F1F7EC" : "#FAF6ED", color: team.public ? GREEN_D : "#8A8272", borderRadius: 99, padding: "5px 11px", fontSize: 11, fontWeight: 800, cursor: "pointer", marginRight: 8 }} aria-label="Toggle team visibility">
                        <span style={{ width: 7, height: 7, borderRadius: 99, background: team.public ? FOREST : "#B3AA97" }} />{team.public ? "Public" : "Private"}
                      </button>
                    )}
                    <button className="rghost" onClick={() => setEmblemOpen((v) => !v)}>{emblemOpen ? "Done" : "Customize"}</button>
                  </div>
                  {emblemOpen && (<>
                    <div>
                      <div className="rlabel" style={{ margin: "6px 0 8px" }}>Crest</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <TeamCrest team={team} size={64} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#9A9283", lineHeight: 1.5, marginBottom: 8 }}>One of fifty finished crests. Pick any — it updates for everyone on the team instantly.</div>
                          <button className="rbtn" onClick={() => setCrestPickOpen(true)} style={{ padding: "9px 16px", fontSize: 13 }}>Browse all 50</button>
                        </div>
                      </div>
                    </div>
                  </>)}
                </div>

                {/* League */}
                <div className="rp" style={{ padding: 16 }}>
                  <div className="rlabel" style={{ marginBottom: 10 }}>League · all teams · {mName()}</div>
                  {globalBoard.map((t, i) => { const isPeek = peekTeam === t.code; const members = allPlayers.filter((p) => inTeam(p, t.code)).map((p) => ({ ...p, tot: rankMode === "all" ? allTimeOf(p) : totalOf(p) })).sort((a, b) => b.tot - a.tot); return (<React.Fragment key={t.code}>
                    <div onClick={() => setPeekTeam(isPeek ? null : t.code)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: !isPeek && i < globalBoard.length - 1 ? "1.5px dashed #EFE9D6" : "none", background: t.code === team.code ? "#F1F7EC" : "transparent", borderRadius: 10, paddingLeft: t.code === team.code ? 8 : 0, cursor: "pointer" }}>
                      <div className="rh" style={{ width: 20, fontSize: 15, color: i === 0 ? "#D9A13F" : MUT }}>{i + 1}</div>
                      <TeamCrest team={t} size={26} />
                      <div style={{ flex: 1, fontWeight: 800, fontSize: 14 }}>{t.name}{t.code === team.code ? " (you)" : ""}</div>
                      <div style={{ fontSize: 11.5, color: MUT, fontWeight: 700 }}>{t.count}p</div>
                      <div className="rh" style={{ fontSize: 15, color: GREEN_D, minWidth: 54, textAlign: "right" }}>{t.total.toLocaleString()}</div>
                      <svg width="13" height="13" viewBox="0 0 24 24" style={{ transform: isPeek ? "rotate(90deg)" : "none", transition: "transform .2s" }}><path d="M9 5l7 7-7 7" fill="none" stroke={MUT} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    {isPeek && (
                      <div style={{ background: "#FAF6ED", borderRadius: 14, padding: "6px 12px", marginBottom: 8 }}>
                        {members.map((p, j) => (
                          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0", borderBottom: j < members.length - 1 ? "1.5px dashed #EFE7D2" : "none" }}>
                            <Avatar player={p} size={24} />
                            <span style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>{p.name}</span>
                            <span style={{ fontSize: 12.5, fontWeight: 800, color: "#6A6250" }}>{p.tot.toLocaleString()} pts</span>
                          </div>
                        ))}
                        {members.length === 0 && <div style={{ fontSize: 12, color: MUT, fontWeight: 700, padding: "6px 0" }}>No members yet.</div>}
                      </div>
                    )}
                  </React.Fragment>); })}
                  {globalBoard.length <= 1 && <div style={{ fontSize: 12.5, color: MUT, fontWeight: 700, marginTop: 8, lineHeight: 1.5 }}>Just your crew so far. When another team is created on this board, the battle is automatically on.</div>}
                </div>
              </div>
            ); })()}

            {/* PROFILE */}
            {tab === "me" && (() => {
              const g = gearOf(me); const lifts = bestLifts(me);
              const xp = totalXP(me.logs); const L = levelOf(xp); const badges = earnedBadges(me.logs);
              return (
              <div style={{ display: "grid", gap: 12, paddingTop: 8 }}>
                <div className="r1" style={{ position: "relative", borderRadius: 28, overflow: "hidden", height: 188, boxShadow: "0 14px 32px rgba(90,74,48,.18)" }}>
                  <img src={PROFILE_IMG} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 42%" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(28,26,20,.05) 30%, rgba(28,26,20,.55) 100%)" }} />
                </div>
                <div className="r1" style={{ display: "flex", gap: 15, alignItems: "center", padding: "0 2px", marginTop: -40, position: "relative", zIndex: 1, paddingLeft: 14 }}>
                  <div style={{ borderRadius: 99, boxShadow: "0 4px 14px rgba(30,30,20,.3)", background: "#FFFDF8", padding: 3 }}><Avatar player={me} size={62} /></div>
                  <div style={{ flex: 1, minWidth: 0, paddingTop: 26 }}>
                    {editName === null ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="rh" style={{ fontSize: 30, letterSpacing: "-.03em", lineHeight: 1 }}>{me.name}</div>
                        <button className="rghost" onClick={() => setEditName(me.name)} aria-label="Edit name" style={{ textDecoration: "none", fontSize: 15 }}>✎</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 7 }}>
                        <input className="rin" maxLength={18} value={editName} onChange={(e) => setEditName(e.target.value)} style={{ padding: "9px 12px", fontSize: 15 }} />
                        <button className="rbtn" style={{ width: "auto", padding: "9px 16px", fontSize: 13 }} onClick={async () => { const err = await saveRename(editName); if (err) alert(err); else setEditName(null); }}>Save</button>
                      </div>
                    )}
                    <span style={{ display: "inline-block", fontSize: 11, fontWeight: 800, color: "#FFF", background: FOREST, borderRadius: 99, padding: "4px 12px", marginTop: 7 }}>{me.title || autoTag(me)}</span><span style={{ display: "inline-block", fontSize: 10, fontWeight: 800, color: "#B3AA97", marginLeft: 8 }}>v38</span>
                  </div>
                </div>
                {/* ---- Character (compact, v33.2) ---- */}
                {(() => {
                  const tier = charTierOf(L.lv); const nxt = charNextTier(L.lv);
                  const cls = CHAR_CLASSES.find((c) => c.id === (me.charClass || "pathfinder")) || CHAR_CLASSES[0];
                  return (
                    <div className="rp r1" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ background: "#F7F2E7", borderRadius: 18, padding: "8px 10px 2px", flexShrink: 0 }}>
                        <CharacterHero level={L.lv} classId={me.charClass || "pathfinder"} size={0.5} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="rlabel" style={{ marginBottom: 4 }}>Your character</div>
                        <div className="rh" style={{ fontSize: 21 }}>{tier.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                          <img src={classCrest(cls.id)} alt="" width={16} height={16} style={{ width: 16, height: 16, imageRendering: "pixelated" }} draggable={false} />
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#8A6A2C" }}>{cls.name}</span>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#B3AA97", marginTop: 8, lineHeight: 1.5 }}>{nxt ? `Evolves into ${nxt.name} at level ${nxt.min}.` : "Final form."} Grows with every habit you log.</div>
                        <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
                          <button className="rghost" onClick={() => setClassPick(true)}>Change class</button>
                          <button className="rghost" onClick={() => setMyCrestPick(true)}>Personal crest</button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                <div className="rp" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span className="rlabel" style={{ marginRight: "auto" }}>Units</span>
                  {[["water", "ml", "L / ml"], ["water", "oz", "oz"]].map(([k, v, l]) => (
                    <button key={l} className={`rchip ${(me.units?.water || "ml") === v ? "on" : ""}`} onClick={() => savePrefs({ water: v })}>{l}</button>
                  ))}
                  <span style={{ width: 1, height: 20, background: "#E3DBC8" }} />
                  {[["weight", "lb", "lb"], ["weight", "kg", "kg"]].map(([k, v, l]) => (
                    <button key={l} className={`rchip ${(me.units?.weight || "lb") === v ? "on" : ""}`} onClick={() => savePrefs({ weight: v })}>{l}</button>
                  ))}
                </div>
                {/* Health profile */}
                <div className="rp" style={{ padding: "15px 18px" }}>
                  <button onClick={() => setHealthOpen((v) => !v)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, textAlign: "left", padding: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 12, background: "#E7EFE7", display: "grid", placeItems: "center" }}><Icon name="me" size={17} color={FOREST} /></div>
                    <div style={{ flex: 1, fontWeight: 800, fontSize: 14.5 }}>Health profile</div>
                    <span className="rghost" style={{ textDecoration: "none" }}>{healthOpen ? "Done" : (me.health?.w ? "Edit" : "Set up")}</span>
                  </button>
                  {(() => {
                    const h = me.health || {};
                    const kg = h.w ? (me.units?.weight === "kg" ? h.w : h.w * 0.4536) : 0;
                    const bmi = h.w && h.h ? kg / Math.pow(h.h / 100, 2) : 0;
                    const bmr = h.w && h.h && h.age ? (10 * kg + 6.25 * h.h - 5 * h.age + (h.sex === "f" ? -161 : h.sex === "x" ? -78 : 5)) : 0;
                    const tdee = bmr ? Math.round(bmr * (h.act || 1.375)) : 0;
                    const kcalIn = Number(log.kcalIn) || 0;
                    return (
                      <>
                        {healthOpen && (
                          <div style={{ marginTop: 13, display: "grid", gap: 10 }}>
                            <div style={{ display: "flex", gap: 8 }}>
                              {[["m", "Male"], ["f", "Female"], ["x", "Other"]].map(([v, l]) => <button key={v} className={`rchip ${h.sex === v ? "on" : ""}`} style={{ flex: 1 }} onClick={() => savePrefsHealth({ sex: v })}>{l}</button>)}
                              <input className="rin" type="number" inputMode="numeric" placeholder="Age" value={h.age || ""} onChange={(e) => savePrefsHealth({ age: Number(e.target.value) || undefined })} style={{ width: 80, padding: "9px 12px" }} />
                            </div>
                            <div style={{ display: "grid", gap: 10 }}>
                              <input className="rin" type="number" inputMode="decimal" placeholder={`Weight (${me.units?.weight || "lb"})`} value={h.w || ""} onChange={(e) => savePrefsHealth({ w: Number(e.target.value) || undefined })} />
                              {(me.units?.height || "cm") === "cm"
                                ? <input className="rin" type="number" inputMode="numeric" placeholder="Height (cm)" value={h.h || ""} onChange={(e) => savePrefsHealth({ h: Number(e.target.value) || undefined })} />
                                : (() => { const ti = h.h ? Math.round(h.h / 2.54) : 0; const ftV = ti ? Math.floor(ti / 12) : ""; const inV = ti ? ti % 12 : "";
                                  return <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                    <input className="rin" type="number" inputMode="numeric" placeholder="ft" value={ftV} onChange={(e) => { const ft = Number(e.target.value) || 0; const inch = ti ? ti % 12 : 0; savePrefsHealth({ h: Math.round((ft * 12 + inch) * 2.54) || undefined }); }} style={{ flex: 1, minWidth: 0, textAlign: "center", padding: "13px 6px" }} />
                                    <span style={{ fontSize: 11, fontWeight: 800, color: "#9A9283" }}>ft</span>
                                    <input className="rin" type="number" inputMode="numeric" placeholder="in" value={inV} onChange={(e) => { const inch = Number(e.target.value) || 0; const ft = ti ? Math.floor(ti / 12) : 0; savePrefsHealth({ h: Math.round((ft * 12 + inch) * 2.54) || undefined }); }} style={{ flex: 1, minWidth: 0, textAlign: "center", padding: "13px 6px" }} />
                                    <span style={{ fontSize: 11, fontWeight: 800, color: "#9A9283" }}>in</span>
                                  </div>; })()}
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: "#9A9283", alignSelf: "center", marginRight: 4 }}>HEIGHT IN</span>
                              {[["cm", "cm"], ["ft", "ft / in"]].map(([v, l]) => <button key={v} className={`rchip ${(me.units?.height || "cm") === v ? "on" : ""}`} onClick={() => savePrefs({ height: v })}>{l}</button>)}
                            </div>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 800, color: "#9A9283", marginBottom: 5 }}>HOW ACTIVE ARE YOU? <span style={{ fontWeight: 700, textTransform: "none", letterSpacing: 0 }}>· used to estimate daily calorie burn</span></div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              {[[1.2, "Desk job"], [1.375, "Lightly active"], [1.55, "Active"], [1.725, "Athlete"]].map(([v, l]) => <button key={l} className={`rchip ${(h.act || 1.375) === v ? "on" : ""}`} onClick={() => savePrefsHealth({ act: v })}>{l}</button>)}
                            </div>
                            </div>
                          </div>
                        )}
                        {h.w && h.h ? (
                          <div style={{ marginTop: 13 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                              {[["BMI", bmi.toFixed(1), ""], ["Maintenance", tdee ? tdee.toLocaleString() : "add age", tdee ? "kcal" : ""], ["Protein", `${Math.round(kg * 1.6)}–${Math.round(kg * 2.2)}`, "g/day"]].map(([n, v, u]) => (
                                <div key={n} style={{ background: "#F8F3E9", borderRadius: 15, padding: "10px 12px" }}>
                                  <div style={{ fontSize: 9.5, fontWeight: 800, color: "#9A9283", letterSpacing: ".04em" }}>{String(n).toUpperCase()}</div>
                                  <div className="rh" style={{ fontSize: 17 }}>{v}<span className="unit">{u}</span></div>
                                </div>
                              ))}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 10 }}>
                              <input className="rin" type="number" inputMode="numeric" placeholder="Calories eaten today" value={log.kcalIn || ""} onChange={(e) => setLog((l) => ({ ...l, kcalIn: e.target.value }))} style={{ flex: 1, padding: "10px 13px", fontSize: 14 }} />
                              {kcalIn > 0 && <span style={{ fontSize: 12, fontWeight: 800, color: kcalIn <= tdee ? FOREST : AMBER, whiteSpace: "nowrap" }}>{kcalIn <= tdee ? `${(tdee - kcalIn).toLocaleString()} under` : `${(kcalIn - tdee).toLocaleString()} over`}</span>}
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: MUT, marginTop: 7 }}>Estimates (Mifflin-St Jeor) — a guide, not medical advice. Saved with your day when you hit Save.</div>
                          </div>
                        ) : !healthOpen && <div style={{ fontSize: 12, fontWeight: 700, color: MUT, marginTop: 8 }}>Add weight & height for BMI and protein — age unlocks maintenance calories.</div>}
                      </>
                    );
                  })()}
                </div>
                <div className="rp r2" style={{ padding: "15px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="star" size={16} color={AMBER} />Level {L.lv}</span>
                    <span style={{ fontWeight: 800, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="me" size={15} color={GREEN_D} />{charTierOf(L.lv).name}</span>
                    <span style={{ fontSize: 11.5, color: MUT, fontWeight: 700 }}>{L.into.toLocaleString()} / {L.span.toLocaleString()} XP</span>
                  </div>
                  <div style={{ height: 9, background: "#F1EADD", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(L.into / L.span, 1) * 100}%`, height: "100%", background: AMBER, borderRadius: 99, transition: "width .6s ease" }} />
                  </div>
                </div>

                {/* Your stats */}
                {(() => {
                  const es = monthOf(me);
                  const sumSteps = es.reduce((s, [, l]) => s + (Number(l.steps) || 0), 0);
                  const sumWater = es.reduce((s, [, l]) => s + (Number(l.water) || 0), 0) / 1000;
                  const woDays = es.filter(([, l]) => ptsWorkout(l) > 0).length;
                  const sumSleep = es.reduce((s, [, l]) => s + (Number(l.sleep) || 0), 0);
                  const cells = [
                    { ic: "steps", col: "#5E9E5B", n: "Steps", v: sumSteps.toLocaleString(), c: "#EEF5E8" },
                    { ic: "water", col: "#4E9BD8", n: "Hydration", v: `${sumWater.toFixed(1)} L`, c: "#EAF3FB" },
                    { ic: "workout", col: "#8B6FC9", n: "Workouts", v: woDays, c: "#F1EDF9" },
                    { ic: "sleep", col: "#E0A438", n: "Sleep", v: `${sumSleep} hr`, c: "#FBF3E2" },
                  ];
                  return (<>
                    {(() => { const eq = lifetimeEquivalents(me.logs); if (!eq.length) return null; return (
                  <div className="rp" style={{ padding: "16px 16px 8px", marginBottom: 16 }}>
                    <div className="rlabel" style={{ marginBottom: 10 }}>Lifetime, in perspective</div>
                    {eq.map((x) => (
                      <div key={x.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0" }}>
                        <div style={{ width: 34, height: 34, borderRadius: 12, background: x.color + "22", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={x.icon} size={16} color={x.color} /></div>
                        <div style={{ flex: 1 }}>
                          <span className="rh" style={{ fontSize: 16 }}>{x.v}</span> <span style={{ fontWeight: 800, fontSize: 12.5 }}>{x.label}</span>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#B3AA97" }}>{x.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ); })()}
                    <div className="rp" style={{ padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                        <div className="rlabel">Your stats</div><div style={{ fontSize: 11.5, color: MUT, fontWeight: 700 }}>this month</div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {cells.map((x) => (
                          <div key={x.n} style={{ background: x.c, borderRadius: 18, padding: "14px 15px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11.5, fontWeight: 800, color: "#7C7565" }}><Icon name={x.ic} size={16} color={x.col} />{x.n}</div>
                            <div className="rh" style={{ fontSize: 27, marginTop: 5, letterSpacing: "-.02em" }}>{String(x.v).split(" ")[0]}<span className="unit">{String(x.v).split(" ").slice(1).join(" ")}</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>);
                })()}

                {/* Badges */}
                <div className="rp" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                    <div className="rlabel">Badges</div>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: GREEN_D }}>{badges.length} of {BADGES.length} earned</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(70px,1fr))", gap: 12, justifyItems: "center" }}>
                    {BADGES.map((b) => <Badge key={b.id} badge={b} earned={badges.some((x) => x.id === b.id)} size={58} />)}
                  </div>
                </div>
                <div className="rp" style={{ padding: 16 }}>
                  <div className="rlabel" style={{ marginBottom: 8 }}>Your title</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>{TITLES.map((t) => (<button key={t} className={`rchip ${me.title === t ? "on" : ""}`} onClick={() => { setTitleEdit(t); saveTitle(t); }}>{t}</button>))}</div>
                  <div style={{ display: "flex", gap: 8 }}><input className="rin" maxLength={22} value={titleEdit} onChange={(e) => setTitleEdit(e.target.value)} placeholder="…or invent your own" /><button className="rpill" onClick={() => saveTitle(titleEdit.trim())}>Set</button></div>
                </div>
                {lifts.length > 0 && (
                  <div className="rp" style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", width: "100%" }}><div className="rlabel" style={{ marginBottom: 8 }}>Personal records · {mName()}</div><button className="rghost" onClick={() => setGymOpen(true)}>All-time & history →</button></div>
                    {lifts.map(([n, v]) => (<div key={n} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1.5px dashed #EFE9D6", fontSize: 13.5 }}><span style={{ fontWeight: 700 }}>{n}</span><span style={{ fontWeight: 800, color: FOREST }}>{(me.units?.weight === "kg") ? `${Math.round(v.weight * 0.4536)} kg` : `${v.weight} lb`} × {v.reps}</span></div>))}
                  </div>
                )}
                {/* Calendar */}
                <div className="rp" style={{ padding: 16 }}>
                  <div className="rlabel" style={{ marginBottom: 10 }}>Calendar {"·"} tap a day</div>
                  <MonthCalendar logs={me.logs || {}} grat={gratMap} />
                </div>

                {/* Gratitude jar */}
                {(() => { const n = Object.entries(me.logs || {}).filter(([d, l]) => d.slice(0, 7) === today().slice(0, 7) && l.journal).length; return (
                <div className="rp" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                    <div className="rlabel">Gratitude jar</div>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: FOREST }}>{n} this month</div>
                  </div>
                  <div className="rtap" onClick={() => setJournalOpen(true)} style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
                    <GratitudeJar logs={me.logs || {}} size={128} />
                    <div style={{ flex: 1, fontSize: 12.5, color: MUT, fontWeight: 600, lineHeight: 1.55 }}>
                      Every journaled day drops a token in the jar. {n === 0 ? "Write your first entry on the Home tab." : n >= 20 ? "A full jar — beautiful month." : "Watch it fill as the month goes on."}
                    </div>
                  </div>
                </div>
                ); })()}

                <div className="rp" style={{ padding: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div className="rlabel">Stats</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[["month", "Month"], ["cats", "Categories"], ["trend", "Trends"]].map(([k, l]) => (
                        <button key={k} className={`rchip ${chartTab === k ? "on" : ""}`} onClick={() => setChartTab(k)} style={{ padding: "6px 11px", fontSize: 11.5 }}>{l}</button>
                      ))}
                    </div>
                  </div>
                  {chartTab === "month" && <MonthChart logs={me.logs || {}} />}
                  {chartTab === "cats" && (() => {
                    const mk = today().slice(0, 7);
                    const entries = Object.entries(me.logs || {}).filter(([d]) => d.slice(0, 7) === mk);
                    const perCat = CATS.map((c) => ({ ...c, pts: entries.reduce((s, [, l]) => s + catPts(c.id, l), 0) })).sort((a, b) => b.pts - a.pts);
                    const mx = Math.max(...perCat.map((c) => c.pts), 1);
                    const kcal = entries.reduce((s, [, l]) => s + kcalOf(l), 0);
                    return (
                      <div>
                        {perCat.map((c) => (
                          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0" }}>
                            <span style={{ width: 86, fontSize: 12, fontWeight: 800, color: "#6A6250" }}>{c.name}</span>
                            <div style={{ flex: 1, height: 12, background: "#F1EADD", borderRadius: 99, overflow: "hidden" }}><div style={{ width: `${(c.pts / mx) * 100}%`, height: "100%", background: c.color, borderRadius: 99 }} /></div>
                            <span style={{ width: 52, textAlign: "right", fontSize: 12, fontWeight: 800 }}>{c.pts.toLocaleString()}</span>
                          </div>
                        ))}
                        <div style={{ marginTop: 12, position: "relative", borderRadius: 16, overflow: "hidden", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                          <img src={KCAL_IMG} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 45%" }} />
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(250,244,230,.9) 30%, rgba(250,244,230,.55) 100%)" }} />
                          <div style={{ position: "relative", flex: 1 }}>
                            <div className="rh" style={{ fontSize: 19 }}>~{kcal.toLocaleString()}<span className="unit">kcal burned</span></div>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#8A5A2E" }}>Rough estimate from steps + workout minutes this month</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  {chartTab === "trend" && (() => {
                    const weeks = [];
                    for (let w = 7; w >= 0; w--) {
                      const end = new Date(); end.setDate(end.getDate() - w * 7);
                      const start = new Date(end); start.setDate(end.getDate() - 6);
                      let tot = 0;
                      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                        const l = (me.logs || {})[k]; if (l) tot += dayScore(l);
                      }
                      weeks.push({ label: `${start.getMonth() + 1}/${start.getDate()}`, tot });
                    }
                    const mx = Math.max(...weeks.map((x) => x.tot), 1);
                    return (
                      <div>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 110 }}>
                          {weeks.map((x, i) => (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
                              {x.tot > 0 && <span style={{ fontSize: 9, fontWeight: 800, color: "#8A8272" }}>{x.tot >= 1000 ? `${Math.round(x.tot / 100) / 10}k` : x.tot}</span>}
                              <div style={{ width: "100%", height: `${(x.tot / mx) * 78}%`, minHeight: 3, background: i === weeks.length - 1 ? FOREST : "#C9BFA6", borderRadius: 6 }} />
                            </div>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 7, marginTop: 5 }}>
                          {weeks.map((x, i) => <span key={i} style={{ flex: 1, textAlign: "center", fontSize: 8.5, fontWeight: 800, color: "#B3AA97" }}>{x.label}</span>)}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: MUT, marginTop: 10, textAlign: "center" }}>Weekly totals · last 8 weeks · this week in green</div>
                      </div>
                    );
                  })()}
                </div>

{/* Earned ranks */}
                {(() => {
                  const RANKS = [
                    { key: "Strider", label: "Strider", sub: "steps", v: g.raw.steps, t: [70000, 150000, 250000], icon: "steps", color: "#5E9E5B" },
                    { key: "Warrior", label: "Warrior", sub: "workouts", v: g.raw.woDays, t: [5, 12, 22], icon: "workout", color: "#8B6FC9" },
                    { key: "Sage", label: "Sage", sub: "meditation min", v: g.raw.med, t: [60, 150, 300], icon: "meditation", color: "#4FA898" },
                    { key: "Scholar", label: "Scholar", sub: "read & journal", v: g.raw.mind, t: [8, 18, 30], icon: "reading", color: "#C9678B" },
                  ];
                  const TIER = ["—", "Bronze", "Silver", "Gold"];
                  const TIER_COL = ["#B7B29C", "#C9814E", "#9AA7B4", "#E0A438"];
                  return (
                    <div className="rp" style={{ padding: 16 }}>
                      <div className="rlabel" style={{ marginBottom: 4 }}>Ranks earned · {mName()}</div>
                      <div style={{ fontSize: 11.5, color: MUT, fontWeight: 600, marginBottom: 12 }}>Cross a threshold to rank up. Everyone's a specialist in something.</div>
                      {RANKS.map((r) => {
                        const cur = tierOf(r.v, r.t[0], r.t[1], r.t[2]);
                        const next = r.t[cur] ?? null; const base = cur > 0 ? r.t[cur - 1] : 0;
                        return (
                          <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 13 }}>
                            <div style={{ position: "relative", width: 42, height: 42, flexShrink: 0 }}>
                              <div style={{ width: 42, height: 42, borderRadius: 12, background: cur ? `${r.color}1A` : "#F1EEE3", display: "grid", placeItems: "center" }}><Icon name={r.icon} size={20} color={cur ? r.color : "#B7B29C"} /></div>
                              {cur > 0 && <div style={{ position: "absolute", right: -4, bottom: -4, width: 18, height: 18, borderRadius: 99, background: TIER_COL[cur], border: "2px solid #fff", display: "grid", placeItems: "center" }}><Icon name="star" size={9} color="#fff" /></div>}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                                <div style={{ fontWeight: 800, fontSize: 13.5 }}>{r.label} {cur > 0 && <span style={{ color: TIER_COL[cur] === "#9AA7B4" ? "#7C8698" : TIER_COL[cur], fontWeight: 800 }}>· {TIER[cur]}</span>}</div>
                                <div style={{ fontSize: 11, color: MUT, fontWeight: 700 }}>{next ? `${r.v.toLocaleString()} / ${next.toLocaleString()}` : "Maxed"}</div>
                              </div>
                              <div style={{ height: 7, background: "#EEE8D4", borderRadius: 99, overflow: "hidden" }}><div style={{ width: `${next ? Math.min((r.v - base) / (next - base), 1) * 100 : 100}%`, height: "100%", background: next ? r.color : "#E0A438", borderRadius: 99 }} /></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            ); })()}
          </div>
          </React.Fragment>
        )}
      </div>

      {phase === "app" && me && (
        <>
          {(dirty || flash) && ["home", "challenges", "breathe"].includes(tab) && (
            <div className="rsave"><button className={flash ? "rbtn sheen" : "rbtn"} style={{ maxWidth: 528, ...(flash ? { background: GREEN_D } : {}) }} onClick={saveToday} disabled={saving || (!dirty && !flash)}>{saving ? "Saving…" : flash ? "✓ Saved — team score updated" : `Save today · ${myScore.toLocaleString()} pts`}</button></div>
          )}
          {gymOpen && <GymHub logs={me?.logs || {}} onClose={() => setGymOpen(false)} />}
          {journalOpen && <JournalSheet log={log} setLog={setLog} gratMap={gratMap} moodMap={moodMap} setMoodMap={setMoodMap} onClose={() => setJournalOpen(false)} />}
          {zenFull && (
            <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column" }}>
              <ZenBG z={ZEN[zenIdx]} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
              <div style={{ position: "absolute", inset: 0, background: "rgba(24,28,20,.28)" }} />
              <div style={{ position: "relative", display: "flex", justifyContent: "space-between", padding: "18px 16px" }}>
                <button className="rpill" onClick={() => setZenIdx((zenIdx + 1) % ZEN.length)} aria-label="Change scenery" style={{ background: "#FFFDF8D9" }}><Icon name="ranks" size={15} color="#6A6250" /></button>
                <div style={{ display: "flex", gap: 7 }}>
                  <button className="rpill" onClick={() => setZenFull(null)} aria-label="Close" style={{ background: "#FFFDF8D9" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6A6250" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
                </div>
              </div>
              <div style={{ position: "relative", flex: 1, display: "grid", placeItems: "center", padding: "0 22px 60px" }}>
                <div style={{ background: zenFull === "breath" ? "transparent" : "#FFFDF8E0", backdropFilter: zenFull === "breath" ? "none" : "blur(8px)", borderRadius: 30, padding: zenFull === "breath" ? "0" : "24px 22px", width: "100%", maxWidth: 400 }}>
                  {zenFull === "breath"
                    ? <BreathBox light onDone={() => setLog((l) => ({ ...l, meditation: (Number(l.meditation) || 0) + 1 }))} />
                    : <>
                        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 12, background: "#E9EFF7", display: "grid", placeItems: "center" }}><Icon name="focus" size={18} color="#5E7FA8" /></div>
                          <div style={{ fontWeight: 800, fontSize: 15.5 }}>Focus session</div>
                        </div>
                        <FocusTimer minutes={Number(log.focus) || 0} onBank={(m) => setLog((l) => ({ ...l, focus: (Number(l.focus) || 0) + m }))} />
                      </>}
                </div>
              </div>
            </div>
          )}
          {deckOpen && me && <CWDeckSheet cw={cwMine} foeCw={cwFoe} me={me} roster={roster} foe={rivalOf} capInfo={{ used: cwUsedToday, cap: cwLive?.cap || cwCapNow, saturated: !!cwLive?.myCapped }} intelOn={cwIntelOn} busyId={cwBusyId} mode={team ? MODE_OF(team) : "battle"} onPlayParty={(b, t) => partyPlay(b, t)} onPlay={(b) => cwPlay(b)} onClose={() => setDeckOpen(false)} />}
          {drawToast && <CWDrawToast cards={drawToast} onClose={() => setDrawToast(null)} />}
          {wds.open && wds.ready && <WildsScreen w={wds} me={me} />}
          {gdn.open && gdn.ready && <GardenScreen gd={gdn} />}
          {wds.ceremony && <WildsCeremony trail={wds.ceremony.trail} rec={wds.ceremony.rec} route={wds.cfg.routes[wds.ceremony.trail.id]} onClose={() => wds.setCeremony(null)} />}
          {gridOpen && me && <ConsistencySheet me={me} cx={cx} onClose={() => setGridOpen(false)} />}
          {evoShow !== null && me && <EvolutionSheet level={evoShow} classId={me.charClass || "pathfinder"} onClose={() => setEvoShow(null)} />}
          {classPick && me && <ClassPickerSheet me={me} onPick={saveCharClass} onClose={() => setClassPick(false)} />}
          {crestPickOpen && team && <CrestPickerSheet team={team} onPick={saveCrestId} onClose={() => setCrestPickOpen(false)} />}
          {myCrestPick && me && <CrestPickerSheet currentId={me.crestId || null} onPick={saveMyCrest} onClose={() => setMyCrestPick(false)} />}
          {celeb && <CelebrationPop celeb={celeb} onDone={() => setCeleb(null)} />}
          {cxManageOpen && me && <CXManageSheet cx={cx} onSave={cxSave} onClose={() => setCxManageOpen(false)} />}
          <nav className="rnav">
            {[["home", "Home", Ic.home], ["challenges", "Goals", Ic.goals], ["breathe", "Breathe", Ic.breathe], ["team", "Team", Ic.team], ["ranks", "Ranks", Ic.ranks], ["me", "Me", Ic.me]].map(([id, label, icon]) => (
              <button key={id} className={tab === id ? "on" : ""} onClick={() => { setTab(id); setView(null); if (id !== "home") refresh(); }}>{icon(tab === id)}{label}</button>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}

export default function App() {
  return <Boundary><Rally /></Boundary>;
}
