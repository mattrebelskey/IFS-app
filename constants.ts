
import { TaskItem, Badge, LevelName, XP_THRESHOLDS, AppState, Part } from './types';

export const DEFAULT_DAILY_BASICS: TaskItem[] = [
  { id: 'basic_meal', text: 'Ate at least one meal', category: 'basic', xpValue: 1 },
  { id: 'basic_hygiene', text: 'Basic hygiene (shower/face)', category: 'basic', xpValue: 1 },
  { id: 'basic_nature', text: '5 min outside OR open window', category: 'basic', xpValue: 1 },
  { id: 'basic_water', text: 'Drank water', category: 'basic', xpValue: 1 },
  { id: 'basic_meds', text: 'Took medication', category: 'basic', xpValue: 1 },
];

export const SURVIVAL_MODE_BASICS: TaskItem[] = [
  { id: 'basic_meal', text: 'Ate something', category: 'basic', xpValue: 1 },
  { id: 'basic_water', text: 'Drank water', category: 'basic', xpValue: 1 },
  { id: 'basic_rest', text: 'Rest for 5 mins', category: 'basic', xpValue: 1 },
];

// --- TEMPLATES ---

export const ADHD_TEMPLATE = {
  name: "ADHD Support",
  basics: [
    { id: 'basic_meds', text: 'Took medication', category: 'basic', xpValue: 1 },
    { id: 'basic_water', text: 'Drank water', category: 'basic', xpValue: 1 },
    { id: 'basic_protein', text: 'Ate protein', category: 'basic', xpValue: 1 },
    { id: 'basic_door', text: 'Step outside front door', category: 'basic', xpValue: 1 },
    { id: 'basic_teeth', text: 'Brushed teeth', category: 'basic', xpValue: 1 },
  ] as TaskItem[],
  focus: [
    { id: 'focus_timer', text: 'Set a 10min timer for a task', category: 'focus', xpValue: 1 },
    { id: 'focus_body_double', text: 'Body double (text a friend)', category: 'focus', xpValue: 1 },
    { id: 'focus_dopamine', text: 'Do one dopamine menu item', category: 'focus', xpValue: 1 },
  ] as TaskItem[]
};

export const GRIEF_TEMPLATE = {
  name: "Grief Journey",
  basics: [
    { id: 'basic_shower', text: 'Shower or face wash', category: 'basic', xpValue: 1 },
    { id: 'basic_food', text: 'Ate comforting food', category: 'basic', xpValue: 1 },
    { id: 'basic_rest', text: 'Allowed myself to rest', category: 'basic', xpValue: 1 },
    { id: 'basic_feel', text: 'Acknowledged a feeling', category: 'basic', xpValue: 1 },
  ] as TaskItem[],
  focus: [
    { id: 'focus_memory', text: 'Look at a photo I love', category: 'focus', xpValue: 1 },
    { id: 'focus_no', text: 'Say no to one draining thing', category: 'focus', xpValue: 1 },
    { id: 'focus_kindness', text: 'One gentle thing for myself', category: 'focus', xpValue: 1 },
  ] as TaskItem[]
};

export const DEFAULT_PARTS: Part[] = [
  { id: 'p_anxious', name: 'The Worrier', role: 'manager', description: 'Tries to keep me safe by predicting bad outcomes.' },
  { id: 'p_critic', name: 'The Critic', role: 'manager', description: 'Pushes me hard so I dont fail.' },
  { id: 'p_tired', name: 'The Tired One', role: 'exile', description: 'Holds my exhaustion and overwhelm.' },
  { id: 'p_distractor', name: 'The Distractor', role: 'firefighter', description: 'Numbs feelings with scrolling or zoning out.' },
];

export const COMPASSION_QUOTES = [
  "I am doing my best with what I have today. That is enough.",
  "Action creates motivation. Every XP point earned is progress.",
  "I'm in survival mode. My only job right now is to survive.",
  "Hand on heart. 'I earned XP. I'm moving forward.'",
  "Success = 60%, not perfection.",
  "It is okay to rest. Rest is productive.",
  "All parts are welcome here.",
  "How do I feel toward this part?",
];

export const LIBRARY_CONTENT = [
  {
    title: "What is Internal Family Systems (IFS)?",
    category: "IFS",
    content: "Internal Family Systems is a way of understanding the different \"voices\" or \"parts\" you experience inside yourself. Rather than seeing inner conflict as a problem to fix, IFS recognizes that we all have different parts of ourselves—each with its own perspective, feelings, and concerns. Think of how you might feel one way in the morning (motivated, organized) and completely different by evening (exhausted, self-critical). These aren't mood swings; they're different parts of you trying to help in their own way. IFS helps you get to know these parts, understand what they're trying to protect you from, and learn to work with them rather than against them."
  },
  {
    title: "Parts",
    category: "IFS",
    content: "In IFS, a \"part\" is more than just a thought, feeling, or mood—it's like a distinct subpersonality within you, with its own perspective, emotions, memories, and way of trying to help. You might notice a part through its voice in your head (\"You're going to mess this up\"), through a feeling that takes over (sudden anxiety or numbness), or through behaviors that seem to happen automatically (procrastinating, snapping at someone, reaching for your phone). Parts often feel like they have a mind of their own because, in a way, they do. The good news? Having parts is completely normal—everyone has them. They developed to help you navigate difficult experiences, and while their methods might not always work well now, each part has a positive intent underneath. When you learn to recognize and communicate with your parts, you can start to understand what they need and help them find better ways to support you."
  },
  {
    title: "Managers",
    category: "Specific Parts",
    content: "Managers are the parts of you that try to keep everything under control and prevent bad things from happening. They're proactive protectors—always planning, organizing, and working to make sure you don't get hurt, rejected, or overwhelmed. Common managers include your inner critic (keeping you in line so others won't criticize you), your perfectionist (making sure you're never caught off guard), or your people-pleaser (preventing conflict or rejection). You might notice a manager when you're lying awake at night making mental to-do lists, when you're over-preparing for a meeting, or when you can't stop yourself from checking your work one more time. Managers mean well—they're trying to protect you from pain—but they can be exhausting to live with."
  },
  {
    title: "Firefighters",
    category: "Specific Parts",
    content: "Firefighters are the parts that jump into action when you're already feeling overwhelmed, hurt, or flooded with difficult emotions. Unlike managers who try to prevent problems, firefighters respond to emergencies by doing whatever it takes to make the pain stop right now. They might show up as impulses to binge-watch TV when you're stressed, reach for another drink when you're lonely, pick a fight when you're feeling vulnerable, or scroll social media for hours when you should be sleeping. They can also appear as dissociation, numbing out, or sudden rage. Firefighters get a bad reputation because their methods can be destructive, but they're actually trying to rescue you from unbearable feelings. They're just working with limited tools and a sense of urgency."
  },
  {
    title: "Exiles",
    category: "Specific Parts",
    content: "Exiles are the parts of you that carry old pain, trauma, or overwhelming emotions from the past—often from childhood. These parts hold feelings like shame, terror, abandonment, or worthlessness that felt too big to handle at the time. Your system \"exiled\" them (pushed them away) to protect you from being overwhelmed. You might not be consciously aware of your exiles, but you'll notice their influence: sudden waves of sadness that seem out of proportion, a visceral fear of rejection, or feeling small and powerless in certain situations. Exiles are often young—they're a part of your past, still experiencing old wounds as if they're happening now. Both managers and firefighters work hard to keep exiles locked away, but the exiles' pain inevitably leaks out, driving much of our reactive behavior."
  },
  {
    title: "The Self",
    category: "IFS",
    content: "In IFS, \"Self\" isn't just another part—it's who you are at your core. It's the calm, grounded, compassionate presence that exists underneath all your parts. You've experienced Self when you feel genuinely curious about something, when you respond to a crisis with unexpected clarity, when you feel deep compassion for someone (including yourself), or when you access a sense of courage you didn't know you had. Self is characterized by qualities like curiosity, calm, clarity, compassion, confidence, courage, creativity, and connectedness. The revolutionary idea in IFS is that everyone has Self—it can never be damaged or destroyed, only obscured by protective parts. When your parts trust you and step back, even a little, Self naturally emerges. The goal of IFS isn't to get rid of parts or fix yourself; it's to let Self lead, with all your parts learning they can relax and trust your core wisdom."
  },
  {
    title: "How IFS Works",
    category: "IFS",
    content: "IFS works by helping you develop a relationship between your Self and your parts. Instead of trying to suppress difficult feelings or force yourself to change, you start by getting curious about the parts that are showing up. When a part is activated—say, anxiety about an upcoming presentation—you pause and notice it, rather than pushing it away or becoming completely consumed by it. You might ask internally: \"What are you worried about?\" or \"What do you need me to know?\" As you listen with genuine curiosity and compassion (from Self), parts begin to trust you and share their deeper concerns. Often, you'll discover that even the most difficult parts are trying to protect you from old pain carried by exiles. As parts feel heard and valued, they naturally relax their extreme roles. Over time, you can help exiles heal from their old wounds (a process called \"unburdening\"), which allows all your protective parts to step into healthier roles. The result is greater internal harmony and Self-leadership in your life."
  },
  {
    title: "Applying IFS to Daily Life",
    category: "IFS",
    content: "You don't need to be in therapy to benefit from IFS thinking. Start by simply noticing when you're \"blended\" with a part—when you're completely identified with anxiety, criticism, numbness, or any intense reaction. In those moments, see if you can create a little space: \"A part of me is really anxious right now\" rather than \"I am anxious.\" This small shift helps you access Self. When you're stuck in a pattern—procrastinating, people-pleasing, picking the same fights—get curious about which part is driving that behavior and what it's trying to protect you from. You might journal from different parts' perspectives, or simply pause during your day to check in: \"Which parts are active right now? What do they need?\" Over time, you'll start recognizing your parts' signatures—the perfectionist who makes you rewrite emails five times, the rebel who emerges when you feel controlled, the caretaker who can't say no. Once you know them, you can work with them: \"I hear you, perfectionist. I know you're trying to keep me safe from criticism. But I've got this—it doesn't need to be perfect.\" This internal collaboration, rather than internal warfare, is what IFS is all about."
  },
  {
    title: "What is Self-Compassion?",
    category: "Self-Compassion",
    content: "Self-compassion is the practice of treating yourself with the same kindness and understanding you'd offer a good friend who's struggling. It means acknowledging your pain without judgment, recognizing that imperfection and difficulty are part of being human, and responding to yourself with warmth rather than criticism. Instead of beating yourself up when you make a mistake or feel inadequate, self-compassion asks: \"What do I need right now? How can I support myself through this?\" It's not about lowering standards or making excuses—it's about creating a supportive inner environment where growth and healing are actually possible. Research shows that self-compassion leads to greater emotional resilience, motivation, and wellbeing than self-criticism ever could."
  }
];

export const INITIAL_STATE: AppState = {
  totalXp: 0,
  currentLevel: LevelName.SURVIVOR,
  dailyHistory: {},
  focusTasks: [],
  weeklyGoals: [],
  wins: [],
  settings: {
    survivalMode: false,
    name: 'Friend',
    theme: 'light',
  },
  badges: [],
  parts: DEFAULT_PARTS,
  checkIns: [],
  healthLogs: {},
  habitStacks: [],
  customBasics: DEFAULT_DAILY_BASICS,
  activeTemplate: "Standard"
};

// --- Badge Logic Helpers ---

const getBasicsCount = (taskIds: string[]) => taskIds.filter(id => id.startsWith('basic_')).length;

const calculateMaxStreak = (dailyHistory: Record<string, string[]>): number => {
  const sortedDates = Object.keys(dailyHistory).sort();
  let maxStreak = 0;
  let currentStreak = 0;
  let lastDate: number | null = null;

  for (const dateStr of sortedDates) {
    const tasks = dailyHistory[dateStr];
    // Success defined as >= 3 basics completed (approx 60% of 5)
    if (getBasicsCount(tasks) >= 3) { 
      const currentDate = new Date(dateStr).getTime();
      
      if (lastDate === null) {
        currentStreak = 1;
        maxStreak = 1;
      } else {
        const diffTime = Math.abs(currentDate - lastDate);
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
        } else if (diffDays > 1) {
          currentStreak = 1;
        }
      }
      lastDate = currentDate;
      maxStreak = Math.max(maxStreak, currentStreak);
    }
  }
  return maxStreak;
};

const calculateWeeklyCompletion = (state: AppState): number => {
  const now = new Date();
  // Adjust to Monday as start of week
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
  const monday = new Date(now.setDate(diff));
  monday.setHours(0,0,0,0);
  
  const weekDates: string[] = [];
  // Generate strings for Mon-Sun
  for(let i=0; i<7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDates.push(d.toISOString().split('T')[0]);
  }

  let tasksCompleted = 0;
  
  // Denominator: 
  // 1. Daily Basics (7 days * count of basics based on mode)
  const basicsCount = state.settings.survivalMode ? SURVIVAL_MODE_BASICS.length : (state.customBasics || DEFAULT_DAILY_BASICS).length;
  const possibleBasics = basicsCount * 7;
  
  // 2. Focus Tasks
  const possibleFocus = state.focusTasks.length;
  
  const totalPossible = possibleBasics + possibleFocus;
  if (totalPossible === 0) return 0;

  // Count completed
  weekDates.forEach(dateStr => {
      const tasks = state.dailyHistory[dateStr] || [];
      
      // Count basics
      tasksCompleted += tasks.filter(t => t.startsWith('basic_')).length;
      
      // Count focus tasks done on this day
      tasks.forEach(tId => {
        if (state.focusTasks.find(ft => ft.id === tId)) {
           tasksCompleted++;
        }
      });
  });

  return tasksCompleted / totalPossible;
};

export const BADGES: Badge[] = [
  {
    id: 'first_step',
    name: 'First Step',
    description: 'Earned your first XP',
    icon: '🌱',
    condition: (state) => state.totalXp >= 1
  },
  {
    id: 'survivor_graduate',
    name: 'Curious Explorer',
    description: 'Reached Level 2: Curious',
    icon: '🔭',
    condition: (state) => state.totalXp > XP_THRESHOLDS[LevelName.SURVIVOR].max
  },
  {
    id: 'streak_3',
    name: '3-Day Streak',
    description: 'Complete daily basics 3 days in a row',
    icon: '⭐',
    condition: (state) => calculateMaxStreak(state.dailyHistory) >= 3
  },
  {
    id: 'consistency_champ',
    name: 'Consistency Champion',
    description: '7-day streak of daily basics',
    icon: '🏆',
    condition: (state) => calculateMaxStreak(state.dailyHistory) >= 7
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Complete 60% of all tasks in a week',
    icon: '🔥',
    condition: (state) => calculateWeeklyCompletion(state) >= 0.6
  },
  // --- V2 Badges (IFS/Compassion) ---
  {
    id: 'parts_peacemaker',
    name: 'Parts Peacemaker',
    description: 'Completed 5 Parts Check-ins',
    icon: '🧩',
    condition: (state) => state.checkIns.length >= 5
  },
  {
    id: 'befriender',
    name: 'Befriender',
    description: 'Identified and named 3 internal parts',
    icon: '🤝',
    condition: (state) => state.parts.length >= 3
  },
  {
    id: 'self_energy',
    name: 'Self-Energy',
    description: 'Performed 3 parts check-ins in a row (3 days)',
    icon: '☀️',
    condition: (state) => {
       // Simplified: just checks if 3 check-ins exist on unique days
       const uniqueDays = new Set(state.checkIns.map(c => c.date));
       return uniqueDays.size >= 3;
    }
  },
  {
    id: 'compassion_core',
    name: 'Compassion Core',
    description: 'Use the app for 10 days',
    icon: '💖',
    condition: (state) => Object.keys(state.dailyHistory).length >= 10
  }
];
