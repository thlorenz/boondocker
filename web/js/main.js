'use strict'
/* global google */
const TESTING = true

let content
let maps
let map

const icons = {
    blm : 'arrow'
  , fs  : 'circle'
  , fws : 'circle'
  , nps : 'circle'
}

const prices = {
    free        : 'lightblue'
  , supercheap  : 'green'
  , cheap       : 'darkblue'
  , expensive   : 'red'
  , prohibitive : 'black'
}

const scaleZoom = [
    0
  , 1   // 1
  , 1   // 2
  , 1   // 3
  , 1   // 4
  , 1   // 5
  , 1   // 6
  , 2   // 7
  , 3.5 // 8
  , 4   // 9
  , 5   // 10
  , 6   // 11
  , 7   // 12
  , 8   // 13
  , 9   // 14
  , 10  // 15
  , 11  // 16
  , 12  // 17
  , 13  // 18
  , 14  // 19
  , 15  // 20
]

const campsites = require('../../data/campsites.json')

function scaleFromZoom(zoom) {
  return scaleZoom[zoom] || zoom
}

function getCurrentLatLng(cb) {
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

function markerIcon({ type, price, scale }) {
  const icon = icons[type]
  const path = icon === 'arrow'
    ? maps.SymbolPath.FORWARD_CLOSED_ARROW
    : maps.SymbolPath.CIRCLE
  const color = prices[price] || 'lightblue'

  return {
      path
    , scale
    , fillColor: color
    , fillOpacity: 0.6
    , strokeColor: color
    , strokeWeight: 1
  }
}

function registerContentUpdate(marker, x) {
  function onmarkerClick() {
    content.innerHTML = `
      <h3>${x.name}</h3>
      <p>${x.id}</p>
      <p><em>(${x.latitude}, ${x.longitude})</em></p>

      <p>${x.description}<p>

      <h5>Website</h5>
      <a href="${x.link.url}">${x.link.title} (${x.link.provider})</a>
    `
  }
  google.maps.event.addListener(marker, 'click', onmarkerClick)
}

function addMarker({ pos, label, message, type, scale, marker, data }) {
  marker = marker || new maps.Marker({
      position  : new maps.LatLng(pos.lat, pos.lng)
    , draggable : true
    , zIndex    : 1000
    , label     : label || ''
  })
  // the icon size adjusts depending on zoom
  marker.setIcon(markerIcon({ type, price: 'cheap', scale }))
  registerContentUpdate(marker, data)
  // force a marker refresh
  marker.setMap(null)
  marker.setMap(map)
  return marker
}

function getBounds(map) {
  const ne = map.getBounds().getNorthEast()
  const sw = map.getBounds().getSouthWest()
  return { ne, sw }
}

function entitiesWithinBounds({ ne, sw }, entities) {
  const minlat = sw.lat()
  const maxlat = ne.lat()
  const minlng = sw.lng()
  const maxlng = ne.lng()

  function withinBounds(e) {
    const lat = e.latitude
    const lng = e.longitude
    return minlat < lat && lat < maxlat
        && minlng < lng && lng < maxlng
  }
  return entities.filter(withinBounds)
}

function updateMarkers(bounds, map) {
  const scale = scaleFromZoom(map.getZoom())
  const inbounds = entitiesWithinBounds(bounds, campsites)

  // TODO: proper message in UI
  if (inbounds.length > 1000) return console.error('Too many markers', inbounds.length)

  inbounds
    .forEach(x => (x.marker = addMarker({
        pos: { lat: x.latitude, lng: x.longitude }
      , label: ''
      , type: (x.legacyID || '').toString().toLowerCase()
      , data: x
      , scale
      , marker: x.marker
    })))
}

function onzoomChanged() {
  const bounds = getBounds(map)
  updateMarkers(bounds, map)
}

function initMap() {
  content = document.getElementById('content')

  maps = google.maps
  window.maps = maps
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

    map.addListener('idle', onmapIdle)
    map.addListener('zoom_changed', onzoomChanged)
    window.map = map
  }
}

window.initMap = initMap
