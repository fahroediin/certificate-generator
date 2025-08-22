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
# 'align' bisa berisi: 'center', 'left', 'right'
TEMPLATE_METADATA = {
    'achievement.png': {
        'category': 'Achievement',
        'preview_name': 'Modern Blue',
        'fields': {
            'nama_penerima': {'pos': (1000, 650), 'font': 'GreatVibes-Regular.ttf', 'size': 120, 'color': '#c5a47e', 'align': 'center'},
            'asal_instansi': {'pos': (1000, 780), 'font': 'Poppins-Regular.ttf', 'size': 36, 'color': '#333333', 'align': 'center'},
            'deskripsi': {'pos': (1000, 900), 'font': 'Poppins-Regular.ttf', 'size': 32, 'color': '#333333', 'align': 'center'},
            'tanggal_acara': {'pos': (1000, 1000), 'font': 'Poppins-Bold.ttf', 'size': 32, 'color': '#333333', 'align': 'center'},
            'penandatangan_1_nama': {'pos': (500, 1250), 'font': 'Poppins-Bold.ttf', 'size': 34, 'color': '#333333', 'align': 'center'},
            'penandatangan_1_jabatan': {'pos': (500, 1295), 'font': 'Poppins-Regular.ttf', 'size': 28, 'color': '#555555', 'align': 'center'},
            'penandatangan_2_nama': {'pos': (1500, 1250), 'font': 'Poppins-Bold.ttf', 'size': 34, 'color': '#333333', 'align': 'center'},
            'penandatangan_2_jabatan': {'pos': (1500, 1295), 'font': 'Poppins-Regular.ttf', 'size': 28, 'color': '#555555', 'align': 'center'},
        },
        'logo': None
    },
    'competition.png': {
        'category': 'Competition',
        'preview_name': 'Elegant Black Gold',
        'fields': {
            'nama_penerima': {'pos': (1000, 750), 'font': 'GreatVibes-Regular.ttf', 'size': 180, 'color': '#333333', 'align': 'center'},
            'deskripsi': {'pos': (1000, 980), 'font': 'Poppins-Regular.ttf', 'size': 40, 'color': '#333333', 'align': 'center'},
            'penandatangan_1_nama': {'pos': (1000, 1250), 'font': 'Poppins-Bold.ttf', 'size': 36, 'color': '#333333', 'align': 'center'},
            'penandatangan_1_jabatan': {'pos': (1000, 1300), 'font': 'Poppins-Regular.ttf', 'size': 30, 'color': '#555555', 'align': 'center'},
        },
        'logo': None
    },
    'participation.png': {
        'category': 'Participation',
        'preview_name': 'Geometric Gold',
        'fields': {
            'nama_penerima': {'pos': (1000, 750), 'font': 'GreatVibes-Regular.ttf', 'size': 180, 'color': '#333333', 'align': 'center'},
            'deskripsi': {'pos': (1000, 980), 'font': 'Poppins-Regular.ttf', 'size': 40, 'color': '#333333', 'align': 'center'},
            'penandatangan_1_nama': {'pos': (550, 1250), 'font': 'Poppins-Bold.ttf', 'size': 36, 'color': '#333333', 'align': 'center'},
            'penandatangan_1_jabatan': {'pos': (550, 1300), 'font': 'Poppins-Regular.ttf', 'size': 30, 'color': '#555555', 'align': 'center'},
            'penandatangan_2_nama': {'pos': (1450, 1250), 'font': 'Poppins-Bold.ttf', 'size': 36, 'color': '#333333', 'align': 'center'},
            'penandatangan_2_jabatan': {'pos': (1450, 1300), 'font': 'Poppins-Regular.ttf', 'size': 30, 'color': '#555555', 'align': 'center'},
        },
        'logo': None
    },
    'appreciation_1.png': {
        'category': 'Appreciation',
        'preview_name': 'Minimalist Wave',
        'fields': {
            'nama_penerima': {'pos': (1000, 750), 'font': 'GreatVibes-Regular.ttf', 'size': 180, 'color': '#333333', 'align': 'center'},
            'deskripsi': {'pos': (1000, 1000), 'font': 'Poppins-Regular.ttf', 'size': 32, 'color': '#555555', 'align': 'center'},
            'penandatangan_1_jabatan': {'pos': (550, 1280), 'font': 'Poppins-Regular.ttf', 'size': 34, 'color': '#555555', 'align': 'center'},
            'penandatangan_2_jabatan': {'pos': (1450, 1280), 'font': 'Poppins-Regular.ttf', 'size': 34, 'color': '#555555', 'align': 'center'},
        },
        'logo': None
    },
    'appreciation_2.png': {
        'category': 'Appreciation',
        'preview_name': 'Blue Floral',
        'fields': {
            'nama_penerima': {'pos': (1000, 750), 'font': 'GreatVibes-Regular.ttf', 'size': 180, 'color': '#333333', 'align': 'center'},
            'deskripsi': {'pos': (1000, 1000), 'font': 'Poppins-Regular.ttf', 'size': 32, 'color': '#555555', 'align': 'center'},
            'penandatangan_1_jabatan': {'pos': (1000, 1300), 'font': 'Poppins-Regular.ttf', 'size': 34, 'color': '#555555', 'align': 'center'},
        },
        'logo': None
    },
    'appreciation_3.png': {
        'category': 'Appreciation',
        'preview_name': 'Brown Abstract',
        'fields': {
            'nama_penerima': {'pos': (1000, 750), 'font': 'GreatVibes-Regular.ttf', 'size': 180, 'color': '#333333', 'align': 'center'},
            'deskripsi': {'pos': (1000, 950), 'font': 'Poppins-Regular.ttf', 'size': 32, 'color': '#555555', 'align': 'center'},
            'penandatangan_1_jabatan': {'pos': (550, 1280), 'font': 'Poppins-Regular.ttf', 'size': 34, 'color': '#555555', 'align': 'center'},
            'penandatangan_2_jabatan': {'pos': (1450, 1280), 'font': 'Poppins-Regular.ttf', 'size': 34, 'color': '#555555', 'align': 'center'},
        },
        'logo': None
    }
}