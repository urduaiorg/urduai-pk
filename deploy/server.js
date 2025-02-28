import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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

// Configure OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    console.log('Received request body:', JSON.stringify(req.body));
    const { messages, language } = req.body;
    
    // Check if messages is valid
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format:', messages);
      return res.status(400).json({ error: 'Invalid messages format. Expected an array.' });
    }
    
    // Set system message based on language
    const systemMessage = language === 'ur' 
      ? "آپ ایک مددگار اور دوستانہ اے آئی اسسٹنٹ ہیں جو اردو میں بات کرتا ہے۔ آپ کا نام اُردو اے آئی ہے۔"
      : "You are a helpful and friendly AI assistant that speaks English. Your name is Urdu AI.";
    
    // Prepare messages array with system message first
    const apiMessages = [
      { role: "system", content: systemMessage },
      ...messages
    ];
    
    console.log('Sending to OpenAI:', JSON.stringify(apiMessages));
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    console.log('Received response from OpenAI');
    
    res.json({ 
      reply: completion.choices[0].message.content,
      usage: completion.usage
    });
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    res.status(500).json({ error: 'Failed to get response from AI' });
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
      console.error('SendFox API token not found in environment variables');
      return res.status(500).json({ error: 'API configuration error' });
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

// Change port to 8080
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 