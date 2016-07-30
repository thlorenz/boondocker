'use strict'

function inspect(obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 5, true))
}

const path = require('path')
const fs = require('fs')
const campsites_json = path.join(__dirname, '..', 'data', 'campsites.json')

const facilities = require('../alldata/facilities.json').RECDATA
const links = require('../alldata/links.json').RECDATA

function byEntityID(acc, x) {
  acc[x.EntityID] = x
  return acc
}
const linksByEntityID = links.reduce(byEntityID, {})

function addLink(x) {
  const link = linksByEntityID[x.id] || {}
  x.link = {
      title: link.Title || null
    , url: link.URL || null
    , type: link.LinkType || null
    , provider: /www\.fs\.usda\.gov/.test(link.URL) ? 'fs.usda' : 'unknown'
  }
}

const campingFacilities = facilities
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
campingFacilities.forEach(addLink)

const processLinks = campingFacilities.filter(x => x.link.provider === 'fs.usda')
console.log('Total Facilities: %d, identified campsites: %d, will process %d fs.usda links', facilities.length, campingFacilities.length, processLinks.length)

fs.writeFileSync(campsites_json, JSON.stringify(campingFacilities, null, 2))
