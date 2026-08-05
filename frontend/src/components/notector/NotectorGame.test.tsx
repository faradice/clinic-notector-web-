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

describe('NotectorGame — the lesson path', () => {
  afterEach(() => vi.restoreAllMocks())

  // A lesson's own row: anchored so it can't match the "Opna …"/"Loka …" expand toggle beside it,
  // nor the root treeitem (whose accessible name includes every descendant's text).
  const lessonRow = (name: RegExp) =>
    screen.getByRole('button', { name }).closest('[role="treeitem"]')

  it('shows the ladder on the idle screen, starting on C og G', () => {
    render(<NotectorGame />)
    expect(screen.getByRole('tree', { name: 'Nótnaleið' })).toBeInTheDocument()
    // The first lesson is the one being practised, so the tree marks it selected.
    expect(lessonRow(/^C og G/)).toHaveAttribute('aria-selected', 'true')
    expect(lessonRow(/^\+ A og B/)).toHaveAttribute('aria-selected', 'false')
  })

  it('picking a lesson in the tree changes which notes the round draws from', () => {
    render(<NotectorGame />)
    // The toolbar selector mirrors the tree — both drive the same lessonId.
    const picker = screen.getByRole('combobox', { name: 'Hvaða nótur á að æfa' })
    expect(picker).toHaveValue('c-g')
    fireEvent.click(screen.getByRole('button', { name: /^\+ D og F/ }))
    expect(picker).toHaveValue('plus-d-f')
    expect(lessonRow(/^\+ D og F/)).toHaveAttribute('aria-selected', 'true')
  })

  it('expands whichever lesson is selected, without a second click on ▸', () => {
    render(<NotectorGame />)
    // "+ D og F" is collapsed on mount; selecting it must reveal its contents.
    expect(screen.queryByRole('button', { name: /Ný æfing undir \+ D og F/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^\+ D og F/ }))
    expect(screen.getByRole('button', { name: /Ný æfing undir \+ D og F/ })).toBeInTheDocument()
  })
})

describe('NotectorGame — Muscle Memory mode', () => {
  afterEach(() => vi.restoreAllMocks())

  /** Note-letter buttons of the builder palette, in order. */
  const palette = () =>
    screen.getAllByRole('button').map((b) => b.textContent ?? '').filter((t) => /^[A-G]$/.test(t))

  it('picks the level by clicking its box on the idle screen', () => {
    render(<NotectorGame />)
    const box = screen.getByRole('radio', { name: /Vöðvaminni/ })
    expect(box).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(box)
    expect(box).toHaveAttribute('aria-checked', 'true')
    // Same state the toolbar drives, and the Muscle Memory panel appeared.
    expect(screen.getByRole('combobox', { name: 'Erfiðleikastig' })).toHaveValue('muscle')
    expect(screen.getByRole('button', { name: /Slembinn taktur/i })).toBeInTheDocument()
  })

  it('shows the bar builder and source picker when Muscle Memory is selected', () => {
    render(<NotectorGame />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Erfiðleikastig' }), { target: { value: 'muscle' } })
    expect(screen.getByRole('combobox', { name: 'Undir hvaða þrepi æfingin er' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Slembinn taktur/i })).toBeInTheDocument()
  })

  it('offers only the notes the exercise’s lesson has taught', () => {
    render(<NotectorGame />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Erfiðleikastig' }), { target: { value: 'muscle' } })
    expect(palette()).toEqual(['C', 'G']) // starts on the first lesson
    fireEvent.change(screen.getByRole('combobox', { name: 'Undir hvaða þrepi æfingin er' }), {
      target: { value: 'plus-d-f' },
    })
    expect(palette()).toEqual(['C', 'D', 'E', 'F', 'G'])
  })

  it('"Ný æfing" in the tree binds the builder to that lesson', () => {
    render(<NotectorGame />)
    // Only the lesson being practised starts expanded, so open "+ E" first.
    fireEvent.click(screen.getByRole('button', { name: 'Opna + E' }))
    fireEvent.click(screen.getByRole('button', { name: /Ný æfing undir \+ E/ }))
    // The builder opened (Muscle Memory panel) bound to that node, and practice moved there too.
    expect(screen.getByRole('combobox', { name: 'Undir hvaða þrepi æfingin er' })).toHaveValue('plus-e')
    expect(screen.getByRole('combobox', { name: 'Erfiðleikastig' })).toHaveValue('muscle')
    expect(screen.getByRole('combobox', { name: 'Hvaða nótur á að æfa' })).toHaveValue('plus-e')
    expect(palette()).toEqual(['C', 'E', 'G'])
  })
})
