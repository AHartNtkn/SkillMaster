import type { DistMatrix } from './indexBuilder'

export interface IndexState {
  dist: DistMatrix
  asCount: Record<string, number>
}

const initialState: IndexState = { dist: {}, asCount: {} }

type Action = { type: 'setIndex'; payload: IndexState } | { type: '__INIT__' }

function reducer(state: IndexState = initialState, action: Action): IndexState {
  switch (action.type) {
    case 'setIndex':
      return { dist: action.payload.dist, asCount: action.payload.asCount }
    default:
      return state
  }
}

export function setIndex(data: IndexState): Action {
  return { type: 'setIndex', payload: data }
}

export function createStore() {
  let state = reducer(undefined, { type: '__INIT__' })
  const listeners = new Set<() => void>()
  return {
    dispatch(action: Action) {
      state = reducer(state, action)
      listeners.forEach(l => l())
    },
    getState() {
      return state
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

export const store = createStore()
export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
