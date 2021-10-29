#!/usr/bin/env node
const nlf = require('nlf');
const util = require('util');
const nlf_find = util.promisify(nlf.find);
const pkg = require('./package.json');
const fs = require('fs');
const path = require('path');
const https = require('https');
const url = require('url');


async function fetchExternalFile (location) {

  const resp = await new Promise((res, rej) => https.get(location, res).once('error', rej));

  if(resp.statusCode !== 200) {
    throw new Error(`${location} responded with ${resp.statusCode}`);
  }

  let data = '';

  // A chunk of data has been received.
  resp.on('data', (chunk) => {
    data += chunk;
  });

  // The whole response has been received. Print out the result.
  await new Promise(_ => resp.on('end', _));

  return data;
}


;(async () => {

  const direct = await nlf_find({
    directory: __dirname,
    depth: 1
  }).then(arr => arr.filter(x => x.name !== pkg.name));

  const licenses = direct.map(p => {
    const name = p.name;
    const version = p.version;
    const repo = p.repository;

    const { licenseSources } = p;
    if (licenseSources.package.sources.length > 1) {
      debugger;
    }

    const packLicense = licenseSources.package.sources[0];
    const fileLicense = licenseSources.license.sources[0];

    const license = packLicense.license;

    return {
      name,
      version,
      repo,
      fileLicense: fileLicense && fileLicense.text || null,
      license
    }
  });

  // custom licenses
  // ffmpeg
  licenses.push({
    name: "FFmpeg",
    version: '4.2.1',
    repo: 'https://github.com/ffmpeg/FFmpeg/',
    license: 'GPL-v3',
    fileLicense: await fetchExternalFile('https://raw.githubusercontent.com/FFmpeg/FFmpeg/release/4.2/LICENSE.md')
  })

  const file = path.join(__dirname, 'src', 'settings', 'licenses', 'licenses.ts');
  const code = `\
// THIS FILE HAS BEEN GENERATED BY ${path.basename(__filename)} 
// ANY MODIFICATIONS WILL BE REMOVED
export const licenses = ${util.inspect(licenses, { depth: Infinity, breakLength: 120 })};
`;
  // if code > 200k
  if(code.length > 200 * 2**10){
    console.warn('License file is', code.length / 2**10, 'KB! consider having a look at it')
  }
  fs.writeFileSync(file, code);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
