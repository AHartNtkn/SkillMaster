import { configureStore, createSlice, PayloadAction, ThunkAction, AnyAction } from '@reduxjs/toolkit';
import { SaveManager, MasteryFile, AttemptsFile } from './saveManager';
import { XpLog, Prefs, awardXp } from './awardXp';
import { updateMastery as updateMasteryFn, SkillMeta } from './updateMastery';

export interface RootState {
  mastery: MasteryFile;
  attempts: AttemptsFile;
  xp: XpLog;
  prefs: Prefs;
}

const masterySlice = createSlice({
  name: 'mastery',
  initialState: { format: 'Mastery-v2', ass: {}, topics: {} } as MasteryFile,
  reducers: {
    setMastery: (_state, action: PayloadAction<MasteryFile>) => action.payload,
  },
});

const attemptsSlice = createSlice({
  name: 'attempts',
  initialState: { format: 'Attempts-v1', ass: {}, topics: {} } as AttemptsFile,
  reducers: {
    setAttempts: (_state, action: PayloadAction<AttemptsFile>) => action.payload,
  },
});

const xpSlice = createSlice({
  name: 'xp',
  initialState: { format: 'XP-v1', log: [] } as XpLog,
  reducers: {
    setXp: (_state, action: PayloadAction<XpLog>) => action.payload,
  },
});

const prefsSlice = createSlice({
  name: 'prefs',
  initialState: { format: 'Prefs-v2', profile: 'save', xp_since_mixed_quiz: 0, last_as: null, ui_theme: 'default' } as Prefs,
  reducers: {
    setPrefs: (_state, action: PayloadAction<Prefs>) => action.payload,
  },
});

export const { setMastery } = masterySlice.actions;
export const { setAttempts } = attemptsSlice.actions;
export const { setXp } = xpSlice.actions;
export const { setPrefs } = prefsSlice.actions;

export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, SaveManager, AnyAction>;

export function createAppStore(manager: SaveManager) {
  const store = configureStore({
    reducer: {
      mastery: masterySlice.reducer,
      attempts: attemptsSlice.reducer,
      xp: xpSlice.reducer,
      prefs: prefsSlice.reducer,
    },
    preloadedState: {
      mastery: manager.mastery,
      attempts: manager.attempts,
      xp: manager.xp,
      prefs: manager.prefs,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: { extraArgument: manager } }),
  });
  return store;
}

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore['dispatch'];

export const awardXpAndSave = (delta: number, source: string, ts: Date = new Date()): AppThunk<Promise<void>> =>
  async (dispatch, _getState, manager) => {
    awardXp(manager.xp, manager.prefs, delta, source, ts);
    dispatch(setXp(manager.xp));
    dispatch(setPrefs(manager.prefs));
    await manager.autosave();
  };

export const updateMastery = (skill: SkillMeta, grade: number, totalQuestions: number, now: Date = new Date()): AppThunk =>
  (dispatch, _getState, manager) => {
    updateMasteryFn(manager.mastery.ass, skill, grade, totalQuestions, now);
    dispatch(setMastery(manager.mastery));
  };

export const autosave = (): AppThunk<Promise<void>> =>
  async (_dispatch, _getState, manager) => {
    await manager.autosave();
  };

