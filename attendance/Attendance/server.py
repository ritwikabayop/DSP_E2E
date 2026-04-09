#!/usr/bin/env python3
"""
Simple HTTP Server for Team Attendance Tracker
Provides centralized data storage for multiple users
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os
from urllib.parse import urlparse, parse_qs
import socket

# Configuration
PORT = 8080
DATA_FILE = 'attendance_data.json'

class AttendanceHandler(SimpleHTTPRequestHandler):
    """Custom handler for attendance data operations"""
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        
        # API endpoint to get attendance data
        if parsed_path.path == '/api/attendance':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # Load and return attendance data
            data = self.load_attendance_data()
            self.wfile.write(json.dumps(data).encode())
            return
        
        # Serve the HTML file for root path
        elif parsed_path.path == '/':
            self.path = '/team-attendance-tracker.html'
        
        # Default: serve static files
        return SimpleHTTPRequestHandler.do_GET(self)
    
    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)
        
        # API endpoint to save attendance data
        if parsed_path.path == '/api/attendance':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                # Parse incoming JSON data
                new_data = json.loads(post_data.decode())
                
                # Load existing data
                existing_data = self.load_attendance_data()
                
                # Merge new data with existing
                existing_data.update(new_data)
                
                # Save merged data
                self.save_attendance_data(existing_data)
                
                # Send success response
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'success', 'message': 'Data saved'}).encode())
                
            except Exception as e:
                # Send error response
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'error', 'message': str(e)}).encode())
            
            return
        
        # Handle preflight requests for CORS
        self.send_response(200)
        self.end_headers()
    
    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def load_attendance_data(self):
        """Load attendance data from JSON file"""
        if os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                return {}
        return {}
    
    def save_attendance_data(self, data):
        """Save attendance data to JSON file"""
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def log_message(self, format, *args):
        """Custom log format with timestamps"""
        print(f"[{self.log_date_time_string()}] {format % args}")


def get_local_ip():
    """Get the local IP address of this machine"""
    try:
        # Connect to external address to determine local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except:
        return "localhost"


def main():
    """Start the HTTP server"""
    # Change to the directory where this script is located
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Get local IP
    local_ip = get_local_ip()
    
    # Create server
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, AttendanceHandler)
    
    print("=" * 70)
    print("🚀 Team Attendance Tracker Server Started!")
    print("=" * 70)
    print(f"\n📍 Server is running on:")
    print(f"   • Local:   http://localhost:{PORT}")
    print(f"   • Network: http://{local_ip}:{PORT}")
    print("\n📋 Instructions:")
    print("   1. Open the above URL in your browser")
    print("   2. Share the Network URL with your team members")
    print("   3. Everyone can now access the tracker simultaneously")
    print("\n💾 Data Storage:")
    print(f"   • All attendance data is saved in: {DATA_FILE}")
    print(f"   • Location: {os.getcwd()}")
    print("\n⚠️  Keep this window open while team members are using the tracker")
    print("   Press Ctrl+C to stop the server")
    print("=" * 70)
    print("\n✅ Ready! Waiting for connections...\n")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
        httpd.shutdown()


if __name__ == '__main__':
    main()
