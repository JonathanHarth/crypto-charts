"""Tiny dev server with hard-coded MIME types.

Python's stdlib http.server reads MIME types from the OS, which on Windows
often has .js → text/plain. Browsers reject ES modules with non-JS MIME
types, so we override the mapping here.

Usage: python serve.py [port]
"""
import http.server
import socketserver
import sys


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".html": "text/html",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".map": "application/json",
        "": "application/octet-stream",
    }


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
with socketserver.TCPServer(("", port), Handler) as httpd:
    print(f"Serving at http://localhost:{port}")
    httpd.serve_forever()
