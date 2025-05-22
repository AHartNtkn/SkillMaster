import { MasteryFile, AttemptsFile } from '../saveManager'
import { Catalog } from '../courseRegistry'
import { SkillEntry } from '../indexBuilder'
import { Prefs, XpLog } from '../awardXp'

export type Screen = 'home' | 'learning' | 'progress' | 'library' | 'settings'

export interface CoursesState {
  catalogs: Record<string, Catalog>
  skills: Record<string, SkillEntry>
}

export interface UserState {
  mastery: MasteryFile | null
  attempts: AttemptsFile | null
  xp: XpLog | null
  prefs: Prefs | null
}

export interface UIState {
  screen: Screen
  mode: string
  task: string | null
}

export interface RootState {
  courses: CoursesState
  user: UserState
  ui: UIState
}

const initialState: RootState = {
  courses: { catalogs: {}, skills: {} },
  user: { mastery: null, attempts: null, xp: null, prefs: null },
  ui: { screen: 'home', mode: 'idle', task: null },
}

export type Action =
  | { type: 'ui/setScreen'; payload: Screen }
  | { type: 'ui/setMode'; payload: string }
  | { type: 'ui/setTask'; payload: string | null }
  | { type: 'user/setSave'; payload: UserState }
  | { type: 'courses/setData'; payload: CoursesState }

export function rootReducer(state: RootState = initialState, action: Action): RootState {
  switch (action.type) {
    case 'ui/setScreen':
      return { ...state, ui: { ...state.ui, screen: action.payload } }
    case 'ui/setMode':
      return { ...state, ui: { ...state.ui, mode: action.payload } }
    case 'ui/setTask':
      return { ...state, ui: { ...state.ui, task: action.payload } }
    case 'user/setSave':
      return { ...state, user: action.payload }
    case 'courses/setData':
      return { ...state, courses: action.payload }
    default:
      return state
  }
}

type Listener = () => void

export function createAppStore(preloaded?: Partial<RootState>) {
  let state: RootState = { ...initialState, ...preloaded }
  const listeners: Listener[] = []

  function getState() {
    return state
  }

  function dispatch(action: Action) {
    state = rootReducer(state, action)
    listeners.forEach((l) => l())
    return action
  }

  function subscribe(listener: Listener) {
    listeners.push(listener)
    return () => {
      const idx = listeners.indexOf(listener)
      if (idx >= 0) listeners.splice(idx, 1)
    }
  }

  return { getState, dispatch, subscribe }
}

export type AppStore = ReturnType<typeof createAppStore>
export type AppDispatch = AppStore['dispatch']
export const store = createAppStore()
