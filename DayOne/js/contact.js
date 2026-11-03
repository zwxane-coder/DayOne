/**
 * DayOne - Contact Page Handler (js/contact.js)
 * Submits contact messages to the published DayOne support address.
 */
(function () {
    'use strict';
    const ENDPOINT = 'https://formsubmit.co/ajax/zwanexdev@gmail.com';

    document.addEventListener('DOMContentLoaded', function () {
        const form = document.getElementById('cf');
        const errorDiv = document.getElementById('cerr');
        const submitBtn = document.getElementById('submit-btn');

        if (!form) return;

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            errorDiv.className = 'form-error';
            errorDiv.textContent = '';

            const emailInput = document.getElementById('ce');
            const messageInput = document.getElementById('cm');

            const email = emailInput ? emailInput.value.trim() : '';
            const message = messageInput ? messageInput.value.trim() : '';

            const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
            if (!emailRegex.test(email)) {
                errorDiv.textContent = 'Please enter a valid email address so we can reply directly to you.';
                if (emailInput) emailInput.focus();
                return;
            }

            if (message.length < 10) {
                errorDiv.textContent = 'Please write a bit more detail in your message (at least 10 characters).';
                if (messageInput) messageInput.focus();
                return;
            }

            submitBtn.disabled = true;
            const btnSpan = submitBtn.querySelector('span');
            const originalText = btnSpan ? btnSpan.textContent : 'Send Message';
            if (btnSpan) btnSpan.textContent = 'Sending...';

            try {
                const payload = Object.fromEntries(new FormData(form).entries());
                payload._replyto = email;
                const response = await fetch(ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();
                if (response.ok && (data.success === true || data.success === 'true')) {
                    errorDiv.className = 'form-ok';
                    errorDiv.textContent = 'Your message has been sent. We can reply directly to your email address.';
                    form.reset();
                } else {
                    errorDiv.textContent = data.message || 'We could not send your message. Please try again or email zwanexdev@gmail.com directly.';
                }
            } catch (err) {
                errorDiv.textContent = 'Network error. Please try again or email zwanexdev@gmail.com directly.';
            } finally {
                submitBtn.disabled = false;
                if (btnSpan) btnSpan.textContent = originalText;
            }
        });
    });
})();