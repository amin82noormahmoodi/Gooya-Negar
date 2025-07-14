#!/usr/bin/env python3
"""
اسکریپت تست برای GooyaNegar Speech-to-Text API
"""

import requests
import sys
import os
from pathlib import Path

API_BASE_URL = "http://localhost:8000"

def test_health():
    """تست سلامت API"""
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            print("✅ API در حال اجرا است")
            return True
        else:
            print(f"❌ خطا در دسترسی به API: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ نمی‌توان به API متصل شد. مطمئن شوید سرور در حال اجرا است.")
        return False

def test_languages():
    """تست endpoint زبان‌ها"""
    try:
        response = requests.get(f"{API_BASE_URL}/languages")
        if response.status_code == 200:
            data = response.json()
            print("✅ لیست زبان‌های پشتیبانی شده:")
            for code, name in data["supported_languages"].items():
                print(f"   {code}: {name}")
            return True
        else:
            print(f"❌ خطا در دریافت لیست زبان‌ها: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ خطا در تست زبان‌ها: {e}")
        return False

def test_transcribe(audio_file_path=None):
    """تست endpoint تبدیل صوت به متن"""
    if not audio_file_path:
        print("⚠️  برای تست کامل، فایل صوتی ارائه نشده است")
        return True
    
    if not os.path.exists(audio_file_path):
        print(f"❌ فایل صوتی پیدا نشد: {audio_file_path}")
        return False
    
    try:
        with open(audio_file_path, 'rb') as audio_file:
            files = {'file': audio_file}
            data = {'language': 'fa-IR'}
            
            print(f"📤 ارسال فایل: {audio_file_path}")
            response = requests.post(
                f"{API_BASE_URL}/transcribe",
                files=files,
                data=data,
                timeout=60  # 60 ثانیه timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    print("✅ تبدیل صوت به متن موفقیت‌آمیز بود")
                    print(f"📝 متن تشخیص داده شده: {result.get('text', 'خالی')}")
                else:
                    print(f"⚠️  تبدیل ناموفق: {result.get('error', 'خطای نامشخص')}")
                return True
            else:
                print(f"❌ خطا در تبدیل صوت: {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"جزئیات خطا: {error_detail}")
                except:
                    print(f"پاسخ خطا: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ خطا در تست تبدیل صوت: {e}")
        return False

def main():
    """تست کلی API"""
    print("🧪 تست GooyaNegar Speech-to-Text API")
    print("=" * 50)
    
    # تست سلامت
    print("\n1. تست سلامت API...")
    if not test_health():
        print("❌ API در دسترس نیست. لطفاً سرور را راه‌اندازی کنید.")
        sys.exit(1)
    
    # تست زبان‌ها
    print("\n2. تست لیست زبان‌ها...")
    test_languages()
    
    # تست تبدیل صوت
    print("\n3. تست تبدیل صوت به متن...")
    audio_file = None
    if len(sys.argv) > 1:
        audio_file = sys.argv[1]
    
    test_transcribe(audio_file)
    
    print("\n" + "=" * 50)
    print("✅ تست‌ها تکمیل شد")
    
    if not audio_file:
        print("\n💡 برای تست کامل، فایل صوتی را به عنوان پارامتر ارسال کنید:")
        print("python test_api.py path/to/audio/file.mp3")

if __name__ == "__main__":
    main() 