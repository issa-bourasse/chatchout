const http = require('http');

// Test the message API directly
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testMessageAPI() {
  try {
    console.log('Testing message API...');

    // Test sending a message without auth (should fail with 401)
    console.log('\n1. Testing without auth token...');
    const noAuthResult = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      chatId: '507f1f77bcf86cd799439011',
      content: 'Test message',
      type: 'text'
    });
    console.log('Result:', noAuthResult.status, noAuthResult.data);

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testMessageAPI();
