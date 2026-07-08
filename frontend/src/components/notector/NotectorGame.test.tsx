import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NotectorGame } from './NotectorGame'

// The game's audio hooks need a microphone / AudioContext, neither of which
// exists in jsdom. Mock them so the component renders purely.
vi.mock('../../hooks/useTuner', () => ({
  useTuner: () => ({
    reading: { frequency: 0, note: null, octave: null, midi: null, cents: 0 },
    isListening: false,
  }),
}))
vi.mock('../../hooks/useMetronome', () => ({
  useMetronome: () => {},
}))
// No backend in tests — stub the custom-bars API.
vi.mock('../../api/customBars', () => ({
  customBarApi: {
    getAll: () => Promise.resolve([]),
    create: (bar: unknown) => Promise.resolve(bar),
    delete: () => Promise.resolve(),
  },
}))

/** Put the game into Pick mode and start a round. */
function startInPickMode() {
  fireEvent.click(screen.getByRole('button', { name: /pick/i }))
  fireEvent.click(screen.getByRole('button', { name: /start practice/i }))
}

describe('NotectorGame — Pick mode', () => {
  beforeEach(() => {
    // Deterministic: Math.random() === 0 makes every generated note C4,
    // so the active note's letter is always "C".
    vi.spyOn(Math, 'random').mockReturnValue(0)
    // Freeze the beat timer so it never advances/fires during the test.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('hides the note name until it is answered', () => {
    render(<NotectorGame />)
    startInPickMode()
    // The active note's letter must not be shown before the player answers.
    expect(screen.queryByText('C')).not.toBeInTheDocument()
  })

  it('marks the active note correct when its letter is typed (lowercase)', () => {
    render(<NotectorGame />)
    startInPickMode()

    fireEvent.keyDown(document.body, { key: 'c' })

    // Once correct, the note reveals its letter as feedback.
    expect(screen.getByText('C')).toBeInTheDocument()
  })

  it('accepts the letter case-insensitively (uppercase)', () => {
    render(<NotectorGame />)
    startInPickMode()

    fireEvent.keyDown(document.body, { key: 'C' })

    expect(screen.getByText('C')).toBeInTheDocument()
  })

  it('ignores a wrong note letter (no reveal, no miss)', () => {
    render(<NotectorGame />)
    startInPickMode()

    fireEvent.keyDown(document.body, { key: 'd' }) // active note is C, not D

    expect(screen.queryByText('C')).not.toBeInTheDocument()
    expect(screen.queryByText('D')).not.toBeInTheDocument()
  })
})

describe('NotectorGame — answer mode toggle', () => {
  afterEach(() => vi.restoreAllMocks())

  it('defaults to Listen mode and offers a Pick toggle', () => {
    render(<NotectorGame />)
    expect(screen.getByRole('button', { name: /listen/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pick/i })).toBeInTheDocument()
  })
})

describe('NotectorGame — Muscle Memory mode', () => {
  afterEach(() => vi.restoreAllMocks())

  it('shows the bar builder and source picker when Muscle Memory is selected', () => {
    render(<NotectorGame />)
    // The Level dropdown is the first combobox (Note length is the second).
    const levelSelect = screen.getAllByRole('combobox')[0]
    fireEvent.change(levelSelect, { target: { value: 'muscle' } })
    expect(screen.getByText(/Create a bar/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Random bar/i })).toBeInTheDocument()
  })
})
