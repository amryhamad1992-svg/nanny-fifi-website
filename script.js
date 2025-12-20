// ===== Mobile Menu Toggle =====
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

mobileMenuBtn.addEventListener('click', () => {
    mobileMenuBtn.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Close mobile menu when clicking a link
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenuBtn.classList.remove('active');
        navLinks.classList.remove('active');
    });
});

// ===== Navbar Scroll Effect =====
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ===== FAQ Accordion =====
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');

    question.addEventListener('click', () => {
        // Close other open items
        faqItems.forEach(otherItem => {
            if (otherItem !== item && otherItem.classList.contains('active')) {
                otherItem.classList.remove('active');
            }
        });

        // Toggle current item
        item.classList.toggle('active');
    });
});

// ===== Smooth Scroll for Anchor Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ===== Currency Toggle =====
const currencyBtns = document.querySelectorAll('.currency-btn');
const priceAmounts = document.querySelectorAll('.price-amount[data-gbp]');
const priceCurrencies = document.querySelectorAll('.price-currency');
const savingsSpans = document.querySelectorAll('.highlight-save span[data-gbp]');

// Currency symbol mapping (for SEK which uses suffix)
const currencySymbols = {
    gbp: { symbol: '£', position: 'prefix' },
    usd: { symbol: '$', position: 'prefix' },
    eur: { symbol: '€', position: 'prefix' },
    sek: { symbol: 'kr', position: 'prefix' }
};

function updatePrices(currency) {
    // Update price amounts
    priceAmounts.forEach(el => {
        const value = el.dataset[currency];
        if (value) {
            el.textContent = value;
        }
    });

    // Update currency symbols
    priceCurrencies.forEach(el => {
        const symbol = el.dataset[currency];
        if (symbol) {
            el.textContent = symbol;
        }
    });

    // Update savings text
    savingsSpans.forEach(el => {
        const value = el.dataset[currency];
        if (value) {
            el.textContent = value;
        }
    });

    // Update active button
    currencyBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.currency === currency) {
            btn.classList.add('active');
        }
    });

    // Store preference
    localStorage.setItem('preferredCurrency', currency);
}

// Add click handlers to currency buttons
currencyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        updatePrices(btn.dataset.currency);
    });
});

// Load saved preference on page load
const savedCurrency = localStorage.getItem('preferredCurrency');
if (savedCurrency) {
    updatePrices(savedCurrency);
}

// ===== Contact Form Handling =====
const contactForm = document.getElementById('contact-form');

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(contactForm);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');

    // Create mailto link (simple solution for static site)
    const subject = encodeURIComponent(`Website Enquiry from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
    const mailtoLink = `mailto:contact.nannyfifi@gmail.com?subject=${subject}&body=${body}`;

    // Open email client
    window.location.href = mailtoLink;

    // Show success message
    alert('Thank you for your message! Your email client should open shortly.');
    contactForm.reset();
});

// ===== Intersection Observer for Animations =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.service-card, .testimonial-card, .pricing-card, .step, .stat, .credential-tag').forEach(el => {
    observer.observe(el);
});

// ===== Add animation styles dynamically =====
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    .service-card, .testimonial-card, .pricing-card, .step, .stat, .credential-tag {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease, transform 0.6s ease;
    }

    .service-card.animate-in, .testimonial-card.animate-in,
    .pricing-card.animate-in, .step.animate-in, .stat.animate-in,
    .credential-tag.animate-in {
        opacity: 1;
        transform: translateY(0);
    }

    /* Stagger animations */
    .service-card:nth-child(2), .testimonial-card:nth-child(2), .pricing-card:nth-child(2) {
        transition-delay: 0.1s;
    }
    .service-card:nth-child(3), .testimonial-card:nth-child(3), .pricing-card:nth-child(3) {
        transition-delay: 0.2s;
    }
    .service-card:nth-child(4) { transition-delay: 0.3s; }
    .service-card:nth-child(5) { transition-delay: 0.4s; }
    .service-card:nth-child(6) { transition-delay: 0.5s; }

    .step:nth-child(2) { transition-delay: 0.15s; }
    .step:nth-child(3) { transition-delay: 0.3s; }
    .step:nth-child(4) { transition-delay: 0.45s; }

    .credential-tag:nth-child(1) { transition-delay: 0s; }
    .credential-tag:nth-child(2) { transition-delay: 0.05s; }
    .credential-tag:nth-child(3) { transition-delay: 0.1s; }
    .credential-tag:nth-child(4) { transition-delay: 0.15s; }
    .credential-tag:nth-child(5) { transition-delay: 0.2s; }
    .credential-tag:nth-child(6) { transition-delay: 0.25s; }
    .credential-tag:nth-child(7) { transition-delay: 0.3s; }
    .credential-tag:nth-child(8) { transition-delay: 0.35s; }
`;
document.head.appendChild(animationStyles);

// ===== Year in Footer =====
document.querySelector('.footer-bottom p').innerHTML =
    `&copy; ${new Date().getFullYear()} Nanny Fifi. All rights reserved.`;

// ===== Console Easter Egg =====
console.log('%c🧸 Nanny Fifi Website', 'font-size: 24px; font-weight: bold; color: #E8A598;');
console.log('%cBuilt with love for families', 'font-size: 14px; color: #7D6E66;');
