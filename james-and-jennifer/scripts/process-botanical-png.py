"""Build site-ready botanical-01.png: true RGBA + transparent padding."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SRC = ROOT / "images" / "floral" / "botanical-source.png"
OUT = ROOT / "images" / "floral" / "botanical-01.png"
PAD = 48
LOW = 14
HIGH = 42


def rgba_from_rgb(rgb: np.ndarray) -> np.ndarray:
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    brightness = np.maximum(np.maximum(r, g), b).astype(np.float32)
    alpha = np.clip((brightness - LOW) / (HIGH - LOW), 0.0, 1.0)
    alpha = (alpha * 255).astype(np.uint8)
    return np.dstack([r, g, b, alpha])


def add_padding(rgba: np.ndarray, pad: int) -> np.ndarray:
    h, w = rgba.shape[:2]
    out = np.zeros((h + 2 * pad, w + 2 * pad, 4), dtype=np.uint8)
    out[pad : pad + h, pad : pad + w] = rgba
    return out


def process(src: Path, out: Path = OUT, pad: int = PAD) -> None:
    im = Image.open(src)
    if im.mode == "RGBA":
        rgba = np.array(im)
        # Preserve existing alpha; only key matte if corners are opaque black.
        corners = [rgba[0, 0], rgba[-1, 0], rgba[0, -1], rgba[-1, -1]]
        if all(c[3] > 200 and max(c[:3]) < 20 for c in corners):
            rgba = rgba_from_rgb(rgba[..., :3])
    else:
        rgba = rgba_from_rgb(np.array(im.convert("RGB")))

    rgba = add_padding(rgba, pad)
    Image.fromarray(rgba, mode="RGBA").save(out, optimize=True)

    alpha = rgba[..., 3]
    ys, xs = np.where(alpha > 0)
    print(f"Wrote {out} ({out.stat().st_size // 1024} KB)")
    print(f"Size: {rgba.shape[1]}x{rgba.shape[0]}, RGBA, pad={pad}px")
    print(f"Content bbox: x={xs.min()}-{xs.max()}, y={ys.min()}-{ys.max()}")
    print(f"Corner alpha: {rgba[0, 0, 3]}")


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    if not src.exists():
        raise SystemExit(f"Source not found: {src}")
    process(src)


if __name__ == "__main__":
    main()
