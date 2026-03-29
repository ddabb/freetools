#!/usr/bin/env python3
"""
SVG 转 PNG 脚本
用于将 SVG 图标转换为小程序所需的 PNG 格式

安装依赖：
  pip install cairosvg pillow

使用方法：
  python svg_to_png.py logo.svg logo.png 512
  python svg_to_png.py tabbar-home.svg tabbar-home.png 128
  python svg_to_png.py tabbar-about.svg tabbar-about.png 128
"""

import sys
import os
from pathlib import Path

try:
    import cairosvg
    from PIL import Image
except ImportError:
    print("❌ 缺少依赖，请先安装：")
    print("  pip install cairosvg pillow")
    sys.exit(1)


def svg_to_png(svg_path, png_path, size=512):
    """
    将 SVG 转换为 PNG
    
    Args:
        svg_path: SVG 文件路径
        png_path: 输出 PNG 文件路径
        size: 输出尺寸（像素）
    """
    try:
        # 转换为 PNG
        cairosvg.svg2png(
            url=svg_path,
            write_to=png_path,
            output_width=size,
            output_height=size
        )
        print(f"✅ 转换成功: {svg_path} → {png_path} ({size}x{size})")
        return True
    except Exception as e:
        print(f"❌ 转换失败: {e}")
        return False


def main():
    if len(sys.argv) < 3:
        print("用法: python svg_to_png.py <svg文件> <png文件> [尺寸]")
        print("例子:")
        print("  python svg_to_png.py logo.svg logo.png 512")
        print("  python svg_to_png.py tabbar-home.svg tabbar-home.png 128")
        sys.exit(1)
    
    svg_file = sys.argv[1]
    png_file = sys.argv[2]
    size = int(sys.argv[3]) if len(sys.argv) > 3 else 512
    
    if not os.path.exists(svg_file):
        print(f"❌ 文件不存在: {svg_file}")
        sys.exit(1)
    
    svg_to_png(svg_file, png_file, size)


if __name__ == "__main__":
    main()
