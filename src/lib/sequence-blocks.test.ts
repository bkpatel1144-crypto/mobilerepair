import { describe, expect, it } from 'vitest'
import {
  BLOCK_SIZE,
  blockFromRange,
  blockRemaining,
  blockStorageKey,
  takeFromBlock,
  type SequenceBlock,
} from './sequence-blocks'

describe('blockFromRange', () => {
  it('spans `size` numbers inclusive and starts at the first', () => {
    expect(blockFromRange(41, 20)).toEqual({ from: 41, to: 60, next: 41 })
  })

  // The off-by-one that would hand the same number to two devices: if `to` were `from + size`,
  // device A's block would end on the number device B's block starts with.
  it('does not overlap the next block', () => {
    const a = blockFromRange(1, BLOCK_SIZE)
    const b = blockFromRange(a.to + 1, BLOCK_SIZE)
    expect(b.from).toBe(a.to + 1)
    expect(a.to).toBeLessThan(b.from)
  })
})

describe('blockRemaining', () => {
  it('counts what is left to issue', () => {
    expect(blockRemaining({ from: 1, to: 20, next: 1 })).toBe(20)
    expect(blockRemaining({ from: 1, to: 20, next: 20 })).toBe(1)
    expect(blockRemaining({ from: 1, to: 20, next: 21 })).toBe(0)
  })

  it('is zero, never negative, for a block already overrun', () => {
    expect(blockRemaining({ from: 1, to: 20, next: 99 })).toBe(0)
  })

  it('is zero when there is no block at all', () => {
    expect(blockRemaining(null)).toBe(0)
  })
})

describe('takeFromBlock', () => {
  it('issues numbers in order and advances the bookmark', () => {
    let block: SequenceBlock | null = blockFromRange(41, 3)
    const issued: number[] = []
    for (let i = 0; i < 3; i += 1) {
      const taken = takeFromBlock(block)
      expect(taken).not.toBeNull()
      issued.push(taken!.seq)
      block = taken!.block
    }
    expect(issued).toEqual([41, 42, 43])
  })

  // Every number in the block must be usable — a block of 20 that only yields 19 wastes one per
  // block forever.
  it('issues the last number in the block', () => {
    const taken = takeFromBlock({ from: 41, to: 41, next: 41 })
    expect(taken?.seq).toBe(41)
    expect(blockRemaining(taken!.block)).toBe(0)
  })

  it('refuses once the block is spent, rather than running past its end', () => {
    expect(takeFromBlock({ from: 41, to: 60, next: 61 })).toBeNull()
    expect(takeFromBlock(null)).toBeNull()
  })

  it('does not mutate the block it was given', () => {
    const block = blockFromRange(41, 5)
    takeFromBlock(block)
    expect(block.next).toBe(41)
  })
})

describe('blockStorageKey', () => {
  // Two companies in the same browser, and two document types in the same company, must never
  // share a block.
  it('is scoped to both the company and the document type', () => {
    expect(blockStorageKey('c1', 'jobCards')).not.toBe(blockStorageKey('c2', 'jobCards'))
    expect(blockStorageKey('c1', 'jobCards')).not.toBe(blockStorageKey('c1', 'receipts'))
  })
})

describe('two devices issuing from their own blocks', () => {
  // The property that makes this safe at all.
  it('never issue the same number', () => {
    let a: SequenceBlock | null = blockFromRange(1, BLOCK_SIZE)
    let b: SequenceBlock | null = blockFromRange(BLOCK_SIZE + 1, BLOCK_SIZE)
    const issued = new Set<number>()
    for (let i = 0; i < BLOCK_SIZE; i += 1) {
      const fromA: { seq: number; block: SequenceBlock } = takeFromBlock(a)!
      const fromB: { seq: number; block: SequenceBlock } = takeFromBlock(b)!
      expect(issued.has(fromA.seq)).toBe(false)
      expect(issued.has(fromB.seq)).toBe(false)
      issued.add(fromA.seq)
      issued.add(fromB.seq)
      a = fromA.block
      b = fromB.block
    }
    expect(issued.size).toBe(BLOCK_SIZE * 2)
  })
})
