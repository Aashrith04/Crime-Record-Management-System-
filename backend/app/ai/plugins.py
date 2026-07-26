from abc import ABC, abstractmethod
from typing import Any, Dict, List

class AIPluginInterface(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def version(self) -> str:
        pass

    @abstractmethod
    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        pass

class PluginManager:
    _plugins: Dict[str, AIPluginInterface] = {}

    @classmethod
    def register_plugin(cls, plugin: AIPluginInterface):
        cls._plugins[plugin.name] = plugin

    @classmethod
    def get_plugin(cls, name: str) -> AIPluginInterface:
        return cls._plugins.get(name)

    @classmethod
    def list_plugins(cls) -> List[str]:
        return list(cls._plugins.keys())
