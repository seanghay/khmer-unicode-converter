// Translated from legacyConverter.TestConvert (modules/legacyConverter.py).
import { describe, expect, it } from 'vitest'
import { type UnicodeFontData, converter } from '../src/legacyConverter.js'

const MARK = '៪'
const chr = String.fromCharCode

const condenseData1 = new Map([
  ['​', chr(0x20)], // ZWSP
  ['‌', ''], // ZWNJ
  ['‍', ''], // ZWJ
])
const condenseData2 = new Map([
  ['បា', 'BAA'],
  ['្ក', 'Cok'],
  ['្ស', 'Cos'],
  [MARK + 'ី', 'I'],
])
const condenseData3 = new Map([
  [MARK + MARK + '៉', chr(0xfa)], // muusikatoan (U long)
  [MARK + MARK + '៊', chr(0xfa)], // triisap (U long)
])
const condenseData6 = new Map([
  ['ខ្ញ' + MARK + 'ុំ', chr(0xb4)], // one code point in limon
])

const data: UnicodeFontData = {
  dicts: [condenseData1, condenseData2, condenseData3, null, null, condenseData6],
  table: ['k', 'x', 'K', 'X'],
}

describe('legacyConverter.converter', () => {
  it('converts via dicts and table', () => {
    expect(converter('​', data)).toBe(chr(0x20)) // in dict1
    expect(converter('‌', data)).toBe('')
    expect(converter('បា', data)).toBe('BAA') // in dict2
    expect(converter('្ក', data)).toBe('Cok')
    expect(converter('្ស' + MARK + MARK + '៊' + MARK + 'ី', data)).toBe(`Cos${chr(0xfa)}I`) // in dict3
    expect(converter('ខ្ញ' + MARK + 'ុំ', data)).toBe(chr(0xb4)) // in dict6
    expect(converter('ក', data)).toBe('k') // in table
    expect(converter('ខ', data)).toBe('x')
    expect(converter('ឃ', data)).toBe('X')
  })

  it('keeps ascii and drops unknown unicode', () => {
    expect(converter('?', data)).toBe('?')
    expect(converter('\n', data)).toBe('\n')
    expect(converter('', data)).toBe('')
    // unknown non-ascii characters are removed
    expect(converter(chr(255), data)).toBe('')
    expect(converter(chr(0x1980), data)).toBe('')
  })

  it('converts the longest match first', () => {
    const longData: UnicodeFontData = {
      dicts: [
        new Map([['0', 'X']]),
        new Map([['09', 'M']]),
        new Map([['123', 'A']]),
        new Map([['1234', 'Z']]),
      ],
      table: [],
    }
    expect(converter('1234', longData)).toBe('Z')
  })
})
