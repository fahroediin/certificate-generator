document.addEventListener('DOMContentLoaded', function() {
    // State management
    let currentStep = 1;
    const userSelection = {
        category: null,
        template: null,
    };

    // DOM Elements
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

    // --- WIZARD NAVIGATION ---
    function showStep(stepNumber) {
        steps.forEach(step => step.classList.remove('active'));
        const targetStep = document.getElementById(`step-${stepNumber}-category`) ||
                         document.getElementById(`step-${stepNumber}-template`) ||
                         document.getElementById(`step-${stepNumber}-details`);
        if (targetStep) {
            targetStep.classList.add('active');
        }
        currentStep = stepNumber;
    }

    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetStepId = btn.dataset.target;
            const targetStepNumber = parseInt(targetStepId.split('-')[1]);
            showStep(targetStepNumber);
        });
    });

    // --- STEP 1: RENDER CATEGORIES ---
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

    // --- STEP 2: RENDER TEMPLATES ---
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

    // --- FUNGSI UNTUK UPDATE FONT SIZE ---
    function updatePreviewFontSizes() {
        const previewWidth = previewContainer.offsetWidth;
        const baseTemplateWidth = 1200; // Lebar asli gambar template
        
        document.querySelectorAll('.preview-text').forEach(textElement => {
            const baseSize = parseFloat(textElement.dataset.baseSize);
            if (!isNaN(baseSize)) {
                const responsiveSize = (baseSize / baseTemplateWidth) * previewWidth;
                textElement.style.fontSize = `${responsiveSize}px`;
            }
        });
    }

    // --- STEP 3: RENDER DETAILS & PREVIEW ---
    function renderDetailsAndPreview(templateFile) {
        const meta = TEMPLATE_METADATA[templateFile];
        if (!meta) return;

        // Render Form
        dynamicFieldsContainer.innerHTML = '';
        Object.entries(meta.fields).forEach(([name, config]) => {
            if (name === 'nama_penerima') return; // Skip name field
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            const labelText = name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            formGroup.innerHTML = `
                <label for="${name}">${labelText}</label>
                <input type="text" id="${name}" name="${name}" required>
            `;
            dynamicFieldsContainer.appendChild(formGroup);
        });

        // Render Preview
        previewBg.src = `/static/templates_base/${templateFile}`;
        previewOverlays.innerHTML = '';
        Object.entries(meta.fields).forEach(([name, config]) => {
            const textOverlay = document.createElement('div');
            textOverlay.id = `preview-${name}`;
            textOverlay.className = 'preview-text';
            textOverlay.dataset.baseSize = config.size;
            
            const containerWidth = 1200;
            const containerHeight = 848;
            textOverlay.style.left = `${(config.pos[0] / containerWidth) * 100}%`;
            textOverlay.style.top = `${(config.pos[1] / containerHeight) * 100}%`;
            textOverlay.style.fontFamily = config.font.includes('GreatVibes') ? "'Great Vibes', cursive" : "'Poppins', sans-serif";
            textOverlay.style.color = config.color;
            textOverlay.style.fontWeight = config.font.includes('Bold') ? 'bold' : 'normal';
            
            // **FIX DI SINI:** Variabel labelText didefinisikan di dalam scope ini
            const labelText = name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            textOverlay.innerText = name === 'nama_penerima' ? 'Nama Penerima' : `[${labelText}]`;
            
            previewOverlays.appendChild(textOverlay);
        });

        updatePreviewFontSizes();
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

    // --- FORM SUBMISSION ---
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        document.getElementById('loading-overlay').classList.remove('hidden');
        const formData = new FormData(form);
        
        try {
            const response = await fetch('/generate', { method: 'POST', body: formData });
            const result = await response.json();
            document.getElementById('loading-overlay').classList.add('hidden');

            if (result.success) {
                document.getElementById('download-link').href = result.download_url;
                document.getElementById('result-popup').classList.remove('hidden');
            } else {
                alert('Terjadi kesalahan: ' + result.error);
            }
        } catch (error) {
            document.getElementById('loading-overlay').classList.add('hidden');
            alert('Gagal terhubung ke server.');
        }
    });
    
    document.querySelector('#result-popup .close-btn').addEventListener('click', () => {
        document.getElementById('result-popup').classList.add('hidden');
    });

    // --- INITIALIZATION ---
    renderCategories();
    showStep(1);

    window.addEventListener('resize', updatePreviewFontSizes);
});