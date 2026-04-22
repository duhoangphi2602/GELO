from typing import Dict, Type, Any
import logging
import torch.nn as nn
from .efficientnet import get_efficientnet_v2_s

logger = logging.getLogger("model_factory")

class ModelFactory:
    _registry: Dict[str, Any] = {
        "efficientnet_v2_s": get_efficientnet_v2_s
    }

    @classmethod
    def register(cls, name: str, constructor: Any):
        cls._registry[name] = constructor

    @classmethod
    def create(cls, model_type: str, num_classes: int) -> nn.Module:
        if model_type not in cls._registry:
            raise ValueError(f"Unknown model_type: {model_type}. Registered models: {list(cls._registry.keys())}")
        
        logger.info(f"Instantiating model architecture: {model_type} with {num_classes} classes")
        constructor = cls._registry[model_type]
        return constructor(num_classes=num_classes)
