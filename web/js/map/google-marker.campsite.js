'use strict'

/* global google */

const EventEmitter = require('events').EventEmitter

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

  updateMarkerIcon({ selected = false, force = false } = {}) {
    const maps = google.maps
    // if scale didn't change there is no reason to update anything
    if (this._currentScale === this._map.scale && !force) return false
    this._currentScale = this._map.scale

    const path = maps.SymbolPath.CIRCLE

    const color = prices[this.price] || [ 'transparent', 'transparent' ]

    this._marker.setIcon({
        path
      , scale        : this._map.scale
      , fillColor    : selected ? 'aqua' : color[0]
      , fillOpacity  : 0.7
      , strokeColor  : selected ? 'black' : color[1]
      , strokeWeight : 1
    })
    return true
  }

  addInfo(el) {
    this._saveWidget = saveWidget({ el, place: this._place })
  }

  unselect() {
    this.updateMarkerIcon({ selected: false, force: true })
  }

  select() {
    this.updateMarkerIcon({ selected: true, force: true })
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

module.exports = function createGoogleMarker(opts) {
  return new GoogleMarker(opts)
}
