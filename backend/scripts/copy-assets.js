const fs = require('node:fs');
const path = require('node:path');

const source = path.resolve(__dirname, '../src/modules/assets/fonts');
const destination = path.resolve(__dirname, '../dist/modules/assets/fonts');

fs.mkdirSync(destination, { recursive: true });
fs.cpSync(source, destination, { recursive: true });
