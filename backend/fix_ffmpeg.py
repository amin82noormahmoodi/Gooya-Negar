#!/usr/bin/env python3
"""
اسکریپت حل مشکل ffmpeg برای ویندوز
"""

import subprocess
import sys
import os

def install_imageio_ffmpeg():
    """نصب imageio-ffmpeg"""
    print("🔧 نصب imageio-ffmpeg...")
    try:
        result = subprocess.run([
            sys.executable, "-m", "pip", "install", 
            "imageio-ffmpeg==0.4.9", "--upgrade"
        ], capture_output=True, text=True, check=True)
        print("✅ imageio-ffmpeg با موفقیت نصب شد")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ خطا در نصب: {e}")
        print(f"خروجی خطا: {e.stderr}")
        return False

def test_ffmpeg():
    """تست عملکرد ffmpeg"""
    print("🧪 تست عملکرد ffmpeg...")
    try:
        import imageio_ffmpeg as ffmpeg
        ffmpeg_exe = ffmpeg.get_ffmpeg_exe()
        print(f"✅ مسیر ffmpeg: {ffmpeg_exe}")
        
        # تست ساده
        from pydub import AudioSegment
        AudioSegment.converter = ffmpeg_exe
        AudioSegment.ffmpeg = ffmpeg_exe
        print("✅ pydub با موفقیت تنظیم شد")
        return True
    except Exception as e:
        print(f"❌ خطا در تست: {e}")
        return False

def main():
    """حل مشکل ffmpeg"""
    print("🛠️  حل مشکل ffmpeg برای GooyaNegar")
    print("=" * 50)
    
    # نصب imageio-ffmpeg
    if not install_imageio_ffmpeg():
        print("❌ نصب ناموفق بود")
        return
    
    # تست عملکرد
    if test_ffmpeg():
        print("\n✅ مشکل ffmpeg حل شد!")
        print("🚀 اکنون می‌توانید سرور را راه‌اندازی کنید:")
        print("   python start.py")
    else:
        print("\n❌ مشکل همچنان وجود دارد")
        print("💡 راه‌حل‌های جایگزین:")
        print("1. مجدداً اجرا کنید: python fix_ffmpeg.py")
        print("2. نصب کامل مجدد: pip install -r requirements.txt --force-reinstall")

if __name__ == "__main__":
    main() 