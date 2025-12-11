"""
BO5: News Credibility Classification Endpoint
Classifies Premier League news articles into 4 credibility tiers using Naive Bayes
"""
from fastapi import APIRouter, HTTPException, status, Query
from typing import Dict
import pandas as pd

from app.schemas.responses import NewsCredibilityResponse, NewsTierProbability
from app.core.model_loader import load_naive_bayes_news_classifier
from pathlib import Path

DATA_PATH = Path(__file__).parent.parent / 'data' / 'processed' / 'pl_news.csv'

router = APIRouter()

TIER_DESCRIPTIONS = {
    1: "Official sources (BBC, ESPN, official club statements, verified journalists)",
    2: "Reliable sports journalists and reputable sports outlets",
    3: "Tabloids, sports blogs, and sensationalist coverage",
    4: "Social media posts, unverified sources, and user-generated content"
}

TIER_LABELS = {
    1: "Tier 1 - Official Source",
    2: "Tier 2 - Reliable Journalist",
    3: "Tier 3 - Tabloid/Blog",
    4: "Tier 4 - Social Media"
}


@router.post("/classify-news", response_model=NewsCredibilityResponse)
async def classify_news_credibility(
    title: str = Query(..., description="Article title to classify"),
    text: str = Query(..., description="Article text content")
):
    """
    Classify a Premier League news article's credibility tier
    
    **Model**: Multinomial Naive Bayes Text Classifier (64% test accuracy)
    
    **Tiers**:
    - **Tier 1 (57% recall)**: Official sources - BBC, official clubs
    - **Tier 2 (68% recall)**: Reliable sports journalists
    - **Tier 3 (72% recall)**: Tabloids - sensationalist language detected
    - **Tier 4 (43% recall)**: Social media - informal writing
    
    **Input**: Article title and text
    
    **Output**: Predicted tier (1-4) + probabilities for each tier
    """
    try:
        model_data = load_naive_bayes_news_classifier()
        
        model = model_data.get('model')
        vectorizer = model_data.get('vectorizer')
        metadata = model_data.get('metadata', {})
        
        if not model or not vectorizer:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="News classifier model or vectorizer not loaded"
            )
        
        # Combine title and text for classification
        combined_text = f"{title} {text}"
        
        # Vectorize the text
        X = vectorizer.transform([combined_text])
        
        # Predict tier - model.classes_ is [1, 2, 3, 4] (1-indexed)
        prediction = model.predict(X)[0]
        probabilities_array = model.predict_proba(X)[0]
        
        # prediction is already 1-indexed (1, 2, 3, or 4)
        predicted_tier = int(prediction)
        
        # But probabilities_array is 0-indexed, so use (prediction - 1) to access it
        confidence = float(probabilities_array[int(prediction) - 1])
        
        # Create probability mapping (0-3 index to tier 1-4)
        tier_probs = {
            f"tier_{i+1}": float(probabilities_array[i])
            for i in range(4)
        }
        
        return NewsCredibilityResponse(
            title=title,
            predicted_tier=predicted_tier,
            tier_label=TIER_LABELS.get(predicted_tier, "Unknown"),
            confidence=confidence,
            probabilities=NewsTierProbability(
                tier_1=tier_probs.get("tier_1", 0.0),
                tier_2=tier_probs.get("tier_2", 0.0),
                tier_3=tier_probs.get("tier_3", 0.0),
                tier_4=tier_probs.get("tier_4", 0.0)
            ),
            credibility_description=TIER_DESCRIPTIONS.get(predicted_tier, "Unknown")
        )
    
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid input: {str(ve)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Classification failed: {str(e)}"
        )


@router.get("/model-info/bo5")
async def get_bo5_model_info():
    """Get BO5 Naive Bayes news classifier model information"""
    try:
        model_data = load_naive_bayes_news_classifier()
        metadata = model_data.get('metadata', {})
        
        return {
            "business_objective": "News Credibility Classification",
            "algorithm": "Multinomial Naive Bayes",
            "features": metadata.get('features', ["TF-IDF vectorization (unigrams + bigrams)"]),
            "tiers": {
                1: "Official sources (57% recall)",
                2: "Reliable journalists (68% recall)",
                3: "Tabloids (72% recall)",
                4: "Social media (43% recall)"
            },
            "performance": {
                "test_accuracy": 0.64,
                "best_tier": "Tier 3 (Tabloids)",
                "best_tier_recall": 0.72,
                "training_samples": 278
            },
            "version": metadata.get('version', "1.0"),
            "dataset_info": {
                "total_articles": 278,
                "total_sources": 47,
                "tier_distribution": {
                    "tier_1": 55,
                    "tier_2": 81,
                    "tier_3": 116,
                    "tier_4": 26
                }
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load model info: {str(e)}"
        )
