# utils/file_handler.py
import pandas as pd
import zipfile
import os

def get_names_from_excel(file_path):
    """
    Membaca nama dari kolom pertama file Excel.
    """
    try:
        df = pd.read_excel(file_path)
        # Ambil semua nilai dari kolom pertama dan hapus nilai kosong
        names = df.iloc[:, 0].dropna().tolist()
        return names
    except Exception as e:
        print(f"Error reading excel file: {e}")
        return []

def zip_files(files_to_zip, zip_name):
    """
    Membuat file zip dari daftar file.
    """
    with zipfile.ZipFile(zip_name, 'w') as zipf:
        for file_path in files_to_zip:
            zipf.write(file_path, os.path.basename(file_path))
    return zip_name