import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import LessonFlow, { LessonQuestion } from './components/LessonFlow'
import { I18nProvider } from './i18n'

const question: LessonQuestion = {
  stem: 'What is 2+2?',
  choices: ['3', '4'],
  correct: 1,
  solution: 'Because 2+2 equals 4.'
}

describe('LessonFlow component', () => {
  it('walks through exposition to feedback', () => {
    const onGrade = vi.fn()
    render(
      <I18nProvider>
        <LessonFlow exposition="Intro" question={question} onGrade={onGrade} />
      </I18nProvider>
    )

    // exposition phase
    expect(screen.getByText('Intro')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /start/i }))

    // question phase
    expect(screen.getByText('What is 2+2?')).toBeInTheDocument()
    const choice = screen.getByRole('button', { name: '4' })
    fireEvent.click(choice)
    const submit = screen.getByRole('button', { name: /submit/i })
    expect(submit).not.toBeDisabled()
    fireEvent.click(submit)

    // feedback phase
    expect(screen.getByText(/correct/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /easy/i }))
    expect(onGrade).toHaveBeenCalledWith(5)
  })
})
