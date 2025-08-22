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
    # Kirim metadata sebagai string JSON ke template
    metadata_json = json.dumps(TEMPLATE_METADATA)
    return render_template('index.html', metadata=metadata_json)

@app.route('/generate', methods=['POST'])
def generate():
    # 1. Buat folder unik untuk sesi generasi ini
    session_id = str(int(time.time()))
    session_upload_path = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
    session_generated_path = os.path.join(app.config['GENERATED_FOLDER'], session_id)
    os.makedirs(session_upload_path, exist_ok=True)
    os.makedirs(session_generated_path, exist_ok=True)

    try:
        # 2. Ambil data dari form
        form_data = request.form
        template_file = form_data.get('template')
        
        # 3. Simpan file yang diupload (Excel & Logo)
        names_file = request.files['names_file']
        names_filepath = os.path.join(session_upload_path, secure_filename(names_file.filename))
        names_file.save(names_filepath)

        logo_filepath = None
        if 'logo' in request.files and request.files['logo'].filename != '':
            logo_file = request.files['logo']
            logo_filepath = os.path.join(session_upload_path, secure_filename(logo_file.filename))
            logo_file.save(logo_filepath)

        # 4. Baca nama dari Excel
        names = get_names_from_excel(names_filepath)
        if not names:
            return jsonify({'success': False, 'error': 'Tidak ada nama yang ditemukan di file Excel.'}), 400

        # 5. Proses generasi sertifikat
        template_path = os.path.join(TEMPLATE_FOLDER, template_file)
        template_meta = TEMPLATE_METADATA[template_file]
        generated_files = []

        for i, name in enumerate(names):
            # Siapkan data teks untuk template
            fields_data = {}
            for field, config in template_meta['fields'].items():
                # Salin config dan tambahkan teks
                fields_data[field] = config.copy()
                if field == 'nama_penerima':
                    fields_data[field]['text'] = name
                else:
                    # Ambil teks dari form, misal 'deskripsi', 'judul_lomba'
                    fields_data[field]['text'] = form_data.get(field, '')
            
            output_filename = f"sertifikat_{i+1}_{name.replace(' ', '_')}.png"
            output_path = os.path.join(session_generated_path, output_filename)
            
            create_certificate(
                template_path=template_path,
                output_path=output_path,
                fields_data=fields_data,
                logo_path=logo_filepath,
                logo_config=template_meta.get('logo')
            )
            generated_files.append(output_path)

        # 6. Buat file ZIP
        zip_filename = f"sertifikat_{session_id}.zip"
        zip_path = os.path.join(app.config['GENERATED_FOLDER'], zip_filename)
        zip_files(generated_files, zip_path)

        # 7. Hapus folder sesi setelah di-zip
        shutil.rmtree(session_upload_path)
        shutil.rmtree(session_generated_path)

        # 8. Kirim URL download ke frontend
        return jsonify({
            'success': True,
            'download_url': f'/download/{zip_filename}',
            'preview_url': f'/preview/{session_id}/{os.path.basename(generated_files[0])}' # URL preview sertifikat pertama
        })

    except Exception as e:
        # Jika terjadi error, hapus folder sesi
        shutil.rmtree(session_upload_path)
        shutil.rmtree(session_generated_path)
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/download/<filename>')
def download(filename):
    return send_from_directory(app.config['GENERATED_FOLDER'], filename, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)