#!/usr/bin/env python3
"""
اسکریپت راه‌اندازی سرور GooyaNegar Speech-to-Text API
"""

import subprocess
import sys
import os

def check_requirements():
    """بررسی نصب وابستگی‌ها"""
    try:
        import fastapi
        import uvicorn
        import speech_recognition
        import pydub
        print("✅ تمام وابستگی‌ها نصب شده‌اند")
        return True
    except ImportError as e:
        print(f"❌ وابستگی‌های لازم نصب نشده‌اند: {e}")
        print("لطفاً ابتدا دستور زیر را اجرا کنید:")
        print("pip install -r requirements.txt")
        return False

def check_ffmpeg():
    """بررسی نصب ffmpeg"""
    # ابتدا بررسی imageio-ffmpeg
    try:
        import imageio_ffmpeg as ffmpeg
        ffmpeg_exe = ffmpeg.get_ffmpeg_exe()
        if ffmpeg_exe and os.path.exists(ffmpeg_exe):
            print("✅ ffmpeg از imageio-ffmpeg در دسترس است")
            return True
    except ImportError:
        pass
    except Exception as e:
        print(f"خطا در بررسی imageio-ffmpeg: {e}")
    
    # بررسی ffmpeg سیستمی
    try:
        subprocess.run(["ffmpeg", "-version"], 
                      capture_output=True, check=True)
        print("✅ ffmpeg سیستمی نصب شده است")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("⚠️  ffmpeg در دسترس نیست")
        print("💡 راه حل: وابستگی‌ها را مجدداً نصب کنید:")
        print("   pip install -r requirements.txt")
        return False

def start_server(host="0.0.0.0", port=8000, reload=True):
    """راه‌اندازی سرور FastAPI"""
    print(f"🚀 راه‌اندازی سرور در آدرس: http://{host}:{port}")
    print(f"📖 مستندات API: http://{host}:{port}/docs")
    print("برای توقف سرور Ctrl+C را فشار دهید")
    print("-" * 50)
    
    try:
        import uvicorn
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            reload=reload,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n✅ سرور متوقف شد")
    except Exception as e:
        print(f"❌ خطا در راه‌اندازی سرور: {e}")

if __name__ == "__main__":
    print("🎤 GooyaNegar Speech-to-Text API")
    print("=" * 40)
    
    # بررسی وابستگی‌ها
    if not check_requirements():
        sys.exit(1)
    
    # بررسی ffmpeg
    check_ffmpeg()
    
    print()
    
    # دریافت پارامترها از command line
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("❌ شماره پورت نامعتبر است")
            sys.exit(1)
    
    # راه‌اندازی سرور
    start_server(port=port) 