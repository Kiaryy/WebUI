import os
import base64
import time
from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FILE_PATH_MODEL = "static/models/model1.ply"
PHASE_1_IMAGES_PATH = "static/images/phase_1"
PHASE_2_IMAGES_PATH = "static/images/phase_2"

def read_image_as_bytes(image_path: str):
    with open(image_path, "rb") as img_file:
        return img_file.read()

def encode_bytes_to_base64(byte_data: bytes) -> str:
    """Encodes bytes to a base64 string."""
    return base64.b64encode(byte_data).decode('utf-8')


# Store the start time of the countdown
countdown_start_time: Optional[float] = None

@app.post("/model")
async def serve_models(
    videos: List[UploadFile] = File(...),
    background_tasks: BackgroundTasks = None
):
    global countdown_start_time
    countdown_start_time = time.time()  # Start the countdown
    background_tasks.add_task(simulate_countdown)  # Run countdown in background
    return {"message": f"Received {len(videos)} videos"}

def simulate_countdown():
    # Simulate countdown logic (nothing really needed here)
    time.sleep(15)  # Wait 30 seconds without blocking the main thread

@app.get("/status")
def get_status():
    if countdown_start_time is None:
        return JSONResponse(content={"error": "Countdown has not started"}, status_code=400)
    
    elapsed = time.time() - countdown_start_time

    phase_1_images = {}
    for img in sorted(os.listdir(PHASE_1_IMAGES_PATH)):  # Ordenar imagenes por nombre
        if img.endswith(('jpg', 'png', 'jpeg')):
            img_path = os.path.join(PHASE_1_IMAGES_PATH, img)
            image_bytes = read_image_as_bytes(img_path)
            phase_1_images[img] = encode_bytes_to_base64(image_bytes)

    phase_2_images = {}
    for img in sorted(os.listdir(PHASE_2_IMAGES_PATH)):  # Ordenar imagenes por nombre
        if img.endswith(('jpg', 'png', 'jpeg')):
            img_path = os.path.join(PHASE_2_IMAGES_PATH, img)
            image_bytes = read_image_as_bytes(img_path)
            phase_2_images[img] = encode_bytes_to_base64(image_bytes)

    with open(FILE_PATH_MODEL, "rb") as f1:
        model_bytes = f1.read()
    model_base64 = encode_bytes_to_base64(model_bytes)

    if elapsed >= 15:
        models_response = {
            "phase_1": phase_1_images,
            "phase_2": phase_2_images,
            "model": model_base64
        }
        return JSONResponse(models_response)
    elif elapsed >= 10:
        models_response = {
            "phase_1": phase_1_images,
            "phase_2": phase_2_images
        }
        return JSONResponse(models_response)
    elif elapsed >= 5:
        models_response = {
            "phase_1": phase_1_images
        }
        return JSONResponse(models_response)
    else:
        return {"status": "phase 0"}

