from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
from PIL import Image
import io
import os
import tensorflow as tf
# VGG19 전용 전처리 함수 임포트
from tensorflow.keras.applications.vgg19 import preprocess_input

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 모델 구조정의 ---
def build_model():
    # VGG19 베이스 모델 (설계도)
    base_model = tf.keras.applications.VGG19(
        include_top=False,
        pooling='max',
        input_shape=(224, 224, 3)
    )

    # 레이어 구조
    model = tf.keras.models.Sequential([
        base_model,
        tf.keras.layers.Dense(4096, activation='relu'),
        tf.keras.layers.Dropout(0.3),
        tf.keras.layers.Dense(100, activation='relu'),
        tf.keras.layers.Dense(1, activation='sigmoid')
    ])
    return model

# --- 모델 생성 및 가중치 로드 ---
model = None
try:
    # 현재 실행 중인 main.py 파일의 절대 경로 가져옴
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

    # 파일명: 'tire_vgg19_model.h5'로 설정
    # main.py와 같은 폴더에 있다면 아래 코드가 가장 정확합니다.
    weights_path = os.path.join(BASE_DIR, 'tire_vgg19_model.h5')

    # 만약 models 폴더 안에 파일이 따로 있을때 수정
    # weights_path = os.path.join(BASE_DIR, 'models', 'tire_vgg19_model.h5')

    model = build_model()
    model.load_weights(weights_path)
    print(f"VGG19 AI 모델 로드 성공! (경로: {weights_path})")
except Exception as e:
    print(f"모델 로드 실패: {e}")
    print("tire_vgg19_model.h5 파일이 main.py와 같은 폴더에 있는지 확인해주세요.")

# ---이미지 전처리 함수 ---
def preprocess_image(image_bytes):
    # 컬러(RGB) 모드로 변환
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    # VGG19 요구 규격 224x224 리사이징
    image = image.resize((224, 224))
    img_array = np.array(image, dtype=np.float32)
    # 차원 확장 (1, 224, 224, 3)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)

    return img_array

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if model is None:
        return {"error": "모델이 로드되지 않았습니다. 서버 로그를 확인해주세요."}

    try:
        contents = await file.read()
        input_data = preprocess_image(contents)

        # ---추론 실행 ---
        prediction = model.predict(input_data)
        raw_score = float(prediction[0][0])
        print(f"\n[VGG19 정밀 분석] AI 원본 Score: {raw_score}")

        # 판정 로직 :지수에 따라 상태 분류
        if raw_score > 0.8:
            result_label = "정상"
            message = "타이어 상태가 아주 양호합니다!"
        elif raw_score > 0.4:
            result_label = "주의"
            message = "미세한 마모가 의심됩니다. 점검해보세요."
        else:
            result_label = "교체 권장"
            message = "타이어 마모가 심각합니다! 즉시 교체하세요."

        return {
            "status": result_label,
            "score": raw_score,
            "message": message
        }
    except Exception as e:
        print(f"추론 에러: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)