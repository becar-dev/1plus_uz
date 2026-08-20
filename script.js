const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

/* ---------- Services ---------- */
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

/* ---------- Theme (light / dark) ---------- */
const root = document.documentElement;
const themeToggle = $("#themeToggle");

const currentTheme = () => root.getAttribute("data-theme") || "light";

function syncThemeIcon() {
  if (!themeToggle) return;
  const dark = currentTheme() === "dark";
  themeToggle.setAttribute("aria-label", dark ? "Och mavzuga o‘tish" : "To‘q mavzuga o‘tish");
}

function setTheme(theme) {
  root.classList.add("theme-transition");
  root.setAttribute("data-theme", theme);
  try { localStorage.setItem("bir-theme", theme); } catch (e) { /* ignore */ }
  syncThemeIcon();
  window.setTimeout(() => root.classList.remove("theme-transition"), 450);
}

syncThemeIcon();
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    setTheme(currentTheme() === "dark" ? "light" : "dark");
    playUiSound("soft");
  });
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

/* ---------- Scroll reveal (staggered) ---------- */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });

const revealGroups = new Map();
$$(".reveal").forEach(el => {
  const parent = el.parentElement;
  const index = revealGroups.get(parent) || 0;
  revealGroups.set(parent, index + 1);
  el.style.setProperty("--reveal-delay", `${Math.min(index, 6) * 70}ms`);
  revealObserver.observe(el);
});

/* ---------- Hero tilt (rAF-throttled, mouse only) ---------- */
const tiltTarget = $("[data-tilt]");
const visualCard = $(".visual-card");
const canTilt = tiltTarget && visualCard && finePointer && !prefersReduced;

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

/* ---------- Water-like interactive background trail ----------
   Dependency-free canvas. Soft brand-colored blobs follow the pointer
   and dissipate like a wake in water. Disabled for reduced-motion / touch.
*/
const canvas = $("#fluidCanvas");
if (canvas && canvas.getContext && !prefersReduced) {
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;

  function resizeCanvas() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  const palette = [[255, 0, 114], [5, 168, 237], [255, 210, 26]];
  let particles = [];
  let last = null;
  let running = false;
  let lastMove = 0;
  let colorIndex = 0;

  function addParticle(x, y) {
    const c = palette[colorIndex % palette.length];
    colorIndex++;
    particles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      r: 34 + Math.random() * 46,
      life: 1,
      decay: 0.012 + Math.random() * 0.01,
      c
    });
    if (particles.length > 140) particles.splice(0, particles.length - 140);
  }

  function spawn(x, y) {
    // Interpolate from the previous point for a continuous wake
    if (last) {
      const dx = x - last.x, dy = y - last.y;
      const dist = Math.hypot(dx, dy);
      const steps = Math.min(Math.floor(dist / 14), 6);
      for (let i = 1; i <= steps; i++) {
        addParticle(last.x + dx * (i / steps), last.y + dy * (i / steps));
      }
    }
    addParticle(x, y);
    last = { x, y };
  }

  function frame() {
    const dark = currentTheme() === "dark";

    // Erase alpha gradually so trails fade like settling water
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,0.045)";
    ctx.fillRect(0, 0, W, H);

    // Additive glow on dark, soft watercolor layering on light
    ctx.globalCompositeOperation = dark ? "lighter" : "source-over";

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= p.decay;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      const alpha = (dark ? 0.16 : 0.12) * p.life;
      const rad = p.r * (1.6 - p.life * 0.6);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
      g.addColorStop(0, `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${alpha})`);
      g.addColorStop(1, `rgba(${p.c[0]},${p.c[1]},${p.c[2]},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = "source-over";

    if (particles.length > 0 || (performance.now() - lastMove) < 300) {
      requestAnimationFrame(frame);
    } else {
      running = false;
      ctx.clearRect(0, 0, W, H);
    }
  }

  function ensureRunning() {
    if (!running) { running = true; requestAnimationFrame(frame); }
  }

  window.addEventListener("pointermove", e => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    lastMove = performance.now();
    spawn(e.clientX, e.clientY);
    ensureRunning();
  }, { passive: true });

  window.addEventListener("pointerleave", () => { last = null; });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { particles = []; }
  });
}

/* ---------- Order form ----------
   Backend-ready: set ORDER_ENDPOINT to your own API / serverless URL
   (which can forward to Telegram/CRM). Left empty = safe demo mode.
   The bot token must live on the server, never in this client file.
*/
const ORDER_ENDPOINT = "";
const orderForm = $("#orderForm");

if (orderForm) {
  orderForm.addEventListener("submit", async e => {
    e.preventDefault();
    const status = $("#formStatus");
    playUiSound("click");

    if (!ORDER_ENDPOINT) {
      if (status) {
        status.classList.remove("error");
        status.textContent = "Demo rejim: forma tekshirildi. Backend ulanmagan (ORDER_ENDPOINT sozlanmagan).";
      }
      return;
    }

    const data = Object.fromEntries(new FormData(orderForm).entries());
    if (status) { status.classList.remove("error"); status.textContent = "Yuborilmoqda…"; }

    try {
      const res = await fetch(ORDER_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      if (status) status.textContent = "Rahmat! Buyurtma qabul qilindi — tez orada bog‘lanamiz.";
      orderForm.reset();
    } catch (err) {
      if (status) {
        status.classList.add("error");
        status.textContent = "Xatolik: yuborib bo‘lmadi. Keyinroq urinib ko‘ring yoki Telegram orqali yozing.";
      }
    }
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
