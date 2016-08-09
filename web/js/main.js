'use strict'

const TESTING = require('./testing')
const util = require('./util')
const details = require('./details')

/* global localStorage */
localStorage.debug = null // 'map:marker:r*'

const domready = require('domready')
const MyMap = require('./map/google-map')
const entitiesWithinBounds = require('./map/bounds').entitiesWithinBounds
const campsites = require('boondocker.fs-usda-ridb')

/*
 * Diagnostices
 */
const info = {
    platform: navigator.platform
  , userAgent: navigator.userAgent
}
console.log(info)

util.addToHomeScreen()

/*
 * Price Map
 */
function makeRangeFn(r) {
  return x => x.fee !== null && r[0] < x.fee && x.fee <= r[1]
}

function attachRangeFn(x) {
  x.rangeFn = makeRangeFn(x.range)
  return x
}

/* eslint-disable comma-spacing */
const priceMap = [
    { category: 'free'          , range: [ -1, 0 ] }
  , { category: 'supercheap'    , range: [ 0, 5 ] }
  , { category: 'cheap'         , range: [ 5, 10 ] }
  , { category: 'normal'        , range: [ 10, 15 ] }
  , { category: 'expensive'     , range: [ 15, 20 ] }
  , { category: 'very_expensive', range: [ 20, 30 ] }
  , { category: 'prohibitive'   , range: [ 30, Infinity ] }
].map(attachRangeFn)
/* eslint-enable comma-spacing */

/*
 * Attach Category
 */
campsites.forEach(attachFeeCategory)
function attachFeeCategory(x) {
  if (x.fee === null) {
    x.feeCategory = 'unknown'
    return
  }

  for (var i = 0; i < priceMap.length; i++) {
    const val = priceMap[i]
    if (val.rangeFn(x)) {
      x.feeCategory = val.category
      break
    }
  }
}

let content
let quickinfo
let openGoogleMaps
let currentMarker

domready(ondomready)

function ondomready() {
  content = document.getElementById('content')
  quickinfo = document.getElementById('quickinfo')
  quickinfo.addEventListener('click', onmarkerInfoClicked)
  openGoogleMaps = document.getElementById('open-googlemaps')
}

function getDetails(info) {
  const details = Object.keys(info)
    .reduce((acc, x) => { acc[x] = info[x]; return acc }, {})
  details.summary = Object.keys(details.summary)
    .filter(x => x !== 'description' && x !== 'directions')
    .reduce((acc, x) => { acc[x] = details.summary[x]; return acc }, {})
  return details
}

function onmarkerClicked(x) {
  if (currentMarker) currentMarker.unselect()
  x.select()
  currentMarker = x
  updateQuickInfo(x)
  updateOpenGoogleMaps(x)
}

function updateQuickInfo(x) {
  quickinfo.innerHTML = `
    <div class="quickinfo-content">
      <span class="fee">$${x.fee}</span>
      <h4 class="title">${x.title}</h4>
    </div>`
  // TODO: supress all clicks from <a>s
  x.addInfo(quickinfo)
}

function renderOpenGoogleMaps(x) {
  return `
    <a class="open unselectable" href="https://maps.google.com/maps?z=8&q=${x.lat}+${x.lng}&ll=${x.lat}+${x.lng}" target="_blank">
      <img src="img/gm.open.png" alt="Open in Google Maps">
    </a>
    <a class="directions unselectable" href="https://maps.google.com/?saddr=My%20Location&daddr=${x.lat},+${x.lng}" target="_blank">
      <img src="img/gm.directions.png" alt="Directions in Google Maps">
    </a>
  `
}

function updateOpenGoogleMaps(x) {
  openGoogleMaps.innerHTML = renderOpenGoogleMaps(x)
}

function onmarkerInfoClicked() {
  // toggle off if currently shown
  if (!content.classList.contains('hidden')) {
    content.classList.remove('visible')
    return content.classList.add('hidden')
  }
  const x = currentMarker

  const call = x.contact
    ? `<a class="call unselectable" href="tel:${x.contact}"><img src="img/call.png" alt="Call"></a>`
    : ''
  const web = x.url
    ? `<a class="web unselectable" href="${x.url}" target="_blank"><img src="img/website.png" alt="Goto Website"></a>`
    : ''
  content.innerHTML = `
    <div class="detail">
      ${details.renderAmenities(x.info)}
      <div class="links">
        ${web}
        ${call}
        ${renderOpenGoogleMaps(x)}
      </div>
      ${details.renderSummary(x.info)}
    </div>
  `
  content.classList.remove('hidden')
  content.classList.add('visible')

  if (!TESTING || true) return
  content.innerHTML += '<h4>Details</h4>'
  content.appendChild(window.JsonHuman.format(getDetails(x.info)))
}

function matchingFilter() {
  return campsites.filter(x => x.feeCategory !== 'unknown')
}

let showingTooManyWarning = false
let quickinfoBefore = ''
function updateMarkers(bounds, map) {
  const inbounds = entitiesWithinBounds(bounds, matchingFilter())

  if (inbounds.length > 400) {
    if (!showingTooManyWarning) quickinfoBefore = quickinfo.innerHTML
    quickinfo.innerHTML = `
      <h2>Too many campsites (${inbounds.length}) within this area</h2>
      <h3><em>Please zoom in further</em></h3>
    `
    showingTooManyWarning = true
    map.clearMarkersExcept({ idsHash: {} })
    return
  }

  if (showingTooManyWarning) {
    quickinfo.innerHTML = quickinfoBefore
    showingTooManyWarning = false
  }

  function onmarker(acc, x) {
    acc[x.uid] = true
    return acc
  }

  map.clearMarkersExcept({
    idsHash: inbounds.reduce(onmarker, {})
  })

  inbounds
    .forEach(x => map.updateMarker({
        id       : x.uid
      , position : x.location
      , type     : x.type
      , price    : x.feeCategory
      , info     : x
    }))
}

function updateMap() {
   const bounds = this.getBounds()
   updateMarkers(bounds, this)
}

function initMap() {
  const map = new MyMap({
      getElement: () => document.getElementById('map')
    , getQuickinfo: () => document.getElementById('quickinfo')
    , getOpenGoogleMaps: () => document.getElementById('open-googlemaps')
    , getMyLocation: () => document.getElementById('mylocation')
  })
  map.init()
  map.on('idle', updateMap)
  map.on('zoom-changed', updateMap)
  map.on('marker-clicked', onmarkerClicked)
  map.on('marker-info-clicked', onmarkerInfoClicked)
}
window.initMap = initMap
