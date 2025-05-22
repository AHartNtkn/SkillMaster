import { advanceIdx } from './advanceIdx'

describe('advanceIdx', () => {
  it('increments index within pool length', () => {
    expect(advanceIdx(0, 5)).toBe(1)
    expect(advanceIdx(3, 5)).toBe(4)
  })

  it('wraps around at pool end', () => {
    expect(advanceIdx(4, 5)).toBe(0)
  })

  it('starts at 0 when current is undefined', () => {
    expect(advanceIdx(undefined, 5)).toBe(0)
  })
})
