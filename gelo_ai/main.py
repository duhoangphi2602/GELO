from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import random
import time

app = FastAPI(title="Gelo AI Service", version="1.0")

class PredictRequest(BaseModel):
    image_url: str
    scan_id: int

class PredictResponse(BaseModel):
    disease_id: int
    confidence: float
    model_version: str
    message: str

@app.post("/ai/predict", response_model=PredictResponse)
async def predict_disease(request: PredictRequest):
    # =======================================================
    # GIAI ĐOẠN 1: MOCKING (HIỆN TẠI)
    # =======================================================
    # Giả vờ độ trễ xử lý của mô hình AI là 1.5 giây
    time.sleep(1.5)
    
    # Trả về kết quả giả lập
    mock_disease_id = random.choice([1, 2, 3, 4]) 
    mock_confidence = 0.0 # Default to 0 instead of random high values

    return PredictResponse(
        disease_id=mock_disease_id,
        confidence=mock_confidence,
        model_version="v1.0-mock",
        message="Image analysis complete"
    )

    # =======================================================
    # GIAI ĐOẠN 2: TÍCH HỢP PYTORCH/TENSORFLOW (TƯƠNG LAI)
    # =======================================================
    # HƯỚNG DẪN: Xóa toàn bộ Giai đoạn 1 ở trên và thay bằng luồng sau
    """
    try:
        # Nhập thư viện (import torch, torchvision...)
        # 1. Tải ảnh từ: request.image_url
        
        # 2. Tiền xử lý (Resize về 224x224, Chuẩn hóa Normalize Tensor)
        # tensor_image = preprocess_image(downloaded_image)
        
        # 3. Phân tích qua Model
        # with torch.no_grad():
        #     output = my_trained_model(tensor_image)
        #     disease_id, confidence = decode_output(output)
        
        return PredictResponse(
            disease_id=disease_id,
            confidence=confidence,
            model_version="v2.0-pytorch",
            message="Real AI analysis complete"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    """
