import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Unmount React trees between tests so timers/listeners don't leak.
afterEach(() => {
  cleanup()
})
