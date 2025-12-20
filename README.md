# Nanny Fifi - Parent Coaching Website

## Project Overview

**Website for:** Sofia Kavouri (Nanny Fifi)
**Domain:** nannyfifi.com
**Business:** Online parent coaching for parents of toddlers and young children
**Location:** London, UK (services available worldwide online)

---

## About Sofia (Nanny Fifi)

- **Experience:** 15+ years in childcare
- **Education:** BA (Honours) Early Childhood from The Open University
- **Languages:** Bilingual (English & Greek), basic Swedish
- **Certifications:** Paediatric First Aid, Speech & Language Development, SEND, Neurodiversity, Phonics Teaching, Enhanced DBS
- **Instagram:** [@nanny_fifi](https://instagram.com/nanny_fifi)
- **Email:** sophia.kavouri@gmail.com
- **Calendly:** https://calendly.com/sophia-kavouri/30min

---

## Services Offered

1. **Sleep Coaching** - Bedtime routines, night waking, nap transitions
2. **Behaviour & Boundaries** - Tantrum management, positive discipline
3. **Mealtime Success** - Fussy eating, weaning guidance
4. **Potty Training** - Readiness assessment, step-by-step guidance
5. **Speech & Language** - Language milestones, bilingual support
6. **New Baby Prep** - Nursery setup, first weeks planning

---

## Pricing (Competitive UK Rates)

| Package | GBP | USD | EUR |
|---------|-----|-----|-----|
| Discovery Call (30 min) | Free | Free | Free |
| Single Session (60 min) | £65 | $82 | €77 |
| 3-Session Package | £175 | $220 | €208 |

*Pricing based on UK parent coaching market research (average £50-80/session)*

---

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (vanilla)
- **Fonts:** Playfair Display (headings), Inter (body)
- **Booking:** Calendly embed
- **Hosting:** GitHub Pages (planned)
- **Domain:** nannyfifi.com

---

## File Structure

```
nanny-fifi-website/
├── index.html      # Main website (all sections)
├── styles.css      # All styling + CSS variables
├── script.js       # Interactivity (menu, FAQ, currency toggle, animations)
├── README.md       # This file
└── SETUP-GUIDE.md  # Deployment instructions
```

---

## Current Colour Scheme (Warm & Nurturing)

```css
--color-primary: #E8A598;        /* Soft coral/peach */
--color-primary-dark: #D4887A;   /* Darker coral */
--color-primary-light: #F5D5CE;  /* Light peach */
--color-secondary: #F9E4DE;      /* Cream pink */
--color-bg: #FFFAF8;             /* Warm white */
--color-text: #4A3F3A;           /* Warm dark brown */
```

### Alternative Colour Schemes Explored

1. **Charcoal & Rose Gold** - `#B76E79` primary, `#1A1717` text
2. **Dark Mode** - `#141212` bg, `#D4A5A5` primary, `#F5F0F0` text
3. **Navy & Gold** - Professional, trustworthy
4. **Sage & Cream** - Calm, natural
5. **Teal & Blush** - Modern, friendly

---

## Features

- Responsive design (mobile, tablet, desktop)
- Smooth scroll navigation
- FAQ accordion
- Currency toggle (GBP/USD/EUR) with localStorage
- Calendly booking embed
- Contact form (mailto)
- Scroll animations (Intersection Observer)
- Mobile hamburger menu

---

## Website Sections

1. **Hero** - Main headline, CTAs, trust badges
2. **About** - Sofia's background, credentials, stats
3. **Services** - 6 service cards with features
4. **How It Works** - 4-step process with connected line
5. **Testimonials** - 3 testimonial cards (placeholder)
6. **Pricing** - 3 tiers with currency toggle
7. **FAQ** - 6 questions with accordion
8. **Booking** - Calendly embed + benefits
9. **Contact** - Email, Instagram, contact form
10. **Footer** - Links, social, copyright

---

## To-Do / Future Enhancements

- [ ] Add Sofia's actual photos (hero, about section)
- [ ] Replace placeholder testimonials with real ones
- [ ] Finalise colour scheme (user exploring options)
- [ ] Deploy to GitHub Pages
- [ ] Connect nannyfifi.com domain
- [ ] Add Google Analytics
- [ ] Consider adding blog section
- [ ] Add favicon/logo

---

## Design Notes

- User prefers sleek, professional look
- Avoid AI-sounding text (no em dashes)
- British English throughout (colour, personalised, behaviour, mum, whilst)
- All text written in first person from Sofia's perspective

---

## Deployment

See `SETUP-GUIDE.md` for:
- GitHub Pages deployment steps
- Calendly setup instructions
- Domain connection (DNS settings)

---

## Quick Commands

```bash
# Preview locally
cd "C:\Users\hamad\OneDrive\Desktop\nanny-fifi-website"
python -m http.server 8080
# Then open http://localhost:8080

# Deploy to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/nannyfifi.com.git
git push -u origin main
```

---

## Contact

- **Owner:** Hamad (Sofia's husband)
- **Sofia's Email:** sophia.kavouri@gmail.com
- **Sofia's Instagram:** @nanny_fifi

---

*Last updated: December 2024*
