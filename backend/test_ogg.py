#!/usr/bin/env python3
"""
تست ساده برای بررسی پردازش فایل OGG
"""

import requests
import sys
import os

def test_ogg_file(file_path):
    """تست فایل OGG"""
    
    if not os.path.exists(file_path):
        print(f"❌ فایل پیدا نشد: {file_path}")
        return False
    
    print(f"🎵 تست فایل: {file_path}")
    print(f"📏 اندازه فایل: {os.path.getsize(file_path)} bytes")
    
    try:
        with open(file_path, 'rb') as f:
            files = {'file': f}
            data = {'language': 'fa-IR'}
            
            print("📤 ارسال فایل به API...")
            response = requests.post(
                "http://localhost:8000/transcribe",
                files=files,
                data=data,
                timeout=120  # 2 دقیقه timeout
            )
            
            print(f"📥 کد پاسخ: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    print("✅ موفقیت!")
                    print(f"📝 متن: {result.get('text', 'خالی')}")
                    return True
                else:
                    print(f"❌ ناموفق: {result.get('error', 'خطای نامشخص')}")
                    print(f"💡 پیام: {result.get('message', '')}")
                    return False
            else:
                print(f"❌ خطای HTTP: {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"جزئیات: {error_detail}")
                except:
                    print(f"پاسخ: {response.text}")
                return False
                
    except requests.exceptions.ConnectionError:
        print("❌ نمی‌توان به API متصل شد. آیا سرور در حال اجرا است؟")
        print("💡 برای راه‌اندازی: python start.py")
        return False
    except Exception as e:
        print(f"❌ خطا: {e}")
        return False

def main():
    """تابع اصلی"""
    print("🧪 تست فایل OGG")
    print("=" * 30)
    
    if len(sys.argv) < 2:
        print("❌ لطفاً مسیر فایل OGG را مشخص کنید")
        print("مثال: python test_ogg.py path/to/file.ogg")
        return
    
    file_path = sys.argv[1]
    
    if test_ogg_file(file_path):
        print("\n✅ تست موفقیت‌آمیز بود!")
    else:
        print("\n❌ تست ناموفق")

if __name__ == "__main__":
    main() 