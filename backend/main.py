from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import speech_recognition as sr
import tempfile
import os
import shutil
from pydub import AudioSegment
from pydub.exceptions import CouldntDecodeError
import io
from typing import Optional
import warnings

# حل مشکل ffmpeg در ویندوز
FFMPEG_EXE = None
FFPROBE_EXE = None

try:
    import imageio_ffmpeg as ffmpeg
    ffmpeg_exe = ffmpeg.get_ffmpeg_exe()
    
    # بررسی وجود فایل
    if os.path.exists(ffmpeg_exe):
        FFMPEG_EXE = ffmpeg_exe
        
        # پیدا کردن ffprobe
        ffmpeg_dir = os.path.dirname(ffmpeg_exe)
        possible_ffprobe_names = ['ffprobe.exe', 'ffprobe']
        
        for probe_name in possible_ffprobe_names:
            ffprobe_path = os.path.join(ffmpeg_dir, probe_name)
            if os.path.exists(ffprobe_path):
                FFPROBE_EXE = ffprobe_path
                break
        
        # اگر ffprobe پیدا نشد، از ffmpeg استفاده کن
        if not FFPROBE_EXE:
            FFPROBE_EXE = ffmpeg_exe
        
        # تنظیم pydub
        AudioSegment.converter = FFMPEG_EXE
        AudioSegment.ffmpeg = FFMPEG_EXE
        AudioSegment.ffprobe = FFPROBE_EXE
        
        print(f"✅ ffmpeg پیدا شد: {FFMPEG_EXE}")
        if FFPROBE_EXE != FFMPEG_EXE:
            print(f"✅ ffprobe پیدا شد: {FFPROBE_EXE}")
    else:
        print(f"⚠️ ffmpeg در مسیر مشخص شده یافت نشد: {ffmpeg_exe}")
        
except ImportError:
    print("⚠️ imageio-ffmpeg یافت نشد")
except Exception as e:
    print(f"⚠️ خطا در بارگذاری ffmpeg: {e}")

# خاموش کردن هشدارهای غیرضروری
warnings.filterwarnings("ignore", category=RuntimeWarning, module="pydub")

app = FastAPI(
    title="GooyaNegar Speech-to-Text API",
    description="API برای تبدیل فایل‌های صوتی به متن با استفاده از ASR گوگل",
    version="1.0.0"
)

# اضافه کردن CORS middleware برای اتصال از frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # در production باید آدرس مشخص شود
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ایجاد recognizer برای speech recognition
recognizer = sr.Recognizer()

# فرمت‌های صوتی پشتیبانی شده
SUPPORTED_FORMATS = [
    "audio/wav", "audio/wave", "audio/x-wav",
    "audio/mpeg", "audio/mp3",
    "audio/mp4", "audio/m4a",
    "audio/ogg", "audio/webm", "audio/ogg",
    "audio/flac", "audio/aac",
    "application/ogg", "video/ogg"  # برای فایل‌های OGG
]

# فرمت‌هایی که speech_recognition مستقیماً پشتیبانی می‌کند
DIRECT_SUPPORTED_FORMATS = [
    "audio/wav", "audio/wave", "audio/x-wav",
    "audio/flac"
]

@app.get("/")
async def root():
    """صفحه اصلی API"""
    return {
        "message": "GooyaNegar Speech-to-Text API در حال اجرا است",
        "version": "1.0.0",
        "endpoints": {
            "/transcribe": "POST - تبدیل فایل صوتی به متن"
        }
    }

@app.get("/health")
async def health_check():
    """بررسی سلامت API"""
    return {"status": "healthy", "service": "speech-to-text"}

def convert_to_wav_with_ffmpeg(input_path: str, output_path: str) -> bool:
    """تبدیل فایل با استفاده از ffmpeg مستقیماً"""
    if not FFMPEG_EXE:
        return False
    
    try:
        import subprocess
        cmd = [
            FFMPEG_EXE,
            '-i', input_path,
            '-ar', '16000',  # sample rate 16kHz
            '-ac', '1',      # mono
            '-acodec', 'pcm_s16le',  # PCM 16-bit
            '-y',            # overwrite output
            output_path
        ]
        
        print(f"🔄 تلاش با ffmpeg مستقیم...")
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0 and os.path.exists(output_path):
            print(f"✅ ffmpeg موفق بود: {os.path.getsize(output_path)} bytes")
            return True
        else:
            print(f"❌ خطای ffmpeg: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ خطا در اجرای ffmpeg: {e}")
        return False

def convert_to_wav(audio_file_path: str, output_path: str) -> bool:
    """تبدیل فایل صوتی به فرمت WAV با چندین روش"""
    
    # تشخیص فرمت فایل از پسوند
    file_extension = os.path.splitext(audio_file_path)[1].lower()
    print(f"🎵 پردازش فایل {file_extension}: {os.path.basename(audio_file_path)}")
    
    # اگر فایل از قبل WAV است، آن را کپی کن
    if file_extension in ['.wav', '.wave']:
        try:
            shutil.copy2(audio_file_path, output_path)
            print(f"✅ فایل WAV کپی شد: {os.path.getsize(output_path)} bytes")
            return True
        except Exception as e:
            print(f"خطا در کپی فایل WAV: {e}")
    
    # روش 1: تلاش با ffmpeg مستقیماً
    if convert_to_wav_with_ffmpeg(audio_file_path, output_path):
        return True
    
    # روش 2: تلاش با pydub
    try:
        print("🔄 تلاش برای تبدیل با pydub...")
        
        # بارگذاری فایل صوتی
        audio = None
        
        try:
            # روش مخصوص هر فرمت
            if file_extension == '.ogg':
                audio = AudioSegment.from_ogg(audio_file_path)
            elif file_extension == '.mp3':
                audio = AudioSegment.from_mp3(audio_file_path)
            elif file_extension == '.flac':
                audio = AudioSegment.from_file(audio_file_path, format="flac")
            elif file_extension in ['.m4a', '.mp4']:
                audio = AudioSegment.from_file(audio_file_path, format="mp4")
            else:
                # روش عمومی
                audio = AudioSegment.from_file(audio_file_path)
                
        except Exception as e:
            print(f"خطا در روش مخصوص: {e}")
            # تلاش با روش عمومی
            audio = AudioSegment.from_file(audio_file_path)
        
        # بررسی موفقیت بارگذاری
        if audio is None or len(audio) == 0:
            raise Exception("فایل صوتی خالی یا خراب است")
            
        # تنظیم پارامترهای کیفیت
        audio = audio.set_frame_rate(16000)
        audio = audio.set_channels(1)
        
        # نرمال‌سازی
        if len(audio) > 1000:
            audio = audio.normalize()
        
        # ذخیره
        audio.export(output_path, format="wav")
        
        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            print(f"✅ pydub موفق بود: {os.path.getsize(output_path)} bytes")
            return True
        else:
            raise Exception("فایل خروجی ایجاد نشد")
            
    except Exception as e:
        print(f"❌ pydub نتوانست فایل را تبدیل کند: {e}")
    
    # روش 3: اگر فایل WAV است، کپی مستقیم
    if file_extension in ['.wav', '.wave']:
        try:
            shutil.copy2(audio_file_path, output_path)
            print(f"✅ فایل WAV به صورت مستقیم کپی شد")
            return True
        except Exception as copy_error:
            print(f"❌ خطا در کپی فایل: {copy_error}")
    
    print("❌ هیچ روشی برای تبدیل کار نکرد")
    return False

@app.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = "fa-IR"  # زبان پیش‌فرض فارسی
):
    """
    تبدیل فایل صوتی به متن
    
    Args:
        file: فایل صوتی برای تبدیل
        language: کد زبان (پیش‌فرض: fa-IR برای فارسی)
    
    Returns:
        JSON شامل متن تبدیل شده
    """
    
    # بررسی نوع فایل - انعطاف‌پذیرتر
    file_extension = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    supported_extensions = ['.wav', '.mp3', '.ogg', '.flac', '.m4a', '.mp4', '.aac', '.webm']
    
    # بررسی content-type یا پسوند فایل
    content_type_ok = file.content_type in SUPPORTED_FORMATS
    extension_ok = file_extension in supported_extensions
    
    if not (content_type_ok or extension_ok):
        raise HTTPException(
            status_code=400,
            detail=f"فرمت فایل پشتیبانی نمی‌شود. فرمت‌های مجاز: {', '.join(supported_extensions)}\nContent-type دریافت شده: {file.content_type}"
        )
    
    # بررسی اندازه فایل (حداکثر 50MB)
    max_size = 50 * 1024 * 1024  # 50MB
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(
            status_code=400,
            detail="اندازه فایل بیش از حد مجاز است (حداکثر 50MB)"
        )
    
    # ایجاد فایل‌های موقت
    temp_input_file = None
    temp_wav_file = None
    
    try:
        # ذخیره فایل آپلود شده
        with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{file.filename}") as temp_input:
            temp_input.write(file_content)
            temp_input_file = temp_input.name
        
        # ایجاد فایل WAV موقت
        temp_wav_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav").name
        
        # تلاش برای تبدیل به WAV
        print("📄 شروع پردازش فایل...")
        conversion_success = convert_to_wav(temp_input_file, temp_wav_file)
        
        # تشخیص گفتار
        audio_data = None
        
        if conversion_success:
            # استفاده از فایل تبدیل شده
            try:
                print("🎯 تلاش با فایل WAV تبدیل شده...")
                with sr.AudioFile(temp_wav_file) as source:
                    recognizer.adjust_for_ambient_noise(source, duration=0.5)
                    audio_data = recognizer.record(source)
                print("✅ فایل WAV با موفقیت خوانده شد")
                    
            except Exception as wav_error:
                print(f"❌ خطا در خواندن فایل WAV: {wav_error}")
                audio_data = None
        
        # اگر فایل WAV کار نکرد یا تبدیل موفق نبود
        if audio_data is None:
            # تلاش با فایل اصلی (احتمالاً کار نکند برای OGG ولی تلاش کنیم)
            try:
                print("🔄 تلاش با فایل اصلی...")
                with sr.AudioFile(temp_input_file) as source:
                    recognizer.adjust_for_ambient_noise(source, duration=0.5)
                    audio_data = recognizer.record(source)
                print("✅ فایل اصلی با موفقیت خوانده شد")
                    
            except Exception as original_error:
                print(f"❌ خطا در خواندن فایل اصلی: {original_error}")
                
                # پیام خطای مفصل
                error_msg = "متأسفانه نتوانستیم فایل صوتی شما را پردازش کنیم.\n"
                
                if not conversion_success:
                    error_msg += "• تبدیل فایل به WAV ناموفق بود (ffmpeg در دسترس نیست)\n"
                else:
                    error_msg += "• فایل به WAV تبدیل شد ولی speech_recognition نتوانست آن را بخواند\n"
                
                error_msg += f"• فرمت فایل: {file_extension}\n"
                error_msg += "• راه‌حل‌ها:\n"
                error_msg += "  - فایل را به فرمت WAV یا FLAC تبدیل کنید\n"
                error_msg += "  - از نرم‌افزارهای آنلاین تبدیل فرمت استفاده کنید\n"
                error_msg += "  - کیفیت صوت را بررسی کنید"
                
                raise HTTPException(
                    status_code=422,
                    detail=error_msg
                )
        
        try:
            # استفاده از Google Speech Recognition
            text = recognizer.recognize_google(audio_data, language=language)
            
            return JSONResponse(
                content={
                    "success": True,
                    "text": text,
                    "language": language,
                    "filename": file.filename,
                    "message": "فایل صوتی با موفقیت به متن تبدیل شد"
                }
            )
            
        except sr.UnknownValueError:
            return JSONResponse(
                content={
                    "success": False,
                    "error": "متأسفانه نتوانستیم محتوای صوتی را تشخیص دهیم",
                    "message": "لطفاً کیفیت صوت و وضوح گفتار را بررسی کنید"
                },
                status_code=422
            )
            
        except sr.RequestError as e:
            return JSONResponse(
                content={
                    "success": False,
                    "error": "خطا در ارتباط با سرویس تشخیص گفتار",
                    "message": f"جزئیات خطا: {str(e)}"
                },
                status_code=503
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"خطای داخلی سرور: {str(e)}"
        )
    
    finally:
        # پاک‌سازی فایل‌های موقت
        for temp_file in [temp_input_file, temp_wav_file]:
            if temp_file and os.path.exists(temp_file):
                try:
                    os.unlink(temp_file)
                except:
                    pass

@app.get("/languages")
async def get_supported_languages():
    """دریافت لیست زبان‌های پشتیبانی شده"""
    languages = {
        "fa-IR": "فارسی",
        "en-US": "انگلیسی آمریکایی",
        "en-GB": "انگلیسی بریتانیایی",
        "ar": "عربی",
        "tr": "ترکی",
        "fr": "فرانسوی",
        "de": "آلمانی",
        "es": "اسپانیولی",
        "ru": "روسی",
        "zh": "چینی"
    }
    return {
        "supported_languages": languages,
        "default": "fa-IR"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 