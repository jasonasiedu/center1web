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

  /* ---------- home: scroll-choreographed photo stack, with a clickable look viewer ---------- */
  const story = document.querySelector('.story');
  let K = null, V = null, tx = 0, ticking = false, S = 0;
  let swapping = false, itemsOpen = false, viewer = false, viewerS = 0;
  let stage, text, label, items, cards, sides;
  // which look photo sits in which viewer slot (a = look 01, b = look 02, c = look 03)
  const slots = { a: 'main', b: 'right1', c: 'right2' };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;

  if (story) {
    stage = story.querySelector('.stage');
    text = story.querySelector('.hero-text');
    label = story.querySelector('.label');
    items = story.querySelector('.look-items');
    sides = [...story.querySelectorAll('.side-title')];
    cards = {
      hero: story.querySelector('.c-hero'),
      a: story.querySelector('.c-a'),
      b: story.querySelector('.c-b'),
      c: story.querySelector('.c-c')
    };
  }

  const mainKey = () => Object.keys(slots).find(k => slots[k] === 'main');
  function updateLook() {
    items.querySelectorAll('.items').forEach(ul => ul.classList.toggle('on', ul.dataset.for === mainKey()));
    for (const k in cards) cards[k].classList.toggle('is-main', viewer && k === mainKey());
  }
  function setOpen(v) { itemsOpen = v; items.classList.toggle('open', v); }
  function animateMove() {          // smooth tween for a click-driven move
    swapping = true;
    stage.classList.add('swapping');
    setTimeout(() => { stage.classList.remove('swapping'); swapping = false; }, 800);
  }

  // Scenes: 0 hero | 1 stack | 2 fanned | 3 straight full-screen row | 4 stack again (leaving, same as entering).
  // Click a look from scene 2 on (even mid-way) and it jumps to the viewer: that look large, its items shown.
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

    // look viewer geometry
    const vTop = .129 * H;
    const hL = Math.min(.688 * H, .307 * W / .75), wL = .75 * hL;       // large look photo
    const th = Math.min(.307 * W, .62 * H), tw = .75 * th;              // tilted look photos
    V = {
      main: st(pad + wL / 2 - W / 2, vTop + hL / 2 - H / 2, wL, hL, 0),
      right1: st(.897 * W - W / 2, .38 * H - H / 2, tw, th, 22),
      right2: st(.914 * W - W / 2, .70 * H - H / 2, tw, th, 26)
    };

    // item names + descriptions + image slots column
    const nameX = pad + wL + .0108 * W, thumbW = .148 * W, thumbX = Math.max(.506 * W, nameX + .15 * W);
    const gapT = .01 * W, introH = .09 * hL, slotH = (hL - introH - 2 * gapT) / 2;
    Object.assign(items.style, { left: nameX + 'px', top: vTop + 'px', width: (thumbX + thumbW - nameX) + 'px', height: hL + 'px' });
    items.style.setProperty('--thumb-w', thumbW + 'px');
    items.style.setProperty('--slot-h', slotH + 'px');
    items.style.setProperty('--intro-h', introH + 'px');
    items.style.setProperty('--slot-gap', gapT + 'px');

    tx = -(text.offsetLeft + text.offsetWidth + 30);                    // text exits off the left edge
    updateLook();
  }

  function enterViewer(k) {
    const others = ['a', 'b', 'c'].filter(j => j !== k);
    slots[k] = 'main'; slots[others[0]] = 'right1'; slots[others[1]] = 'right2';
    viewer = true; viewerS = S;
    animateMove(); updateLook(); setOpen(true); apply();
  }
  function exitViewer() {
    viewer = false;
    animateMove(); setOpen(false); updateLook();
  }

  function apply() {
    ticking = false;
    if (!story || mq.matches || !K) return;
    const H = innerHeight;
    const s = clamp(-story.getBoundingClientRect().top / H, 0, 4);
    S = s;
    if (viewer && s < viewerS - .15) exitViewer();                      // scrolled back up: leave the viewer
    const i = Math.min(Math.floor(s), 3), t = ease(s - i);
    const z = { main: 2, right1: 3, right2: 4 };
    for (const k in cards) {
      const n = cards[k];
      let x, y, w, h, r, o;
      if (viewer && k !== 'hero' && s <= 3) ({ x, y, w, h, r, o } = V[slots[k]]);
      else {
        // leaving the looks (scene 3 -> 4): start from whatever the frame looks like (row or viewer)
        const a = (viewer && k !== 'hero' && i === 3) ? V[slots[k]] : K[k][i], b = K[k][i + 1];
        x = lerp(a.x, b.x, t); y = lerp(a.y, b.y, t); w = lerp(a.w, b.w, t);
        h = lerp(a.h, b.h, t); r = lerp(a.r, b.r, t); o = lerp(a.o, b.o, t);
      }
      n.style.width = w + 'px';
      n.style.height = h + 'px';
      n.style.opacity = o;
      n.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${r}deg)`;
      if (k !== 'hero') n.style.zIndex = viewer && s < 3.5 ? z[slots[k]] : '';
    }
    text.style.transform = `translateX(${tx * ease(clamp(s))}px)`;
    label.style.opacity = viewer ? 0 : clamp((s - 1.6) / .4) * (1 - clamp((s - 2.5) / .4));
    const sv = clamp((s - .6) / .4) * (1 - clamp((s - 1.05) / .35)) + clamp((s - 3.6) / .4);   // side titles: while stacked (entering and leaving)
    sides.forEach(n => { n.style.opacity = sv; });
    items.style.opacity = 1 - clamp((s - 3) / .3);                      // items fade as the stack re-forms
    stage.classList.toggle('clickable', s >= 1.7 && s <= 3.2);
    stage.classList.toggle('viewer', viewer);
  }

  function clearInline() {
    [text, label, items, ...sides, ...Object.values(cards)].forEach(n => n.removeAttribute('style'));
    stage.classList.remove('clickable', 'viewer', 'swapping');
    viewer = false; setOpen(false); updateLook();
  }
  function refresh() {
    if (mq.matches) { clearInline(); return; }
    build(); apply();
  }

  if (story) {
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }, { passive: true });
    addEventListener('resize', refresh);
    mq.addEventListener('change', refresh);

    // click a look (from the fan onward): it becomes the large look and its items appear.
    // In the viewer: a tilted look swaps in; the large look shows/hides its items.
    ['a', 'b', 'c'].forEach(k => cards[k].addEventListener('click', () => {
      if (mq.matches || swapping) return;
      if (!viewer) { if (S >= 1.7) enterViewer(k); return; }
      if (slots[k] === 'main') { setOpen(!itemsOpen); return; }
      const m = mainKey();
      [slots[k], slots[m]] = [slots[m], slots[k]];
      animateMove(); updateLook(); setOpen(true); apply();
    }));
    refresh();
  }

  /* ---------- home navigation: DISCOVER / HOME / logo -> top, NEW IN -> the full-screen looks ---------- */
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
})();
