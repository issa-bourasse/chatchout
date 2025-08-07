const http = require('http');

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

async function testLogin() {
  try {
    console.log('Testing login functionality...');
    
    // Test registration first
    console.log('\n1. Testing registration...');
    const registerResult = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123'
    });
    console.log('Register result:', registerResult.status, registerResult.data);
    
    // Test login
    console.log('\n2. Testing login...');
    const loginResult = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email: 'test@example.com',
      password: 'Password123'
    });
    console.log('Login result:', loginResult.status, loginResult.data);
    
    if (loginResult.status === 200 && loginResult.data.token) {
      console.log('\n✅ Login successful! Token received.');
      
      // Test authenticated request
      console.log('\n3. Testing authenticated request...');
      const meResult = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/me',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginResult.data.token}`
        }
      });
      console.log('Auth test result:', meResult.status, meResult.data);
    } else {
      console.log('\n❌ Login failed!');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testLogin();
