// static/js/admin.js
document.addEventListener('DOMContentLoaded', function() {
    const templateListContainer = document.getElementById('template-list');
    const addTemplateForm = document.getElementById('add-template-form');
    const fieldsContainer = document.getElementById('fields-container');
    const addFieldBtn = document.getElementById('add-field-btn');

    // Fungsi untuk memuat dan menampilkan semua template
    async function loadTemplates() {
        try {
            const response = await fetch('/api/templates');
            const templates = await response.json();
            
            templateListContainer.innerHTML = ''; // Kosongkan dulu
            if (templates.length === 0) {
                templateListContainer.innerHTML = '<p>Belum ada template.</p>';
                return;
            }

            templates.forEach(template => {
                const card = document.createElement('div');
                card.className = 'admin-template-card';
                card.innerHTML = `
                    <img src="/static/templates_base/${template.background_image}" alt="${template.preview_name}">
                    <div class="info">
                        <h4>${template.preview_name}</h4>
                        <p>ID: ${template.id}</p>
                        <p>Kategori: ${template.category}</p>
                    </div>
                    <button class="delete-btn" data-id="${template.id}">&times;</button>
                `;
                templateListContainer.appendChild(card);
            });
        } catch (error) {
            console.error('Gagal memuat template:', error);
            templateListContainer.innerHTML = '<p>Gagal memuat template.</p>';
        }
    }

    // Fungsi untuk menambah baris field baru di form
    function addFieldRow(field = {}) {
        const fieldId = Date.now(); // ID unik untuk setiap baris
        const row = document.createElement('div');
        row.className = 'form-grid field-row';
        row.innerHTML = `
            <input type="text" placeholder="Nama Field (cth: nama_penerima)" value="${field.name || ''}" data-prop="name" required>
            <input type="text" placeholder="Label Form (cth: Nama Penerima)" value="${field.label || ''}" data-prop="label">
            <input type="text" placeholder="Font (cth: Poppins)" value="${field.font || 'Poppins'}" data-prop="font" required>
            <input type="number" placeholder="Ukuran (px)" value="${field.size || 40}" data-prop="size" required>
            <input type="text" placeholder="Warna (#FFFFFF)" value="${field.color || '#333333'}" data-prop="color" required>
            <select data-prop="align">
                <option value="center" ${field.align === 'center' ? 'selected' : ''}>Center</option>
                <option value="left" ${field.align === 'left' ? 'selected' : ''}>Left</option>
                <option value="right" ${field.align === 'right' ? 'selected' : ''}>Right</option>
            </select>
            <input type="number" placeholder="Posisi X" value="${field.x || 1000}" data-prop="x" required>
            <input type="number" placeholder="Posisi Y" value="${field.y || 500}" data-prop="y" required>
            <button type="button" class="remove-field-btn">-</button>
        `;
        fieldsContainer.appendChild(row);
    }

    // Event listener untuk tombol "Tambah Field"
    addFieldBtn.addEventListener('click', () => addFieldRow());

    // Event listener untuk menghapus baris field
    fieldsContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-field-btn')) {
            e.target.parentElement.remove();
        }
    });

    // Event listener untuk submit form
    addTemplateForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const templateData = {
            id: document.getElementById('template-id').value,
            preview_name: document.getElementById('template-name').value,
            category: document.getElementById('template-category').value,
            fields: []
        };

        document.querySelectorAll('.field-row').forEach(row => {
            const field = {};
            row.querySelectorAll('[data-prop]').forEach(input => {
                field[input.dataset.prop] = (input.type === 'number') ? parseInt(input.value) : input.value;
            });
            templateData.fields.push(field);
        });

        const formData = new FormData();
        formData.append('background_image', document.getElementById('template-image').files[0]);
        formData.append('template_data', JSON.stringify(templateData));

        try {
            const response = await fetch('/api/templates/add', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                Swal.fire('Berhasil!', 'Template telah berhasil disimpan.', 'success');
                addTemplateForm.reset();
                fieldsContainer.innerHTML = '';
                loadTemplates();
            } else {
                Swal.fire('Gagal!', result.error || 'Terjadi kesalahan.', 'error');
            }
        } catch (error) {
            Swal.fire('Gagal!', 'Tidak dapat terhubung ke server.', 'error');
        }
    });

    // Event listener untuk tombol hapus
    templateListContainer.addEventListener('click', async function(e) {
        if (e.target.classList.contains('delete-btn')) {
            const templateId = e.target.dataset.id;
            
            const confirmation = await Swal.fire({
                title: 'Anda yakin?',
                text: `Template dengan ID "${templateId}" akan dihapus permanen!`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Ya, hapus!',
                cancelButtonText: 'Batal'
            });

            if (confirmation.isConfirmed) {
                try {
                    const response = await fetch('/api/templates/delete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: templateId })
                    });
                    const result = await response.json();
                    if (result.success) {
                        Swal.fire('Dihapus!', 'Template telah berhasil dihapus.', 'success');
                        loadTemplates();
                    } else {
                        Swal.fire('Gagal!', result.error || 'Gagal menghapus template.', 'error');
                    }
                } catch (error) {
                    Swal.fire('Gagal!', 'Tidak dapat terhubung ke server.', 'error');
                }
            }
        }
    });

    // Inisialisasi
    loadTemplates();
    // Tambah field default untuk nama penerima
    addFieldRow({ name: 'nama_penerima', label: 'Nama Penerima (Otomatis)', font: 'Great Vibes', size: 150, color: '#333333', align: 'center', x: 1000, y: 700 });
});