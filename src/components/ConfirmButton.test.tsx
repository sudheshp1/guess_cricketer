import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CONFIRM_TIMEOUT_MS, ConfirmButton } from './ConfirmButton'

function setup() {
  const onConfirm = vi.fn()
  render(
    <ConfirmButton
      onConfirm={onConfirm}
      className="btn"
      armedClassName="armed"
      armedLabel="Tap again to give up"
      armedAnnouncement="Tap Give up again to end the round."
    >
      Give up
    </ConfirmButton>,
  )
  return { onConfirm, button: screen.getByRole('button') }
}

describe('ConfirmButton', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('needs two taps to confirm', () => {
    const { onConfirm, button } = setup()
    fireEvent.click(button)
    expect(onConfirm).not.toHaveBeenCalled()
    expect(button).toHaveTextContent('Tap again to give up')
    expect(button).toHaveClass('armed')
    expect(screen.getByText('Tap Give up again to end the round.')).toBeInTheDocument()
    fireEvent.click(button)
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(button).toHaveTextContent('Give up')
  })

  it('disarms itself after the timeout', () => {
    const { onConfirm, button } = setup()
    fireEvent.click(button)
    act(() => vi.advanceTimersByTime(CONFIRM_TIMEOUT_MS))
    expect(button).toHaveTextContent('Give up')
    expect(button).not.toHaveClass('armed')
    fireEvent.click(button)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('stays armed until the timeout runs out', () => {
    const { onConfirm, button } = setup()
    fireEvent.click(button)
    act(() => vi.advanceTimersByTime(CONFIRM_TIMEOUT_MS - 100))
    fireEvent.click(button)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('disarms when it loses focus', () => {
    const { onConfirm, button } = setup()
    fireEvent.click(button)
    fireEvent.blur(button)
    expect(button).toHaveTextContent('Give up')
    fireEvent.click(button)
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
