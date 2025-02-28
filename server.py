import http.server
import socketserver
import json
from urllib.parse import urlparse, parse_qs
import os

PORT = 8080
DIRECTORY = "public"

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def do_POST(self):
        # Handle API requests
        if self.path == '/api/chat':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            # Extract language from request
            language = request_data.get('language', 'ur')
            
            # Create a mock response
            if language == 'ur':
                response = {
                    "reply": "یہ ایک مصنوعی جواب ہے۔ اصل سرور کے لیے آپ کو Node.js انسٹال کرنا ہوگا اور OpenAI API کی کلید فراہم کرنی ہوگی۔",
                    "usage": {"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30}
                }
            else:
                response = {
                    "reply": "This is a mock response. For the actual server, you need to install Node.js and provide an OpenAI API key.",
                    "usage": {"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30}
                }
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return
        
        # Handle other POST requests
        self.send_response(404)
        self.end_headers()
    
    def do_GET(self):
        # Handle test endpoint
        if self.path == '/test':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'Server is working!')
            return
        
        # Handle other GET requests
        return super().do_GET()

# Create and start the server
Handler = CustomHTTPRequestHandler
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Server running at http://localhost:{PORT}/")
    httpd.serve_forever() 