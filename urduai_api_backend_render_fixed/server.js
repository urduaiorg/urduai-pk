import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Check for required environment variables
const requiredEnvVars = ['OPENAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn(`⚠️ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.warn('The application may not function correctly without these variables.');
  // We'll continue execution but log warnings instead of crashing
}

const app = express();
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST'], // Allow only GET and POST requests
  allowedHeaders: ['Content-Type', 'Authorization'] // Allow only specific headers
}));
app.use(express.json());
app.use(express.static('public'));

// Add a route handler for the root path
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

// Configure rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests, please try again later.' }
});

// Apply rate limiting to API endpoints
app.use('/api/', apiLimiter);

// Configure OpenAI with fallback for missing API key
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Test endpoint to check OpenAI configuration
app.get('/api/test', (req, res) => {
  const openaiConfigured = !!openai;
  const apiKey = process.env.OPENAI_API_KEY ? 'Configured' : 'Missing';
  
  res.status(200).json({
    status: 'ok',
    message: 'Test endpoint',
    openaiConfigured,
    apiKey: apiKey,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test OpenAI API key directly
app.get('/api/test-openai', async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ 
        error: 'OpenAI client is not initialized. API key may be missing.' 
      });
    }
    
    // Try a simple completion to test the API key
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hello, this is a test." }],
      max_tokens: 10
    });
    
    res.status(200).json({
      status: 'ok',
      message: 'OpenAI API key is valid',
      response: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('OpenAI API Test Error:', error);
    
    let errorMessage = 'Unknown error';
    let errorCode = 'unknown';
    
    if (error.status === 401) {
      errorMessage = 'Invalid API key or authentication error';
      errorCode = 'auth_error';
    } else if (error.status === 429) {
      errorMessage = 'Rate limit exceeded or quota reached';
      errorCode = 'rate_limit';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      status: 'error',
      message: 'OpenAI API key test failed',
      error: errorMessage,
      code: errorCode,
      details: JSON.stringify(error)
    });
  }
});

// Test OpenAI API key directly using fetch
app.get('/api/test-openai-fetch', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return res.status(503).json({ 
        error: 'OpenAI API key is missing in environment variables',
        code: 'missing_api_key'
      });
    }
    
    console.log('Testing OpenAI API with direct fetch...');
    
    // Prepare the request to OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello, this is a direct fetch test." }],
        max_tokens: 10
      })
    });
    
    // Get the response data
    const data = await response.json();
    
    // Check if the response is successful
    if (!response.ok) {
      console.error('OpenAI API direct fetch error:', data);
      
      return res.status(response.status).json({
        status: 'error',
        message: 'OpenAI API direct fetch test failed',
        error: data.error?.message || 'Unknown error',
        code: data.error?.type || 'unknown',
        statusCode: response.status,
        details: data
      });
    }
    
    // Return the successful response
    res.status(200).json({
      status: 'ok',
      message: 'OpenAI API direct fetch test successful',
      response: data.choices[0].message.content,
      details: data
    });
  } catch (error) {
    console.error('OpenAI API Direct Fetch Test Error:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'OpenAI API direct fetch test failed',
      error: error.message || 'Unknown error',
      code: 'fetch_error',
      details: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    console.log('Received chat request:', JSON.stringify({
      messages: req.body.messages ? `${req.body.messages.length} messages` : 'none',
      language: req.body.language
    }));
    
    if (!openai) {
      console.error('OpenAI client is not initialized. API key may be missing.');
      return res.status(503).json({ 
        error: 'OpenAI service unavailable. API key may be missing.',
        code: 'openai_not_initialized'
      });
    }

    const { messages, language } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('Invalid messages format:', req.body.messages);
      return res.status(400).json({ 
        error: 'Invalid messages format', 
        code: 'invalid_messages'
      });
    }

    // Check if the first message is a system message
    let apiMessages = [...messages];
    const hasSystemMessage = messages.length > 0 && messages[0].role === 'system';
    
    // If no system message, add one based on language
    if (!hasSystemMessage) {
      const systemMessage = language === 'ur' 
        ? "آپ ایک مددگار اور دوستانہ اے آئی اسسٹنٹ ہیں جو اردو میں بات کرتا ہے۔ آپ کا نام اُردو اے آئی ہے۔"
        : "You are a helpful and friendly AI assistant that speaks English. Your name is Urdu AI.";
      
      apiMessages = [
        { role: "system", content: systemMessage },
        ...messages
      ];
    }

    console.log('Sending to OpenAI:', JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: `${apiMessages.length} messages`,
      temperature: 0.7,
      max_tokens: 1000
    }));

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 1000
    });

    console.log('Received response from OpenAI');
    
    // Extract the response
    const responseMessage = completion.choices[0].message.content;
    
    // Send response back to client - support both old and new response formats
    res.json({
      message: responseMessage,
      reply: responseMessage, // For backward compatibility
      language,
      usage: completion.usage // For backward compatibility
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    
    let errorMessage = 'An error occurred while processing your request.';
    let errorCode = 'unknown_error';
    let statusCode = 500;
    
    if (error.status === 401) {
      errorMessage = 'Authentication error with OpenAI API.';
      errorCode = 'auth_error';
    } else if (error.status === 429) {
      errorMessage = 'Rate limit exceeded or quota reached on OpenAI API.';
      errorCode = 'rate_limit';
    } else if (error.status === 400) {
      errorMessage = 'Bad request to OpenAI API.';
      errorCode = 'bad_request';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error(`Chat error details: ${errorCode} - ${errorMessage}`);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    res.status(statusCode).json({
      error: errorMessage,
      code: errorCode,
      details: process.env.NODE_ENV === 'development' ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : undefined
    });
  }
});

// Newsletter subscription endpoint
app.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    console.log('Newsletter subscription request:', JSON.stringify(req.body));
    const { name, email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Get SendFox API token from environment variables
    const sendFoxToken = process.env.SENDFOX_API_TOKEN;
    
    if (!sendFoxToken) {
      console.warn('SendFox API token not found in environment variables');
      // Return success but log warning - this prevents the app from breaking
      // if the newsletter service isn't configured
      return res.status(200).json({ 
        success: true, 
        message: 'Subscription recorded (SendFox integration not configured)' 
      });
    }
    
    // Prepare data for SendFox API
    const formData = {
      email: email,
      first_name: name || ''
    };
    
    // Send data to SendFox API
    const response = await fetch('https://api.sendfox.com/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sendFoxToken}`
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('SendFox API error:', data);
      
      // Check if the error is due to the email already being subscribed
      if (data.message && data.message.includes('already exists')) {
        return res.status(409).json({ error: 'Email already subscribed' });
      }
      
      return res.status(response.status).json({ error: data.message || 'Subscription failed' });
    }
    
    console.log('SendFox API success:', data);
    res.status(200).json({ success: true, message: 'Subscription successful' });
    
  } catch (error) {
    console.error('Error in newsletter subscription:', error);
    res.status(500).json({ error: 'Failed to process subscription' });
  }
});

// Catch-all route to serve index.html for any undefined routes
// This is useful for single-page applications
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api/')) {
    res.sendFile('index.html', { root: 'public' });
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Change port to 8080
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
}); 