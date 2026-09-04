// Form Handling Module

/**
 * Initialize form with validation and submission
 */
function initializeForm(formId, nextPageUrl, previousPageUrl = null) {
    const form = document.getElementById(formId);
    if (!form) return;

    setupLogout();
    protectPage();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleFormSubmit(form, nextPageUrl);
    });

    // Setup back button
    const backBtn = form.querySelector('#cancelBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (previousPageUrl) {
                window.location.href = previousPageUrl;
            } else {
                window.history.back();
            }
        });
    }

    // Setup file input handlers
    setupFileInputs(form);

    // Setup conditional field visibility
    setupConditionalFields(form);

    // Load saved data if exists
    loadFormData(form);
}

/**
 * Handle form submission (Mock - no API calls)
 */
function handleFormSubmit(form, nextPageUrl) {
    // Validate form
    if (!validateForm(form)) {
        return;
    }

    // Save form data
    saveFormData(form);

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').style.display = 'none';
    submitBtn.querySelector('.btn-loader').style.display = 'inline';

    // Simulate API call delay, then redirect
    setTimeout(() => {
        window.location.href = nextPageUrl;
    }, 500);
}

/**
 * Validate form
 */
function validateForm(form) {
    const errorDiv = form.querySelector('#errorMessage');
    const errors = [];

    // Clear previous errors
    form.querySelectorAll('.form-control.error').forEach(el => {
        el.classList.remove('error');
    });

    // Validate required fields
    const inputs = form.querySelectorAll('[required]');
    inputs.forEach(input => {
        const value = input.value.trim();

        if (!value) {
            errors.push(`${getFieldLabel(input)} is required`);
            input.classList.add('error');
            return;
        }

        // Type-specific validation
        const type = input.type;
        const name = input.name;

        if (type === 'email') {
            if (!isValidEmail(value)) {
                errors.push(`${getFieldLabel(input)} is not a valid email`);
                input.classList.add('error');
            }
        } else if (name === 'mobileNumber') {
            if (!isValidMobile(value)) {
                errors.push(`${getFieldLabel(input)} must be 10 digits`);
                input.classList.add('error');
            }
        } else if (name === 'panNumber') {
            if (!isValidPAN(value)) {
                errors.push(`${getFieldLabel(input)} format is invalid`);
                input.classList.add('error');
            }
        } else if (name === 'aadhaarNumber') {
            if (!isValidAadhaar(value)) {
                errors.push(`${getFieldLabel(input)} must be 12 digits`);
                input.classList.add('error');
            }
        } else if (name === 'pinCode') {
            if (!isValidPinCode(value)) {
                errors.push(`${getFieldLabel(input)} must be 6 digits`);
                input.classList.add('error');
            }
        } else if (name === 'ifsc') {
            if (!isValidIFSC(value)) {
                errors.push(`${getFieldLabel(input)} format is invalid`);
                input.classList.add('error');
            }
        } else if (type === 'date') {
            const age = getAge(value);
            if (age < 18) {
                errors.push('You must be at least 18 years old');
                input.classList.add('error');
            }
        }
    });

    // Validate file inputs
    const fileInputs = form.querySelectorAll('input[type="file"][required]');
    fileInputs.forEach(input => {
        if (!input.files || input.files.length === 0) {
            errors.push(`${getFieldLabel(input)} is required`);
            input.classList.add('error');
            return;
        }

        const file = input.files[0];

        // Check file size
        if (!isValidFileSize(file)) {
            errors.push(`${getFieldLabel(input)} exceeds 5MB limit`);
            input.classList.add('error');
            return;
        }

        // Check file type
        if (!isAllowedFileType(file.name)) {
            errors.push(`${getFieldLabel(input)} must be PDF, JPG, or PNG`);
            input.classList.add('error');
        }
    });

    // Show errors
    if (errors.length > 0) {
        showFormError(form, errors.join('<br>'));
        return false;
    }

    return true;
}

/**
 * Get field label for error messages
 */
function getFieldLabel(input) {
    const label = input.parentElement.querySelector('label');
    return label ? label.textContent.replace('*', '').trim() : input.name;
}

/**
 * Show form error
 */
function showFormError(form, message) {
    const errorDiv = form.querySelector('#errorMessage');
    if (errorDiv) {
        errorDiv.innerHTML = message;
        errorDiv.style.display = 'block';
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * Reset submit button
 */
function resetSubmitButton(btn) {
    btn.disabled = false;
    btn.querySelector('.btn-text').style.display = 'inline';
    btn.querySelector('.btn-loader').style.display = 'none';
}

/**
 * Setup file input handlers
 */
function setupFileInputs(form) {
    const fileInputs = form.querySelectorAll('input[type="file"]');

    fileInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];

            if (file) {
                // Validate file
                if (!isValidFileSize(file)) {
                    showFormError(form, `File exceeds 5MB limit`);
                    e.target.value = '';
                    return;
                }

                if (!isAllowedFileType(file.name)) {
                    showFormError(form, `File must be PDF, JPG, or PNG`);
                    e.target.value = '';
                    return;
                }

                // Show file info
                const wrapper = e.target.parentElement;
                let fileInfo = wrapper.querySelector('.file-info');
                if (!fileInfo) {
                    fileInfo = document.createElement('small');
                    fileInfo.className = 'file-info';
                    fileInfo.style.display = 'block';
                    fileInfo.style.marginTop = '4px';
                    fileInfo.style.color = '#10B981';
                    wrapper.appendChild(fileInfo);
                }
                fileInfo.textContent = `✓ ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
            }
        });
    });
}

/**
 * Setup conditional field visibility
 */
function setupConditionalFields(form) {
    // Personal Details form - no conditionals
    // Address form - no conditionals
    // Education form - no conditionals
    // Previous Agency form - conditional on hasPreviousAgency
    // Bank Details form - no conditionals
    // Document Upload form - no conditionals
    // This is handled in the individual form HTML files
}

/**
 * Load saved form data
 */
function loadFormData(form) {
    const savedData = getFormData();

    // Load all fields
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (!input.name) {
            return;
        }

        if (input.type === 'file') {
            const filename = savedData[`${input.name}FileName`];
            if (filename) {
                const wrapper = input.parentElement;
                let fileInfo = wrapper.querySelector('.file-info');
                if (!fileInfo) {
                    fileInfo = document.createElement('small');
                    fileInfo.className = 'file-info';
                    fileInfo.style.display = 'block';
                    fileInfo.style.marginTop = '4px';
                    fileInfo.style.color = '#10B981';
                    wrapper.appendChild(fileInfo);
                }
                fileInfo.textContent = `Previously selected: ${filename}`;
            }
            return;
        }

        if (input.type === 'checkbox') {
            input.checked = !!savedData[input.name];
            return;
        }

        if (savedData[input.name] !== undefined && savedData[input.name] !== null) {
            input.value = savedData[input.name];
        }
    });
}

/**
 * Clear form errors
 */
function clearFormErrors(form) {
    form.querySelectorAll('.form-control.error').forEach(el => {
        el.classList.remove('error');
    });

    const errorDiv = form.querySelector('#errorMessage');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

/**
 * Format form data before submission
 */
function formatFormData(formElement) {
    const formData = new FormData(formElement);
    const data = {};

    for (const [key, value] of formData) {
        if (value instanceof File) {
            // Skip files for now
            continue;
        }
        data[key] = value;
    }

    return data;
}

/**
 * Validate password strength
 */
function validatePasswordStrength(password) {
    if (password.length < 8) return 'weak';
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        return 'medium';
    }
    if (!/[!@#$%^&*]/.test(password)) return 'medium';
    return 'strong';
}

/**
 * Enable/disable form fields
 */
function enableFormFields(form, enable = true) {
    const fields = form.querySelectorAll('input, select, textarea, button');
    fields.forEach(field => {
        field.disabled = !enable;
    });
}

/**
 * Get form progress percentage
 */
function getFormProgress(form) {
    const totalFields = form.querySelectorAll('[required]').length;
    const filledFields = Array.from(form.querySelectorAll('[required]')).filter(field => {
        if (field.type === 'file') {
            return field.files && field.files.length > 0;
        }
        return field.value.trim() !== '';
    }).length;

    return Math.round((filledFields / totalFields) * 100);
}

/**
 * Show form progress
 */
function showFormProgress(form) {
    const progress = getFormProgress(form);
    console.log(`Form progress: ${progress}%`);
    return progress;
}
