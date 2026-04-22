# GELO AI: Model Deployment Workflow

This guide outlines the end-to-end workflow for Data Scientists and System Administrators to integrate a newly trained AI model into the GELO platform.

Because GELO uses a **Name-Driven Architecture**, adding a new model is entirely "Plug-and-Play". You do not need to manually write SQL queries or restart the backend servers to add new diseases.

---

## Phase 1: Preparation (Data Science Team)

When you finish training a new PyTorch model, you need to prepare exactly **3 files**:

### 1. `model.pt`
The exported PyTorch model weights.
- It is highly recommended to export the model using **TorchScript** (`torch.jit.script` or `torch.jit.trace`) for optimal production performance.
- Alternatively, standard PyTorch `state_dict` is supported, provided the architecture matches the supported models (e.g., `efficientnet_v2_s`).

### 2. `labels.json`
This file acts as the dictionary translating the neural network's numerical output back into human-readable medical conditions.
- **CRITICAL:** The `name` field is the absolute source of truth. The Backend will use this exact string (case-insensitive) to auto-sync with the PostgreSQL Database.
- Always use Title Case for consistency (e.g., "Atopic Dermatitis").

**Example `labels.json`:**
```json
{
  "0": {
    "status": "DISEASE",
    "name": "Atopic Dermatitis"
  },
  "1": {
    "status": "DISEASE",
    "name": "Melanoma Skin Cancer"
  },
  "2": {
    "status": "UNKNOWN",
    "name": "Unknown"
  }
}
```

### 3. `config.json`
This file contains the hyper-parameters and initial activation settings for the model.

**Example `config.json`:**
```json
{
  "version": "v2",
  "name": "EfficientNet v2 (Advanced)",
  "architecture": "efficientnet_v2_s",
  "num_classes": 3,
  "input_size": 224,
  "mean": [0.485, 0.456, 0.406],
  "std": [0.229, 0.224, 0.225],
  "inference_threshold": 0.70,
  "enabled_disease_codes": [
    "L20.9",
    "MEL_NEV_MOL"
  ]
}
```

---

## Phase 2: Deployment (System Admin / DevOps)

### Step 1: Create the Package Folder
Navigate to the AI service directory:
`gelo_ai/model_package/`

Create a new folder for your version, for example: `v2`.
Your folder structure MUST look like this:
```text
gelo_ai/
└── model_package/
    ├── v1/
    │   └── ...
    └── v2/
        ├── model.pt
        ├── config.json
        └── labels.json
```

### Step 2: Zero-Downtime Activation via Admin Dashboard
1. Open the **GELO Admin Dashboard** in your browser.
2. Navigate to **AI Settings**.
3. **The Magic Happens Here:** 
   - The backend will instantly detect the `v2` folder.
   - It will read `labels.json` and silently **Auto-Sync** the database. If "Melanoma Skin Cancer" doesn't exist in the Postgres DB, it is automatically created!
4. In the "Active Model Package" section, click on your new `v2` model card.
5. In the "Supported Diseases" section below, you will see exactly the diseases supported by `v2`. Toggle the ones you wish to allow the AI to diagnose.
6. Click **"Save & Hot-Reload AI"**.

**Done!** The AI Service will seamlessly hot-swap the model weights in memory without dropping a single user request. Patients will immediately benefit from the new model.
