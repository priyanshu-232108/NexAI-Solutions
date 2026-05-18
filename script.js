const navToggle = document.getElementById('navToggle');
const primaryNav = document.getElementById('primaryNav');
const navbar = document.querySelector('.navbar');
const typingText = document.getElementById('typingText');
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');
const revealElements = document.querySelectorAll('.reveal');
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
const API_BASE_URL = 'http://localhost:5000/api';

const services = [
  'AI Development',
  'Web Design & Development',
  'Mobile App Development',
  'Digital Marketing',
  'SEO & Growth Systems',
  'Video Editing & Motion Graphics',
  'Content Writing',
  'Social Media Management'
];

let serviceIndex = 0;
let charIndex = 0;
let typingForward = true;

function typeService() {
  const currentService = services[serviceIndex];

  if (typingForward) {
    charIndex += 1;
    typingText.textContent = currentService.slice(0, charIndex);

    if (charIndex === currentService.length) {
      typingForward = false;
      setTimeout(typeService, 1400);
      return;
    }
  } else {
    charIndex -= 1;
    typingText.textContent = currentService.slice(0, charIndex);

    if (charIndex === 0) {
      typingForward = true;
      serviceIndex = (serviceIndex + 1) % services.length;
    }
  }

  setTimeout(typeService, typingForward ? 70 : 35);
}

function updateNavbar() {
  navbar.classList.toggle('scrolled', window.scrollY > 12);
}

navToggle.addEventListener('click', () => {
  const isOpen = primaryNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

primaryNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    primaryNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

window.addEventListener('scroll', updateNavbar, { passive: true });
updateNavbar();

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.18 });

revealElements.forEach((element) => observer.observe(element));

contactForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(contactForm);
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const service = String(formData.get('service') || '').trim();
  const message = String(formData.get('message') || '').trim();

  if (name.length < 2 || !email.includes('@') || !service || message.length < 10) {
    formStatus.textContent = 'Please complete all fields with valid details.';
    formStatus.style.color = '#ff8b8b';
    return;
  }

  formStatus.textContent = 'Sending your message...';
  formStatus.style.color = '#9db0ff';

  fetch(`${API_BASE_URL}/leads/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, email, service, message })
  })
    .then(async (response) => {
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message || 'Submission failed');
      }

      return payload;
    })
    .then(() => {
      formStatus.textContent = 'Thanks. Your inquiry has been submitted successfully.';
      formStatus.style.color = '#4ce0b3';
      contactForm.reset();
    })
    .catch((error) => {
      formStatus.textContent = error.message || 'Something went wrong. Please try again later.';
      formStatus.style.color = '#ff8b8b';
    });
});

function resizeCanvas() {
  canvas.width = window.innerWidth * window.devicePixelRatio;
  canvas.height = window.innerHeight * window.devicePixelRatio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
}

const particleCount = window.innerWidth < 768 ? 48 : 80;
const particles = Array.from({ length: particleCount }, () => ({
  x: Math.random() * window.innerWidth,
  y: Math.random() * window.innerHeight,
  vx: (Math.random() - 0.5) * 0.3,
  vy: (Math.random() - 0.5) * 0.3,
  size: Math.random() * 1.8 + 0.6,
  alpha: Math.random() * 0.45 + 0.15
}));

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((particle, index) => {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < -20) particle.x = window.innerWidth + 20;
    if (particle.x > window.innerWidth + 20) particle.x = -20;
    if (particle.y < -20) particle.y = window.innerHeight + 20;
    if (particle.y > window.innerHeight + 20) particle.y = -20;

    ctx.beginPath();
    ctx.fillStyle = `rgba(157, 176, 255, ${particle.alpha})`;
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();

    for (let next = index + 1; next < particles.length; next += 1) {
      const other = particles[next];
      const distance = Math.hypot(particle.x - other.x, particle.y - other.y);

      if (distance < 140) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(59, 91, 255, ${0.11 - distance / 1400})`;
        ctx.lineWidth = 1;
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(other.x, other.y);
        ctx.stroke();
      }
    }
  });

  requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', () => {
  resizeCanvas();
});

resizeCanvas();
animateParticles();
typeService();