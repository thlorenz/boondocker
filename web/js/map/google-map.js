'use strict'

/* global google */

const EventEmitter = require('events').EventEmitter
const getCurrentLatLng = require('./location').getCurrentLatLng
const util = require('../util')
const scaleFactor = util.isPhone() ? 2 : 1

const debug_marker_add = require('debug')('map:marker:add')
const debug_marker_rm = require('debug')('map:marker:rm')
const debug_marker_ref = require('debug')('map:marker:ref')

const icons = {
    blm : 'up-arrow'
  , fs  : 'down-arrow'
  , fws : 'circle'
  , nps : 'circle'
}

const prices = {
    free           : [ 'yellow', 'black' ]
  , supercheap     : [ 'orange', 'black' ]
  , cheap          : [ 'red', 'black' ]
  , normal         : [ 'blue', 'black' ]
  , expensive      : [ 'darkblue', 'transparent' ]
  , very_expensive : [ '#000033', 'transparent' ]
  , prohibitive    : [ 'darkgreen', 'transparent' ]
  , unknown        : [ 'white', 'transparent' ]
}

function saveWidget({ el, place }) {
  return new google.maps.SaveWidget(el, {
      place
    , attribution: {
          source: 'boondocker'
        , webUrl: 'https://thlorenz.com/boondocker/web/'
      }
  })
}

class GoogleMarker extends EventEmitter {
  constructor({ id, position, type, price, info, map }) {
    super()
    this.id       = id
    this.position = position
    this.type     = type
    this.price    = price
    this.info     = info
    this._map     = map
    this._currentScale = -1
    this._createMarker()
  }

  get title()       { return this.info.title }
  get lat()         { return this.position.lat }
  get lng()         { return this.position.lng }
  get contact()     { return this.info.contact }
  get description() { return this.info.summary.description }
  get directions()  { return this.info.summary.directions }
  get url()         { return this.info.url }
  get fee()         { return this.info.fee }

  removeFromMap() {
    this._marker.setMap(null)
  }

  updateMarkerIcon({ highlight, force } = {}) {
    const maps = google.maps
    // if scale didn't change there is no reason to update anything
    if (this._currentScale === this._map.scale && !force) return false
    this._currentScale = this._map.scale

    const icon = icons[this.type]
    const path =
        icon === 'up-arrow'   ? maps.SymbolPath.FORWARD_CLOSED_ARROW
      : icon === 'down-arrow' ? maps.SymbolPath.BACKWARD_CLOSED_ARROW
      : maps.SymbolPath.CIRCLE

    const color = prices[this.price] || [ 'transparent', 'transparent' ]

    this._marker.setIcon({
        path
      , scale        : highlight ? this._map.scale * 1.6 : this._map.scale
      , fillColor    : color[0]
      , fillOpacity  : 0.7
      , strokeColor  : color[1]
      , strokeWeight : 1
    })
    return true
  }

  addInfo(el) {
    this._saveWidget = saveWidget({ el, place: this._place })
  }

  unselect() {
    this.updateMarkerIcon({ highlight: false, force: true })
  }

  select() {
    this.updateMarkerIcon({ highlight: true, force: true })
  }

  _infoWindowContent() {
    return `
    <div class="info-window-content">
      <span class="fee">$${this.fee}</span>
      <h4 class="title">${this.title}</h4>
    </div>
    `
  }

  _createMarker() {
    const maps = google.maps
    this._place = {
        location : new maps.LatLng(this.position.lat, this.position.lng)
      , query    : this.title
    }
    this._marker = new maps.Marker({
        place: this._place
      , draggable : false
      , zIndex    : 1
    })
    maps.event.addListener(this._marker, 'click', () => this.emit('clicked'))
  }
}

const scaling = [
    0
  , 5   // 1
  , 5   // 2
  , 5   // 3
  , 5   // 4
  , 5   // 5
  , 5   // 6
  , 5   // 7
  , 6.5 // 8
  , 7   // 9
  , 8   // 10
  , 9   // 11
  , 10  // 12
  , 11  // 13
  , 12  // 14
  , 13  // 15
  , 14  // 16
  , 15  // 17
  , 16  // 18
  , 17  // 19
  , 18  // 20
]

/**
 * Represents the map interface.
 * Right now implemented with google maps under the hood, but the idea
 * is to be able to swap that implementation out with other map types in the future
 * and/or mocks for quicker testing.
 */
class GoogleMap extends EventEmitter {
  constructor({ getElement, getQuickinfo, zoom = 8 }) {
    super()
    this._getElement = getElement
    this._getQuickinfo = getQuickinfo
    this._zoom = zoom
    this._markers = new Map()
  }

  init() {
    getCurrentLatLng((err, latlng) => {
      if (err) return console.error(err)
      this._onlatlng(latlng)
    })
  }

  getBounds() {
    const ne = this._map.getBounds().getNorthEast()
    const sw = this._map.getBounds().getSouthWest()
    return { ne, sw }
  }

  clearMarkersExcept({ idsHash }) {
    Object.keys(this._markers)
      .forEach(k => {
        const marker = this._markers[k]
        if (idsHash[marker.id]) return
        // remove from map but keep the marker object around
        // which makes it faster to add it later .. good until we use up too much memory
        this.removeMarker(marker)
      })
  }

  updateMarker({ id, position, type, price, info }) {
    const existingMarker = this._markers[id]
    const marker = existingMarker ||
      new GoogleMarker({ id, position, type, price, info, map: this })

    marker.updateMarkerIcon()

    if (!existingMarker) {
      marker.on('clicked', () => this.emit('marker-clicked', marker))
      marker.on('info-clicked', () => this.emit('marker-info-clicked', marker))
      this._markers[id] = marker
    }
    // doesn't do anything if marker is already visible
    this.addMarker(marker)
  }

  addMarker(marker) {
    if (marker.visible) return
    marker._marker.setMap(this._map)
    marker.visible = true
    debug_marker_add(marker.id)
  }

  removeMarker(marker) {
    if (!marker.visible) return
    marker._marker.setMap(null)
    marker.visible = false
    debug_marker_rm(marker.id)
  }

  refreshMarker(marker) {
    marker._marker.setMap(null)
    marker._marker.setMap(this._map)
    marker.visible = true
    debug_marker_ref(marker.id)
  }

  get scale() {
    return scaling[this._map.getZoom()] * scaleFactor
  }

  _onmapIdle() {
    this.emit('idle')
  }
  _onzoomChanged() {
    this.emit('zoom-changed')
  }

  _onlatlng(latlng) {
    const maps = google.maps
    this._el = this._getElement()
    this._quickinfo = this._getQuickinfo()

    this._map = new maps.Map(this._el, {
        center                : latlng
      , scrollwheel           : true
      , zoom                  : this._zoom
      , streetViewControl     : false
      , mapTypeControlOptions : {
          mapTypeIds          : [ ]
      }
    })

    this._map.controls[maps.ControlPosition.TOP].push(this._quickinfo)

    this._map.addListener('idle', () => this._onmapIdle())
    this._map.addListener('zoom-changed', () => this._onzoomChanged())
    this.emit('initialized')
  }
}

module.exports = GoogleMap
