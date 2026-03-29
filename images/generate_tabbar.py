from PIL import Image, ImageDraw
import os

# 确保目录存在
os.makedirs('F:/selfjob/freetools/images/tabbar', exist_ok=True)

size = 128
grey = '#7f8c8d'
blue = '#2980b9'

def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def draw_home(color, size=128):
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    r, g, b = hex_to_rgb(color)
    alpha = int(0.85 * 255)
    
    # 房子主体
    points = [
        (size//2, size//14),  # 屋顶尖端
        (size//8, size//2.2),  # 左下
        (size//8, size*0.89),  # 左下角
        (size*0.375, size*0.89),  # 左门边
        (size*0.375, size*0.61),  # 左门顶
        (size*0.625, size*0.61),  # 右门顶
        (size*0.625, size*0.89),  # 右门边
        (size*0.875, size*0.89),  # 右下角
        (size*0.875, size//2.2),  # 右下
    ]
    int_points = [(int(x), int(y)) for x, y in points]
    draw.polygon(int_points, fill=(r, g, b, alpha))
    
    # 窗户
    draw.rectangle([size//4, size//3.2, size//4+size//5, size//3.2+size//6.4], fill=(255, 255, 255, int(0.6*255)))
    draw.rectangle([size*0.56, size//3.2, size*0.56+size//5, size//3.2+size//6.4], fill=(255, 255, 255, int(0.6*255)))
    
    # 门
    draw.rectangle([size*0.42, size*0.61, size*0.58, size*0.89], fill=(255, 255, 255, int(0.4*255)))
    
    return img

def draw_log(color, size=128):
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    r, g, b = hex_to_rgb(color)
    alpha = int(0.85 * 255)
    
    # 文档背景
    margin = size // 6
    draw.rounded_rectangle([margin, margin//6, size-margin, size-margin], radius=size//16, fill=(r, g, b, alpha))
    
    # 内部白色
    inner = size // 4.5
    draw.rounded_rectangle([inner, inner*1.1, size-inner, size-inner], radius=size//32, fill=(255, 255, 255, 255))
    
    # 文字行
    line_h = size // 21
    y_start = inner * 1.6
    widths = [0.32, 0.45, 0.38, 0.42, 0.35]
    for i, w in enumerate(widths):
        x1 = inner * 1.3
        x2 = inner * 1.3 + (size - inner*2) * w
        y = y_start + i * line_h * 1.8
        draw.rounded_rectangle([x1, y, x2, y + line_h], radius=line_h//2, fill=(r, g, b, int(0.3*255)))
    
    # 勾选标记
    cx, cy = size * 0.75, size * 0.32
    cr = size // 8
    draw.ellipse([cx-cr, cy-cr, cx+cr, cy+cr], fill=(46, 213, 115, 255))
    
    return img

def draw_about(color, size=128):
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    r, g, b = hex_to_rgb(color)
    
    # 外圈
    draw.ellipse([size//8, size//8, size*7//8, size*7//8], outline=(r, g, b, int(0.6*255)), width=size//12)
    
    # 圆点
    dot_r = size // 21
    draw.ellipse([size//2-dot_r, size//3.2-dot_r, size//2+dot_r, size//3.2+dot_r], fill=(r, g, b, 255))
    
    # 竖条
    bar_w = size // 10
    bar_h = size // 3.2
    draw.rounded_rectangle([size//2-bar_w//2, size//2, size//2+bar_w//2, size//2+bar_h], radius=bar_w//2, fill=(r, g, b, 255))
    
    return img

# 生成图标
icons = [
    ('home-normal.png', draw_home(grey)),
    ('home-active.png', draw_home(blue)),
    ('log-normal.png', draw_log(grey)),
    ('log-active.png', draw_log(blue)),
    ('about-normal.png', draw_about(grey)),
    ('about-active.png', draw_about(blue)),
]

for name, img in icons:
    img.save(f'F:/selfjob/freetools/images/tabbar/{name}')
    print(f'✅ {name}')

print('\n全部生成完成！')
