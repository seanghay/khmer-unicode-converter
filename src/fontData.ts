/**
 * Runtime access to the generated font mapping data.
 *
 * Port of the runtime half of modules/FontDataXML.py (the parsing half lives
 * in scripts/generate-fontdata.ts and runs at build time).
 */
import { ENCODINGS, type Encoding } from './cp1252.js'
import { fonts, fontNames } from './generated/fontdata.js'
import type { UnicodeFontData } from './legacyConverter.js'
import type { LegacyFontData } from './unicodeProcess.js'

export class FontNotFoundError extends Error {}

/** normalize a font name: lowercase, dashes/underscores become spaces */
export function beautify(fontname: string): string {
  return fontname.toLowerCase().replaceAll('-', ' ').replaceAll('_', ' ')
}

/** sorted list of convertible font types, e.g. ["abc", "abc-zwsp", "limon", ...] */
export function listFontTypes(): string[] {
  return [...new Set(Object.values(fontNames))].sort()
}

/** sorted list of all known font names and aliases (beautified) */
export function listFontNames(): string[] {
  return Object.keys(fontNames).sort()
}

/** sorted list of the known real font names for one font type */
export function listFontNamesForType(fonttype: string): string[] {
  return Object.entries(fontNames)
    .filter(([name, type]) => type === fonttype && beautify(type) !== name)
    .map(([name]) => name)
    .sort()
}

/** resolve a font name or alias to its font type; throws FontNotFoundError */
export function typeForFontName(fontname: string): string {
  const type = fontNames[beautify(fontname)]
  if (type === undefined) {
    throw new FontNotFoundError(`Font: ${beautify(fontname)} is unknown.`)
  }
  return type
}

export function isConvertible(fontname: string): boolean {
  try {
    typeForFontName(fontname)
    return true
  } catch {
    return false
  }
}

/** preferred real output font name for a font type (e.g. "ABC-TEXT-05") */
export function defaultFont(fonttype: string): string {
  return fonts[fonttype]?.defaultName ?? fonttype
}

export function listEncodings(): readonly Encoding[] {
  return ENCODINGS
}

const legacyDataCache = new Map<string, LegacyFontData>()

/** legacy -> unicode conversion data for a font name or alias */
export function getLegacyData(fontname: string): LegacyFontData {
  const type = typeForFontName(fontname)
  let data = legacyDataCache.get(type)
  if (!data) {
    const font = fonts[type]
    data = { dict: font.legacyDict, table: font.legacyTable }
    legacyDataCache.set(type, data)
  }
  return data
}

const unicodeDataCache = new Map<string, UnicodeFontData>()

/** unicode -> legacy conversion data for a font name or alias */
export function getUnicodeData(fontname: string): UnicodeFontData {
  const type = typeForFontName(fontname)
  let data = unicodeDataCache.get(type)
  if (!data) {
    const font = fonts[type]
    data = {
      dicts: font.unicodeDicts.map((d) => (d === null ? null : new Map(Object.entries(d)))),
      table: font.unicodeTable,
    }
    unicodeDataCache.set(type, data)
  }
  return data
}
