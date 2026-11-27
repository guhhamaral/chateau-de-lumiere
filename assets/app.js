/* Château de Lumière · comportamento do site (prévia Closify) */
(() => {
  const d = document, W = window;
  const WA = '5519994112741';
  W.dataLayer = W.dataLayer || [];
  const track = (event, p = {}) => W.dataLayer.push({ event, ...p });
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const lenis = () => W.__lenis || null;

  /* ---------- cabeçalho: some ao descer, volta ao subir ---------- */
  const hd = d.querySelector('.hd'), mb = d.querySelector('.mb'), wa = d.querySelector('.wa-d'), lx = d.querySelector('.lx'), ft = d.querySelector('.ft');
  const fsEls = [...d.querySelectorAll('.tv-stage, .dy')];
  let lastY = W.scrollY;
  const onScroll = () => {
    const y = W.scrollY, down = y > lastY;
    let heroEnd = innerHeight;
    if (hd && lx) {
      const sp = lx.parentElement.classList.contains('pin-spacer') ? lx.parentElement : lx;
      heroEnd = sp.offsetTop + sp.offsetHeight;
      hd.classList.toggle('on-dark', y < heroEnd - hd.offsetHeight);
    }
    if (hd && !d.body.classList.contains('menu-open')) {
      const hide = down && y > 220;
      hd.classList.toggle('up', hide);
      d.body.classList.toggle('hd-shown', !hide);
    }
    const past = y > heroEnd * .7;
    // botões flutuantes saem de cena sobre as telas cheias (tirolesa e "um dia") e sobre o rodapé
    const full = fsEls.some(el => { const r = el.getBoundingClientRect(); return r.top < innerHeight * .5 && r.bottom > innerHeight * .5; });
    if (mb) mb.classList.toggle('show', past && !full);
    if (wa) wa.classList.toggle('show', past && !full && !(ft && ft.getBoundingClientRect().top < innerHeight - 40));
    lastY = y;
  };
  d.body.classList.add('hd-shown');
  W.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- menu em tela cheia ---------- */
  const mbtn = d.querySelector('.menu-btn'), mn = d.getElementById('mn');
  if (mbtn && mn) {
    const imgs = [...mn.querySelectorAll('.mn-r img')];
    let loaded = false;
    const open = () => {
      if (!loaded) { imgs.forEach(im => { im.src = im.dataset.src; }); loaded = true; }
      mn.classList.add('open'); mn.setAttribute('aria-hidden', 'false'); mbtn.setAttribute('aria-expanded', 'true');
      d.body.classList.add('menu-open'); d.body.style.overflow = 'hidden'; lenis() && lenis().stop();
      setTimeout(() => mn.querySelector('.mn-close').focus(), 80);
    };
    const close = () => {
      mn.classList.remove('open'); mn.setAttribute('aria-hidden', 'true'); mbtn.setAttribute('aria-expanded', 'false');
      d.body.classList.remove('menu-open'); d.body.style.overflow = ''; lenis() && lenis().start(); mbtn.focus();
    };
    mbtn.addEventListener('click', open);
    mn.querySelector('.mn-close').addEventListener('click', close);
    mn.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        const f = [...mn.querySelectorAll('a, button')].filter(x => x.offsetParent !== null);
        if (e.shiftKey && d.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && d.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    mn.querySelectorAll('.mn-list a').forEach((a, k) => {
      const on = () => imgs.forEach((im, j) => im.classList.toggle('on', j === k));
      a.addEventListener('pointerenter', on); a.addEventListener('focus', on);
    });
    if (imgs[0]) imgs[0].classList.add('on');
  }

  /* ---------- cliques de conversão ---------- */
  d.addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a) return;
    const loc = a.dataset.loc || 'site';
    if (a.href.includes('wa.me')) track('whatsapp_click', { cta_location: loc });
    else if (a.href.startsWith('tel:')) track('phone_click', { cta_location: loc });
    else if (a.dataset.cta) track('cta_click', { cta_label: a.dataset.cta, cta_location: loc });
  });

  /* ---------- formulário de visita (3 etapas) ---------- */
  d.querySelectorAll('form.fm').forEach(f => {
    const steps = [...f.querySelectorAll('.fm-step')];
    const prog = f.querySelector('.fm-prog'), err = f.querySelector('.fm-err');
    const back = f.querySelector('[data-back]'), next = f.querySelector('[data-next]'), send = f.querySelector('[data-send]');
    const empresa = f.querySelector('[data-empresa]');
    let i = 0;
    if (f.dataset.tipo) { const r = f.querySelector(`input[name="tipo"][value="${f.dataset.tipo}"]`); if (r) r.checked = true; }
    const val = n => (f.querySelector(`[name="${n}"]:checked`) || f.elements[n] || {}).value || '';
    const show = () => {
      steps.forEach((s, k) => { s.hidden = k !== i; });
      prog.querySelector('b').textContent = i + 1;
      prog.querySelector('.bar i').style.width = ((i + 1) / steps.length * 100) + '%';
      back.hidden = i === 0; next.hidden = i === steps.length - 1; send.hidden = i !== steps.length - 1;
      if (empresa) empresa.hidden = val('tipo') !== 'Corporativo';
      err.textContent = '';
    };
    const fail = (msg, el) => { err.textContent = msg; if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); } return false; };
    const ok = () => {
      f.querySelectorAll('[aria-invalid]').forEach(x => x.removeAttribute('aria-invalid'));
      if (i === 0 && !val('tipo')) return fail('Escolha o tipo de celebração para continuar.', f.querySelector('input[name="tipo"]'));
      if (i === 1) {
        if (!f.elements.mes.value && !f.elements.semdata.checked) return fail('Informe o mês desejado ou marque "Ainda não definimos".', f.elements.mes);
        if (!val('convidados')) return fail('Escolha uma faixa de convidados.', f.querySelector('input[name="convidados"]'));
      }
      if (i === 2) {
        const n = f.elements.nome, w = f.elements.whats, c = f.elements.lgpd;
        if (n.value.trim().length < 2) return fail('Digite seu nome.', n);
        const dg = w.value.replace(/\D/g, '');
        if (dg.length < 10 || dg.length > 11) return fail('Digite um WhatsApp válido, com DDD.', w);
        if (!c.checked) return fail('Para continuar, autorize o contato conforme a política de privacidade.', c);
      }
      return true;
    };
    f.addEventListener('change', () => { if (empresa) empresa.hidden = val('tipo') !== 'Corporativo'; });
    next.addEventListener('click', () => { if (ok()) { i++; show(); track('form_step', { step: i + 1 }); steps[i].querySelector('legend').focus(); } });
    back.addEventListener('click', () => { i--; show(); steps[i].querySelector('legend').focus(); });
    const wf = f.elements.whats;
    wf.addEventListener('input', () => {
      let v = wf.value.replace(/\D/g, '').slice(0, 11);
      if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, v.length - 4)}-${v.slice(-4)}`;
      else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
      wf.value = v;
    });
    f.addEventListener('submit', e => {
      e.preventDefault();
      if (!ok()) return;
      const mes = f.elements.semdata.checked || !f.elements.mes.value ? 'ainda não definida'
        : new Date(f.elements.mes.value + '-02T12:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      const emp = f.elements.empresa && f.elements.empresa.value.trim() ? ` (${f.elements.empresa.value.trim()})` : '';
      const msg = `Olá! Vim pelo site do Château de Lumière e quero agendar uma visita.\n• Evento: ${val('tipo')}${emp}\n• Data desejada: ${mes}\n• Convidados: ${val('convidados')}\n• Nome: ${f.elements.nome.value.trim()}`;
      const url = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
      track('lead_submit', { event_type: val('tipo'), guests_range: val('convidados'), event_month: f.elements.mes.value || 'indefinido' });
      f.querySelector('.fm-body').hidden = true;
      const done = f.querySelector('.fm-ok'); done.hidden = false;
      done.querySelector('a').href = url; done.querySelector('.fm-ok-t').focus();
      W.open(url, '_blank', 'noopener');
    });
    show();
  });

  /* ---------- galeria com filtros ---------- */
  const groups = [];
  const gal = d.querySelector('[data-gallery]');
  if (gal) {
    const items = [...gal.querySelectorAll('.gi')], fbtns = d.querySelectorAll('.flt button'), more = d.querySelector('[data-more]');
    let lim = 24, cat = 'todas';
    const match = it => cat === 'todas' || it.dataset.cat.split(' ').includes(cat);
    const apply = () => {
      let n = 0;
      items.forEach(it => { const m = match(it); it.hidden = !(m && n++ < lim); if (!it.hidden) it.querySelector('.ri')?.classList.add('in'); });
      if (more) more.hidden = items.filter(match).length <= lim;
      W.ScrollTrigger && W.ScrollTrigger.refresh();
    };
    fbtns.forEach(b => b.addEventListener('click', () => {
      fbtns.forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true');
      cat = b.dataset.f; lim = 24; apply();
    }));
    if (more) more.querySelector('button').addEventListener('click', () => { lim += 24; apply(); });
    apply();
    groups.push({ all: items, list: () => items.filter(it => !it.hidden) });
  }
  d.querySelectorAll('[data-lbx]').forEach(g => { const its = [...g.querySelectorAll('.ag-i, .tv-ph')]; groups.push({ all: its, list: () => its }); });

  /* ---------- foto ampliada: abre a partir da miniatura e aproxima ao clicar ---------- */
  const lb = d.getElementById('lbx');
  if (lb && groups.length) {
    const fig = lb.querySelector('.lbx-fig'), im = fig.querySelector('img');
    const still = W.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hint = lb.querySelector('[data-hint]');
    if (hint && W.matchMedia('(hover: none)').matches) hint.textContent = 'Toque na foto para aproximar';
    const c01 = v => Math.min(1, Math.max(0, v));
    let grp = null, cur = 0, opener = null, zoom = false, base = null, moved = false, down = false, x0 = 0, y0 = 0;
    const aimAt = e => { if (!base) return; im.style.transformOrigin = `${(c01((e.clientX - base.left) / base.width) * 100).toFixed(1)}% ${(c01((e.clientY - base.top) / base.height) * 100).toFixed(1)}%`; };
    const setZoom = (on, e) => { if (on) { base = im.getBoundingClientRect(); aimAt(e); } zoom = on; fig.classList.toggle('zoom', on); };
    const show = (it, flip) => {
      if (zoom) setZoom(false);
      const th = it.querySelector('img');
      im.style.transformOrigin = '';
      im.alt = it.dataset.alt; im.width = +it.dataset.w; im.height = +it.dataset.h;
      im.src = (th && (th.currentSrc || th.src)) || it.dataset.lg;
      const hi = new Image(); hi.src = it.dataset.lg;
      (hi.decode ? hi.decode() : Promise.resolve()).then(() => { if (grp.list()[cur] === it) im.src = it.dataset.lg; }).catch(() => {});
      lb.querySelector('[data-c]').textContent = it.dataset.c || it.dataset.alt;
      lb.querySelector('[data-cred]').textContent = 'Fotografia: ' + it.dataset.cred;
      lb.querySelector('[data-n]').textContent = `${cur + 1} de ${grp.list().length}`;
      if (still || !im.animate) return;
      if (flip && th) requestAnimationFrame(() => {
        const a = th.getBoundingClientRect(), b = im.getBoundingClientRect(); if (!b.width) return;
        const sc = a.width / b.width, dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height / 2 - (b.top + b.height / 2);
        im.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${sc})`, opacity: .6 }, { transform: 'none', opacity: 1 }], { duration: 720, easing: 'cubic-bezier(.16, 1, .3, 1)' });
      });
      else im.animate([{ opacity: 0, transform: 'scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'ease-out' });
    };
    const open = (g, it) => { grp = g; cur = g.list().indexOf(it); opener = it; lb.showModal(); show(it, true); lenis() && lenis().stop(); track('gallery_open', { foto_id: it.dataset.id }); history.replaceState(null, '', '?foto=' + it.dataset.id); };
    const step = s => { const list = grp.list(), n = list.length; cur = (cur + s + n) % n; show(list[cur], false); history.replaceState(null, '', '?foto=' + list[cur].dataset.id); };
    groups.forEach(g => g.all.forEach(it => it.addEventListener('click', () => open(g, it))));
    lb.querySelector('[data-prev]').addEventListener('click', () => step(-1));
    lb.querySelector('[data-next]').addEventListener('click', () => step(1));
    lb.querySelector('[data-close]').addEventListener('click', () => lb.close());
    lb.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });
    im.addEventListener('pointerdown', e => { down = true; moved = false; x0 = e.clientX; y0 = e.clientY; });
    im.addEventListener('pointermove', e => { if (Math.hypot(e.clientX - x0, e.clientY - y0) > 8) moved = true; if (zoom && (e.pointerType === 'mouse' || down)) aimAt(e); });
    im.addEventListener('pointerup', e => { down = false; if (!zoom && moved && e.pointerType !== 'mouse') { const dx = e.clientX - x0; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); } });
    im.addEventListener('click', e => { if (moved) return; setZoom(!zoom, e); });
    lb.addEventListener('close', () => { if (zoom) setZoom(false); history.replaceState(null, '', location.pathname); lenis() && lenis().start(); if (opener) opener.focus(); });
    const qf = new URLSearchParams(location.search).get('foto');
    if (qf) groups.some(g => { const it = g.all.find(x => x.dataset.id === qf); if (it) { it.hidden = false; open(g, it); return true; } return false; });
  }

  /* ---------- mapa só quando a pessoa pede ---------- */
  d.querySelectorAll('[data-map]').forEach(b => b.addEventListener('click', () => {
    b.closest('.map-box').insertAdjacentHTML('beforeend', '<iframe title="Mapa do Château de Lumière, em Elias Fausto, SP" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=-23.0857459,-47.3761&z=15&output=embed"></iframe>');
    b.remove(); track('map_open');
  }));
  d.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Endereço copiado'; } catch (e) {}
  }));

  /* ---------- cookies ---------- */
  const ck = d.querySelector('.ck');
  if (ck && !store.get('chateau-consent')) {
    setTimeout(() => { ck.hidden = false; }, 2600);
    ck.querySelectorAll('[data-consent]').forEach(b => b.addEventListener('click', () => { store.set('chateau-consent', b.dataset.consent); ck.hidden = true; }));
  }

  d.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
