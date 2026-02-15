import sys
import os
import json
import asyncio
import wave  
from pathlib import Path
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from thefuzz import fuzz 

# --- 1. SETUP PATH IMPORT SURAH SPLITTER ---
current_dir = Path(__file__).parent
surah_splitter_src = current_dir / "surah_splitter"
sys.path.append(str(surah_splitter_src))

# =================================================================
# --- HOTFIX: PERBAIKAN PATH DATA QURAN ---
try:
    import surah_splitter.utils.paths as ss_paths
    correct_data_path = current_dir / "data" / "quran_metadata"
    ss_paths.QURAN_METADATA_PATH = correct_data_path
except ImportError:
    pass
# =================================================================

try:
    from surah_splitter.services.transcription_service import TranscriptionService
    from surah_splitter.services.quran_metadata_service import QuranMetadataService
    from surah_splitter.utils.app_logger import logger
except ImportError as e:
    print(f"CRITICAL ERROR: Gagal import modul surah_splitter. {e}")
    sys.exit(1)

# --- 2. CONFIG CPU VPS ---
# MODEL_NAME = "tiny" 
MODEL_NAME = "OdyAsh/faster-whisper-base-ar-quran" 
DEVICE = "cpu"
COMPUTE_TYPE = "int8"

# --- 3. CLASS LOGIKA HAFALAN (SESSION MANAGER) ---
class HafalanSession:
    def __init__(self, target_text: str, quran_service: QuranMetadataService):
        self.quran_service = quran_service
        self.target_words = self.quran_service._clean_text(target_text)
        self.current_index = 0
        self.revealed_indices = []

    def process_transcription(self, transcribed_text: str) -> List[int]:
        if not transcribed_text:
            return []
        
        user_words = self.quran_service._clean_text(transcribed_text)
        new_matches = []
        
        for u_word in user_words:
            if self.current_index >= len(self.target_words):
                break 

            target_word = self.target_words[self.current_index]
            similarity = fuzz.ratio(u_word, target_word)
            
            # PENTING: Saya ubah > 0 menjadi >= 65 agar noise 
            # background tidak membuat ayat jalan otomatis.
            if similarity >= 65: 
                new_matches.append(self.current_index)
                self.current_index += 1

        return new_matches

# --- 4. GLOBAL STATE & LIFESPAN ---
services = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("--- INITIALIZING HAFIZKU BACKEND ---")
    
    ts = TranscriptionService()
    logger.info(f"Loading AI Model: {MODEL_NAME} on {DEVICE}...")
    
    ts.initialize(
        model_name=MODEL_NAME, 
        device=DEVICE, 
        compute_type=COMPUTE_TYPE
    )
    services["transcription"] = ts

    qs = QuranMetadataService()
    qs._load_word_index() 
    services["quran"] = qs
    
    logger.success("All Services Ready! Waiting for Flutter client...")
    yield
    
    logger.info("Shutting down services...")

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
    
    # 1. KONFIGURASI CHUNK AUDIO (16kHz, 16-bit Mono = 32000 bytes/detik)
    PROCESS_THRESHOLD = 64000  # Kumpulkan 2 detik audio
    OVERLAP_BYTES = 32000      # Sisakan 1 detik terakhir untuk konteks
    
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
                    
                    audio_buffer = bytearray()
                    
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
                
                # 2. PROSES JIKA BUFFER SUDAH MENCAPAI 2 DETIK
                if len(audio_buffer) >= PROCESS_THRESHOLD:
                    
                    with wave.open(temp_filename, "wb") as wav_file:
                        wav_file.setnchannels(1)
                        wav_file.setsampwidth(2)
                        wav_file.setframerate(16000)
                        wav_file.writeframes(audio_buffer)
                    
                    # 3. POTONG BUFFER: Buang yang lama, simpan 1 detik terakhir
                    # Ini kunci agar beban CPU tetap stabil ringan!
                    audio_buffer = audio_buffer[-OVERLAP_BYTES:]
                    
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