import { gradeFromResponse, toFsrsRating } from './fsrs'
import { Rating } from 'ts-fsrs'

describe('gradeFromResponse', () => {
  it('returns 1 for incorrect answer', () => {
    expect(gradeFromResponse(false)).toBe(1)
  })

  it('maps rating buttons', () => {
    expect(gradeFromResponse(true, 'again')).toBe(2)
    expect(gradeFromResponse(true, 'hard')).toBe(3)
    expect(gradeFromResponse(true, 'okay')).toBe(4)
    expect(gradeFromResponse(true, 'easy')).toBe(5)
    // default when missing rating
    expect(gradeFromResponse(true)).toBe(4)
  })
})

describe('toFsrsRating', () => {
  it('converts grades to ts-fsrs Rating enum', () => {
    expect(toFsrsRating(1)).toBe(Rating.Again)
    expect(toFsrsRating(2)).toBe(Rating.Again)
    expect(toFsrsRating(3)).toBe(Rating.Hard)
    expect(toFsrsRating(4)).toBe(Rating.Good)
    expect(toFsrsRating(5)).toBe(Rating.Easy)
  })
})
