// Translated from unicodeProcess.TestProcessing (modules/unicodeProcess.py).
import { describe, expect, it } from 'vitest'
import { type LegacyFontData, process } from '../src/unicodeProcess.js'

// mirrors the Python fixture; multi-byte keys sorted longest first
const data: LegacyFontData = {
  dict: [
    ['abcd', ''],
    ['12', '_'],
    ['b¤', 'ឬ'],
    ['B£', 'ឭ'],
    ['B¤', 'ឮ'],
  ],
  table: ['*', 'cbc', 'ក', 'កគ', ''],
}

const chr = String.fromCharCode

describe('unicodeProcess.process', () => {
  it('replaces single bytes through the table', () => {
    expect(process(chr(0), data)).toBe('*')
    expect(process(chr(1), data)).toBe('cbc')
    expect(process(chr(2), data)).toBe('ក')
    expect(process(chr(3), data)).toBe('កគ')
    expect(process(chr(4), data)).toBe('')
    expect(process(chr(3) + chr(0), data)).toBe('កគ*')
  })

  it('passes through bytes beyond the table', () => {
    expect(process(chr(255), data)).toBe(chr(255))
    expect(process(chr(data.table.length), data)).toBe(chr(data.table.length))
  })

  it('condenses multi-byte combinations', () => {
    expect(process('12', data)).toBe('_')
    expect(process('1212', data)).toBe('__')
    expect(process('12x12', data)).toBe('_x_')
    expect(process('b¤', data)).toBe('ឬ')
    expect(process('b¤B£B¤', data)).toBe('ឬឭឮ')
    expect(process('abcd', data)).toBe('')
  })
})
