# Model Package Template

Hướng dẫn tạo model package mới cho hệ thống GELO AI.

## Cấu trúc bắt buộc

Mỗi phiên bản model phải nằm trong thư mục `model_package/vN/` và chứa đúng 3 file:

```
model_package/
├── v1/
│   ├── config.json    ← Cấu hình kỹ thuật
│   ├── labels.json    ← Bản đồ ánh xạ output → bệnh
│   └── model.pt       ← Trọng số mô hình (TorchScript hoặc state_dict)
```

---

## config.json — Quy tắc bắt buộc

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `version` | string | ✅ | Tên phiên bản, phải khớp với tên thư mục (e.g., `"v3"`) |
| `name` | string | ✅ | Tên hiển thị cho người dùng (e.g., `"Skin Model v3"`) |
| `task_type` | string | ✅ | Loại nhiệm vụ AI. Giá trị hợp lệ: `"classification"`, `"object_detection"` (tương lai) |
| `architecture` | string | ✅ | Tên kiến trúc theo chuẩn `timm` (e.g., `"efficientnet_b3"`, `"resnet50"`, `"vit_base_patch16_224"`) |
| `num_classes` | integer | ✅ | Số lượng output classes của model. **Phải khớp** với số entry bệnh trong `labels.json` |
| `input_size` | integer | ✅ | Kích thước ảnh đầu vào (pixels). Ảnh sẽ được resize về NxN |
| `mean` | array[3] | ✅ | Giá trị trung bình RGB để chuẩn hóa ảnh (ImageNet: `[0.485, 0.456, 0.406]`) |
| `std` | array[3] | ✅ | Độ lệch chuẩn RGB để chuẩn hóa ảnh (ImageNet: `[0.229, 0.224, 0.225]`) |
| `inference_threshold` | float | ✅ | Ngưỡng tin cậy tối thiểu (0.0 - 1.0). Dưới ngưỡng → UNKNOWN |
| `enabled_disease_codes` | array[string] | ✅ | Danh sách mã ICD được kích hoạt. Chỉ các mã này được trả về kết quả |

### Ví dụ config.json hợp lệ:
```json
{
  "version": "v3",
  "name": "Skin Diagnostic v3 (Eczema Specialist)",
  "task_type": "classification",
  "architecture": "efficientnet_b3",
  "num_classes": 2,
  "input_size": 300,
  "mean": [0.485, 0.456, 0.406],
  "std": [0.229, 0.224, 0.225],
  "inference_threshold": 0.7,
  "enabled_disease_codes": ["L20.9"]
}
```

### Tên kiến trúc phổ biến (timm):
- `efficientnet_v2_s`, `efficientnet_b0` → `efficientnet_b7`
- `resnet18`, `resnet34`, `resnet50`, `resnet101`
- `vit_base_patch16_224`, `vit_small_patch16_224`
- `convnext_tiny`, `convnext_small`, `convnext_base`

---

## labels.json — Quy tắc bắt buộc

| Quy tắc | Mô tả |
|---------|-------|
| **Key = Output Index** | Key phải là string của chỉ số output model (`"0"`, `"1"`, `"2"`, ...) |
| **Số lượng entry** | Số entry bệnh (không tính `"-1"`) **phải bằng** `num_classes` trong config |
| **Entry `-1` bắt buộc** | Luôn phải có entry `"-1"` cho trường hợp UNKNOWN |
| **Mỗi entry phải có** | `id` (int), `code` (string), `status` (string), `name` (string) |

### Giá trị `status` hợp lệ:
- `"DISEASE"` — Bệnh lý cần chẩn đoán
- `"UNKNOWN"` — Không xác định bệnh (dùng cho entry `-1` và các class "Other")

> ⚠️ **KHÔNG BAO GIỜ** sử dụng `"NORMAL"`, `"HEALTHY"`, hay `"OTHER"`. Chỉ có 2 status: `DISEASE` và `UNKNOWN`.
> Nếu model có class "Other" (không thuộc bệnh nào), map nó thành `UNKNOWN`.

### Ví dụ labels.json hợp lệ (Binary: 2 classes — Disease vs Other):
```json
{
  "0": {
    "id": 1,
    "code": "L20.9",
    "status": "DISEASE",
    "name": "Atopic Dermatitis"
  },
  "1": {
    "id": 0,
    "code": "UNKNOWN",
    "status": "UNKNOWN",
    "name": "Unknown"
  },
  "-1": {
    "id": 0,
    "code": "UNKNOWN",
    "status": "UNKNOWN",
    "name": "Unknown"
  }
}
```

### Ví dụ labels.json hợp lệ (Multi-class: 4 classes):
```json
{
  "0": { "id": 1, "code": "L20.9", "status": "DISEASE", "name": "Atopic Dermatitis" },
  "1": { "id": 2, "code": "D18.0", "status": "DISEASE", "name": "Vascular Tumors" },
  "2": { "id": 3, "code": "MEL_NEV_MOL", "status": "DISEASE", "name": "Melanoma Skin Cancer" },
  "3": { "id": 4, "code": "L10", "status": "DISEASE", "name": "Bullous Disease" },
  "-1": { "id": 0, "code": "UNKNOWN", "status": "UNKNOWN", "name": "Unknown" }
}
```

---

## model.pt — Quy tắc lưu trọng số

### Cách lưu khuyến nghị (TorchScript):
```python
import torch
scripted_model = torch.jit.script(model)
scripted_model.save("model_package/v3/model.pt")
```

### Cách lưu thay thế (state_dict):
```python
torch.save(model.state_dict(), "model_package/v3/model.pt")
```

> **Lưu ý**: Nếu lưu dưới dạng state_dict, model phải được train bằng kiến trúc `timm`
> để đảm bảo tên các layer khớp 100% khi load lại.

---

## Checklist trước khi deploy model mới

- [ ] `config.json` có đầy đủ tất cả các trường bắt buộc
- [ ] `version` trong config khớp với tên thư mục
- [ ] `task_type` được set đúng (`"classification"`)
- [ ] `architecture` là tên hợp lệ trong thư viện `timm`
- [ ] `num_classes` khớp với tổng số entry ở index `>= 0` trong labels.json
- [ ] `labels.json` có entry `"-1"` (UNKNOWN) làm sentinel
- [ ] Chỉ sử dụng status `"DISEASE"` hoặc `"UNKNOWN"` (không dùng NORMAL, HEALTHY, OTHER)
- [ ] `enabled_disease_codes` chỉ chứa các code có status `"DISEASE"` trong labels.json
- [ ] `model.pt` tồn tại và load được
