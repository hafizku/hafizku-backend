import os
import asyncio
import json
import numpy as np
import logging
import re
import difflib
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from faster_whisper import WhisperModel  # <--- Pindah ke faster-whisper
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
from huggingface_hub import login

app = FastAPI()

load_dotenv()

# Ambil token dari environment variable
token = os.getenv("HF_TOKEN")
if token:
    login(token=token)

# ------------------------------------------------
# 1) LOAD FASTER-WHISPER MODEL
# ------------------------------------------------
# Menggunakan versi faster-whisper untuk performa maksimal
MODEL_ID = "OdyAsh/faster-whisper-base-ar-quran" 

# Deteksi Device
import torch
if torch.cuda.is_available():
    device = "cuda"
    compute_type = "float16" # Atau "int8_float16" untuk lebih hemat VRAM
    print("🚀 Menggunakan GPU NVIDIA (CUDA) via Faster-Whisper")
else:
    device = "cpu"
    compute_type = "int8"
    print("🐌 Menggunakan CPU (Optimized with int8)")

# Inisialisasi Model
# beam_size dan silero_vad bisa diatur di sini atau saat transcribe
model = WhisperModel(MODEL_ID, device=device, compute_type=compute_type)

print("✅ Faster-Whisper Model siap digunakan")

# ------------------------------------------------
# 2) AUDIO CONFIG
# ------------------------------------------------
SAMPLE_RATE = 16000
WINDOW_SECONDS = 1.6
OVERLAP_SECONDS = 0.6
WINDOW_SIZE = int(SAMPLE_RATE * WINDOW_SECONDS)
OVERLAP_SIZE = int(SAMPLE_RATE * OVERLAP_SECONDS)
SILENCE_THRESHOLD = 0.015

executor = ThreadPoolExecutor(max_workers=4) # Faster-whisper efisien dengan multi-threading

# ------------------------------------------------
# 3) NORMALIZATION HELPERS (Tetap Sama)
# ------------------------------------------------
ARABIC_DIACRITICS = re.compile(r"[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED]")

def normalize_arabic(text: str) -> str:
    text = text.strip()
    text = ARABIC_DIACRITICS.sub("", text)
    text = re.sub("[إأٱآا]", "ا", text)
    text = re.sub("[ؤ]", "و", text)
    text = re.sub("[ئ]", "ي", text)
    text = re.sub("ة", "ه", text)
    text = re.sub("[^\u0600-\u06FF\s]", " ", text)
    return re.sub("\s+", " ", text).strip()

def tokenize_words(text: str) -> List[str]:
    t = normalize_arabic(text)
    return t.split() if t else []

# ------------------------------------------------
# 4) WORD ALIGNMENT ENGINE (Tetap Sama)
# ------------------------------------------------
class WordAlignmentEngine:
    def __init__(self, target_text: str, match_threshold=65.0):
        self.target_text = target_text
        self.target_words = tokenize_words(target_text)
        self.match_threshold = match_threshold
        self.current_index = 0
        self.last_sent = -1

    def feed(self, asr_text: str):
        events = []
        preds = tokenize_words(asr_text)
        for p in preds:
            if self.current_index >= len(self.target_words): break
            
            expected = self.target_words[self.current_index]
            score = difflib.SequenceMatcher(None, p, expected).ratio() * 100
            
            if score >= self.match_threshold:
                idx = self.current_index
                self.current_index += 1
                if idx != self.last_sent:
                    events.append({
                        "event": "word_correct",
                        "index": idx,
                        "text": p,
                        "expected": expected,
                        "score": score
                    })
                    self.last_sent = idx
                events.append({"event": "progress", "current_index": self.current_index, "total": len(self.target_words)})
            else:
                events.append({"event": "word_unmatched", "text": p, "expected": expected, "score": score})
        return events

DEFAULT_TARGET = "قالوا سبحانك لا علم لنا الا ما علمتنا انك انت العليم الحكيم"

# ------------------------------------------------
# 5) WEBSOCKET SERVER (Updated for Faster-Whisper)
# ------------------------------------------------
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    print("📡 Client connected")

    engine = WordAlignmentEngine(DEFAULT_TARGET)
    await ws.send_json({"event": "init_ok", "target_len": len(engine.target_words)})

    audio_buffer = np.array([], dtype=np.float32)
    loop = asyncio.get_event_loop()

    try:
        while True:
            msg = await ws.receive()
            if "bytes" in msg:
                data = msg["bytes"]
                chunk = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0
                audio_buffer = np.concatenate((audio_buffer, chunk))

                if len(audio_buffer) >= WINDOW_SIZE:
                    audio_slice = audio_buffer[-WINDOW_SIZE:]
                    
                    # # Simple VAD
                    # rms = np.sqrt(np.mean(audio_slice**2))
                    # if rms < SILENCE_THRESHOLD:
                    #     audio_buffer = audio_buffer[-OVERLAP_SIZE:]
                    #     continue

                    try:
                        # Fungsi transkripsi untuk executor
                        def transcribe_sync(audio):
                            # language="ar" mengunci bahasa agar tidak melompat ke bahasa lain
                            # beam_size=5 meningkatkan akurasi
                            segments, _ = model.transcribe(
                                audio, 
                                language="ar", 
                                beam_size=5,
                                vad_filter=True,
                                # vad_parameters=dict(min_silence_duration_ms=1000),
                                initial_prompt=DEFAULT_TARGET # Memberi konteks Quran
                            )
                            return "".join([s.text for s in segments]).strip()

                        # Jalankan transkripsi di thread pool agar tidak memblokir websocket
                        text = await loop.run_in_executor(executor, transcribe_sync, audio_slice)

                        if text:
                            await ws.send_json({"event": "transcript_partial", "text": text})
                            for ev in engine.feed(text):
                                await ws.send_json(ev)

                    except asyncio.TimeoutError:
                        print("⚠️ Warning: Proses AI terlalu lama (Timeout), skip chunk ini.")
                        # Jangan di-raise errornya, biarkan loop lanjut
                    except Exception as e:
                        print(f"⚠️ Transcription Error: {e}")

                    audio_buffer = audio_buffer[-OVERLAP_SIZE:]

    except WebSocketDisconnect:
        print("❌ Client Disconnected")