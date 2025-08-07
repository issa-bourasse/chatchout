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

async function testMessageSending() {
  try {
    console.log('Testing message sending...');
    
    // First login to get a token
    console.log('\n1. Logging in...');
    const loginResult = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email: 'test2@example.com',
      password: 'Password123'
    });
    
    if (loginResult.status !== 200) {
      console.log('❌ Login failed:', loginResult.data);
      return;
    }
    
    const token = loginResult.data.token;
    console.log('✅ Login successful, token received');
    
    // Get user's chats
    console.log('\n2. Getting user chats...');
    const chatsResult = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/chats',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Chats result:', chatsResult.status, chatsResult.data);
    
    if (chatsResult.status === 200 && chatsResult.data.chats && chatsResult.data.chats.length > 0) {
      const chatId = chatsResult.data.chats[0]._id;
      console.log('Using chat ID:', chatId);
      
      // Try to send a message
      console.log('\n3. Sending message...');
      const messageResult = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }, {
        chatId: chatId,
        content: 'Test message from API',
        type: 'text'
      });
      
      console.log('Message result:', messageResult.status, messageResult.data);
    } else {
      console.log('No chats found, testing with dummy chat ID...');
      
      // Test with a properly formatted MongoDB ObjectId
      const dummyChatId = '507f1f77bcf86cd799439011';
      console.log('\n3. Sending message with dummy chat ID...');
      const messageResult = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }, {
        chatId: dummyChatId,
        content: 'Test message from API',
        type: 'text'
      });
      
      console.log('Message result:', messageResult.status, messageResult.data);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testMessageSending();
