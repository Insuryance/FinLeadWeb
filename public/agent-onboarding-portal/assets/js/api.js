// Mock API Module - No backend calls, everything is local/mock

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('userRole');
    localStorage.removeItem('activeCandidateSession');
    localStorage.removeItem('registrationForm');
    localStorage.removeItem('submittedRegistration');
    localStorage.removeItem('portalRegistrationResult');
    localStorage.removeItem('portalExamBooking');
    localStorage.removeItem('portalExamPayment');
    localStorage.removeItem('portalExamResult');
    goToLoginPage();
}

function submitRegistration(formData) {
    const result = buildPortalRegistrationResult(formData);
    localStorage.setItem('submittedRegistration', JSON.stringify(formData));
    localStorage.setItem('portalRegistrationResult', JSON.stringify(result));
    localStorage.removeItem('portalExamBooking');
    localStorage.removeItem('portalExamPayment');
    localStorage.removeItem('portalExamResult');

    return Promise.resolve({
        success: true,
        caseId: result.caseId,
        portalUserId: result.portalUserId,
        portalPassword: result.portalPassword,
        urn: result.urn,
        message: 'Registration submitted successfully'
    });
}

function checkSession() {
    return Promise.resolve(true);
}

function buildPortalRegistrationResult(formData = {}) {
    const existing = localStorage.getItem('portalRegistrationResult');
    if (existing) {
        return JSON.parse(existing);
    }

    const randomToken = Math.random().toString(36).substring(2, 10).toUpperCase();
    const portalUserId = 'AGENT-' + randomToken.slice(0, 6);
    const timestamp = new Date().toISOString();
    return {
        caseId: 'CASE-' + randomToken,
        portalUserId,
        portalPassword: deriveCandidatePassword(portalUserId),
        urn: 'URN-' + randomToken,
        candidateName: formData.fullName || 'Candidate User',
        candidateEmail: formData.emailAddress || 'candidate@example.com',
        submittedAt: timestamp
    };
}

function deriveCandidatePassword(portalUserId) {
    const safeUserId = (portalUserId || '').replace(/[^A-Za-z0-9]/g, '');
    const suffix = safeUserId.slice(-4) || '1234';
    return `Agent@${suffix}!`;
}

function authenticatePortalUser(username, password) {
    if (username === 'admin' && password === 'admin123') {
        return {
            success: true,
            role: 'admin',
            username,
            email: 'admin@example.com',
            redirectUrl: 'dashboard.html'
        };
    }

    if (username.startsWith('AGENT-') && password === deriveCandidatePassword(username)) {
        const registration = getPortalRegistrationResult();
        const candidateSession = {
            portalUserId: username,
            portalPassword: password,
            urn: registration.urn || '',
            candidateName: registration.candidateName || 'Candidate User',
            candidateEmail: registration.candidateEmail || 'candidate@example.com'
        };
        return {
            success: true,
            role: 'candidate',
            username,
            email: candidateSession.candidateEmail,
            redirectUrl: 'exam/slot-booking.html',
            candidateSession
        };
    }

    return {
        success: false,
        message: 'Invalid username or password. Use admin / admin123 or candidate portal credentials from the registration success page.'
    };
}

function setAuthenticatedSession(session) {
    localStorage.setItem('token', 'mock-token-' + Math.random().toString(36).substring(2, 11));
    localStorage.setItem('username', session.username);
    localStorage.setItem('email', session.email || `${session.username}@example.com`);
    localStorage.setItem('userRole', session.role || 'admin');

    if (session.role === 'candidate' && session.candidateSession) {
        localStorage.setItem('activeCandidateSession', JSON.stringify(session.candidateSession));
    } else {
        localStorage.removeItem('activeCandidateSession');
    }
}

function getPortalRegistrationResult() {
    return JSON.parse(localStorage.getItem('portalRegistrationResult') || '{}');
}

function getActiveCandidateSession() {
    return JSON.parse(localStorage.getItem('activeCandidateSession') || '{}');
}

function getPortalExamBooking() {
    return JSON.parse(localStorage.getItem('portalExamBooking') || '{}');
}

function getPortalExamPayment() {
    return JSON.parse(localStorage.getItem('portalExamPayment') || '{}');
}

function getPortalExamResult() {
    const existing = localStorage.getItem('portalExamResult');
    if (existing) {
        return JSON.parse(existing);
    }

    const booking = getPortalExamBooking();
    const registration = getPortalRegistrationResult();
    const result = {
        urn: booking.urn || registration.urn || '',
        portalUserId: booking.portalUserId || registration.portalUserId || '',
        candidateName: booking.candidateName || registration.candidateName || 'Candidate User',
        candidateEmail: booking.candidateEmail || registration.candidateEmail || 'candidate@example.com',
        examDate: booking.examDate || '',
        examTime: booking.examTime || '',
        examCenter: booking.examCenter || '',
        status: 'PASS',
        score: '38/50',
        remarks: 'Qualified for next onboarding step',
        publishedAt: new Date().toISOString()
    };
    localStorage.setItem('portalExamResult', JSON.stringify(result));
    return result;
}

function bookPortalExamSlot(selection) {
    const candidateSession = getActiveCandidateSession();
    const registration = getPortalRegistrationResult();
    const bookingId = 'BKG-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const bookedAt = new Date().toISOString();
    const booking = {
        bookingId,
        urn: selection.urn || candidateSession.urn || registration.urn,
        portalUserId: candidateSession.portalUserId || registration.portalUserId,
        candidateName: candidateSession.candidateName || registration.candidateName,
        candidateEmail: candidateSession.candidateEmail || registration.candidateEmail,
        examDate: selection.examDate,
        examTime: selection.examTime,
        examCenter: selection.examCenter,
        bookedAt
    };

    localStorage.setItem('portalExamBooking', JSON.stringify(booking));
    localStorage.removeItem('portalExamPayment');
    localStorage.removeItem('portalExamResult');
    return Promise.resolve({
        success: true,
        booking,
        paymentUrl: buildExamPaymentUrl(booking)
    });
}

function buildExamPaymentUrl(booking = getPortalExamBooking()) {
    const params = new URLSearchParams({
        urn: booking.urn || '',
        portalUserId: booking.portalUserId || '',
        candidateName: booking.candidateName || '',
        candidateEmail: booking.candidateEmail || '',
        examDate: booking.examDate || '',
        examTime: booking.examTime || '',
        examCenter: booking.examCenter || '',
        bookingId: booking.bookingId || '',
        feeAmount: '550.00'
    });
    return `payment.html?${params.toString()}`;
}

function resolveExamPaymentData() {
    const params = new URLSearchParams(window.location.search);
    const booking = getPortalExamBooking();
    const payment = getPortalExamPayment();
    return {
        urn: params.get('urn') || booking.urn || payment.urn || '',
        portalUserId: params.get('portalUserId') || booking.portalUserId || payment.portalUserId || '',
        candidateName: params.get('candidateName') || booking.candidateName || payment.candidateName || '',
        candidateEmail: params.get('candidateEmail') || booking.candidateEmail || payment.candidateEmail || '',
        examDate: params.get('examDate') || booking.examDate || payment.examDate || '',
        examTime: params.get('examTime') || booking.examTime || payment.examTime || '',
        examCenter: params.get('examCenter') || booking.examCenter || payment.examCenter || '',
        bookingId: params.get('bookingId') || booking.bookingId || payment.bookingId || '',
        feeAmount: params.get('feeAmount') || payment.feeAmount || '550.00',
        paymentReference: payment.paymentReference || '',
        paymentMethod: payment.paymentMethod || '',
        paidAt: payment.paidAt || ''
    };
}

function payPortalExamFee(paymentInput) {
    const booking = getPortalExamBooking();
    const payment = {
        bookingId: booking.bookingId || paymentInput.bookingId || '',
        urn: booking.urn || paymentInput.urn || '',
        portalUserId: booking.portalUserId || paymentInput.portalUserId || '',
        candidateName: booking.candidateName || paymentInput.candidateName || '',
        candidateEmail: booking.candidateEmail || paymentInput.candidateEmail || '',
        examDate: booking.examDate || paymentInput.examDate || '',
        examTime: booking.examTime || paymentInput.examTime || '',
        examCenter: booking.examCenter || paymentInput.examCenter || '',
        feeAmount: paymentInput.feeAmount || '550.00',
        paymentMethod: paymentInput.paymentMethod || 'upi',
        paymentReference: 'PAY-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        paidAt: new Date().toISOString(),
        paymentStatus: 'PAID'
    };

    localStorage.setItem('portalExamPayment', JSON.stringify(payment));
    localStorage.removeItem('portalExamResult');
    return Promise.resolve({
        success: true,
        payment,
        hallTicketUrl: buildHallTicketUrl(booking, payment)
    });
}

function buildHallTicketUrl(booking = getPortalExamBooking(), payment = getPortalExamPayment()) {
    const params = new URLSearchParams({
        urn: booking.urn || '',
        portalUserId: booking.portalUserId || '',
        candidateName: booking.candidateName || '',
        candidateEmail: booking.candidateEmail || '',
        examDate: booking.examDate || '',
        examTime: booking.examTime || '',
        examCenter: booking.examCenter || '',
        bookingId: booking.bookingId || '',
        bookedAt: booking.bookedAt || '',
        feeAmount: payment.feeAmount || '550.00',
        paymentReference: payment.paymentReference || '',
        paymentMethod: payment.paymentMethod || '',
        paidAt: payment.paidAt || ''
    });
    return `hall-ticket.html?${params.toString()}`;
}

function resolveHallTicketData() {
    const params = new URLSearchParams(window.location.search);
    const booking = getPortalExamBooking();
    return {
        portalUserId: params.get('portalUserId') || booking.portalUserId || '',
        urn: params.get('urn') || booking.urn || '',
        candidateName: params.get('candidateName') || booking.candidateName || '',
        candidateEmail: params.get('candidateEmail') || booking.candidateEmail || '',
        examDate: params.get('examDate') || booking.examDate || '',
        examTime: params.get('examTime') || booking.examTime || '',
        examCenter: params.get('examCenter') || booking.examCenter || '',
        bookingId: params.get('bookingId') || booking.bookingId || '',
        bookedAt: params.get('bookedAt') || booking.bookedAt || '',
        feeAmount: params.get('feeAmount') || getPortalExamPayment().feeAmount || '550.00',
        paymentReference: params.get('paymentReference') || getPortalExamPayment().paymentReference || '',
        paymentMethod: params.get('paymentMethod') || getPortalExamPayment().paymentMethod || '',
        paidAt: params.get('paidAt') || getPortalExamPayment().paidAt || ''
    };
}

function resolvePortalExamResult() {
    const params = new URLSearchParams(window.location.search);
    const result = getPortalExamResult();
    const urn = params.get('urn') || result.urn || '';
    if (urn && result.urn && urn !== result.urn) {
        return {
            ...result,
            urn
        };
    }
    return result;
}
