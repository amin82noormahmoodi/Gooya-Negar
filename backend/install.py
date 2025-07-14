#!/usr/bin/env python3
"""
اسکریپت نصب و راه‌اندازی GooyaNegar Speech-to-Text API
"""

import subprocess
import sys
import os
import platform

def run_command(command, description):
    """اجرای دستور و نمایش نتیجه"""
    print(f"📋 {description}...")
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            capture_output=True,
            text=True
        )
        print(f"✅ {description} موفقیت‌آمیز بود")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ خطا در {description}")
        print(f"Error: {e.stderr}")
        return False

def check_python_version():
    """بررسی نسخه Python"""
    version = sys.version_info
    if version.major == 3 and version.minor >= 8:
        print(f"✅ Python {version.major}.{version.minor}.{version.micro} نصب است")
        return True
    else:
        print(f"❌ Python 3.8+ مورد نیاز است، شما Python {version.major}.{version.minor} دارید")
        return False

def install_requirements():
    """نصب وابستگی‌های Python"""
    if not os.path.exists("requirements.txt"):
        print("❌ فایل requirements.txt پیدا نشد")
        return False
    
    return run_command(
        f"{sys.executable} -m pip install -r requirements.txt",
        "نصب وابستگی‌های Python"
    )

def check_ffmpeg():
    """بررسی و نصب ffmpeg"""
    try:
        subprocess.run(["ffmpeg", "-version"], 
                      capture_output=True, check=True)
        print("✅ ffmpeg قبلاً نصب شده است")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("⚠️  ffmpeg نصب نیست")
        return install_ffmpeg()

def install_ffmpeg():
    """نصب ffmpeg بر اساس سیستم عامل"""
    system = platform.system().lower()
    
    if system == "windows":
        print("💡 برای Windows:")
        print("1. Chocolatey را نصب کنید: https://chocolatey.org/install")
        print("2. سپس اجرا کنید: choco install ffmpeg")
        print("یا از https://ffmpeg.org/download.html دانلود کنید")
        
    elif system == "darwin":  # macOS
        print("💡 برای macOS:")
        if run_command("brew --version", "بررسی نصب Homebrew"):
            return run_command("brew install ffmpeg", "نصب ffmpeg با Homebrew")
        else:
            print("ابتدا Homebrew را نصب کنید: https://brew.sh")
            
    elif system == "linux":
        print("💡 برای Linux:")
        # تشخیص توزیع Linux
        if os.path.exists("/etc/debian_version"):
            return run_command(
                "sudo apt update && sudo apt install -y ffmpeg",
                "نصب ffmpeg با apt"
            )
        elif os.path.exists("/etc/redhat-release"):
            return run_command(
                "sudo yum install -y ffmpeg",
                "نصب ffmpeg با yum"
            )
        else:
            print("لطفاً ffmpeg را به صورت دستی نصب کنید")
    
    return False

def create_virtual_environment():
    """ایجاد محیط مجازی Python"""
    if os.path.exists("venv"):
        print("✅ محیط مجازی قبلاً ایجاد شده است")
        return True
    
    return run_command(
        f"{sys.executable} -m venv venv",
        "ایجاد محیط مجازی Python"
    )

def main():
    """فرآیند نصب اصلی"""
    print("🚀 نصب و راه‌اندازی GooyaNegar Speech-to-Text API")
    print("=" * 60)
    
    # بررسی نسخه Python
    if not check_python_version():
        sys.exit(1)
    
    # ایجاد محیط مجازی
    print("\n1. محیط مجازی...")
    create_virtual_environment()
    
    # نصب وابستگی‌ها
    print("\n2. نصب وابستگی‌های Python...")
    if not install_requirements():
        print("❌ خطا در نصب وابستگی‌ها")
        sys.exit(1)
    
    # بررسی ffmpeg
    print("\n3. بررسی ffmpeg...")
    check_ffmpeg()
    
    print("\n" + "=" * 60)
    print("✅ نصب تکمیل شد!")
    print("\n📋 مراحل بعدی:")
    print("1. برای راه‌اندازی سرور: python start.py")
    print("2. برای تست API: python test_api.py")
    print("3. مشاهده مستندات: http://localhost:8000/docs")
    
    print("\n💡 اگر از محیط مجازی استفاده می‌کنید:")
    if platform.system().lower() == "windows":
        print("   venv\\Scripts\\activate")
    else:
        print("   source venv/bin/activate")

if __name__ == "__main__":
    main() 