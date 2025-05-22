import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { ToastProvider, useToast } from './Toast'

function Demo() {
  const toast = useToast()
  return <button onClick={() => toast('hi')}>show</button>
}

describe('ToastProvider', () => {
  it('displays a toast message', () => {
    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>
    )
    fireEvent.click(screen.getByText('show'))
    expect(screen.getByText('hi')).toBeInTheDocument()
  })
})

