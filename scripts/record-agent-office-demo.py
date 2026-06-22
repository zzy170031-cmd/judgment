import argparse
import json
import struct
import time
from pathlib import Path

from PIL import Image, ImageGrab


def _u32(value):
    return struct.pack("<I", value)


def _i32(value):
    return struct.pack("<i", value)


def _u16(value):
    return struct.pack("<H", value)


def _chunk(fourcc, payload):
    data = fourcc + _u32(len(payload)) + payload
    if len(payload) % 2:
        data += b"\0"
    return data


def parse_bbox(value):
    if not value:
        return None
    parts = [int(part.strip()) for part in value.split(",")]
    if len(parts) != 4:
        raise argparse.ArgumentTypeError("--bbox must be x,y,width,height")
    x, y, width, height = parts
    if width <= 0 or height <= 0:
        raise argparse.ArgumentTypeError("--bbox width and height must be positive")
    return (x, y, x + width, y + height)


def capture_frames(frames_dir, duration, fps, quality, bbox=None, all_screens=False):
    frames_dir.mkdir(parents=True, exist_ok=True)
    frame_count = int(round(duration * fps))
    interval = 1.0 / fps
    width = height = None
    started = time.perf_counter()

    for index in range(frame_count):
        target = started + index * interval
        now = time.perf_counter()
        if now < target:
            time.sleep(target - now)

        image = ImageGrab.grab(bbox=bbox, all_screens=all_screens)
        if image.mode != "RGB":
            image = image.convert("RGB")
        if width is None:
            width, height = image.size
        elif image.size != (width, height):
            image = image.resize((width, height), Image.Resampling.LANCZOS)

        image.save(frames_dir / f"frame_{index:05d}.jpg", "JPEG", quality=quality, optimize=True)

    manifest = {
        "fps": fps,
        "duration": duration,
        "frames": frame_count,
        "width": width,
        "height": height,
        "quality": quality,
        "bbox": bbox,
        "allScreens": all_screens,
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }
    (frames_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    return manifest


def encode_mjpeg_avi(frames_dir, output_path, fps):
    frame_paths = sorted(frames_dir.glob("frame_*.jpg"))
    if not frame_paths:
        raise SystemExit(f"No frames found in {frames_dir}")

    with Image.open(frame_paths[0]) as image:
        width, height = image.size

    frame_payloads = [path.read_bytes() for path in frame_paths]
    frame_count = len(frame_payloads)
    max_frame = max(len(item) for item in frame_payloads)
    microseconds_per_frame = int(1_000_000 / fps)

    avih = struct.pack(
        "<IIIIIIIIIIIIII",
        microseconds_per_frame,
        max_frame * fps,
        0,
        0x10,
        frame_count,
        0,
        1,
        max_frame,
        width,
        height,
        0,
        0,
        0,
        0,
    )

    strh = (
        b"vids"
        + b"MJPG"
        + _u32(0)
        + _u16(0)
        + _u16(0)
        + _u32(0)
        + _u32(1)
        + _u32(fps)
        + _u32(0)
        + _u32(frame_count)
        + _u32(max_frame)
        + _u32(0xFFFFFFFF)
        + _u32(0)
        + _i32(0)
        + _i32(0)
        + _i32(width)
        + _i32(height)
    )

    strf = (
        _u32(40)
        + _i32(width)
        + _i32(height)
        + _u16(1)
        + _u16(24)
        + b"MJPG"
        + _u32(width * height * 3)
        + _i32(0)
        + _i32(0)
        + _u32(0)
        + _u32(0)
    )

    hdrl = b"LIST" + _u32(4 + len(_chunk(b"avih", avih)) + len(b"LIST" + _u32(4 + len(_chunk(b"strh", strh)) + len(_chunk(b"strf", strf))) + b"strl" + _chunk(b"strh", strh) + _chunk(b"strf", strf))) + b"hdrl"
    hdrl += _chunk(b"avih", avih)
    strl_payload = _chunk(b"strh", strh) + _chunk(b"strf", strf)
    hdrl += b"LIST" + _u32(4 + len(strl_payload)) + b"strl" + strl_payload

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("wb") as handle:
        handle.write(b"RIFF")
        riff_size_pos = handle.tell()
        handle.write(_u32(0))
        handle.write(b"AVI ")
        handle.write(hdrl)
        handle.write(b"LIST")
        movi_size_pos = handle.tell()
        handle.write(_u32(0))
        handle.write(b"movi")
        movi_start = handle.tell()

        index_entries = []
        for payload in frame_payloads:
            offset = handle.tell() - movi_start
            handle.write(b"00dc")
            handle.write(_u32(len(payload)))
            handle.write(payload)
            if len(payload) % 2:
                handle.write(b"\0")
            index_entries.append((offset, len(payload)))

        movi_end = handle.tell()
        idx_payload = b"".join(
            b"00dc" + _u32(0x10) + _u32(offset) + _u32(size)
            for offset, size in index_entries
        )
        handle.write(_chunk(b"idx1", idx_payload))
        file_end = handle.tell()

        handle.seek(movi_size_pos)
        handle.write(_u32(movi_end - movi_size_pos - 4))
        handle.seek(riff_size_pos)
        handle.write(_u32(file_end - 8))

    return {
        "output": str(output_path),
        "frames": frame_count,
        "fps": fps,
        "width": width,
        "height": height,
        "duration": frame_count / fps,
    }


def main():
    parser = argparse.ArgumentParser(description="Capture desktop frames and encode an MJPEG AVI demo.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    capture_parser = subparsers.add_parser("capture")
    capture_parser.add_argument("--frames-dir", required=True)
    capture_parser.add_argument("--duration", type=float, default=180)
    capture_parser.add_argument("--fps", type=int, default=2)
    capture_parser.add_argument("--quality", type=int, default=78)
    capture_parser.add_argument("--bbox", type=parse_bbox, help="Capture x,y,width,height from the virtual desktop.")
    capture_parser.add_argument("--all-screens", action="store_true", help="Capture from the Windows virtual desktop across all monitors.")

    encode_parser = subparsers.add_parser("encode")
    encode_parser.add_argument("--frames-dir", required=True)
    encode_parser.add_argument("--output", required=True)
    encode_parser.add_argument("--fps", type=int, default=2)

    args = parser.parse_args()
    if args.command == "capture":
        print(json.dumps(capture_frames(Path(args.frames_dir), args.duration, args.fps, args.quality, args.bbox, args.all_screens), ensure_ascii=False, indent=2))
    elif args.command == "encode":
        print(json.dumps(encode_mjpeg_avi(Path(args.frames_dir), Path(args.output), args.fps), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
