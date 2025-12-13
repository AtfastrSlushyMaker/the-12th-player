"""
BO5: News Credibility Classification Endpoint
Classifies Premier League news articles into 4 credibility tiers using Ensemble Voting Classifier
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
    
    **Model**: VotingClassifier Ensemble (4 classifiers) - 76.8% test accuracy
    
    **Architecture**: 
    - MultinomialNB, ComplementNB, LogisticRegression, LinearSVC with soft voting
    
    **Tiers**:
    - **Tier 1 (79% recall)**: Official sources - BBC, official clubs, verified statements
    - **Tier 2 (69% recall)**: Reliable sports journalists and professional outlets
    - **Tier 3 (45% recall)**: Tabloids - sensationalist language, speculation
    - **Tier 4 (87% recall)**: Social media - unverified sources, rumors
    
    **Input**: Article title and text (combined for analysis)
    
    **Output**: Predicted tier (1-4) + confidence + probabilities for each tier
    """
    try:
        model_package = load_naive_bayes_news_classifier()
        
        ensemble_model = model_package.get('ensemble_model')
        vectorizer = model_package.get('vectorizer')
        preprocessor = model_package.get('preprocessor')
        
        if not ensemble_model or not vectorizer or not preprocessor:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="News classifier model components not fully loaded"
            )
        
        # Combine title and text for classification
        combined_text = f"{title} {text}"
        
        # Preprocess the text (clean, lemmatize, add style features)
        processed_texts = preprocessor.transform([combined_text])
        
        # Vectorize using FeatureUnion (word-level + char-level TF-IDF)
        X = vectorizer.transform(processed_texts)
        
        # Predict tier using ensemble voting
        # Tiers are 1-indexed: [1, 2, 3, 4]
        prediction = ensemble_model.predict(X)[0]
        probabilities_array = ensemble_model.predict_proba(X)[0]
        
        # prediction is already 1-indexed (1, 2, 3, or 4)
        predicted_tier = int(prediction)
        
        # probabilities_array is 0-indexed [p1, p2, p3, p4], so use (prediction - 1)
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
    """Get BO5 Ensemble News Classifier model information and performance metrics"""
    try:
        model_package = load_naive_bayes_news_classifier()
        
        return {
            "business_objective": "News Credibility Classification - Identify trustworthiness of Premier League news",
            "algorithm": "VotingClassifier Ensemble (4 models with soft voting)",
            "ensemble_components": [
                "MultinomialNB (weight: 1.0)",
                "ComplementNB (weight: 1.3) - favored for imbalanced classes",
                "LogisticRegression (weight: 1.1)",
                "LinearSVC with probability calibration (weight: 0.9)"
            ],
            "features": {
                "vectorizer": "FeatureUnion combining:",
                "word_level": "TF-IDF (4000 features, 1-3 grams, words)",
                "char_level": "TF-IDF (2000 features, 3-5 grams, characters)",
                "preprocessing": "Lemmatization, stopword removal, style feature extraction"
            },
            "tier_labels": {
                1: "Most Credible - Official sources",
                2: "Reliable - Professional journalism",
                3: "Mixed - Tabloids with speculation",
                4: "Least Credible - Social media/rumors"
            },
            "performance": {
                "test_accuracy": 0.768,
                "cv_accuracy": 0.755,
                "per_tier": {
                    "tier_1": {"precision": 0.79, "recall": 0.79, "f1": 0.79},
                    "tier_2": {"precision": 0.65, "recall": 0.69, "f1": 0.67},
                    "tier_3": {"precision": 0.75, "recall": 0.45, "f1": 0.56},
                    "tier_4": {"precision": 0.83, "recall": 0.87, "f1": 0.85}
                }
            },
            "training_info": {
                "total_samples": 841,
                "test_samples": 211,
                "training_date": model_package.get('training_date', '2024-12-13'),
                "tier_distribution": {
                    "tier_1": 195,
                    "tier_2": 220,
                    "tier_3": 276,
                    "tier_4": 150
                }
            },
            "version": "2.0 (Ensemble) - Upgraded from Multinomial NB",
            "limitations": [
                "Better at identifying extreme credibility (T1 and T4) vs middle tiers",
                "Tier 3 (tabloid) recall is lower - some misclassified as Tier 2",
                "Limited by training data bias towards certain sources",
                "Style features may not work for neutral headlines without sensationalism"
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load model info: {str(e)}"
        )
