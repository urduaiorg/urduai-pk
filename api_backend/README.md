# Urdu AI Chat Platform

This is a chat platform that allows users to interact with an AI assistant in Urdu or English.

## Prerequisites

- Node.js 14.x or higher
- OpenAI API key
- SendFox API token (for newsletter functionality)

## Running the Application

### Development Mode

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the root directory with your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   SENDFOX_API_TOKEN=your_sendfox_api_token_here
   PORT=8080
   ```
5. Run the Node.js server:
   ```
   node server.js
   ```
6. Open your browser and go to http://localhost:8080

### Production Deployment

1. Clone the repository on your production server
2. Navigate to the project directory
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file with your API keys (as above)
5. Install PM2 for process management:
   ```
   npm install -g pm2
   ```
6. Start the application with PM2:
   ```
   pm2 start server.js --name "urdu-ai"
   ```
7. Configure PM2 to start on system boot:
   ```
   pm2 startup
   pm2 save
   ```
8. Set up a reverse proxy with Nginx or Apache to serve the application on your domain

## Features

- Chat with AI in Urdu or English
- Dark/Light mode toggle with persistent preference
- Mobile-responsive design with enhanced layouts for different screen sizes
- Example prompts for quick start
- Persistent chat history with localStorage
- Newsletter subscription with SendFox API integration
- Copy to clipboard functionality for chat responses
- Improved accessibility with ARIA attributes
- Enhanced error handling and network status detection
- Loading indicators and animations

## Technologies Used

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js/Express.js
- AI: OpenAI API
- Newsletter: SendFox API

## Security Features

- Rate limiting to prevent API abuse
- Environment variables for sensitive API keys
- Input validation and sanitization
- CORS protection

## Maintenance and Updates

### Adding New Features

1. Clone the repository
2. Create a new branch for your feature
3. Implement your changes
4. Test thoroughly
5. Create a pull request

### Updating API Keys

1. Edit the `.env` file on your server
2. Restart the application:
   ```
   pm2 restart urdu-ai
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Credits

Urdu AI is a Wang Lab of Innovation (WALI) initiative - [www.walipak.com](https://www.walipak.com) 