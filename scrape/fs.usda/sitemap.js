'use strict'
const OFFLINE = require('../lib/settings').OFFLINE

const util = require('../lib/util')

const cheerio = require('cheerio')
const path = require('path')
const fs = require('fs')

const ROOT = 'http://www.fs.usda.gov'
const resultsPath = path.join(__dirname, 'results')
const campground_linksPath = path.join(resultsPath, 'campground-links.json')

function getAreas(cb) {
  const sitemapPath = path.join(resultsPath, 'sitemap.html')

  function extractAreas(html) {
    const c = cheerio.load(html)
    const links = c('li a')
    const hrefs = util.linksToHrefs(links)
    const areas = hrefs.map(function toarea(x) {
      x = x.replace(/\/$/, '')
      const parts = x.split('/')
      return parts[parts.length - 1]
    })
    return areas
  }

  const html = util.get('http://www.fs.usda.gov/Internet/FSE_DOCUMENTS/fseprd500420.html', sitemapPath)
  return extractAreas(html)
}

function getCampingCabinsLinks(acc, x) {
  const name = `camping-cabins-links.${x.area}`
  const file = path.join(resultsPath, `${name}.html`)
  const html = util.get(x.url, file)

  const c = cheerio.load(html)
  const links = c('#centercol .themetable .themetd li a')
  const hrefs = util.linksToHrefs(links)
    .filter(x => x.startsWith('/activity'))
    .map(x => ROOT + x)
  return acc.concat(hrefs)
}

function getAllCampingCabinsLinks(areas) {
  const camping_cabins_linksPath = path.join(resultsPath, 'camping-cabins-links.json')
  if (OFFLINE && util.exists(camping_cabins_linksPath)) return require(camping_cabins_linksPath)

  const camping_cabins_links = areas.map(x => ({ area: x, url: `${ROOT}/activity/${x}/recreation/camping-cabins` }))
  const links = camping_cabins_links.reduce(getCampingCabinsLinks, [])
  fs.writeFileSync(camping_cabins_linksPath, JSON.stringify(links, null, 2))
}

function getCampgroundLinks(acc, url) {
  const ids = util.extractRecActIds(url)
  const recid = ids.recid
  const actid = ids.actid
  const name = `campground-links.${recid}.${actid}`
  const p = path.join(resultsPath, `${name}.html`)
  const html = util.get(url, p)

  const c = cheerio.load(html)
  const links = c('li a')
  const hrefs = util.linksToHrefs(links)
    .filter(x => x && x.startsWith('/recarea'))
    .map(x => ROOT + x)
  return acc.concat(hrefs)
}

function structureAllCampgroundLinks(cg_links) {
  const byRecID = cg_links.reduce(function onurl(acc, url) {
    const ids = util.extractRecActIds(url)
    const recid = ids.recid
    const actid = ids.actid
    const val = acc[recid]
    if (val && actid) {
      val.actids.push(actid)
    } else {
      const shortUrl = url && url.replace(/camping-cabins/, '').replace(/&actid=\d+/, '')
      acc[recid] = { url: shortUrl, recid, actids: [ ] }
      if (actid) acc[recid].actids.push(actid)
    }
    return acc
  }, {})

  return Object.keys(byRecID).reduce(function onrecid(acc, k) {
    acc.push(byRecID[k])
    return acc
  }, [])
}

function getAllCampgroundLinks(links) {
  if (OFFLINE && util.exists(campground_linksPath)) return require(campground_linksPath)
  const cg_links = links.reduce(getCampgroundLinks, [])
  return structureAllCampgroundLinks(cg_links)
}

function process() {
  const areas = getAreas()
  const camping_cabins_links = getAllCampingCabinsLinks(areas)
  const cg_links = getAllCampgroundLinks(camping_cabins_links)
  fs.writeFileSync(campground_linksPath, JSON.stringify(cg_links, null, 2))
}

process()
