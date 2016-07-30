'use strict'

const TESTING = require('./testing')
const domready = require('domready')
const MyMap = require('./map/google-map')
const entitiesWithinBounds = require('./map/bounds').entitiesWithinBounds
const campsites = require('../../data/campsites.json')

let content

domready(ondomready)

function ondomready() {
  content = document.getElementById('content')
}

function getDetails(info) {
  return Object.keys(info)
    .filter(x => x !== 'description' && x !== 'directions' && x !== 'name')
    .reduce((acc, x) => { acc[x] = info[x]; return acc }, {})
}

function onmarkerClicked(x) {
  const googleSearch = x.name
    ? `<li><a href="https://www.google.com/search?q=${x.name.replace(/ /g, '+')}">Search Google</a></li>`
    : ''

  content.innerHTML = `
    <div class="detail">
      <h3>${x.name}</h3>

      <p>${x.description}<p>

      <h4>Directions</h4>
      <p>${x.directions}</p>

      <h4>Links</h4>
      <ul class="detail-links">
        <li><a href="https://maps.google.com/maps?z=12&q=${x.lat}+${x.lng}&ll=${x.lat}+${x.lng}">View in Google Maps</a></li>
        <li><a href="https://maps.google.com/?saddr=My%20Location&daddr=${x.lat},+${x.lng}">Driving Directions</a></li>
        ${googleSearch}
        <li><a href="${x.link.url}">${x.link.title} (${x.link.provider})</a></li>
      </ul>
    </div>
  `

  if (!TESTING) return
  content.innerHTML += '<h4>Details</h4>'
  content.appendChild(window.JsonHuman.format(getDetails(x.info)))
}

const providers = {
  'fs.usda': 'fs'
}
function typeFromProvider(p) {
  return providers[p]
}

function getType(x) {
  if (x.legacyID) return x.legacyID.toString().toLowerCase()
  const provider = x.link && x.link.provider
  if (provider) return typeFromProvider(provider)
  return 'unknown'
}

function updateMarkers(bounds, map) {
  const inbounds = entitiesWithinBounds(bounds, campsites)

  // TODO: proper message in UI
  if (inbounds.length > 1000) return console.error('Too many markers', inbounds.length)

  inbounds
    .forEach(x => map.updateMarker({
        id       : x.id
      , position : { lat: x.latitude, lng: x.longitude }
      , type     : getType(x)
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
