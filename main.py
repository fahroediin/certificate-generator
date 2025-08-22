# main.py
from flask import Flask, render_template, request, jsonify
import json
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.path.join(app.static_folder, 'templates_base')

# Path ke file database
TEMPLATES_DB_PATH = os.path.join(os.path.dirname(__file__), 'templates.json')
CATEGORIES_DB_PATH = os.path.join(os.path.dirname(__file__), 'categories.json')

# ================== FUNGSI HELPER UNTUK MEMBACA/MENULIS JSON ==================
def read_json_db(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def write_json_db(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# ================== RUTE UNTUK APLIKASI UTAMA ==================
@app.route('/')
def index():
    templates_data = read_json_db(TEMPLATES_DB_PATH)
    # ... (sisa fungsi ini tetap sama) ...
    fonts = set()
    for template in templates_data:
        for field in template.get('fields', []):
            font_name = field.get('font', 'Poppins').replace('-Bold', '')
            if font_name != 'Great Vibes': fonts.add(font_name)
    required_fonts = list(fonts)
    return render_template('index.html', templates_data=templates_data, required_fonts=required_fonts)

# ================== RUTE UNTUK ADMIN PANEL ==================
@app.route('/admin')
def admin_panel():
    return render_template('admin.html')

# ================== API UNTUK MENGELOLA TEMPLATE ==================
@app.route('/api/templates', methods=['GET'])
def get_templates():
    return jsonify(read_json_db(TEMPLATES_DB_PATH))

@app.route('/api/templates/add', methods=['POST'])
def add_template():
    # ... (fungsi ini tetap sama persis) ...
    if 'background_image' not in request.files: return jsonify({'success': False, 'error': 'File gambar tidak ditemukan'}), 400
    file = request.files['background_image']
    template_data_str = request.form.get('template_data')
    if not file or not template_data_str: return jsonify({'success': False, 'error': 'Data tidak lengkap'}), 400
    try:
        new_template = json.loads(template_data_str)
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        new_template['background_image'] = filename
        templates = read_json_db(TEMPLATES_DB_PATH)
        if any(t['id'] == new_template['id'] for t in templates): return jsonify({'success': False, 'error': 'Template dengan ID ini sudah ada.'}), 400
        templates.append(new_template)
        write_json_db(TEMPLATES_DB_PATH, templates)
        return jsonify({'success': True, 'message': 'Template berhasil ditambahkan.'})
    except Exception as e: return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/templates/delete', methods=['POST'])
def delete_template():
    # ... (fungsi ini tetap sama persis) ...
    data = request.get_json()
    template_id = data.get('id')
    if not template_id: return jsonify({'success': False, 'error': 'ID Template tidak ada'}), 400
    templates = read_json_db(TEMPLATES_DB_PATH)
    template_to_delete = next((t for t in templates if t['id'] == template_id), None)
    if not template_to_delete: return jsonify({'success': False, 'error': 'Template tidak ditemukan'}), 404
    try:
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], template_to_delete['background_image'])
        if os.path.exists(image_path): os.remove(image_path)
    except Exception as e: print(f"Warning: Gagal menghapus file gambar. Error: {e}")
    templates_after_delete = [t for t in templates if t['id'] != template_id]
    write_json_db(TEMPLATES_DB_PATH, templates_after_delete)
    return jsonify({'success': True, 'message': 'Template berhasil dihapus.'})

# ================== API BARU UNTUK MENGELOLA KATEGORI ==================
@app.route('/api/categories', methods=['GET'])
def get_categories():
    """API untuk mendapatkan semua kategori."""
    return jsonify(read_json_db(CATEGORIES_DB_PATH))

@app.route('/api/categories', methods=['POST'])
def add_category():
    """API untuk menambah kategori baru."""
    data = request.get_json()
    new_category = data.get('category')
    if not new_category:
        return jsonify({'success': False, 'error': 'Nama kategori tidak boleh kosong'}), 400
    
    categories = read_json_db(CATEGORIES_DB_PATH)
    if new_category in categories:
        return jsonify({'success': False, 'error': 'Kategori sudah ada'}), 400
    
    categories.append(new_category)
    write_json_db(CATEGORIES_DB_PATH, categories)
    return jsonify({'success': True, 'categories': categories})

@app.route('/api/categories/delete', methods=['POST'])
def delete_category():
    """API untuk menghapus kategori."""
    data = request.get_json()
    category_to_delete = data.get('category')
    if not category_to_delete:
        return jsonify({'success': False, 'error': 'Nama kategori tidak ada'}), 400
        
    categories = read_json_db(CATEGORIES_DB_PATH)
    if category_to_delete not in categories:
        return jsonify({'success': False, 'error': 'Kategori tidak ditemukan'}), 404
        
    categories.remove(category_to_delete)
    write_json_db(CATEGORIES_DB_PATH, categories)
    return jsonify({'success': True, 'categories': categories})

if __name__ == '__main__':
    app.run(debug=True)