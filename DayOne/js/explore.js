/* Explore: travel to any year — songs, films, headlines, science, prices, people. */
(function () {
    const rg = $('yr'), MINY = +rg.min, MAXY = +rg.max, money = n => n == null ? '—' : '$' + n.toFixed(2);
    const ERA = { 1920: 'The Roaring Twenties', 1930: 'The Great Depression', 1940: 'War and recovery', 1950: 'The post-war boom', 1960: 'The swinging sixties', 1970: 'The disco decade', 1980: 'The neon eighties', 1990: 'The nineties', 2000: 'The noughties', 2010: 'The social-media decade', 2020: 'The twenty-twenties' };
    const MON = '(?:January|February|March|April|May|June|July|August|September|October|November|December)', DATE = new RegExp(`^(${MON}\\s+\\d{1,2})\\s*[–—-]\\s*(.+)$`);
    let tok = 0, tmr, cur = 1995;
    const sk = n => Array.from({ length: n }, () => '<div class="skl"></div>').join('');
    const body = id => document.querySelector('#' + id + ' .pb');
    const empty = (id, m) => body(id).innerHTML = `<p class="note">${m}</p>`;
    const li = t => { const m = t.match(DATE); return m ? `<li><span class="dt">${esc(m[1])}</span>${esc(m[2])}</li>` : `<li>${esc(t)}</li>`; };

    const decs = Array.from({ length: 11 }, (_, i) => 1920 + i * 10);
    const HIST_LIFE = [[1920, 32], [1930, 34], [1940, 37], [1950, 46], [1960, 50]];
    $('decades').innerHTML = decs.map(d => `<button type="button" class="pill" data-d="${d}">${d}s</button>`).join('');
    $('ticks').innerHTML = [1920, 1940, 1960, 1980, 2000, 2020].map(y => `<span style="left:${(y - MINY) / (MAXY - MINY) * 100}%">${y}</span>`).join('');

    async function yearData(y) {
        const [main, sci] = await Promise.all([wiki(String(y)).catch(() => null), wiki(`${y} in science`).catch(() => null)]);
        const bad = /birth|death|see also|reference|external|further|notes|nobel|prize|award|sport|cultural|disaster/i, o = { events: [], tech: [], births: [], deaths: [] };
        const scan = (doc, fn) => { let h = ''; doc && doc.querySelectorAll('h2,li').forEach(el => { if (el.tagName === 'H2') { h = clean(el.textContent); return; } if (el.querySelector('li')) return; fn(h, clean(el.textContent)); }); };
        scan(main, (h, t) => { if (/^births?/i.test(h)) t.length > 12 && o.births.push(t); else if (/^deaths?/i.test(h)) t.length > 12 && o.deaths.push(t); else if (!bad.test(h) && t.length >= 30 && t.length <= 300) o.events.push(t); });
        scan(sci, (h, t) => { if (!bad.test(h) && t.length >= 30 && t.length <= 300) o.tech.push(t); });
        return { events: pickEvenly(o.events, 10), tech: pickEvenly(o.tech, 8), births: pickEvenly(o.births, 10), deaths: pickEvenly(o.deaths, 10) };
    }

    function glance(y) {
        const ago = NOWY - y, mult = lerp(CPI, NOWY, 1) / lerp(CPI, y, 1);
        const T = [['Years ago', ago ? `${ago} years` : 'This year'], ['World population', worldPop(y)], ['Life expectancy', '…'], ['Prices since', `×${mult.toFixed(1)}`], ['Loaf of bread', money(usPrice(y, 1))], ['Cinema ticket', money(usPrice(y, 4))]];
        $('glance').innerHTML = T.map((t, i) => `<div class="gl gt"><small>${t[0]}</small><b${i === 2 ? ' id="gLife"' : ''}>${t[1]}</b></div>`).join('');
    }
    function prices(y) {
        const L = [['Loaf of bread', 1], ['Gallon of milk', 2], ['Gallon of petrol', 3], ['Cinema ticket', 4], ['Postage stamp', 5], ['Minimum wage / hour', 6]];
        const rows = L.map(([n, i]) => {
            const a = usPrice(y, i), b = usPrice(2025, i); if (a == null || !b) return ''; const m = Math.max(a, b);
            return `<li><div class="pn"><b>${n}</b><span class="mult">×${(b / a).toFixed(1)}</span></div><div class="bar"><i style="width:${a / m * 100}%"></i><em>${money(a)} in ${y}</em></div><div class="bar now"><i style="width:${b / m * 100}%"></i><em>${money(b)} today</em></div></li>`;
        }).join('');
        body('pPrice').innerHTML = `<ul class="pr">${rows}</ul><p class="note">US averages. Years between benchmarks are estimated.</p>`;
    }
    function songs(r, y, t) {
        if (!r) return empty('pMusic', `No chart found for ${y}.`);
        const S = r.rows.slice(0, 10), ar = s => (s.artist || '').replace(/^by /, '');
        body('pMusic').innerHTML = `<ol class="sl">${S.map((s, i) => `<li><span class="rk">${i + 1}</span><span class="art" data-i="${i}">♪</span><div><b>${esc(s.title)}</b><small>${esc(ar(s))}</small></div></li>`).join('')}</ol><a class="more" target="_blank" rel="noopener" href="https://en.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, '_'))}">Full list on Wikipedia</a>`;
        S.forEach((s, i) => cover(s.title, ar(s)).then(u => { const el = document.querySelector(`#pMusic .art[data-i="${i}"]`); if (u && el && t === tok) el.innerHTML = `<img alt="" src="${esc(u)}">`; }));
    }
    function people(d, y) {
        const one = t => { const p = t.replace(DATE, '$2'), k = p.indexOf(','); return `<li><b>${esc(k > 0 ? p.slice(0, k) : p)}</b>${k > 0 ? `<small>${esc(p.slice(k + 1).trim())}</small>` : ''}</li>`; };
        const col = (h, a) => `<div><h4>${h}</h4>${a.length ? `<ul class="xl">${a.map(one).join('')}</ul>` : '<p class="note">No notable entries found for this year.</p>'}</div>`;
        body('pPeople').innerHTML = `<div class="ppl">${col(`Born in ${y}`, d.births)}${col(`Died in ${y}`, d.deaths)}</div>`;
    }
    function load(y) {
        const t = ++tok; ['pMusic', 'pFilm', 'pNews', 'pTech', 'pPeople'].forEach(id => body(id).innerHTML = sk(5)); prices(y);
        songsOf(y).catch(() => null).then(r => t === tok && songs(r, y, t));
        filmsOf(y).then(f => { if (t !== tok) return; body('pFilm').innerHTML = f && f.length ? `<ol class="fl">${f.slice(0, 10).map(x => `<li><span class="rk">${x.r}</span><div><b>${esc(x.title)}</b><small>${esc(x.studio)}</small></div><span class="gr">${esc(x.gross)}</span></li>`).join('')}</ol><a class="more" target="_blank" rel="noopener" href="https://en.wikipedia.org/wiki/${y}_in_film">Full list on Wikipedia</a>` : `<p class="note">No box-office table found for ${y}.</p>`; });
        yearData(y).then(d => {
            if (t !== tok) return;
            body('pNews').innerHTML = d.events.length ? `<ul class="tlx cols2">${d.events.map(li).join('')}</ul><a class="more" target="_blank" rel="noopener" href="https://en.wikipedia.org/wiki/${y}">More from ${y} on Wikipedia</a>` : `<p class="note">No headlines found for ${y}.</p>`;
            body('pTech').innerHTML = d.tech.length ? `<ul class="tlx">${d.tech.map(li).join('')}</ul>` : `<p class="note">No science list found for ${y}.</p>`;
            people(d, y);
        }).catch(() => { if (t === tok) ['pNews', 'pTech', 'pPeople'].forEach(id => empty(id, 'Could not reach Wikipedia. Try again in a moment.')); });
        if (y >= 1960) wb('WLD', 'SP.DYN.LE00.IN', `${y - 3}:${y + 3}`).then(a => { const v = near(a, y, 3), el = $('gLife'); if (t === tok && el) el.textContent = v ? v.toFixed(1) + ' yrs' : '—'; });
        else { const el = $('gLife'); if (el) el.textContent = `~${Math.round(lerp(HIST_LIFE, y, 1))} yrs`; }
    }
    function setYear(y, delay = 260) {
        y = Math.max(MINY, Math.min(MAXY, Math.round(y) || 1995)); cur = y; rg.value = y;
        rg.style.setProperty('--v', ((y - MINY) / (MAXY - MINY) * 100) + '%');
        $('yrOut').textContent = y; const dec = Math.floor(y / 10) * 10; $('era').textContent = ERA[dec] || '';
        document.querySelectorAll('#decades .pill').forEach(b => b.classList.toggle('on', +b.dataset.d === dec));
        glance(y); history.replaceState(null, '', '?y=' + y);
        clearTimeout(tmr); tmr = setTimeout(() => load(y), delay);
    }
    rg.addEventListener('input', () => setYear(+rg.value));
    $('prev').onclick = () => setYear(cur - 1, 120); $('next').onclick = () => setYear(cur + 1, 120);
    $('rand').onclick = () => setYear(MINY + Math.floor(Math.random() * (MAXY - MINY + 1)), 60);
    $('decades').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setYear(Math.min(+b.dataset.d + 5, MAXY), 60); });
    setYear(+new URLSearchParams(location.search).get('y') || 1995, 0);
})();
