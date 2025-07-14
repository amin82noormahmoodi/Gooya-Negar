# GooyaNegar Speech-to-Text API

API برای تبدیل فایل‌های صوتی به متن با استفاده از Google Speech Recognition

## ویژگی‌ها

- 🎵 پشتیبانی از فرمت‌های مختلف صوتی (MP3, WAV, M4A, OGG, FLAC و...)
- 🌍 پشتیبانی از زبان‌های مختلف (فارسی، انگلیسی، عربی و...)
- 🚀 API سریع و کارآمد با FastAPI
- 📝 مستندات خودکار Swagger
- 🔧 پردازش و بهینه‌سازی فایل‌های صوتی
- ✅ مدیریت خطاها و validation

## پیش‌نیازها

- Python 3.8 یا بالاتر
- اتصال به اینترنت (برای Google Speech Recognition)
- ffmpeg (برای پردازش فایل‌های صوتی)

### نصب ffmpeg

**Windows:**
```bash
# با chocolatey
choco install ffmpeg

# یا دانلود مستقیم از https://ffmpeg.org/download.html
```

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

## نصب و راه‌اندازی

1. **نصب وابستگی‌ها:**
```bash
pip install -r requirements.txt
```

2. **اجرای سرور:**
```bash
# روش اول - با uvicorn مستقیم
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# روش دوم - اجرای فایل main.py
python main.py
```

3. **مشاهده مستندات API:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## استفاده از API

### 1. بررسی وضعیت سرور
```bash
curl http://localhost:8000/health
```

### 2. تبدیل فایل صوتی به متن
```bash
curl -X POST "http://localhost:8000/transcribe" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@audio_file.mp3" \
  -F "language=fa-IR"
```

### 3. دریافت لیست زبان‌های پشتیبانی شده
```bash
curl http://localhost:8000/languages
```

## پارامترهای API

### POST /transcribe

**پارامترها:**
- `file` (اجباری): فایل صوتی برای تبدیل
- `language` (اختیاری): کد زبان (پیش‌فرض: fa-IR)

**فرمت‌های پشتیبانی شده:**
- MP3 (.mp3)
- WAV (.wav)
- M4A (.m4a)
- OGG (.ogg)
- FLAC (.flac)
- AAC (.aac)
- WebM (.webm)

**حداکثر اندازه فایل:** 50MB

### کدهای زبان

| کد | زبان |
|---|---|
| fa-IR | فارسی |
| en-US | انگلیسی آمریکایی |
| en-GB | انگلیسی بریتانیایی |
| ar | عربی |
| tr | ترکی |
| fr | فرانسوی |
| de | آلمانی |
| es | اسپانیولی |
| ru | روسی |
| zh | چینی |

## نمونه Response

### موفقیت‌آمیز:
```json
{
  "success": true,
  "text": "متن تبدیل شده از فایل صوتی",
  "language": "fa-IR",
  "filename": "audio.mp3",
  "message": "فایل صوتی با موفقیت به متن تبدیل شد"
}
```

### خطا:
```json
{
  "success": false,
  "error": "متأسفانه نتوانستیم محتوای صوتی را تشخیص دهیم",
  "message": "لطفاً کیفیت صوت و وضوح گفتار را بررسی کنید"
}
```

## نکات مهم

1. **کیفیت صوت:** برای نتایج بهتر، از فایل‌های صوتی با کیفیت بالا استفاده کنید
2. **وضوح گفتار:** گفتار واضح و بدون سر و صدای زیاد بهترین نتایج را می‌دهد
3. **طول فایل:** فایل‌های کوتاه‌تر معمولاً نتایج بهتری دارند
4. **اتصال اینترنت:** API به اتصال اینترنت برای Google Speech Recognition نیاز دارد

## عیب‌یابی

### خطای "Couldn't find ffprobe or avprobe" (ویندوز)
این خطای رایج در ویندوز است. راه‌حل‌ها:

**راه‌حل سریع:**
```bash
python fix_ffmpeg.py
```

**راه‌حل دستی:**
```bash
pip install imageio-ffmpeg==0.4.9 --upgrade
pip install python-magic-bin==0.4.14 --upgrade
```

**اگر همچنان مشکل دارید:**
```bash
pip install -r requirements.txt --force-reinstall
```

### خطای "Could not decode audio"
- بررسی کنید ffmpeg نصب باشد (از `python fix_ffmpeg.py` استفاده کنید)
- فرمت فایل صوتی را بررسی کنید
- فایل خراب نباشد
- حجم فایل زیر 50MB باشد

### خطای "Request Error"
- اتصال اینترنت را بررسی کنید
- ممکن است سرویس Google موقتاً در دسترس نباشد

### خطای "Unknown Value"
- کیفیت صوت را بهبود دهید
- سطح صدا را افزایش دهید
- سر و صدای پس‌زمینه را کاهش دهید
- فایل‌های کوتاه‌تر امتحان کنید (کمتر از 1 دقیقه)

## لایسنس

MIT License 