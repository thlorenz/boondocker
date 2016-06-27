'use strict'

function inspect(obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 5, true))
}

const path = require('path')
const fs = require('fs')
const campsites_json = path.join(__dirname, '..', 'data', 'campsites.json')

const facilities = require('../alldata/facilities.json').RECDATA
const campingFacilities = facilities.filter(x =>
    (/Camp(ground|ing|site)/ig).test(x.FacilityName) ||
    (/Camp(ground|ing|site)/ig).test(x.FacilityDescription) ||
    (/Camp(ground|ing|site)/ig).test(x.FacilityTypeDescription)
)
console.log('Total Facilities: %d, identified campsites: %d', facilities.length, campingFacilities.length)

fs.writeFileSync(campsites_json, JSON.stringify(campingFacilities, null, 2))
