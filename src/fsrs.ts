import { fsrs as createFSRS, Rating } from 'ts-fsrs'

export const fsrs = createFSRS()

export type UserRating = 'easy' | 'okay' | 'hard' | 'again'

export function gradeFromResponse(correct: boolean, rating?: UserRating): number {
  if (!correct) return 1
  switch (rating) {
    case 'again':
      return 2
    case 'hard':
      return 3
    case 'easy':
      return 5
    case 'okay':
    default:
      return 4
  }
}

export function toFsrsRating(grade: number): Rating {
  switch (grade) {
    case 5:
      return Rating.Easy
    case 4:
      return Rating.Good
    case 3:
      return Rating.Hard
    case 2:
    case 1:
    default:
      return Rating.Again
  }
}

export function nextReview(card: Parameters<typeof fsrs.nextReview>[0], grade: number) {
  const [next] = fsrs.nextReview(card, toFsrsRating(grade))
  return next
}
