import {
  convertLegacyToUnicode,
  convertUnicodeToLegacy,
  defaultFont,
  listFontTypes,
} from '../src/index.js'

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id)
  if (!el) throw new Error(`missing #${id}`)
  return el as T
}

const direction = $<HTMLSelectElement>('direction')
const fontSelect = $<HTMLSelectElement>('font')
const input = $<HTMLTextAreaElement>('input')
const output = $<HTMLTextAreaElement>('output')
const inputLabel = $<HTMLSpanElement>('input-label')
const outputLabel = $<HTMLSpanElement>('output-label')
const errorBox = $<HTMLParagraphElement>('error')

for (const type of listFontTypes()) {
  const option = document.createElement('option')
  option.value = type
  option.textContent = `${type} (${defaultFont(type)})`
  if (type === 'abc-zwsp') option.selected = true
  fontSelect.append(option)
}

function legacyFontFamily(): string {
  return `"${defaultFont(fontSelect.value)}", inherit`
}

function updateLabels(): void {
  const toUnicode = direction.value === 'l2u'
  inputLabel.textContent = toUnicode ? 'Legacy text' : 'Unicode text'
  outputLabel.textContent = toUnicode ? 'Unicode text' : 'Legacy text'
  // show real glyphs for users who have the legacy font installed
  input.style.fontFamily = toUnicode ? legacyFontFamily() : ''
  output.style.fontFamily = toUnicode ? '' : legacyFontFamily()
}

function convert(): void {
  errorBox.hidden = true
  try {
    output.value =
      direction.value === 'l2u'
        ? convertLegacyToUnicode(input.value, fontSelect.value)
        : convertUnicodeToLegacy(input.value, fontSelect.value)
  } catch (error) {
    errorBox.textContent = error instanceof Error ? error.message : String(error)
    errorBox.hidden = false
  }
}

$<HTMLButtonElement>('convert').addEventListener('click', convert)
input.addEventListener('input', convert)
direction.addEventListener('change', () => {
  updateLabels()
  convert()
})
fontSelect.addEventListener('change', () => {
  updateLabels()
  convert()
})
$<HTMLButtonElement>('copy').addEventListener('click', () => {
  navigator.clipboard?.writeText(output.value)
})

updateLabels()
