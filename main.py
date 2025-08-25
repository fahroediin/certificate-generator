from flask import Flask, render_template, request, jsonify
import json
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
# LOKASI UPLOAD FOLDER YANG BENAR (di dalam static)
UPLOAD_FOLDER = os.path.join(app.static_folder, 'templates_base')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

TEMPLATES_DB_PATH = os.path.join(os.path.dirname(__file__), 'templates.json')
CATEGORIES_DB_PATH = os.path.join(os.path.dirname(__file__), 'categories.json')

# FUNGSI BARU: Untuk memastikan direktori ada saat startup
def setup_directories():
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
        print(f"Created directory: {UPLOAD_FOLDER}")

def read_json_db(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        # Jika file tidak ada, kembalikan struktur data default yang sesuai
        if 'categories' in path:
            return []
        elif 'templates' in path:
            return []
        return {}


def write_json_db(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def get_google_fonts_from_templates(templates_data):
    fonts = set()
    for template in templates_data:
        for field in template.get('fields', []):
            font_name = field.get('font', 'Poppins').replace('-Bold', '')
            if font_name not in ['Great Vibes', 'Poppins']: # Poppins & Great Vibes sudah default
                fonts.add(font_name)
    return list(fonts)

@app.route('/')
def index():
    templates_data = read_json_db(TEMPLATES_DB_PATH)
    required_fonts = get_google_fonts_from_templates(templates_data)
    return render_template('index.html', templates_data=templates_data, required_fonts=required_fonts)

@app.route('/admin')
def admin_panel():
    return render_template('admin.html')

# ================== API UNTUK MENGELOLA TEMPLATE ==================
@app.route('/api/templates', methods=['GET'])
def get_templates():
    return jsonify(read_json_db(TEMPLATES_DB_PATH))

@app.route('/api/templates/add', methods=['POST'])
def add_template():
    template_data_str = request.form.get('template_data')
    if 'background_image' not in request.files or not template_data_str:
        return jsonify({'success': False, 'error': 'Data tidak lengkap: gambar latar dan data template dibutuhkan.'}), 400
    
    try:
        new_template = json.loads(template_data_str)
        templates = read_json_db(TEMPLATES_DB_PATH)
        if any(t['id'] == new_template['id'] for t in templates):
            return jsonify({'success': False, 'error': 'Template dengan ID ini sudah ada.'}), 400
        
        file = request.files['background_image']
        filename = secure_filename(f"{new_template['id']}_{file.filename}") # Tambahkan ID untuk unik
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        new_template['background_image'] = filename

        templates.append(new_template)
        write_json_db(TEMPLATES_DB_PATH, templates)
        return jsonify({'success': True, 'message': 'Template berhasil ditambahkan.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/templates/update', methods=['POST'])
def update_template():
    template_data_str = request.form.get('template_data')
    if not template_data_str:
        return jsonify({'success': False, 'error': 'Data tidak lengkap'}), 400

    try:
        updated_template = json.loads(template_data_str)
        template_id_to_update = updated_template.get('id')
        
        templates = read_json_db(TEMPLATES_DB_PATH)
        
        # Cari template yang ada untuk mendapatkan nama file gambar lama jika diperlukan
        old_template = next((t for t in templates if t['id'] == template_id_to_update), None)
        if not old_template:
            return jsonify({'success': False, 'error': 'Template tidak ditemukan untuk diupdate'}), 404

        if 'background_image' in request.files:
            file = request.files['background_image']
            if file and file.filename != '':
                # Hapus gambar lama untuk menjaga kebersihan
                old_image_path = os.path.join(app.config['UPLOAD_FOLDER'], old_template.get('background_image', ''))
                if os.path.exists(old_image_path):
                    os.remove(old_image_path)
                
                filename = secure_filename(f"{template_id_to_update}_{file.filename}")
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                updated_template['background_image'] = filename
            else:
                # Jika tidak ada file baru diupload, pertahankan gambar lama
                updated_template['background_image'] = old_template.get('background_image')
        else:
             updated_template['background_image'] = old_template.get('background_image')


        template_found = False
        for i, template in enumerate(templates):
            if template['id'] == template_id_to_update:
                templates[i] = updated_template
                template_found = True
                break
        
        if not template_found: # Seharusnya tidak terjadi karena sudah dicek di atas
            return jsonify({'success': False, 'error': 'Template tidak ditemukan untuk diupdate'}), 404

        write_json_db(TEMPLATES_DB_PATH, templates)
        return jsonify({'success': True, 'message': 'Template berhasil diperbarui.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/templates/delete', methods=['POST'])
def delete_template():
    data = request.get_json()
    template_id = data.get('id')
    if not template_id: return jsonify({'success': False, 'error': 'ID Template tidak ada'}), 400
    
    templates = read_json_db(TEMPLATES_DB_PATH)
    template_to_delete = next((t for t in templates if t['id'] == template_id), None)
    
    if not template_to_delete: return jsonify({'success': False, 'error': 'Template tidak ditemukan'}), 404
    
    try:
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], template_to_delete.get('background_image', ''))
        if os.path.exists(image_path): os.remove(image_path)
    except Exception as e: print(f"Warning: Gagal menghapus file gambar. Error: {e}")
    
    templates_after_delete = [t for t in templates if t['id'] != template_id]
    write_json_db(TEMPLATES_DB_PATH, templates_after_delete)
    return jsonify({'success': True, 'message': 'Template berhasil dihapus.'})

# ================== API UNTUK MENGELOLA KATEGORI ==================
@app.route('/api/categories', methods=['GET'])
def get_categories():
    return jsonify(read_json_db(CATEGORIES_DB_PATH))

@app.route('/api/categories', methods=['POST'])
def add_category():
    data = request.get_json()
    new_category = data.get('category')
    if not new_category: return jsonify({'success': False, 'error': 'Nama kategori tidak boleh kosong'}), 400
    
    categories = read_json_db(CATEGORIES_DB_PATH)
    if new_category in categories: return jsonify({'success': False, 'error': 'Kategori sudah ada'}), 400
    
    categories.append(new_category)
    write_json_db(CATEGORIES_DB_PATH, categories)
    return jsonify({'success': True, 'categories': categories})

@app.route('/api/categories/delete', methods=['POST'])
def delete_category():
    data = request.get_json()
    category_to_delete = data.get('category')
    if not category_to_delete: return jsonify({'success': False, 'error': 'Nama kategori tidak ada'}), 400
    
    # PERBAIKAN: Cek apakah kategori masih digunakan
    templates = read_json_db(TEMPLATES_DB_PATH)
    is_in_use = any(t['category'] == category_to_delete for t in templates)
    if is_in_use:
        return jsonify({'success': False, 'error': f'Kategori "{category_to_delete}" masih digunakan oleh template lain.'}), 400

    categories = read_json_db(CATEGORIES_DB_PATH)
    if category_to_delete not in categories: return jsonify({'success': False, 'error': 'Kategori tidak ditemukan'}), 404
    
    categories.remove(category_to_delete)
    write_json_db(CATEGORIES_DB_PATH, categories)
    return jsonify({'success': True, 'categories': categories})

if __name__ == '__main__':
    setup_directories() # Panggil fungsi setup di sini
    app.run(debug=True)