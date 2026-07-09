from functools import lru_cache
from pathlib import Path
import joblib
from .labels import LABEL_DISPLAY

MODEL_PATH = Path(__file__).resolve().parent / "model" / "activity_classifier.joblib"
MODEL_VERSION = "tfidf-logreg-v1"

@lru_cache(maxsize=1)
def load_model():
    if not MODEL_PATH.exists():
        return None
    return joblib.load(MODEL_PATH)

def predict_activity(title: str, description: str = ""):
    text = " ".join(part.strip() for part in (title, description) if part and part.strip())
    if not text:
        raise ValueError("Text is required.")
    model = load_model()
    if model is None:
        raise RuntimeError("Classifier model is not available. Run ml/src/train.py.")
    probabilities = model.predict_proba([text])[0]
    classes = model.classes_
    ranked = sorted(zip(classes, probabilities), key=lambda item: item[1], reverse=True)
    top = ranked[0]
    return {
        "text": text,
        "suggested_category": top[0],
        "display_name": LABEL_DISPLAY[top[0]],
        "confidence": round(float(top[1]), 4),
        "confidence_band": "HIGH" if top[1] >= .80 else "MEDIUM" if top[1] >= .55 else "LOW",
        "alternatives": [
            {"category": label, "display_name": LABEL_DISPLAY[label], "confidence": round(float(score), 4)}
            for label, score in ranked[1:4]
        ],
        "model_version": MODEL_VERSION,
    }
