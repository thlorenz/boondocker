'use strict'

/* global google */

const EventEmitter = require('events').EventEmitter
const getCurrentLatLng = require('./location').getCurrentLatLng

const createCampsiteMarker = require('./google-marker.campsite')
const createUserMarker = require('./google-marker.user')

const debug_marker_add = require('debug')('map:marker:add')
const debug_marker_rm = require('debug')('map:marker:rm')
const debug_marker_ref = require('debug')('map:marker:ref')

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
  constructor({ getElement, getQuickinfo, getOpenGoogleMaps, getMyLocation, zoom = 10 }) {
    super()
    this._getElement = getElement
    this._getQuickinfo = getQuickinfo
    this._getOpenGoogleMaps = getOpenGoogleMaps
    this._getMyLocation = getMyLocation
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
      createCampsiteMarker({ id, position, type, price, info, map: this })

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
    return scaling[this._map.getZoom()]
  }

  _updateUserLocation() {
    getCurrentLatLng((err, latlng) => {
      if (err) return console.error(err)
      this._userMarker.updateMarkerPosition({ position: latlng })
    })
  }

  _onmapIdle() {
    this._updateUserLocation()
    this.emit('idle')
  }

  _onzoomChanged() {
    this.emit('zoom-changed')
  }

  _onlatlng(latlng) {
    const maps = google.maps
    this._el = this._getElement()
    this._quickinfo = this._getQuickinfo()
    this._openGoogleMaps = this._getOpenGoogleMaps()
    this._mylocation = this._getMyLocation()

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
    this._map.controls[maps.ControlPosition.BOTTOM_RIGHT].push(this._openGoogleMaps)
    this._map.controls[maps.ControlPosition.RIGHT_BOTTOM].push(this._mylocation)
    this._userMarker = createUserMarker({ map: this._map, position: latlng })

    this._map.addListener('idle', () => this._onmapIdle())
    this._map.addListener('zoom-changed', () => this._onzoomChanged())
    this.emit('initialized')

    this._mylocation.addEventListener('click', () => this._recenter())
    this._mylocation.getElementsByTagName('img').item(0).addEventListener('click', () => this._recenter())
    setInterval(() => this._updateUserLocation, 2000)
  }

  _recenter() {
    getCurrentLatLng((err, latlng) => {
      if (err) return console.error(err)
      this._map.panTo(latlng)
    })
  }
}

module.exports = GoogleMap
