import threading
from flask import Flask
import webview

app = Flask(__name__)

@app.route("/")
def home():
    return """
    <html>
    <head>
        <title>Anti-Stealer</title>
        <style>
            body {
                margin: 0;
                background: #0f0f0f;
                color: white;
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
            }
            .box {
                background: #1c1c1c;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 0 25px rgba(0,0,0,0.5);
                text-align: center;
                width: 500px;
            }
            h1 {
                margin-bottom: 10px;
            }
            p {
                color: #bbb;
            }
        </style>
    </head>
    <body>
        <div class="box">
            <h1>Anti-Stealer</h1>
            <p>Uygulama artık tarayıcı gibi değil, masaüstü uygulaması gibi açılıyor.</p>
        </div>
    </body>
    </html>
    """

def run_flask():
    app.run(port=5000, debug=False, use_reloader=False)

if __name__ == "__main__":
    t = threading.Thread(target=run_flask)
    t.daemon = True
    t.start()

    webview.create_window(
        "Anti-Stealer",
        "http://127.0.0.1:5000",
        width=1000,
        height=700,
        resizable=True
    )
    webview.start()
