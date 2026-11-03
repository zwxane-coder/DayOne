/* ==========================================
   DayOne Homepage Interactions — Stage 2
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Navigation Toggle & Menu Management
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mainNav = document.getElementById('mainNav');

    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            mainNav.classList.toggle('active');
            mobileMenuToggle.classList.toggle('open');
        });

        // Close mobile menu automatically when a link is clicked
        const navLinks = mainNav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('active');
                mobileMenuToggle.classList.remove('open');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (event) => {
            const isClickInsideNav = mainNav.contains(event.target) || mobileMenuToggle.contains(event.target);
            if (!isClickInsideNav && mainNav.classList.contains('active')) {
                mainNav.classList.remove('active');
                mobileMenuToggle.classList.remove('open');
            }
        });
    }

    // 2. Birthday Search Form Validation & Custom Error Display
    const birthdayForm = document.getElementById('birthdayForm');
    const dobInput = document.getElementById('dob');
    const formError = document.getElementById('formError');

    if (birthdayForm && dobInput) {
        // Set maximum date attribute to today
        const today = new Date().toISOString().split('T')[0];
        dobInput.setAttribute('max', today);

        birthdayForm.addEventListener('submit', (event) => {
            formError.textContent = '';
            const dateValue = dobInput.value;

            // Empty field check
            if (!dateValue) {
                event.preventDefault();
                formError.textContent = 'Please select your date of birth to continue.';
                dobInput.focus();
                return;
            }

            // Future date check
            const selectedDate = new Date(dateValue);
            const currentDate = new Date();

            if (selectedDate > currentDate) {
                event.preventDefault();
                formError.textContent = 'Birth date cannot be in the future. Please select a valid past date.';
                dobInput.focus();
                return;
            }
        });

        // Clear error message when user starts picking a new date
        dobInput.addEventListener('input', () => {
            if (formError.textContent) {
                formError.textContent = '';
            }
        });
    }
});