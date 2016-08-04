'use strict'

const test = require('tape')

function inspect(obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 5, true))
}

const fs = require('fs')
const path = require('path')
const fixturePath = path.join(__dirname, 'fixtures')
const extractFee = require('../process.extract-fee')

function readFees(name) {
  const feesNoFeePath = path.join(fixturePath, name)
  return fs.readFileSync(feesNoFeePath, 'utf8').split('\n').map(x => x.trim()).filter(x => x.length)
}

function processLine(l) {
  const fee = extractFee(l)
  return { raw: l, fee }
}

function getFiltered(results, fn) {
  return results
    .filter(fn)
    .reduce(function onraw(acc, x) { return acc.concat({ amt: x.fee, raw: x.raw }) }, [])
}

test('\nno fee sites', function(t) {
  const results = readFees('fees.no-fee.txt').map(processLine)
  const unhandled = getFiltered(results, x => x.fee === null)
  const incorrect = getFiltered(results, x => x.fee !== null && x.fee !== 0)
  if (unhandled.length) {
    console.log('Unhandled:')
    inspect(unhandled)
    t.fail('some non fee sites unhandled')
  } else {
    t.pass('all non fee sites handled')
  }
  if (incorrect.length) {
    console.log('Incorrect:')
    inspect(incorrect)
    t.fail('some non fee sites incorrect')
  } else {
    t.pass('all non fee sites correct')
  }
  t.end()
})

test('\nfee sites', function(t) {
  const results = readFees('fees.fee.txt').map(processLine)
  const unhandled = getFiltered(results, x => x.fee === null)
  const incorrect = getFiltered(results, x => x.fee === null || x.fee === 0)
  if (unhandled.length) {
    console.log('Unhandled:')
    inspect(unhandled)
    t.fail('some fee sites unhandled')
  } else {
    t.pass('all fee sites handled')
  }
  if (incorrect.length) {
    console.log('Incorrect:')
    inspect(incorrect)
    t.fail('some fee sites incorrect')
  } else {
    t.pass('all fee sites correct')
  }
  t.end()
})
