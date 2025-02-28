# Urdu AI

Urdu AI is a chat application that allows users to interact with an AI assistant in both Urdu and English. The application consists of a static frontend and a Node.js API backend.

## Project Structure

- `static_site/`: Contains the static frontend files
- `server.js`: The Node.js API backend
- `.env`: Environment variables (not included in the repository)

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   SENDFOX_API_TOKEN=your_sendfox_api_token_here (optional)
   PORT=8080
   ```
4. Start the server:
   ```
   npm start
   ```

## Deployment on Render.com

### Backend API Deployment

1. Create a new Web Service on Render.com
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: urduai-pk (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variables**:
     - `OPENAI_API_KEY`: Your OpenAI API key
     - `SENDFOX_API_TOKEN`: Your SendFox API token (optional)

4. Click "Create Web Service"

### Frontend Static Site Deployment

1. Upload the contents of the `static_site` directory to your web hosting provider (e.g., Hostinger)
2. Ensure the `index.html` file is in the root directory
3. Update the `API_BASE_URL` in `js/main.js` to point to your Render.com API endpoint

## Troubleshooting

### Common Issues

1. **403 Forbidden Error**: Check file permissions on your web hosting provider. Files should have 644 permissions and directories should have 755 permissions.

2. **API Connection Issues**: Ensure the `API_BASE_URL` in `js/main.js` is correctly set to your Render.com API endpoint.

3. **Render.com Deployment Failures**: Check that all required environment variables are set in your Render.com dashboard.

### Health Check

The API includes a health check endpoint at `/health` that you can use to verify the server is running correctly.

## License

This project is licensed under the MIT License.

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

## Credits

Urdu AI is a Wang Lab of Innovation (WALI) initiative - [www.walipak.com](https://www.walipak.com) 