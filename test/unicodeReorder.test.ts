// Translated 1:1 from the unittest suite in modules/unicodeReorder.py —
// those assertions are the de-facto spec for the reordering behavior.
import { describe, expect, it } from 'vitest'
import {
  BASE,
  SHIFTER,
  SIGN,
  VOWEL,
  WITHE,
  WITHU,
  khmerType,
  reorder,
} from '../src/unicodeReorder.js'

const zwsp = '​'

describe('unicodeReorder.khmerType', () => {
  it('classifies characters correctly', () => {
    expect(khmerType('᝿')).toBe(0)
    expect(khmerType('ក') & BASE).toBe(BASE)
    expect(khmerType('ា')).toBe(VOWEL + WITHE + WITHU)
    expect(khmerType('៉')).toBe(SHIFTER)
    expect(khmerType('់')).toBe(SIGN)
    expect(khmerType('។')).toBe(0)
    expect(khmerType('៿')).toBe(0)
  })

  it('rejects non-single-character input', () => {
    expect(() => khmerType('KA')).toThrow(TypeError)
    expect(() => khmerType(1 as unknown as string)).toThrow(TypeError)
    expect(() => khmerType({ 1: 1 } as unknown as string)).toThrow(TypeError)
  })
})

describe('unicodeReorder.reorder', () => {
  it('reorders visual clusters into logical order', () => {
    expect(reorder('កករ')).toBe('កករ')
    // reorder SHIFTER
    expect(reorder('បា៉')).toBe('ប៉ា')
    expect(reorder('បូ៊')).toBe('ប៊ូ')
    // sra A + OM produces the same as sra OM + A
    expect(reorder('របំា')).toBe('របាំ')
    expect(reorder('របាំ')).toBe('របាំ')
    // coeng goes where it is supposed to be
    expect(reorder('្រកដាស្របដាល់កណ្ដាល')).toBe('ក្រដាសប្រដាល់កណ្ដាល')
    // correct leading sra E if there are allowed sra (e.g. sra A)
    expect(reorder('បេង្គាល ខាងេលី េសៀវេភៅ')).toBe('បង្គោល ខាងលើ សៀវភៅ')
    // correct muus or triisap
    expect(reorder('សីុបុីអុី')).toBe('ស៊ីប៉ីអ៊ី')
    expect(reorder('សុីបុីអុី')).toBe('ស៊ីប៉ីអ៊ី')
    // correct use of shifter on coeng SA
    expect(reorder('ន្សីុ')).toBe('ន្ស៊ី')
    // sra E is at the right place
    expect(reorder('េគ្របែឡងគ្នា')).toBe('គេប្រឡែងគ្នា')
    // case PO + a + coeng
    expect(reorder('បពា្ញា')).toBe('បញ្ញា')
    expect(reorder('បព្ជាី')).toBe('បញ្ជី')
    expect(reorder('កេ្រព្ជាាង')).toBe('កញ្ជ្រោង')
    // english text
    expect(reorder('this is english text')).toBe('this is english text')
    expect(reorder('ចំេពាះ')).toBe('ចំពោះ')
    expect(reorder('្របឹក្សាធម្មនុពា្ញ')).toBe('ប្រឹក្សាធម្មនុញ្ញ')

    expect(reorder('ៃហប៊ី')).toBe('ហៃប៊ី')
    expect(reorder('បូពា៌')).toBe('បូព៌ា')
    expect(reorder('បានេស្នី')).toBe('បានស្នើ')
    expect(reorder('្K្ក្េ')).toBe('្K្ក្េ')
    expect(reorder('្')).toBe('្')
    // ignore the zero width space separation
    expect(reorder('រ' + zwsp + 'ដ្ឋ' + zwsp + 'ាភិប' + zwsp + 'ាល')).toBe(
      'រ' + zwsp + 'ដ្ឋាភិបាល',
    )
    expect(reorder('េ្របី')).toBe('ប្រើ')

    expect(reorder('ប្បុ័ង')).toBe('ប្ប៉័ង')
    expect(reorder('ប្ប័ុង')).toBe('ប្ប៉័ង')

    expect(reorder('េសីុប')).toBe('ស៊ើប')
    expect(reorder('េបីុង')).toBe('ប៉ើង')
    expect(reorder('េសុីប')).toBe('ស៊ើប')

    expect(reorder('កំុេជា')).toBe('កុំជោ')
  })

  it('keeps two shifters as two clusters', () => {
    expect(reorder('៊៊')).toBe('៊៊')
  })

  it('keeps two signs as two clusters', () => {
    expect(reorder('ះះ')).toBe('ះះ')
  })

  it('handles cluster-splitting cases', () => {
    // two bases -> two clusters
    expect(reorder('កង')).toBe('កង')
    // two robats -> two clusters
    expect(reorder('៌៌')).toBe('៌៌')
    // two shifters -> two clusters
    expect(reorder('៉៊')).toBe('៉៊')
    // coeng ro belongs to the next cluster
    expect(reorder('ប្រក')).toBe('បក្រ')
    // two coengs: coeng ro is the second coeng
    expect(reorder('្រស្ត')).toBe('ស្ត្រ')
  })
})
