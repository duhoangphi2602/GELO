import logging
import timm
import torch.nn as nn
from ..base_builder import BaseModelBuilder

logger = logging.getLogger("classification_builder")


class ClassificationBuilder(BaseModelBuilder):
    """
    Builder cho tất cả model phân loại ảnh (Classification).
    Sử dụng thư viện timm để hỗ trợ hàng ngàn kiến trúc.
    """

    def build(self, architecture: str, num_classes: int, config: dict = None) -> nn.Module:
        """
        Khởi tạo model phân loại bằng timm.

        Args:
            architecture: Tên kiến trúc timm (e.g., 'efficientnet_b3', 'resnet50', 'vit_base_patch16_224').
            num_classes: Số lượng lớp phân loại.
            config: Config bổ sung (chưa sử dụng, dự phòng cho tương lai).
        """
        if not timm.is_model(architecture):
            available = timm.list_models(f"*{architecture}*")
            raise ValueError(
                f"Kiến trúc '{architecture}' không được timm hỗ trợ. "
                f"Các model tương tự: {available[:5]}"
            )

        logger.info(f"Building classification model: {architecture} with {num_classes} classes via timm")
        model = timm.create_model(architecture, pretrained=False, num_classes=num_classes)
        return model
