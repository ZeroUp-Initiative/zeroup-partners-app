import { cn } from '@/lib/utils'

describe('Utils', () => {
  describe('cn (classnames utility)', () => {
    it('merges class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('handles conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('handles undefined values', () => {
      expect(cn('foo', undefined, 'bar')).toBe('foo bar')
    })

    it('handles null values', () => {
      expect(cn('foo', null, 'bar')).toBe('foo bar')
    })

    it('handles empty strings', () => {
      expect(cn('foo', '', 'bar')).toBe('foo bar')
    })

    it('merges tailwind classes correctly', () => {
      // Tailwind merge should deduplicate conflicting classes
      expect(cn('p-4', 'p-8')).toBe('p-8')
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })

    it('handles arrays of classes', () => {
      expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
    })

    it('handles objects with boolean values', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz')
    })
  })
})
