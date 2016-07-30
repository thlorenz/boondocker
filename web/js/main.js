'use strict'


const domready = require('domready')
const MyMap = require('./map/google-map')
const entitiesWithinBounds = require('./map/bounds').entitiesWithinBounds
const campsites = require('../../data/campsites.json')

let content

domready(ondomready)

function ondomready() {
  content = document.getElementById('content')
}

function onmarkerClicked(x) {
  content.innerHTML = `
    <h3>${x.name}</h3>
    <p>${x.id}</p>
    <p><em>(${x.lat}, ${x.lng})</em></p>

    <p>${x.description}<p>

    <h5>Website</h5>
    <a href="${x.link.url}">${x.link.title} (${x.link.provider})</a>
  `
}

function updateMarkers(bounds, map) {
  const inbounds = entitiesWithinBounds(bounds, campsites)

  // TODO: proper message in UI
  if (inbounds.length > 1000) return console.error('Too many markers', inbounds.length)

  inbounds
    .forEach(x => map.updateMarker({
        id       : x.id
      , position : { lat: x.latitude, lng: x.longitude }
      , type     : (x.legacyID || '').toString().toLowerCase()
      , price    : 'cheap'
      , info     : x
    }))
}

function updateMap() {
   const bounds = this.getBounds()
   updateMarkers(bounds, this)
}

function initMap() {
  const map = new MyMap({ getElement: () => document.getElementById('map') })
  map.init()
  map.on('idle', updateMap)
  map.on('zoom-changed', updateMap)
  map.on('marker-clicked', onmarkerClicked)
}
window.initMap = initMap
