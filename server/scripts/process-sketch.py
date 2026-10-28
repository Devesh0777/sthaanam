import os
from PIL import Image, ImageChops

source_path = r"d:\CODINGG PROJECTSSS\KUMBH PARK\src\assets\hero\nashik-sketch.png"
out_dir = r"d:\CODINGG PROJECTSSS\KUMBH PARK\src\assets\hero"

img = Image.open(source_path).convert("RGBA")

# Convert to grayscale to find artwork bounding box
gray = img.convert("L")
inverted = ImageChops.invert(gray)
thresholded = inverted.point(lambda p: 255 if p > 15 else 0)
bbox = thresholded.getbbox()
print(f"Artwork bounding box: {bbox}")

w, h = img.size
pad = 10
crop_box = (
    max(0, bbox[0] - pad),
    max(0, bbox[1] - pad),
    min(w, bbox[2] + pad),
    min(h, bbox[3] + pad)
)
cropped = img.crop(crop_box)
print(f"Cropped size: {cropped.size}")

# Build transparent alpha channel:
# White pixels (>= 245) become completely transparent
# Black lines remain crisp dark ink (#1B1B1B)
cropped_gray = cropped.convert("L")

def calc_alpha(val):
    if val >= 245:
        return 0
    elif val <= 50:
        return 255
    else:
        return int(255 * (245 - val) / 195)

alpha = cropped_gray.point(calc_alpha)

# Create ink colored image (#1B1B1B) with calculated alpha
ink_solid = Image.new("RGBA", cropped.size, (27, 27, 27, 255))
ink_img = Image.composite(ink_solid, Image.new("RGBA", cropped.size, (0, 0, 0, 0)), alpha)

# 1. Desktop version: 2000px wide
target_w_desktop = 2000
aspect = cropped.height / cropped.width
target_h_desktop = int(target_w_desktop * aspect)
desktop_img = ink_img.resize((target_w_desktop, target_h_desktop), Image.Resampling.LANCZOS)
desktop_path = os.path.join(out_dir, "nashik-sketch-2000.webp")
desktop_img.save(desktop_path, "WEBP", quality=82, method=6)
print(f"Saved {desktop_path}: {desktop_img.size}, {os.path.getsize(desktop_path) / 1024:.1f} KB")

# 2. Mobile version: 1000px wide
target_w_mobile = 1000
target_h_mobile = int(target_w_mobile * aspect)
mobile_img = ink_img.resize((target_w_mobile, target_h_mobile), Image.Resampling.LANCZOS)
mobile_path = os.path.join(out_dir, "nashik-sketch-1000.webp")
mobile_img.save(mobile_path, "WEBP", quality=80, method=6)
print(f"Saved {mobile_path}: {mobile_img.size}, {os.path.getsize(mobile_path) / 1024:.1f} KB")
