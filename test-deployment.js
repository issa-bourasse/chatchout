#!/usr/bin/env node

/**
 * ChatChout Deployment Testing Script
 * Tests both Railway backend and Vercel frontend
 */

const https = require('https');
const http = require('http');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testBackend(backendUrl) {
  log('\n🚂 Testing Railway Backend...', 'blue');
  
  try {
    // Test health endpoint
    log('Testing health endpoint...', 'cyan');
    const healthUrl = `${backendUrl}/api/health`;
    const response = await makeRequest(healthUrl);
    
    if (response.statusCode === 200) {
      log('✅ Health endpoint working', 'green');
      
      try {
        const healthData = JSON.parse(response.data);
        if (healthData.status === 'OK') {
          log('✅ Server status is OK', 'green');
        } else {
          log('⚠️  Server status is not OK', 'yellow');
        }
      } catch (e) {
        log('⚠️  Health response is not valid JSON', 'yellow');
      }
    } else {
      log(`❌ Health endpoint failed with status: ${response.statusCode}`, 'red');
    }
    
    // Test CORS headers
    log('Checking CORS headers...', 'cyan');
    const corsHeaders = response.headers['access-control-allow-origin'];
    if (corsHeaders) {
      log('✅ CORS headers present', 'green');
    } else {
      log('⚠️  CORS headers missing', 'yellow');
    }
    
  } catch (error) {
    log(`❌ Backend test failed: ${error.message}`, 'red');
  }
}

async function testFrontend(frontendUrl) {
  log('\n🌐 Testing Vercel Frontend...', 'blue');
  
  try {
    log('Testing frontend loading...', 'cyan');
    const response = await makeRequest(frontendUrl);
    
    if (response.statusCode === 200) {
      log('✅ Frontend loads successfully', 'green');
      
      // Check if it's an HTML page
      if (response.data.includes('<html') || response.data.includes('<!DOCTYPE html>')) {
        log('✅ Valid HTML page returned', 'green');
      } else {
        log('⚠️  Response doesn\'t look like HTML', 'yellow');
      }
      
      // Check for common assets
      if (response.data.includes('script') || response.data.includes('link')) {
        log('✅ Assets references found', 'green');
      } else {
        log('⚠️  No asset references found', 'yellow');
      }
      
    } else {
      log(`❌ Frontend failed with status: ${response.statusCode}`, 'red');
    }
    
  } catch (error) {
    log(`❌ Frontend test failed: ${error.message}`, 'red');
  }
}

async function testCrossOrigin(backendUrl, frontendUrl) {
  log('\n🔗 Testing Cross-Origin Configuration...', 'blue');
  
  try {
    // Extract domains
    const backendDomain = new URL(backendUrl).hostname;
    const frontendDomain = new URL(frontendUrl).hostname;
    
    log(`Backend domain: ${backendDomain}`, 'cyan');
    log(`Frontend domain: ${frontendDomain}`, 'cyan');
    
    if (backendDomain !== frontendDomain) {
      log('✅ Different domains detected (good for CORS testing)', 'green');
    } else {
      log('⚠️  Same domain detected', 'yellow');
    }
    
    // Test API endpoint from frontend perspective
    const apiUrl = `${backendUrl}/api/health`;
    log(`Testing API access: ${apiUrl}`, 'cyan');
    
    const response = await makeRequest(apiUrl);
    if (response.statusCode === 200) {
      log('✅ API accessible from external domain', 'green');
    } else {
      log('❌ API not accessible', 'red');
    }
    
  } catch (error) {
    log(`❌ Cross-origin test failed: ${error.message}`, 'red');
  }
}

function printSummary(backendUrl, frontendUrl) {
  log('\n📋 Deployment Summary', 'magenta');
  log('='.repeat(50), 'magenta');
  log(`Backend URL:  ${backendUrl}`, 'cyan');
  log(`Frontend URL: ${frontendUrl}`, 'cyan');
  log(`API URL:      ${backendUrl}/api`, 'cyan');
  log(`Health URL:   ${backendUrl}/api/health`, 'cyan');
  log('='.repeat(50), 'magenta');
  
  log('\n📝 Next Steps:', 'yellow');
  log('1. Test user registration and login', 'yellow');
  log('2. Test real-time messaging between two browsers', 'yellow');
  log('3. Check browser console for Socket.IO connection', 'yellow');
  log('4. Verify all features work as expected', 'yellow');
  log('5. Monitor logs in Railway and Vercel dashboards', 'yellow');
}

async function main() {
  log('🧪 ChatChout Deployment Testing Script', 'magenta');
  log('=====================================', 'magenta');
  
  // Get URLs from command line arguments or prompt
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    log('\nUsage: node test-deployment.js <backend-url> <frontend-url>', 'red');
    log('\nExample:', 'yellow');
    log('node test-deployment.js https://chatchout-backend.up.railway.app https://chatchout-frontend.vercel.app', 'yellow');
    process.exit(1);
  }
  
  const backendUrl = args[0].replace(/\/$/, ''); // Remove trailing slash
  const frontendUrl = args[1].replace(/\/$/, ''); // Remove trailing slash
  
  log(`\nTesting deployment:`, 'blue');
  log(`Backend:  ${backendUrl}`, 'cyan');
  log(`Frontend: ${frontendUrl}`, 'cyan');
  
  // Run tests
  await testBackend(backendUrl);
  await testFrontend(frontendUrl);
  await testCrossOrigin(backendUrl, frontendUrl);
  
  // Print summary
  printSummary(backendUrl, frontendUrl);
  
  log('\n🎉 Testing completed!', 'green');
  log('Check the results above and follow the next steps.', 'green');
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    log(`\n❌ Script failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { testBackend, testFrontend, testCrossOrigin };
