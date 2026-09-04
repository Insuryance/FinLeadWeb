// Authentication Module

document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the login page
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        setupLoginForm();
    }
});

/**
 * Setup login form event handlers
 */
function setupLoginForm() {
    const form = document.getElementById('loginForm');
    const errorDiv = document.getElementById('errorMessage');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleLogin();
    });

    // Clear error when user starts typing
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            errorDiv.style.display = 'none';
        });
    });
}

/**
 * Handle login form submission (Mock - no API calls)
 */
function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = document.querySelector('#loginForm button[type="submit"]');
    const errorDiv = document.getElementById('errorMessage');

    // Validation
    if (!username || !password) {
        showLoginError('Please enter both username and password');
        return;
    }

    if (username.length < 3) {
        showLoginError('Username must be at least 3 characters');
        return;
    }

    if (password.length < 6) {
        showLoginError('Password must be at least 6 characters');
        return;
    }

    const authResult = authenticatePortalUser(username, password);
    if (!authResult.success) {
        showLoginError(authResult.message);
        return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').style.display = 'none';
    submitBtn.querySelector('.btn-loader').style.display = 'inline';
    errorDiv.style.display = 'none';

    // Simulate API delay
    setTimeout(() => {
        setAuthenticatedSession(authResult);
        window.location.href = authResult.redirectUrl;
    }, 500);
}

/**
 * Show login error message
 */
function showLoginError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

/**
 * Reset login button to normal state
 */
function resetLoginButton(btn) {
    btn.disabled = false;
    btn.querySelector('.btn-text').style.display = 'inline';
    btn.querySelector('.btn-loader').style.display = 'none';
}

/**
 * Setup logout functionality on other pages
 */
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    const userGreeting = document.getElementById('userGreeting');

    if (logoutBtn) {
        if (logoutBtn.dataset.bound === 'true') {
            return;
        }

        const user = getCurrentUser();
        if (userGreeting && user.username) {
            userGreeting.textContent = `Welcome, ${user.username}`;
        }

        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        });
        logoutBtn.dataset.bound = 'true';
    }
}

/**
 * Check if token is still valid (Mock - no API calls)
 */
function validateSession() {
    if (!isLoggedIn()) {
        goToLoginPage();
        return false;
    }

    // Mock: always return true if token exists in localStorage
    return true;
}

/**
 * Protect page - redirect to login if not authenticated
 */
function protectPage() {
    if (!isLoggedIn()) {
        // Only redirect if not on login page
        if (!window.location.pathname.includes('index.html')) {
            console.warn('Not logged in, redirecting to login page');
            goToLoginPage();
        }
    }
}

// Initialize logout on non-login pages
if (!window.location.pathname.includes('index.html')) {
    setupLogout();
    protectPage();
}
