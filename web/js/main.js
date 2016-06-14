'use strict'
/* global google */
const TESTING = true

window.initMap = initMap
let maps
let map
let marker

function getCurrentLatLng(cb) {
  if (TESTING) {
    return cb(null, {
        lat: 33.311654
      , lng: -108.884622
    })
  }
  if (!('geolocation' in navigator)) return cb(new Error('No geolocation support'))
  function onposition(p) {
    console.log(p)
    cb(null, { lat: p.coords.latitude, lng: p.coords.longitude })
  }
  navigator.geolocation.getCurrentPosition(onposition)
}

function addMarker(p, label) {
  marker = new maps.Marker({
      position  : new maps.LatLng(p.lat, p.lng)
    , draggable : true
    , zIndex    : 1000
    , label     : label || 'x'
    , map       : map
  })
  console.log(marker)
}

function initMap() {
  console.error(arguments)
  maps = google.maps
  const MapTypeId = maps.MapTypeId

  getCurrentLatLng(onlatlng)

  function onlatlng(err, latlng) {
    if (err) return console.error(err)

    map = new maps.Map(document.getElementById('map'), {
        center: latlng
      , scrollwheel : true,
        zoom        : 7
      , mapTypeControlOptions: {
          mapTypeIds: [
            MapTypeId.ROADMAP
          , MapTypeId.SATELLITE
          , MapTypeId.HYBRID
          , MapTypeId.TERRAIN
        ]
      }
    })
    addMarker(latlng, 'you are here')
    console.log(map)
  }
}
/*
 *
function initMap() {

    map.addListener('idle', function() {
        ne = map.getBounds().getNorthEast()
        sw = map.getBounds().getSouthWest()
        $.get("result.php?nelat=" + ne.lat() + "&nelng=" + ne.lng() + "&swlat=" + sw.lat() + "&swlng=" + sw.lng(), function(poi) {
            addMarkers(JSON.parse(poi))
        })
    })
}

*/
