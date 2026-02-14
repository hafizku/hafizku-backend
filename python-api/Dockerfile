# Definisikan platform default
FROM python:3.11-slim

WORKDIR /app

# Install dependensi sistem 
RUN apt-get update && apt-get install -y --no-install-recommends \
  ffmpeg \
  git \
  gcc \
  python3-dev \
  && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Dependencies (Urutan ini penting agar Numpy 2.0 tidak menyusup)
RUN pip install --no-cache-dir --upgrade pip && \
  pip install --no-cache-dir torch torchaudio --index-url https://download.pytorch.org/whl/cpu && \
  pip install --no-cache-dir "numpy==1.26.4" && \
  pip install --no-cache-dir -r requirements.txt

# Copy folder surah-splitter
COPY surah_splitter /app/surah_splitter

# --- PATCH OTOMATIS (MENGATASI ERROR WHISPERX.TYPES) ---
# Docker akan otomatis mencari dan menambal kode surah-splitter yang error
RUN find /app/surah_splitter -type f -name "*.py" -exec sed -i 's/from whisperx.types import TranscriptionResult/TranscriptionResult = dict/g' {} +
# --------------------------------------------------------

# Copy source code sisanya
COPY . .

# Buat folder recordings
RUN mkdir -p /app/public/recordings && \
  chmod -R 777 /app/public/recordings

EXPOSE 8000

ENV XDG_CACHE_HOME=/app/cache

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]