document.addEventListener('DOMContentLoaded', function() {
    // ===================================================================================
    // BAGIAN 1: FUNGSI HELPER & GAMBAR
    // ===================================================================================
    const imageCache = {};

    function preloadTemplateImages() {
        TEMPLATES_DATA.forEach(template => {
            const img = new Image();
            img.src = `/static/templates_base/${template.background_image}`;
            imageCache[template.id] = img;
        });
    }

    // FUNGSI BARU UNTUK WORD WRAP
    function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let testLine;
        let metrics;
        
        for (let n = 0; n < words.length; n++) {
            testLine = line + words[n] + ' ';
            metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }

    function drawCertificate(ctx, template, data) {
        const W = ctx.canvas.width;
        const H = ctx.canvas.height;
        const background = imageCache[template.id];

        if (background && background.complete) {
            ctx.drawImage(background, 0, 0, W, H);
        } else {
            background.onload = () => ctx.drawImage(background, 0, 0, W, H);
        }
        
        template.fields.forEach(field => {
            let text = (field.name === 'nama_penerima') ? data.nama_penerima : (data[field.name] || `[${field.label}]`);
            const isBold = field.font.includes('-Bold');
            const fontName = field.font.replace('-Bold', '');
            
            ctx.font = `${isBold ? 'bold ' : ''}${field.size}px '${fontName}', sans-serif`;
            ctx.fillStyle = field.color;
            ctx.textAlign = field.align;
            
            // LOGIKA BARU: Gunakan wrapText jika ada maxWidth
            if (field.maxWidth && text) {
                const lineHeight = field.size * 1.2; // Jarak antar baris
                wrapText(ctx, text, field.x, field.y, field.maxWidth, lineHeight);
            } else {
                ctx.fillText(text, field.x, field.y);
            }
        });
    }

    // ===================================================================================
    // BAGIAN 2: LOGIKA APLIKASI
    // ===================================================================================
    let currentStep = 1;
    const userSelection = {
        category: null,
        templateId: null,
    };
    const sampleNames = ['Ahmad Fauzi', 'Citra Lestari', 'Budi Santoso'];
    let currentSampleName = '';

    const steps = document.querySelectorAll('.wizard-step');
    const categorySelector = document.getElementById('category-selector');
    const templateSelector = document.getElementById('template-selector');
    const dynamicFieldsContainer = document.getElementById('dynamic-fields');
    const previewCanvas = document.getElementById('preview-canvas');
    const form = document.getElementById('generator-form');
    const uploadSection = document.getElementById('upload-section');
    const resultPopup = document.getElementById('result-popup');
    const progressBar = document.getElementById('progress-bar');
    const loadingText = document.getElementById('loading-text');

    function showStep(stepNumber) {
        steps.forEach(step => step.classList.remove('active'));
        const targetStep = document.getElementById(`step-${stepNumber}-category`) ||
                         document.getElementById(`step-${stepNumber}-template`) ||
                         document.getElementById(`step-${stepNumber}-details`);
        if (targetStep) targetStep.classList.add('active');
        currentStep = stepNumber;

        if (stepNumber === 1) progressBar.style.width = '33%';
        else if (stepNumber === 2) progressBar.style.width = '66%';
        else if (stepNumber === 3) {
            progressBar.style.width = '100%';
            drawPreviewCanvas();
        }
    }

    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetStepId = btn.dataset.target;
            const targetStepNumber = parseInt(targetStepId.split('-')[1]);
            showStep(targetStepNumber);
        });
    });

    function renderCategories() {
        const categories = [...new Set(TEMPLATES_DATA.map(t => t.category))];
        categorySelector.innerHTML = categories.map(cat => `<div class="category-card" data-category="${cat}">${cat}</div>`).join('');
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                userSelection.category = card.dataset.category;
                renderTemplates(userSelection.category);
                showStep(2);
            });
        });
    }

    function renderTemplates(category) {
        const filteredTemplates = TEMPLATES_DATA.filter(t => t.category === category);
        templateSelector.innerHTML = filteredTemplates.map(template => `
            <div class="template-card" data-template-id="${template.id}">
                <img src="/static/templates_base/${template.background_image}" alt="${template.preview_name}">
                <span>${template.preview_name}</span>
            </div>
        `).join('');
        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
                userSelection.templateId = card.dataset.templateId;
                renderDetailsForm(userSelection.templateId);
                showStep(3);
            });
        });
    }

    function renderDetailsForm(templateId) {
        currentSampleName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
        const template = TEMPLATES_DATA.find(t => t.id === templateId);
        const formFields = template.fields.filter(f => f.name !== 'nama_penerima');
        
        dynamicFieldsContainer.innerHTML = formFields.map(field => {
            // LOGIKA BARU: Tentukan tipe input
            let inputType = 'text';
            if (field.name.includes('tanggal')) {
                inputType = 'date';
            }

            return `
                <div class="form-group">
                    <label for="${field.name}">${field.label}</label>
                    <input type="${inputType}" id="${field.name}" name="${field.name}" required>
                </div>
            `;
        }).join('');
        
        addLivePreviewListeners();
        checkFormCompletion();
    }

    function drawPreviewCanvas() {
        if (!userSelection.templateId) return;
        
        const template = TEMPLATES_DATA.find(t => t.id === userSelection.templateId);
        const ctx = previewCanvas.getContext('2d');
        
        previewCanvas.width = 2000;
        previewCanvas.height = 1414;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.nama_penerima = currentSampleName;

        drawCertificate(ctx, template, data);
    }

    function addLivePreviewListeners() {
        dynamicFieldsContainer.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                // LOGIKA BARU: Validasi input nama
                if (input.id.includes('nama') && !input.id.includes('jabatan')) {
                    // Hanya izinkan huruf dan spasi
                    input.value = input.value.replace(/[^a-zA-Z\s]/g, '');
                }
                drawPreviewCanvas();
                checkFormCompletion();
            });
        });
    }

    function checkFormCompletion() {
        const allFilled = Array.from(dynamicFieldsContainer.querySelectorAll('input[required]'))
                               .every(input => input.value.trim() !== '');
        uploadSection.classList.toggle('hidden', !allFilled);
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const namesFile = document.getElementById('names_file').files[0];
        if (!namesFile) {
            Swal.fire({ icon: 'error', title: 'File Belum Dipilih', text: 'Harap pilih file Excel berisi daftar nama.' });
            return;
        }

        document.getElementById('loading-overlay').classList.remove('hidden');
        
        try {
            const names = await readNamesFromExcel(namesFile);
            const template = TEMPLATES_DATA.find(t => t.id === userSelection.templateId);
            const formData = new FormData(form);
            const commonData = Object.fromEntries(formData.entries());
            
            const zip = new JSZip();
            const gallery = document.getElementById('preview-gallery');
            gallery.innerHTML = '';

            for (let i = 0; i < names.length; i++) {
                loadingText.innerText = `Membuat sertifikat ${i + 1} dari ${names.length}...`;
                const offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = 2000;
                offscreenCanvas.height = 1414;
                const ctx = offscreenCanvas.getContext('2d');
                
                const certData = { ...commonData, nama_penerima: names[i] };
                drawCertificate(ctx, template, certData);

                const blob = await new Promise(resolve => offscreenCanvas.toBlob(resolve, 'image/png'));
                const safeName = names[i].replace(/[^a-z0-9]/gi, '_').toLowerCase();
                zip.file(`sertifikat_${safeName}.png`, blob);

                const img = document.createElement('img');
                img.src = URL.createObjectURL(blob);
                gallery.appendChild(img);
            }

            loadingText.innerText = 'Membungkus file zip...';
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const downloadUrl = URL.createObjectURL(zipBlob);
            
            document.getElementById('download-link').href = downloadUrl;
            document.getElementById('loading-overlay').classList.add('hidden');
            resultPopup.classList.remove('hidden');

        } catch (error) {
            console.error(error);
            document.getElementById('loading-overlay').classList.add('hidden');
            Swal.fire({ icon: 'error', title: 'Terjadi Kesalahan', text: 'Gagal memproses file. Periksa format Excel Anda.' });
        }
    });

    function readNamesFromExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    const names = json.map(row => row[0]).filter(name => name);
                    resolve(names);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }
    
    resultPopup.querySelector('.close-btn').addEventListener('click', () => resultPopup.classList.add('hidden'));
    document.getElementById('regenerate-btn').addEventListener('click', () => resultPopup.classList.add('hidden'));

    renderCategories();
    showStep(1);
    preloadTemplateImages();
});