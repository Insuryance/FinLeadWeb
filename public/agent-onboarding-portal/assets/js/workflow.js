// Workflow & Navigation Module

document.addEventListener('DOMContentLoaded', () => {
    protectPage();
    setupLogout();
    initializeDashboard();
});

/**
 * Initialize dashboard
 */
function initializeDashboard() {
    const startBtn = document.getElementById('startRegistrationBtn');
    const viewInstructionsBtn = document.getElementById('viewInstructionsBtn');
    const contactSupportBtn = document.getElementById('contactSupportBtn');

    console.log('Dashboard initialized:', {
        startBtn: !!startBtn,
        viewInstructionsBtn: !!viewInstructionsBtn,
        contactSupportBtn: !!contactSupportBtn
    });

    if (startBtn) {
        startBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Starting registration...');
            redirect(fromPortalRoot('registration/personal-details.html'));
        });
    } else {
        console.warn('Start registration button not found!');
    }

    if (viewInstructionsBtn) {
        viewInstructionsBtn.addEventListener('click', () => {
            console.log('Showing instructions...');
            showInstructions();
        });
    }

    if (contactSupportBtn) {
        contactSupportBtn.addEventListener('click', () => {
            console.log('Showing contact support...');
            showContactSupport();
        });
    }

    updateRegistrationStatus();
}

/**
 * Update registration status
 */
function updateRegistrationStatus() {
    const formData = getFormData();
    const statusBadge = document.getElementById('currentStatus');
    const statusMessage = document.getElementById('statusMessage');

    if (isEmpty(formData)) {
        statusBadge.textContent = 'Not Started';
        statusBadge.className = 'status-badge status-pending';
        statusMessage.textContent = 'Click below to begin your registration';
    } else {
        const progress = calculateRegistrationProgress(formData);
        statusBadge.textContent = `${progress}% Complete`;
        statusBadge.className = 'status-badge status-pending';
        statusMessage.textContent = `You have completed ${progress}% of your registration. Continue where you left off.`;
    }
}

/**
 * Calculate registration progress
 */
function calculateRegistrationProgress(formData) {
    const totalSteps = 6;
    let completedSteps = 0;

    // Step 1: Personal Details
    if (formData.fullName && formData.mobileNumber && formData.emailAddress) {
        completedSteps++;
    }

    // Step 2: Address
    if (formData.town && formData.state && formData.pinCode) {
        completedSteps++;
    }

    // Step 3: Education
    if (formData.qualification) {
        completedSteps++;
    }

    // Step 4: Previous Agency
    if (formData.hasPreviousAgency === 'no' || formData.previousInsurerName) {
        completedSteps++;
    }

    // Step 5: Bank Details
    if (formData.accountHolderName && formData.accountNumber && formData.ifsc) {
        completedSteps++;
    }

    // Step 6: Documents
    if (formData.photo || formData.aadhaarCard || formData.panCard) {
        completedSteps++;
    }

    return Math.round((completedSteps / totalSteps) * 100);
}

/**
 * Show instructions modal
 */
function showInstructions() {
    const instructions = `
    <div style="padding: 20px;">
        <h3>Registration Instructions</h3>

        <h4>Step 1: Personal Details</h4>
        <ul>
            <li>Provide your full name as per official documents</li>
            <li>Enter valid mobile number and email address</li>
            <li>Aadhaar and PAN are mandatory for KYC verification</li>
        </ul>

        <h4>Step 2: Address</h4>
        <ul>
            <li>Enter your current residential address</li>
            <li>PIN code must be 6 digits</li>
            <li>This address will be used for all correspondence</li>
        </ul>

        <h4>Step 3: Education</h4>
        <ul>
            <li>Upload your highest educational qualification certificate</li>
            <li>Minimum 10th pass required</li>
            <li>Supported formats: PDF, JPG, PNG (Max 5MB)</li>
        </ul>

        <h4>Step 4: Previous Agency (If Applicable)</h4>
        <ul>
            <li>If you have worked as an insurance agent before, provide details</li>
            <li>Upload cessation letter if applicable</li>
        </ul>

        <h4>Step 5: Bank Details</h4>
        <ul>
            <li>Provide active bank account details</li>
            <li>This account will be used for commission payments</li>
            <li>Upload cancelled cheque or passbook</li>
        </ul>

        <h4>Step 6: Documents</h4>
        <ul>
            <li>Upload all required documents</li>
            <li>Ensure documents are clear and legible</li>
            <li>Maximum file size: 5MB per document</li>
        </ul>

        <h4>Step 7: Review & Submit</h4>
        <ul>
            <li>Review all information carefully</li>
            <li>Accept all declarations</li>
            <li>Submit your application</li>
        </ul>

        <h4>Step 8: Branch Office Review</h4>
        <ul>
            <li>After submission, your application is sent to the branch office for review</li>
            <li>Portal registration starts only after branch office approval</li>
            <li>You will be notified once the review decision is received</li>
        </ul>
    </div>
    `;

    showModal('Registration Instructions', instructions, 'large');
}

/**
 * Show contact support
 */
function showContactSupport() {
    const contact = `
    <div style="padding: 20px; text-align: center;">
        <h3>Support Information</h3>

        <div style="margin: 20px 0;">
            <h4>📧 Email Support</h4>
            <p>
                <strong>support@iii.org.in</strong><br>
                Available: Monday to Friday, 9:00 AM to 6:00 PM IST
            </p>
        </div>

        <div style="margin: 20px 0;">
            <h4>📞 Phone Support</h4>
            <p>
                <strong>+91-XXXX-XXXX-XXXX</strong><br>
                Available: Monday to Friday, 10:00 AM to 5:00 PM IST
            </p>
        </div>

        <div style="margin: 20px 0;">
            <h4>💬 Live Chat</h4>
            <p>
                Available: Monday to Friday, 9:00 AM to 6:00 PM IST<br>
                <button onclick="alert('Live chat will open in a new window')" style="padding: 8px 16px; background: #1E40AF; color: white; border: none; border-radius: 4px; cursor: pointer;">Start Chat</button>
            </p>
        </div>

        <div style="margin: 20px 0;">
            <h4>🌐 FAQ</h4>
            <p>
                <a href="#" style="color: #1E40AF;">View Frequently Asked Questions</a>
            </p>
        </div>
    </div>
    `;

    showModal('Contact Support', contact, 'medium');
}

/**
 * Show modal dialog
 */
function showModal(title, content, size = 'medium') {
    // Remove existing modal if any
    const existing = document.getElementById('modalOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'modalOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        max-width: ${size === 'large' ? '600px' : '400px'};
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        animation: slideIn 0.3s ease;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
        position: absolute;
        top: 16px;
        right: 16px;
        background: none;
        border: none;
        font-size: 28px;
        cursor: pointer;
        color: #999;
    `;
    closeBtn.addEventListener('click', () => overlay.remove());

    const titleEl = document.createElement('h2');
    titleEl.textContent = title;
    titleEl.style.cssText = `
        padding: 20px;
        border-bottom: 1px solid #eee;
        margin: 0;
        color: #333;
    `;

    const contentEl = document.createElement('div');
    contentEl.innerHTML = content;

    modal.appendChild(closeBtn);
    modal.appendChild(titleEl);
    modal.appendChild(contentEl);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Add slide in animation
    if (!document.querySelector('style[data-modal-styles]')) {
        const style = document.createElement('style');
        style.setAttribute('data-modal-styles', 'true');
        style.textContent = `
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

/**
 * Continue registration
 */
function continueRegistration() {
    const formData = getFormData();

    if (isEmpty(formData)) {
        // Start fresh
        redirect(fromPortalRoot('registration/personal-details.html'));
    } else {
        // Continue from where left off
        // Determine the last completed step
        if (formData.accountHolderName) {
            redirect(fromPortalRoot('registration/document-upload.html'));
        } else if (formData.hasPreviousAgency !== undefined) {
            redirect(fromPortalRoot('registration/bank-details.html'));
        } else if (formData.qualification) {
            redirect(fromPortalRoot('registration/previous-agency.html'));
        } else if (formData.town) {
            redirect(fromPortalRoot('registration/education.html'));
        } else if (formData.fullName) {
            redirect(fromPortalRoot('registration/address.html'));
        } else {
            redirect(fromPortalRoot('registration/personal-details.html'));
        }
    }
}

/**
 * Get registration completion percentage
 */
function getRegistrationCompletion() {
    const formData = getFormData();
    const requiredFields = [
        'fullName', 'dob', 'mobileNumber', 'emailAddress', 'panNumber', 'aadhaarNumber',
        'town', 'state', 'pinCode',
        'qualification',
        'accountHolderName', 'accountNumber', 'ifsc', 'bankName'
    ];

    let completed = 0;
    for (const field of requiredFields) {
        if (formData[field]) {
            completed++;
        }
    }

    return Math.round((completed / requiredFields.length) * 100);
}

/**
 * Resume registration
 */
function resumeRegistration() {
    const lastPage = sessionStorage.getItem('lastPage');
    if (lastPage) {
        window.location.href = lastPage;
    } else {
        continueRegistration();
    }
}

/**
 * Save current page as last page
 */
function saveCurrentPage() {
    sessionStorage.setItem('lastPage', window.location.pathname);
}

// Save current page on every registration page
if (window.location.pathname.includes('/registration/')) {
    window.addEventListener('beforeunload', saveCurrentPage);
}
