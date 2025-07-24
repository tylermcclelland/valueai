import os
import json
import random
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

def fetch_car_images_and_links(query: str, num: int = 4):
    """
    Fetches unique car images, links, AND TITLES.
    """
    print(f"DEBUG: Starting search for unique items for query: '{query}'")
    
    sites_to_search = [
        "cars.com",
        "autotrader.com",
        "cargurus.com",
        "carvana.com",
        "edmunds.com",
        "dupontregistry.com"
    ]
    random.shuffle(sites_to_search)

    image_data = []
    seen_source_urls = set()
    
    try:
        if not GOOGLE_API_KEY or not SEARCH_ENGINE_ID:
            raise ValueError("Google API Key or Search Engine ID is missing.")

        service = build("customsearch", "v1", developerKey=GOOGLE_API_KEY)

        for site in sites_to_search:
            if len(image_data) >= num:
                break

            num_needed = num - len(image_data)
            site_specific_query = f'"{query}" for sale site:{site}'
            print(f"DEBUG: Searching {site} for {num_needed} unique item(s)...")
            
            try:
                res = service.cse().list(
                    q=site_specific_query,
                    cx=SEARCH_ENGINE_ID,
                    searchType='image',
                    num=num_needed,
                    imgSize='LARGE',
                    safe='high',
                    exactTerms=query
                ).execute()

                for item in res.get('items', []):
                    image_url = item.get('link')
                    source_url = item.get('image', {}).get('contextLink')
                    title = item.get('title')
                    
                    if source_url and source_url not in seen_source_urls:
                        image_data.append({
                            "imageUrl": image_url,
                            "sourceUrl": source_url,
                            "title": title
                        })
                        seen_source_urls.add(source_url)
                        print(f"DEBUG: Found a unique item from {site}. Total found: {len(image_data)}")

                    if len(image_data) >= num:
                        break

            except Exception as site_e:
                print(f"!!! SITE SEARCH ERROR for {site}: {site_e}")
                continue
        
        print(f"DEBUG: Finished search. Found a total of {len(image_data)} unique items.")
        return image_data

    except Exception as e:
        print(f"!!! GOOGLE IMAGE SEARCH ERROR: {e}")
        return []


class FindCarsRequest(BaseModel):
    searchTerm: str

@app.post("/find-cars")
async def find_cars(req: FindCarsRequest):
    try:
        # Step 1: Get AI-generated data
        chat_resp = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {
                  "role": "system",
                  "content": """
You are an expert used car valuation AI. Your goal is to provide a realistic market valuation for pre-owned vehicles based on typical market conditions.
You must reply with only a JSON object in this exact format.

- **Your valuation MUST be realistic.** To create the `valueRange`, you MUST consider two scenarios:
  1. The **low end** of the range should represent a model with **higher mileage** (e.g., 50,000-80,000 miles) in average condition.
  2. The **high end** of the range should represent a model with **low mileage** (e.g., 15,000-30,000 miles) in excellent, Certified Pre-Owned (CPO) condition.
- The `description` MUST explain that the value depends heavily on these factors.
- For `priceHistoryYearly`, generate a history ONLY from the car's manufacturing year up to the current year (2025), reflecting realistic depreciation.
{
  "make": "Audi",
  "model": "A8",
  "year": 2019,
  "valueRange": "$28,000 - $45,000",
  "description": "A luxurious full-size sedan. The market value varies significantly based on mileage and condition, from higher-mileage examples to low-mileage Certified Pre-Owned models from dealers.",
  "priceHistoryMonthly": [ { "name": "12", "value": 38000 }, { "name": "11", "value": 37000 }, { "name": "10", "value": 36500 }, { "name": "9", "value": 35000 }, { "name": "8", "value": 34000 }, { "name": "7", "value": 33000 }, { "name": "6", "value": 32000 } ],
  "priceHistoryYearly": [ { "name": "2019", "value": 80000 }, { "name": "2020", "value": 65000 }, { "name": "2021", "value": 55000 }, { "name": "2022", "value": 48000 }, { "name": "2023", "value": 42000 }, { "name": "2024", "value": 37000 }, { "name": "2025", "value": 32000 } ]
}
                  """.strip()
                },
                {"role": "user", "content": req.searchTerm}
            ],
            temperature=0.4
        )
        parsed_json = json.loads(chat_resp.choices[0].message.content)

        # Step 2: Fetch REAL car images, links, AND titles from the web
        search_query = f"{parsed_json.get('year')} {parsed_json.get('make')} {parsed_json.get('model')}"
        image_data = fetch_car_images_and_links(search_query, num=4)
        
        # Step 3: Build listings from REAL data, not AI placeholders
        if image_data:
            new_listings = []
            for item in image_data:
                new_listings.append({
                    "title": item.get("title", f"{search_query} Listing"), # Use the REAL title
                    "imageUrl": item.get("imageUrl"),
                    "sourceUrl": item.get("sourceUrl"),
                    "price": "Click for Price", # Keep as placeholder
                    "mileage": "View Listing for Details" # Keep as placeholder
                })
            # Replace the AI's fake listings with the new, real ones
            parsed_json['listings'] = new_listings
        else:
            # If no images are found, ensure listings is an empty array
            parsed_json['listings'] = []
        
        print(f"DEBUG: Final data sent to frontend: {json.dumps(parsed_json, indent=2)}")
        return JSONResponse(content=parsed_json)

    except Exception as e:
        print(f"!!! MAIN ENDPOINT ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))