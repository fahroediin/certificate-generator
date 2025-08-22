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

    let fields = [];
    let activeFieldId = null;
    const CANVAS_WIDTH = 2000;
    const CANVAS_HEIGHT = 1414;

    // ================== MODUL MANAJEMEN KATEGORI ==================
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
                
                categories.forEach(cat => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${cat}</td>
                        <td><button class="button-small danger delete-category-btn" data-category="${cat}">Hapus</button></td>
                    `;
                    this.listEl.appendChild(row);
                    this.selectEl.innerHTML += `<option value="${cat}">${cat}</option>`;
                });
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
                text: `Anda yakin ingin menghapus kategori "${category}"?`,
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
    async function loadTemplates() {
        try {
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

    templateListContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn')) return;
        const card = e.target.closest('.admin-template-card');
        if (card) {
            showPreview(card.dataset.templateId);
        }
    });
    modal.querySelector('.close-modal-btn').addEventListener('click', () => modal.classList.add('hidden'));

    // ================== EDITOR VISUAL & PENGGARIS ==================
    function createRulers() {
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

    canvasWrapper.addEventListener('mousemove', (e) => {
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
    canvasWrapper.addEventListener('mouseenter', () => {
        guideX.style.display = 'block';
        guideY.style.display = 'block';
        coordsTooltip.style.display = 'block';
    });
    canvasWrapper.addEventListener('mouseleave', () => {
        guideX.style.display = 'none';
        guideY.style.display = 'none';
        coordsTooltip.style.display = 'none';
    });

    // **PERBAIKAN FLICKER TOOLTIP**
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
        }, 100); // Beri jeda sedikit sebelum menyembunyikan
    });


    function renderEditor() {
        fieldsListContainer.innerHTML = fields.map(f => `
            <div class="field-item ${f.id === activeFieldId ? 'active' : ''}" data-id="${f.id}">
                <strong>${f.name}</strong>
                <span>${f.font}, ${f.size}px</span>
            </div>
        `).join('');

        draggableContainer.innerHTML = '';
        fields.forEach(f => {
            const el = document.createElement('div');
            el.className = `draggable-field ${f.id === activeFieldId ? 'active' : ''}`;
            el.dataset.id = f.id;
            el.innerText = f.name;
            el.style.left = `${(f.x / CANVAS_WIDTH) * 100}%`;
            el.style.top = `${(f.y / CANVAS_HEIGHT) * 100}%`;
            el.style.fontFamily = f.font.replace('-Bold', '');
            el.style.fontWeight = f.font.includes('-Bold') ? 'bold' : 'normal';
            el.style.fontSize = `${f.size / 25}px`;
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
            field.x = Math.round((x / containerRect.width) * CANVAS_WIDTH);
            field.y = Math.round((y / containerRect.height) * CANVAS_HEIGHT);
            renderEditor();
        }
    });
    document.addEventListener('mouseup', () => { isDragging = false; });

    draggableContainer.addEventListener('input', function(e) {
        const prop = e.target.dataset.prop;
        const field = fields.find(f => f.id === activeFieldId);
        if (prop) {
            field[prop] = e.target.value;
            renderEditor();
        }
    });

    fieldsListContainer.addEventListener('click', function(e) {
        const item = e.target.closest('.field-item');
        if (item) {
            activeFieldId = parseInt(item.dataset.id);
            renderEditor();
        }
    });

    addFieldBtn.addEventListener('click', async function() {
        const { value: name } = await Swal.fire({
            title: 'Tambah Field Baru',
            input: 'text',
            inputLabel: 'Nama Field (unik, tanpa spasi, cth: "deskripsi")',
            inputPlaceholder: 'Masukkan nama field...',
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value || value.trim() === '') return 'Nama field tidak boleh kosong!';
                if (/\s/.test(value)) return 'Nama field tidak boleh mengandung spasi!';
                if (fields.some(f => f.name === value)) return 'Nama field sudah digunakan!';
            }
        });

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

    addTemplateForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const templateName = document.getElementById('template-name').value;
        const templateData = {
            id: templateName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
            preview_name: templateName,
            category: document.getElementById('template-category').value,
            fields: fields.map(({ id, ...rest }) => rest)
        };
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

    templateListContainer.addEventListener('click', async function(e) {
        if (e.target.classList.contains('delete-btn')) {
            e.stopPropagation();
            const templateId = e.target.dataset.id;
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
    CategoryManager.init();
    loadTemplates();
    createRulers();
    fields.push({ id: Date.now(), name: 'nama_penerima', label: 'Nama Penerima (Otomatis)', font: 'Great Vibes', size: 150, color: '#333333', align: 'center', x: 1000, y: 700 });
    renderEditor();
});