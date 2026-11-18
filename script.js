/**
 * Spotlight SA – Client-Side Interactions, Theme Engine & Analytics
 * Vanilla JavaScript – Compatible with GitHub Pages (No Build Tools Required)
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeEngine();
  initAnalytics();
  initMobileNavigation();
  initGrowthCheck();
  initContactForm();
  initFaqAccordion();
});

/* ==========================================================================
   1. THEME ENGINE (LIGHT & DARK MODE)
   ========================================================================== */

function initThemeEngine() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const root = document.documentElement;

  // Determine active theme (defaults to warm cream light theme unless dark was chosen)
  function getPreferredTheme() {
    const saved = localStorage.getItem('spotlight_theme');
    return saved === 'dark' ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      toggleBtn.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  // Initial apply
  applyTheme(getPreferredTheme());

  // Toggle handler
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isDark = root.classList.contains('dark');
      const nextTheme = isDark ? 'light' : 'dark';
      localStorage.setItem('spotlight_theme', nextTheme);
      applyTheme(nextTheme);
      trackEvent('theme_toggle', { theme: nextTheme });
    });
  }

  // Listen to OS system changes if no manual preference stored
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('spotlight_theme')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}

/* ==========================================================================
   2. GOOGLE ANALYTICS 4 (GA4) INTEGRATION & DEDUPLICATION
   ========================================================================== */

// Deduplication cache to prevent firing duplicate events within a short window
const trackedEventsCache = new Set();
let analyticsInitialized = false;

function initAnalytics() {
  if (analyticsInitialized) return;
  analyticsInitialized = true;

  // Preserve the Google Tag / GA4 configuration loaded in <head> (GTM-PFRB7285)
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }

  const hasHeadTag = Boolean(
    document.querySelector('script[src*="googletagmanager.com/gtm.js"], script[src*="googletagmanager.com/gtag/js"]')
  );

  if (hasHeadTag) {
    console.info('[Analytics] Google Analytics 4 ready via existing Google Tag in <head>.');
  } else {
    console.info('[Analytics] Tracking events queued to dataLayer and logged to this browser console.');
  }

  // Delegated click listener for primary CTAs and Service links (prevents duplicate bindings)
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const ctaEl = target.closest('[data-track-cta]');
    if (ctaEl) {
      const ctaName = ctaEl.getAttribute('data-track-cta') || ctaEl.textContent.trim();
      const ctaLocation = ctaEl.getAttribute('data-track-location') || window.location.pathname;
      trackEvent('cta_click', {
        cta_label: ctaName,
        cta_location: ctaLocation,
        source_page: window.location.pathname
      });
      return;
    }

    const serviceEl = target.closest('[data-track-service]');
    if (serviceEl) {
      const serviceName = serviceEl.getAttribute('data-track-service');
      trackEvent('service_enquiry_click', {
        service_name: serviceName,
        source_page: window.location.pathname
      });
    }
  });
}

/**
 * Universal Event Tracker with deduplication safeguard (no PII)
 */
function trackEvent(eventName, params = {}) {
  // Deduplicate rapid repeat events within 1.5s
  const cacheKey = `${eventName}_${JSON.stringify(params)}_${Math.floor(Date.now() / 1500)}`;
  if (trackedEventsCache.has(cacheKey)) return;
  trackedEventsCache.add(cacheKey);
  if (trackedEventsCache.size > 100) {
    trackedEventsCache.clear();
  }

  console.log(`[Spotlight SA Event Tracker] '${eventName}' dispatched:`, {
    ...params,
    page_path: window.location.pathname
  });

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

/* ==========================================================================
   3. MOBILE NAVIGATION
   ========================================================================== */

function initMobileNavigation() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const siteNav = document.getElementById('siteNav');

  if (!menuBtn || !siteNav) return;

  menuBtn.addEventListener('click', () => {
    const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
    menuBtn.setAttribute('aria-expanded', !isExpanded);
    siteNav.classList.toggle('open');
  });

  document.addEventListener('click', (event) => {
    if (!menuBtn.contains(event.target) && !siteNav.contains(event.target) && siteNav.classList.contains('open')) {
      siteNav.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && siteNav.classList.contains('open')) {
      siteNav.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.focus();
    }
  });
}

/* ==========================================================================
   4. SALON GROWTH CHECK (RULE-BASED LOGIC)
   ========================================================================== */

function initGrowthCheck() {
  const quizForm = document.getElementById('salonGrowthForm');
  const resultsCard = document.getElementById('quizResults');
  const quizContainer = document.getElementById('quizContainer');
  const restartBtn = document.getElementById('restartQuizBtn');
  const printBtn = document.getElementById('printResultsBtn');

  if (!quizForm) return;

  const totalQuestions = 6;
  let hasStarted = false;
  let hasCompleted = false;

  const radioInputs = quizForm.querySelectorAll('input[type="radio"]');
  radioInputs.forEach(input => {
    input.addEventListener('change', () => {
      if (!hasStarted) {
        hasStarted = true;
        trackEvent('growth_check_start', { total_questions: totalQuestions });
      }

      const name = input.getAttribute('name');
      quizForm.querySelectorAll(`input[name="${name}"]`).forEach(sibling => {
        sibling.closest('.option-label')?.classList.remove('selected');
      });
      input.closest('.option-label')?.classList.add('selected');

      updateProgressBar();
    });
  });

  function updateProgressBar() {
    const answeredCount = getAnsweredCount();
    const percent = Math.round((answeredCount / totalQuestions) * 100);
    const fillEl = document.getElementById('quizProgressFill');
    const labelEl = document.getElementById('quizProgressText');
    if (fillEl) fillEl.style.width = `${percent}%`;
    if (labelEl) labelEl.textContent = `${answeredCount} of ${totalQuestions} answered`;
  }

  function getAnsweredCount() {
    const names = new Set();
    quizForm.querySelectorAll('input[type="radio"]:checked').forEach(inp => names.add(inp.name));
    return names.size;
  }

  quizForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const answeredCount = getAnsweredCount();
    const validationError = document.getElementById('quizValidationMsg');

    if (answeredCount < totalQuestions) {
      if (validationError) {
        validationError.textContent = `Please answer all ${totalQuestions} questions to calculate your complete recommendations (${answeredCount}/${totalQuestions} answered).`;
        validationError.style.display = 'block';
      }
      return;
    }

    if (validationError) {
      validationError.style.display = 'none';
    }

    const answers = {
      q1_gbp: quizForm.querySelector('input[name="q1_gbp"]:checked')?.value,
      q2_booking: quizForm.querySelector('input[name="q2_booking"]:checked')?.value,
      q3_pricing: quizForm.querySelector('input[name="q3_pricing"]:checked')?.value,
      q4_content: quizForm.querySelector('input[name="q4_content"]:checked')?.value,
      q5_tracking: quizForm.querySelector('input[name="q5_tracking"]:checked')?.value,
      q6_reviews: quizForm.querySelector('input[name="q6_reviews"]:checked')?.value
    };

    const evaluation = evaluateSalonAnswers(answers);

    renderQuizResults(evaluation);

    quizContainer.style.display = 'none';
    resultsCard.style.display = 'block';
    resultsCard.scrollIntoView({ behavior: 'smooth' });

    if (!hasCompleted) {
      hasCompleted = true;
      trackEvent('growth_check_complete', {
        score: evaluation.score,
        tier: evaluation.tierTitle,
        questions_answered: totalQuestions
      });
    }
  });

  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      quizForm.reset();
      quizForm.querySelectorAll('.option-label').forEach(el => el.classList.remove('selected'));
      updateProgressBar();
      resultsCard.style.display = 'none';
      quizContainer.style.display = 'block';
      hasStarted = false;
      hasCompleted = false;
      quizContainer.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

function evaluateSalonAnswers(answers) {
  let score = 0;
  const maxScore = 100;
  const recommendations = [];

  // Question 1: Google Business Profile (Max 20 pts)
  if (answers.q1_gbp === 'yes_active') {
    score += 20;
    recommendations.push({
      priority: 'good',
      category: 'Local Search & Google Visibility',
      title: 'Google Profile Active – Maintain High Photo Quality & Adelaide Hours',
      description: 'Your Google Business Profile is verified. Continue uploading weekly photos of recent lash, brow, or nail treatments and keep Adelaide public holiday trading hours updated.'
    });
  } else if (answers.q1_gbp === 'yes_basic') {
    score += 10;
    recommendations.push({
      priority: 'high',
      category: 'Local Search & Google Visibility',
      title: 'Action Item: Expand Secondary Google Categories & Service Menus',
      description: 'Many Adelaide salons only choose a generic "Beauty Salon" category. Add secondary categories like "Eyelash Salon", "Nail Salon", or "Waxing Hair Removal Service", upload specific treatment menus, and verify local map pin accuracy.'
    });
  } else {
    recommendations.push({
      priority: 'high',
      category: 'Local Search & Google Visibility',
      title: 'Priority 1: Claim and Optimize Your Google Business Profile',
      description: 'Over 70% of Adelaide beauty clients search Google Maps for "salons near me". Creating a free, verified Google Business Profile is the highest-return initial step for local discovery.'
    });
  }

  // Question 2: Online Booking Flow (Max 20 pts)
  if (answers.q2_booking === 'yes_integrated') {
    score += 20;
    recommendations.push({
      priority: 'good',
      category: 'Booking Conversion',
      title: 'Online Booking Integrated – Optimize Button Prominence on Mobile',
      description: 'Allowing 24/7 direct bookings puts you ahead of salons relying on manual phone tag. Ensure your "Book Appointment" CTA is prominently displayed in both your mobile header and treatment pages.'
    });
  } else if (answers.q2_booking === 'partial_dm') {
    score += 10;
    recommendations.push({
      priority: 'high',
      category: 'Booking Conversion',
      title: 'Reduce Friction: Transition from Instagram DMs to Direct Booking',
      description: 'Requiring clients to DM for availability creates back-and-forth delays, resulting in lost bookings after business hours. Adding a self-service booking link captures evening impulse reservations.'
    });
  } else {
    recommendations.push({
      priority: 'high',
      category: 'Booking Conversion',
      title: 'Implement an Online Appointment Booking Mechanism',
      description: 'Prospective clients looking for beauty appointments often browse at night after work. Without a simple booking link or calendar system, potential revenue is lost to nearby competitors.'
    });
  }

  // Question 3: Clear Pricing & Treatments (Max 15 pts)
  if (answers.q3_pricing === 'yes_full') {
    score += 15;
    recommendations.push({
      priority: 'good',
      category: 'Digital Trust & Clarity',
      title: 'Transparent Pricing Builds Immediate Trust',
      description: 'Upfront prices and treatment durations eliminate hesitation for first-time Adelaide clients. Keep treatment descriptions clear of confusing industry jargon.'
    });
  } else if (answers.q3_pricing === 'partial_estimate') {
    score += 8;
    recommendations.push({
      priority: 'medium',
      category: 'Digital Trust & Clarity',
      title: 'Refine Treatment Menus with Starting-From Guides',
      description: 'If bespoke services make fixed pricing difficult, list "From $X" alongside expected appointment times. First-time clients cite hidden pricing as a primary barrier to booking.'
    });
  } else {
    recommendations.push({
      priority: 'high',
      category: 'Digital Trust & Clarity',
      title: 'Publish Transparent Treatment Durations and Rates',
      description: 'Lack of pricing information drives clients away to competitor websites. Publish standard prices for your primary treatments (e.g. classic lash set, brow sculpt, gel manicure).'
    });
  }

  // Question 4: Content Regularity (Max 15 pts)
  if (answers.q4_content === 'weekly') {
    score += 15;
    recommendations.push({
      priority: 'good',
      category: 'Social Media & Brand Presence',
      title: 'Consistent Content Flow Confirms Your Salon is Active',
      description: 'Regular before-and-after posts reassure prospective clients that your salon is open, hygienic, and skilled. Focus on authentic client results rather than generic stock imagery.'
    });
  } else if (answers.q4_content === 'occasional') {
    score += 8;
    recommendations.push({
      priority: 'medium',
      category: 'Social Media & Brand Presence',
      title: 'Establish a Realistic Batch-Content Schedule',
      description: 'Irregular posting (e.g. gaps of a month) can make a business appear inactive. Aim for 1-2 authentic weekly updates showing real salon work, styling tips, or practitioner introductions.'
    });
  } else {
    recommendations.push({
      priority: 'medium',
      category: 'Social Media & Brand Presence',
      title: 'Revitalize Your Online Presence with Client Transformations',
      description: 'You do not need daily posts. A modest library of recent, high-quality photos demonstrating clean lash isolation or nail art gives first-time visitors immediate confidence.'
    });
  }

  // Question 5: Marketing Tracking & Attribution (Max 15 pts)
  if (answers.q5_tracking === 'yes_tracked') {
    score += 15;
    recommendations.push({
      priority: 'good',
      category: 'Marketing Analytics & Attribution',
      title: 'Attribution Tracking Active – Direct Budget into Top Channels',
      description: 'Knowing which channel generates genuine paying clients enables you to eliminate wasted promotional effort. Review whether Instagram or Google Maps produces higher client lifetime value.'
    });
  } else if (answers.q5_tracking === 'rough_idea') {
    score += 8;
    recommendations.push({
      priority: 'high',
      category: 'Marketing Analytics & Attribution',
      title: 'Add a "How Did You Find Us?" Field to Booking Intakes',
      description: 'A simple dropdown on your booking form (e.g., Google Maps, Instagram, Referral) provides actionable data without needing complex software.'
    });
  } else {
    recommendations.push({
      priority: 'high',
      category: 'Marketing Analytics & Attribution',
      title: 'Eliminate Marketing Guesswork by Tracking Booking Sources',
      description: 'Many salon owners spend hours posting on social media without knowing if it yields appointments. Simple intake questions or trackable booking links clarify what actually drives revenue.'
    });
  }

  // Question 6: Reviews & Reputation (Max 15 pts)
  if (answers.q6_reviews === 'systematic') {
    score += 15;
    recommendations.push({
      priority: 'good',
      category: 'Reputation & Reviews',
      title: 'Proactive Review Strategy Secures Adelaide Local Rank',
      description: 'Regular, recent Google reviews signal reliability to both potential clients and Google search algorithms. Continue responding professionally to all feedback.'
    });
  } else if (answers.q6_reviews === 'passive') {
    score += 8;
    recommendations.push({
      priority: 'medium',
      category: 'Reputation & Reviews',
      title: 'Send Automated Post-Treatment Review Invites',
      description: 'Relying on clients to review spontaneously yields low review volume. An SMS or email sent 2 hours post-treatment with a direct Google Review link significantly boosts review frequency.'
    });
  } else {
    recommendations.push({
      priority: 'high',
      category: 'Reputation & Reviews',
      title: 'Establish a Systematic Google Review Gathering Routine',
      description: 'Prospective clients rarely book a new beauty treatment without reading reviews. Aim to gather 10-15 honest Google reviews to create vital local social proof.'
    });
  }

  let tierTitle = '';
  let tierSummary = '';

  if (score >= 80) {
    tierTitle = 'High-Performing Local Salon';
    tierSummary = 'Your salon already has strong digital marketing fundamentals in place. With minor conversion refinements and targeted attribution tracking, you can maximize repeat bookings and client retention.';
  } else if (score >= 50) {
    tierTitle = 'Growing Local Presence';
    tierSummary = 'You have established key digital touchpoints, but friction in your booking process or gaps in local search optimization may be leaking potential appointments.';
  } else {
    tierTitle = 'Foundational Stage';
    tierSummary = 'Your salon is currently missing out on bookings to competitors who are easier to discover and book online. Focusing on the high-priority recommendations below will yield immediate visibility.';
  }

  return {
    score,
    maxScore,
    tierTitle,
    tierSummary,
    recommendations
  };
}

function renderQuizResults(evalData) {
  const scoreNum = document.getElementById('resultsScoreNum');
  const levelTitle = document.getElementById('resultsLevelTitle');
  const levelSummary = document.getElementById('resultsLevelSummary');
  const recsContainer = document.getElementById('resultsRecommendations');

  if (scoreNum) scoreNum.textContent = evalData.score;
  if (levelTitle) levelTitle.textContent = evalData.tierTitle;
  if (levelSummary) levelSummary.textContent = evalData.tierSummary;

  if (recsContainer) {
    recsContainer.innerHTML = '';
    evalData.recommendations.forEach(rec => {
      const item = document.createElement('div');
      item.className = `rec-item priority-${rec.priority}`;
      item.innerHTML = `
        <div class="rec-category">${escapeHtml(rec.category)} · Priority: ${rec.priority.toUpperCase()}</div>
        <h4 class="rec-title">${escapeHtml(rec.title)}</h4>
        <p class="rec-description">${escapeHtml(rec.description)}</p>
      `;
      recsContainer.appendChild(item);
    });
  }
}

/* ==========================================================================
   5. CONTACT FORM VALIDATION & FUNCTIONAL ENQUIRY
   ========================================================================== */

/**
 * OPTIONAL: Third-party Form Endpoint (e.g. Formspree)
 * Example: const FORM_ENDPOINT_URL = 'https://formspree.io/f/xyzabcde';
 * When left empty, client-side validation runs and provides a 1-click
 * mailto: dispatcher so visitors can send their message immediately.
 */
const FORM_ENDPOINT_URL = '';

function initContactForm() {
  const form = document.getElementById('enquiryForm');
  const notifBox = document.getElementById('formNotification');

  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    let isValid = true;

    const nameInput = document.getElementById('contactName');
    const emailInput = document.getElementById('contactEmail');
    const businessInput = document.getElementById('contactBusiness');
    const serviceInput = document.getElementById('contactService');
    const messageInput = document.getElementById('contactMessage');

    form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => el.classList.remove('error'));
    form.querySelectorAll('.field-error').forEach(el => el.classList.remove('active'));

    if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
      showError(nameInput, 'errName', 'Please provide your name (minimum 2 characters).');
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
      showError(emailInput, 'errEmail', 'Please enter a valid email address so we can reply.');
      isValid = false;
    }

    if (!businessInput.value.trim()) {
      showError(businessInput, 'errBusiness', 'Please provide your salon or trading business name.');
      isValid = false;
    }

    if (!serviceInput.value) {
      showError(serviceInput, 'errService', 'Please select an area of marketing interest.');
      isValid = false;
    }

    if (!messageInput.value.trim() || messageInput.value.trim().length < 10) {
      showError(messageInput, 'errMessage', 'Please provide a brief message explaining your goals (min 10 characters).');
      isValid = false;
    }

    if (!isValid) return;

    const formData = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      business: businessInput.value.trim(),
      service: serviceInput.value,
      message: messageInput.value.trim(),
      timestamp: new Date().toISOString()
    };

    if (FORM_ENDPOINT_URL && FORM_ENDPOINT_URL.startsWith('http')) {
      try {
        const response = await fetch(FORM_ENDPOINT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          showNotification(notifBox, 'Enquiry Received', 'Thank you! Your enquiry has been received and our team will review your salon details shortly.', 'success');
          form.reset();
          trackEvent('contact_form_submit', { service: formData.service, delivery: 'endpoint' });
        } else {
          showNotification(notifBox, 'Submission Notice', 'The external form service returned a response error. Please try sending via email below.', 'error');
        }
      } catch (err) {
        showNotification(notifBox, 'Connection Notice', 'Could not reach the submission endpoint. Please use the direct email button below.', 'error');
      }
    } else {
      // Client-side validation & email draft launcher only (no server/endpoint delivery yet)
      // Do NOT fire 'contact_form_submit' unless a live FORM_ENDPOINT_URL delivers/stores the submission.
      trackEvent('contact_enquiry_draft_ready', {
        service: formData.service
      });

      const emailSubject = encodeURIComponent(`Spotlight SA Consultation Enquiry – ${formData.business}`);
      const emailBody = encodeURIComponent(
        `Hi Spotlight SA,\n\nName: ${formData.name}\nSalon Name: ${formData.business}\nEmail: ${formData.email}\nService Interested In: ${formData.service}\n\nGoals / Challenges:\n${formData.message}\n`
      );
      const mailtoUrl = `mailto:hello@spotlightsa.com.au?subject=${emailSubject}&body=${emailBody}`;

      const confirmationHTML = `
        <div class="submission-notification success" style="display: block;">
          <h4>Enquiry Details Validated</h4>
          <p>Thank you, <strong>${escapeHtml(formData.name)}</strong>! Your details for <strong>${escapeHtml(formData.business)}</strong> regarding <em>"${escapeHtml(formData.service)}"</em> are ready.</p>
          <div style="margin-top: 1rem; display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <a href="${mailtoUrl}" class="btn btn-primary btn-sm" id="sendMailtoBtn" data-track-cta="Send via Email Client" data-track-location="Contact Confirmation">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.35rem;" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              Open in Email App
            </a>
            <button type="button" class="btn btn-secondary btn-sm" id="copyEnquiryBtn" data-track-cta="Copy Enquiry Message" data-track-location="Contact Confirmation">
              Copy Message Text
            </button>
          </div>
        </div>
      `;

      if (notifBox) {
        notifBox.innerHTML = confirmationHTML;
        notifBox.scrollIntoView({ behavior: 'smooth' });

        const copyBtn = document.getElementById('copyEnquiryBtn');
        if (copyBtn) {
          copyBtn.addEventListener('click', () => {
            const textToCopy = `Spotlight SA Enquiry\nName: ${formData.name}\nSalon: ${formData.business}\nEmail: ${formData.email}\nService: ${formData.service}\nMessage: ${formData.message}`;
            navigator.clipboard.writeText(textToCopy).then(() => {
              copyBtn.textContent = 'Copied to Clipboard!';
              setTimeout(() => { copyBtn.textContent = 'Copy Message Text'; }, 2500);
            });
          });
        }
      }

      form.reset();
    }
  });

  function showError(inputEl, errorId, message) {
    inputEl.classList.add('error');
    const errEl = document.getElementById(errorId);
    if (errEl) {
      errEl.textContent = message;
      errEl.classList.add('active');
    }
  }

  function showNotification(boxEl, title, text, type) {
    if (!boxEl) return;
    boxEl.className = `submission-notification ${type}`;
    boxEl.innerHTML = `<h4>${escapeHtml(title)}</h4><p>${escapeHtml(text)}</p>`;
    boxEl.style.display = 'block';
    boxEl.scrollIntoView({ behavior: 'smooth' });
  }
}

/* ==========================================================================
   6. FAQ ACCORDION INTERACTIVITY
   ========================================================================== */

function initFaqAccordion() {
  const faqButtons = document.querySelectorAll('.faq-button');
  faqButtons.forEach(button => {
    button.addEventListener('click', () => {
      const parentItem = button.closest('.faq-item');
      const isCurrentlyOpen = parentItem.classList.contains('open');

      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('open');
        item.querySelector('.faq-button')?.setAttribute('aria-expanded', 'false');
      });

      if (!isCurrentlyOpen) {
        parentItem.classList.add('open');
        button.setAttribute('aria-expanded', 'true');
        const questionText = button.querySelector('span:first-child')?.textContent.trim() || button.textContent.trim();
        trackEvent('faq_expand', {
          question: questionText
        });
      }
    });
  });
}

function escapeHtml(string) {
  const div = document.createElement('div');
  div.textContent = string;
  return div.innerHTML;
}
