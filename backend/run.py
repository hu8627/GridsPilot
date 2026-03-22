# backend/run.py
import uvicorn
import multiprocessing
from app.main import app

if __name__ == '__main__':
    # 针对 PyInstaller 多进程的保护 (防止在 Mac/Windows 打包后无限弹窗)
    multiprocessing.freeze_support()
    print("🚀 NexaFlow Local Engine is starting on port 8000...")
    uvicorn.run(app, host="127.0.0.1", port=8000)