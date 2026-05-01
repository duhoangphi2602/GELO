from typing import Dict
import gc
import logging
import torch
import torch.nn as nn
from .base_builder import BaseModelBuilder
from .builders import ClassificationBuilder

logger = logging.getLogger("model_factory")


class ModelFactory:
    """
    Quản lý tập trung các Builder.
    Routing dựa trên trường task_type trong config.json (strict routing).
    """

    _builders: Dict[str, BaseModelBuilder] = {
        "classification": ClassificationBuilder(),
        # "object_detection": DetectionBuilder(),  # Tương lai
    }

    @classmethod
    def create(cls, model_type: str, num_classes: int, config: dict = None) -> nn.Module:
        """
        Khởi tạo model dựa trên task_type từ config.

        Args:
            model_type: Tên kiến trúc cụ thể (e.g., 'efficientnet_b3').
            num_classes: Số lượng lớp đầu ra.
            config: Toàn bộ config.json, dùng để đọc task_type.
        """
        # Strict Routing: Đọc task_type từ config, mặc định classification
        task_type = "classification"
        if config and isinstance(config, dict):
            task_type = config.get("task_type", "classification")

        if task_type not in cls._builders:
            raise ValueError(
                f"task_type '{task_type}' không được hỗ trợ. "
                f"Các task có sẵn: {list(cls._builders.keys())}"
            )

        logger.info(f"Routing model_type='{model_type}' via task_type='{task_type}'")
        builder = cls._builders[task_type]
        return builder.build(architecture=model_type, num_classes=num_classes, config=config)

    @staticmethod
    def clear_memory():
        """Giải phóng bộ nhớ GPU/RAM khi chuyển đổi model."""
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            logger.info("GPU memory cache cleared.")
        logger.info("Memory cleanup completed.")
