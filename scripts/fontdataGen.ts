/**
 * fontdata.xml -> TypeScript data generator (library part).
 *
 * Reimplements the parsing/validation half of modules/FontDataXML.py:
 * reads the font definitions, resolves single inheritance by flattening
 * parent tables into each visible font, and produces the exact data shapes
 * the converters consume. Runs at build time only; the emitted module is
 * committed so the published package has no XML parser dependency.
 */
import { XMLParser } from 'fast-xml-parser'

export const MAXUNI = 0x7f // length of the unicode table
export const MAXLEG = 0x100 // length of the legacy table
export const MAXLENGTH = 10 // maximum length of an allowed unicode replacement
const LEGSEP = ';'

export class XMLDataError extends Error {}

export interface BuiltFont {
  defaultName: string | null
  aliases: string[]
  /** multi-byte legacy sequence -> unicode replacement, sorted longest key first */
  legacyDict: [string, string][]
  /** 256 entries: unicode replacement per byte (identity where unmapped) */
  legacyTable: string[]
  /** length-bucketed unicode -> legacy byte-string maps; index = key length - 1 */
  unicodeDicts: (Record<string, string> | null)[]
  /** 127 entries indexed by codepoint - 0x1780: legacy byte-string ('' = drop) */
  unicodeTable: string[]
}

export interface BuiltData {
  /** visible font types only, fully inheritance-flattened, in document order */
  fonts: Record<string, BuiltFont>
  /** beautify(name or alias or type) -> font type */
  fontNames: Record<string, string>
}

export function beautify(fontname: string): string {
  return fontname.toLowerCase().replaceAll('-', ' ').replaceAll('_', ' ')
}

const NAMED_ENTITIES: Record<string, string> = {
  // declared in the fontdata.xml internal DTD subset
  mark: '\u17EA',
  coeng: '\u17D2',
  zwsp: '\u200B',
  zwj: '\u200C',
  zwnj: '\u200D',
  nbsp: '\u00A0',
  // XML predefined
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
}

function resolveEntities(value: string): string {
  return value.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (match, body: string) => {
    if (body.startsWith('#x')) return String.fromCodePoint(Number.parseInt(body.slice(2), 16))
    if (body.startsWith('#')) return String.fromCodePoint(Number.parseInt(body.slice(1), 10))
    const named = NAMED_ENTITIES[body]
    if (named === undefined) throw new XMLDataError(`unknown entity ${match}`)
    return named
  })
}

// fast-xml-parser preserveOrder node
type XNode = Record<string, unknown> & { ':@'?: Record<string, string> }

function attr(node: XNode, name: string): string {
  const raw = node[':@']?.[name]
  return raw === undefined ? '' : resolveEntities(String(raw))
}

function nodeTag(node: XNode): string | undefined {
  return Object.keys(node).find((k) => k !== ':@')
}

function nodeChildren(node: XNode): XNode[] {
  const tag = nodeTag(node)
  const kids = tag ? node[tag] : undefined
  return Array.isArray(kids) ? (kids as XNode[]) : []
}

/** all descendant elements with the given tag, in document order (like getElementsByTagName) */
function descendants(node: XNode, tag: string): XNode[] {
  const found: XNode[] = []
  for (const child of nodeChildren(node)) {
    if (nodeTag(child) === tag) found.push(child)
    found.push(...descendants(child, tag))
  }
  return found
}

/** parse the ";"-separated hex/decimal legacy attribute into a byte string */
function decodeLegacy(attribute: string): string {
  let s = ''
  for (const piece of attribute.split(LEGSEP)) {
    if (piece.length === 0) continue
    const t = piece.trim()
    let value: number
    if (/^0[xX][0-9a-fA-F]+$/.test(t)) value = Number.parseInt(t, 16)
    else if (/^[0-9]+$/.test(t)) value = Number.parseInt(t, 10)
    else throw new XMLDataError(`invalid legacy value "${piece}"`)
    if (value < 0 || value >= MAXLEG) throw new XMLDataError(`legacy value out of range: "${piece}"`)
    s += String.fromCharCode(value)
  }
  return s
}

function stripDoctype(xml: string): string {
  // tolerate the malformed SYSTEM id in the historical files ("<http://...")
  return xml.replace(/<!DOCTYPE[^[>]*(?:\[[\s\S]*?\])?[^>]*>/, '')
}

interface FontDef {
  type: string
  element: XNode
  parent: string | null
  hidden: boolean
  defaultName: string | null
  aliases: string[]
}

function addToUniData(unicode: string, legacy: string, dicts: Map<string, string>[]): void {
  const l = unicode.length
  if (l > 0 && l < MAXLENGTH) {
    while (dicts.length < l) dicts.push(new Map())
    if (dicts[l - 1].has(unicode)) {
      throw new XMLDataError(`Unicode string ${unicode} already in datastructure.`)
    }
    dicts[l - 1].set(unicode, legacy)
  }
}

function mapsOf(font: XNode): XNode | undefined {
  return descendants(font, 'maps')[0]
}

function mapElements(container: XNode, section: string): XNode[] {
  const sec = descendants(container, section)[0]
  return sec ? descendants(sec, 'map') : []
}

export function buildFontData(xml: string, filename = 'fontdata.xml'): BuiltData {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    preserveOrder: true,
    processEntities: false,
    parseAttributeValue: false,
    parseTagValue: false,
  })
  const doc = parser.parse(stripDoctype(xml)) as XNode[]
  const root: XNode = { '#root': doc }

  const fontElements = new Map<string, FontDef>()
  const fontNames: Record<string, string> = {}

  const fonts = descendants(root, 'font')
  if (fonts.length === 0) {
    throw new XMLDataError(`no Fonts found in ${filename}`)
  }

  for (const font of fonts) {
    const fonttype = attr(font, 'type').toLowerCase()
    if (fontElements.has(fonttype)) {
      throw new XMLDataError(`Font: ${fonttype} is defined twice in ${filename}`)
    }
    const inherit = attr(font, 'inherit').toLowerCase()
    if (inherit !== '' && !fontElements.has(inherit)) {
      throw new XMLDataError(
        `Font ${fonttype} can not inherit unkown font ${inherit} in ${filename}`,
      )
    }
    const hidden = attr(font, 'hidden').toLowerCase() === 'true'
    const def: FontDef = {
      type: fonttype,
      element: font,
      parent: inherit !== '' ? inherit : null,
      hidden,
      defaultName: attr(font, 'default') || null,
      aliases: descendants(font, 'alias').map((a) => attr(a, 'name')),
    }
    fontElements.set(fonttype, def)
    if (!hidden) {
      fontNames[beautify(fonttype)] = fonttype
      for (const alias of def.aliases) {
        fontNames[beautify(alias)] = fonttype
      }
    }
  }

  // legacy (legacy -> unicode) data, inheritance-flattened
  const legacyCache = new Map<string, { dict: Map<string, string>; table: string[] }>()
  function readLegacyData(fonttype: string): { dict: Map<string, string>; table: string[] } {
    const cached = legacyCache.get(fonttype)
    if (cached) return cached
    const def = fontElements.get(fonttype)
    if (!def) throw new XMLDataError(`Font: ${fonttype} is unknown.`)

    let dict: Map<string, string>
    let table: string[]
    if (def.parent) {
      const parent = readLegacyData(def.parent)
      dict = new Map(parent.dict)
      table = [...parent.table]
    } else {
      dict = new Map()
      table = Array.from({ length: MAXLEG }, (_, i) => String.fromCharCode(i))
    }

    const maps = mapsOf(def.element)
    if (maps) {
      // <global>
      for (const map of mapElements(maps, 'global')) {
        const legacy = decodeLegacy(attr(map, 'legacy'))
        const unicode = attr(map, 'unicode')
        const l = legacy.length
        if (l === 1) {
          const i = legacy.charCodeAt(0)
          if (table[i] === String.fromCharCode(i)) {
            table[i] = unicode
          } else {
            throw new XMLDataError(
              `Legacy character 0x${i.toString(16)} defined twice in global.`,
            )
          }
        } else if (l > 0 && l < MAXLENGTH) {
          if (dict.has(legacy)) {
            throw new XMLDataError(`Legacy character ${legacy} defined twice in global.`)
          }
          dict.set(legacy, unicode)
        }
      }
      // <tounicode>
      for (const map of mapElements(maps, 'tounicode')) {
        const legacy = decodeLegacy(attr(map, 'legacy'))
        const unicode = attr(map, 'unicode')
        const l = legacy.length
        if (l > 0 && l < MAXLENGTH) {
          if (dict.has(legacy)) {
            throw new XMLDataError(`Legacy character ${legacy} defined twice in toUnicode.`)
          }
          dict.set(legacy, unicode)
        }
      }
    }

    const built = { dict, table }
    legacyCache.set(fonttype, built)
    return built
  }

  // unicode (unicode -> legacy) data, inheritance-flattened
  const unicodeCache = new Map<string, { dicts: Map<string, string>[]; table: string[] }>()
  function readUnicodeData(fonttype: string): { dicts: Map<string, string>[]; table: string[] } {
    const cached = unicodeCache.get(fonttype)
    if (cached) return cached
    const def = fontElements.get(fonttype)
    if (!def) throw new XMLDataError(`Font: ${fonttype} is unknown.`)

    let dicts: Map<string, string>[]
    let table: string[]
    if (def.parent) {
      const parent = readUnicodeData(def.parent)
      dicts = parent.dicts.map((d) => new Map(d))
      table = [...parent.table]
    } else {
      dicts = []
      table = Array.from({ length: MAXUNI }, () => '')
    }

    const maps = mapsOf(def.element)
    if (maps) {
      // <global>
      for (const map of mapElements(maps, 'global')) {
        const legacy = decodeLegacy(attr(map, 'legacy'))
        const unicode = attr(map, 'unicode')
        const l = unicode.length
        if (l === 1) {
          const i = unicode.charCodeAt(0) - 0x1780
          if (i >= 0 && i < MAXUNI) {
            if (table[i] === '') {
              table[i] = legacy
            } else {
              throw new XMLDataError(
                `Unicode character 0x${unicode.charCodeAt(0).toString(16)} defined twice in global.`,
              )
            }
          } else {
            addToUniData(unicode, legacy, dicts)
          }
        } else if (l > 1 && l < MAXLENGTH) {
          addToUniData(unicode, legacy, dicts)
        }
      }
      // <fromunicode>
      for (const map of mapElements(maps, 'fromunicode')) {
        const legacy = decodeLegacy(attr(map, 'legacy'))
        const unicode = attr(map, 'unicode')
        if (unicode.length > 0 && unicode.length < MAXLENGTH) {
          addToUniData(unicode, legacy, dicts)
        }
      }
    }

    const built = { dicts, table }
    unicodeCache.set(fonttype, built)
    return built
  }

  const builtFonts: Record<string, BuiltFont> = {}
  for (const def of fontElements.values()) {
    if (def.hidden) continue
    const legacy = readLegacyData(def.type)
    const unicode = readUnicodeData(def.type)
    // longest key first so greedy matching is deterministic (Python relied on
    // dict hash order here; longest-match-wins is the intended behavior)
    const legacyDict = [...legacy.dict.entries()].sort((a, b) => b[0].length - a[0].length)
    builtFonts[def.type] = {
      defaultName: def.defaultName,
      aliases: def.aliases,
      legacyDict,
      legacyTable: legacy.table,
      unicodeDicts: unicode.dicts.map((d) =>
        d.size === 0 ? null : Object.fromEntries(d.entries()),
      ),
      unicodeTable: unicode.table,
    }
  }

  return { fonts: builtFonts, fontNames }
}

/** escape all non-ASCII (and DEL) so the emitted module is plain ASCII */
function toEscapedJSON(value: unknown, indent?: number): string {
  return JSON.stringify(value, null, indent).replace(
    /[\u007f-\uffff]/g,
    (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`,
  )
}

export function renderModule(data: BuiltData, sourceSha256: string): string {
  const fontLines = Object.entries(data.fonts)
    .map(([type, font]) => `  ${JSON.stringify(type)}: ${toEscapedJSON(font)},`)
    .join('\n')
  return `/* AUTO-GENERATED by scripts/generate-fontdata.ts from fontdata/fontdata.xml.
 * DO NOT EDIT — run \`npm run gen:fontdata\` to regenerate. */

export interface GeneratedFont {
  /** preferred real font name for output, e.g. "ABC-TEXT-05" */
  defaultName: string | null
  /** real-world font names this type covers */
  aliases: string[]
  /** legacy byte-string -> unicode replacement, sorted longest key first */
  legacyDict: [string, string][]
  /** 256 entries: unicode replacement per input byte */
  legacyTable: string[]
  /** unicode -> legacy byte-string maps bucketed by key length (index = length - 1) */
  unicodeDicts: (Record<string, string> | null)[]
  /** 127 entries indexed by codepoint - 0x1780: legacy byte-string ('' = drop) */
  unicodeTable: string[]
}

export const fonts: Record<string, GeneratedFont> = {
${fontLines}
}

export const fontNames: Record<string, string> = ${toEscapedJSON(data.fontNames, 2)}

export const sourceInfo = {
  file: 'fontdata/fontdata.xml',
  sha256: '${sourceSha256}',
} as const
`
}
