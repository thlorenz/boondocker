#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')

const alldata_dir = path.join(__dirname, '..', 'alldata')

const files = fs.readdirSync(alldata_dir)

files.forEach(processFile)

function processFile(f) {
  const file_name = path.join(alldata_dir, f.replace('_API_v1', '').toLowerCase())
  console.error('processing', file_name)
  const json = require(path.join(alldata_dir, f))
  fs.writeFileSync(file_name, JSON.stringify(json, null, 2))
}
