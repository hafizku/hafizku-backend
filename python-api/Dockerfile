FROM python:3.11-slim-bookworm

WORKDIR /app

# Install dependensi sistem 
RUN apt-get update && apt-get install -y --no-install-recommends \
  ffmpeg \
  git \
  gcc \
  python3-dev \
  pkg-config \
  libavformat-dev \
  libavcodec-dev \
  libavdevice-dev \
  libavutil-dev \
  libswscale-dev \
  libswresample-dev \
  libavfilter-dev \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install PyTorch CPU TERBARU (Mendukung penuh Numpy 2.1+)
RUN pip install --no-cache-dir --upgrade pip && \
  pip install --no-cache-dir torch torchaudio --index-url https://download.pytorch.org/whl/cpu && \
  pip install --no-cache-dir -r requirements.txt

# ==============================================================================
# PENAMBAL AJAIB (MONKEY-PATCHING)
# 1. Menambal pyannote.audio agar tidak memanggil fungsi torchaudio yang sudah dihapus
RUN find /usr/local/lib/python3.11/site-packages/pyannote -type f -name "*.py" -exec sed -i 's/torchaudio\.set_audio_backend/getattr(torchaudio, "set_audio_backend", lambda x: None)/g' {} + && \
  find /usr/local/lib/python3.11/site-packages/pyannote -type f -name "*.py" -exec sed -i 's/torchaudio\.get_audio_backend/getattr(torchaudio, "get_audio_backend", lambda: "soundfile")/g' {} +
# ==============================================================================

COPY surah-splitter /app/surah-splitter

# 2. Menambal surah-splitter untuk error whisperx.types
RUN find /app/surah-splitter -type f -name "*.py" -exec sed -i 's/from whisperx.types import TranscriptionResult/TranscriptionResult = dict/g' {} +

COPY . .

RUN mkdir -p /app/public/recordings && \
  chmod -R 777 /app/public/recordings

EXPOSE 8000

ENV XDG_CACHE_HOME=/app/cache

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]