from pathlib import Path

from ultralytics import YOLO


ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "person_model_bin"
MODEL_NAME = "yolo11n.pt"


def main() -> None:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model = YOLO(MODEL_NAME)
    exported = model.export(format="onnx", imgsz=640, opset=12, simplify=True)
    exported_path = Path(exported)
    target = MODEL_DIR / "model.onnx"
    pt_target = MODEL_DIR / "model.pt"

    if exported_path.resolve() != target.resolve():
        target.write_bytes(exported_path.read_bytes())

    source_pt = Path(MODEL_NAME)
    if source_pt.exists() and source_pt.resolve() != pt_target.resolve():
        pt_target.write_bytes(source_pt.read_bytes())

    print(f"Exported COCO person ONNX model to {target}")


if __name__ == "__main__":
    main()
