// Translated 1:1 from the unittest suite in modules/legacyReorder.py —
// those assertions are the de-facto spec for the reordering behavior.
import { describe, expect, it } from 'vitest'
import { DOTCIRCLE, MARK, getCharClass, reorder } from '../src/legacyReorder.js'

// re-derive the class constants for the classification test
const _c1 = 1 | 0x01000000
const _sa = 9 | 0x04000000 | 0x00020000
const _vr = (8 | 0x00010000 | 0x04000000) | 0x02000000

describe('legacyReorder.getCharClass', () => {
  it('classifies characters correctly', () => {
    expect(getCharClass('᝿')).toBe(0)
    expect(getCharClass('ក')).toBe(_c1)
    expect(getCharClass('ថ')).toBe(_c1)
    expect(getCharClass('ហ')).toBe(_c1)
    expect(getCharClass('ឰ')).toBe(_c1)
    expect(getCharClass('ៀ')).toBe(_vr)
    expect(getCharClass('័')).toBe(_sa)
    expect(getCharClass('។')).toBe(0)
    expect(getCharClass('៿')).toBe(0)
  })

  it('rejects non-single-character input', () => {
    expect(() => getCharClass('KA')).toThrow(TypeError)
    expect(() => getCharClass(1 as unknown as string)).toThrow(TypeError)
  })
})

describe('legacyReorder.reorder', () => {
  it('reorders logical clusters into visual order', () => {
    // low vowel under coeng goes deeper
    expect(reorder('ខ្នុ')).toBe('ខ្ន' + MARK + 'ុ')
    expect(reorder('ត្រូ')).toBe('្រត' + MARK + 'ូ')
    expect(reorder('ព្យួ')).toBe('ព្យ' + MARK + 'ួ')
    // vowel under LA or NYO goes deeper
    expect(reorder('ឡូ')).toBe('ឡ' + MARK + 'ូ')
    expect(reorder('ញួ')).toBe('ញ' + MARK + 'ួ')
    // mark vowel after when there is coeng
    expect(reorder('ក្បៀ')).toBe('េក្ប' + MARK + 'ៀ')

    // coeng RO must be on the left side
    expect(reorder('ក្រ')).toBe('្រក')
    expect(reorder('ស្ត្រ')).toBe(MARK + '្រស្ត')
    // mark NYO when there is coeng
    expect(reorder('ញ្ជ')).toBe(MARK + 'ញ្ជ')
    // coeng NYO under NYO is marked
    expect(reorder('ញ្ញ')).toBe(MARK + 'ញ' + MARK + '្ញ')
    // coeng NYO under other is normal
    expect(reorder('ជ្ញ')).toBe('ជ្ញ')
    // coeng1 and coeng2, mark coeng2
    expect(reorder('ក្ស្ម')).toBe('ក្ស' + MARK + '្ម')

    // PA has no modification
    expect(reorder('ប៉')).toBe('ប៉')
    // special case BA TRIISAP, mark vowel above
    expect(reorder('ប៊ី')).toBe('ប៊' + MARK + 'ី')
    // base and shifter and vowel above, mark shifter
    expect(reorder('ប៉ី')).toBe('ប' + MARK + '៉ី')
    expect(reorder('ស៊ី')).toBe('ស' + MARK + '៊ី')
    // base and muusikatoan and samyok-sannya, mark shifter
    expect(reorder('នំប៉័ង')).toBe('នំប' + MARK + '៉' + '័ង')
    // shifter and sign above and vowel after, mark shifter
    expect(reorder('ស៊ាំ')).toBe('ស' + MARK + '៊' + 'ាំ')
    // shifter and sign above, mark sign
    expect(reorder('អ៊ំ')).toBe('អ៊' + MARK + 'ំ')
    // double-mark shifter when there is coeng and sign or vowel above
    expect(reorder('ប្ប៉័ង')).toBe('ប្ប' + MARK + MARK + '៉' + '័ង')

    // incomplete coeng is still kept
    expect(reorder('ក្')).toBe('ក្')
    expect(reorder('ក្ក្')).toBe('ក្ក' + MARK + '្')

    // render standalone vowel or sign with DOTCIRCLE
    expect(reorder('ា')).toBe(DOTCIRCLE + 'ា')
    expect(reorder('េ')).toBe('េ' + DOTCIRCLE)
    expect(reorder('ើ')).toBe('េ' + DOTCIRCLE + 'ី')
    expect(reorder('ំ')).toBe(DOTCIRCLE + 'ំ')
    expect(reorder('ោះ')).toBe('េ' + DOTCIRCLE + 'ា' + DOTCIRCLE + 'ះ')

    // shifter is after coeng
    expect(reorder('ន្ស៊ី')).toBe('ន្ស' + MARK + MARK + '៊ី')

    // special case BA and sra A, always next to each other
    expect(reorder('ប្រា')).toBe('្របា')
    expect(reorder('ប្ដា')).toBe('បា្ដ')
    expect(reorder('ប៉ា')).toBe('បា៉')
    expect(reorder('ប្រៅ')).toBe('េ្របៅ')
    expect(reorder('ប្ដៅ')).toBe('េបៅ្ដ')
    expect(reorder('ប៉ៅ')).toBe('េបៅ៉')
    // except when there is a coeng between them
    expect(reorder('ប្បា')).toBe('ប្បា')

    // simple rendering
    expect(reorder('គេ')).toBe('េគ')
    expect(reorder('គោ')).toBe('េគា')
    expect(reorder('កៅ')).toBe('េកៅ')
    expect(reorder('លើ')).toBe('េលី')
    expect(reorder('បៀ')).toBe('េបៀ')
    expect(reorder('តឿ')).toBe('េតឿ')
    expect(reorder('កាំ')).toBe('កាំ')
    // reorder of more than one cluster
    expect(reorder('កាប់គោ')).toBe('កាប់េគា')
    expect(reorder('ខាងលើ')).toBe('ខាងេលី')
    expect(reorder('ចំពោះ')).toBe('ចំេពាះ')
    // mixed with english text
    expect(reorder('កកុះwelcomeកុម្ភៈ')).toBe('កកុះwelcomeកុម្ភៈ')
    // two shifters or 3 vowels or 3 signs
    expect(reorder('៊៊')).toBe(DOTCIRCLE + '៊' + DOTCIRCLE + '៊')
    expect(reorder('ាិី')).toBe(DOTCIRCLE + 'ា' + DOTCIRCLE + 'ិ' + DOTCIRCLE + 'ី')
    expect(reorder('ំះ័')).toBe(DOTCIRCLE + 'ំ' + DOTCIRCLE + 'ះ' + DOTCIRCLE + '័')
    // muusikatoan not converted when vowel is not high
    expect(reorder('ម៉្ងៃ')).toBe('ៃម៉្ង')
    // two coengs with vowels placed left and right (some bigger than normal)
    expect(reorder('កញ្ច្រៀវ')).toBe('កេ' + MARK + '្រ' + MARK + 'ញ្ច' + MARK + 'ៀវ')
    expect(reorder('កញ្ច្រោង')).toBe('កេ' + MARK + '្រ' + MARK + 'ញ្ច' + MARK + 'ាង')
    // vowel under coeng goes one step deeper
    expect(reorder('ប្ដូ')).toBe('ប្ដ' + MARK + 'ូ')
    // don't break the sign
    expect(reorder('ចុះ')).toBe('ចុះ')
    expect(reorder('នុ៎ះ')).toBe('នុ៎ះ')
    // change sign OM, not shifter
    expect(reorder('អ៊ុំ')).toBe('អ៊ុ' + MARK + 'ំ')
    // this is two clusters
    expect(reorder('ាក')).toBe(DOTCIRCLE + 'ាក')
  })
})
