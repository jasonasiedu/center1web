(function () {
  const home = document.body.classList.contains('home');
  const mq = matchMedia('(max-width: 800px)');

  /* ---------- phone menu (all pages) ---------- */
  const btn = document.querySelector('.menu-btn');
  const menu = document.getElementById('mobile-menu');
  function setMenu(open) {
    if (!menu || !btn) return;
    menu.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    btn.textContent = open ? 'CLOSE' : 'MENU';
    btn.setAttribute('aria-expanded', open);
  }
  if (btn) btn.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  if (menu) menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ---------- home: scroll-choreographed photo stack ---------- */
  const story = document.querySelector('.story');
  let K = null, tx = 0, ticking = false;
  let text, label, cards;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;

  if (story) {
    text = story.querySelector('.hero-text');
    label = story.querySelector('.label');
    cards = {
      hero: story.querySelector('.c-hero'),
      a: story.querySelector('.c-a'),
      b: story.querySelector('.c-b'),
      c: story.querySelector('.c-c')
    };
  }

  // Scenes: 0 hero | 1 stack | 2 fanned | 3 straight row (Autumn/Fall-Winter edit) | 4 stack again
  function build() {
    const W = innerWidth, H = innerHeight, pad = .029 * W, gap = .012 * W;
    const col = (W - 2 * pad - 11 * gap) / 12;
    const hw = 3 * col + 2 * gap, hh = hw * 4 / 3;
    const hx = W / 2 - pad - hw / 2, hy = .205 * H + hh / 2 - H / 2;   // hero photo, top-right
    const sh = .66 * H, sw = .75 * sh;                                  // stack size
    const fh = Math.min(.32 * W, .6 * H), fw = .75 * fh, fx = Math.max(.28 * W, fw * 1.12); // fan
    const top = 108, bottom = .95 * H;                                  // full-screen row
    const h3 = bottom - top, w3 = (W - 2 * pad - 2 * gap) / 3, y3 = (top + bottom) / 2 - H / 2, x3 = w3 + gap;
    const st = (x, y, w, h, r, o = 1) => ({ x, y, w, h, r, o });
    const hid = st(hx, hy, hw, hh, 0, 0);                               // hidden behind the hero photo
    const away = st(.06 * W, -1.15 * H, sw, sh, -16);                   // hero photo flicked off the top
    K = {
      hero: [st(hx, hy, hw, hh, 0), st(0, 0, sw, sh, -2), away, away, away],
      a: [hid, st(-.012 * W, 0, sw, sh, -9), st(-fx, .02 * H, fw, fh, -9), st(-x3, y3, w3, h3, 0), st(-.012 * W, 0, sw, sh, -10)],
      b: [hid, st(.012 * W, .012 * H, sw, sh, 6), st(0, -.02 * H, fw, fh, 13), st(0, y3, w3, h3, 0), st(0, 0, sw, sh, -3)],
      c: [hid, st(0, .01 * H, sw, sh, 13), st(fx, .03 * H, fw, fh, 7), st(x3, y3, w3, h3, 0), st(.015 * W, .005 * H, sw, sh, 10)]
    };
    tx = -(text.offsetLeft + text.offsetWidth + 30);                    // text exits off the left edge
  }

  function apply() {
    ticking = false;
    if (!story || mq.matches || !K) return;
    const H = innerHeight;
    const s = clamp(-story.getBoundingClientRect().top / H, 0, 4);
    const i = Math.min(Math.floor(s), 3), t = ease(s - i);
    for (const k in cards) {
      const a = K[k][i], b = K[k][i + 1], n = cards[k];
      n.style.width = lerp(a.w, b.w, t) + 'px';
      n.style.height = lerp(a.h, b.h, t) + 'px';
      n.style.opacity = lerp(a.o, b.o, t);
      n.style.transform = `translate(calc(-50% + ${lerp(a.x, b.x, t)}px), calc(-50% + ${lerp(a.y, b.y, t)}px)) rotate(${lerp(a.r, b.r, t)}deg)`;
    }
    text.style.transform = `translateX(${tx * ease(clamp(s))}px)`;
    label.style.opacity = clamp((s - 1.6) / .4) * (1 - clamp((s - 3.2) / .6));
  }

  function clearInline() {
    [text, label, ...Object.values(cards)].forEach(n => n.removeAttribute('style'));
  }
  function refresh() {
    if (mq.matches) { clearInline(); return; }
    build(); apply();
  }

  if (story) {
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }, { passive: true });
    addEventListener('resize', refresh);
    mq.addEventListener('change', refresh);
    refresh();
  }

  /* ---------- home navigation: DISCOVER / HOME / logo -> top, NEW IN -> the edit ---------- */
  function goTo(where, instant) {
    const behavior = instant ? 'instant' : 'smooth';
    if (where === 'top') { scrollTo({ top: 0, behavior }); return; }
    if (mq.matches) {
      const l = document.getElementById('autumn-label');
      scrollTo({ top: l.getBoundingClientRect().top + scrollY - 88, behavior });
    } else {
      scrollTo({ top: story.getBoundingClientRect().top + scrollY + 3 * innerHeight, behavior });
    }
  }
  if (home) {
    document.querySelectorAll('a[href="/"], a[href="/#top"], a[href="/#autumn"]').forEach(a =>
      a.addEventListener('click', e => {
        e.preventDefault();
        setMenu(false);
        goTo(a.getAttribute('href') === '/#autumn' ? 'autumn' : 'top');
      }));
    // arriving from another page via /#autumn
    if (location.hash === '#autumn') addEventListener('load', () => goTo('autumn', true));
  }

  /* ---------- newsletter: don't submit until a real endpoint replaces YOUR_FORM_ID ---------- */
  document.querySelectorAll('.f-news').forEach(form => form.addEventListener('submit', e => {
    if (form.action.includes('YOUR_')) {
      e.preventDefault();
      form.querySelector('.f-status').textContent = 'NEWSLETTER NOT CONNECTED YET';
    }
  }));

  /* ---------- dev aid: press G for the 12-column grid overlay ---------- */
  const g = document.createElement('div');
  g.className = 'grid-overlay';
  g.innerHTML = '<i></i>'.repeat(12);
  document.body.appendChild(g);
  addEventListener('keydown', e => { if (e.key.toLowerCase() === 'g') g.classList.toggle('on'); });
})();
