'use strict'

// Examine data overlap between scraped data and data downloaded from https://ridb.recreation.gov/index.cfm

const util = require('../lib/util')

const path = require('path')

const resultsPath = path.join(__dirname, 'results')
const campground_linksPath = path.join(resultsPath, 'campground-links.json')

if (!util.exists(campground_linksPath)) {
  console.error('Please run sitemap.js first to generate the campground links')
  process.exit(1)
}

const facilities = require('../../alldata/facilities.json').RECDATA
const facilitiesbyOrgID = facilities
  .reduce(function reduceFacility(acc, val) {
    acc[val.OrgFacilityID] = val
    return acc
  }, {})

const matched = []
const unmatched = []

const links = require(campground_linksPath)
links.forEach(processLink)

console.log(unmatched)
console.log({ matched: matched.length, unmatched: unmatched.length })

function processLink(url) {
  if (!url) return
  const recidMatch = url.match(/recid=(\d+)/)
  const actidMatch = url.match(/actid=(\d+)/)
  // only process links with both recid and actid as others aren't campgrounds
  if (!recidMatch || !actidMatch) return
  const recid = recidMatch[1]
  if (facilitiesbyOrgID[recid]) matched.push(url)
  else unmatched.push(url)
}
