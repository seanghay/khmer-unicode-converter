// Translated from FontDataXML.TestFontData (modules/FontDataXML.py:376-505),
// running the build-time generator against the original test-*.xml fixtures.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { XMLDataError, beautify, buildFontData, renderModule } from '../scripts/fontdataGen.js'

const MODULES = new URL('../fontdata/', import.meta.url)

function fixture(name: string): string {
  return readFileSync(new URL(name, MODULES), 'utf-8')
}

const built = buildFontData(fixture('test-fontdata.xml'), 'test-fontdata.xml')

function typeFor(name: string): string {
  const type = built.fontNames[beautify(name)]
  if (type === undefined) throw new Error(`Font: ${name} is unknown.`)
  return type
}

describe('fontdata generator: error fixtures', () => {
  it('rejects files without fonts', () => {
    expect(() => buildFontData(fixture('test-nofonts.xml'))).toThrow(XMLDataError)
  })
  it('rejects duplicate font types', () => {
    expect(() => buildFontData(fixture('test-doublefonts.xml'))).toThrow(XMLDataError)
  })
  it('rejects inheriting a font that is not defined yet', () => {
    expect(() => buildFontData(fixture('test-inherit.xml'))).toThrow(XMLDataError)
  })
  it('rejects duplicate unicode mappings', () => {
    expect(() => buildFontData(fixture('test-doubleunicode.xml'))).toThrow(XMLDataError)
    expect(() => buildFontData(fixture('test-doubleunicode2.xml'))).toThrow(XMLDataError)
  })
  it('rejects duplicate legacy mappings', () => {
    expect(() => buildFontData(fixture('test-doublelegacy.xml'))).toThrow(XMLDataError)
    expect(() => buildFontData(fixture('test-doublelegacy2.xml'))).toThrow(XMLDataError)
    expect(() => buildFontData(fixture('test-doublelegacy3.xml'))).toThrow(XMLDataError)
  })
})

describe('fontdata generator: test-fontdata.xml', () => {
  it('lists 7 font names and 4 visible types', () => {
    expect(Object.keys(built.fontNames)).toHaveLength(7)
    expect(Object.keys(built.fonts)).toHaveLength(4)
  })

  it('hides hidden fonts and rejects unknown names', () => {
    expect(built.fontNames['hidden']).toBeUndefined()
    expect(built.fonts['hidden']).toBeUndefined()
    expect(built.fontNames[beautify('unkownFontName%%%%%')]).toBeUndefined()
  })

  it('inherits legacy data (abc-zwsp & abc-3 inherit from abc)', () => {
    for (const font of ['abc', 'abc-3', 'abc-zwsp']) {
      const data = built.fonts[typeFor(font)]
      const dict = new Map(data.legacyDict)
      expect(dict.get('bÿ')).toBe('ឫ')
      expect(data.legacyTable['a'.charCodeAt(0)]).toBe('កក')
      expect(data.legacyTable['b'.charCodeAt(0)]).toBe('ស')
      expect(data.legacyTable['c'.charCodeAt(0)]).toBe('\u200B')
    }
    for (const font of ['abc-3', 'abc-zwsp']) {
      const data = built.fonts[typeFor(font)]
      const dict = new Map(data.legacyDict)
      expect(data.legacyTable['1'.charCodeAt(0)]).toBe('១')
      expect(dict.get('1?')).toBe('')
    }
  })

  it('inherits unicode data (abc-zwsp & abc-3 inherit from abc)', () => {
    for (const font of ['abc', 'abc-3', 'abc-zwsp']) {
      const data = built.fonts[typeFor(font)]
      expect(data.unicodeDicts[0]?.['\u200B']).toBe('c')
      expect(data.unicodeDicts[1]?.['កក']).toBe('a')
      expect(data.unicodeDicts[2]?.['ខ្រ']).toBe('__')
      expect(data.unicodeTable['ស'.charCodeAt(0) - 0x1780]).toBe('b')
    }
  })

  it('is convertible under name variations (case, dash, underscore)', () => {
    for (const name of Object.keys(built.fontNames)) {
      expect(built.fontNames[beautify(name.toUpperCase())]).toBeDefined()
      expect(built.fontNames[beautify(name.replaceAll(' ', '-'))]).toBeDefined()
      expect(built.fontNames[beautify(name.replaceAll(' ', '_'))]).toBeDefined()
    }
  })
})

describe('fontdata generator: real fontdata.xml', () => {
  const xml = fixture('fontdata.xml')
  const real = buildFontData(xml)

  it('builds all visible fonts without error', () => {
    expect(Object.keys(real.fonts)).toEqual([
      'abc', 'abc2', 'abc3', 'abc-zwsp', 'limon', 'truth',
      'baidok', 'khek', 'fk', 'kaohkong', 'rasmei',
    ])
    for (const font of Object.values(real.fonts)) {
      expect(font.legacyTable).toHaveLength(0x100)
      expect(font.unicodeTable).toHaveLength(0x7f)
    }
  })

  it('type is not repeated in its own alias list', () => {
    for (const [type, font] of Object.entries(real.fonts)) {
      for (const alias of font.aliases) {
        expect(beautify(alias)).not.toBe(beautify(type))
      }
    }
  })

  it('committed src/generated/fontdata.ts is up to date (drift guard)', () => {
    const sha256 = createHash('sha256').update(xml).digest('hex')
    const expected = renderModule(real, sha256)
    const committed = readFileSync(new URL('../src/generated/fontdata.ts', import.meta.url), 'utf-8')
    expect(committed).toBe(expected)
  })
})
