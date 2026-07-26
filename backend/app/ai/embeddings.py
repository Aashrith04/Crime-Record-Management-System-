from abc import ABC, abstractmethod
from typing import List
from app.ai.utils import text_to_vector_lightweight

class EmbeddingProviderInterface(ABC):
    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        pass

class LightweightEmbeddingProvider(EmbeddingProviderInterface):
    def embed_text(self, text: str) -> List[float]:
        return text_to_vector_lightweight(text)

class EmbeddingFactory:
    @staticmethod
    def get_provider(provider_type: str = "lightweight") -> EmbeddingProviderInterface:
        return LightweightEmbeddingProvider()
