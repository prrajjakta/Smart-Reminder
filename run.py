"""Run this file to start Remindly: python run.py"""
import subprocess, sys, os, webbrowser, time

os.chdir(os.path.dirname(os.path.abspath(__file__)))

def install(pkg):
    subprocess.check_call([
        sys.executable, "-m", "pip", "install", pkg, "-q",
        "--break-system-packages"
    ])

for pkg in ["fastapi", "uvicorn[standard]", "pydantic", "jinja2", "python-multipart"]:
    try:
        __import__(pkg.replace("-","_").split("[")[0])
    except ImportError:
        print(f"Installing {pkg}...")
        install(pkg)

print("\n✅ Remindly is running at http://localhost:8000\n   Press Ctrl+C to stop.\n")
time.sleep(1)
webbrowser.open("http://localhost:8000")

import uvicorn
uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
