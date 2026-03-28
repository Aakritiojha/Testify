(function () {
  'use strict';

  /* ══════════════════════════════════════
     1. HERO — CANVAS DOT GRID
     Optimised: throttled mousemove, paused
     when off-screen, debounced resize,
     reduced dot count on mobile.
  ══════════════════════════════════════ */
  const canvas = document.getElementById('bg');
  const ctx    = canvas.getContext('2d');
  let dots = [], W, H, mx = -999, my = -999, pulse = 0, pulseX = 0, pulseY = 0;
  let canvasVisible = true;

  // Audio: lazy-loaded on first use — no blocking preload
  let clinkSound = null;
  function getSound() {
    if (!clinkSound) {
      clinkSound = new Audio('https://www.soundjay.com/buttons/button-10.mp3');
      clinkSound.volume = 0.4;
    }
    return clinkSound;
  }

  // Debounced resize
  let resizeTimer;
  function scheduleResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    dots = [];
    const spacing = window.innerWidth < 600 ? 50 : 35;
    for (let x = spacing / 2; x < W; x += spacing)
      for (let y = spacing / 2; y < H; y += spacing)
        dots.push({ x, y, baseO: 0.04 + Math.random() * 0.04 });
  }

  function drawDots() {
    requestAnimationFrame(drawDots);
    if (!canvasVisible) return;
    ctx.clearRect(0, 0, W, H);
    const len = dots.length;
    for (let i = 0; i < len; i++) {
      const d = dots[i];
      const distM = Math.hypot(d.x - mx, d.y - my);
      const hover = distM < 160 ? (1 - distM / 160) * 0.5 : 0;
      let wave = 0;
      if (pulse > 0) {
        const distB = Math.hypot(d.x - pulseX, d.y - pulseY);
        const waveD = Math.abs(distB - pulse * 1200);
        if (waveD < 100) wave = (1 - waveD / 100) * 0.5 * (1 - pulse);
      }
      ctx.beginPath();
      ctx.arc(d.x, d.y, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100,160,255,${(d.baseO + hover + wave).toFixed(3)})`;
      ctx.fill();
    }
    if (pulse > 0) { pulse += 0.015; if (pulse > 1) pulse = 0; }
  }

  // Pause canvas when hero scrolls out of view
  const heroObs = new IntersectionObserver(e => { canvasVisible = e[0].isIntersecting; }, { threshold: 0 });
  heroObs.observe(document.getElementById('hero'));

  // Throttled mousemove
  let lastMove = 0;
  window.addEventListener('mousemove', e => {
    const now = performance.now();
    if (now - lastMove < 16) return;
    lastMove = now;
    mx = e.clientX; my = e.clientY;
  }, { passive: true });

  window.addEventListener('resize', scheduleResize, { passive: true });
  resize();
  drawDots();


  /* ══════════════════════════════════════
     2. HERO — ENTRANCE ANIMATION
  ══════════════════════════════════════ */
  const anim = (dur, fn) => new Promise(res => {
    const s = performance.now();
    function step(now) {
      const p = Math.min((now - s) / dur, 1);
      fn(p);
      p < 1 ? requestAnimationFrame(step) : res();
    }
    requestAnimationFrame(step);
  });

  async function runHero() {
    document.getElementById('ey').classList.add('show');
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 90));
      document.getElementById('w' + i).classList.add('show');
    }
    document.getElementById('sub').classList.add('show');
    document.getElementById('btns').classList.add('show');

    const hL = document.getElementById('hL');
    const hR = document.getElementById('hR');
    await anim(1000, p => {
      const x = 60 * (1 - p);
      hL.style.transform = `translateX(${-x}px)`;
      hR.style.transform = `translateX(${x}px)`;
      hL.style.opacity = hR.style.opacity = p;
    });

    getSound().play().catch(() => {});
    document.getElementById('seam').style.opacity = 0.5;
    const r = document.getElementById('bulb').getBoundingClientRect();
    pulseX = r.left + r.width / 2;
    pulseY = r.top  + r.height / 2;
    pulse  = 0.01;
    anim(500, p => {
      document.getElementById('ig0').setAttribute('stop-opacity', p);
      document.getElementById('ig1').setAttribute('stop-opacity', p * 0.6);
      document.getElementById('bloom').style.opacity = p;
      document.getElementById('rays').style.opacity  = p;
    });
  }

  setTimeout(runHero, 600);


  /* ══════════════════════════════════════
     3. TRAP — INFINITY LOOP ANIMATION
     Optimised: single unified rAF loop
     for both dash + traveller; paused
     when section not in view.
  ══════════════════════════════════════ */
  const CX = 360, CY = 220, A = 400;

  function lem(t) {
    const d = 1 + Math.sin(t) * Math.sin(t);
    return { x: CX + A * Math.cos(t) / d, y: CY + A * Math.sin(t) * Math.cos(t) / d };
  }

  function buildPath() {
    const pts = [];
    for (let i = 0; i <= 500; i++) {
      const p = lem((i / 500) * Math.PI * 2);
      pts.push((i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1));
    }
    return pts.join('') + 'Z';
  }

  const pathD = buildPath();
  document.getElementById('lem-base').setAttribute('d', pathD);
  document.getElementById('lem-dash').setAttribute('d', pathD);

  const nodes = [
    { label: 'Watch 40+ hours',    sub: 'Taking notes that never get read', angle: Math.PI * 0.5, offX: 0,   offY: -22, anchor: 'middle' },
    { label: 'Buy another course', sub: '"Surely this one works..."',        angle: Math.PI,       offX: -22, offY: 0,   anchor: 'end'    },
    { label: 'Forget it all',      sub: 'Back to square one',                angle: 0,             offX: 22,  offY: 0,   anchor: 'start'  },
  ];

  nodes.forEach((n, i) => {
    const p = lem(n.angle);
    n.x = p.x; n.y = p.y;
    document.getElementById('nd' + i).setAttribute('cx', p.x);
    document.getElementById('nd' + i).setAttribute('cy', p.y);
    const tx = p.x + n.offX * 2.6, ty = p.y + n.offY * 2.4;
    const t  = document.getElementById('l' + i + 't');
    const s  = document.getElementById('l' + i + 's');
    t.setAttribute('x', tx); t.setAttribute('y', ty);
    t.setAttribute('text-anchor', n.anchor);
    t.setAttribute('dominant-baseline', 'central');
    t.textContent = n.label;
    s.setAttribute('x', tx); s.setAttribute('y', ty + 17);
    s.setAttribute('text-anchor', n.anchor);
    s.textContent = n.sub;
  });

  const lemDash    = document.getElementById('lem-dash');
  const trav       = document.getElementById('traveller');
  const ring       = document.getElementById('nd-ring');
  let doff = 0, T = 0, activeNode = -1, fadeOutTimer = null;
  let trapVisible  = false;
  const trapObs = new IntersectionObserver(e => { trapVisible = e[0].isIntersecting; }, { threshold: 0 });
  trapObs.observe(document.getElementById('trap'));

  (function loopTrap() {
    requestAnimationFrame(loopTrap);
    if (!trapVisible) return;

    doff -= 0.42;
    lemDash.style.strokeDashoffset = doff;

    T += 0.01;
    const p = lem(T);
    trav.setAttribute('cx', p.x);
    trav.setAttribute('cy', p.y);

    let hit = -1;
    for (let i = 0; i < nodes.length; i++) {
      if (Math.hypot(p.x - nodes[i].x, p.y - nodes[i].y) < 32) { hit = i; break; }
    }

    if (hit !== -1) {
      if (activeNode !== hit) {
        if (fadeOutTimer) clearTimeout(fadeOutTimer);
        if (activeNode !== -1) document.getElementById('lbl' + activeNode).style.opacity = '0';
        activeNode = hit;
        document.getElementById('lbl' + hit).style.opacity = '1';
        ring.setAttribute('cx', nodes[hit].x);
        ring.setAttribute('cy', nodes[hit].y);
        ring.style.opacity = '1';
      }
    } else if (activeNode !== -1) {
      const prev = activeNode; activeNode = -1;
      ring.style.opacity = '0';
      fadeOutTimer = setTimeout(() => { document.getElementById('lbl' + prev).style.opacity = '0'; }, 800);
    }
  })();


  /* ══════════════════════════════════════
     4. SCROLL REVEAL
  ══════════════════════════════════════ */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.reveal-item').forEach((item, i) => {
          setTimeout(() => item.classList.add('reveal-active'), i * 150);
        });
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('#trap, #featured, #about, #testimonials, #agency').forEach(el => revealObserver.observe(el));
})();


/* ══════════════════════════════════════
   5. TESTIMONIAL CARD STACK
══════════════════════════════════════ */
(function initTestimonials() {
  const TESTIMONIALS = [
    { text: "I went from zero to shipping AI-powered features in my app within a weekend. No fluff, no padding — just the exact frameworks I needed.", name: "Aarav Mehta",  role: "Full-stack Developer",     initials: "AM", avatar: "a0" },
    { text: "Bought three other courses before this. Spent $300+ and barely used any of it. This $9 guide did more in 45 minutes than all of them combined.", name: "Sofia Reyes",  role: "Product Manager @ Notion", initials: "SR", avatar: "a1" },
    { text: "The prompt templates alone are worth 10x the price. I use them daily — for client emails, research, and code review. An absolute no-brainer.", name: "James Okafor", role: "Freelance Consultant",       initials: "JO", avatar: "a2" },
    { text: "I was skeptical about yet another AI guide, but this one actually respects your time. Dense, practical, and immediately actionable. Loved it.",  name: "Priya Nair",   role: "UX Designer & Solopreneur", initials: "PN", avatar: "a3" }
  ];

  const wrap    = document.querySelector('.tm-stack-wrap');
  const dotsEl  = document.querySelector('.tm-dots');
  const btnNext = document.getElementById('tm-next');
  const btnPrev = document.getElementById('tm-prev');
  if (!wrap) return;

  const N = TESTIMONIALS.length;
  let order = Array.from({ length: N }, (_, i) => i);
  let cards = [], isDragging = false, startX = 0, currentX = 0, dragCard = null;
  const THROW_THRESHOLD = 90;

  function buildCards() {
    wrap.innerHTML = ''; cards = [];
    TESTIMONIALS.forEach(t => {
      const card = document.createElement('div');
      card.className = 'tm-card';
      card.innerHTML = `<div><span class="tm-quote-mark" aria-hidden="true">"</span><p class="tm-text">${t.text}</p></div><div class="tm-author"><div class="tm-avatar ${t.avatar}" aria-hidden="true">${t.initials}</div><div class="tm-author-info"><span class="tm-author-name">${t.name}</span><span class="tm-author-role">${t.role}</span></div></div>`;
      wrap.appendChild(card); cards.push(card);
    });
    const hint = document.createElement('div');
    hint.className = 'tm-drag-hint'; hint.setAttribute('aria-hidden','true');
    hint.textContent = '← drag to swipe →'; wrap.appendChild(hint);
    positionAll(false); attachDrag();
  }

  function getTransform(sp) {
    return {
      angle:   sp === 0 ? 0 : (sp % 2 === 0 ? -2.5 : 2.5) * sp,
      yOffset: sp * 14,
      xOffset: sp === 0 ? 0 : (sp % 2 === 0 ? -6 : 6) * sp,
      scale:   1 - sp * 0.06,
      zIndex:  N - sp
    };
  }

  function positionAll(animate) {
    order.forEach((ci, sp) => {
      const card = cards[ci];
      if (card.dataset.flying) return;
      const { angle, yOffset, xOffset, scale, zIndex } = getTransform(sp);
      card.style.transition = animate ? 'transform 0.45s cubic-bezier(0.175,0.885,0.32,1.275)' : 'none';
      card.style.transform  = `translateX(${xOffset}px) translateY(${yOffset}px) rotate(${angle}deg) scale(${scale})`;
      card.style.zIndex = zIndex;
      card.classList.toggle('is-top', sp === 0);
    });
    updateDots();
  }

  function updateDots() {
    const top = order[0];
    dotsEl.querySelectorAll('.tm-dot').forEach((d, i) => { d.classList.toggle('active', i === top); });
  }

  let isAnimating = false;

  function dismissTop(dir = 1) {
    if (isAnimating) return; isAnimating = true;
    const ci   = order[0]; const card = cards[ci];
    card.dataset.flying = '1'; card.classList.remove('is-top');
    card.style.transition = 'transform 0.45s cubic-bezier(0.4,0,0.2,1),opacity 0.4s ease';
    card.style.transform  = `translateX(${dir*130}%) translateY(-8%) rotate(${dir*18}deg) scale(0.9)`;
    card.style.opacity = '0'; card.style.zIndex = N + 1;
    order.push(order.shift());
    requestAnimationFrame(() => { positionAll(true); updateDots(); });
    setTimeout(() => {
      delete card.dataset.flying; card.style.transition = 'none';
      const { angle, yOffset, xOffset, scale, zIndex } = getTransform(N - 1);
      card.style.transform = `translateX(${xOffset}px) translateY(${yOffset}px) rotate(${angle}deg) scale(${scale})`;
      card.style.opacity = '1'; card.style.zIndex = zIndex; isAnimating = false;
    }, 460);
  }

  function bringPrev() {
    if (isAnimating) return; isAnimating = true;
    order.unshift(order.pop());
    const card = cards[order[0]];
    card.style.transition = 'none';
    card.style.transform  = `translateX(-130%) translateY(-8%) rotate(-18deg) scale(0.9)`;
    card.style.opacity = '0'; card.style.zIndex = N + 1;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      card.style.transition = 'transform 0.5s cubic-bezier(0.175,0.885,0.32,1.275),opacity 0.4s ease';
      card.style.transform  = `translateY(0px) rotate(0deg) scale(1)`;
      card.style.opacity = '1'; card.classList.add('is-top'); positionAll(true);
      setTimeout(() => { isAnimating = false; }, 520);
    }));
  }

  function attachDrag() {
    function onStart(e) {
      if (isAnimating) return;
      isDragging = true; dragCard = cards[order[0]];
      startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
      currentX = 0; dragCard.style.transition = 'none'; dragCard.style.cursor = 'grabbing';
    }
    function onMove(e) {
      if (!isDragging || !dragCard) return;
      const x = (e.type === 'touchmove' ? e.touches[0].clientX : e.clientX) - startX;
      currentX = x;
      dragCard.style.transform = `translateX(${x}px) translateY(${-Math.abs(x)*0.05}px) rotate(${x*0.06}deg) scale(1)`;
      const hint = wrap.querySelector('.tm-drag-hint');
      if (hint) hint.style.opacity = Math.max(0, 1 - Math.abs(x) / 60);
    }
    function onEnd() {
      if (!isDragging || !dragCard) return;
      isDragging = false; dragCard.style.cursor = 'grab';
      if (Math.abs(currentX) > THROW_THRESHOLD) dismissTop(currentX > 0 ? 1 : -1);
      else { dragCard.style.transition = 'transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275)'; dragCard.style.transform = 'translateY(0px) rotate(0deg) scale(1)'; }
      dragCard = null; currentX = 0;
    }
    cards.forEach(c => { c.addEventListener('mousedown', onStart); c.addEventListener('touchstart', onStart, { passive: true }); });
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('mouseup',   onEnd);
    window.addEventListener('touchend',  onEnd);
  }

  if (btnNext) btnNext.addEventListener('click', () => dismissTop(1));
  if (btnPrev) btnPrev.addEventListener('click', bringPrev);

  TESTIMONIALS.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'tm-dot' + (i === 0 ? ' active' : '');
    dotsEl.appendChild(dot);
  });
  buildCards();
})();


/* ══════════════════════════════════════
   6. NICHE CARD PARTICLES
══════════════════════════════════════ */
(function () {
  document.querySelectorAll('.nc-card').forEach(card => {
    const container = card.querySelector('.nc-particles');
    if (!container) return;
    let interval = null;
    function spawnParticle() {
      const p = document.createElement('div');
      p.className = 'nc-particle';
      const size = Math.random() * 4 + 2, dur = Math.random() * 1.4 + 1.2, delay = Math.random() * 0.4;
      p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;bottom:${Math.random()*30}%;animation-duration:${dur}s;animation-delay:${delay}s;filter:blur(${Math.random()>0.5?1:0}px);`;
      container.appendChild(p);
      setTimeout(() => p.remove(), (dur + delay) * 1000);
    }
    card.addEventListener('mouseenter', () => { spawnParticle(); interval = setInterval(spawnParticle, 220); });
    card.addEventListener('mouseleave', () => { clearInterval(interval); interval = null; });
  });
})();


/* ══════════════════════════════════════
   7. ABOUT — RIPPLE
══════════════════════════════════════ */
(function () {
  const wrap = document.getElementById('abImgWrap');
  const area = document.getElementById('abRipple');
  if (!wrap || !area) return;
  wrap.addEventListener('click', e => {
    const rect = wrap.getBoundingClientRect();
    const r = document.createElement('div');
    r.className = 'ab-ripple';
    const size = 80;
    r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px;`;
    area.appendChild(r);
    setTimeout(() => r.remove(), 700);
  });
})();


/* ══════════════════════════════════════
   8. AGENCY FORM
   Optimised: instant error clearing,
   focus first invalid field, aria-invalid,
   no alert().
══════════════════════════════════════ */
(function () {
  const goalBtns = document.querySelectorAll('.ag-goal-btn');
  let selectedGoal = '';

  goalBtns.forEach(btn => {
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => {
      goalBtns.forEach(b => { b.classList.remove('selected'); b.setAttribute('aria-pressed','false'); });
      btn.classList.add('selected'); btn.setAttribute('aria-pressed','true');
      selectedGoal = btn.dataset.val;
    });
  });

  // Instant error clearing on any input
  ['ag-name','ag-email','ag-phone','ag-niche'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => { el.classList.remove('ag-error'); el.removeAttribute('aria-invalid'); });
  });

  document.getElementById('ag-submit').addEventListener('click', async () => {
    const g = id => document.getElementById(id);
    const name    = g('ag-name').value.trim();
    const email   = g('ag-email').value.trim();
    const phoneNum= g('ag-phone').value.trim();
    const niche   = g('ag-niche').value;
    const biz     = g('ag-biz').value.trim();
    const revenue = g('ag-revenue').value;
    const msg     = g('ag-msg').value.trim();
    const phone   = g('ag-country').value + ' ' + phoneNum;

    let valid = true, firstError = null;
    [{ id:'ag-name',val:name },{ id:'ag-email',val:email },{ id:'ag-phone',val:phoneNum },{ id:'ag-niche',val:niche }].forEach(({ id, val }) => {
      const el = g(id);
      el.classList.remove('ag-error'); el.removeAttribute('aria-invalid');
      if (!val) { el.classList.add('ag-error'); el.setAttribute('aria-invalid','true'); valid = false; if (!firstError) firstError = el; }
    });
    if (!valid) { firstError && firstError.focus(); return; }

    const btn = g('ag-submit'), btnText = g('ag-btn-text');
    btn.disabled = true; btnText.textContent = 'Sending…';

    try {
      const res  = await fetch('https://formsubmit.co/ajax/aaksss0691@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name, email, message: ['Name: '+name,'Business: '+(biz||'Not provided'),'Email: '+email,'Phone: '+phone,'Niche: '+niche,'Goal: '+(selectedGoal||'Not selected'),'Revenue: '+(revenue||'Not provided'),'Message: '+(msg||'No message')].join('\n'), _subject: '🚀 New Skillbyte Agency Inquiry from '+name, _captcha: 'false' })
      });
      const data = await res.json();
      if (data.success === 'true' || data.success === true || res.ok) {
        g('ag-form-body').style.display = 'none';
        const s = g('ag-success'); s.style.display = 'flex'; s.style.flexDirection = 'column'; s.style.alignItems = 'center';
      } else throw new Error();
    } catch {
      btn.disabled = false; btnText.textContent = 'Book My Free Strategy Call →';
      let errEl = document.getElementById('ag-form-error');
      if (!errEl) {
        errEl = document.createElement('p'); errEl.id = 'ag-form-error'; errEl.setAttribute('role','alert');
        errEl.style.cssText = 'color:#f87171;font-size:13px;text-align:center;margin-top:8px;';
        btn.parentNode.insertBefore(errEl, btn.nextSibling);
      }
      errEl.textContent = 'Something went wrong. Please try again or email us directly.';
    }
  });
})();
