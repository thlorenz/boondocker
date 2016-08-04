'use strict'

const util = require('../lib/util')
const path = require('path')
const fs = require('fs')
const resultsPath = path.join(__dirname, 'results')
const fixturesPath = path.join(__dirname, 'test', 'fixtures')

const extract = require('./process.extract-fee')
const exec = require('child_process').execSync

const campgroundsDataPath = path.join(resultsPath, 'data.raw.json')

if (!util.exists(campgroundsDataPath)) {
  console.error('Please run campgrounds.js first to generate the campground data')
  process.exit(1)
}

function cleanText(t) {
  if (!t) return null
  return t.replace(/[\r\n\t]+/g, ' | ')
}

function createFeeVariations() {
  const sites = require(campgroundsDataPath)
  const fees = sites.map(function mapFee(x) {
    const feesRaw = x.glance.fees || ''
    const fees = { url: x.url, fees: cleanText(feesRaw) }
    if (x.glance.permitInfo) {
      fees.permit = cleanText(x.glance.permitInfo)
    }
    return fees
  })

  const feeVariationsHash = fees
    .reduce(function onfee(acc, f) {
      if (!f.fees) return acc
      const k = f.fees.toLowerCase().trim()
          .replace(/\[.,]+$/, '')
          .replace(/^[$]\d+(\.\d+)*/g, '\$99')
      acc[k] = true
      return acc
    }, {})

  const feeVariations = Object.keys(feeVariationsHash).sort()

  const result = { fees, variations: feeVariations }
  fs.writeFileSync(path.join(resultsPath, 'fees.json'), JSON.stringify(result, null, 2), 'utf8')
}

// requires extractFee to return the entire match instead of match[1]
function runWithFees() {
  exec(`mkdir -p ${__dirname}/test/tmp`)
  exec(`cd ${__dirname}/test/tmp  && ln -sF ${__dirname}/../../web/deps`)

  const fees = fs.readFileSync(path.join(fixturesPath, 'fees.fee.txt'), 'utf8')
    .split('\n').map(x => x.trim()).filter(x => x.length)

  const all = fees.map(x => ({ res: extract(x), text: x }))
  const matched = all.filter(x => x.res).map(highlight)
  const unmatched = all.filter(x => !x.res).map(x => x.text).reverse()

  function highlight(x) {
    return { res: x.res[1], text: x.text.replace(x.res[0], '__' + x.res[0] + '__') }
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset=utf-8 />
      <title>Boondocker </title>
      <script src="deps/json-human/crel.js"></script>
      <script src="deps/json-human/json.human.js"></script>
      <link rel="stylesheet" href="deps/json-human/json.human.css" type="text/css" media="screen" charset="utf-8">
      <style>
      .jh-type-string {
        font-style: normal;
        color: #111;
        margin: 5px;
      }
      .jh-value {
        padding: 8px 5px 8px 5px;
      }
      </style>
    </head>
    <body>
      <h2>Counts</h2>
      <div>
        <p>Matched: ${matched.length}</p>
        <p>Unmatched: ${unmatched.length}</p>
      </div>
      <h2>Unmatched</h2>
      <div id="unmatched"></div>
      <h2>Matched</h2>
      <div id="matched"></div>
    </body>
    <script>
      document.getElementById('matched').innerHTML = '<div>Count: ${matched.length}</div>'
      document.getElementById('matched').appendChild(window.JsonHuman.format(${JSON.stringify(matched)}))
      document.getElementById('unmatched').appendChild(window.JsonHuman.format(${JSON.stringify(unmatched)}))
    </script>
    </html>
  `
  fs.writeFileSync(`${__dirname}/test/tmp/fees.html`, html, 'utf8')
}
