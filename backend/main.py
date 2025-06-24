from dotenv import load_dotenv

load_dotenv()

import os
from fastapi import FastAPI, File, UploadFile
import openai

app = FastAPI()
openai.api_key = os.getenv("OPENAI_API_KEY") 

@app.post("/upload")
async def upload(image: UploadFile = File(...)):

    img_bytes = await image.read()

    response = openai.ChatCompletion.create(
        model="gpt-4o",  
        messages=[
          {
            "role": "user",
            "content": (
              "Please identify the make, model, and year of this car, "
              "and give an approximate current market value in USD."
            )
          }
        ],
        files=[{
          "file": img_bytes,
          "filename": image.filename,
          "purpose": "vision"
        }]
    )

    answer = response.choices[0].message.content

    return { "estimate": answer }
