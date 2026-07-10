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
  fireEvent.click(screen.getByRole('button', { name: /velja/i }))       // Pick
  fireEvent.click(screen.getByRole('button', { name: /byrja æfingu/i })) // Start Practice
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

  it('hides note names by default (Names toggle off)', () => {
    render(<NotectorGame />)
    startInPickMode()
    expect(screen.queryByText('C')).not.toBeInTheDocument()
  })

  it('scores when the correct letter is typed (lowercase)', () => {
    render(<NotectorGame />)
    startInPickMode()

    fireEvent.keyDown(document.body, { key: 'c' })

    expect(screen.getByTestId('score')).toHaveTextContent('1')
  })

  it('accepts the letter case-insensitively (uppercase)', () => {
    render(<NotectorGame />)
    startInPickMode()

    fireEvent.keyDown(document.body, { key: 'C' })

    expect(screen.getByTestId('score')).toHaveTextContent('1')
  })

  it('ignores a wrong note letter (no score)', () => {
    render(<NotectorGame />)
    startInPickMode()

    fireEvent.keyDown(document.body, { key: 'd' }) // active note is C, not D

    expect(screen.getByTestId('score')).toHaveTextContent('0')
  })

  it('Names toggle shows/hides every note letter, even while playing', () => {
    render(<NotectorGame />)
    startInPickMode() // 4 notes, all C4 (Math.random -> 0); names off => none shown
    expect(screen.queryByText('C')).not.toBeInTheDocument()

    const namesToggle = screen.getByRole('button', { name: /nöfn/i })
    fireEvent.click(namesToggle)
    expect(screen.getAllByText('C')).toHaveLength(4)

    fireEvent.click(namesToggle)
    expect(screen.queryByText('C')).not.toBeInTheDocument()
  })
})

describe('NotectorGame — answer mode toggle', () => {
  afterEach(() => vi.restoreAllMocks())

  it('defaults to Listen mode and offers a Pick toggle', () => {
    render(<NotectorGame />)
    expect(screen.getByRole('button', { name: /hlusta/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /velja/i })).toBeInTheDocument()
  })
})

describe('NotectorGame — Muscle Memory mode', () => {
  afterEach(() => vi.restoreAllMocks())

  it('shows the bar builder and source picker when Muscle Memory is selected', () => {
    render(<NotectorGame />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'muscle' } })
    expect(screen.getByText(/Búðu til takt/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Slembinn taktur/i })).toBeInTheDocument()
  })
})
