import { AppState, LevelName, XP_THRESHOLDS } from '../types';
import { INITIAL_STATE } from '../constants';

const STORAGE_KEY = 'healing_journey_app_v1';

export const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
  }
};

export const loadState = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return INITIAL_STATE;
    return { ...INITIAL_STATE, ...JSON.parse(stored) };
  } catch (e) {
    console.error("Failed to load state", e);
    return INITIAL_STATE;
  }
};

export const calculateLevel = (xp: number): LevelName => {
  // XP is already modulo 500 when passed in for prestige support
  if (xp <= XP_THRESHOLDS[LevelName.SURVIVOR].max) return LevelName.SURVIVOR;
  if (xp <= XP_THRESHOLDS[LevelName.CURIOUS].max) return LevelName.CURIOUS;
  if (xp <= XP_THRESHOLDS[LevelName.COURAGEOUS].max) return LevelName.COURAGEOUS;
  return LevelName.CONNECTED;
};
