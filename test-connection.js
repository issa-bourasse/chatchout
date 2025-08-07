const http = require('http');

console.log('Testing server connections...');

// Test backend server
const testBackend = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:5000/api/health', (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('✅ Backend server is running!');
        console.log('Response:', data);
        resolve(data);
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Backend server is not running:', err.message);
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Backend server timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
};

// Test frontend server
const testFrontend = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:5173', (res) => {
      console.log('✅ Frontend server is running!');
      console.log('Status:', res.statusCode);
      resolve(res.statusCode);
    });
    
    req.on('error', (err) => {
      console.log('❌ Frontend server is not running:', err.message);
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Frontend server timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
};

// Run tests
async function runTests() {
  try {
    await testBackend();
  } catch (err) {
    console.log('Backend test failed');
  }
  
  try {
    await testFrontend();
  } catch (err) {
    console.log('Frontend test failed');
  }
}

runTests();
