# FROM python:3.11-slim
# WORKDIR /app
# RUN apt-get update && \
#   apt-get install -y ffmpeg && \
#   rm -rf /var/lib/apt/lists/*
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt
# COPY serviceAccountKey.json .
# COPY . .
# EXPOSE 8000
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]




# Definisikan platform default jika tidak diisi
# ARG PLATFORM=linux/amd64
# FROM --platform=${PLATFORM} python:3.11-slim

FROM python:3.11-slim

WORKDIR /app

# Install dependensi sistem yang dibutuhkan (ffmpeg untuk audio, gcc untuk kompilasi library)
RUN apt-get update && apt-get install -y --no-install-recommends \
  ffmpeg \
  gcc \
  python3-dev \
  && rm -rf /var/lib/apt/lists/*

# Optimasi Cache: Copy requirements dulu
COPY requirements.txt .

# 1. Update pip
# 2. Install NumPy versi stabil < 2.0 (Solusi error X86_V2)
# 3. Install Torch versi CPU agar size image tidak membengkak (2GB -> 300MB)
# 4. Install sisa dependensi
RUN pip install --no-cache-dir --upgrade pip && \
  pip install --no-cache-dir "numpy<2.0.0" && \
  # pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu && \
  pip install --no-cache-dir -r requirements.txt

# Copy seluruh source code
COPY . .

# Pastikan folder recordings ada dengan izin yang benar
RUN mkdir -p /app/public/recordings

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]