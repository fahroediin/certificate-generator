# utils/certificate_generator.py
from PIL import Image, ImageDraw, ImageFont
import os
from config import FONT_FOLDER

def create_certificate(template_path, output_path, fields_data, logo_path=None, logo_config=None):
    """
    Membuat satu file sertifikat.
    """
    try:
        # Buka gambar template
        image = Image.open(template_path).convert("RGBA")
        draw = ImageDraw.Draw(image)

        # Tempelkan logo jika ada
        if logo_path and logo_config:
            logo = Image.open(logo_path).convert("RGBA")
            logo.thumbnail(logo_config['size'])
            image.paste(logo, logo_config['pos'], logo)

        # Tulis setiap teks ke gambar
        for field_name, config in fields_data.items():
            text = config.get('text', '')
            pos = config['pos']
            font_path = os.path.join(FONT_FOLDER, config['font'])
            font_size = config['size']
            font_color = config['color']
            
            font = ImageFont.truetype(font_path, font_size)
            
            # Mengukur teks untuk perataan tengah (horizontal)
            text_bbox = draw.textbbox((0, 0), text, font=font)
            text_width = text_bbox[2] - text_bbox[0]
            
            # Posisi x dihitung ulang agar teks berada di tengah
            center_x = pos[0] - (text_width / 2)
            
            draw.text((center_x, pos[1]), text, font=font, fill=font_color)

        # Simpan gambar hasil
        image.save(output_path, "PNG")
        return True
    except Exception as e:
        print(f"Error creating certificate: {e}")
        return False