// Backwards-compatibility suite: translated verbatim from index.test.mjs of
// khmer-unicode-converter 0.0.8 (ava). The limon() API must keep behaving
// exactly as before the rewrite.
import { describe, expect, it } from 'vitest'
import { limon } from '../src/index.js'

describe('limon (0.0.8 compatibility)', () => {
  it('convert', () => {
    expect(limon('ភស្តុតាងអំពីពាក្យថា ខ្មែរ')).toBe('PsþútagGMBIBaküfa Exµr')
    expect(limon('សម្រាប់ស្បែកខ្មៅ')).toBe('sRmab;Es,kexµA')
    expect(limon('សម្រាប់ស្បែកខ្មៅ,')).toBe('sRmab;Es,kexµA,')
    expect(limon('ស៊ាន')).toBe('s‘an')

    expect(limon('ការឲ្យ')).toBe('kar[')
    expect(limon('ការឱ្យ')).toBe('kar[')
    expect(limon('ការឱ')).toBe('kar»')
    expect(limon('ការឲ')).toBe('kar»')
    expect(limon('ឲ')).toBe('»')
    expect(limon('ឲ្យ')).toBe('[')
    expect(limon('ឱ្យ')).toBe('[')
    expect(limon('ឱ')).toBe('»')
    expect(limon('ស៊ី')).toBe('suI')

    expect(limon('អ៊ី')).toBe('GuI')
    expect(limon('អ៊ឺ')).toBe('GuW')
    expect(limon('អ៊ឹ')).toBe('Guw')
    expect(limon('អ៊ិ')).toBe('Gui')

    expect(limon('ស៊ើប')).toBe('esuIb')
    expect(limon('ប៉ី')).toBe('buI')
    expect(limon('ប៉ិ')).toBe('bui')
    expect(limon('ប៉ឹ')).toBe('buw')
    expect(limon('ប៉ឺ')).toBe('buW')
  })

  it('maps ៕ to the Limon layout position', () => {
    expect(limon('៕')).toBe('>')
  })
})
