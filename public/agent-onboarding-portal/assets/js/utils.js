// Utility Functions

/**
 * Get stored form data from localStorage
 */
function getFormData() {
    const stored = localStorage.getItem('registrationForm');
    return stored ? JSON.parse(stored) : {};
}

/**
 * Build a portal-relative path that works from both root pages and registration pages
 */
function fromPortalRoot(relativePath) {
    const normalized = relativePath.replace(/^\/+/, '');
    return window.location.pathname.includes('/registration/')
        ? `../${normalized}`
        : normalized;
}

/**
 * Navigate to the login page
 */
function goToLoginPage() {
    redirect(fromPortalRoot('index.html'));
}

/**
 * Navigate to the dashboard page
 */
function goToDashboardPage() {
    redirect(fromPortalRoot('dashboard.html'));
}

/**
 * Save form data to localStorage
 */
function saveFormData(formElement) {
    const existing = getFormData();
    const updated = { ...existing };

    formElement.querySelectorAll('input, select, textarea').forEach(input => {
        if (!input.name) {
            return;
        }

        if (input.type === 'file') {
            const file = input.files && input.files[0];
            updated[`${input.name}Uploaded`] = !!file;
            updated[`${input.name}FileName`] = file ? file.name : (updated[`${input.name}FileName`] || '');
            return;
        }

        if (input.type === 'checkbox') {
            updated[input.name] = input.checked;
            return;
        }

        updated[input.name] = input.value;
    });

    localStorage.setItem('registrationForm', JSON.stringify(updated));
    return updated;
}

/**
 * Clear all form data
 */
function clearFormData() {
    localStorage.removeItem('registrationForm');
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Validate mobile number (10 digits)
 */
function isValidMobile(mobile) {
    const regex = /^[0-9]{10}$/;
    return regex.test(mobile);
}

/**
 * Validate PAN format
 */
function isValidPAN(pan) {
    const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return regex.test(pan);
}

/**
 * Validate Aadhaar format
 */
function isValidAadhaar(aadhaar) {
    const regex = /^[0-9]{12}$/;
    return regex.test(aadhaar);
}

/**
 * Validate PIN code
 */
function isValidPinCode(pin) {
    const regex = /^[0-9]{6}$/;
    return regex.test(pin);
}

/**
 * Validate IFSC code
 */
function isValidIFSC(ifsc) {
    const regex = /^[A-Z0-9]{11}$/;
    return regex.test(ifsc);
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    return !!localStorage.getItem('token');
}

/**
 * Get current user information
 */
function getCurrentUser() {
    return {
        username: localStorage.getItem('username'),
        email: localStorage.getItem('email'),
        token: localStorage.getItem('token')
    };
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date) {
    if (typeof date === 'string') {
        return date;
    }
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
}

/**
 * Format date for display
 */
function formatDateDisplay(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show loading state on element
 */
function showLoading(element) {
    if (element.classList) {
        element.classList.add('loading');
    }
}

/**
 * Hide loading state on element
 */
function hideLoading(element) {
    if (element.classList) {
        element.classList.remove('loading');
    }
}

/**
 * Show notification/alert
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.style.maxWidth = '400px';
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

/**
 * Get query parameter value
 */
function getQueryParameter(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

/**
 * Redirect to URL
 */
function redirect(url) {
    window.location.href = url;
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

/**
 * Convert file to base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

/**
 * Validate file size
 */
function isValidFileSize(file, maxSizeMB = 5) {
    const maxBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxBytes;
}

/**
 * Get file extension
 */
function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
}

/**
 * Validate allowed file types
 */
function isAllowedFileType(filename, allowedTypes = ['pdf', 'jpg', 'jpeg', 'png']) {
    const ext = getFileExtension(filename);
    return allowedTypes.includes(ext);
}

/**
 * Check age from date of birth
 */
function getAge(dateStr) {
    const today = new Date();
    const birthDate = new Date(dateStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

/**
 * Mask sensitive information
 */
function maskString(str, visibleChars = 4) {
    if (!str || str.length <= visibleChars) return str;
    const masked = str.slice(0, visibleChars) + '*'.repeat(str.length - visibleChars);
    return masked;
}

/**
 * Clone object deep
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if object is empty
 */
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

/**
 * Set up global event handlers
 */
function setupGlobalHandlers() {
    // Check login on page load
    if (!isLoggedIn() &&
        window.location.pathname !== '/' &&
        !window.location.pathname.includes('index.html')) {
        goToLoginPage();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', setupGlobalHandlers);
