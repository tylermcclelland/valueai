import os
import base64
from dotenv import load_dotenv
from openai import OpenAI
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_image(image: UploadFile = File(...)):
    # 1) Read & encode
    img_bytes = await image.read()
    b64 = base64.b64encode(img_bytes).decode("utf-8")
    data_url = f"data:{image.content_type};base64,{b64}"

    # 2) Send to the Responses API
    resp = client.responses.create(
        model="gpt-4o",
        input=[
            {
                "role": "user",
                "content": [
                    {
                      "type": "input_text",
                      "text": (
                        "Please identify the make, model, and year of this car, "
                        "and give an approximate current market value in USD."
                      )
                    },
                    {"type": "input_image", "image_url": data_url}
                ],
            }
        ],
    )

    # 3) Grab the text answer
    estimate = resp.output_text
    return {"value": estimate}
