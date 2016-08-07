'use strict'

const decamelize = require('decamelize')
const amenities = [ 'tent', 'rv', 'tables', 'toilets', 'water', 'accessible', 'boat ramp', 'parking' ]
const percent = 100.0 / amenities.length
const cols = amenities.map(x => `<col width="${percent}%" />`).join('')

function renderSummaryKey(k) {
  const s = decamelize(k, ' ')
  return s[0].toUpperCase() + s.slice(1)
}

function renderSummary(summary) {
  if (!summary) return ''
  const rows = Object.keys(summary).reduce(onkey, '')
  function onkey(acc, k) {
    const val = summary[k]
    if (val === null) return acc
    return acc + `<tr><td>${renderSummaryKey(k)}</td><td>${val}</td></tr>`
  }

  return `
    <h4>Summary</h4>
    <table class="summary" cellspacing="0">
      ${rows}
    </table>
    `
}

function renderAmenities(xs, type) {
  // we can assume that tents are allowed if it's a campsite ;)
  if (type === 'camping') xs = xs.concat('tent')
  function toAmenityCell(html, x) {
    // signal missing anemity via lighter empty cell
    const clazz = ~xs.indexOf(x) ? '' : 'disabled'
    return html +
      `<td>
        <img class="${clazz}" src="img/amenities-${x.replace(/ /g, '-')}.png" alt="${x}"
      </td>`
  }

  const cells = amenities.reduce(toAmenityCell, '')

  return `
    <table class="amenities" cellspacing="0">
      ${cols}
      <tr>${cells}</tr>
    </table>
    `
}

module.exports = function details(info) {
  // TODO: do this during scraping step and make this a bit
  // less hacky and more deterministic ;)
  // fix the unknown spelling error during data analysis as well
  const type = (/cabin/i).test(info.title)
    ? 'cabin'
    : info.type === 'unkown'
      ? 'camping'
      : info.type
  return `
    ${renderAmenities(info.amenities || [], type)}
    ${renderSummary(info.summary || {})}
  `
}
