'use strict'

const TESTING = true

exports.getCurrentLatLng = function getCurrentLatLng(cb) {
  if (TESTING) {
    return cb(null, {
        lat: 33.311654
      , lng: -108.884622
    })
  }
  if (!('geolocation' in navigator)) return cb(new Error('No geolocation support'))
  function onposition(p) {
    cb(null, { lat: p.coords.latitude, lng: p.coords.longitude })
  }
  navigator.geolocation.getCurrentPosition(onposition)
}
