import fetch from 'node-fetch';

async function testApi() {
  try {
    console.log('Testing API...');
    
    const response = await fetch('http://localhost:8080/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello, how are you?' }],
        language: 'en'
      }),
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Response data:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testApi(); 