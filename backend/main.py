from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from typing import Dict, Optional, List, Union
import openai
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

class YearlyData(BaseModel):
    __root__: Dict[str, Optional[float]]

class RevenueData(BaseModel):
    lots_developed: Dict[str, Optional[float]]
    lots_sold: Dict[str, Optional[float]]
    gross_lot_sales_revenue: Dict[str, Optional[float]]
    avg_revenue_per_front: Dict[str, Optional[float]]
    avg_revenue_per_lot: Dict[str, Optional[float]]
    pod_sales: Dict[str, Optional[float]]
    marketing_fee: Dict[str, Optional[float]]
    other_revenue: Dict[str, Optional[float]]
    total_gross_revenue: Dict[str, Optional[float]]

class ChatMessage(BaseModel):
    message: str
    context: RevenueData

def format_currency(amount: float) -> str:
    return "${:,.2f}".format(amount)

def format_number(num: float) -> str:
    return "{:,.0f}".format(num)

@app.post("/api/revenue-forecast")
async def save_revenue_forecast(data: RevenueData):
    try:
        return {
            "status": "success",
            "message": "Revenue forecast data received successfully",
            "data": data.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/chat")
async def chat_with_data(chat_data: ChatMessage):
    try:
        # Format the financial data for context
        context = "Here is the revenue forecast data:\n"
        
        # Calculate totals for each metric
        totals = {}
        for metric, values in chat_data.context.dict().items():
            total = sum(v for v in values.values() if v is not None)
            totals[metric] = total
            
        # Add totals to context
        context += "\nTotals:\n"
        for metric, total in totals.items():
            formatted_metric = metric.replace('_', ' ').title()
            if 'revenue' in metric.lower() or 'fee' in metric.lower() or 'sales' in metric.lower():
                formatted_value = format_currency(total)
            else:
                formatted_value = format_number(total)
            context += f"- Total {formatted_metric}: {formatted_value}\n"
        
        # Add yearly breakdown
        context += "\nYearly Breakdown:\n"
        years = sorted(next(iter(chat_data.context.dict().values())).keys())
        for year in years:
            context += f"\n{year}:\n"
            for metric, values in chat_data.context.dict().items():
                if year in values and values[year] is not None:
                    formatted_metric = metric.replace('_', ' ').title()
                    value = values[year]
                    if 'revenue' in metric.lower() or 'fee' in metric.lower() or 'sales' in metric.lower():
                        formatted_value = format_currency(value)
                    else:
                        formatted_value = format_number(value)
                    context += f"- {formatted_metric}: {formatted_value}\n"

        # Create the conversation with OpenAI
        messages = [
            {
                "role": "system", 
                "content": """You are a financial analyst assistant. Help analyze revenue forecast data and answer questions about it. 
                When discussing monetary values, always use proper currency formatting with $ and commas.
                Be concise but informative in your responses. Focus on the specific question asked while providing relevant context."""
            },
            {
                "role": "user", 
                "content": f"Here is the context of our revenue forecast data:\n\n{context}\n\nQuestion: {chat_data.message}"
            }
        ]

        response = await openai.ChatCompletion.acreate(
            model="gpt-4",
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )

        return {
            "status": "success",
            "message": response.choices[0].message.content
        }
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")  # Server-side logging
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/revenue-forecast")
async def get_revenue_forecast():
    return {
        "status": "success",
        "data": {}
    }
