'use strict'

const util = require('../lib/util')
const path = require('path')
const fs = require('fs')
const cheerio = require('cheerio')
const resultsPath = path.join(__dirname, 'results')
const extractFee = require('./process.extract-fee')
const campgroundsDataPath = path.join(resultsPath, 'data.raw.json')
const campgroundsProcessedDataPath = path.join(resultsPath, 'data.processed.json')

if (!util.exists(campgroundsDataPath)) {
  console.error('Please run campgrounds.js first to generate the campground data')
  process.exit(1)
}

const phoneRegex = /(?:\+?1[-. ]?)?(?:\(?([0-9]{3})\)?[-. ]?)?([0-9]{3})[-. ]?([0-9]{4})/
const amenitiesMap = {
    'accessible'        : 'accessible'
  , 'tent camping'      : 'tent'
  , 'camping trailer'   : 'rv'
  , 'picnic tables'     : 'tables'
  , 'toilets'           : 'toilets'
  , 'drinking  water'   : 'water'
  , 'boat ramp'         : 'boat ramp'
  , 'parking'           : 'parking'
  , 'interpretive site' : 'interpretive site'
}

const facilities = require('../../alldata/facilities.json').RECDATA
const facilitiesbyOrgID = facilities
  .reduce(function reduceFacility(acc, val) {
    acc[val.OrgFacilityID] = val
    return acc
  }, {})

const raw = require(campgroundsDataPath)
const processed = raw.map(processCampground).filter(x => x)
const processedByRecid = processed
  .reduce(function byRecID(acc, x) {
    acc[x.recid] = x
    return acc
  }, {})

getCampingFacilities(facilities)
  .filter(x => typeof x.orgID !== 'string' || !x.orgID.trim().length || !processedByRecid[x.orgID])
  .forEach(addFacility)

const withLocation = processed.filter(hasLocation)

fs.writeFileSync(campgroundsProcessedDataPath, JSON.stringify(withLocation, null, 2), 'utf8')

function getText(val) {
  if (!val) return ''
  return cheerio.load(val).root().text()
}

function toCleanText(html) {
  if (!html) return ''
  return getText(html)
    .trim(/[\t',]/)
    .replace(/[\n\r\t']+/g, ' | ')
    .replace(/[\s]+/g, ' ')
}

function extractAmenities(x) {
  if (!x) return []
  return x.toLowerCase()
    .split(/,/g)
    .map(x => amenitiesMap[x])
    .filter(x => x)
    .sort()
}

/*
 * Meaning of actid
 *  - Campground Camping 29
 *  - Dispersed Camping  34
 *  - Group Camping      33
 *  - RV Camping         31
 *  - Cabin Rentals      101 (ignored for now)
 */
function extractType(actids) {
  actids = actids.map(parseInt)
  if (~actids.indexOf(31) || ~actids.indexOf(29)) return 'camping'
  // only listed as dispersed, but not as camping or rv
  if (~actids.indexOf(34)) return 'dispersed'
  if (~actids.indexOf(101)) return 'cabin'
  return 'unkown'
}

function extractPhoneNumber(phonenum) {
  phonenum = '' + phonenum
  if (!phonenum) return null
  if (!phonenum.trim()) return null
  const match = phonenum.match(phoneRegex)
  if (!match) return null
  var phone = ''
  if (match[1]) {
    phone += '+1 (' + match[1] + ') '
  }
  phone += match[2] + '-' + match[3]
  return phone
}

function getCampingFacilities(facilities) {
  return facilities
    .filter(x =>
        (/Camp(ground|ing|site)/ig).test(x.FacilityName) ||
        (/Camp(ground|ing|site)/ig).test(x.FacilityDescription) ||
        (/Camp(ground|ing|site)/ig).test(x.FacilityTypeDescription)
    ).map(x => ({
        email             : x.FacilityEmail
      , longitude         : x.FacilityLongitude
      , description       : x.FacilityDescription
      , latitude          : x.FacilityLatitude
      , typeDescription   : x.FacilityTypeDescription
      , phone             : x.FacilityPhone
      , mapURL            : x.FacilityMapURL
      , reservationURL    : x.FacilityReservationURL
      , directions        : x.FacilityDirections
      , name              : x.FacilityName
      , keywords          : x.Keywords
      , useFeeDescription : x.FacilityUseFeeDescription
      , stayLimit         : x.StayLimit
      , lastUpdatedDate   : x.LastUpdatedDate
      , ADAAccess         : x.FacilityADAAccess
      , legacyID          : x.LegacyFacilityID
      , orgID             : x.OrgFacilityID
      , id                : x.FacilityID
    }))
}

function detectLand(x, id) {
  if (/blm/i.test(id)) return 'blm'
  if (/fs.usda/i.test(x.url)) return 'fs.usda'
  return (typeof id === 'string' && id.trim().length && id.toLowerCase()) || 'n/a'
}

function addFacility(x) {
  const recid = validNumber(x.orgID)
  const location = {
      lat : validNumber(x.latitude)
    , lng : validNumber(x.longitude)
  }
  if (!hasLocation({ location })) return
  const info = {
      recid       : recid
    , title       : x.name
    , url         : x.link && x.link.url
    , location    : location
    , description : x.description
    , directions  : x.directions
    , contact     : x.phone
    , glance: {
        fees          : x.useFeeDescription
      , areaAmenities : null
      , restrictions  : x.stayLimit
      }
  }
  const extra = {
      land : detectLand(info, x.legacyID)
    , type : 'camping'
    , uid  : x.legacyID + '-' + x.id
  }
  processed.push(processCampground(info, extra))
}

function validNumber(s) {
  if (typeof s === 'string') {
    const n = parseFloat(s)
    if (!isNaN(n)) return n
    return null
  }
  return (!isNaN(s)) ? s : null
}

function hasLocation(x) {
  return x.location.lat !== null && x.location.lng !== null
}

function processCampground(x, { land = 'fs.usda', type, uid }) {
  const feeStr = toCleanText(x.glance.fees)
  const res = {
      recid     : x.recid
    , type      : type || extractType(x.actids)
    , land      : land
    , uid       : uid || land + '-' + x.recid
    , title     : x.title
    , fee       : extractFee(feeStr)
    , url       : x.url
    , amenities : extractAmenities(x.glance.areaAmenities)
    , location  : x.location
    , summary   : {
        fees         : feeStr
      , restrictions : toCleanText(x.glance.restrictions)
      , closestTowns : toCleanText(x.glance.closestTowns)
      , openSeason   : toCleanText(x.glance.openSeason)
      , water        : toCleanText(x.glance.water)
      , restroom     : toCleanText(x.glance.restroom)
      , description  : toCleanText(x.description)
      , directions   : toCleanText(x.directions)
    }
  }
  const f = facilitiesbyOrgID[x.recid]
  if (f) {
    res.summary.description = res.summary.description || getText(f.FacilityDescription)
    res.summary.directions = res.summary.directions || getText(f.FacilityDirections)
    res.contact = extractPhoneNumber(f.FacilityPhone)
    if (res.location.lat === null || res.location.lng === null) {
      res.location.lat = validNumber(f.FacilityLatitude)
      res.location.lng = validNumber(f.FacilityLongitude)
    }
  }
  res.contact = res.contact || extractPhoneNumber(x.contact)
  return res
}
