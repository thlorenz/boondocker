'use strict'

const OFFLINE = require('./settings').OFFLINE
const execSync = require('child_process').execSync
const fs = require('fs')

const curl = exports.curl = function curl(url) {
  return execSync('curl -L \'' + url + '\'')
}

const exists = exports.exists = function exists(file) {
  try {
    fs.accessSync(file)
    return true
  } catch (e) {
    return false
  }
}

exports.get = function get(url, file) {
  if (OFFLINE && exists(file)) return fs.readFileSync(file, 'utf8')

  const html = curl(url).toString()
  fs.writeFileSync(file, html)
  return html
}

exports.linksToHrefs = function linksToHrefs(links) {
  const hrefs = []
  links.each(x => hrefs.push(links[x].attribs.href))
  return hrefs
}

exports.inspect = function inspect(obj, depth) {
  console.error(require('util').inspect(obj, false, depth || 2, true))
}

exports.extractRecActIds = function extractRecActIds(url) {
  const recidMatch = url.match(/recid=(\d+)/)
  const actidMatch = url.match(/actid=(\d+)/)
  const recid = (recidMatch && recidMatch[1]) || null
  const actid = (actidMatch && actidMatch[1]) || null
  return { recid, actid }
}
