/* DayOne shared UI (loaded in <head> on every page):
   1) season themes: spring / summer / autumn / winter / tropical / rainy / cloudy, remembered on every page
   2) animated season backdrop (waves, sun, palms, falling petals / leaves / snow / rain, drifting clouds + rainbow)
   3) themed date picker that replaces every <input type="date"> */
(function () {
    const T = [['spring', '🌸'], ['summer', '☀️'], ['autumn', '🍂'], ['winter', '❄️'], ['tropical', '🌴'], ['rainy', '🌧️'], ['cloudy', '☁️']], root = document.documentElement;
    let saved = null;
    try { saved = localStorage.getItem('dayone-theme'); } catch (e) {}
    if (saved && T.some(t => t[0] === saved)) root.dataset.theme = saved;
    const scene = () => root.dataset.theme || ((document.getElementById('page') || { dataset: {} }).dataset.season) || 'spring';
    const mark = () => document.querySelectorAll('.theme-switch button').forEach(b => b.classList.toggle('on', b.dataset.t === scene()));

    /* ----- season backdrop ----- */
    const FX = { spring: ['🌸', '🌸', '🌷'], summer: ['✨', '☀️', '✨'], autumn: ['🍂', '🍁', '🍂'], winter: ['❄️', '❄️', '✦'], tropical: ['🍃', '🌺', '🌿'] };
    const FROND = 'M0 0C50-46 140-62 230-22C160-30 92-22 40-6Z', fan = [-6, 14, 34, 54, 74, 94].map(a => `<path d="${FROND}" transform="rotate(${a})"/>`).join('');
    const SCENE = `<div class="sb-orb"></div>
        <svg class="sb-rainbow" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax meet"><g fill="none" stroke-width="28"><path d="M40 940A760 760 0 0 1 1560 940" stroke="#FF9A9A"/><path d="M68 940A732 732 0 0 1 1532 940" stroke="#FFBE8A"/><path d="M96 940A704 704 0 0 1 1504 940" stroke="#FFE58F"/><path d="M124 940A676 676 0 0 1 1476 940" stroke="#A8E6A3"/><path d="M152 940A648 648 0 0 1 1448 940" stroke="#8FD0FF"/><path d="M180 940A620 620 0 0 1 1420 940" stroke="#A9ACFF"/><path d="M208 940A592 592 0 0 1 1392 940" stroke="#D6A9F7"/></g></svg>
        <svg width="0" height="0" style="position:absolute"><defs><g id="sbCloudShape"><circle cx="70" cy="74" r="32"/><circle cx="112" cy="52" r="44"/><circle cx="160" cy="66" r="36"/><circle cx="194" cy="80" r="26"/><rect x="40" y="76" width="180" height="30" rx="15"/></g></defs></svg>
        <div class="sb-clouds"><svg class="sb-cloud" viewBox="0 0 240 110" style="--w:clamp(220px,30vw,460px);--t:4%;--sp:150s;--dl:-40s"><use href="#sbCloudShape"/></svg><svg class="sb-cloud" viewBox="0 0 240 110" style="--w:clamp(150px,20vw,300px);--t:14%;--sp:190s;--dl:-120s"><use href="#sbCloudShape"/></svg><svg class="sb-cloud" viewBox="0 0 240 110" style="--w:clamp(260px,34vw,520px);--t:30%;--sp:170s;--dl:-90s"><use href="#sbCloudShape"/></svg><svg class="sb-cloud" viewBox="0 0 240 110" style="--w:clamp(140px,18vw,280px);--t:48%;--sp:210s;--dl:-10s"><use href="#sbCloudShape"/></svg><svg class="sb-cloud" viewBox="0 0 240 110" style="--w:clamp(200px,26vw,400px);--t:66%;--sp:180s;--dl:-150s"><use href="#sbCloudShape"/></svg><svg class="sb-cloud" viewBox="0 0 240 110" style="--w:clamp(120px,14vw,220px);--t:78%;--sp:230s;--dl:-70s"><use href="#sbCloudShape"/></svg></div>
        <svg class="sb-palm l" viewBox="0 0 300 300"><g transform="translate(4 4)">${fan}</g></svg><svg class="sb-palm r" viewBox="0 0 300 300"><g transform="translate(4 4)">${fan}</g></svg>
        <svg class="sb-waves" viewBox="0 0 1440 260" preserveAspectRatio="none"><path class="w3" d="M0 90C240 40 480 140 720 90C960 40 1200 140 1440 90V260H0Z"/><path class="w2" d="M0 120C200 80 380 160 600 120C820 80 1000 160 1220 120C1330 100 1400 130 1440 120V260H0Z"/><path class="w1" d="M0 150C180 110 360 190 540 150C720 110 900 190 1080 150C1260 110 1380 170 1440 150V260H0Z"/></svg>
        <div class="sb-fx"></div>`;
    function particles(box, s) {
        if (s === 'rainy') { // thin streaks that fall on a slant
            const n = innerWidth < 700 ? 30 : 60, r = Math.random;
            box.className = 'sb-fx rain';
            box.innerHTML = Array.from({ length: n }, (_, i) => `<span style="--x:${(i * 124 / n + r() * 3).toFixed(1)}%;--s:${(16 + r() * 22).toFixed(0)}px;--d:${(0.6 + r() * 0.6).toFixed(2)}s;--dl:-${(r() * 1.4).toFixed(2)}s;--o:${(0.25 + r() * 0.4).toFixed(2)}"></span>`).join('');
            return;
        }
        if (s === 'cloudy') { box.className = 'sb-fx'; box.innerHTML = ''; return; } // clouds + rainbow are drawn by the scene itself
        const set = FX[s] || FX.spring, n = innerWidth < 700 ? 9 : 16, r = Math.random;
        box.className = 'sb-fx ' + (s === 'summer' ? 'rise' : 'fall');
        box.innerHTML = Array.from({ length: n }, (_, i) => `<span style="--x:${(i * 100 / n + r() * 5).toFixed(1)}%;--s:${(16 + r() * 18).toFixed(0)}px;--d:${(14 + r() * 14).toFixed(1)}s;--dl:-${(r() * 24).toFixed(1)}s;--dx:${(r() * 120 - 60).toFixed(0)}px">${set[i % set.length]}</span>`).join('');
    }
    function setScene() {
        const s = scene(), el = document.querySelector('.season-bg');
        if (el && el.dataset.s !== s) { el.dataset.s = s; particles(el.querySelector('.sb-fx'), s); }
        mark();
    }

    document.addEventListener('DOMContentLoaded', () => {
        const bg = document.createElement('div');
        bg.className = 'season-bg'; bg.setAttribute('aria-hidden', 'true'); bg.innerHTML = SCENE;
        document.body.prepend(bg); setScene();
        const pg = document.getElementById('page');
        if (pg) new MutationObserver(setScene).observe(pg, { attributes: true, attributeFilter: ['data-season'] });

        const box = document.createElement('div');
        box.className = 'theme-switch'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Season theme');
        box.innerHTML = '<small>Theme</small>' + T.map(([k, e]) => `<button type="button" data-t="${k}" title="${k[0].toUpperCase() + k.slice(1)} theme" aria-label="${k} theme">${e}</button>`).join('');
        box.addEventListener('click', ev => {
            const b = ev.target.closest('button'); if (!b) return;
            root.dataset.theme = b.dataset.t;
            try { localStorage.setItem('dayone-theme', b.dataset.t); } catch (e) {}
            setScene(); window.dispatchEvent(new CustomEvent('themechange', { detail: b.dataset.t }));
        });
        document.body.appendChild(box); mark();
        document.querySelectorAll('input[type=date]').forEach(enhance);
    });

    /* ----- date picker ----- */
    const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], DEC = [1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];
    const vd = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value'), p2 = n => String(n).padStart(2, '0');
    const iso = (y, m, d) => `${y}-${p2(m + 1)}-${p2(d)}`, fmt = p => p ? `${p2(p.m + 1)}/${p2(p.d)}/${p.y}` : '';
    const parse = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null; };
    const real = p => { const t = new Date(p.y, p.m, p.d); return p.y >= 1900 && t.getMonth() === p.m && t.getDate() === p.d; };
    const CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>';

    function enhance(inp) {
        const now = new Date(), today = iso(now.getFullYear(), now.getMonth(), now.getDate());
        if (!inp.max) inp.max = today;
        if (!inp.min) inp.min = '1900-01-01';
        const id = inp.id || 'dp' + Math.random().toString(36).slice(2, 7), wrap = document.createElement('div'), tx = document.createElement('input'), pop = document.createElement('div');
        inp.id = id; wrap.className = 'dp';
        tx.type = 'text'; tx.className = 'dp-text'; tx.id = id + '-text'; tx.placeholder = 'MM/DD/YYYY'; tx.inputMode = 'numeric'; tx.autocomplete = 'off'; tx.maxLength = 10; tx.setAttribute('aria-label', 'Date of birth, month day year');
        inp.parentNode.insertBefore(wrap, inp);
        wrap.innerHTML = `<div class="dp-field"><button type="button" class="dp-btn" aria-label="Open calendar">${CAL}</button></div>`;
        wrap.firstChild.prepend(tx); wrap.appendChild(inp);
        inp.classList.add('dp-native'); inp.tabIndex = -1; inp.setAttribute('aria-hidden', 'true');
        document.querySelectorAll(`label[for="${id}"]`).forEach(l => l.htmlFor = tx.id);
        pop.className = 'dp-pop'; pop.hidden = true; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Choose a date'); document.body.appendChild(pop);

        let view = { y: 1990, m: 0 }, open = false;
        const get = () => vd.get.call(inp), set = v => vd.set.call(inp, v);
        const lim = () => ({ lo: inp.min || '1900-01-01', hi: inp.max || today });
        const fire = () => { inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); };
        const sync = () => { const p = parse(get()); tx.value = fmt(p); if (p) view = { y: p.y, m: p.m }; };
        Object.defineProperty(inp, 'value', { configurable: true, get, set(v) { set(v); sync(); } });

        function place() {
            const r = tx.getBoundingClientRect(), w = Math.max(r.width, 304), h = pop.offsetHeight;
            pop.style.width = w + 'px'; pop.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px';
            pop.style.top = (r.bottom + 8 + h > innerHeight - 8 && r.top - h - 8 > 8 ? r.top - h - 8 : r.bottom + 8) + 'px';
        }
        function render() {
            const { lo, hi } = lim(), sel = get(), first = new Date(view.y, view.m, 1).getDay(), count = new Date(view.y, view.m + 1, 0).getDate();
            const y0 = +hi.slice(0, 4), y1 = +lo.slice(0, 4);
            let days = '<span></span>'.repeat(first);
            for (let d = 1; d <= count; d++) { const s = iso(view.y, view.m, d); days += `<button type="button" data-d="${d}"${s < lo || s > hi ? ' disabled' : ''} class="${s === sel ? 'sel' : ''} ${s === today ? 'today' : ''}">${d}</button>`; }
            pop.innerHTML = `<div class="dp-decs">${DEC.map(d => `<button type="button" class="dp-chip${Math.floor(view.y / 10) * 10 === d ? ' on' : ''}" data-dec="${d}">${d}s</button>`).join('')}</div>
                <div class="dp-nav"><button type="button" class="dp-arrow" data-nav="-1" aria-label="Previous month">‹</button>
                <select class="dp-mon" aria-label="Month">${MON.map((n, i) => `<option value="${i}"${i === view.m ? ' selected' : ''}>${n.slice(0, 3)}</option>`).join('')}</select>
                <select class="dp-yr" aria-label="Year">${Array.from({ length: y0 - y1 + 1 }, (_, i) => y0 - i).map(y => `<option${y === view.y ? ' selected' : ''}>${y}</option>`).join('')}</select>
                <button type="button" class="dp-arrow" data-nav="1" aria-label="Next month">›</button></div>
                <div class="dp-wk">${['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => `<span>${d}</span>`).join('')}</div><div class="dp-days">${days}</div>`;
        }
        const show = () => { if (open) return; open = true; render(); pop.hidden = false; place(); };
        const hide = () => { open = false; pop.hidden = true; };
        function pick(p) { set(iso(p.y, p.m, p.d)); tx.value = fmt(p); tx.classList.remove('bad'); fire(); hide(); }

        pop.addEventListener('click', e => {
            const b = e.target.closest('button'); if (!b) return;
            const { hi } = lim(), maxY = +hi.slice(0, 4);
            if (b.dataset.dec) view.y = Math.min(+b.dataset.dec + 5, maxY);
            else if (b.dataset.nav) { view.m += +b.dataset.nav; if (view.m < 0) { view.m = 11; view.y--; } if (view.m > 11) { view.m = 0; view.y++; } view.y = Math.max(1900, Math.min(view.y, maxY)); }
            else if (b.dataset.d) return pick({ y: view.y, m: view.m, d: +b.dataset.d });
            render();
        });
        pop.addEventListener('change', e => { if (e.target.matches('.dp-mon')) view.m = +e.target.value; if (e.target.matches('.dp-yr')) view.y = +e.target.value; render(); });
        wrap.querySelector('.dp-btn').addEventListener('click', () => open ? hide() : show());
        tx.addEventListener('focus', show); tx.addEventListener('click', show);
        tx.addEventListener('input', () => {
            const v = tx.value.replace(/\D/g, '').slice(0, 8);
            tx.value = v.length > 4 ? `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}` : v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v;
            if (v.length === 8) {
                const p = { m: +v.slice(0, 2) - 1, d: +v.slice(2, 4), y: +v.slice(4) }, s = iso(p.y, p.m, p.d), { lo, hi } = lim();
                if (real(p) && s >= lo && s <= hi) { set(s); view = { y: p.y, m: p.m }; tx.classList.remove('bad'); fire(); if (open) render(); }
                else { set(''); tx.classList.add('bad'); fire(); }
            } else { tx.classList.remove('bad'); if (get()) { set(''); fire(); } }
        });
        document.addEventListener('pointerdown', e => { if (open && !wrap.contains(e.target) && !pop.contains(e.target)) hide(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) hide(); });
        addEventListener('scroll', () => open && place(), { passive: true }); addEventListener('resize', () => open && place());
        sync();
    }
})();
