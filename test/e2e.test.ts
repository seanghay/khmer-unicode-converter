// End-to-end pipeline tests over the real generated font data.
import { describe, expect, it } from 'vitest'
import {
  FontNotFoundError,
  convertLegacyToUnicode,
  convertUnicodeToLegacy,
  convertUnicodeToLegacyBytes,
  defaultFont,
  isConvertible,
  listEncodings,
  listFontNames,
  listFontTypes,
} from '../src/index.js'

describe('font listings', () => {
  it('lists the expected font types', () => {
    expect(listFontTypes()).toEqual([
      'abc', 'abc-zwsp', 'abc2', 'abc3', 'baidok', 'fk',
      'kaohkong', 'khek', 'limon', 'rasmei', 'truth',
    ])
  })

  it('resolves aliases case-insensitively', () => {
    expect(isConvertible('ABC-TEXT-05')).toBe(true)
    expect(isConvertible('Limon S1')).toBe(true)
    expect(isConvertible('limon_s1')).toBe(true)
    expect(isConvertible('no such font')).toBe(false)
  })

  it('reports default output fonts', () => {
    expect(defaultFont('abc')).toBe('ABC-TEXT-05')
    expect(defaultFont('limon')).toBe('Limon S1')
    expect(defaultFont('unknown-type')).toBe('unknown-type')
  })

  it('lists encodings', () => {
    expect(listEncodings()).toContain('cp1252')
    expect(listEncodings()).toContain('utf-8')
  })

  it('throws FontNotFoundError for unknown fonts', () => {
    expect(() => convertLegacyToUnicode('abc', 'no such font')).toThrow(FontNotFoundError)
  })
})

describe('legacy -> unicode', () => {
  // from unicodeConvertText.TestConvertTxt.testConversion
  it("converts 'kxK' (abc) to កខគ", () => {
    expect(convertLegacyToUnicode('kxK', 'abc')).toBe('កខគ')
  })

  it('accepts Uint8Array input', () => {
    expect(convertLegacyToUnicode(new TextEncoder().encode('kxK'), 'abc', { encoding: 'utf-8' })).toBe(
      'កខគ',
    )
    expect(convertLegacyToUnicode(Uint8Array.from([0x6b, 0x78, 0x4b]), 'abc')).toBe('កខគ')
  })

  it('resolves the font by alias', () => {
    expect(convertLegacyToUnicode('kxK', 'ABC-TEXT-05')).toBe('កខគ')
  })
})

describe('unicode -> legacy', () => {
  it("converts កខគ (abc) back to 'kxK'", () => {
    expect(convertUnicodeToLegacy('កខគ', 'abc')).toBe('kxK')
    expect(convertUnicodeToLegacyBytes('កខគ', 'abc')).toEqual(
      Uint8Array.from([0x6b, 0x78, 0x4b]),
    )
  })

  it('keeps ascii text unchanged (except font-mapped punctuation)', () => {
    expect(convertUnicodeToLegacy('hello world!', 'abc')).toBe('hello world!')
    // ',' is mapped by the font data itself (common font <global> 0x2F)
    expect(convertUnicodeToLegacy('a,b', 'abc')).toBe('a/b')
  })
})

describe('round-trip stability', () => {
  // Conversion is lossy by design (legacy fonts collapse some distinctions),
  // so assert the second round-trip reproduces the first, per font type.
  const corpus = [
    'ព្រះរាជាណាចក្រកម្ពុជា',
    'ភាសាខ្មែរ',
    'ខ្ញុំស្រឡាញ់ស្រុកខ្មែរ',
    'កាប់គោ ខាងលើ ចំពោះ',
    'សៀវភៅរបស់ខ្ញុំ',
    'រដ្ឋាភិបាល',
  ]

  for (const font of ['abc', 'abc-zwsp', 'limon', 'baidok', 'fk']) {
    it(`is stable for ${font}`, () => {
      for (const text of corpus) {
        const legacy1 = convertUnicodeToLegacy(text, font)
        const uni1 = convertLegacyToUnicode(legacy1, font)
        const legacy2 = convertUnicodeToLegacy(uni1, font)
        const uni2 = convertLegacyToUnicode(legacy2, font)
        // semantic stability: re-reading the re-encoded text gives the same unicode
        expect(uni2).toBe(uni1)
        // byte-level stability from the second iteration on
        expect(convertUnicodeToLegacy(uni2, font)).toBe(legacy2)
      }
    })
  }
})
