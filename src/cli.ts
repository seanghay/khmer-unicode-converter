#!/usr/bin/env node
/**
 * khmerconvert — CLI for converting Khmer text files between legacy font
 * encodings and Khmer Unicode. Mirrors the original khmerconverter.py
 * plain-text behavior; `-` (or a missing input) uses stdin/stdout.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { parseArgs } from 'node:util'
import { type Encoding, canDecode } from './cp1252.js'
import { defaultFont, listEncodings, listFontNames, listFontTypes } from './fontData.js'
import {
  DEFAULT_FONT,
  convertLegacyToUnicode,
  convertUnicodeToLegacyBytes,
} from './index.js'

const HELP = `Usage: khmerconvert [options] [input] [output]

Convert Khmer plain text between legacy font encodings and Unicode.
Reads legacy text and writes UTF-8 by default; use --to-legacy for the
reverse direction. Input "-" (or no input) reads stdin and writes stdout.
Default output file: converted-<input> next to the input file.

Options:
  -l, --list-fonts       list supported fonts and exit
  -c, --list-encodings   list supported input encodings and exit
  -o, --to-legacy        convert Unicode -> legacy (default: legacy -> Unicode)
  -e, --encoding <enc>   encoding of legacy input (default: cp1252)
  -f, --font <name>      legacy font type, name, or alias (default: ${DEFAULT_FONT})
  -h, --help             show this help
  -V, --version          show version`

function fail(message: string): never {
  process.stderr.write(`${message}\n`)
  process.exit(1)
}

export function run(argv: string[]): void {
  let parsed: ReturnType<typeof parseArgs>
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        'list-fonts': { type: 'boolean', short: 'l', default: false },
        'list-encodings': { type: 'boolean', short: 'c', default: false },
        'to-legacy': { type: 'boolean', short: 'o', default: false },
        encoding: { type: 'string', short: 'e', default: 'cp1252' },
        font: { type: 'string', short: 'f', default: DEFAULT_FONT },
        help: { type: 'boolean', short: 'h', default: false },
        version: { type: 'boolean', short: 'V', default: false },
      },
    })
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error))
  }
  const opts = parsed.values
  const args = parsed.positionals

  if (opts.help) {
    console.log(HELP)
    return
  }
  if (opts.version) {
    console.log('khmerconvert 2.0.0')
    return
  }
  if (opts['list-fonts']) {
    console.log('Supported fonts:')
    const types = listFontTypes()
    for (const type of types) {
      console.log(`  ${type} (default: ${defaultFont(type)})`)
    }
    console.log(`\nAll known names/aliases: ${listFontNames().join(', ')}`)
    return
  }
  if (opts['list-encodings']) {
    console.log(`Supported input encodings: ${listEncodings().join(', ')}`)
    return
  }

  const encoding = String(opts.encoding).toLowerCase()
  if (!canDecode(encoding)) {
    fail(`Unknown encoding "${opts.encoding}". Supported: ${listEncodings().join(', ')}`)
  }
  const font = String(opts.font)
  const toLegacy = Boolean(opts['to-legacy'])

  const inputName = args[0] ?? '-'
  const useStdin = inputName === '-'
  let outputName = args[1]

  if (!useStdin && !existsSync(inputName)) {
    fail(`${inputName} does not exist!`)
  }
  if (useStdin) {
    if (outputName !== undefined && outputName !== '-') {
      fail('Output file with stdin input is not supported; redirect stdout instead.')
    }
    outputName = '-'
  } else if (outputName === undefined) {
    outputName = join(dirname(inputName), `converted-${basename(inputName)}`)
  }
  if (outputName !== '-') {
    if (inputName === outputName) {
      fail('Input file and output file must be different!')
    }
    const outDir = dirname(outputName)
    if (outDir && !existsSync(outDir)) {
      fail('The output path does not exist!')
    }
    if (existsSync(outputName)) {
      fail(`The output file ${outputName} already exists!`)
    }
  }

  const inputBytes: Uint8Array = useStdin ? readFileSync(0) : readFileSync(inputName)

  let outputBytes: Uint8Array
  try {
    if (toLegacy) {
      const text = new TextDecoder('utf-8').decode(inputBytes)
      outputBytes = convertUnicodeToLegacyBytes(text, font)
    } else {
      const unicode = convertLegacyToUnicode(inputBytes, font, {
        encoding: encoding as Encoding,
      })
      outputBytes = new TextEncoder().encode(unicode)
    }
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error))
  }

  if (outputName === '-') {
    process.stdout.write(outputBytes)
  } else {
    writeFileSync(outputName, outputBytes)
  }
}

run(process.argv.slice(2))
