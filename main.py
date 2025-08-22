# main.py
from flask import Flask, render_template, request, jsonify
import json
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.path.join(app.static_folder, 'templates_base')

# Path ke file database JSON
TEMPLATES_DB_PATH = os.path.join(os.path.dirname(__file__), 'templates.json')

def read_templates_db():
    """Membaca data template dari file JSON."""
    try:
        with open(TEMPLATES_DB_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def write_templates_db(data):
    """Menulis data template ke file JSON."""
    with open(TEMPLATES_DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def get_google_fonts_from_templates(templates_data):
    """Mengekstrak semua nama font unik untuk dimuat oleh Google Fonts."""
    fonts = set()
    for template in templates_data:
        for field in template.get('fields', []):
            font_name = field.get('font', 'Poppins').replace('-Bold', '')
            if font_name != 'Great Vibes':
                fonts.add(font_name)
    return list(fonts)

# ================== RUTE UNTUK APLIKASI UTAMA ==================
@app.route('/')
def index():
    """Menyajikan halaman utama."""
    templates_data = read_templates_db()
    required_fonts = get_google_fonts_from_templates(templates_data)
    return render_template('index.html', templates_data=templates_data, required_fonts=required_fonts)

# ================== RUTE UNTUK ADMIN PANEL ==================
@app.route('/admin')
def admin_panel():
    """Menyajikan halaman admin."""
    return render_template('admin.html')

# ================== API UNTUK MENGELOLA TEMPLATE ==================
@app.route('/api/templates', methods=['GET'])
def get_templates():
    """API untuk mendapatkan semua data template."""
    templates = read_templates_db()
    return jsonify(templates)

@app.route('/api/templates/add', methods=['POST'])
def add_template():
    """API untuk menambah template baru."""
    if 'background_image' not in request.files:
        return jsonify({'success': False, 'error': 'File gambar tidak ditemukan'}), 400
    
    file = request.files['background_image']
    template_data_str = request.form.get('template_data')

    if not file or not template_data_str:
        return jsonify({'success': False, 'error': 'Data tidak lengkap'}), 400

    try:
        new_template = json.loads(template_data_str)
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        
        new_template['background_image'] = filename

        templates = read_templates_db()
        # Cek jika ID sudah ada, jika ya, update. Jika tidak, tambah baru.
        existing_ids = [t['id'] for t in templates]
        if new_template['id'] in existing_ids:
             # Logika update bisa ditambahkan di sini jika perlu
             return jsonify({'success': False, 'error': 'Template dengan ID ini sudah ada.'}), 400
        
        templates.append(new_template)
        write_templates_db(templates)
        
        return jsonify({'success': True, 'message': 'Template berhasil ditambahkan.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/templates/delete', methods=['POST'])
def delete_template():
    """API untuk menghapus template."""
    data = request.get_json()
    template_id = data.get('id')
    if not template_id:
        return jsonify({'success': False, 'error': 'ID Template tidak ada'}), 400

    templates = read_templates_db()
    template_to_delete = None
    
    # Cari template yang akan dihapus
    for t in templates:
        if t['id'] == template_id:
            template_to_delete = t
            break
    
    if not template_to_delete:
        return jsonify({'success': False, 'error': 'Template tidak ditemukan'}), 404

    # Hapus file gambar
    try:
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], template_to_delete['background_image'])
        if os.path.exists(image_path):
            os.remove(image_path)
    except Exception as e:
        print(f"Warning: Gagal menghapus file gambar {template_to_delete['background_image']}. Error: {e}")

    # Hapus entri dari daftar dan tulis kembali ke file
    templates_after_delete = [t for t in templates if t['id'] != template_id]
    write_templates_db(templates_after_delete)

    return jsonify({'success': True, 'message': 'Template berhasil dihapus.'})


if __name__ == '__main__':
    app.run(debug=True)