const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Helper to handle HTTP requests
function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const clientOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(clientOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      if (typeof body === 'string') {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

// Generates a mock 128-dimensional face descriptor vector
function generateMockVector(baseVal = 0.1) {
  const arr = [];
  for (let i = 0; i < 128; i++) {
    arr.push(baseVal + (i * 0.001)); // Linear progression for predictable calculations
  }
  return arr;
}

// Parse cookie header to get the token value
function extractCookieToken(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  const tokenMatch = cookie.match(/token=([^;]+)/);
  return tokenMatch ? tokenMatch[1] : null;
}

async function runTests() {
  console.log('=== STARTING AUTOMATED END-TO-END VERIFICATION ===');
  
  let photographerToken = '';
  let memberToken = '';
  let testEventId = '';
  let testAlbumId = '';
  let uploadedMediaId = '';

  try {
    // ----------------------------------------------------
    // TEST 1: PHOTOGRAPHER LOGIN
    // ----------------------------------------------------
    console.log('\n[TEST 1] Logging in as Photographer...');
    const loginRes = await request(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      email: 'photographer@eventmanager.com',
      password: 'PhotoPassword123'
    });

    if (loginRes.statusCode !== 200) {
      throw new Error(`Photographer login failed: Status ${loginRes.statusCode} - ${loginRes.body}`);
    }
    
    photographerToken = extractCookieToken(loginRes.headers);
    if (!photographerToken) {
      throw new Error('Failed to extract token cookie from photographer login.');
    }
    console.log('✓ Photographer login successful.');

    // ----------------------------------------------------
    // TEST 2: GET SESSION PROFILE
    // ----------------------------------------------------
    console.log('\n[TEST 2] Verifying session profile endpoint...');
    const profileRes = await request(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: { 'Cookie': `token=${photographerToken}` }
    });

    if (profileRes.statusCode !== 200) {
      throw new Error(`Me API failed: Status ${profileRes.statusCode}`);
    }
    const profileData = JSON.parse(profileRes.body);
    console.log(`✓ Verified profile. Logged in as: ${profileData.user.name} (Role: ${profileData.user.role})`);

    // ----------------------------------------------------
    // TEST 3: CREATE EVENT
    // ----------------------------------------------------
    console.log('\n[TEST 3] Creating new Event...');
    const eventRes = await request(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${photographerToken}`
      }
    }, {
      name: 'Integration Test Sports Meet',
      description: 'Temporary event created by automated test script.',
      category: 'workshops',
      date: new Date().toISOString(),
      isPrivate: false,
      clubName: 'Media Club'
    });

    if (eventRes.statusCode !== 201) {
      throw new Error(`Create event failed: Status ${eventRes.statusCode} - ${eventRes.body}`);
    }
    const eventData = JSON.parse(eventRes.body);
    testEventId = eventData.event.id;
    console.log(`✓ Event created successfully. ID: ${testEventId}`);

    // ----------------------------------------------------
    // TEST 4: CREATE ALBUM
    // ----------------------------------------------------
    console.log('\n[TEST 4] Creating Album inside Event...');
    const albumRes = await request(`${BASE_URL}/api/events/${testEventId}/albums`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${photographerToken}`
      }
    }, {
      name: 'Test Album track-matches',
      description: 'Album for testing image uploads.'
    });

    if (albumRes.statusCode !== 201) {
      throw new Error(`Create album failed: Status ${albumRes.statusCode}`);
    }
    const albumData = JSON.parse(albumRes.body);
    testAlbumId = albumData.album.id;
    console.log(`✓ Album created successfully. ID: ${testAlbumId}`);

    // ----------------------------------------------------
    // TEST 5: MEMBER LOGIN
    // ----------------------------------------------------
    console.log('\n[TEST 5] Logging in as Club Member...');
    const memberLoginRes = await request(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      email: 'member@eventmanager.com',
      password: 'MemberPassword123'
    });

    if (memberLoginRes.statusCode !== 200) {
      throw new Error(`Member login failed: Status ${memberLoginRes.statusCode}`);
    }
    
    memberToken = extractCookieToken(memberLoginRes.headers);
    console.log('✓ Member login successful.');

    // ----------------------------------------------------
    // TEST 6: UPLOAD PHOTO (WITHOUT FACIAL VECTORS)
    // ----------------------------------------------------
    console.log('\n[TEST 6] Simulating photo upload...');
    
    const boundary = '----TestBoundary' + Math.random().toString(36).substring(2);
    const fileContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

    let payload = '';
    payload += `--${boundary}\r\n`;
    payload += `Content-Disposition: form-data; name="eventId"\r\n\r\n${testEventId}\r\n`;
    payload += `--${boundary}\r\n`;
    payload += `Content-Disposition: form-data; name="albumId"\r\n\r\n${testAlbumId}\r\n`;
    payload += `--${boundary}\r\n`;
    payload += `Content-Disposition: form-data; name="isPrivate"\r\n\r\nfalse\r\n`;
    payload += `--${boundary}\r\n`;
    payload += `Content-Disposition: form-data; name="file"; filename="test_photo.png"\r\n`;
    payload += `Content-Type: image/png\r\n\r\n`;

    const headerBuffer = Buffer.from(payload, 'utf-8');
    const footerBuffer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
    
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Cookie': `token=${photographerToken}`,
        'Content-Length': headerBuffer.length + fileContent.length + footerBuffer.length
      }
    };

    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(`${BASE_URL}/api/media/upload`);
      const req = http.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 80,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: requestOptions.headers
      }, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', async () => {
          try {
            if (res.statusCode !== 201) {
              reject(new Error(`Upload failed: Status ${res.statusCode} - ${responseData}`));
              return;
            }
            const data = JSON.parse(responseData);
            uploadedMediaId = data.media.id;
            console.log(`✓ Image uploaded successfully. Media ID: ${uploadedMediaId}`);
            console.log(`  AI Caption generated: "${data.media.caption}"`);
            console.log(`  AI Tags: [${data.media.tags.join(', ')}]`);
            
            // ----------------------------------------------------
            // TEST 7: VERIFY WATERMARKED DOWNLOAD
            // ----------------------------------------------------
            console.log('\n[TEST 7] Verifying watermarked download pipe...');
            const downloadRes = await request(`${BASE_URL}/api/media/${uploadedMediaId}/download`, {
              method: 'GET',
              headers: { 'Cookie': `token=${memberToken}` }
            });

            if (downloadRes.statusCode !== 200) {
              throw new Error(`Watermarked download failed: Status ${downloadRes.statusCode}`);
            }
            console.log(`✓ Download succeeded. Served attachment name: ${downloadRes.headers['content-disposition']}`);
            console.log(`  Served content size: ${downloadRes.body.length} bytes`);

            // Clean up database entities created during test
            console.log('\n[CLEANUP] Removing test event...');
            await request(`${BASE_URL}/api/events/${testEventId}`, {
              method: 'DELETE',
              headers: { 'Cookie': `token=${photographerToken}` }
            });
            console.log('✓ Cleaned up test database records.');

            console.log('\n=== ALL E2E VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      });

      req.on('error', reject);
      req.write(headerBuffer);
      req.write(fileContent);
      req.write(footerBuffer);
      req.end();
    });

  } catch (error) {
    console.error('\n❌ VERIFICATION TEST FAILED:', error.message);
    process.exit(1);
  }
}

// Execute tests after a brief timeout to ensure dev server is up
setTimeout(() => {
  runTests();
}, 2000);
