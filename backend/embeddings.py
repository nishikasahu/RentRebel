import torch
from sentence_transformers import SentenceTransformer
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import io
from dotenv import load_dotenv

load_dotenv()

# Load models once at module level
text_model = SentenceTransformer("all-MiniLM-L6-v2")

clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")


def embed_text(text: str) -> list[float]:
    """Embed a text string using sentence-transformers."""
    embedding = text_model.encode(text, convert_to_tensor=False)
    return embedding.tolist()


def embed_image(image_bytes: bytes) -> list[float]:
    """Embed an image using CLIP."""
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    inputs = clip_processor(images=image, return_tensors="pt")
    with torch.no_grad():
        features = clip_model.get_image_features(**inputs)
    # Normalize
    features = features / features.norm(dim=-1, keepdim=True)
    return features.squeeze().tolist()


def embed_text_with_clip(text: str) -> list[float]:
    """Embed text using CLIP text encoder (for cross-modal search)."""
    inputs = clip_processor(text=[text], return_tensors="pt", padding=True)
    with torch.no_grad():
        features = clip_model.get_text_features(**inputs)
    features = features / features.norm(dim=-1, keepdim=True)
    return features.squeeze().tolist()
