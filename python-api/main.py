import sys
import os
import shutil
import json
import asyncio
import wave  # <--- TAMBAHKAN INI
from pathlib import Path
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from thefuzz import fuzz 

# --- 1. SETUP PATH IMPORT SURAH SPLITTER ---
# Mengarahkan python path ke folder src repo surah-splitter
current_dir = Path(__file__).parent
surah_splitter_src = current_dir / "surah_splitter"
sys.path.append(str(surah_splitter_src))

# =================================================================
# --- HOTFIX: PERBAIKAN PATH DATA QURAN ---
# Kita cegah error FileNotFoundError dengan memaksa path /data/ 
# mengarah ke folder yang benar di dalam proyek kita.
try:
    import surah_splitter.utils.paths as ss_paths
    # Paksa path mengarah ke /app/surah-splitter/data/quran_metadata
    correct_data_path = current_dir / "data" / "quran_metadata"
    ss_paths.QURAN_METADATA_PATH = correct_data_path
except ImportError:
    pass
# =================================================================

try:
    # Kita import Service yang sudah ada di repo OdyAsh
    from surah_splitter.services.transcription_service import TranscriptionService
    from surah_splitter.services.quran_metadata_service import QuranMetadataService
    # Kita gunakan logger bawaan repo agar format log konsisten
    from surah_splitter.utils.app_logger import logger
except ImportError as e:
    print(f"CRITICAL ERROR: Gagal import modul surah_splitter. {e}")
    sys.exit(1)

# --- 2. CONFIG CPU VPS ---
# Gunakan model 'tiny' agar real-time di CPU. 
# Model default repo ini 'base', itu terlalu berat untuk real-time stream di CPU.
MODEL_NAME = "tiny" 
DEVICE = "cpu"
COMPUTE_TYPE = "int8"

# --- 3. CLASS LOGIKA HAFALAN (SESSION MANAGER) ---
class HafalanSession:
    """
    Mengatur logika pencocokan kata per kata untuk satu sesi user.
    """
    def __init__(self, target_text: str, quran_service: QuranMetadataService):
        self.quran_service = quran_service
        # Gunakan fungsi clean_text dari QuranMetadataService agar standar text-nya sama
        # Fungsi ini mengembalikan List[str], misal: ['بسم', 'الله', ...]
        self.target_words = self.quran_service._clean_text(target_text)
        self.current_index = 0 # Kata ke berapa yang sedang ditunggu
        self.revealed_indices = []

    def process_transcription(self, transcribed_text: str) -> List[int]:
        """
        Mencocokkan transkripsi user dengan kata target selanjutnya.
        Return: List index kata yang berhasil ditebak (untuk di-reveal di Flutter).
        """
        if not transcribed_text:
            return []
        
        # Bersihkan input user dengan standar yang sama
        user_words = self.quran_service._clean_text(transcribed_text)
        new_matches = []
        
        # Logika Greedy Forward Matching
        # Kita cek kata-kata dari user, apakah cocok dengan kata target saat ini?
        for u_word in user_words:
            if self.current_index >= len(self.target_words):
                break # Ayat sudah selesai

            target_word = self.target_words[self.current_index]
            
            # Gunakan Fuzzy Ratio (0-100) untuk toleransi kesalahan transkripsi AI
            similarity = fuzz.ratio(u_word, target_word)
            
            # Threshold 75 cukup bagus untuk toleransi dialek/transkripsi 'tiny' model
            if similarity > 0:
                new_matches.append(self.current_index)
                self.current_index += 1
            else:
                # Opsi: Cek kata berikutnya (skip logic) jika user melompat kata (bisa ditambahkan nanti)
                pass

        return new_matches

# --- 4. GLOBAL STATE & LIFESPAN ---
# Menyimpan instance service agar tidak diload ulang tiap request
services = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("--- INITIALIZING HAFIZKU BACKEND ---")
    
    # 1. Init Transcription Service (WhisperX wrapper)
    # Kita hijack TranscriptionService dari repo untuk load model yang kita mau
    ts = TranscriptionService()
    logger.info(f"Loading AI Model: {MODEL_NAME} on {DEVICE}...")
    
    # Initialize akan mendownload model jika belum ada
    ts.initialize(
        model_name=MODEL_NAME, 
        device=DEVICE, 
        compute_type=COMPUTE_TYPE
    )
    services["transcription"] = ts

    # 2. Init Quran Metadata Service
    qs = QuranMetadataService()
    # Pre-load index agar cepat saat request pertama
    qs._load_word_index() 
    services["quran"] = qs
    
    logger.success("All Services Ready! Waiting for Flutter client...")
    yield
    
    logger.info("Shutting down services...")
    # Clean up GPU memory logic ada di __del__ TranscriptionService, aman.

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 5. WEBSOCKET ENDPOINT ---
@app.websocket("/ws/realtime-hafalan")
async def websocket_hafalan(websocket: WebSocket):
    await websocket.accept()
    
    session: Optional[HafalanSession] = None
    audio_buffer = bytearray()
    
    # 1. TAMBAHKAN VARIABEL INI UNTUK MENGINGAT UKURAN TERAKHIR
    last_processed_size = 0  
    
    # Proses AI setiap kali ada tambahan audio 1 detik (32000 bytes)
    PROCESS_THRESHOLD = 32000 
    
    temp_filename = f"temp_stream_{os.urandom(4).hex()}.wav"

    try:
        transcriber: TranscriptionService = services["transcription"]
        quran_service: QuranMetadataService = services["quran"]

        while True:
            message = await websocket.receive()

            if "text" in message:
                data = json.loads(message["text"])
                
                if data.get("action") == "configure":
                    surah = int(data.get("surah"))
                    ayah_list_nums = data.get("ayahs") 
                    
                    _, _, ayah_texts = quran_service.get_ayahs(
                        surah_number=surah, 
                        ayah_numbers=ayah_list_nums
                    )
                    
                    full_target_text = " ".join(ayah_texts)
                    session = HafalanSession(full_target_text, quran_service)
                    
                    # 2. RESET BUFFER DAN MARKER SAAT MULAI AYAT BARU
                    audio_buffer = bytearray()
                    last_processed_size = 0
                    
                    response = {
                        "status": "ready",
                        "total_words": len(session.target_words),
                        "words_structure": session.target_words 
                    }
                    logger.success(response)
                    await websocket.send_json(response)

            elif "bytes" in message:
                if not session:
                    continue
                
                chunk = message["bytes"]
                audio_buffer.extend(chunk)
                
                # 3. CEK APAKAH ADA TAMBAHAN DATA BARU (Bukan cek ukuran total)
                if len(audio_buffer) - last_processed_size >= PROCESS_THRESHOLD:
                    # Update marker ukuran terakhir yang diproses
                    last_processed_size = len(audio_buffer)
                    
                    # Simpan SELURUH isi buffer dari awal user bicara agar kata tidak terpotong
                    with wave.open(temp_filename, "wb") as wav_file:
                        wav_file.setnchannels(1)
                        wav_file.setsampwidth(2)
                        wav_file.setframerate(16000)
                        wav_file.writeframes(audio_buffer)
                    
                    # Proses AI
                    try:
                        result = transcriber.wx_trans_model.transcribe(
                            temp_filename, 
                            batch_size=1, 
                            language="ar"
                        )
                        
                        transcribed_text = " ".join([seg["text"] for seg in result.get("segments", [])])

                        
                        logger.success(transcribed_text)
                        await websocket.send_json({
                                    "status": "partial",
                                    "text": transcribed_text
                                })

        
                        if transcribed_text.strip():
                            new_indices = session.process_transcription(transcribed_text)
                            
                            if new_indices:
                                
                                await websocket.send_json({
                                    "status": "match",
                                    "action": "reveal",
                                    "indices": new_indices,
                                    "text": transcribed_text
                                })
                                
                                if session.current_index >= len(session.target_words):
                                    await websocket.send_json({
                                        "status": "completed", 
                                        "message": "MashaAllah! Hafalan Selesai."
                                    })
                    except Exception as e:
                        logger.error(f"Error proses AI: {e}")

                    # 4. SANGAT PENTING: JANGAN PERNAH ME-RESET audio_buffer DI SINI
                    # Hapus baris "audio_buffer = bytearray()" jika sebelumnya ada di bagian ini.
                    
    except WebSocketDisconnect:
        logger.info("Client disconnected")
    except Exception as e:
        logger.exception(f"WebSocket Error: {e}")
    finally:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

@app.get("/")
def health_check():
    return {"status": "Hafizku Realtime Backend (Powered by Surah-Splitter)", "model": MODEL_NAME}