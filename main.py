# main.py
from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import time
import shutil
from werkzeug.utils import secure_filename
import json

# Import dari file lokal
from config import UPLOAD_FOLDER, GENERATED_FOLDER, TEMPLATE_FOLDER, TEMPLATE_METADATA
from utils.file_handler import get_names_from_excel, zip_files
from utils.certificate_generator import create_certificate

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['GENERATED_FOLDER'] = GENERATED_FOLDER

@app.route('/')
def index():
    metadata_json = json.dumps(TEMPLATE_METADATA)
    return render_template('index.html', metadata=metadata_json)

@app.route('/generate', methods=['POST'])
def generate():
    session_id = str(int(time.time()))
    session_upload_path = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
    session_generated_path = os.path.join(app.config['GENERATED_FOLDER'], session_id)
    os.makedirs(session_upload_path, exist_ok=True)
    os.makedirs(session_generated_path, exist_ok=True)

    try:
        form_data = request.form
        template_file = form_data.get('template')
        
        names_file = request.files['names_file']
        names_filepath = os.path.join(session_upload_path, secure_filename(names_file.filename))
        names_file.save(names_filepath)

        logo_filepath = None
        if 'logo' in request.files and request.files['logo'].filename != '':
            logo_file = request.files['logo']
            logo_filepath = os.path.join(session_upload_path, secure_filename(logo_file.filename))
            logo_file.save(logo_filepath)

        names = get_names_from_excel(names_filepath)
        if not names:
            return jsonify({'success': False, 'error': 'Tidak ada nama yang ditemukan di file Excel.'}), 400

        template_path = os.path.join(TEMPLATE_FOLDER, template_file)
        template_meta = TEMPLATE_METADATA[template_file]
        generated_files_paths = []
        preview_urls = [] # <-- Variabel baru untuk menyimpan URL preview

        for i, name in enumerate(names):
            fields_data = {}
            for field, config in template_meta['fields'].items():
                fields_data[field] = config.copy()
                if field == 'nama_penerima':
                    fields_data[field]['text'] = name
                else:
                    fields_data[field]['text'] = form_data.get(field, '')
            
            # Gunakan nama yang aman untuk URL
            safe_name = "".join(c for c in name if c.isalnum() or c in (' ', '.')).rstrip()
            output_filename = f"sertifikat_{i+1}_{safe_name.replace(' ', '_')}.png"
            output_path = os.path.join(session_generated_path, output_filename)
            
            create_certificate(
                template_path=template_path,
                output_path=output_path,
                fields_data=fields_data,
                logo_path=logo_filepath,
                logo_config=template_meta.get('logo')
            )
            generated_files_paths.append(output_path)
            # Buat URL untuk setiap gambar dan tambahkan ke daftar
            preview_urls.append(f'/generated/{session_id}/{output_filename}')

        zip_filename = f"sertifikat_{session_id}.zip"
        zip_path = os.path.join(app.config['GENERATED_FOLDER'], zip_filename)
        zip_files(generated_files_paths, zip_path)

        # Hapus folder upload, tapi JANGAN hapus folder generated dulu
        shutil.rmtree(session_upload_path)

        # Kirim daftar URL preview ke frontend
        return jsonify({
            'success': True,
            'download_url': f'/download/{zip_filename}',
            'preview_urls': preview_urls # <-- Kirim daftar URL
        })

    except Exception as e:
        shutil.rmtree(session_upload_path)
        shutil.rmtree(session_generated_path)
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/download/<filename>')
def download(filename):
    return send_from_directory(app.config['GENERATED_FOLDER'], filename, as_attachment=True)

# **RUTE BARU** untuk menyajikan gambar preview individual
@app.route('/generated/<session_id>/<filename>')
def serve_generated_file(session_id, filename):
    session_path = os.path.join(app.config['GENERATED_FOLDER'], session_id)
    return send_from_directory(session_path, filename)

if __name__ == '__main__':
    app.run(debug=True)