import { describe, expect, it } from 'vitest'
import {
  bytesToByteString,
  byteStringToBytes,
  canDecode,
  decodeCp1252,
  encodeCp1252,
  toCp1252Bytes,
} from '../src/cp1252.js'

const UNDEFINED_BYTES = new Set([0x81, 0x8d, 0x8f, 0x90, 0x9d])

describe('cp1252', () => {
  it('round-trips all 256 bytes', () => {
    const all = new Uint8Array(256)
    for (let i = 0; i < 256; i++) all[i] = i
    expect(encodeCp1252(decodeCp1252(all))).toEqual(all)
  })

  it('maps the 0x80-0x9F range to the standard cp1252 codepoints', () => {
    const expected: Record<number, number> = {
      0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x0192, 0x84: 0x201e, 0x85: 0x2026,
      0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02c6, 0x89: 0x2030, 0x8a: 0x0160,
      0x8b: 0x2039, 0x8c: 0x0152, 0x8e: 0x017d, 0x91: 0x2018, 0x92: 0x2019,
      0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
      0x98: 0x02dc, 0x99: 0x2122, 0x9a: 0x0161, 0x9b: 0x203a, 0x9c: 0x0153,
      0x9e: 0x017e, 0x9f: 0x0178,
    }
    for (let b = 0x80; b <= 0x9f; b++) {
      const cp = UNDEFINED_BYTES.has(b) ? b : expected[b]
      expect(decodeCp1252(new Uint8Array([b])).codePointAt(0)).toBe(cp)
    }
    // identity outside the C1 window
    expect(decodeCp1252(new Uint8Array([0x41]))).toBe('A')
    expect(decodeCp1252(new Uint8Array([0xe9]))).toBe('é')
  })

  it('decodes the C1 range specials', () => {
    expect(decodeCp1252(new Uint8Array([0x80]))).toBe('€')
    expect(decodeCp1252(new Uint8Array([0x91, 0x92]))).toBe('‘’')
    expect(decodeCp1252(new Uint8Array([0x9f]))).toBe('Ÿ')
  })

  it('drops unmappable characters on encode', () => {
    expect(encodeCp1252('aកb')).toEqual(Uint8Array.from([0x61, 0x62]))
  })

  it('converts utf-8 input to cp1252 bytes', () => {
    const input = new TextEncoder().encode('a’b')
    expect(toCp1252Bytes(input, 'utf-8')).toEqual(Uint8Array.from([0x61, 0x92, 0x62]))
  })

  it('converts latin1 input to cp1252 bytes, dropping undefined targets', () => {
    // latin1 0x92 is U+0092 which has no cp1252 encoding -> dropped
    expect(toCp1252Bytes(Uint8Array.from([0x41, 0x92, 0x42]), 'latin1')).toEqual(
      Uint8Array.from([0x41, 0x42]),
    )
    expect(toCp1252Bytes(Uint8Array.from([0x41, 0xe9]), 'iso-8859-1')).toEqual(
      Uint8Array.from([0x41, 0xe9]),
    )
  })

  it('passes cp1252 input through untouched', () => {
    const input = Uint8Array.from([0x00, 0x81, 0xff])
    expect(toCp1252Bytes(input, 'cp1252')).toBe(input)
  })

  it('byte string helpers round-trip and reject wide chars', () => {
    const bytes = Uint8Array.from([0, 0x7f, 0x80, 0xff])
    expect(byteStringToBytes(bytesToByteString(bytes))).toEqual(bytes)
    expect(() => byteStringToBytes('ក')).toThrow(RangeError)
  })

  it('canDecode accepts supported encodings case-insensitively', () => {
    expect(canDecode('CP1252')).toBe(true)
    expect(canDecode('UTF-8')).toBe(true)
    expect(canDecode('shift-jis')).toBe(false)
  })
})
