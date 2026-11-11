import { describe, expect, it } from 'vitest'
import { passwordStrength } from '../auth/strength'

describe('passwordStrength', () => {
  it('scores passwords from 0 to 4', () => {
    expect(passwordStrength('')).toBe(0)
    expect(passwordStrength('short')).toBe(0)
    expect(passwordStrength('longenough')).toBe(1)
    expect(passwordStrength('longenough1')).toBe(2)
    expect(passwordStrength('LongEnough1')).toBe(3)
    expect(passwordStrength('LongEnough1!')).toBe(4)
  })
})
