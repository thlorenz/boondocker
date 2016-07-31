'use strict'
const util = require('../lib/util')

const path = require('path')
const fs = require('fs')
const cheerio = require('cheerio')

const resultsPath = path.join(__dirname, 'results')

const campgroundsDataPath = path.join(resultsPath, 'data.raw.json')

if (!util.exists(campgroundsDataPath)) {
  console.error('Please run campgrounds.js first to generate the campground data')
  process.exit(1)
}

const facilities = require('../../alldata/facilities.json').RECDATA
const facilitiesbyOrgID = facilities
  .reduce(function reduceFacility(acc, val) {
    acc[val.OrgFacilityID] = val
    return acc
  }, {})

const campgrounds = require(campgroundsDataPath)
function fixLocations() {
  let fixedLocation = 0
  const missingLocation = campgrounds
    .filter(x => x.location.lat === null || x.location.lng === null)

  missingLocation
    .forEach(function fixLocation(x) {
      const f = facilitiesbyOrgID[x.recid]
      if (!f) return
      if (f.FacilityLatitude === '' || f.FacilityLongitude === '') return
      x.location.lat = f.FacilityLatitude
      x.location.lng = f.FacilityLongitude
      fixedLocation++
    })

  const missingURLS = missingLocation.map(x => x.url)

  console.log(missingURLS)
  console.log('From %d total %d were missing loation and %d were fixed from downloaded data', campgrounds.length, missingLocation.length, fixedLocation)
}

function withLocation(x) {
  return x.location.lat && x.location.lng
}

function getText(val) {
  if (!val) return ''
  return cheerio.load(val).root().text()
}

function addDetails(campgrounds) {
  campgrounds.forEach(function addDetail(x) {
    const f = facilitiesbyOrgID[x.recid]
    if (!f) return
    x.description = getText(f.FacilityDescription)
    x.directions = getText(f.FacilityDirections)
    x.fid = f.FacilityID
  })
}

fixLocations(campgrounds)
const validCampgrounds = campgrounds.filter(withLocation)
addDetails(validCampgrounds)

fs.writeFileSync(campgroundsDataPath, JSON.stringify(validCampgrounds, null, 2), 'utf8')
