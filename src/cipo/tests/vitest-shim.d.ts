declare module 'vitest' {
  export function describe(name: string, callback: () => void): void
  export function it(name: string, callback: () => void): void
  export function expect(value: unknown): {
    toContain(expected: string): void
    toBe(expected: unknown): void
  }
  export function beforeEach(callback: () => void): void
}
