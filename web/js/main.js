'use strict'
/* global google */
const TESTING = true

let maps
let map
let marker
let lastinfowindow

const campsites = require('../../data/campsites.json')

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

function addInfoWindow(marker, message) {
  const infowindow = new google.maps.InfoWindow({
    content: message
  })

  function onmarkerClick() {
    if (lastinfowindow !== undefined) {
        lastinfowindow.close()
    }
    infowindow.open(map, marker)
    lastinfowindow = infowindow
  }

  google.maps.event.addListener(marker, 'click', onmarkerClick)
}

function addMarker(p, label, message) {
  marker = new maps.Marker({
      position  : new maps.LatLng(p.lat, p.lng)
    , draggable : true
    , zIndex    : 1000
    , label     : label || 'x'
    , map       : map
  })
  addInfoWindow(marker, message)
}

function getBounds(map) {
  const ne = map.getBounds().getNorthEast()
  const sw = map.getBounds().getSouthWest()
  return { ne, sw }
}

function facilitiesWithinBounds({ ne, sw }, facilities) {
  const minlat = sw.lat()
  const maxlat = ne.lat()
  const minlng = sw.lng()
  const maxlng = ne.lng()

  function withinBounds(f) {
    const lat = f.FacilityLatitude
    const lng = f.FacilityLongitude
    return minlat < lat && lat < maxlat
        && minlng < lng && lng < maxlng
  }
  console.log({ lat: { minlat, maxlat }, lng: { minlng, maxlng } })
  return facilities.filter(withinBounds)
}

function updateMarkers(bounds, map) {
  facilitiesWithinBounds(bounds, campsites)
    .forEach(x => addMarker({
        lat: x.FacilityLatitude
      , lng: x.FacilityLongitude }, '^', x.FacilityDescription))
}

function initMap() {
  maps = google.maps
  const MapTypeId = maps.MapTypeId

  getCurrentLatLng(onlatlng)

  function onlatlng(err, latlng) {
    if (err) return console.error(err)

    map = new maps.Map(document.getElementById('map'), {
        center: latlng
      , scrollwheel : true
      , zoom        : 12
      , mapTypeControlOptions: {
          mapTypeIds: [
            MapTypeId.ROADMAP
          , MapTypeId.SATELLITE
          , MapTypeId.HYBRID
          , MapTypeId.TERRAIN
        ]
      }
    })

    function onmapIdle() {
      const bounds = getBounds(map)
      updateMarkers(bounds, map)
    }

    addMarker(latlng, '.', 'you are here')
    map.addListener('idle', onmapIdle)
  }
}

window.initMap = initMap

/*
$.get("result.php?nelat=" + ne.lat() + "&nelng=" + ne.lng() + "&swlat=" + sw.lat() + "&swlng=" + sw.lng(), function(poi) {
  addMarkers(JSON.parse(poi))
})
*/
