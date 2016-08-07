'use strict'

const TESTING = require('./testing')
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
let currentMarker

domready(ondomready)

function ondomready() {
  content = document.getElementById('content')
  quickinfo = document.getElementById('quickinfo')
  quickinfo.addEventListener('click', onmarkerInfoClicked)
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
}

function updateQuickInfo(x) {
  const call = x.contact
    ? `<a class="call" href="tel:${x.contact}"><img src="img/call.png" alt="Call"></a>`
    : ''

  const web = x.url
    ? `<a class="web" href="${x.url}"><img src="img/website.png" alt="Goto Website"></a>`
    : ''

  quickinfo.innerHTML = `
    <div class="quickinfo-content">
      <span class="fee">$${x.fee}</span>
      <h4 class="title">${x.title}</h4>
      <a class="open" href="https://maps.google.com/maps?z=12&q=${x.lat}+${x.lng}&ll=${x.lat}+${x.lng}"><img src="img/gm.open.png" alt="Open in Google Maps"></a>
      <a class="directions" href="https://maps.google.com/?saddr=My%20Location&daddr=${x.lat},+${x.lng}"><img src="img/gm.directions.png" alt="Directions in Google Maps"></a>
      ${web}
      ${call}
    </div>`
  // TODO: supress all clicks from <a>s
  x.addInfo(quickinfo)
}

function onmarkerInfoClicked() {
  // toggle off if currently shown
  if (!content.classList.contains('hidden')) {
    content.classList.remove('visible')
    return content.classList.add('hidden')
  }
  const x = currentMarker
  const description = x.description
    ? `<h4>Description</h4><p>${x.description}<p>`
    : ''
  const directions = x.directions
    ? `<h4>Directions</h4><p>${x.directions}<p>`
    : ''
  content.innerHTML = `
    <div class="detail">
      ${description}
      ${directions}
    </div>
  `
  content.classList.remove('hidden')
  content.classList.add('visible')

  if (!TESTING) return
  content.innerHTML += '<h4>Details</h4>'
  content.appendChild(window.JsonHuman.format(getDetails(x.info)))
}

function matchingFilter() {
  return campsites.filter(x => x.feeCategory !== 'unknown')
}

function updateMarkers(bounds, map) {
  const inbounds = entitiesWithinBounds(bounds, matchingFilter())

  // TODO: proper message in UI
  if (inbounds.length > 1000) return console.error('Too many markers', inbounds.length)

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
  })
  map.init()
  map.on('idle', updateMap)
  map.on('zoom-changed', updateMap)
  map.on('marker-clicked', onmarkerClicked)
  map.on('marker-info-clicked', onmarkerInfoClicked)
}
window.initMap = initMap
