# config.py
import os

# Path dasar proyek
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Konfigurasi folder
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
GENERATED_FOLDER = os.path.join(BASE_DIR, 'generated')
TEMPLATE_FOLDER = os.path.join(BASE_DIR, 'static', 'templates_base')
FONT_FOLDER = os.path.join(BASE_DIR, 'static', 'fonts')

# Pastikan folder ada
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(GENERATED_FOLDER, exist_ok=True)

# Definisi metadata untuk setiap template
# Format: { 'nama_file': { 'fields': [...], 'logo': {...} } }
# Koordinat (x, y) diukur dari pojok kiri atas.
TEMPLATE_METADATA = {
    'achievement.png': {
        'category': 'Achievement',
        'preview_name': 'Modern Blue',
        'fields': {
            'nama_penerima': {'pos': (600, 400), 'font': 'GreatVibes-Regular.ttf', 'size': 80, 'color': '#c5a47e'},
            'asal_instansi': {'pos': (600, 470), 'font': 'Poppins-Regular.ttf', 'size': 24, 'color': '#333333'},
            'deskripsi': {'pos': (600, 550), 'font': 'Poppins-Regular.ttf', 'size': 20, 'color': '#333333'},
            'tanggal_acara': {'pos': (600, 620), 'font': 'Poppins-Bold.ttf', 'size': 20, 'color': '#333333'},
            'penandatangan_1_nama': {'pos': (300, 800), 'font': 'Poppins-Bold.ttf', 'size': 22, 'color': '#333333'},
            'penandatangan_1_jabatan': {'pos': (300, 830), 'font': 'Poppins-Regular.ttf', 'size': 18, 'color': '#555555'},
            'penandatangan_2_nama': {'pos': (900, 800), 'font': 'Poppins-Bold.ttf', 'size': 22, 'color': '#333333'},
            'penandatangan_2_jabatan': {'pos': (900, 830), 'font': 'Poppins-Regular.ttf', 'size': 18, 'color': '#555555'},
        },
        'logo': None
    },
    'competition.png': {
        'category': 'Competition',
        'preview_name': 'Elegant Black Gold',
        'fields': {
            'nama_penerima': {'pos': (600, 450), 'font': 'GreatVibes-Regular.ttf', 'size': 100, 'color': '#333333'},
            'deskripsi': {'pos': (600, 580), 'font': 'Poppins-Regular.ttf', 'size': 24, 'color': '#333333'},
            'penandatangan_1_nama': {'pos': (600, 750), 'font': 'Poppins-Bold.ttf', 'size': 22, 'color': '#333333'},
            'penandatangan_1_jabatan': {'pos': (600, 780), 'font': 'Poppins-Regular.ttf', 'size': 18, 'color': '#555555'},
        },
        'logo': None
    },
    'participation.png': {
        'category': 'Participation',
        'preview_name': 'Geometric Gold',
        'fields': {
            'nama_penerima': {'pos': (600, 450), 'font': 'GreatVibes-Regular.ttf', 'size': 100, 'color': '#333333'},
            'deskripsi': {'pos': (600, 580), 'font': 'Poppins-Regular.ttf', 'size': 24, 'color': '#333333'},
            'penandatangan_1_nama': {'pos': (350, 800), 'font': 'Poppins-Bold.ttf', 'size': 22, 'color': '#333333'},
            'penandatangan_1_jabatan': {'pos': (350, 830), 'font': 'Poppins-Regular.ttf', 'size': 18, 'color': '#555555'},
            'penandatangan_2_nama': {'pos': (850, 800), 'font': 'Poppins-Bold.ttf', 'size': 22, 'color': '#333333'},
            'penandatangan_2_jabatan': {'pos': (850, 830), 'font': 'Poppins-Regular.ttf', 'size': 18, 'color': '#555555'},
        },
        'logo': None
    },
    'appreciation_1.png': {
        'category': 'Appreciation',
        'preview_name': 'Minimalist Wave',
        'fields': {
            'nama_penerima': {'pos': (600, 450), 'font': 'GreatVibes-Regular.ttf', 'size': 110, 'color': '#333333'},
            'deskripsi': {'pos': (600, 600), 'font': 'Poppins-Regular.ttf', 'size': 20, 'color': '#555555'},
            'penandatangan_1_jabatan': {'pos': (350, 800), 'font': 'Poppins-Regular.ttf', 'size': 20, 'color': '#555555'},
            'penandatangan_2_jabatan': {'pos': (850, 800), 'font': 'Poppins-Regular.ttf', 'size': 20, 'color': '#555555'},
        },
        'logo': None
    }
}