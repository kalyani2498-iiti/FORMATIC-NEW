const FormData = require('form-data');
const fs = require('fs');
const http = require('http');
const path = require('path');

// Create a small test file
fs.writeFileSync(path.join(__dirname, '../uploads/test.png'), 'fake image content');

const form = new FormData();
form.append('files', fs.createReadStream(path.join(__dirname, '../uploads/test.png')));
form.append('targetFormat', 'webp');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/upload',
  method: 'POST',
  headers: form.getHeaders(),
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response:', data);
  });
});

form.pipe(req);
