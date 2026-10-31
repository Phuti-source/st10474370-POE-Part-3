/* ==========================================================================
   PRETTY CROWN BARBER & BEAUTY SALON — script.js  (Part 3)
   One external script, linked with "defer" on every page.
   Each feature only runs if its elements exist on the current page.

   Features:
   1. Interactive elements  : accordion, tabs, modal (service details)
   2. Gallery lightbox      : image viewer with next / previous / keyboard
   3. Dynamic content       : services loaded from data + search/filter/sort
   4. Interactive map       : Leaflet + OpenStreetMap (contact page)
   5. Form validation       : enquiry + contact forms (client-side, JS)
   6. Form processing       : enquiry response (cost/availability), AJAX
                              submit, and email compilation (mailto)
   7. Animations            : scroll reveal (CSS transitions + JS observer)
   ========================================================================== */
'use strict';

document.documentElement.classList.add('js');

/* --------------------------------------------------------------------------
   CONFIGURATION — change these values to match the real business
   -------------------------------------------------------------------------- */
const CONFIG = {
  email: 'info@prettycrownsalon.co.za',   // recipient of compiled emails
  ajaxEndpoint: '',                        // e.g. a Formspree URL. Empty = simulated AJAX
  map: {
    lat: -23.9045,                         // Polokwane
    lng: 29.4689,
    zoom: 14,
    name: 'Pretty Crown Barber & Beauty Salon',
    address: 'Polokwane, Limpopo'
  },
  // Opening hours by day (0 = Sunday ... 6 = Saturday): [open hour, close hour] or null if closed
  hours: { 0: null, 1: [8, 18], 2: [8, 18], 3: [8, 18], 4: [8, 18], 5: [8, 18], 6: [8, 16] }
};

const DEFAULT_IMAGE = 'Mypictures/hairdressingmenandwomen.jpg';

/* Services data: used for the dynamic services list, search, modal and enquiry response.
   Prices are estimates ("from" prices) — edit them to match the salon. */
const SERVICES = [
  { id: 'haircuts', name: 'Haircuts & Barbering', category: 'Hair', price: 120, duration: 45,
    image: 'Mypictures/haircut.jpg', alt: 'Barber giving a men’s haircut at Pretty Crown Salon in Polokwane',
    description: 'Classic cuts, fades, line-ups and styling for men, women and children.' },
  { id: 'braiding', name: 'Braiding & Styling', category: 'Hair', price: 350, duration: 150,
    image: 'Mypictures/braids.jpg', alt: 'Braided hairstyle done at Pretty Crown Salon in Polokwane',
    description: 'Box braids, cornrows, twists and special-occasion styling.' },
  { id: 'beard', name: 'Beard Trim & Shave', category: 'Barber', price: 80, duration: 30,
    image: 'Mypictures/beardtrim.jpg', alt: 'Barber trimming a beard in Polokwane',
    description: 'Beard shaping, hot-towel shaves and neat finishing.' },
  { id: 'colouring', name: 'Hair Colouring & Relaxing', category: 'Hair', price: 450, duration: 120,
    image: 'Mypictures/hairdye.jpeg', alt: 'Professional hair colouring and relaxing service in Polokwane',
    description: 'Safe hair relaxing treatments, tinting, highlights, and full-colour transformations.' },
  { id: 'natural', name: 'Natural Hair Treatments', category: 'Hair', price: 250, duration: 90,
    image: 'Mypictures/naturalblow.jpeg', alt: 'Natural hair care and deep conditioning in Polokwane',
    description: 'Deep conditioning, scalp hydration, wash and blow-dry, and dreadlocks maintenance.' },
  { id: 'nails', name: 'Manicures & Pedicures', category: 'Nails', price: 200, duration: 75,
    image: 'Mypictures/redgelnails.jpg', alt: 'Nail care, manicures and pedicures in Polokwane',
    description: 'Hand and foot care, acrylic nails, gel polish, and soothing foot massages.' }
];

/* --------------------------------------------------------------------------
   HELPERS
   -------------------------------------------------------------------------- */
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
const pad = (n) => String(n).padStart(2, '0');
const fmtHour = (h) => `${pad(h)}:00`;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value);
  });
  [].concat(children).forEach((child) => node.append(child));
  return node;
}

function toISODate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* Swap any broken image for the default salon image */
document.addEventListener('error', (event) => {
  const img = event.target;
  if (img && img.tagName === 'IMG' && !img.dataset.fallback) {
    img.dataset.fallback = 'true';
    img.src = DEFAULT_IMAGE;
  }
}, true);

/* --------------------------------------------------------------------------
   1. INTERACTIVE ELEMENTS
   -------------------------------------------------------------------------- */

/* Accordion (FAQ): only one panel open at a time */
function initAccordion() {
  $$('.accordion').forEach((accordion) => {
    const triggers = $$('.accordion-trigger', accordion);
    triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const wasOpen = trigger.getAttribute('aria-expanded') === 'true';
        triggers.forEach((t) => {
          t.setAttribute('aria-expanded', 'false');
          document.getElementById(t.getAttribute('aria-controls')).hidden = true;
        });
        if (!wasOpen) {
          trigger.setAttribute('aria-expanded', 'true');
          document.getElementById(trigger.getAttribute('aria-controls')).hidden = false;
        }
      });
    });
  });
}

/* Tabs with keyboard support (arrow keys, Home, End) */
function initTabs() {
  $$('.tabs').forEach((tabs) => {
    const buttons = $$('[role="tab"]', tabs);
    const panels = $$('[role="tabpanel"]', tabs);

    const activate = (button, moveFocus) => {
      buttons.forEach((b) => {
        const selected = b === button;
        b.setAttribute('aria-selected', String(selected));
        b.tabIndex = selected ? 0 : -1;
      });
      panels.forEach((p) => { p.hidden = p.id !== button.getAttribute('aria-controls'); });
      if (moveFocus) button.focus();
    };

    buttons.forEach((button, index) => {
      button.addEventListener('click', () => activate(button, false));
      button.addEventListener('keydown', (event) => {
        let next = null;
        if (event.key === 'ArrowRight') next = buttons[(index + 1) % buttons.length];
        if (event.key === 'ArrowLeft') next = buttons[(index - 1 + buttons.length) % buttons.length];
        if (event.key === 'Home') next = buttons[0];
        if (event.key === 'End') next = buttons[buttons.length - 1];
        if (next) { event.preventDefault(); activate(next, true); }
      });
    });
  });
}

/* Live "open now / closed" indicator (dynamic content) */
function initOpenStatus() {
  const node = $('#open-status');
  if (!node) return;
  const now = new Date();
  const today = CONFIG.hours[now.getDay()];
  const hourNow = now.getHours() + now.getMinutes() / 60;

  if (today && hourNow >= today[0] && hourNow < today[1]) {
    node.textContent = `We are open now until ${fmtHour(today[1])}.`;
    node.classList.add('is-open');
    return;
  }
  if (today && hourNow < today[0]) {
    node.textContent = `We open today at ${fmtHour(today[0])}.`;
    return;
  }
  for (let i = 1; i <= 7; i += 1) {
    const day = (now.getDay() + i) % 7;
    if (CONFIG.hours[day]) {
      node.textContent = `We are closed now. We open ${i === 1 ? 'tomorrow' : DAY_NAMES[day]} at ${fmtHour(CONFIG.hours[day][0])}.`;
      return;
    }
  }
}

/* Scroll reveal animation */
function initReveal() {
  const items = $$('.reveal');
  if (!items.length) return;
  if (!('IntersectionObserver' in window)) {
    items.forEach((i) => i.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach((item) => observer.observe(item));
}

/* --------------------------------------------------------------------------
   2. GALLERY LIGHTBOX
   -------------------------------------------------------------------------- */
function initLightbox() {
  const dialog = $('#lightbox');
  if (!dialog) return;
  const items = $$('.gallery-item');
  const image = $('.lightbox-img', dialog);
  const caption = $('.lightbox-caption', dialog);
  let index = 0;

  const show = (i) => {
    index = (i + items.length) % items.length;
    const link = items[index];
    const thumb = $('img', link);
    image.src = link.getAttribute('href');
    image.alt = thumb ? thumb.alt : '';
    caption.textContent = link.dataset.caption || image.alt;
  };

  items.forEach((link, i) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      show(i);
      dialog.showModal();
    });
  });

  $('.lightbox-close', dialog).addEventListener('click', () => dialog.close());
  $('.lightbox-prev', dialog).addEventListener('click', () => show(index - 1));
  $('.lightbox-next', dialog).addEventListener('click', () => show(index + 1));
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(index - 1);
    if (event.key === 'ArrowRight') show(index + 1);
  });
}

/* --------------------------------------------------------------------------
   3. DYNAMIC CONTENT: SERVICES LIST + SEARCH / FILTER / SORT + MODAL
   -------------------------------------------------------------------------- */
function initServices() {
  const list = $('#service-list');
  if (!list) return;
  const search = $('#service-search');
  const category = $('#service-category');
  const sort = $('#service-sort');
  const count = $('#service-count');
  const modal = $('#service-modal');

  [...new Set(SERVICES.map((s) => s.category))].forEach((c) => {
    category.append(el('option', { value: c, text: c }));
  });

  function getVisible() {
    const query = search.value.trim().toLowerCase();
    const items = SERVICES.filter((s) => {
      const matchesCategory = category.value === 'all' || s.category === category.value;
      const haystack = `${s.name} ${s.description} ${s.category}`.toLowerCase();
      return matchesCategory && (!query || haystack.includes(query));
    });
    switch (sort.value) {
      case 'price-asc': items.sort((a, b) => a.price - b.price); break;
      case 'price-desc': items.sort((a, b) => b.price - a.price); break;
      case 'duration': items.sort((a, b) => a.duration - b.duration); break;
      default: items.sort((a, b) => a.name.localeCompare(b.name));
    }
    return items;
  }

  function buildCard(s) {
    return el('article', { class: 'card service-card' }, [
      el('img', { src: s.image, alt: s.alt, width: '400', height: '300', loading: 'lazy' }),
      el('h3', { text: s.name }),
      el('p', { text: s.description }),
      el('p', { class: 'service-meta', text: `From R${s.price} • about ${s.duration} minutes` }),
      el('p', { class: 'card-actions' }, [
        el('button', { type: 'button', class: 'btn btn-small', 'data-id': s.id, text: 'View details' })
      ])
    ]);
  }

  function render() {
    const items = getVisible();
    list.replaceChildren(...items.map(buildCard));
    if (!items.length) {
      list.append(el('p', { class: 'no-results', text: 'No services match your search. Try a different word or choose “All categories”.' }));
    }
    count.textContent = items.length
      ? `Showing ${items.length} of ${SERVICES.length} services`
      : 'No services found.';
  }

  list.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-id]');
    if (!button) return;
    const s = SERVICES.find((item) => item.id === button.dataset.id);
    $('#modal-title', modal).textContent = s.name;
    const img = $('#modal-img', modal);
    img.src = s.image;
    img.alt = s.alt;
    $('#modal-desc', modal).textContent = s.description;
    $('#modal-meta', modal).textContent = `Estimated price: from R${s.price} • Duration: about ${s.duration} minutes`;
    $('#modal-enquire', modal).href = `enquiry.html?service=${encodeURIComponent(s.id)}`;
    modal.showModal();
  });

  $('.modal-close', modal).addEventListener('click', () => modal.close());
  modal.addEventListener('click', (event) => { if (event.target === modal) modal.close(); });

  [search, category, sort].forEach((control) => {
    control.addEventListener('input', render);
    control.addEventListener('change', render);
  });
  $('#service-filter').addEventListener('submit', (event) => event.preventDefault());
  $('#service-reset').addEventListener('click', () => {
    search.value = '';
    category.value = 'all';
    sort.value = 'name';
    render();
    search.focus();
  });

  render();
}

/* --------------------------------------------------------------------------
   4. INTERACTIVE MAP (Leaflet + OpenStreetMap)
   -------------------------------------------------------------------------- */
function initMap() {
  const container = $('#map');
  if (!container) return;
  if (typeof L === 'undefined') {
    container.textContent = 'The map could not be loaded. Please check your internet connection.';
    container.classList.add('map-error');
    return;
  }
  const { lat, lng, zoom, name, address } = CONFIG.map;
  const map = L.map(container, { scrollWheelZoom: false }).setView([lat, lng], zoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const popup = el('div', {}, [el('strong', { text: name }), el('br'), address]);
  L.marker([lat, lng]).addTo(map).bindPopup(popup).openPopup();

  /* Scroll-wheel zoom only after the user clicks the map (avoids page-scroll traps) */
  map.on('click', () => map.scrollWheelZoom.enable());
  map.on('mouseout', () => map.scrollWheelZoom.disable());
}

/* --------------------------------------------------------------------------
   5. FORM VALIDATION HELPERS
   -------------------------------------------------------------------------- */
function checkName(v) {
  v = v.trim();
  if (!v) return 'Please enter your full name.';
  if (v.length < 2) return 'Your name must be at least 2 characters long.';
  if (!/^[\p{L}][\p{L}' -]*$/u.test(v)) return 'Your name may only contain letters, spaces, hyphens and apostrophes.';
  return '';
}

function checkEmail(v) {
  v = v.trim();
  if (!v) return 'Please enter your email address.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Please enter a valid email address, for example name@example.com.';
  return '';
}

function checkPhone(v, required) {
  const cleaned = v.replace(/[\s\-()]/g, '');
  if (!cleaned) return required ? 'Please enter your phone number.' : '';
  if (!/^(\+27|0)[1-9]\d{8}$/.test(cleaned)) {
    return 'Enter a valid South African number, for example 071 234 5678 or +27 71 234 5678.';
  }
  return '';
}

function checkText(v, label, min, max) {
  v = v.trim();
  if (!v) return `Please enter ${label}.`;
  if (v.length < min) return `${label.charAt(0).toUpperCase() + label.slice(1)} must be at least ${min} characters (currently ${v.length}).`;
  if (v.length > max) return `${label.charAt(0).toUpperCase() + label.slice(1)} must be ${max} characters or fewer (currently ${v.length}).`;
  return '';
}

function checkRequiredChoice(v, message) {
  return v ? '' : message;
}

function checkDate(v) {
  if (!v) return 'Please choose a preferred date.';
  const d = new Date(`${v}T00:00:00`);
  if (Number.isNaN(d.getTime())) return 'Please enter a valid date.';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d < today) return 'The date cannot be in the past.';
  const limit = new Date(today);
  limit.setMonth(limit.getMonth() + 6);
  if (d > limit) return 'Please choose a date within the next 6 months.';
  if (!CONFIG.hours[d.getDay()]) return 'We are closed on Sundays. Please choose another day.';
  return '';
}

function checkTime(timeValue, dateValue) {
  if (!timeValue) return 'Please choose a preferred time.';
  const d = dateValue ? new Date(`${dateValue}T00:00:00`) : null;
  if (d && !Number.isNaN(d.getTime())) {
    const hours = CONFIG.hours[d.getDay()];
    const hour = parseInt(timeValue, 10);
    if (hours && (hour < hours[0] || hour >= hours[1])) {
      return `On ${DAY_NAMES[d.getDay()]}s we are open from ${fmtHour(hours[0])} to ${fmtHour(hours[1])}. Please choose a time in that range.`;
    }
  }
  return '';
}

/* Show or clear an error message for one field */
function showError(id, message) {
  const target = document.getElementById(id);
  if (!target) return;
  const wrapper = target.closest('.form-field');
  const output = document.getElementById(`${id}-error`);
  if (output) output.textContent = message;
  if (wrapper) wrapper.classList.toggle('has-error', Boolean(message));
  if (target.matches('input, select, textarea')) target.setAttribute('aria-invalid', message ? 'true' : 'false');
}

/* Run every rule; return the first invalid element (or null if all valid) */
function validateForm(form, rules) {
  let firstInvalid = null;
  rules.forEach((rule) => {
    const message = rule.check(form);
    showError(rule.id, message);
    if (message && !firstInvalid) firstInvalid = document.getElementById(rule.id);
  });
  return firstInvalid;
}

function focusField(element) {
  const target = element.matches('fieldset') ? $('input', element) : element;
  if (target) target.focus();
}

/* Validate on blur/change, and clear errors while typing */
function attachLiveValidation(form, rules) {
  ['focusout', 'change', 'input'].forEach((type) => {
    form.addEventListener(type, (event) => {
      const target = event.target;
      const fieldset = target.closest('fieldset');
      const rule = rules.find((r) => r.id === target.id || (fieldset && r.id === fieldset.id));
      if (rule) {
        const wrapper = target.closest('.form-field');
        const hasError = wrapper && wrapper.classList.contains('has-error');
        if (!(type === 'input' && !hasError)) showError(rule.id, rule.check(form));
      }
      rules.filter((r) => r.deps && r.deps.includes(target.id)).forEach((r) => {
        if (form.elements[r.id].value) showError(r.id, r.check(form));
      });
    });
  });
}

function clearErrors(form, rules) {
  rules.forEach((rule) => showError(rule.id, ''));
  const status = $('.form-status', form);
  if (status) { status.textContent = ''; status.classList.remove('is-error'); }
}

/* Live character counters for textareas */
function initCounters() {
  $$('textarea[data-maxlength]').forEach((area) => {
    const output = document.getElementById(`${area.id}-counter`);
    const max = Number(area.dataset.maxlength);
    const update = () => {
      output.textContent = `${area.value.length} / ${max} characters`;
      output.classList.toggle('is-over', area.value.length > max);
    };
    area.addEventListener('input', update);
    area.closest('form').addEventListener('reset', () => setTimeout(update, 0));
    update();
  });
}

/* --------------------------------------------------------------------------
   6. FORM PROCESSING
   -------------------------------------------------------------------------- */

/* AJAX submission: real request if an endpoint is set, otherwise a simulated one */
async function submitAsync(payload) {
  if (!CONFIG.ajaxEndpoint) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { ok: true, simulated: true };
  }
  const response = await fetch(CONFIG.ajaxEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('The server could not process the request.');
  return { ok: true };
}

function buildMailto(subject, body) {
  return `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/* ---------- Enquiry form ---------- */
function initEnquiryForm() {
  const form = $('#enquiry-form');
  if (!form) return;
  const response = $('#enquiry-response');
  const status = $('.form-status', form);
  const submit = $('button[type="submit"]', form);

  const preset = new URLSearchParams(window.location.search).get('service');
  if (preset && SERVICES.some((s) => s.id === preset)) form.elements.enq_service.value = preset;
  form.elements.enq_date.min = toISODate(new Date());

  const rules = [
    { id: 'enq_name', check: (f) => checkName(f.elements.enq_name.value) },
    { id: 'enq_email', check: (f) => checkEmail(f.elements.enq_email.value) },
    { id: 'enq_phone', check: (f) => checkPhone(f.elements.enq_phone.value, true) },
    { id: 'enq_service', check: (f) => checkRequiredChoice(f.elements.enq_service.value, 'Please select a service.') },
    { id: 'enq_type_group', check: (f) => checkRequiredChoice(f.elements.enq_type.value, 'Please choose what you would like to know.') },
    { id: 'enq_date', check: (f) => checkDate(f.elements.enq_date.value) },
    { id: 'enq_time', deps: ['enq_date'], check: (f) => checkTime(f.elements.enq_time.value, f.elements.enq_date.value) },
    { id: 'enq_message', check: (f) => checkText(f.elements.enq_message.value, 'your message', 10, 500) },
    { id: 'enq_consent', check: (f) => (f.elements.enq_consent.checked ? '' : 'Please tick the box to agree before sending.') }
  ];
  attachLiveValidation(form, rules);

  form.addEventListener('reset', () => setTimeout(() => clearErrors(form, rules), 0));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const invalid = validateForm(form, rules);
    if (invalid) {
      status.textContent = 'Please correct the highlighted fields and try again.';
      status.classList.add('is-error');
      focusField(invalid);
      return;
    }
    status.classList.remove('is-error');
    status.textContent = 'Sending your enquiry…';
    submit.disabled = true;

    const data = {
      name: form.elements.enq_name.value.trim(),
      email: form.elements.enq_email.value.trim(),
      phone: form.elements.enq_phone.value.trim(),
      service: form.elements.enq_service.value,
      type: form.elements.enq_type.value,
      date: form.elements.enq_date.value,
      time: form.elements.enq_time.value,
      message: form.elements.enq_message.value.trim()
    };

    try {
      await submitAsync(data);
      status.textContent = '';
      showEnquiryResponse(form, response, data);
    } catch (error) {
      status.textContent = 'Sorry, we could not send your enquiry. Please try again, or use the Contact page.';
      status.classList.add('is-error');
    } finally {
      submit.disabled = false;
    }
  });
}

function showEnquiryResponse(form, panel, data) {
  const service = SERVICES.find((s) => s.id === data.service);
  const reference = `ENQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const date = new Date(`${data.date}T00:00:00`);
  const dateText = date.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const hours = CONFIG.hours[date.getDay()];

  const costText = `The estimated cost for ${service.name} starts from R${service.price} and takes about ${service.duration} minutes. The final price depends on the style and products used.`;
  const availabilityText = `Your requested time, ${dateText} at ${data.time}, falls within our opening hours (${fmtHour(hours[0])} to ${fmtHour(hours[1])}). We will confirm the slot with you shortly.`;

  let answer;
  if (data.type === 'price') answer = costText;
  else if (data.type === 'availability') answer = availabilityText;
  else answer = `${availabilityText} ${costText}`;

  const typeLabels = { price: 'Price / cost', availability: 'Availability', booking: 'Booking request' };
  const summary = el('dl', { class: 'summary' }, [
    el('dt', { text: 'Service' }), el('dd', { text: service.name }),
    el('dt', { text: 'Enquiry type' }), el('dd', { text: typeLabels[data.type] }),
    el('dt', { text: 'Estimated cost' }), el('dd', { text: `From R${service.price}` }),
    el('dt', { text: 'Requested slot' }), el('dd', { text: `${dateText} at ${data.time}` }),
    el('dt', { text: 'Reference' }), el('dd', { text: reference })
  ]);

  const emailBody = [
    `Enquiry reference: ${reference}`,
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    `Service: ${service.name}`,
    `Enquiry type: ${typeLabels[data.type]}`,
    `Preferred date and time: ${dateText} at ${data.time}`,
    '',
    'Message:',
    data.message
  ].join('\n');

  const emailLink = el('a', {
    class: 'btn',
    href: buildMailto(`Enquiry ${reference}: ${service.name}`, emailBody),
    text: 'Send this enquiry by email'
  });
  const newButton = el('button', { type: 'button', class: 'btn btn-outline-dark', text: 'Make another enquiry' });
  newButton.addEventListener('click', () => {
    form.reset();
    panel.hidden = true;
    form.hidden = false;
    focusField(form.elements.enq_name);
  });

  panel.replaceChildren(
    el('h2', { id: 'response-title', text: `Thank you, ${data.name.split(' ')[0]}!` }),
    el('p', { text: `Your enquiry has been received. Reference number: ${reference}.` }),
    el('p', { class: 'response-answer', text: answer }),
    summary,
    el('p', { text: `We will reply to ${data.email} or call you on ${data.phone}.` }),
    el('p', { class: 'actions' }, [emailLink, newButton])
  );
  form.hidden = true;
  panel.hidden = false;
  panel.focus();
}

/* ---------- Contact form ---------- */
function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;
  const preview = $('#contact-preview');
  const status = $('.form-status', form);

  const rules = [
    { id: 'contact_name', check: (f) => checkName(f.elements.contact_name.value) },
    { id: 'contact_email', check: (f) => checkEmail(f.elements.contact_email.value) },
    { id: 'contact_phone', check: (f) => checkPhone(f.elements.contact_phone.value, false) },
    { id: 'contact_type', check: (f) => checkRequiredChoice(f.elements.contact_type.value, 'Please select the type of message.') },
    { id: 'contact_subject', check: (f) => checkText(f.elements.contact_subject.value, 'a subject', 3, 80) },
    { id: 'contact_message', check: (f) => checkText(f.elements.contact_message.value, 'your message', 10, 1000) }
  ];
  attachLiveValidation(form, rules);
  form.addEventListener('reset', () => setTimeout(() => clearErrors(form, rules), 0));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const invalid = validateForm(form, rules);
    if (invalid) {
      status.textContent = 'Please correct the highlighted fields and try again.';
      status.classList.add('is-error');
      focusField(invalid);
      return;
    }
    status.textContent = '';
    status.classList.remove('is-error');

    const name = form.elements.contact_name.value.trim();
    const phone = form.elements.contact_phone.value.trim();
    const subject = `[${form.elements.contact_type.value}] ${form.elements.contact_subject.value.trim()}`;
    const body = [
      `Name: ${name}`,
      `Email: ${form.elements.contact_email.value.trim()}`,
      `Phone: ${phone || 'Not provided'}`,
      `Message type: ${form.elements.contact_type.value}`,
      '',
      form.elements.contact_message.value.trim()
    ].join('\n');

    const sendLink = el('a', { class: 'btn', href: buildMailto(subject, body), text: 'Open email and send' });
    const editButton = el('button', { type: 'button', class: 'btn btn-outline-dark', text: 'Edit message' });
    editButton.addEventListener('click', () => {
      preview.hidden = true;
      form.hidden = false;
      focusField(form.elements.contact_message);
    });

    preview.replaceChildren(
      el('h2', { id: 'preview-title', text: 'Your message is ready to send' }),
      el('p', { text: `Select “Open email and send” to open your email app with this message addressed to ${CONFIG.email}.` }),
      el('dl', { class: 'summary' }, [
        el('dt', { text: 'To' }), el('dd', { text: CONFIG.email }),
        el('dt', { text: 'Subject' }), el('dd', { text: subject })
      ]),
      el('pre', { class: 'email-body', text: body }),
      el('p', { class: 'actions' }, [sendLink, editButton])
    );
    form.hidden = true;
    preview.hidden = false;
    preview.focus();
  });
}

/* --------------------------------------------------------------------------
   START
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initOpenStatus();
  initAccordion();
  initTabs();
  initLightbox();
  initServices();
  initMap();
  initCounters();
  initEnquiryForm();
  initContactForm();
});