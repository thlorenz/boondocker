'use strict'

const nofee = [
    /^camping(?: fee)?[: ]+ (?:free|no fee|donations accepted)/i
  , /^(?:donation|donations) (?:tube|accepted)/i
  , /^(fee[s]? (?:are not presently required|are waived))/i
  , /^(?:there (?:are|is) no fee)/i
  , /^(?:not\sa|no)\sfee/i
  , /^(?:this is (?:a )?)?(?:free|no charge|no$|none|no fee|not a fee|no-fee|non-fee|no-charge|no services no fee|no (?:camping|site) fee|no-fee)/i
  , /^(?:no forest adventure pass|no passes or fees|permit required for overnight)/i
  , /^(?:campground - donations accepted|hiking is free|no however donations)/i
  , /^(?:\$0[.,0 ]*$)/i
  , /^included in (?:the )?(?:recreation area|day use) fee/i
  , /campground is a no fee area/i
  , /is a non-fee site/i
  , /Adventure Pass is not required/i
  , /at no fee/i
  , /price is a donation/i
  , /single sites - no fee/i
]

// from most specific to least
const feeTemplates = [
    '^$EOF'
  , '^$/vehicle/day'
  , '^$ camping fee'
  , '^$ single site'
  , '$ per campsite per night'
  , 'camping fees are $ for single nonelectric'
  , 'campsite without hookups: $'
  , '$/night (?:for single unit) (?:with no|without|w/no|w/out) electricity'
  , '$ per campsite per night'
  , '^$'
  , '$ to $ daily camping fee'
  , 'site[s]? / $ - overnight'
  , 'basic-service sites \\($'
  , 'camping[:]? single site/$'
  , '$\\/(?:for )?single (?:unit )?site'
  , '$(?:\/night)? for single unit'
  , '$\\/single'
  , '$ per night for single'
  , 'per night fee \\(?$\\)?'
  , 'per night per site fee[:]? $'
  , 'camping fee: single $'
  , '$ fee per site'
  , 'single site[.]+$'
  , 'single (?:sites )?- $ - overnight'
  , 'single unit[:]? $'
  , '$ per (?:camp)? site per night'
  , 'site fee (?:single family )? $'
  , 'single (?:camp)? site[s]?[:]? -? $'
  , '$ per site'
  , '$\\/vehicle\\/night'
  , '$-$\/night'
  , '$\/night'
  , '$ per night'
  , 'per night[:]? $'
  , '$ night'
  , '$ a night'
  , '$ (?:for a|per) single site'
  , '$\/site'
  , 'site[s]?[:]? -? $'
  , 'price per day[:]?$ camping'
  , '$ for single site[s]?'
  , '$ for campsite'
  , '$ per camp unit'
  , '$ for overnight camping'
  , 'camping (?:fee)?[:]? $'
  , 'campground (?:fee )? [-]? $'
  , 'campground[s]? [:] $ Single'
  , 'overnight camping fee of $'
  , 'tent sites .+? $'
  , 'non  electric is $'
  , '$/non electric'
  , '$ for nonelectric sites'
  , '$ for a single-family site'
  , '$ for primitive'
  , '$ per vehicle per night'
  , '$\/vehicle per day'
  , '$/vehicle/day'
  , '$ per vehicle per day'
  , '$ per (?:group )?site per night'
  , 'per vehicle rate[:]? $'
  , '$/first vehicle'
  , '$\/day'
  , '$ per day'
  , 'daily (?:usage fee |rate |fee )?[:]?(?: is)? $'
  , '$ reservation fee'
  , '$ (?:day use|dump station|per operator) fee'
  , '$ fee'
  , '(?:at|are) $ each'
  , 'camping fee = $'
  , 'campground = $ daily fee'
  , 'rent for $ each'
  , '$ for standard'
  , '$/premium campsite'
  , 'sunday-thursday--$'
  , '(?:site|group pad|group shelter|campground) [abcdefghij]? [:=]? $'
  , 'Group Fees [:]? $'
  , '1 (?:to|[-]) \\d+ people [-]? $'
  , '$ 1-50 (?:to|[-]) \\d+ people'
  , '(?:standard|campsite|camping) (?:fee)? is $'
  , 'per night per site .+ $'
  , 'vehicle fee of $'
  , 'dail[e]?y .+ fee [:]? $'
  , 'day[:]? $'
  , 'permit[s] (?:fee)? (?:is|are) $'
  , '$.+per night'
  // at this point take the first mention of an amount we can find
  , '__D__$'
]

const strict$ = '[$]([0-9]+(?:\\.[0-9]{1,2})?)'
const nonstrict$ = '[$]? ?([0-9]+(?:\\.[0-9]{1,2})?)[$]?'

const fee = feeTemplates
  .map(toRegex(strict$))
  .concat(
    feeTemplates
      .map(toRegex(nonstrict$))
  )

function inspect (obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 5, true))
}

inspect(fee)
function toRegex(money) {
  return function(s) {
    const r = s
      .replace(/ /g, '\\s*')
      .replace(/-/g, '[\s-]')
      .replace(/[$]/g, money)
      .replace(/EOF/, '$')
      .replace(/__D__/, '[$]')

    const regex = new RegExp(r, 'i')
    return regex
  }
}

module.exports = function extractFee(s) {
  var i
  if (!s) return null
  for (i = 0; i < nofee.length; i++) {
    const r = nofee[i]
    if (r.test(s)) return 0
  }
  for (i = 0; i < fee.length; i++) {
    const m = s.match(fee[i])
    if (m) return (m[1] | 0)

    // Adventure Pass = $5
    if ((/Adventure (?:or Interagency )?Pass.+(?:is|are) required/i).test(s)) return 5
    if ((/Adventure Pass required per vehicle per night/i).test(s)) return 5
    if ((/^Adventure Pass$/i).test(s)) return 5
  }
  return null
}

// Test
if (!module.parent && typeof window === 'undefined') {
  const util = require('../lib/util')
  const path = require('path')
  const resultsPath = path.join(__dirname, 'results')
  const campgroundsDataPath = path.join(resultsPath, 'data.raw.json')

  if (!util.exists(campgroundsDataPath)) {
    console.error('Please run campgrounds.js first to generate the campground data')
    process.exit(1)
  }
}
