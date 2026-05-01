from abc import ABC, abstractmethod
import torch.nn as nn


class BaseModelBuilder(ABC):
    """
    Interface chuẩn cho mọi Model Builder.
    Mọi họ model (Classification, Detection, etc.) phải implement hàm build().
    """

    @abstractmethod
    def build(self, architecture: str, num_classes: int, config: dict = None) -> nn.Module:
        """
        Xây dựng và trả về một PyTorch Module.

        Args:
            architecture: Tên kiến trúc cụ thể (e.g., 'efficientnet_b3', 'yolov8s').
            num_classes: Số lượng lớp đầu ra.
            config: Toàn bộ config.json để builder có thể đọc thêm tham số nếu cần.
        """
        pass
