import os
import torch
from ml.model_loader import load_model_package
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("export_onnx")

def export_to_onnx(version="v1", output_path="model.onnx"):
    package = load_model_package(version=version)
    if not package.model or package.model == "mock":
        logger.error("Failed to load model. Ensure model.pt exists in the package.")
        return

    model = package.model
    model.eval()

    # Get input size from config or use default
    input_size = package.config.get("input_size", [3, 224, 224])
    if isinstance(input_size, int):
        input_shape = (1, 3, input_size, input_size)
    else:
        input_shape = (1, *input_size)

    logger.info(f"Exporting model to ONNX with input shape {input_shape}...")

    # Create dummy input
    dummy_input = torch.randn(*input_shape, device=package.device)

    # Export
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=11,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}}
    )

    logger.info(f"Model successfully exported to {output_path}")

if __name__ == "__main__":
    output_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "model_package", "v1", "model.onnx")
    export_to_onnx(version="v1", output_path=output_file)
