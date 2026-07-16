/**
 * Regenerate src/generated/fontdata.ts from fontdata/fontdata.xml.
 * Usage: npm run gen:fontdata [-- --check]
 * --check verifies the committed file is up to date without writing.
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildFontData, renderModule } from './fontdataGen.js'

const xmlPath = new URL('../fontdata/fontdata.xml', import.meta.url)
const outPath = new URL('../src/generated/fontdata.ts', import.meta.url)

const xml = readFileSync(xmlPath, 'utf-8')
const sha256 = createHash('sha256').update(xml).digest('hex')
const output = renderModule(buildFontData(xml), sha256)

if (process.argv.includes('--check')) {
  let current = ''
  try {
    current = readFileSync(outPath, 'utf-8')
  } catch {
    // missing counts as stale
  }
  if (current !== output) {
    console.error('src/generated/fontdata.ts is stale — run `npm run gen:fontdata`')
    process.exit(1)
  }
  console.log('src/generated/fontdata.ts is up to date')
} else {
  writeFileSync(outPath, output)
  console.log(`wrote ${fileURLToPath(outPath)}`)
}
