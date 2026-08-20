const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const services = [
  ["01","Vizitka","Professional business cards.","▦"],
  ["02","Banner","Tashqi va ichki reklama bannerlari.","▱"],
  ["03","Poster","Promo, event va informatsion posterlar.","◫"],
  ["04","Flayer","Tez tarqatiladigan promo materiallar.","◇"],
  ["05","Stiker","Brend va mahsulot uchun stikerlar.","✦"],
  ["06","Foto print","Yuqori sifatli foto chop etish.","□"],
  ["07","Kitob print","Katalog, booklet va kitoblar.","▤"],
  ["08","Qadoqlash","Mahsulot uchun bosma qadoqlash.","⬡"],
  ["09","Etiketka","Mahsulot yorliqlari va etiketkalar.","◈"]
];

const servicesGrid = $("#servicesGrid");
if (servicesGrid) {
  servicesGrid.innerHTML = services.map(([num,title,desc,icon]) => `
  <article class="service-card reveal" data-sound="soft">
    <span class="service-number">${num}</span>
    <span class="service-icon" aria-hidden="true">${icon}</span>
    <h3>${title}</h3>
    <p>${desc}</p>
    <a class="service-link" href="#order">Buyurtma →</a>
  </article>
`).join("");
}

/* ---------- Mobile navigation ---------- */
const menuToggle = $("#menuToggle");
const mobileMenu = $("#mobileMenu");

function closeMenu() {
  if (!mobileMenu || !mobileMenu.classList.contains("open")) return;
  mobileMenu.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
    playUiSound("soft");
  });

  $$(".mobile-menu a").forEach(link => link.addEventListener("click", closeMenu));

  // Close on Escape and when clicking outside the header
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeMenu();
  });
  document.addEventListener("click", e => {
    if (mobileMenu.classList.contains("open") &&
        !mobileMenu.contains(e.target) &&
        !menuToggle.contains(e.target)) {
      closeMenu();
    }
  });
}

/* ---------- Lightweight UI sound system ----------
   Web Audio API is used so the prototype has no audio dependency.
   Later, real audio files/spatial audio can be connected here.
*/
let soundEnabled = false;
let audioContext = null;

function ensureAudio() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    audioContext = new AudioCtx();
  }
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playUiSound(type = "soft") {
  if (!soundEnabled) return;
  const ctx = ensureAudio();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const now = ctx.currentTime;

  osc.type = type === "click" ? "triangle" : "sine";
  osc.frequency.setValueAtTime(type === "click" ? 620 : 440, now);
  osc.frequency.exponentialRampToValueAtTime(type === "click" ? 880 : 520, now + 0.06);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.035, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.12);
}

const soundToggle = $("#soundToggle");
if (soundToggle) {
  soundToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundToggle.classList.toggle("active", soundEnabled);
    soundToggle.setAttribute("aria-pressed", String(soundEnabled));
    if (soundEnabled) {
      ensureAudio();
      playUiSound("click");
    }
  });
}

document.addEventListener("click", e => {
  const target = e.target.closest("[data-sound]");
  if (target) playUiSound(target.dataset.sound);
});

/* ---------- Portfolio filter ---------- */
$$(".filter").forEach(button => {
  button.addEventListener("click", () => {
    $$(".filter").forEach(b => {
      b.classList.remove("active");
      b.setAttribute("aria-pressed", "false");
    });
    button.classList.add("active");
    button.setAttribute("aria-pressed", "true");

    const filter = button.dataset.filter;
    $$(".portfolio-card").forEach(card => {
      const visible = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("is-hidden", !visible);
    });
    playUiSound("soft");
  });
});

/* ---------- Scroll reveal ---------- */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });

// Stagger reveals for siblings sharing a parent for a smoother cascade.
const revealGroups = new Map();
$$(".reveal").forEach(el => {
  const parent = el.parentElement;
  const index = revealGroups.get(parent) || 0;
  revealGroups.set(parent, index + 1);
  el.style.setProperty("--reveal-delay", `${Math.min(index, 6) * 70}ms`);
  revealObserver.observe(el);
});

/* ---------- Hero tilt: intentionally lightweight and future-3D friendly ---------- */
const tiltTarget = $("[data-tilt]");
const visualCard = $(".visual-card");
const canTilt = tiltTarget && visualCard &&
  window.matchMedia("(pointer: fine)").matches &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canTilt) {
  let rafId = null;
  let pending = null;

  const applyTilt = () => {
    rafId = null;
    if (!pending) return;
    const { x, y } = pending;
    visualCard.style.transform =
      `rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg) translateZ(0)`;
  };

  tiltTarget.addEventListener("pointermove", e => {
    const rect = tiltTarget.getBoundingClientRect();
    pending = {
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5
    };
    if (rafId === null) rafId = requestAnimationFrame(applyTilt);
  });

  tiltTarget.addEventListener("pointerleave", () => {
    pending = null;
    visualCard.style.transform = "";
  });
}

/* ---------- Demo order form ----------
   No fake success. Backend/API can be attached later.
*/
const orderForm = $("#orderForm");
if (orderForm) {
  orderForm.addEventListener("submit", e => {
    e.preventDefault();
    const status = $("#formStatus");
    if (status) {
      status.textContent = "Demo rejim: forma tekshirildi. Backend ulanmagan, ma’lumotlar serverga yuborilmadi.";
    }
    playUiSound("click");
  });
}

/* ---------- Scrollspy: highlight active nav link ---------- */
const navLinks = $$(".desktop-nav a");
const sectionMap = navLinks
  .map(link => {
    const id = link.getAttribute("href");
    const section = id && id.startsWith("#") ? $(id) : null;
    return section ? { link, section } : null;
  })
  .filter(Boolean);

if (sectionMap.length) {
  const spyObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const match = sectionMap.find(item => item.section === entry.target);
        if (!match) return;
        navLinks.forEach(l => l.classList.remove("active"));
        match.link.classList.add("active");
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

  sectionMap.forEach(item => spyObserver.observe(item.section));
}

/* ---------- Future integration notes ----------
   3D layer:
   - Replace/augment .hero-visual with a Three.js/WebGL canvas.
   - Keep the same DOM container and resize lifecycle.
   Audio:
   - Replace generated UI tones with real assets.
   - For spatial/3D audio, connect sources to Web Audio PannerNode.
   This keeps stage 1 dependency-free while preserving a clean upgrade path.
*/
