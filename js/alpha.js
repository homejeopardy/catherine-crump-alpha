/* Catherine Crump — ALPHA interactions */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- year in footer ---- */
  const yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---- mobile nav ---- */
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => links.classList.remove("open")));
  }

  /* ---- scroll progress + condensed nav ---- */
  const progress = document.querySelector(".progress");
  const shell = document.querySelector(".nav-shell");
  const onScroll = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? (h.scrollTop / max) * 100 : 0;
    if (progress) progress.style.width = p + "%";
    if (shell) shell.classList.toggle("scrolled", h.scrollTop > 40);
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- reveal on scroll ---- */
  const revs = document.querySelectorAll("[data-reveal]");
  if (reduce || !("IntersectionObserver" in window)) {
    revs.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );
    revs.forEach((el) => io.observe(el));
  }

  /* ---- count-up stats ---- */
  const counters = document.querySelectorAll("[data-count]");
  if (!reduce && "IntersectionObserver" in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target, target = parseFloat(el.dataset.count), suffix = el.dataset.suffix || "";
        const dur = 1100, t0 = performance.now();
        const step = (t) => {
          const k = Math.min(1, (t - t0) / dur);
          const val = target * (1 - Math.pow(1 - k, 3));
          el.textContent = (target >= 100 ? Math.round(val) : val.toFixed(0)) + suffix;
          if (k < 1) requestAnimationFrame(step);
          else el.textContent = target + suffix;
        };
        requestAnimationFrame(step);
        cio.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach((c) => cio.observe(c));
  }

  /* ---- scrollspy (active nav link) ---- */
  const spyLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const sections = spyLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if (sections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const id = "#" + e.target.id;
        spyLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---- hero canvas: drifting "data network" ---- */
  const canvas = document.getElementById("hero-canvas");
  if (canvas && !reduce) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr, pts = [], raf, mouse = { x: -999, y: -999 };
    const DENSITY = 0.00009; // points per px^2
    const LINK = 132;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(28, Math.min(90, Math.round(w * h * DENSITY)));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.6 + 0.6
      }));
    }
    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dxm = p.x - mouse.x, dym = p.y - mouse.y;
        const dm = Math.hypot(dxm, dym);
        if (dm < 120) { p.x += (dxm / dm) * 0.6; p.y += (dym / dm) * 0.6; }
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            ctx.strokeStyle = `rgba(120,180,220,${(1 - d / LINK) * 0.20})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(180,210,235,0.55)"; ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    const hero = document.querySelector(".hero");
    hero.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener("pointerleave", () => { mouse.x = -999; mouse.y = -999; });
    window.addEventListener("resize", () => { cancelAnimationFrame(raf); resize(); tick(); });
    // pause when hero off-screen
    const vis = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { resize(); tick(); } else cancelAnimationFrame(raf); });
    }, { threshold: 0.02 });
    vis.observe(hero);
  }

  /* ---- land on hash after load (sticky header offset via CSS scroll-margin) ---- */
  window.addEventListener("load", () => {
    const id = location.hash.slice(1);
    if (id) { const el = document.getElementById(id); if (el) setTimeout(() => el.scrollIntoView(), 60); }
  });
})();
