# Definisikan platform default
FROM python:3.11-slim

WORKDIR /app

# Install dependensi sistem (git & ffmpeg wajib)
RUN apt-get update && apt-get install -y --no-install-recommends \
  ffmpeg \
  git \
  gcc \
  python3-dev \
  && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# --- BAGIAN INI DIPERBAIKI ---
# 1. Update pip
# 2. HAPUS install numpy manual (biarkan requirements.txt yang handle)
# 3. Install Torch CPU dulu agar ringan
# 4. Install sisa dependensi
RUN pip install --no-cache-dir --upgrade pip && \
  pip install --no-cache-dir torch torchaudio --index-url https://download.pytorch.org/whl/cpu && \
  pip install --no-cache-dir -r requirements.txt

# Copy folder surah-splitter (PENTING)
COPY surah_splitter /app/surah_splitter
COPY data /app/data
COPY one_off_scripts /app/one_off_scripts

# Copy source code sisanya
COPY . .

# Buat folder recordings
RUN mkdir -p /app/public/recordings && \
  chmod -R 777 /app/public/recordings

EXPOSE 8000

# Cache folder
ENV XDG_CACHE_HOME=/app/cache

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]