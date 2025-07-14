#!/usr/bin/env python3
"""
ابزار تبدیل فایل‌های صوتی به WAV
"""

import sys
import os
import subprocess

def convert_with_ffmpeg(input_file, output_file):
    """تبدیل با ffmpeg"""
    try:
        import imageio_ffmpeg as ffmpeg
        ffmpeg_exe = ffmpeg.get_ffmpeg_exe()
        
        if not os.path.exists(ffmpeg_exe):
            print(f"❌ ffmpeg پیدا نشد: {ffmpeg_exe}")
            return False
        
        cmd = [
            ffmpeg_exe,
            '-i', input_file,
            '-ar', '16000',
            '-ac', '1',
            '-acodec', 'pcm_s16le',
            '-y',
            output_file
        ]
        
        print(f"🔄 تبدیل {input_file} به {output_file}...")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            if os.path.exists(output_file):
                size = os.path.getsize(output_file)
                print(f"✅ تبدیل موفق! فایل خروجی: {size} bytes")
                return True
            else:
                print("❌ فایل خروجی ایجاد نشد")
                return False
        else:
            print(f"❌ خطای ffmpeg: {result.stderr}")
            return False
            
    except ImportError:
        print("❌ imageio-ffmpeg نصب نیست")
        return False
    except Exception as e:
        print(f"❌ خطا: {e}")
        return False

def main():
    """تابع اصلی"""
    print("🎵 ابزار تبدیل فایل صوتی به WAV")
    print("=" * 40)
    
    if len(sys.argv) < 2:
        print("❌ لطفاً مسیر فایل ورودی را مشخص کنید")
        print("مثال: python convert_audio.py input.ogg [output.wav]")
        return
    
    input_file = sys.argv[1]
    
    if not os.path.exists(input_file):
        print(f"❌ فایل ورودی پیدا نشد: {input_file}")
        return
    
    # تعیین فایل خروجی
    if len(sys.argv) >= 3:
        output_file = sys.argv[2]
    else:
        base_name = os.path.splitext(os.path.basename(input_file))[0]
        output_file = f"{base_name}_converted.wav"
    
    print(f"📁 فایل ورودی: {input_file}")
    print(f"📁 فایل خروجی: {output_file}")
    print(f"📏 اندازه ورودی: {os.path.getsize(input_file)} bytes")
    
    # تبدیل
    if convert_with_ffmpeg(input_file, output_file):
        print(f"\n🎉 تبدیل کامل شد!")
        print(f"💡 حالا می‌توانید از فایل {output_file} استفاده کنید")
        print(f"🧪 برای تست: python test_api.py {output_file}")
    else:
        print(f"\n❌ تبدیل ناموفق بود")
        print("💡 راه‌حل‌های جایگزین:")
        print("- از نرم‌افزار Audacity استفاده کنید")
        print("- از سایت‌های آنلاین تبدیل فرمت استفاده کنید")
        print("- فایل را به فرمت MP3 تبدیل کنید")

if __name__ == "__main__":
    main() 