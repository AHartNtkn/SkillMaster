import { render, screen } from '@testing-library/react'
import React from 'react'
import MixedQuizPlayer from './components/MixedQuizPlayer'
import { I18nProvider } from './i18n'

describe('MixedQuizPlayer component', () => {
  it('shows heading and question counter', () => {
    render(
      <I18nProvider>
        <MixedQuizPlayer current={1} total={15}>
          <p>Question body</p>
        </MixedQuizPlayer>
      </I18nProvider>
    )
    expect(screen.getByRole('heading', { name: /mixed quiz/i })).toBeInTheDocument()
    expect(screen.getByText(/Question 1 of 15/)).toBeInTheDocument()
  })
})
