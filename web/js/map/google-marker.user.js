'use strict'

/* global google */

const util = require('../util')

class GoogleMarkerUser {
  constructor({ position, map }) {
    this.position = position
    this._map     = map
    this._currentScale = -1
    this._createMarker()
  }
  _createMarker() {
    const maps = google.maps
    this._innerMarker = new maps.Marker({
        position : new maps.LatLng(this.position.lat, this.position.lng)
      , map      : this._map
      , zIndex   : 5
    })
    this._outerMarker = new maps.Marker({
        position : new maps.LatLng(this.position.lat, this.position.lng)
      , map      : this._map
      , zIndex   : 4
    })

    const path = maps.SymbolPath.CIRCLE
    this._innerMarker.setIcon({
        path
      , scale        : 6.5
      , fillColor    : '#4285f4'
      , fillOpacity  : 1
      , strokeColor  : 'white'
      , strokeWeight : 2
    })
    this._outerMarker.setIcon({
        path
      , scale        : 13
      , fillColor    : '#4285f4'
      , fillOpacity  : 0.2
      , strokeWeight : 0
    })

    this._innerMarker.setMap(this._map)
    this._outerMarker.setMap(this._map)
  }

  updateMarkerPosition({ position } = {}) {
    if (util.locationsEqual(position, this.position)) return
    const maps = google.maps
    this.position = position
    this._innerMarker.setPosition(new maps.LatLng(this.position.lat, this.position.lng))
    this._outerMarker.setPosition(new maps.LatLng(this.position.lat, this.position.lng))
  }
}

module.exports = function createGoogleMarkerUser(opts) {
  return new GoogleMarkerUser(opts)
}
