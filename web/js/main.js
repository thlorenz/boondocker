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

domready(ondomready)

function ondomready() {
  content = document.getElementById('content')
  content.innerHTML = info.platform + ' | ' + info.userAgent
  quickinfo = document.getElementById('quickinfo')
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
  updateQuickInfo(x)
}

function updateQuickInfo(x) {
  quickinfo.innerHTML = `
    <div class="quickinfo-content">
      <span class="fee">$${x.fee}</span>
      <h4 class="title">${x.title}</h4>
    </div>`
  x.addInfo(quickinfo)
}

function onmarkerInfoClicked(x) {
  const googleSearch = x.title
    ? `<li><a href="https://www.google.com/search?q=${x.title.replace(/ /g, '+')}">Search Google</a></li>`
    : ''
  const call = x.contact
    ? `<li><a href="callto:${x.contact}">${x.contact}</a></li>`
    : ''

  content.innerHTML = `
    <div class="detail">
      <h3>${x.title}</h3>

      <p>${x.description}<p>

      <h4>Directions</h4>
      <p>${x.directions}</p>

      <h4>Links</h4>
      <ul class="detail-links">
        <li><a href="https://maps.google.com/maps?z=12&q=${x.lat}+${x.lng}&ll=${x.lat}+${x.lng}">View in Google Maps</a></li>
        <li><a href="https://maps.google.com/?saddr=My%20Location&daddr=${x.lat},+${x.lng}">Driving Directions</a></li>
        ${googleSearch}
        ${call}
        <li><a href="${x.url}">${x.title}</a></li>
      </ul>
    </div>
  `

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
