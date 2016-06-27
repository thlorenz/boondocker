'use strict'
/* global google */
const TESTING = true

let maps
let map
let marker
let lastinfowindow

let icons
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

function markerIcon(type) {
  const icon = icons[type] || icons.alt
  return icon
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

function addMarker(p, label, message, type) {
  marker = new maps.Marker({
      position  : new maps.LatLng(p.lat, p.lng)
    , draggable : true
    , zIndex    : 1000
    , label     : label || 'x'
    , map       : map
  })
  addInfoWindow(marker, message)
  marker.setIcon(markerIcon(type))
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
  return facilities.filter(withinBounds)
}

function description(x) {
  return `
    (${x.FacilityLatitude}, ${x.FacilityLongitude}) - ${x.LegacyFacilityID}

    ${x.FacilityDescription}
  `
}

function updateMarkers(bounds, map) {
  facilitiesWithinBounds(bounds, campsites)
    .forEach(x => addMarker(
        { lat: x.FacilityLatitude, lng: x.FacilityLongitude }
      , '^'
      , description(x)
      , (x.LegacyFacilityID || '').toString().toLowerCase()
    ))
}

function initMap() {
  maps = google.maps
  const MapTypeId = maps.MapTypeId
  icons = {
      blm : { url: 'img/blm.png', scaledSize: new maps.Size(20, 20) }
    , fs  : { url: 'img/fs.png', scaledSize: new maps.Size(20, 20) }
    , fws : { url: 'img/fws.png', scaledSize: new maps.Size(25, 25) }
    , nps : { url: 'img/nps.png', scaledSize: new maps.Size(25, 25) }
    , alt : { url: 'img/camping.png', scaledSize: new maps.Size(25, 25) }
  }

  getCurrentLatLng(onlatlng)

  function onlatlng(err, latlng) {
    if (err) return console.error(err)

    map = new maps.Map(document.getElementById('map'), {
        center: latlng
      , scrollwheel : true
      , zoom        : 8
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
