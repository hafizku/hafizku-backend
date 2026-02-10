import os
import asyncio
import json
import numpy as np
import logging
import re
import difflib
import io  # <--- Baru: Untuk buffer file
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from faster_whisper import WhisperModel
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
from huggingface_hub import login

# --- LIBRARY BARU UNTUK SAVE AUDIO ---
from pydub import AudioSegment
import logging

app = FastAPI()

load_dotenv()

# Konfigurasi logging agar muncul di terminal Docker
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

STORAGE_PATH = "/app/public/recordings"
# Pastikan folder ada saat aplikasi start
os.makedirs(STORAGE_PATH, exist_ok=True)

# ------------------------------------------------
# 1) LOAD FASTER-WHISPER MODEL
# ------------------------------------------------
token = os.getenv("HF_TOKEN")
if token:
    login(token=token)

MODEL_ID = "OdyAsh/faster-whisper-base-ar-quran" 

import torch
if torch.cuda.is_available():
    device = "cuda"
    compute_type = "float16"
    logger.info("🚀 Menggunakan GPU NVIDIA (CUDA)")
else:
    device = "cpu"
    compute_type = "int8"
    logger.info("🐌 Menggunakan CPU")

model = WhisperModel(MODEL_ID, device=device, compute_type=compute_type)
logger.info("✅ Faster-Whisper Model siap")

# ------------------------------------------------
# 2) AUDIO CONFIG
# ------------------------------------------------
SAMPLE_RATE = 16000
WINDOW_SECONDS = 1.6
OVERLAP_SECONDS = 0.6
WINDOW_SIZE = int(SAMPLE_RATE * WINDOW_SECONDS)
OVERLAP_SIZE = int(SAMPLE_RATE * OVERLAP_SECONDS)
SILENCE_THRESHOLD = 0.015

# Executor untuk AI dan File Processing
executor = ThreadPoolExecutor(max_workers=4) 

# ------------------------------------------------
# 3) HELPER FUNCTIONS
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
                events.append({"event": "word_unmatched", "index": self.current_index, "text": p, "expected": expected, "score": score})
        return events

DEFAULT_TARGET = "بسم الله الرحمن الرحيم"

# ------------------------------------------------
# 4) SAVE TO FIREBASE FUNCTION (BARU)
# ------------------------------------------------
def process_and_upload_audio(raw_buffer: io.BytesIO, user_id: str, key: str):
    logger.info(f"DEBUG: Saving to Local Disk for User: {user_id}")

    try:
        # 1. Siapkan Folder User
        user_folder = os.path.join(STORAGE_PATH, user_id)
        os.makedirs(user_folder, exist_ok=True)

        raw_buffer.seek(0) # Reset pointer ke awal
        # Cek apakah ada data audio
        data = raw_buffer.read()
        if len(data) < 1000: # Kalau audio terlalu pendek (< 0.1 detik), skip
            logger.info("⚠️ Audio terlalu pendek, tidak disimpan.")
            return

        
        logger.info(f"💾 Memproses audio untuk User: {user_id}, Key: {key}...")
        
        # 1. Load Raw Audio menggunakan Pydub
        # Asumsi Flutter mengirim: 16kHz, 16-bit (2 bytes), Mono (1 channel)
        audio_segment = AudioSegment(
            data=data,
            sample_width=2, 
            frame_rate=SAMPLE_RATE, 
            channels=1
        )

        # 3. Simpan File (Ganti : jadi _ biar aman)
        key_safe = key.replace(":", "_")
        safe_filename = f"{user_id}_{key_safe}.m4a"
        file_full_path = os.path.join(user_folder, safe_filename)
        
        # Export langsung ke file
        audio_segment.export(file_full_path, format="mp4", bitrate="64k")
     
        
        logger.info(f"✅ File tersimpan di: {file_full_path}")
        
        # Return URL (tidak dipakai logic websocket, tapi bagus untuk debug)
        return f"{safe_filename}"

    except Exception as e:
        logger.info(f"❌ Gagal Simpan Local: {e}")

# ------------------------------------------------
# 5) WEBSOCKET SERVER
# ------------------------------------------------
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    logger.info("📡 Client connected")

    # Metadata untuk penyimpanan file
    meta_user_id = "unknown"
    meta_key = "0:0"

    should_save = False
    
    current_target_text = DEFAULT_TARGET
    engine = None

    # --- PHASE 1: INITIALIZATION ---
    try:
        init_msg = await ws.receive_json()
        
        if "target_text" in init_msg:
            current_target_text = init_msg["target_text"]
            
            # AMBIL METADATA DARI FLUTTER (BARU)
            meta_user_id = init_msg["user_id"]
            meta_key = init_msg["key"]

            logger.info(f"📝 Init User: {meta_user_id} | key: {meta_key}")
            
            engine = WordAlignmentEngine(current_target_text)
            
            await ws.send_json({
                "event": "init_ok", 
                "message": "Ready to record",
                "target_len": len(engine.target_words)
            })
        else:
            await ws.send_json({"event": "error", "message": "Missing 'target_text'"})
            await ws.close()
            return

    except Exception as e:
        logger.info(f"❌ Error Init: {e}")
        await ws.close()
        return

    # --- PHASE 2: AUDIO LOOP ---
    
    # Buffer 1: Untuk AI (Numpy Float32)
    ai_buffer = np.array([], dtype=np.float32)
    
    # Buffer 2: Untuk File Save (BytesIO RAW PCM) <--- BARU
    full_audio_buffer = io.BytesIO()

    loop = asyncio.get_event_loop()

    try:
        while True:
            msg = await ws.receive()
            
            # Handle Binary Data (Audio Stream)
            if "bytes" in msg:
                raw_bytes = msg["bytes"]
                
                # 1. Simpan Raw Bytes untuk file akhir
                full_audio_buffer.write(raw_bytes) 
                
                # 2. Proses untuk AI (Convert ke Float32)
                chunk = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0
                ai_buffer = np.concatenate((ai_buffer, chunk))

                # Logic Windowing AI (Sama seperti sebelumnya)
                if len(ai_buffer) >= WINDOW_SIZE:
                    audio_slice = ai_buffer[-WINDOW_SIZE:]
                    
                    try:
                        def transcribe_sync(audio):
                            segments, _ = model.transcribe(
                                audio, 
                                language="ar", 
                                beam_size=5,
                                vad_filter=True,
                                initial_prompt=DEFAULT_TARGET
                            )
                            return "".join([s.text for s in segments]).strip()

                        text = await loop.run_in_executor(executor, transcribe_sync, audio_slice)

                        if text:
                            await ws.send_json({"event": "transcript_partial", "text": text})
                            for ev in engine.feed(text):
                                await ws.send_json(ev)

                    except Exception as e:
                        logger.info(f"⚠️ Transcription Error: {e}")

                    ai_buffer = ai_buffer[-OVERLAP_SIZE:]
            
            # Handle Text Data (Misal perintah STOP manual)
            elif "text" in msg:
                try:
                    data = json.loads(msg["text"])
                    
                    # 2. JIKA MENERIMA SINYAL FINISH
                    if data.get("event") == "finish":
                        logger.info(f"🛑 Sinyal FINISH diterima dari {meta_user_id}. Menandai untuk disimpan.")
                        
                        # Ubah status jadi BOLEH SIMPAN
                        should_save = True 
                        
                        # Keluar dari loop -> Otomatis masuk ke 'finally'
                        break 
                        
                except Exception:
                    pass

    except WebSocketDisconnect:
        logger.info(f"🔌 Client Disconnected ({meta_user_id}) - Saving Audio...")
                
    except Exception as e:
        logger.info(f"❌ Unexpected Error: {e}")

    # --- PERUBAHAN UTAMA DI SINI ---
    finally:
        
        
        # Cek apakah ada data yang terekam
        if should_save and full_audio_buffer.getbuffer().nbytes > 0:
            logger.info(f"🏁 Sesi Berakhir ({meta_user_id}) - Memulai Proses Save...")
            # Jalankan save di background thread
            loop.run_in_executor(
                executor, 
                process_and_upload_audio, 
                full_audio_buffer, 
                meta_user_id, 
                meta_key
            )
        else:
            # Jika putus koneksi atau buffer kosong
            logger.info("🗑️ Data audio dibuang (Tidak ada sinyal finish atau buffer kosong).")
            full_audio_buffer.close() # Bersihkan memori








# import os
# import asyncio
# import json
# import numpy as np
# import logging
# import re
# import difflib
# import io
# import collections # <-- WAJIB: Untuk Deque (Ring Buffer)
# from typing import List
# from fastapi import FastAPI, WebSocket, WebSocketDisconnect
# from faster_whisper import WhisperModel
# from concurrent.futures import ThreadPoolExecutor
# from dotenv import load_dotenv
# from huggingface_hub import login
# from pydub import AudioSegment
# import torch # <-- WAJIB: Untuk setting thread

# # --- OPTIMASI 1: Batasi Penggunaan Core CPU ---
# # Agar Torch tidak serakah memakan semua resource yang dibutuhkan Websocket
# torch.set_num_threads(1)

# app = FastAPI()
# load_dotenv()

# logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
# logger = logging.getLogger(__name__)

# STORAGE_PATH = "/app/public/recordings"
# os.makedirs(STORAGE_PATH, exist_ok=True)

# # ------------------------------------------------
# # 1) LOAD MODEL (OPTIMIZED)
# # ------------------------------------------------
# token = os.getenv("HF_TOKEN")
# if token:
#     login(token=token)

# MODEL_ID = "OdyAsh/faster-whisper-base-ar-quran" 

# if torch.cuda.is_available():
#     device = "cuda"
#     compute_type = "float16"
#     logger.info("🚀 Menggunakan GPU NVIDIA")
# else:
#     device = "cpu"
#     # OPTIMASI 2: Ganti int8 ke float32 jika di VPS lama kadang lebih stabil/cepat
#     # Tapi int8 defaultnya hemat RAM. Kita tetapkan int8 dulu.
#     compute_type = "int8"
#     logger.info("🐌 Menggunakan CPU (Optimized Mode)")

# # cpu_threads=4 agar proses transcribe lebih ngebut
# model = WhisperModel(MODEL_ID, device=device, compute_type=compute_type, cpu_threads=4)
# logger.info("✅ Faster-Whisper Model siap")

# # ------------------------------------------------
# # 2) AUDIO CONFIG
# # ------------------------------------------------
# SAMPLE_RATE = 16000
# WINDOW_SECONDS = 1.6
# OVERLAP_SECONDS = 0.6
# WINDOW_SIZE = int(SAMPLE_RATE * WINDOW_SECONDS)
# OVERLAP_SIZE = int(SAMPLE_RATE * OVERLAP_SECONDS)

# # Executor
# executor = ThreadPoolExecutor(max_workers=2) # Turunkan worker agar tidak overhead

# # ------------------------------------------------
# # 3) HELPER FUNCTIONS (Sama)
# # ------------------------------------------------
# ARABIC_DIACRITICS = re.compile(r"[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED]")

# def normalize_arabic(text: str) -> str:
#     text = text.strip()
#     text = ARABIC_DIACRITICS.sub("", text)
#     text = re.sub("[إأٱآا]", "ا", text)
#     text = re.sub("[ؤ]", "و", text)
#     text = re.sub("[ئ]", "ي", text)
#     text = re.sub("ة", "ه", text)
#     text = re.sub("[^\u0600-\u06FF\s]", " ", text)
#     return re.sub("\s+", " ", text).strip()

# def tokenize_words(text: str) -> List[str]:
#     t = normalize_arabic(text)
#     return t.split() if t else []

# class WordAlignmentEngine:
#     def __init__(self, target_text: str, match_threshold=65.0):
#         self.target_text = target_text
#         self.target_words = tokenize_words(target_text)
#         self.match_threshold = match_threshold
#         self.current_index = 0
#         self.last_sent = -1

#     def feed(self, asr_text: str):
#         events = []
#         preds = tokenize_words(asr_text)
#         for p in preds:
#             if self.current_index >= len(self.target_words): break
#             expected = self.target_words[self.current_index]
#             score = difflib.SequenceMatcher(None, p, expected).ratio() * 100
#             if score >= self.match_threshold:
#                 idx = self.current_index
#                 self.current_index += 1
#                 if idx != self.last_sent:
#                     events.append({
#                         "event": "word_correct",
#                         "index": idx,
#                         "text": p,
#                         "expected": expected,
#                         "score": score
#                     })
#                     self.last_sent = idx
#                 events.append({"event": "progress", "current_index": self.current_index, "total": len(self.target_words)})
#             else:
#                 events.append({"event": "word_unmatched", "index": self.current_index, "text": p, "expected": expected, "score": score})
#         return events

# DEFAULT_TARGET = "بسم الله الرحمن الرحيم"

# # ------------------------------------------------
# # 4) SAVE FUNCTION (OPTIMIZED)
# # ------------------------------------------------
# def process_and_upload_audio(raw_data: bytes, user_id: str, key: str):
#     # Terima raw_data (bytes) langsung, bukan buffer object untuk menghindari race condition
#     logger.info(f"DEBUG: Saving to Local Disk for User: {user_id}")
#     try:
#         user_folder = os.path.join(STORAGE_PATH, user_id)
#         os.makedirs(user_folder, exist_ok=True)

#         if len(raw_data) < 1000: return

#         logger.info(f"💾 Converting audio for User: {user_id}...")
        
#         # Load langsung dari bytes
#         audio_segment = AudioSegment(
#             data=raw_data,
#             sample_width=2, 
#             frame_rate=SAMPLE_RATE, 
#             channels=1
#         )

#         key_safe = key.replace(":", "_")
#         safe_filename = f"{user_id}_{key_safe}.m4a"
#         file_full_path = os.path.join(user_folder, safe_filename)
        
#         audio_segment.export(file_full_path, format="mp4", bitrate="64k")
#         logger.info(f"✅ File Saved: {file_full_path}")
#         return f"{safe_filename}"

#     except Exception as e:
#         logger.info(f"❌ Save Error: {e}")

# # ------------------------------------------------
# # 5) WEBSOCKET SERVER
# # ------------------------------------------------
# @app.websocket("/ws")
# async def websocket_endpoint(ws: WebSocket):
#     await ws.accept()
    
#     meta_user_id = "unknown"
#     meta_key = "0:0"
#     should_save = False
#     engine = None

#     # --- PHASE 1: INITIALIZATION ---
#     try:
#         init_msg = await ws.receive_json()
#         if "target_text" in init_msg:
#             current_target_text = init_msg["target_text"]
#             meta_user_id = init_msg.get("user_id", "anon")
#             meta_key = init_msg.get("key", "0:0")
#             engine = WordAlignmentEngine(current_target_text)
            
#             await ws.send_json({"event": "init_ok", "message": "Ready"})
#         else:
#             await ws.close()
#             return
#     except Exception:
#         await ws.close()
#         return

#     # --- PHASE 2: AUDIO LOOP (OPTIMIZED) ---
    
#     # OPTIMASI 3: Gunakan Ring Buffer (Deque) 
#     # Jangan pakai np.concatenate yang bikin memory leak & lambat!
#     # Buffer ini hanya menyimpan data float32 terakhir (misal max 5 detik) untuk AI
#     max_maxlen = int(SAMPLE_RATE * 5) # Simpan max 5 detik di memori geser
#     ai_ring_buffer = collections.deque(maxlen=max_maxlen) 
    
#     # Buffer untuk Save File (Bytearray lebih ringan dari IOBytes)
#     full_audio_bytes = bytearray()

#     loop = asyncio.get_event_loop()

#     try:
#         while True:
#             msg = await ws.receive()
            
#             if "bytes" in msg:
#                 raw_bytes = msg["bytes"]
                
#                 # 1. Append ke buffer file (cepat, O(1))
#                 full_audio_bytes.extend(raw_bytes)
                
#                 # 2. Convert ke Float32 & masukkan ke Ring Buffer
#                 # Kita tidak perlu menyimpan "semua" audio di ai_buffer, cukup window terakhir
#                 chunk = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0
#                 ai_ring_buffer.extend(chunk)

#                 # Cek apakah data di ring buffer cukup untuk window
#                 if len(ai_ring_buffer) >= WINDOW_SIZE:
#                     # Ambil window terakhir dari deque dan convert ke numpy (cepat)
#                     # Convert deque ke list lalu ke numpy array jauh lebih cepat daripada np.concatenate berulang
#                     audio_slice = np.array(list(ai_ring_buffer))[-WINDOW_SIZE:]
                    
#                     try:
#                         # OPTIMASI 4: Fungsi Transcribe Super Ringan
#                         def transcribe_sync():
#                             # BEAM_SIZE = 1 adalah KUNCI kecepatan di VPS
#                             segments, _ = model.transcribe(
#                                 audio_slice, 
#                                 language="ar", 
#                                 beam_size=1, # <--- UBAH DARI 5 KE 1
#                                 best_of=1,   # <--- Keep it simple
#                                 vad_filter=True,
#                                 initial_prompt=DEFAULT_TARGET
#                             )
#                             return "".join([s.text for s in segments]).strip()

#                         text = await loop.run_in_executor(executor, transcribe_sync)

#                         if text:
#                             await ws.send_json({"event": "transcript_partial", "text": text})
#                             for ev in engine.feed(text):
#                                 await ws.send_json(ev)

#                     except Exception as e:
#                         logger.error(f"Transcrip Error: {e}")

#                     # Tidak perlu memotong ai_buffer manual karena deque otomatis membuang data lama
            
#             elif "text" in msg:
#                 # ... (Logika text handling sama)
#                 try:
#                     data = json.loads(msg["text"])
#                     if data.get("event") == "finish":
#                         should_save = True 
#                         break 
#                 except: pass

#     except WebSocketDisconnect:
#         logger.info(f"🔌 Disconnected: {meta_user_id}")
#     except Exception as e:
#         logger.error(f"❌ Error: {e}")
#     finally:
#         # --- PHASE 3: SAVE (Non-Blocking) ---
#         if should_save and len(full_audio_bytes) > 0:
#             logger.info("🏁 Saving in background...")
#             # Copy data bytes agar buffer bisa di-clear
#             final_data = bytes(full_audio_bytes)
            
#             # Fire and forget di background thread
#             loop.run_in_executor(
#                 executor, 
#                 process_and_upload_audio, 
#                 final_data, 
#                 meta_user_id, 
#                 meta_key
#             )
        
#         # Cleanup memory
#         del full_audio_bytes
#         del ai_ring_buffer