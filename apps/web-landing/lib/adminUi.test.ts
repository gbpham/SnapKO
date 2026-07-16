import test from 'node:test'
import assert from 'node:assert/strict'

import { percentChange, revenueBarHeight } from './adminUi'

test('percentChange handles growth and an empty previous month', () => {
  assert.equal(percentChange(150, 100), 50)
  assert.equal(percentChange(0, 0), 0)
  assert.equal(percentChange(100, 0), 100)
})

test('revenueBarHeight clamps chart values and handles an empty series', () => {
  assert.equal(revenueBarHeight(50, 100), 50)
  assert.equal(revenueBarHeight(150, 100), 100)
  assert.equal(revenueBarHeight(10, 0), 0)
})
