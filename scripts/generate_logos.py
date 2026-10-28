import os
from PIL import Image, ImageDraw, ImageEnhance, ImageFont

SOURCE_PATH = 'src/assets/brand/sthaanam-logo-source.png'
BRAND_DIR = 'src/assets/brand'
PUBLIC_DIR = 'public'

os.makedirs(BRAND_DIR, exist_ok=True)
os.makedirs(PUBLIC_DIR, exist_ok=True)

def create_rounded_mask(width, height, radius_ratio=0.12):
    """Generates an antialiased 8-bit alpha mask with rounded corners."""
    scale = 4
    sw, sh = width * scale, height * scale
    radius = int(min(sw, sh) * radius_ratio)
    
    mask_large = Image.new('L', (sw, sh), 0)
    draw = ImageDraw.Draw(mask_large)
    draw.rounded_rectangle((0, 0, sw - 1, sh - 1), radius=radius, fill=255)
    
    return mask_large.resize((width, height), Image.Resampling.LANCZOS)

def apply_rounded_mask(img, radius_ratio=0.12):
    img = img.convert('RGBA')
    mask = create_rounded_mask(img.width, img.height, radius_ratio)
    img.putalpha(mask)
    return img

def main():
    print('Loading source logo image:', SOURCE_PATH)
    source = Image.open(SOURCE_PATH).convert('RGBA')
    print('Source dimensions:', source.size)

    # 1. EMBLEM-FULL: Central debossed square emblem
    # Bounds: (256, 224, 780, 762) -> 524x538
    emblem_full_crop = source.crop((256, 224, 780, 762)).resize((512, 512), Image.Resampling.LANCZOS)
    
    for sz in [512, 256, 128]:
        resized = emblem_full_crop.resize((sz, sz), Image.Resampling.LANCZOS)
        masked = apply_rounded_mask(resized, radius_ratio=0.12)
        
        png_path = os.path.join(BRAND_DIR, f'emblem-full-{sz}.png')
        webp_path = os.path.join(BRAND_DIR, f'emblem-full-{sz}.webp')
        masked.save(png_path, 'PNG', optimize=True)
        masked.save(webp_path, 'WEBP', quality=95)
        print(f'Saved {png_path} & {webp_path}')
        
        if sz == 512:
            masked.save(os.path.join(BRAND_DIR, 'emblem-full.png'), 'PNG', optimize=True)
            masked.save(os.path.join(BRAND_DIR, 'emblem-full.webp'), 'WEBP', quality=95)

    # 2. EMBLEM-SMALL: Tighter crop centered on compass needle & glowing gem
    # Center around (517, 529), width/height 370
    emblem_small_crop = source.crop((332, 344, 702, 714))
    # Contrast boost (1.18x) and sharpness (1.25x) so it pops at <= 48px
    small_enhanced = ImageEnhance.Contrast(emblem_small_crop.convert('RGB')).enhance(1.18)
    small_enhanced = ImageEnhance.Sharpness(small_enhanced).enhance(1.25)
    
    for sz in [96, 64, 48, 32, 16]:
        resized = small_enhanced.resize((sz, sz), Image.Resampling.LANCZOS)
        # At small sizes, slightly softer/larger relative corner radius looks crisp
        radius_ratio = 0.22 if sz <= 48 else 0.16
        masked = apply_rounded_mask(resized, radius_ratio=radius_ratio)
        
        png_path = os.path.join(BRAND_DIR, f'emblem-small-{sz}.png')
        webp_path = os.path.join(BRAND_DIR, f'emblem-small-{sz}.webp')
        masked.save(png_path, 'PNG', optimize=True)
        masked.save(webp_path, 'WEBP', quality=95)
        print(f'Saved {png_path} & {webp_path}')
        
        if sz == 96:
            masked.save(os.path.join(BRAND_DIR, 'emblem-small.png'), 'PNG', optimize=True)
            masked.save(os.path.join(BRAND_DIR, 'emblem-small.webp'), 'WEBP', quality=95)

    # 3. FAVICON.ICO (16, 32, 48)
    ico_img_48 = apply_rounded_mask(small_enhanced.resize((48, 48), Image.Resampling.LANCZOS), radius_ratio=0.22)
    ico_img_32 = apply_rounded_mask(small_enhanced.resize((32, 32), Image.Resampling.LANCZOS), radius_ratio=0.22)
    ico_img_16 = apply_rounded_mask(small_enhanced.resize((16, 16), Image.Resampling.LANCZOS), radius_ratio=0.22)
    
    ico_path = os.path.join(PUBLIC_DIR, 'favicon.ico')
    ico_img_48.save(
        ico_path,
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=[ico_img_32, ico_img_16],
    )
    print(f'Saved multi-size {ico_path}')

    # Extra standard png favicons
    ico_img_32.save(os.path.join(PUBLIC_DIR, 'favicon-32x32.png'), 'PNG')
    ico_img_16.save(os.path.join(PUBLIC_DIR, 'favicon-16x16.png'), 'PNG')

    # 4. APPLE-TOUCH-ICON (180x180)
    apple_icon = apply_rounded_mask(small_enhanced.resize((180, 180), Image.Resampling.LANCZOS), radius_ratio=0.18)
    apple_path = os.path.join(PUBLIC_DIR, 'apple-touch-icon.png')
    apple_icon.save(apple_path, 'PNG', optimize=True)
    print(f'Saved {apple_path}')

    # 5. PWA / MANIFEST ICONS (192, 512)
    for sz in [192, 512]:
        pwa_icon = apply_rounded_mask(emblem_full_crop.resize((sz, sz), Image.Resampling.LANCZOS), radius_ratio=0.12)
        pwa_path = os.path.join(PUBLIC_DIR, f'icon-{sz}.png')
        pwa_icon.save(pwa_path, 'PNG', optimize=True)
        print(f'Saved {pwa_path}')

    # 6. OG / SOCIAL IMAGE (1200x630) on paper background (#D8D4BF)
    og_w, og_h = 1200, 630
    og = Image.new('RGBA', (og_w, og_h), (216, 212, 191, 255)) # #D8D4BF
    og_draw = ImageDraw.Draw(og)
    
    # Outer architectural poster frame
    og_draw.rectangle((24, 24, og_w - 24, og_h - 24), outline=(20, 20, 20, 60), width=1)
    og_draw.rectangle((32, 32, og_w - 32, og_h - 32), outline=(20, 20, 20, 180), width=2)
    
    # Corner registration marks
    reg_sz = 12
    for cx, cy in [(32, 32), (og_w - 32, 32), (32, og_h - 32), (og_w - 32, og_h - 32)]:
        og_draw.rectangle((cx - reg_sz//2, cy - reg_sz//2, cx + reg_sz//2, cy + reg_sz//2), fill=(20, 20, 20, 200))
    
    # Paste 420x420 emblem on the left
    emblem_og = apply_rounded_mask(emblem_full_crop.resize((400, 400), Image.Resampling.LANCZOS), radius_ratio=0.12)
    og.paste(emblem_og, (80, (og_h - 400) // 2), emblem_og)
    
    # Typography on the right
    # Try Georgia Italic
    try:
        font_headline = ImageFont.truetype('C:/Windows/Fonts/georgiai.ttf', 82)
        font_sub = ImageFont.truetype('C:/Windows/Fonts/georgiab.ttf', 24)
        font_meta = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 18)
    except Exception:
        font_headline = ImageFont.load_default()
        font_sub = font_headline
        font_meta = font_headline

    text_x = 520
    # Meta eyebrow
    og_draw.text((text_x, 150), 'NASHIK • MAHA KUMBH MELA 2027', fill=(139, 46, 33, 230), font=font_sub)
    # Dominant wordmark
    og_draw.text((text_x, 195), 'Sthaanam', fill=(15, 42, 30, 255), font=font_headline)
    # Tagline
    og_draw.text((text_x, 310), 'A PLACE FOR EVERY JOURNEY', fill=(15, 42, 30, 210), font=font_sub)
    # Copy
    og_draw.text(
        (text_x, 360),
        'Verified private parking within walking distance of the sacred ghats.\nReserved, monitored, and confirmed by instant UPI.',
        fill=(30, 45, 38, 190),
        font=font_meta,
    )
    # Pill badge
    badge_box = (text_x, 435, text_x + 470, 475)
    og_draw.rounded_rectangle(badge_box, radius=8, fill=(15, 42, 30, 220))
    og_draw.text((text_x + 18, 444), 'RAMKUND • PANCHAVATI • GODAVARI CORRIDOR', fill=(255, 255, 255, 255), font=font_meta)
    
    og_path = os.path.join(PUBLIC_DIR, 'og-image.png')
    og.save(og_path, 'PNG', optimize=True)
    print(f'Saved {og_path}')

    # Clean up temporary test files
    for tmp in ['test_c1.png', 'test_c2.png', 'test_crop.png',
                'test_small_A_384_48.png', 'test_small_A_384_96.png',
                'test_small_B_340_48.png', 'test_small_B_340_96.png',
                'test_small_C_300_48.png', 'test_small_C_300_96.png']:
        p = os.path.join(BRAND_DIR, tmp)
        if os.path.exists(p):
            os.remove(p)

    print('All logo assets successfully generated!')

if __name__ == '__main__':
    main()
