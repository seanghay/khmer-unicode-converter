// CLI smoke tests (spawns the CLI via tsx so no build step is required).
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'

const CLI = fileURLToPath(new URL('../src/cli.ts', import.meta.url))
const TSX = fileURLToPath(new URL('../node_modules/.bin/tsx', import.meta.url))

function cli(args: string[], input?: string | Buffer): Buffer {
  return execFileSync(TSX, [CLI, ...args], { input })
}

const dir = mkdtempSync(join(tmpdir(), 'khmerconvert-'))
afterAll(() => rmSync(dir, { recursive: true, force: true }))

describe('khmerconvert CLI', () => {
  it('lists fonts', () => {
    const out = cli(['--list-fonts']).toString('utf-8')
    expect(out).toContain('abc-zwsp')
    expect(out).toContain('ABC-TEXT-05')
    expect(out).toContain('limon')
  })

  it('lists encodings', () => {
    const out = cli(['-c']).toString('utf-8')
    expect(out).toContain('cp1252')
    expect(out).toContain('utf-8')
  })

  it('converts legacy stdin to unicode stdout', () => {
    const out = cli(['-f', 'abc', '-'], 'kxK').toString('utf-8')
    expect(out).toBe('កខគ')
  })

  it('converts unicode stdin to legacy stdout', () => {
    const out = cli(['-o', '-f', 'abc', '-'], 'កខគ').toString('utf-8')
    expect(out).toBe('kxK')
  })

  it('converts files with a default output name', () => {
    const input = join(dir, 'legacy.txt')
    writeFileSync(input, 'kxK')
    cli(['-f', 'abc', input])
    expect(readFileSync(join(dir, 'converted-legacy.txt'), 'utf-8')).toBe('កខគ')
  })

  it('refuses to overwrite an existing output file', () => {
    const input = join(dir, 'in.txt')
    const output = join(dir, 'out.txt')
    writeFileSync(input, 'kxK')
    writeFileSync(output, 'occupied')
    expect(() => cli(['-f', 'abc', input, output])).toThrow()
    expect(readFileSync(output, 'utf-8')).toBe('occupied')
  })

  it('fails on unknown fonts and encodings', () => {
    expect(() => cli(['-f', 'nope', '-'], 'abc')).toThrow()
    expect(() => cli(['-e', 'shift-jis', '-'], 'abc')).toThrow()
  })
})
