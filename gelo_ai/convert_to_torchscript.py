import os
import torch
import logging
from ml.model_loader import load_model_package

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger("conversion")

def convert():
    version = "v1"
    base_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model_package", version)
    model_path = os.path.join(base_dir, "model.pt")
    backup_path = os.path.join(base_dir, "model.pt.bak")

    if not os.path.exists(model_path):
        logger.error(f"Model file not found at {model_path}")
        return

    # 1. Backup old model
    if not os.path.exists(backup_path):
        logger.info(f"Creating backup of the old model weights: {backup_path}")
        with open(model_path, 'rb') as src, open(backup_path, 'wb') as dst:
            dst.write(src.read())

    # 2. Load model (this uses the current ModelPackage logic to reconstruct architecture)
    logger.info("Loading model using the existing ModelPackage framework...")
    package = load_model_package(version=version)
    
    if package.model == "mock":
        logger.error("Failed to load real model weights. Cannot convert.")
        return

    model = package.model
    device = package.device
    model.to(device)
    model.eval()

    # 3. Convert to TorchScript (Scripting)
    logger.info("Converting to TorchScript (scripting)...")
    try:
        # We use script instead of trace for general stability with EfficientNet
        scripted_model = torch.jit.script(model)
        
        # 4. Save the new TorchScript model
        logger.info(f"Saving TorchScript model to {model_path}...")
        scripted_model.save(model_path)
        
        logger.info("✅ Conversion successful! The model is now in TorchScript format.")
        logger.info("The AI service will now load this model significantly faster and without warnings.")
    except Exception as e:
        logger.error(f"❌ Conversion failed: {e}")
        # Restore from backup if save happened and failed? 
        # Actually save happens at the end, so no need to restore unless we feel like it.

if __name__ == "__main__":
    convert()
