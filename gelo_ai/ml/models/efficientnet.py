import torch.nn as nn
from torchvision import models

def get_efficientnet_v2_s(num_classes: int) -> nn.Module:
    """
    Reconstructs an EfficientNetV2-S model with a custom classifier head.
    """
    model = models.efficientnet_v2_s(weights=None)
    
    # The classifier in efficientnet_v2_s is a Sequential:
    # (0): Dropout(p=0.2, inplace=True)
    # (1): Linear(in_features=1280, out_features=1000, bias=True)
    in_features = model.classifier[1].in_features
    model.classifier[1] = nn.Linear(in_features, num_classes)
    
    return model
