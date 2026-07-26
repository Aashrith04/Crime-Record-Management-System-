import re
import math
from typing import List, Dict

def tokenize(text: str) -> List[str]:
    return re.findall(r'\w+', text.lower())

def cosine_similarity_words(text1: str, text2: str) -> float:
    words1 = set(tokenize(text1))
    words2 = set(tokenize(text2))
    if not words1 or not words2:
        return 0.0
    intersection = words1.intersection(words2)
    return len(intersection) / (math.sqrt(len(words1)) * math.sqrt(len(words2)))

def extract_keywords(text: str) -> List[str]:
    words = tokenize(text)
    stopwords = {"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "is", "was", "were", "this", "that"}
    keywords = [w for w in words if len(w) > 3 and w not in stopwords]
    return list(dict.fromkeys(keywords))[:10]

def text_to_vector_lightweight(text: str) -> List[float]:
    """Generates a 64-dimensional lightweight semantic embedding vector."""
    vector = [0.0] * 64
    for char in text.lower():
        idx = ord(char) % 64
        vector[idx] += 1.0
    norm = math.sqrt(sum(v * v for v in vector))
    if norm > 0:
        vector = [v / norm for v in vector]
    return vector

def dot_product_vectors(vec1: List[float], vec2: List[float]) -> float:
    if len(vec1) != len(vec2):
        return 0.0
    return sum(v1 * v2 for v1, v2 in zip(vec1, vec2))
