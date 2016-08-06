'use strict'

/* global google */

const EventEmitter = require('events').EventEmitter
const getCurrentLatLng = require('./location').getCurrentLatLng
const util = require('../util')
const scaleFactor = util.isPhone() ? 2 : 1

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

class GoogleMarker extends EventEmitter {
  constructor({ id, position, type, price, info, map }) {
    super()
    this.id       = id
    this.position = position
    this.type     = type
    this.price    = price
    this.info     = info
    this._map     = map
    this._createMarker()
  }

  get title()       { return this.info.title }
  get lat()         { return this.position.lat }
  get lng()         { return this.position.lng }
  get contact()     { return this.info.contact }
  get description() { return this.info.summary.description }
  get directions()  { return this.info.summary.directions }
  get url()         { return this.info.url }

  updateMarkerIcon() {
    const maps = google.maps
    const icon = icons[this.type]
    const path =
        icon === 'up-arrow'   ? maps.SymbolPath.FORWARD_CLOSED_ARROW
      : icon === 'down-arrow' ? maps.SymbolPath.BACKWARD_CLOSED_ARROW
      : maps.SymbolPath.CIRCLE

    const color = prices[this.price] || [ 'transparent', 'transparent' ]

    this._marker.setIcon({
        path
      , scale        : this._map.scale
      , fillColor    : color[0]
      , fillOpacity  : 0.7
      , strokeColor  : color[1]
      , strokeWeight : 1
    })
    this._map.refreshMarker(this._marker)
  }

  _createMarker() {
    const maps = google.maps
    this._marker = new maps.Marker({
        position: new maps.LatLng(this.position.lat, this.position.lng)
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
  constructor({ getElement, zoom = 8 }) {
    super()
    this._getElement = getElement
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

  updateMarker({ id, position, type, price, info }) {
    const existingMarker = this._markers[id]
    const marker = existingMarker ||
      new GoogleMarker({ id, position, type, price, info, map: this })

    if (!existingMarker) {
      marker.on('clicked', () => this.emit('marker-clicked', marker))
      this._markers[id] = marker
    }

    marker.updateMarkerIcon()
  }

  refreshMarker(marker) {
    marker.setMap(null)
    marker.setMap(this._map)
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
    const MapTypeId = maps.MapTypeId

    this._el = this._getElement()

    this._map = new maps.Map(this._el, {
        center: latlng
      , scrollwheel : true
      , zoom        : this._zoom
      , mapTypeControlOptions: {
          mapTypeIds: [
            MapTypeId.ROADMAP
          , MapTypeId.SATELLITE
          , MapTypeId.HYBRID
          , MapTypeId.TERRAIN
        ]
      }
    })

    this._map.addListener('idle', () => this._onmapIdle())
    this._map.addListener('zoom-changed', () => this._onzoomChanged())
    this.emit('initialized')
  }
}

module.exports = GoogleMap
