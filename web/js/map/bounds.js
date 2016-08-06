'use strict'

exports.entitiesWithinBounds = function entitiesWithinBounds({ ne, sw }, entities) {
  const minlat = sw.lat()
  const maxlat = ne.lat()
  const minlng = sw.lng()
  const maxlng = ne.lng()

  function withinBounds(e) {
    const lat = e.location.lat
    const lng = e.location.lng
    return minlat < lat && lat < maxlat
        && minlng < lng && lng < maxlng
  }
  return entities.filter(withinBounds)
}
