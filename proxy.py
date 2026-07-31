import http.server
import socketserver
import http.client

PORT = 8080
TARGET_HOST = "127.0.0.1"
TARGET_PORT = 5000

class Proxy(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        conn = http.client.HTTPConnection(TARGET_HOST, TARGET_PORT, timeout=30)
        try:
            conn.request("GET", self.path, headers={
                "Host": self.headers.get("Host", "")
            })
            r = conn.getresponse()

            self.send_response(r.status)
            for k, v in r.getheaders():
                if k.lower() not in ("connection", "transfer-encoding"):
                    self.send_header(k, v)
            self.end_headers()
            self.wfile.write(r.read())
        finally:
            conn.close()

    def do_HEAD(self):
        conn = http.client.HTTPConnection(TARGET_HOST, TARGET_PORT, timeout=30)
        conn.request("HEAD", self.path)
        r = conn.getresponse()

        self.send_response(r.status)
        for k, v in r.getheaders():
            self.send_header(k, v)
        self.end_headers()
        conn.close()

    def log_message(self, fmt, *args):
        print(fmt % args)

with socketserver.ThreadingTCPServer(("127.0.0.1", PORT), Proxy) as server:
    print(f"Proxy running on 127.0.0.1:{PORT} -> 127.0.0.1:{TARGET_PORT}")
    server.serve_forever()
