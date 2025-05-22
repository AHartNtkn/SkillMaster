import { render, screen } from '@testing-library/react'
import React from 'react'
import XpProgress from './components/XpProgress'
import { I18nProvider } from './i18n'

describe('XpProgress component', () => {
  it('shows current xp and percentage', () => {
    render(
      <I18nProvider>
        <XpProgress current={75} threshold={150} />
      </I18nProvider>
    )
    expect(screen.getByText(/75 \/ 150 XP/)).toBeInTheDocument()
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveStyle({ width: '50%' })
  })
})
