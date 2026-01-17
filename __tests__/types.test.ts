import { 
  toDate, 
  formatTimestamp, 
  isTimestamp 
} from '@/lib/types'

describe('Type Utilities', () => {
  describe('isTimestamp', () => {
    it('returns true for Timestamp-like objects', () => {
      const mockTimestamp = { toDate: () => new Date() }
      expect(isTimestamp(mockTimestamp)).toBe(true)
    })

    it('returns false for Date objects', () => {
      expect(isTimestamp(new Date())).toBe(false)
    })

    it('returns false for null', () => {
      expect(isTimestamp(null)).toBe(false)
    })

    it('returns false for strings', () => {
      expect(isTimestamp('2024-01-01')).toBe(false)
    })
  })

  describe('toDate', () => {
    it('returns Date for Date input', () => {
      const date = new Date('2024-01-15')
      expect(toDate(date)).toEqual(date)
    })

    it('converts Timestamp to Date', () => {
      const expectedDate = new Date('2024-01-15')
      const mockTimestamp = { toDate: () => expectedDate }
      expect(toDate(mockTimestamp as unknown as Date)).toEqual(expectedDate)
    })

    it('returns null for null input', () => {
      expect(toDate(null)).toBeNull()
    })

    it('returns null for undefined input', () => {
      expect(toDate(undefined)).toBeNull()
    })
  })

  describe('formatTimestamp', () => {
    it('formats Date correctly', () => {
      const date = new Date('2024-01-15')
      const result = formatTimestamp(date)
      expect(result).toContain('Jan')
      expect(result).toContain('15')
      expect(result).toContain('2024')
    })

    it('returns N/A for null', () => {
      expect(formatTimestamp(null)).toBe('N/A')
    })

    it('returns N/A for undefined', () => {
      expect(formatTimestamp(undefined)).toBe('N/A')
    })

    it('respects custom options', () => {
      const date = new Date('2024-01-15')
      const result = formatTimestamp(date, { year: 'numeric' })
      expect(result).toBe('2024')
    })
  })
})
