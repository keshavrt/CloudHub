const http = require('http');

const BASE_URL = 'http://localhost:3000';

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

function extractCookieToken(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  const tokenMatch = cookie.match(/token=([^;]+)/);
  return tokenMatch ? tokenMatch[1] : null;
}

async function runSocialTests() {
  console.log('=== STARTING SOCIAL INTERACTION AND NOTIFICATION TESTS ===');
  try {
    // 1. Login Sarah (Admin)
    console.log('\nLogging in as Admin (Sarah)...');
    const adminLogin = await request(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'admin@eventmanager.com',
      password: 'AdminPassword123'
    });
    const adminToken = extractCookieToken(adminLogin.headers);
    console.log('Sarah logged in.');

    // 2. Login Alex (Photographer)
    console.log('\nLogging in as Photographer (Alex)...');
    const photoLogin = await request(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'photographer@eventmanager.com',
      password: 'PhotoPassword123'
    });
    const photoToken = extractCookieToken(photoLogin.headers);
    console.log('Alex logged in.');

    // 3. Alex creates an event and uploads a photo
    console.log('\nAlex creates an event...');
    const eventRes = await request(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${photoToken}`
      }
    }, {
      name: 'Alexs Social Event',
      category: 'workshops',
      date: new Date().toISOString(),
      isPrivate: false
    });
    const eventData = JSON.parse(eventRes.body);
    const eventId = eventData.event.id;

    // Create General Album
    const albumRes = await request(`${BASE_URL}/api/events/${eventId}/albums`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${photoToken}`
      }
    }, { name: 'General' });
    const albumData = JSON.parse(albumRes.body);
    const albumId = albumData.album.id;

    // Simulating photo upload by Alex
    console.log('Alex uploads a photo...');
    const boundary = '----TestBoundary' + Math.random().toString(36).substring(2);
    const fileContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    let payload = '';
    payload += `--${boundary}\r\n`;
    payload += `Content-Disposition: form-data; name="eventId"\r\n\r\n${eventId}\r\n`;
    payload += `--${boundary}\r\n`;
    payload += `Content-Disposition: form-data; name="albumId"\r\n\r\n${albumId}\r\n`;
    payload += `--${boundary}\r\n`;
    payload += `Content-Disposition: form-data; name="isPrivate"\r\n\r\nfalse\r\n`;
    payload += `--${boundary}\r\n`;
    payload += `Content-Disposition: form-data; name="file"; filename="alex_photo.png"\r\n`;
    payload += `Content-Type: image/png\r\n\r\n`;

    const headerBuffer = Buffer.from(payload, 'utf-8');
    const footerBuffer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');

    const uploadRes = await new Promise((resolve, reject) => {
      const parsedUrl = new URL(`${BASE_URL}/api/media/upload`);
      const req = http.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 80,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Cookie': `token=${photoToken}`,
          'Content-Length': headerBuffer.length + fileContent.length + footerBuffer.length
        }
      }, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: responseData }));
      });
      req.on('error', reject);
      req.write(headerBuffer);
      req.write(fileContent);
      req.write(footerBuffer);
      req.end();
    });

    const mediaData = JSON.parse(uploadRes.body);
    const mediaId = mediaData.media.id;
    console.log(`Uploaded media ID: ${mediaId}`);

    // 4. Sarah (Admin) likes Alex's photo
    console.log('\nSarah likes Alex\'s photo...');
    const likeRes = await request(`${BASE_URL}/api/media/${mediaId}/social`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${adminToken}`
      }
    }, { action: 'like' });
    console.log(`Like status: ${likeRes.statusCode}, body: ${likeRes.body}`);

    // 5. Sarah comments on Alex's photo
    console.log('\nSarah comments on Alex\'s photo...');
    const commentRes = await request(`${BASE_URL}/api/media/${mediaId}/social`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${adminToken}`
      }
    }, { action: 'comment', content: 'Awesome shot, Alex!' });
    console.log(`Comment status: ${commentRes.statusCode}, body: ${commentRes.body}`);

    // 6. Retrieve Alex's notifications to see if he received notifications for the like and comment
    console.log('\nFetching Alex\'s notifications...');
    const notifRes = await request(`${BASE_URL}/api/notifications`, {
      method: 'GET',
      headers: { 'Cookie': `token=${photoToken}` }
    });
    console.log(`Notifications status: ${notifRes.statusCode}`);
    const notifs = JSON.parse(notifRes.body).notifications;
    console.log(`Alex has ${notifs.length} notifications.`);
    notifs.forEach(n => {
      console.log(` - [${n.type}]: ${n.message} (isRead: ${n.isRead})`);
    });

    // 7. Check if media list contains updated like count and comment
    console.log('\nFetching all media list (unauthenticated or as Alex)...');
    const mediaListRes = await request(`${BASE_URL}/api/media`, {
      method: 'GET',
      headers: { 'Cookie': `token=${photoToken}` }
    });
    const mediaList = JSON.parse(mediaListRes.body).media;
    const mediaItem = mediaList.find(m => m.id === mediaId);
    console.log(`Media Item Likes: ${mediaItem.likes}, LikedByMe: ${mediaItem.likedByMe}`);
    console.log(`Media Item Comments (${mediaItem.comments.length}):`);
    mediaItem.comments.forEach(c => {
      console.log(` - By ${c.author}: "${c.text}"`);
    });

    // Cleanup
    console.log('\nCleaning up test event...');
    await request(`${BASE_URL}/api/events/${eventId}`, {
      method: 'DELETE',
      headers: { 'Cookie': `token=${photoToken}` }
    });
    console.log('✓ Cleaned up.');

  } catch (err) {
    console.error('❌ Social tests failed:', err);
  }
}

setTimeout(runSocialTests, 2000);
