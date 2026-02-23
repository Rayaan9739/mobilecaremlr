const fetch = require('node-fetch');

async function testLogin() {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@mobilecare.com',
        password: 'admin123'
      })
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);

    if (response.ok && data.token) {
      console.log('✅ Login successful!');
      console.log('Role:', data.role);
      console.log('Token received:', data.token ? 'Yes' : 'No');
    } else {
      console.log('❌ Login failed');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();