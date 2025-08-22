document.addEventListener('DOMContentLoaded', function() {
    // ... (Variabel DOM dan fungsi loadTemplates tetap sama) ...
    const templateListContainer = document.getElementById('template-list');
    const addTemplateForm = document.getElementById('add-template-form');
    const fieldsListContainer = document.getElementById('fields-list');
    const addFieldBtn = document.getElementById('add-field-btn');
    const editorCanvas = document.getElementById('editor-canvas');
    const draggableContainer = document.getElementById('draggable-container');
    const templateImageInput = document.getElementById('template-image');
    const modal = document.getElementById('preview-modal');
    const modalCanvas = document.getElementById('modal-canvas');
    const modalTitle = document.getElementById('modal-title');

    let fields = [];
    let activeFieldId = null;

    // Fungsi untuk memuat dan menampilkan semua template
    async function loadTemplates() {
        const response = await fetch('/api/templates');
        const templates = await response.json();
        templateListContainer.innerHTML = '';
        if (templates.length === 0) {
            templateListContainer.innerHTML = '<p>Belum ada template.</p>';
            return;
        }
        templates.forEach(template => {
            const card = document.createElement('div');
            card.className = 'admin-template-card';
            card.dataset.templateId = template.id;
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
    }

    // Fungsi untuk menggambar preview di modal
    async function showPreview(templateId) {
        const response = await fetch('/api/templates');
        const templates = await response.json();
        const template = templates.find(t => t.id === templateId);
        if (!template) return;

        modalTitle.innerText = `Preview: ${template.preview_name}`;
        const ctx = modalCanvas.getContext('2d');
        modalCanvas.width = 2000;
        modalCanvas.height = 1414;

        const bg = new Image();
        bg.src = `/static/templates_base/${template.background_image}`;
        bg.onload = () => {
            ctx.drawImage(bg, 0, 0, modalCanvas.width, modalCanvas.height);
            const sampleData = { nama_penerima: "Nama Peserta" };
            template.fields.forEach(f => {
                if (f.name !== 'nama_penerima') sampleData[f.name] = `[Contoh ${f.label}]`;
            });

            template.fields.forEach(field => {
                const text = sampleData[field.name];
                const isBold = field.font.includes('-Bold');
                const fontName = field.font.replace('-Bold', '');
                ctx.font = `${isBold ? 'bold ' : ''}${field.size}px '${fontName}', sans-serif`;
                ctx.fillStyle = field.color;
                ctx.textAlign = field.align;
                ctx.fillText(text, field.x, field.y);
            });
            modal.classList.remove('hidden');
        };
    }

    // Event listener untuk menampilkan preview
    templateListContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn')) return;
        const card = e.target.closest('.admin-template-card');
        if (card) {
            showPreview(card.dataset.templateId);
        }
    });
    modal.querySelector('.close-modal-btn').addEventListener('click', () => modal.classList.add('hidden'));

    // Fungsi untuk render ulang semua elemen di editor
    function renderEditor() {
        // Render daftar field di panel kiri
        fieldsListContainer.innerHTML = fields.map(f => `
            <div class="field-item ${f.id === activeFieldId ? 'active' : ''}" data-id="${f.id}">
                <strong>${f.name}</strong>
                <span>${f.font}, ${f.size}px</span>
            </div>
        `).join('');

        // Render elemen draggable di kanvas
        draggableContainer.innerHTML = '';
        fields.forEach(f => {
            const el = document.createElement('div');
            el.className = `draggable-field ${f.id === activeFieldId ? 'active' : ''}`;
            el.dataset.id = f.id;
            el.innerText = f.name;
            el.style.left = `${(f.x / 2000) * 100}%`;
            el.style.top = `${(f.y / 1414) * 100}%`;
            el.style.fontFamily = f.font.replace('-Bold', '');
            el.style.fontWeight = f.font.includes('-Bold') ? 'bold' : 'normal';
            el.style.fontSize = `${f.size / 20}px`; // Ukuran font disesuaikan untuk preview
            el.style.color = f.color;
            
            if (f.id === activeFieldId) {
                el.innerHTML += `
                    <div class="property-panel">
                        <label>Font</label><input type="text" value="${f.font}" data-prop="font">
                        <label>Size</label><input type="number" value="${f.size}" data-prop="size">
                        <label>Color</label><input type="color" value="${f.color}" data-prop="color">
                        <label>Align</label>
                        <select data-prop="align">
                            <option value="left" ${f.align === 'left' ? 'selected' : ''}>Left</option>
                            <option value="center" ${f.align === 'center' ? 'selected' : ''}>Center</option>
                            <option value="right" ${f.align === 'right' ? 'selected' : ''}>Right</option>
                        </select>
                    </div>
                `;
            }
            draggableContainer.appendChild(el);
        });
    }

    // Event listener untuk upload gambar
    templateImageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const ctx = editorCanvas.getContext('2d');
                const img = new Image();
                img.onload = function() {
                    editorCanvas.width = 2000;
                    editorCanvas.height = 1414;
                    ctx.drawImage(img, 0, 0, 2000, 1414);
                }
                img.src = event.target.result;
            }
            reader.readAsDataURL(file);
        }
    });

    // Logika Drag and Drop
    let isDragging = false;
    let offsetX, offsetY;
    draggableContainer.addEventListener('mousedown', function(e) {
        if (e.target.classList.contains('draggable-field')) {
            isDragging = true;
            const fieldEl = e.target;
            activeFieldId = parseInt(fieldEl.dataset.id);
            offsetX = e.clientX - fieldEl.getBoundingClientRect().left;
            offsetY = e.clientY - fieldEl.getBoundingClientRect().top;
            renderEditor();
        }
    });
    document.addEventListener('mousemove', function(e) {
        if (isDragging) {
            const containerRect = draggableContainer.getBoundingClientRect();
            const x = e.clientX - containerRect.left - offsetX;
            const y = e.clientY - containerRect.top - offsetY;
            
            const field = fields.find(f => f.id === activeFieldId);
            field.x = Math.round((x / containerRect.width) * 2000);
            field.y = Math.round((y / containerRect.height) * 1414);
            renderEditor();
        }
    });
    document.addEventListener('mouseup', () => { isDragging = false; });

    // Update properti dari panel
    draggableContainer.addEventListener('input', function(e) {
        const prop = e.target.dataset.prop;
        const field = fields.find(f => f.id === activeFieldId);
        if (prop) {
            field[prop] = e.target.value;
            renderEditor();
        }
    });

    // Klik field di panel kiri untuk mengaktifkan
    fieldsListContainer.addEventListener('click', function(e) {
        const item = e.target.closest('.field-item');
        if (item) {
            activeFieldId = parseInt(item.dataset.id);
            renderEditor();
        }
    });

    // Tombol Tambah Field
    addFieldBtn.addEventListener('click', function() {
        const name = prompt("Masukkan nama field (unik, tanpa spasi, cth: 'deskripsi'):");
        if (name) {
            fields.push({
                id: Date.now(),
                name: name,
                label: name.charAt(0).toUpperCase() + name.slice(1),
                font: 'Poppins', size: 40, color: '#333333', align: 'center', x: 1000, y: 1000
            });
            activeFieldId = fields[fields.length - 1].id;
            renderEditor();
        }
    });

    // Submit Form
    addTemplateForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const templateData = {
            id: document.getElementById('template-id').value,
            preview_name: document.getElementById('template-name').value,
            category: document.getElementById('template-category').value,
            fields: fields.map(({ id, ...rest }) => rest) // Hapus ID internal
        };
        // ... (sisa logika submit sama seperti sebelumnya) ...
        const formData = new FormData();
        formData.append('background_image', document.getElementById('template-image').files[0]);
        formData.append('template_data', JSON.stringify(templateData));
        const response = await fetch('/api/templates/add', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) {
            Swal.fire('Berhasil!', 'Template telah disimpan.', 'success').then(() => location.reload());
        } else {
            Swal.fire('Gagal!', result.error, 'error');
        }
    });

    // Hapus Template
    templateListContainer.addEventListener('click', async function(e) {
        if (e.target.classList.contains('delete-btn')) {
            e.stopPropagation(); // Mencegah modal preview muncul
            const templateId = e.target.dataset.id;
            // ... (sisa logika hapus sama seperti sebelumnya) ...
            const confirmation = await Swal.fire({ title: 'Anda yakin?', text: `Template "${templateId}" akan dihapus!`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, hapus!' });
            if (confirmation.isConfirmed) {
                const response = await fetch('/api/templates/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: templateId }) });
                const result = await response.json();
                if (result.success) {
                    Swal.fire('Dihapus!', 'Template telah dihapus.', 'success');
                    loadTemplates();
                } else {
                    Swal.fire('Gagal!', result.error, 'error');
                }
            }
        }
    });

    // Inisialisasi
    loadTemplates();
    fields.push({ id: Date.now(), name: 'nama_penerima', label: 'Nama Penerima (Otomatis)', font: 'Great Vibes', size: 150, color: '#333333', align: 'center', x: 1000, y: 700 });
    renderEditor();
});