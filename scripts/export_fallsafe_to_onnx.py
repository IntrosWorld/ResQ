from pathlib import Path

from ultralytics import YOLO


ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "fallsafe_model_bin"
PT_PATH = MODEL_DIR / "model.pt"


def main() -> None:
    if not PT_PATH.exists():
        raise SystemExit(
            f"Missing {PT_PATH}. Download model/model.pt from https://github.com/FallSafe/FallSafe-yolo11 first."
        )

    model = YOLO(str(PT_PATH))
    exported = model.export(format="onnx", imgsz=640, opset=12, simplify=True)
    exported_path = Path(exported)
    target = MODEL_DIR / "model.onnx"

    if exported_path.resolve() != target.resolve():
        target.write_bytes(exported_path.read_bytes())

    print(f"Exported FallSafe ONNX model to {target}")


if __name__ == "__main__":
    main()
