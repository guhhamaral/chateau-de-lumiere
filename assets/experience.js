/* Château de Lumière · camada de experiência (prévia Closify) */
(() => {
  const d = document, W = window, H = d.documentElement;
  const reduce = W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = W.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const ss = {
    get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del: k => { try { sessionStorage.removeItem(k); } catch (e) {} }
  };
  const hasG = !!(W.gsap && W.ScrollTrigger);
  H.classList.add('js');
  if (reduce || !hasG) H.classList.add('no-motion');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ramp = (a, b, x) => clamp((x - a) / (b - a), 0, 1);
  const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

  /* ---------- títulos divididos em palavras ---------- */
  d.querySelectorAll('.sw').forEach(el => {
    let i = 0;
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = d.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(d.createTextNode(part)); return; }
          const w = d.createElement('span'); w.className = 'w';
          const s = d.createElement('span'); s.textContent = part; s.style.setProperty('--i', i++);
          w.appendChild(s); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(el);
  });

  /* ---------- revelações ao entrar na tela ---------- */
  const heroEls = [...d.querySelectorAll('[data-hero] .sw, [data-hero] .rv, [data-hero] .ri')];
  const io = 'IntersectionObserver' in W ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px', threshold: .08 }) : null;
  // .ri usa clip-path: o observador não enxerga um elemento 100% recortado, então observamos a moldura
  const riMap = new Map();
  const io2 = 'IntersectionObserver' in W ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { (riMap.get(e.target) || []).forEach(r => r.classList.add('in')); io2.unobserve(e.target); }
  }), { rootMargin: '0px 0px -6% 0px', threshold: .05 }) : null;
  d.querySelectorAll('.rv, .sw').forEach(el => {
    if (heroEls.includes(el)) return;
    if (io && !reduce) io.observe(el); else el.classList.add('in');
  });
  d.querySelectorAll('.ri').forEach(el => {
    if (heroEls.includes(el)) return;
    const host = el.parentElement;
    if (io2 && !reduce) { if (!riMap.has(host)) { riMap.set(host, []); io2.observe(host); } riMap.get(host).push(el); }
    else el.classList.add('in');
  });
  const startHero = () => heroEls.forEach((el, k) => setTimeout(() => el.classList.add('in'), k * 90));

  /* ---------- cortina entre páginas ---------- */
  const pt = d.querySelector('.pt');
  if (pt) {
    if (H.classList.contains('pt-in')) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        H.classList.remove('pt-in'); pt.classList.add('out'); ss.del('pt');
        setTimeout(() => pt.classList.remove('out'), 1100);
      }));
    }
    if (!reduce) d.addEventListener('click', e => {
      const a = e.target.closest('a');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
      const href = a.getAttribute('href') || '';
      if (!/\.html(\?|#|$)/.test(href) || /^https?:/.test(href)) return;
      const here = location.pathname.split('/').pop() || 'index.html';
      if (href.split('#')[0] === here && href.includes('#')) return;
      e.preventDefault(); ss.set('pt', '1'); pt.classList.add('leave');
      setTimeout(() => { location.href = href; }, 720);
    });
    W.addEventListener('pageshow', ev => { if (ev.persisted) pt.classList.remove('leave'); });
  }

  /* ---------- rolagem suave ---------- */
  let lenis = null;
  if (hasG && !reduce && W.Lenis) {
    lenis = new W.Lenis({ lerp: .085, wheelMultiplier: .9, smoothTouch: false });
    W.__lenis = lenis;
    lenis.on('scroll', W.ScrollTrigger.update);
    W.gsap.ticker.add(t => lenis.raf(t * 1000));
    W.gsap.ticker.lagSmoothing(0);
    d.addEventListener('click', e => {
      const a = e.target.closest('a[href*="#"]'); if (!a) return;
      const [path, hash] = a.getAttribute('href').split('#');
      const here = location.pathname.split('/').pop() || 'index.html';
      if ((path && path !== here) || !hash) return;
      const tg = d.getElementById(hash); if (!tg) return;
      e.preventDefault(); lenis.scrollTo(tg, { offset: -40, duration: 1.6 });
    });
  }

  /* ---------- topo "Lumière": a luz segue o cursor e revela a cena ---------- */
  const lx = d.querySelector('.lx');
  let heroScroll = null;
  if (lx) {
    const st = lx.querySelector('.lx-stage'), ui = lx.querySelector('.lx-ui');
    const big = () => Math.hypot(innerWidth, innerHeight) * 1.15;
    const base = () => Math.max(innerWidth, innerHeight) * (fine ? .2 : .34);
    let mx = .5, my = .5, tx = .5, ty = .5, r = 0, rT = 0, scrollR = 0, lit = false, last = 0, idle = true, run = true;
    const t0 = performance.now();
    const setV = () => {
      st.style.setProperty('--mx', (mx * 100).toFixed(2) + '%');
      st.style.setProperty('--my', (my * 100).toFixed(2) + '%');
      st.style.setProperty('--r', r.toFixed(1) + 'px');
    };
    const lightsOn = () => { if (lit) return; lit = true; lx.classList.add('on'); };
    const aim = e => {
      const b = lx.getBoundingClientRect();
      tx = (e.clientX - b.left) / b.width; ty = (e.clientY - b.top) / b.height; idle = false; last = performance.now();
    };
    lx.addEventListener('pointermove', aim);
    lx.addEventListener('pointerdown', aim);
    const hint = lx.querySelector('.lx-hint');
    if (hint && !fine) hint.lastChild.textContent = 'Toque na foto e ilumine a Tenda Monreale';
    lx.querySelectorAll('[data-lights]').forEach(b => b.addEventListener('click', lightsOn));
    const loop = now => {
      if (!run) return;
      const t = (now - t0) / 1000;
      if (!lit && (idle || now - last > 2600)) { idle = true; tx = .5 + .27 * Math.sin(t * .3); ty = .52 + .15 * Math.sin(t * .47 + 1); }
      mx += (tx - mx) * .075; my += (ty - my) * .075;
      const target = lit ? big() : Math.max(rT, scrollR);
      r += (target - r) * (lit ? .05 : .08);
      setV();
      requestAnimationFrame(loop);
    };
    if (reduce) {
      lit = true; lx.classList.add('on', 'ready'); r = big(); setV(); startHero();
    } else {
      setV();
      setTimeout(() => { rT = base() * .22; }, 380);                       // a chama acende
      setTimeout(() => { rT = base(); lx.classList.add('ready'); startHero(); }, 1150);
      requestAnimationFrame(loop);
      if ('IntersectionObserver' in W) new IntersectionObserver(es => {
        const v = es[0].isIntersecting;
        if (v && !run) { run = true; requestAnimationFrame(loop); } else if (!v) run = false;
      }).observe(lx);
      heroScroll = p => {
        scrollR = p < .04 ? 0 : base() + (big() - base()) * ease(ramp(.04, .78, p));
        if (p > .78) lightsOn();
        ui.style.opacity = (1 - ramp(.45, .92, p)).toFixed(3);
        ui.style.transform = `translateY(${(-p * 70).toFixed(1)}px)`;
        st.style.setProperty('--s', (1.1 - .1 * p).toFixed(4));
      };
      if (!hasG) W.addEventListener('scroll', () => { if (W.scrollY > 40) lightsOn(); }, { passive: true });
    }
  } else {
    setTimeout(startHero, H.classList.contains('pt-in') ? 450 : 80);
  }

  /* ---------- contagem da nota ---------- */
  d.querySelectorAll('[data-count-to]').forEach(el => {
    if (!('IntersectionObserver' in W)) return;
    const ob = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return; ob.disconnect();
      const to = parseFloat(el.dataset.countTo), t0 = performance.now(), dur = reduce ? 0 : 1600;
      const step = now => { const k = dur ? Math.min(1, (now - t0) / dur) : 1, e = 1 - Math.pow(1 - k, 3); el.textContent = (to * e).toFixed(1).replace('.', ','); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }, { threshold: .6 });
    ob.observe(el);
  });

  /* ---------- depoimentos: troca automática com barras de progresso ---------- */
  d.querySelectorAll('.qt').forEach(q => {
    const items = [...q.querySelectorAll('blockquote')], bars = [...q.querySelectorAll('.qt-bars button')];
    if (items.length < 2) return;
    const DUR = 7000; q.style.setProperty('--qt-dur', DUR / 1000 + 's');
    let k = 0, timer = null, left = DUR, ts = 0, paused = false, started = false;
    const paint = () => {
      items.forEach((it, j) => { it.classList.toggle('on', j === k); it.setAttribute('aria-hidden', j === k ? 'false' : 'true'); });
      bars.forEach((b, j) => { b.classList.remove('on'); b.classList.toggle('done', j < k); });
      void q.offsetWidth;                       // reinicia a animação da barra
      if (bars[k]) bars[k].classList.add('on');
    };
    const schedule = ms => { clearTimeout(timer); if (reduce) return; ts = performance.now(); left = ms; timer = setTimeout(() => show(k + 1), ms); };
    const show = n => { k = (n + items.length) % items.length; paint(); schedule(DUR); };
    q.querySelector('[data-qp]').addEventListener('click', () => show(k - 1));
    q.querySelector('[data-qx]').addEventListener('click', () => show(k + 1));
    bars.forEach((b, j) => b.addEventListener('click', () => show(j)));
    q.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse' || !started) return; paused = true; q.classList.add('paused'); clearTimeout(timer); left -= performance.now() - ts; });
    q.addEventListener('pointerleave', () => { if (!paused) return; paused = false; q.classList.remove('paused'); schedule(Math.max(400, left)); });
    if ('IntersectionObserver' in W) {
      const ob = new IntersectionObserver(es => { if (es[0].isIntersecting && !started) { started = true; ob.disconnect(); show(0); } }, { threshold: .3 });
      ob.observe(q);
    } else { started = true; show(0); }
  });

  if (!hasG || reduce) return;
  const { gsap, ScrollTrigger: ST } = W;
  gsap.registerPlugin(ST);

  /* ---------- rolar acende as luzes do topo ---------- */
  if (lx && heroScroll) ST.create({ trigger: lx, start: 'top top', end: '+=85%', pin: true, scrub: true, onUpdate: s => heroScroll(s.progress) });

  /* ---------- parallax nas fotos ---------- */
  d.querySelectorAll('.fig[data-px] .px').forEach(px => gsap.fromTo(px, { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: px.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
  d.querySelectorAll('[data-speed]').forEach(el => gsap.fromTo(el, { y: () => +el.dataset.speed * 90 }, { y: () => -el.dataset.speed * 90, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } }));

  /* ---------- a travessia: tirolesa em primeira pessoa (as fotos de cada lugar passam por você) ---------- */
  const tv = d.querySelector('.tv-stage');
  if (tv) {
    const q = s => tv.querySelector(s), qa = s => [...tv.querySelectorAll(s)];
    const cam = q('.tv-cam'), world = q('.tv-world'), bgs = qa('.tv-bg'), dust = qa('.tv-dust i');
    const goEl = q('.tv-go'), nowEl = q('.tv-now'), bar = q('.tv-prog > i'), ticks = qa('.tv-prog button'), snd = q('.tv-snd');
    const items = qa('.tv-it').map(el => ({
      el, z: +el.dataset.z, x: +(el.dataset.x || 0), y: +(el.dataset.y || 0), xm: +(el.dataset.xm || el.dataset.x || 0), ym: +(el.dataset.ym || el.dataset.y || 0),
      img: el.querySelector('img'), v: null, b: 0
    }));
    const chWrap = q('.tv-chs'), chEls = qa('.tv-ch'), titles = chEls.filter(c => !c.classList.contains('tv-fim')), fimEl = q('.tv-fim');
    const P = 1000, END = +tv.dataset.end || 13600, GAP = +tv.dataset.gap || 3000;
    // o título de cada lugar: aparece limpo no centro, cresce e sai antes das fotos passarem
    const titleAt = (k, camZ) => {
      const a = k * GAP - 380, b = k * GAP + 1250, u = (camZ - a) / (b - a);
      if (u <= 0 || u >= 1) return k === 0 && u <= 0 ? [1, .88] : [0, 1];
      const o = k === 0 ? 1 - ramp(.5, 1, u) : ramp(0, .28, u) * (1 - ramp(.62, 1, u));
      return [o, .88 + .26 * u];
    };

    // poeira de luz no ar (gerada aqui, sem imagem extra)
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    dust.forEach(el => {
      let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">';
      for (let i = 0; i < 54; i++) s += `<circle cx="${(rnd() * 1000).toFixed(0)}" cy="${(rnd() * 1000).toFixed(0)}" r="${(.7 + rnd() * 2.3).toFixed(2)}" fill="#FFE8C0" fill-opacity="${(.25 + rnd() * .6).toFixed(2)}"/>`;
      el.style.backgroundImage = 'url("data:image/svg+xml,' + encodeURIComponent(s + '</svg>') + '")';
    });

    // o cabo de aço: sai de cima da cabeça, some no horizonte e a luz corre por ele
    const svg = q('.tv-cable'), NS = 'http://www.w3.org/2000/svg';
    const mk = (tag, at, parent = svg) => { const el = d.createElementNS(NS, tag); for (const k in at) el.setAttribute(k, at[k]); parent.appendChild(el); return el; };
    const defs = mk('defs', {});
    const grad = (id, stops, x2 = 1, y2 = 0) => { const g = mk('linearGradient', { id, x1: 0, y1: 0, x2, y2 }, defs); stops.forEach(([o, c]) => mk('stop', { offset: o, 'stop-color': c }, g)); };
    grad('tvSteel', [[0, '#0d1012'], [.4, '#8a9196'], [.52, '#f1f3f4'], [.64, '#7c8388'], [1, '#0d1012']]);
    grad('tvFade', [[0, '#fff'], [.78, '#fff'], [1, '#000']], 0, 1);
    const fade = mk('mask', { id: 'tvM', maskUnits: 'userSpaceOnUse' }, defs), fadeR = mk('rect', { fill: 'url(#tvFade)' }, fade);
    const gr = mk('g', { mask: 'url(#tvM)' });
    const sh1 = mk('polygon', { fill: 'rgba(0,0,0,.35)' }, gr), cab2 = mk('polygon', { fill: 'url(#tvSteel)', opacity: .7 }, gr), cab1 = mk('polygon', { fill: 'url(#tvSteel)' }, gr);
    const glints = Array.from({ length: 18 }, () => mk('line', { stroke: '#FFF6E4', 'stroke-linecap': 'round' }, gr));

    let vw = innerWidth, vh = innerHeight, por = false, sF = 1, prog = 0, svel = 0, vel = 0, inView = false, lx = 0, ly = 0, tx = 0, ty = 0, cur = -2, trig = null;
    const t0 = performance.now(), tnow = () => (performance.now() - t0) / 1000;
    const layout = () => {
      vw = tv.clientWidth; vh = tv.clientHeight; por = vh > vw * 1.05; sF = clamp(Math.min(vw, vh * 1.5) / 1440, .52, 1.15);
      svg.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
      items.forEach(it => { const x = por ? it.xm : it.x, y = por ? it.ym : it.y; it.el.style.transform = `translate(-50%, -50%) translate3d(${x}vw, ${y}vh, ${it.z}px)`; });
      ticks.forEach((b, i) => { b.style.left = (clamp((i * GAP + 150) / END, 0, 1) * 100).toFixed(1) + '%'; });
    };

    // o som do vento (só toca se a pessoa ligar)
    let ac = null, gain = null, filt = null, somOn = false;
    const audio = v => {
      if (!ac) return;
      gain.gain.setTargetAtTime(somOn && inView ? .03 + .2 * clamp(v, 0, 1.2) : 0, ac.currentTime, .12);
      filt.frequency.setTargetAtTime(360 + 1100 * clamp(v, 0, 1.2), ac.currentTime, .2);
    };
    if (snd) snd.addEventListener('click', () => {
      somOn = !somOn; snd.setAttribute('aria-pressed', String(somOn)); snd.textContent = somOn ? 'Som ligado' : 'Ativar som';
      if (somOn && !ac) {
        try {
          const AC = W.AudioContext || W.webkitAudioContext; ac = new AC();
          const len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), ch = buf.getChannelData(0);
          let last = 0; for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; ch[i] = last * 3.5; }
          const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
          filt = ac.createBiquadFilter(); filt.type = 'bandpass'; filt.Q.value = .7;
          gain = ac.createGain(); gain.gain.value = 0;
          src.connect(filt); filt.connect(gain); gain.connect(ac.destination); src.start();
        } catch (e) { ac = null; }
      }
      if (ac && ac.state === 'suspended') ac.resume();
    });

    const rig = (t, camZ, sway, ox, oy) => {
      const v = clamp(vel + (prog > .002 && prog < .995 ? .2 : 0), 0, 1.2);
      const vpx = vw * ox / 100 + sway * vw * .004, vpy = vh * oy / 100;
      const nx = vw * .5 + Math.sin(t * 43) * vel * .9, ny = -6;
      fadeR.setAttribute('x', 0); fadeR.setAttribute('y', ny); fadeR.setAttribute('width', vw); fadeR.setAttribute('height', Math.max(1, vpy - ny + 2));
      const wN = 6 * sF, n2 = 24 * sF;
      sh1.setAttribute('points', `${nx - wN / 2 - 1.2},${ny} ${nx + wN / 2 + 1.2},${ny} ${vpx + .9},${vpy} ${vpx - .9},${vpy}`);
      cab1.setAttribute('points', `${nx - wN / 2},${ny} ${nx + wN / 2},${ny} ${vpx + .45},${vpy} ${vpx - .45},${vpy}`);
      cab2.setAttribute('points', `${nx + n2 - wN * .28},${ny} ${nx + n2 + wN * .28},${ny} ${vpx + .5},${vpy} ${vpx + .1},${vpy}`);
      const D = camZ * 1.7, SP = 380, N = glints.length, L = SP * N, Z = 220;
      glints.forEach((gl, i) => {
        const w = (((i * SP - D) % L) + L) % L, s = w / (w + Z);
        const x = nx + (vpx - nx) * s, y = ny + (vpy - ny) * s;
        const len = (1 - s) * (1 - s) * 100 * sF * (.3 + v), k = len / Math.max(1, vpy - ny);
        gl.setAttribute('x1', x.toFixed(1)); gl.setAttribute('y1', y.toFixed(1));
        gl.setAttribute('x2', (x - (vpx - nx) * k).toFixed(1)); gl.setAttribute('y2', Math.max(ny, y - len).toFixed(1));
        gl.setAttribute('stroke-width', (2.1 * sF * (1 - s) + .35).toFixed(2));
        gl.setAttribute('opacity', ((1 - s * .6) * clamp(.12 + v, 0, 1)).toFixed(3));
      });
    };

    const render = t => {
      const camZ = prog * END;
      vel += (clamp(Math.abs(svel) / 2400, 0, 1) - vel) * .1; svel *= .9;
      lx += (tx - lx) * .06; ly += (ty - ly) * .06;
      // o balanço da cadeirinha, a vibração do cabo e o olhar guiado pelo mouse
      const sway = Math.sin(prog * Math.PI * 12) * .55 + Math.sin(t * 1.1) * .16;
      const bob = Math.sin(prog * Math.PI * 18) * 4 + Math.sin(t * 29) * vel * 2.2;
      const ox = 50 + lx * 7, oy = 46 + ly * 6;
      cam.style.perspective = (P - vel * 240).toFixed(0) + 'px';
      cam.style.perspectiveOrigin = `${ox.toFixed(2)}% ${oy.toFixed(2)}%`;
      world.style.transform = `translate3d(${(-lx * 16).toFixed(1)}px, ${(bob - ly * 10).toFixed(1)}px, ${camZ.toFixed(1)}px) rotateZ(${sway.toFixed(3)}deg)`;
      const bl = por ? 0 : vel * 2.6;
      // títulos sobrepostos (com um véu escuro atrás para ler bem)
      let tmax = 0;
      titles.forEach((c, i) => {
        const [o, sc] = titleAt(i, camZ); tmax = Math.max(tmax, o);
        c.style.opacity = o.toFixed(3); c.style.transform = `scale(${sc.toFixed(4)})`;
      });
      const fo = ramp(END - 1250, END - 520, camZ);
      fimEl.style.opacity = fo.toFixed(3); fimEl.style.transform = `scale(${(.9 + .1 * fo).toFixed(4)})`;
      chWrap.style.setProperty('--scrim', Math.max(tmax, fo).toFixed(3));
      const dim = 1 - .6 * tmax;
      items.forEach(it => {
        const rel = it.z + camZ;
        let o = ramp(-6200, -4300, rel) * (1 - ramp(240, 620, rel));
        if (rel < -800) o *= dim;
        it.el.style.opacity = o.toFixed(3);
        const vis = o > .003;
        if (vis !== it.v) { it.el.style.visibility = vis ? 'visible' : 'hidden'; it.v = vis; }
        if (it.img) {
          const b = vis && bl > .25 && rel > -1500 ? bl * ramp(-1500, 150, rel) : 0;
          if (Math.abs(b - it.b) > .05) { it.img.style.filter = b > .1 ? `blur(${b.toFixed(2)}px)` : ''; it.b = b; }
        }
      });
      // capítulo atual: fundo do lugar, nome no painel e marcas de progresso
      const k = camZ < 120 ? -1 : clamp(Math.floor((camZ + 380) / GAP), 0, titles.length - 1);
      if (k !== cur) { cur = k; bgs.forEach((bg, i) => bg.classList.toggle('on', i === Math.max(0, k))); nowEl.textContent = k < 0 ? 'Na plataforma' : titles[k].dataset.name; }
      ticks.forEach((b, i) => b.classList.toggle('on', i <= k));
      bar.style.width = (prog * 100).toFixed(2) + '%';
      goEl.style.opacity = (1 - ramp(0, .03, prog)).toFixed(3);
      dust.forEach((el, i) => {
        const ph = (((camZ / 1500) + i * .5) % 1 + 1) % 1;
        el.style.opacity = (Math.sin(Math.PI * ph) * (.45 + vel * .55)).toFixed(3);
        el.style.transform = `scale(${(1 + ph * 1.7).toFixed(3)})`;
      });
      rig(t, camZ, sway, ox, oy);
      audio(prog > .002 && prog < .995 ? .3 + vel : vel);
    };

    tv.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = tv.getBoundingClientRect();
      tx = clamp(((e.clientX - r.left) / r.width - .5) * 2, -1, 1); ty = clamp(((e.clientY - r.top) / r.height - .5) * 2, -1, 1);
    });
    tv.addEventListener('pointerleave', () => { tx = ty = 0; });
    // os números I–IV levam direto a cada lugar
    ticks.forEach((b, i) => b.addEventListener('click', () => {
      if (!trig) return;
      const target = trig.start + (trig.end - trig.start) * clamp((i * GAP + 150) / END, 0, 1);
      const L = W.__lenis; if (L) L.scrollTo(target, { duration: 1.8 }); else W.scrollTo({ top: target, behavior: 'smooth' });
    }));

    const loop = () => { if (!inView) return; render(tnow()); requestAnimationFrame(loop); };
    layout(); render(0);
    W.addEventListener('resize', () => { layout(); render(tnow()); });
    trig = ST.create({
      trigger: tv, start: 'top top', end: () => '+=' + Math.round(innerHeight * 6.5), pin: true, scrub: .8,
      onUpdate: s => { prog = s.progress; svel = s.getVelocity(); },
      onRefresh: () => { layout(); render(tnow()); }
    });
    new IntersectionObserver(es => {
      const v = es[0].isIntersecting;
      if (v && !inView) { inView = true; loop(); } else if (!v) { inView = false; audio(0); }
    }).observe(tv);
  }

  /* ---------- um dia no Château: o relógio corre com a rolagem ---------- */
  const dy = d.querySelector('.dy');
  if (dy) {
    const i1 = dy.querySelector('.d1'), i2 = dy.querySelector('.d2'), i3 = dy.querySelector('.d3');
    const warm = dy.querySelector('.dy-warm'), hh = dy.querySelector('[data-h]'), mm = dy.querySelector('[data-m]');
    const caps = [...dy.querySelectorAll('.dy-cap')];
    ST.create({
      trigger: dy, start: 'top top', end: '+=260%', pin: true, scrub: true,
      onUpdate: s => {
        const t = s.progress, mins = 10 * 60 + 30 + t * (11.5 * 60), m5 = Math.round(mins / 5) * 5;
        hh.textContent = String(Math.floor(m5 / 60)).padStart(2, '0');
        mm.textContent = String(m5 % 60).padStart(2, '0');
        const a = ramp(.3, .44, t), b = ramp(.64, .78, t);
        i2.style.opacity = a; i3.style.opacity = b;
        warm.style.opacity = (a * (1 - b)).toFixed(3);
        [i1, i2, i3].forEach((el, k) => { const im = el.querySelector('img'); im.style.transform = `scale(${1.1 - .1 * ramp(k / 3, k / 3 + .45, t)})`; });
        const c = t < .37 ? 0 : t < .71 ? 1 : 2;
        caps.forEach((cp, j) => cp.classList.toggle('on', j === c));
      }
    });
  }

  W.addEventListener('load', () => ST.refresh());
})();
