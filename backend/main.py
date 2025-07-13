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
from googleapiclient.discovery import build

# Load environment variables
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
SEARCH_ENGINE_ID = os.getenv("SEARCH_ENGINE_ID")

# Initialize clients
client = OpenAI(api_key=OPENAI_API_KEY)
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function for Google Image Search
def fetch_car_images_and_links(query: str, num: int = 4):
    """Fetches car images and their source page links from Google."""
    # Use a more specific query to get commercial-style photos
    smart_query = f'{query} for sale car'
    print(f"DEBUG: Searching Google Images with query: '{smart_query}'")
    try:
        if not GOOGLE_API_KEY or not SEARCH_ENGINE_ID:
            raise ValueError("Google API Key or Search Engine ID is missing.")

        service = build("customsearch", "v1", developerKey=GOOGLE_API_KEY)
        res = service.cse().list(
            q=smart_query,
            cx=SEARCH_ENGINE_ID,
            searchType='image',
            num=num,
            imgSize='LARGE',
            safe='high'
        ).execute()

        items = res.get('items', [])
        print(f"DEBUG: Found {len(items)} images from search.")
        
        if not items:
            raise ValueError("No images found from Google Search.")

        # Extract both image URL and the page URL it came from
        image_data = []
        for item in items:
            image_data.append({
                "imageUrl": item.get('link'),
                "sourceUrl": item.get('image', {}).get('contextLink')
            })
        return image_data
        
    except Exception as e:
        print(f"!!! GOOGLE IMAGE SEARCH ERROR: {e}")
        return []

# The /upload endpoint is not part of this flow, but is kept
@app.post("/upload")
async def upload_image(image: UploadFile = File(...)):
    # ... (code for image upload) ...
    return {"message": "Upload endpoint is not fully implemented for this flow."}

class FindCarsRequest(BaseModel):
    searchTerm: str

@app.post("/find-cars")
async def find_cars(req: FindCarsRequest):
    try:
        chat_resp = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {
                  "role": "system",
                  "content": """
You are a helpful car valuation assistant.
User will provide a car description like "2022 Audi R8".
You must reply with only a JSON object in this exact format. Generate plausible but FAKE data.

- For "priceHistoryMonthly", generate data for the last 12 months with multiple data points.
- For "priceHistoryYearly", generate a history ONLY from the car's manufacturing year up to the current year (2025).

{
  "make": "string",
  "model": "string",
  "year": 2022,
  "valueRange": "string",
  "description": "string",
  "priceHistoryMonthly": [
    { "name": "12m ago", "value": 150000 },
    { "name": "10m ago", "value": 148000 },
    { "name": "8m ago", "value": 147000 },
    { "name": "6m ago", "value": 145000 },
    { "name": "4m ago", "value": 144000 },
    { "name": "2m ago", "value": 143000 },
    { "name": "current", "value": 142000 }
  ],
  "priceHistoryYearly": [
    { "name": "2022", "value": 160000 },
    { "name": "2023", "value": 155000 },
    { "name": "2024", "value": 149000 },
    { "name": "2025", "value": 142000 }
  ],
  "listings": [
    { "id": 1, "title": "2022 Audi R8 Coupe", "price": "$155,900", "mileage": "8,500 miles" },
    { "id": 2, "title": "2022 Audi R8 Spyder", "price": "$162,500", "mileage": "5,200 miles" },
    { "id": 3, "title": "2022 Audi R8 V10", "price": "$158,000", "mileage": "11,000 miles" },
    { "id": 4, "title": "2022 Audi R8 Performance", "price": "$171,000", "mileage": "3,100 miles" }
  ]
}
                  """.strip()
                },
                {"role": "user", "content": req.searchTerm}
            ],
            temperature=0.5
        )
        
        parsed_json = json.loads(chat_resp.choices[0].message.content)

        # Fetch REAL car images and source links from Google
        search_query = f"{parsed_json.get('year')} {parsed_json.get('make')} {parsed_json.get('model')}"
        image_data = fetch_car_images_and_links(search_query, num=4)
        
        # MERGE the AI-generated listings with the real image/link data
        if image_data:
            if 'listings' not in parsed_json:
                parsed_json['listings'] = []

            for i, listing in enumerate(parsed_json.get('listings', [])):
                if i < len(image_data):
                    listing['imageUrl'] = image_data[i].get('imageUrl')
                    listing['sourceUrl'] = image_data[i].get('sourceUrl')
        
        # This key is no longer used by the frontend but kept for potential future use
        parsed_json['imageUrls'] = [item.get('imageUrl') for item in image_data if item.get('imageUrl')]
        
        print(f"DEBUG: Final data sent to frontend: {json.dumps(parsed_json, indent=2)}")
        return JSONResponse(content=parsed_json)

    except Exception as e:
        print(f"!!! MAIN ENDPOINT ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))