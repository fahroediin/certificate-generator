document.addEventListener('DOMContentLoaded', function() {
    let currentStep = 1;
    const userSelection = {
        category: null,
        template: null,
    };
    const sampleNames = ['Ahmad Fauzi', 'Citra Lestari', 'Budi Santoso', 'Dewi Anggraini'];
    const steps = document.querySelectorAll('.wizard-step');
    const categorySelector = document.getElementById('category-selector');
    const templateSelector = document.getElementById('template-selector');
    const dynamicFieldsContainer = document.getElementById('dynamic-fields');
    const previewContainer = document.getElementById('preview-container');
    const previewBg = document.getElementById('preview-bg');
    const previewOverlays = document.getElementById('preview-overlays');
    const form = document.getElementById('generator-form');
    const uploadSection = document.getElementById('upload-section');
    const selectedTemplateInput = document.getElementById('selected-template-input');
    const resultPopup = document.getElementById('result-popup');
    const progressBar = document.getElementById('progress-bar');

    function showStep(stepNumber) {
        steps.forEach(step => step.classList.remove('active'));
        const targetStep = document.getElementById(`step-${stepNumber}-category`) ||
                         document.getElementById(`step-${stepNumber}-template`) ||
                         document.getElementById(`step-${stepNumber}-details`);
        if (targetStep) {
            targetStep.classList.add('active');
        }
        currentStep = stepNumber;

        if (stepNumber === 1) {
            progressBar.style.width = '33%';
        } else if (stepNumber === 2) {
            progressBar.style.width = '66%';
        } else if (stepNumber === 3) {
            progressBar.style.width = '100%';
            setTimeout(updatePreviewFontSizes, 50);
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
        const categories = [...new Set(Object.values(TEMPLATE_METADATA).map(t => t.category))];
        categorySelector.innerHTML = categories.map(cat => `
            <div class="category-card" data-category="${cat}">${cat}</div>
        `).join('');
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                userSelection.category = card.dataset.category;
                renderTemplates(userSelection.category);
                showStep(2);
            });
        });
    }

    function renderTemplates(category) {
        const filteredTemplates = Object.entries(TEMPLATE_METADATA).filter(([_, meta]) => meta.category === category);
        templateSelector.innerHTML = filteredTemplates.map(([filename, meta]) => `
            <div class="template-card" data-template="${filename}">
                <img src="/static/templates_base/${filename}" alt="${meta.preview_name}">
                <span>${meta.preview_name}</span>
            </div>
        `).join('');
        document.querySelectorAll('.template-card').forEach(card => {
            card.addEventListener('click', () => {
                userSelection.template = card.dataset.template;
                selectedTemplateInput.value = userSelection.template;
                renderDetailsAndPreview(userSelection.template);
                showStep(3);
            });
        });
    }

    function updatePreviewFontSizes() {
        const previewWidth = previewContainer.offsetWidth;
        if (previewWidth === 0) return;
        const baseTemplateWidth = 2000;
        document.querySelectorAll('.preview-text').forEach(textElement => {
            const baseSize = parseFloat(textElement.dataset.baseSize);
            if (!isNaN(baseSize)) {
                const responsiveSize = (baseSize / baseTemplateWidth) * previewWidth;
                textElement.style.fontSize = `${responsiveSize}px`;
            }
        });
    }

    function renderDetailsAndPreview(templateFile) {
        const meta = TEMPLATE_METADATA[templateFile];
        if (!meta) return;
        dynamicFieldsContainer.innerHTML = '';
        Object.entries(meta.fields).forEach(([name, config]) => {
            if (name === 'nama_penerima') return;
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            const labelText = name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            formGroup.innerHTML = `
                <label for="${name}">${labelText}</label>
                <input type="text" id="${name}" name="${name}" required>
            `;
            dynamicFieldsContainer.appendChild(formGroup);
        });
        previewBg.src = `/static/templates_base/${templateFile}`;
        previewOverlays.innerHTML = '';
        Object.entries(meta.fields).forEach(([name, config]) => {
            const textOverlay = document.createElement('div');
            textOverlay.id = `preview-${name}`;
            textOverlay.className = 'preview-text';
            textOverlay.dataset.baseSize = config.size;
            const containerWidth = 2000;
            const containerHeight = 1414;
            textOverlay.style.left = `${(config.pos[0] / containerWidth) * 100}%`;
            textOverlay.style.top = `${(config.pos[1] / containerHeight) * 100}%`;
            textOverlay.style.fontFamily = config.font.includes('GreatVibes') ? "'Great Vibes', cursive" : "'Poppins', sans-serif";
            textOverlay.style.color = config.color;
            textOverlay.style.fontWeight = config.font.includes('Bold') ? 'bold' : 'normal';
            const align = config.align || 'center';
            textOverlay.style.textAlign = align;
            if (align === 'center') {
                textOverlay.style.transform = 'translateX(-50%)';
            } else if (align === 'right') {
                textOverlay.style.transform = 'translateX(-100%)';
            } else {
                textOverlay.style.transform = 'translateX(0)';
            }
            if (name === 'nama_penerima') {
                textOverlay.innerText = sampleNames[Math.floor(Math.random() * sampleNames.length)];
            } else {
                const labelText = name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                textOverlay.innerText = `[${labelText}]`;
            }
            previewOverlays.appendChild(textOverlay);
        });
        addLivePreviewListeners();
        checkFormCompletion();
    }

    function addLivePreviewListeners() {
        const inputs = dynamicFieldsContainer.querySelectorAll('input[type="text"]');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                const previewEl = document.getElementById(`preview-${input.name}`);
                if (previewEl) {
                    const labelText = input.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    previewEl.innerText = input.value || `[${labelText}]`;
                }
                checkFormCompletion();
            });
        });
    }

    function checkFormCompletion() {
        const inputs = Array.from(dynamicFieldsContainer.querySelectorAll('input[required]'));
        const allFilled = inputs.every(input => input.value.trim() !== '');
        if (allFilled) {
            uploadSection.classList.remove('hidden');
        } else {
            uploadSection.classList.add('hidden');
        }
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        let isFormValid = true;
        const requiredInputs = form.querySelectorAll('[required]');
        requiredInputs.forEach(input => {
            if (!input.value.trim()) {
                isFormValid = false;
            }
        });

        // **PERUBAHAN DI SINI: Ganti alert() dengan Swal.fire()**
        if (!isFormValid) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Harap isi semua field yang wajib diisi sebelum generate.',
            });
            return;
        }

        document.getElementById('loading-overlay').classList.remove('hidden');
        const formData = new FormData(form);
        try {
            const response = await fetch('/generate', { method: 'POST', body: formData });
            const result = await response.json();
            document.getElementById('loading-overlay').classList.add('hidden');
            if (result.success) {
                document.getElementById('download-link').href = result.download_url;
                const gallery = document.getElementById('preview-gallery');
                gallery.innerHTML = '';
                result.preview_urls.forEach(url => {
                    const img = document.createElement('img');
                    img.src = url;
                    img.alt = 'Preview Sertifikat';
                    gallery.appendChild(img);
                });
                resultPopup.classList.remove('hidden');
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Terjadi Kesalahan',
                    text: result.error,
                });
            }
        } catch (error) {
            document.getElementById('loading-overlay').classList.add('hidden');
            Swal.fire({
                icon: 'error',
                title: 'Koneksi Gagal',
                text: 'Tidak dapat terhubung ke server. Silakan coba lagi.',
            });
        }
    });
    
    resultPopup.querySelector('.close-btn').addEventListener('click', () => {
        resultPopup.classList.add('hidden');
    });

    document.getElementById('regenerate-btn').addEventListener('click', () => {
        resultPopup.classList.add('hidden');
    });

    renderCategories();
    showStep(1);
    window.addEventListener('resize', updatePreviewFontSizes);
});