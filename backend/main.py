# backend/main.py
import os
import json
import base64
from dotenv import load_dotenv
from openai import OpenAI
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# 1) Load environment variables from ./backend/.env
load_dotenv()
#    Must contain: OPENAI_API_KEY=<your key>

# 2) Initialize OpenAI client with your secret key
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# 3) Create FastAPI app and enable CORS for your frontend dev server
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # <-- adjust if your frontend runs elsewhere
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------
# Endpoint #1: Image upload → car value
# ----------------------------------------
@app.post("/upload")
async def upload_image(image: UploadFile = File(...)):
    """
    - Reads the uploaded image file
    - Encodes it as a base64 data URL
    - Sends it to OpenAI’s Responses API (gpt-4o)
    - Returns a simple JSON { "value": <text estimate> }
    """
    # a) Read file bytes and convert to data URL
    img_bytes = await image.read()
    b64 = base64.b64encode(img_bytes).decode("utf-8")
    data_url = f"data:{image.content_type};base64,{b64}"

    # b) Call the Chat Completions API
    try:
        chat_resp = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": """
You are a helpful car valuation assistant.
The user will provide an image of a car.
Reply with only a JSON object in this exact format:

{
  "make": string,
  "model": string,
  "year": number,
  "valueRange": string,
  "engine": string,
  "horsepower": number,
  "drivetrain": string,
  "description": string
}
                    """.strip(),
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": data_url, "detail": "low"},
                        }
                    ],
                },
            ],
            temperature=0,
        )

        # c) Extract, parse, and return the model’s JSON response
        text = chat_resp.choices[0].message.content.strip()
        parsed = json.loads(text)
        return JSONResponse(content=parsed)

    except Exception as e:
        # On any error, return a 500 with the detail
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------------------------
# Endpoint #2: Chat proxy → “Find Cars”
# ----------------------------------------
class FindCarsRequest(BaseModel):
    """ Expect a JSON body { "searchTerm": "<make model year>" } """
    searchTerm: str

@app.post("/find-cars")
async def find_cars(req: FindCarsRequest):
    """
    - Receives a searchTerm from the frontend
    - Calls the OpenAI chat completion (gpt-4o-mini)
    - Parses and returns exactly the JSON object the model replies with
    """
    try:
        # 1) Perform the chat completion
        chat_resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                  "role": "system",
                  "content": """
You are a helpful car valuation assistant.
User will provide a car description like "Honda Civic 2024".
Reply with only a JSON object in this exact format:

{
  "make": string,
  "model": string,
  "year": number,
  "valueRange": string,
  "engine": string,
  "horsepower": number,
  "drivetrain": string,
  "description": string
}
                  """.strip()
                },
                {"role": "user", "content": req.searchTerm}
            ],
            temperature=0
        )

        # 2) Extract and parse the model’s JSON response
        text = chat_resp.choices[0].message.content.strip()
        parsed = json.loads(text)

        # 3) Return it directly to the frontend
        return JSONResponse(content=parsed)

    except Exception as e:
        # On any error, return a 500 with the detail
        raise HTTPException(status_code=500, detail=str(e))
