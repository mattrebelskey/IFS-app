
export enum LevelName {
  SURVIVOR = "Survivor",
  CURIOUS = "Curious",
  COURAGEOUS = "Courageous",
  CONNECTED = "Connected"
}

export interface TaskItem {
  id: string;
  text: string;
  category: 'basic' | 'pleasurable' | 'social' | 'necessary' | 'focus';
  xpValue: number;
}

export type JournalType = 'text' | 'voice' | 'photo';

export interface WinEntry {
  id: string;
  date: string;
  text: string;
  type?: JournalType;
  mediaData?: string; // Base64 string for audio/image
}

export interface Part {
  id: string;
  name: string;
  role: 'manager' | 'firefighter' | 'exile' | 'unknown';
  description: string;
}

export interface PartsCheckIn {
  id: string;
  date: string;
  activeParts: string[]; // IDs of parts
  notes: string;
  intensity: number; // 1-10
}

export interface HealthLog {
  date: string;
  sleepHours?: number;
  movementMinutes?: number;
  mood?: string;
}

export interface HabitStack {
  id: string;
  cue: string;
  action: string;
}

export interface UserSettings {
  survivalMode: boolean;
  name: string;
  theme: 'light' | 'dark';
}

export interface AppState {
  totalXp: number;
  currentLevel: LevelName;
  dailyHistory: Record<string, string[]>; // YYYY-MM-DD -> Task IDs
  focusTasks: TaskItem[];
  weeklyGoals: TaskItem[];
  wins: WinEntry[];
  settings: UserSettings;
  badges: string[];
  
  // V2+ Features
  parts: Part[];
  checkIns: PartsCheckIn[];
  healthLogs: Record<string, HealthLog>; // YYYY-MM-DD -> Log
  habitStacks: HabitStack[];
  
  // Customization
  customBasics?: TaskItem[]; 
  activeTemplate?: string; // Tracks "Standard", "ADHD Support", etc.
  
  // Prestige System
  prestigeLevel?: number;
}

export const XP_THRESHOLDS = {
  [LevelName.SURVIVOR]: { min: 0, max: 50, color: 'bg-level1', text: 'text-level1dark', border: 'border-level1dark' },
  [LevelName.CURIOUS]: { min: 51, max: 150, color: 'bg-level2', text: 'text-level2dark', border: 'border-level2dark' },
  [LevelName.COURAGEOUS]: { min: 151, max: 300, color: 'bg-level3', text: 'text-level3dark', border: 'border-level3dark' },
  [LevelName.CONNECTED]: { min: 301, max: 500, color: 'bg-level4', text: 'text-level4dark', border: 'border-level4dark' },
};

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (state: AppState) => boolean;
}
