document.addEventListener('DOMContentLoaded', function() {
    // Variabel Global
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
    const rulerTop = document.getElementById('ruler-top');
    const rulerLeft = document.getElementById('ruler-left');
    const canvasWrapper = document.getElementById('canvas-wrapper');
    const guideX = document.getElementById('guide-x');
    const guideY = document.getElementById('guide-y');
    const coordsTooltip = document.getElementById('coords-tooltip');
    const formTitle = document.getElementById('form-title');
    const editModeIdInput = document.getElementById('edit-mode-id');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const saveBtn = document.getElementById('save-btn');

    let fields = [];
    let activeFieldId = null;
    let isEditMode = false;
    const CANVAS_WIDTH = 2000;
    const CANVAS_HEIGHT = 1414;
    const FONT_OPTIONS = ['Poppins', 'Poppins-Bold', 'Great Vibes', 'Arial', 'Verdana', 'Times New Roman']; // Tambahkan font lain jika perlu

    // ================== MODUL MANAJEMEN KATEGORI ==================
    // ... (Kode Manajemen Kategori tidak berubah, bisa di-copy-paste dari file asli Anda)
    const CategoryManager = {
        listEl: document.getElementById('category-list'),
        addBtnEl: document.getElementById('add-category-btn'),
        selectEl: document.getElementById('template-category'),

        async init() {
            await this.load();
            this.addBtnEl.addEventListener('click', () => this.showAddModal());
            this.listEl.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-category-btn')) {
                    this.delete(e.target.dataset.category);
                }
            });
        },

        async load() {
            try {
                const response = await fetch('/api/categories');
                if (!response.ok) throw new Error('Gagal memuat kategori');
                const categories = await response.json();
                
                this.listEl.innerHTML = '';
                this.selectEl.innerHTML = '';
                
                if (categories.length === 0) {
                    this.selectEl.innerHTML = '<option value="">-- Buat kategori dulu --</option>';
                    this.selectEl.disabled = true;
                } else {
                    this.selectEl.disabled = false;
                    categories.forEach(cat => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${cat}</td>
                            <td><button type="button" class="button-small danger delete-category-btn" data-category="${cat}">Hapus</button></td>
                        `;
                        this.listEl.appendChild(row);
                        this.selectEl.innerHTML += `<option value="${cat}">${cat}</option>`;
                    });
                }

            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'Gagal memuat daftar kategori.', 'error');
            }
        },

        async showAddModal() {
            const { value: newCategory } = await Swal.fire({
                title: 'Tambah Kategori Baru',
                input: 'text',
                inputLabel: 'Nama Kategori',
                inputPlaceholder: 'Masukkan nama kategori...',
                showCancelButton: true,
                confirmButtonText: 'Simpan',
                cancelButtonText: 'Batal',
                inputValidator: (value) => {
                    if (!value || value.trim() === '') {
                        return 'Nama kategori tidak boleh kosong!';
                    }
                }
            });

            if (newCategory) {
                await this.add(newCategory.trim());
            }
        },

        async add(newCategory) {
            try {
                const response = await fetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ category: newCategory })
                });
                const result = await response.json();
                if (result.success) {
                    await this.load();
                } else {
                    Swal.fire('Gagal', result.error, 'error');
                }
            } catch (error) {
                Swal.fire('Error', 'Gagal terhubung ke server.', 'error');
            }
        },

        async delete(category) {
            const confirmation = await Swal.fire({
                title: 'Hapus Kategori?',
                text: `Anda yakin ingin menghapus kategori "${category}"? Tindakan ini tidak dapat dibatalkan.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonText: 'Batal',
                confirmButtonText: 'Ya, Hapus'
            });

            if (confirmation.isConfirmed) {
                try {
                    const response = await fetch('/api/categories/delete', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ category: category })
                    });
                    const result = await response.json();
                    if (result.success) {
                        await this.load();
                        await loadTemplates(); // Muat ulang template untuk mencerminkan perubahan
                    } else {
                        Swal.fire('Gagal', result.error, 'error');
                    }
                } catch (error) {
                    Swal.fire('Error', 'Gagal terhubung ke server.', 'error');
                }
            }
        }
    };
    
    // ================== MANAJEMEN TEMPLATE ==================
    // ... (Fungsi loadTemplates & showPreview tidak berubah)
    async function loadTemplates() {
        try {
            const response = await fetch('/api/templates');
            const templates = await response.json();
            templateListContainer.innerHTML = '';
            if (templates.length === 0) {
                templateListContainer.innerHTML = '<p>Belum ada template. Silakan tambahkan template baru di bawah.</p>';
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
                        <p>Kategori: ${template.category}</p>
                    </div>
                    <div class="actions">
                        <button class="action-btn edit-btn" data-id="${template.id}" title="Edit">✏️</button>
                        <button class="action-btn delete-btn" data-id="${template.id}" title="Hapus">🗑️</button>
                    </div>
                `;
                templateListContainer.appendChild(card);
            });
        } catch (error) {
            console.error('Gagal memuat template:', error);
            templateListContainer.innerHTML = '<p>Gagal memuat template.</p>';
        }
    }

    async function showPreview(templateId) {
        const response = await fetch('/api/templates');
        const templates = await response.json();
        const template = templates.find(t => t.id === templateId);
        if (!template) return;

        modal.classList.remove('hidden');
        modalTitle.innerText = `Preview: ${template.preview_name}`;
        
        const ctx = modalCanvas.getContext('2d');
        modalCanvas.width = CANVAS_WIDTH;
        modalCanvas.height = CANVAS_HEIGHT;

        const bg = new Image();
        bg.src = `/static/templates_base/${template.background_image}`;
        bg.onload = () => {
            ctx.drawImage(bg, 0, 0, modalCanvas.width, modalCanvas.height);
            const sampleData = { nama_penerima: "Nama Peserta Contoh" };
            template.fields.forEach(f => {
                if (f.name !== 'nama_penerima') sampleData[f.name] = `[Contoh ${f.label || f.name}]`;
            });
            template.fields.forEach(field => {
                const text = sampleData[field.name];
                if (!text) return;
                const isBold = field.font.includes('-Bold');
                const fontName = field.font.replace('-Bold', '');
                ctx.font = `${isBold ? 'bold ' : ''}${field.size}px '${fontName}', sans-serif`;
                ctx.fillStyle = field.color;
                ctx.textAlign = field.align;
                ctx.fillText(text, field.x, field.y);
            });
        };
        bg.onerror = () => {
             ctx.fillStyle = '#f0f0f0';
             ctx.fillRect(0, 0, modalCanvas.width, modalCanvas.height);
             ctx.fillStyle = '#333';
             ctx.textAlign = 'center';
             ctx.font = '50px Poppins';
             ctx.fillText('Gambar tidak ditemukan', modalCanvas.width / 2, modalCanvas.height / 2);
        }
    }
    
    // ... (Fungsi createRulers & event listener mousemove/mouseleave tidak berubah)
    function createRulers() {
        rulerTop.innerHTML = '';
        rulerLeft.innerHTML = '';
        for (let i = 0; i <= CANVAS_WIDTH; i += 50) {
            const isMajor = i % 100 === 0;
            const tickTop = document.createElement('div');
            tickTop.className = `tick ${isMajor ? 'major' : ''}`;
            tickTop.style.left = `${(i / CANVAS_WIDTH) * 100}%`;
            tickTop.style.height = isMajor ? '10px' : '5px';
            rulerTop.appendChild(tickTop);
            if (isMajor && i > 0) {
                const label = document.createElement('span');
                label.className = 'label';
                label.innerText = i;
                label.style.left = `${(i / CANVAS_WIDTH) * 100}%`;
                rulerTop.appendChild(label);
            }
        }
        for (let i = 0; i <= CANVAS_HEIGHT; i += 50) {
            const isMajor = i % 100 === 0;
            const tickLeft = document.createElement('div');
            tickLeft.className = `tick ${isMajor ? 'major' : ''}`;
            tickLeft.style.top = `${(i / CANVAS_HEIGHT) * 100}%`;
            tickLeft.style.width = isMajor ? '10px' : '5px';
            rulerLeft.appendChild(tickLeft);
            if (isMajor && i > 0) {
                const label = document.createElement('span');
                label.className = 'label';
                label.innerText = i;
                label.style.top = `${(i / CANVAS_HEIGHT) * 100}%`;
                label.style.transform = 'translateY(-50%) rotate(-90deg)';
                rulerLeft.appendChild(label);
            }
        }
    }

    let tooltipTimeout;
    canvasWrapper.addEventListener('mousemove', (e) => {
        clearTimeout(tooltipTimeout);
        guideX.style.display = 'block';
        guideY.style.display = 'block';
        coordsTooltip.style.display = 'block';
        const rect = canvasWrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        guideX.style.left = `${x}px`;
        guideY.style.top = `${y}px`;
        coordsTooltip.style.left = `${x}px`;
        coordsTooltip.style.top = `${y}px`;
        const realX = Math.round((x / rect.width) * CANVAS_WIDTH);
        const realY = Math.round((y / rect.height) * CANVAS_HEIGHT);
        coordsTooltip.innerText = `X: ${realX}, Y: ${realY}`;
    });
    canvasWrapper.addEventListener('mouseleave', () => {
        tooltipTimeout = setTimeout(() => {
            guideX.style.display = 'none';
            guideY.style.display = 'none';
            coordsTooltip.style.display = 'none';
        }, 100);
    });

    function renderEditor() {
        fieldsListContainer.innerHTML = fields.map(f => {
            const isLocked = f.name === 'nama_penerima';
            return `
            <div class="field-item ${f.id === activeFieldId ? 'active' : ''}" data-id="${f.id}">
                <div>
                    <strong>${f.name} ${isLocked ? '🔒' : ''}</strong>
                    <span>${f.label}</span>
                </div>
                ${!isLocked ? `<button class="delete-field-btn" data-id="${f.id}" title="Hapus field">×</button>` : ''}
            </div>
        `}).join('');

        draggableContainer.innerHTML = '';
        fields.forEach(f => {
            const el = document.createElement('div');
            el.className = `draggable-field ${f.id === activeFieldId ? 'active' : ''}`;
            el.dataset.id = f.id;
            el.innerText = `[${f.label}]`;
            el.style.left = `${(f.x / CANVAS_WIDTH) * 100}%`;
            el.style.top = `${(f.y / CANVAS_HEIGHT) * 100}%`;
            el.style.fontFamily = f.font.replace('-Bold', '');
            el.style.fontWeight = f.font.includes('-Bold') ? 'bold' : 'normal';
            el.style.fontSize = `${f.size / 25}px`;
            el.style.color = f.color;
            el.style.transform = f.align === 'center' ? 'translateX(-50%)' : f.align === 'right' ? 'translateX(-100%)' : 'none';

            if (f.id === activeFieldId) {
                const fontSelectOptions = FONT_OPTIONS.map(font => `<option value="${font}" ${f.font === font ? 'selected' : ''}>${font}</option>`).join('');
                el.innerHTML += `
                    <div class="property-panel">
                        <label>Label</label><input type="text" value="${f.label}" data-prop="label">
                        <label>Font</label><select data-prop="font">${fontSelectOptions}</select>
                        <label>Size (px)</label><input type="number" value="${f.size}" data-prop="size">
                        <label>Color</label><input type="color" value="${f.color}" data-prop="color">
                        <label>Align</label>
                        <select data-prop="align">
                            <option value="left" ${f.align === 'left' ? 'selected' : ''}>Left</option>
                            <option value="center" ${f.align === 'center' ? 'selected' : ''}>Center</option>
                            <option value="right" ${f.align === 'right' ? 'selected' : ''}>Right</option>
                        </select>
                        <label>Max Width (px)</label><input type="number" value="${f.maxWidth || ''}" placeholder="Kosongkan jika tidak perlu" data-prop="maxWidth">
                    </div>
                `;
            }
            draggableContainer.appendChild(el);
        });
    }

    templateImageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const ctx = editorCanvas.getContext('2d');
                const img = new Image();
                img.onload = function() {
                    editorCanvas.width = CANVAS_WIDTH;
                    editorCanvas.height = CANVAS_HEIGHT;
                    ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                }
                img.src = event.target.result;
            }
            reader.readAsDataURL(file);
        }
    });

    // ... (Logika drag and drop mousedown, mousemove, mouseup tidak berubah)
    let isDragging = false;
    let offsetX, offsetY;
    draggableContainer.addEventListener('mousedown', function(e) {
        if (e.target.classList.contains('draggable-field')) {
            isDragging = true;
            const fieldEl = e.target;
            activeFieldId = parseFloat(fieldEl.dataset.id);
            const rect = fieldEl.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            renderEditor();
        }
    });
    document.addEventListener('mousemove', function(e) {
        if (isDragging && activeFieldId) {
            e.preventDefault();
            const containerRect = draggableContainer.getBoundingClientRect();
            const x = e.clientX - containerRect.left - offsetX;
            const y = e.clientY - containerRect.top - offsetY;
            
            const field = fields.find(f => f.id === activeFieldId);
            if (field) {
                field.x = Math.round(Math.max(0, Math.min((x / containerRect.width) * CANVAS_WIDTH, CANVAS_WIDTH)));
                field.y = Math.round(Math.max(0, Math.min((y / containerRect.height) * CANVAS_HEIGHT, CANVAS_HEIGHT)));
                renderEditor();
            }
        }
    });
    document.addEventListener('mouseup', () => { isDragging = false; });
    
    draggableContainer.addEventListener('change', function(e) { // 'change' lebih baik untuk select
        const prop = e.target.dataset.prop;
        const field = fields.find(f => f.id === activeFieldId);
        if (prop && field) {
            field[prop] = e.target.type === 'number' ? parseInt(e.target.value) || null : e.target.value;
            if (prop === 'maxWidth' && !e.target.value) delete field.maxWidth;
            renderEditor();
        }
    });
    draggableContainer.addEventListener('input', function(e) { // 'input' untuk live update text/color
         if (e.target.type === 'select-one') return; // Sudah dihandle 'change'
        const prop = e.target.dataset.prop;
        const field = fields.find(f => f.id === activeFieldId);
        if (prop && field) {
            field[prop] = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
            renderEditor();
        }
    });

    fieldsListContainer.addEventListener('click', function(e) {
        const item = e.target.closest('.field-item');
        if (item) {
            if (e.target.classList.contains('delete-field-btn')) {
                const fieldIdToDelete = parseFloat(e.target.dataset.id);
                fields = fields.filter(f => f.id !== fieldIdToDelete);
                if (activeFieldId === fieldIdToDelete) {
                    activeFieldId = null;
                }
                renderEditor();
            } else {
                activeFieldId = parseFloat(item.dataset.id);
                renderEditor();
            }
        }
    });

    addFieldBtn.addEventListener('click', async function() {
        const { value: name } = await Swal.fire({
            title: 'Tambah Field Baru',
            input: 'text',
            inputLabel: 'Nama Field (unik, tanpa spasi, cth: "deskripsi_acara")',
            inputPlaceholder: 'Masukkan nama field...',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value || value.trim() === '') return 'Nama field tidak boleh kosong!';
                if (/\s/.test(value)) return 'Nama field tidak boleh mengandung spasi!';
                if (fields.some(f => f.name === value.trim())) return 'Nama field sudah digunakan!';
            }
        });
        if (name) {
            const newField = {
                id: Date.now(),
                name: name.trim(),
                label: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                font: 'Poppins', size: 40, color: '#333333', align: 'center', x: 1000, y: 1000
            };
            fields.push(newField);
            activeFieldId = newField.id;
            renderEditor();
        }
    });

    async function enterEditMode(templateId) {
        const response = await fetch('/api/templates');
        const templates = await response.json();
        const templateToEdit = templates.find(t => t.id === templateId);
        if (!templateToEdit) {
            Swal.fire('Error', 'Template tidak ditemukan.', 'error');
            return;
        }
        isEditMode = true;
        formTitle.innerText = 'Edit Template';
        saveBtn.innerText = 'Simpan Perubahan';
        cancelEditBtn.classList.remove('hidden');
        editModeIdInput.value = templateToEdit.id;
        document.getElementById('template-name').value = templateToEdit.preview_name;
        document.getElementById('template-category').value = templateToEdit.category;
        templateImageInput.required = false;
        
        // Pastikan 'nama_penerima' ada dan berikan ID unik
        let namaPenerimaField = templateToEdit.fields.find(f => f.name === 'nama_penerima');
        if (!namaPenerimaField) {
             namaPenerimaField = { name: 'nama_penerima', label: 'Nama Penerima', font: 'Great Vibes', size: 150, color: '#333333', align: 'center', x: 1000, y: 700 };
        }
        
        fields = templateToEdit.fields.map(f => ({ ...f, id: Date.now() + Math.random() }));

        const ctx = editorCanvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = function() {
            editorCanvas.width = CANVAS_WIDTH;
            editorCanvas.height = CANVAS_HEIGHT;
            ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            renderEditor();
        }
        img.onerror = function() {
            ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.fillStyle = '#ccc';
            ctx.fillRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);
            ctx.fillStyle = 'red';
            ctx.textAlign = 'center';
            ctx.fillText('Gagal memuat gambar latar. Mungkin sudah terhapus.', CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
        }
        img.src = `/static/templates_base/${templateToEdit.background_image}`;
        addTemplateForm.scrollIntoView({ behavior: 'smooth' });
    }

    function exitEditMode() {
        isEditMode = false;
        formTitle.innerText = 'Tambah Template Baru';
        saveBtn.innerText = 'Simpan Template';
        cancelEditBtn.classList.add('hidden');
        addTemplateForm.reset();
        editorCanvas.getContext('2d').clearRect(0, 0, editorCanvas.width, editorCanvas.height);
        templateImageInput.required = true;
        
        // PERBAIKAN: Selalu mulai dengan field 'nama_penerima' yang terkunci
        fields = [{ id: Date.now(), name: 'nama_penerima', label: 'Nama Penerima', font: 'Great Vibes', size: 150, color: '#333333', align: 'center', x: 1000, y: 700 }];
        activeFieldId = null;
        renderEditor();
    }

    cancelEditBtn.addEventListener('click', exitEditMode);

    addTemplateForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const templateName = document.getElementById('template-name').value;
        const templateId = isEditMode ? editModeIdInput.value : templateName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_$/, '') + '_' + Date.now().toString().slice(-5);
        
        const templateData = {
            id: templateId,
            preview_name: templateName,
            category: document.getElementById('template-category').value,
            fields: fields.map(({ id, ...rest }) => rest) // Hapus ID internal sebelum menyimpan
        };

        if (!templateData.category) {
            Swal.fire('Gagal!', 'Kategori harus dipilih. Jika kosong, silakan tambah kategori baru terlebih dahulu.', 'error');
            return;
        }

        const formData = new FormData();
        const imageFile = document.getElementById('template-image').files[0];
        
        // Validasi gambar
        if (!isEditMode && !imageFile) {
             Swal.fire('Gagal!', 'Gambar latar wajib diisi untuk template baru.', 'error');
             return;
        }

        if (imageFile) {
            formData.append('background_image', imageFile);
        }
        formData.append('template_data', JSON.stringify(templateData));

        const url = isEditMode ? '/api/templates/update' : '/api/templates/add';
        const response = await fetch(url, { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) {
            Swal.fire('Berhasil!', result.message, 'success').then(() => {
                exitEditMode();
                loadTemplates();
            });
        } else {
            Swal.fire('Gagal!', result.error, 'error');
        }
    });

    templateListContainer.addEventListener('click', async function(e) {
        const target = e.target;
        const card = target.closest('.admin-template-card');
        if (!card) return;

        const templateId = card.dataset.templateId;

        if (target.closest('.delete-btn')) {
            e.stopPropagation();
            const confirmation = await Swal.fire({ title: 'Anda yakin?', text: `Template "${templateId}" akan dihapus secara permanen!`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, hapus!' });
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
        } else if (target.closest('.edit-btn')) {
            e.stopPropagation();
            enterEditMode(templateId);
        } else {
            showPreview(templateId);
        }
    });

    // Event listener untuk modal close
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('close-modal-btn')) {
            modal.classList.add('hidden');
        }
    });


    // Inisialisasi
    CategoryManager.init();
    loadTemplates();
    createRulers();
    exitEditMode(); // Panggil ini untuk set state awal
});