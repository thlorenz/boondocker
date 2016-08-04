'use strict'
const util = require('../lib/util')

const cheerio = require('cheerio')
const tableParser = require('cheerio-tableparser')
const camelcase = require('camelcase')
const fs = require('fs')
const path = require('path')

const resultsPath = path.join(__dirname, 'results')

const campground_linksPath = path.join(resultsPath, 'campground-links.json')

if (!util.exists(campground_linksPath)) {
  console.error('Please run sitemap.js first to generate the campground links')
  process.exit(1)
}

/**
 * Processes a campground link by downloading the html and pulling out JSON data.
 *
 * Meaning of actid
 *  - Campground Camping 29
 *  - Dispersed Camping  34
 *  - Group Camping      33
 *  - RV Camping         31
 *  - Cabin Rentals      101 (ignored for now)
 * @name processLink
 * @function
 */
function processLink(acc, info) {
  idx++
  if (!info) return acc
  const url = info.url
  const file = path.join(resultsPath, `campground.${info.recid}.html`)
  console.log('%s (%d/%d)', url, idx, len)
  const html = util.get(url, file)
  const rawInfo = extractRawInfo(html, url, info.recid, info.actids)
  // util.inspect(rawInfo)
  acc.push(rawInfo)
  return acc
}

/**
 * Page Parts:
 *
 *  <div id="pagetitletop">
 *    <h1>{{title}}</h1>
 *  </div>
 *
 *  #leftcol #leftcont
 *    <!-- the below highly unstructured similar to the below (may just have to pull out some phone number) -->
 *    <p class="heading">Contact Information</p>
 *      (<p>{{contact_name_x}}</p>
 *      <p>{{contact_address_x}}</p>)+
 *
 *  <!-- description and title can be found by using recid to match facilities.json against 'OrgFacilityID'
 *      and using it's 'FacilityID' to match against links.json -->
 *  #centercol table table td
 *    <span><strong>Area Status: </strong>{{area_status}}</span> (sometimes)
 *
 *    <!-- arbitrary description (sometimes including photos here) -->
 *    <p>{{description}}</p>+
 *    <h2>At a Glance</h2>
 *    <div>
 *      <table>
 *        Key Value fields with {{summary_data}}
 *      </table>
 *    </div>
 *    <!-- any of the below may be there and order changes
 *         each seeems to end with a <br>
 *    -->
 *
 *    <h2>General Information</h2>
 *    <strong>Directions: </strong>
 *    <p>{{direction}}</p>*
 *
 *    <strong>General Notes: </strong>
 *    <p>{{notes}}</p>* .. sometimes link go campground map
 *    <ul>
 *      <li>{{features}}</li>+
 *    </ul>
 *
 * (comment) <!-- Begin WIDRecareaLocationPortletView.jsp -->
 * #rightcol .box
 *  <p class="boxheading">Location</p>
 *  .rightbox (2nd) {{lat}}
 *  .rightbox (4th) {{lng}}
 *  .rightbox (6th) {{elevation}}
 *
 * @name extractRawInfo
 * @function
 * @param html
 * @param url
 * @param recid
 * @param actid
 */
function extractRawInfo(html, url, recid, actids) {
  const c = cheerio.load(html)
  const title = extractTitle(c)
  const contact = extractContact(c)
  const glance = extractGlance(c)
  const location = extractLocation(c)
  return {
      url
    , recid
    , actids
    , title
    , contact
    , glance
    , location
  }
}

function extractTitle(c) {
  const t = c('#pagetitletop h1')
  return t && t.text()
}

function extractContact(c) {
  const cont = c('#leftcont')
  const txt = (cont && cont.text()) || 'no contact info'
  return txt
    .replace(/Contact Information/g, '')
    .replace(/Contact Us/g, '')
    .replace(/Find us on Facebook/g, '')
    .replace(/Follow us on Twitter/g, '')
    .replace(/Stay Connected/g, '')
    .replace(/Offices closed on national holidays\.?/g, '')
    .replace(/[\r\t]/g, '')
    .trim(/[\n]/)
}

function extractGlance(c) {
  tableParser(c)
  const tableEl = c('#centercol table[summary="this is the data table used for displaying Recreation Area At a Glance Information"]')
  if (!tableEl) return {}
  const table = tableEl.parsetable(true, true, false)
  if (!table) return {}
  const keys = table[0]
  const values = table[1]
  if (!keys || !keys.length || !values || !values.length) return {}
  const acc = {}
  for (var i = 0; i < keys.length; i++) {
    const k = camelcase(keys[i].toLowerCase()).trim().replace(/\:$/, '')
    acc[k] = values[i]
  }
  return acc
}

function parseNum(t) {
  const s = t.replace(/[\n\r\t ',]/g, '')
  return parseFloat(s)
}

function extractLocation(c) {
  const loc = { lat: null, lng: null, elevation: null }

  const boxes = c('.box .boxheading')
  const box = boxes && boxes.last()
  const location = box && box.parent()
  if (!location) return loc

  const locationBoxes = location.find('.right-box')
  let next = null
  locationBoxes.each(function box(idx, el) {
    if (next === 'lat') {
      loc.lat = parseNum(c(el).text())
      next = null
      return
    }
    if (next === 'lng') {
      loc.lng = parseNum(c(el).text())
      next = null
      return
    }
    if (next === 'elevation') {
      loc.elevation = parseNum(c(el).text())
      next = null
      return
    }
    if (next === 'dist') {
      loc.dist = parseNum(c(el).text())
      next = null
      return
    }
    const text = c(el).text().toLowerCase()
    if (/latitude/.test(text)) next = 'lat'
    else if (/longitude/.test(text)) next = 'lng'
    else if (/elevation/.test(text)) next = 'elevation'
    else if (/area\/length/.test(text)) next = 'dist'
  })
  return loc
}

const cg_links = require(campground_linksPath)
let idx = 0
const len = cg_links.length

// const info = processLink([], cg_links[0])
// util.inspect(info)
const info = cg_links.reduce(processLink, [])
fs.writeFileSync(path.join(resultsPath, 'data.raw.json'), JSON.stringify(info, null, 2))
