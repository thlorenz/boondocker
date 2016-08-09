'use strict'

const locations = {
    houston: [ 29.593211, -95.226382 ]
  , gila_nf: [ 33.311654,  -108.884622 ]
}

exports.getCurrentLatLng = function getCurrentLatLng(cb) {
  if (require('../testing')) {
    const loc = locations.houston
    return cb(null, { lat: loc[0], lng: loc[1] })
  }
  if (!('geolocation' in navigator)) return cb(new Error('No geolocation support'))
  function onposition(p) {
    cb(null, { lat: p.coords.latitude, lng: p.coords.longitude })
  }
  navigator.geolocation.getCurrentPosition(onposition)
}
