#!/usr/bin/env python3
"""校验目录下 png/jpg/mp4 的完整性，揪出 CDN 下载截断的坏文件。

用法: python3 check_media.py <目录> [更多目录...]
退出码 0 表示全部完好；1 表示有坏文件，坏文件清单打印到 stdout。
坏文件的修复方式是重跑对应 submit_id 的 query_result --download_dir 覆盖下载。
"""
import subprocess
import sys
from pathlib import Path

def check_image(p: Path) -> str | None:
    try:
        from PIL import Image
        im = Image.open(p)
        im.load()
        return None
    except Exception as e:
        return str(e)

def check_video(p: Path) -> str | None:
    r = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(p), "-f", "null", "-"],
        capture_output=True, text=True,
    )
    err = r.stderr.strip()
    return err or None

def main() -> int:
    bad = []
    total = 0
    for d in sys.argv[1:]:
        for p in sorted(Path(d).iterdir()):
            if p.suffix.lower() in {".png", ".jpg", ".jpeg"}:
                total += 1
                e = check_image(p)
            elif p.suffix.lower() in {".mp4", ".mov", ".webm"}:
                total += 1
                e = check_video(p)
            else:
                continue
            if e:
                bad.append((p, e.splitlines()[0][:120]))
    for p, e in bad:
        print(f"BAD  {p}  [{e}]")
    print(f"{total - len(bad)}/{total} ok")
    return 1 if bad else 0

if __name__ == "__main__":
    sys.exit(main())
