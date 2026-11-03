/* Compare two birthdays side by side — names, progress bar, grouped rows. */
(function () {
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const STONES = ['Garnet', 'Amethyst', 'Aquamarine', 'Diamond', 'Emerald', 'Pearl', 'Ruby', 'Peridot', 'Sapphire', 'Opal', 'Topaz', 'Turquoise'];
    const CATS = { 'The day': ['📅', ''], 'The sky': ['🌙', ''], 'The world': ['🌍', ''], 'The wallet': ['💸', 'US prices'] };
    const NONE = ['—', 'Add a birthplace', 'Not recorded'];
    const money = n => n == null ? '—' : '$' + n.toFixed(2);
    const lim = (p, ms) => Promise.race([Promise.resolve(p).catch(() => null), new Promise(r => setTimeout(() => r(null), ms))]);
    let done = 0, total = 10, busy = false;
    function bump(msg) { done++; const p = Math.min(100, Math.round(done / total * 100)); $('cfill').style.width = p + '%'; $('cpct').textContent = p + '%'; $('cstep').textContent = msg; }
    const tk = (p, ms, msg) => lim(p, ms).then(v => { bump(msg); return v; });

    async function profile(ds, place) {
        const [y, mo, d] = ds.split('-').map(Number), cy = Math.min(y, NOWY - 1);
        const loc = await tk(resolvePlace(place), 8000, 'Locating birthplaces');
        const mp = moonPhase(y, mo, d), season = getSeason(mo, loc ? loc.lat : null), cc = loc && loc.cc ? loc.cc : 'WLD';
        const [wx, song, life, film] = await Promise.all([
            tk(weatherOf(loc, y, mo, d), 12000, 'Checking the weather'),
            tk(songsOf(cy), 14000, 'Finding the hit songs'),
            tk(wb(cc, 'SP.DYN.LE00.IN', `${y - 3}:${y + 3}`), 10000, 'Reading life expectancy'),
            tk(filmsOf(cy), 12000, 'Looking up the films')]);
        const t = new Date(), age = t.getFullYear() - y - ((t.getMonth() + 1 < mo || (t.getMonth() + 1 === mo && t.getDate() < d)) ? 1 : 0);
        const alive = Math.floor((Date.now() - Date.UTC(y, mo - 1, d)) / 864e5), doy = Math.floor((Date.UTC(y, mo - 1, d) - Date.UTC(y, 0, 0)) / 864e5), leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
        const le = near(life, y, 3), P = k => usPrice(Math.max(y, 1900), k), basket = [1, 2, 3, 4, 5].reduce((s, i) => s + P(i), 0);
        const noWx = loc ? 'Not recorded' : 'Add a birthplace', R = (c, k, t, n) => ({ c, k, t, n: n == null ? null : n });
        const s0 = song && song.rows[0], ratio = lerp(CPI, NOWY, 1) / lerp(CPI, y, 1);
        return { y, mo, d, age, loc, rows: [
            R('The day', 'Day of the week', DAYS[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()]),
            R('The day', 'Day of the year', `Day ${doy} of ${leap ? 366 : 365}`),
            R('The day', 'Zodiac sign', getZodiacSign(mo, d)),
            R('The day', 'Chinese zodiac', `${getChineseZodiac(y, mo, d).element} ${getChineseZodiac(y, mo, d).animal}`),
            R('The day', 'Birthstone', STONES[mo - 1]),
            R('The day', 'Generation', getGeneration(y)),
            R('The day', 'Season', `${SEASONS[season][1]} ${season.startsWith('Equ') ? 'Tropical' : season}`),
            R('The day', 'Age today', `${age} years`, age),
            R('The day', 'Days alive', alive.toLocaleString(), alive),
            R('The sky', 'Moon phase', `${mp.icon} ${mp.name}`),
            R('The sky', 'Moon brightness', `${mp.illum}% lit`),
            R('The sky', 'Weather', wx ? `${wx.ico} ${wx.cond}` : noWx),
            R('The sky', 'High / low', wx ? `${Math.round(wx.hi)}° / ${Math.round(wx.lo)}°C` : noWx, wx ? wx.hi : null),
            R('The sky', 'Rainfall', wx && wx.rain != null ? `${wx.rain.toFixed(1)} mm` : noWx, wx && wx.rain != null ? wx.rain : null),
            R('The world', 'World population', worldPop(y), lerp(WORLD, y, 1)),
            R('The world', 'Life expectancy', le ? `${le.toFixed(1)} yrs (${loc && loc.cc ? loc.country : 'world'})` : '—', le),
            R('The world', 'Hit song of the year', s0 ? (s0.artist ? `${s0.title} — ${s0.artist.replace(/^by /, '')}` : s0.title) : '—'),
            R('The world', 'Biggest film', film ? film[0].title : '—'),
            R('The wallet', 'Loaf of bread', money(P(1)), P(1)),
            R('The wallet', 'Gallon of milk', money(P(2)), P(2)),
            R('The wallet', 'Gallon of petrol', money(P(3)), P(3)),
            R('The wallet', 'Cinema ticket', money(P(4)), P(4)),
            R('The wallet', 'Minimum wage / hour', money(P(6)), P(6)),
            R('The wallet', 'Basket of basics', money(basket), basket),
            R('The wallet', 'Prices today vs then', ratio.toFixed(1) + '× higher', ratio)] };
    }

    const span = (a, b) => { let y = b.y - a.y, m = b.mo - a.mo, d = b.d - a.d; if (d < 0) { m--; d += new Date(b.y, b.mo - 1, 0).getDate(); } if (m < 0) { y--; m += 12; } return `${y}y ${m}m ${d}d`; };
    const when = p => new Date(p.y, p.mo - 1, p.d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const q = new URLSearchParams(location.search);
    placeSuggest($('pa'), $('la')); placeSuggest($('pb'), $('lb'));
    $('da').value = q.get('a') || ''; $('db').value = q.get('b') || ''; $('pa').value = q.get('pa') || ''; $('pb').value = q.get('pb') || ''; $('na').value = q.get('na') || ''; $('nb').value = q.get('nb') || '';
    $('da').max = $('db').max = new Date().toISOString().split('T')[0];

    const person = (P, name, k, place) => `<div class="gl pc ${k}"><span class="av">${esc(Array.from(name)[0].toUpperCase())}</span><b class="nm">${esc(name)}</b><span class="dt">${when(P)}</span><span class="pl">${esc(place)}</span><span class="ag">${P.age} years old</span></div>`;
    const phrase = p => p === 0 ? 'Two completely different days, and both worth celebrating.' : p < 25 ? 'Different worlds. The one thing you share is that you were born.' : p < 60 ? 'A fair amount in common across the calendar.' : 'Almost twins on the calendar.';
    function comparisonText(A, B, nA, nB, gap) {
        return [`DayOne Birthday Comparison`, `${nA} · ${when(A)} · ${A.age} years old`, `${nB} · ${when(B)} · ${B.age} years old`, `${gap.toLocaleString()} days apart`, '', ...A.rows.map((r, i) => `${r.k}: ${r.t} | ${B.rows[i].t}`)].join('\n');
    }
    const writeClipboard = text => navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text) : Promise.reject(new Error('Clipboard unavailable'));
    function downloadComparison(A, B, nA, nB, gap) {
        const canvas = document.createElement('canvas'), x = canvas.getContext('2d'), W = canvas.width = 1600, H = canvas.height = 1480;
        const style = getComputedStyle(document.documentElement), berry = style.getPropertyValue('--color-berry').trim() || '#8A3D52', coral = style.getPropertyValue('--color-coral').trim() || '#D88F83';
        const ink = style.getPropertyValue('--color-text').trim() || '#2D2524', muted = style.getPropertyValue('--color-muted').trim() || '#6B5E59';
        const fit = (text, width) => { let value = String(text); while (value.length > 1 && x.measureText(value).width > width) value = value.slice(0, -2).trimEnd() + '…'; return value; };
        x.fillStyle = '#FFF9F7'; x.fillRect(0, 0, W, H);
        const wash = x.createLinearGradient(0, 0, W, H); wash.addColorStop(0, '#FFF5F5'); wash.addColorStop(1, '#F5F2E9'); x.fillStyle = wash; x.fillRect(0, 0, W, H);
        x.strokeStyle = coral; x.lineWidth = 5; x.strokeRect(36, 36, W - 72, H - 72);
        x.textAlign = 'center'; x.fillStyle = berry; x.font = '700 24px Georgia'; x.fillText('DAYONE · BIRTHDAY COMPARISON', W / 2, 112);
        x.fillStyle = ink; x.font = '700 64px Georgia'; x.fillText('Two days. One timeline.', W / 2, 202);
        x.fillStyle = muted; x.font = '400 26px Arial'; x.fillText('The world around two birthdays, side by side.', W / 2, 252);
        x.textAlign = 'left'; x.fillStyle = berry; x.font = '700 38px Georgia'; x.fillText(fit(nA, 500), 170, 340);
        x.textAlign = 'right'; x.fillStyle = berry; x.fillText(fit(nB, 500), W - 170, 340);
        x.textAlign = 'left'; x.fillStyle = ink; x.font = '500 24px Arial'; x.fillText(when(A), 170, 385);
        x.textAlign = 'right'; x.fillText(when(B), W - 170, 385);
        x.textAlign = 'center'; x.fillStyle = coral; x.font = '700 30px Georgia'; x.fillText(`${gap.toLocaleString()} days apart`, W / 2, 344);
        x.strokeStyle = coral; x.globalAlpha = .5; x.lineWidth = 2; x.beginPath(); x.moveTo(110, 420); x.lineTo(W - 110, 420); x.stroke(); x.globalAlpha = 1;
        const pairs = A.rows.map((r, i) => [r, B.rows[i]]), top = 470, rowH = 40;
        pairs.forEach(([a, b], i) => {
            const y = top + i * rowH;
            if (i % 2 === 0) { x.fillStyle = 'rgba(255,255,255,.62)'; x.fillRect(100, y - 27, W - 200, rowH); }
            x.textAlign = 'right'; x.fillStyle = ink; x.font = '500 20px Arial'; x.fillText(fit(a.t, 475), 565, y);
            x.textAlign = 'center'; x.fillStyle = muted; x.font = '700 15px Arial'; x.fillText(fit(`${a.c} · ${a.k}`, 390), W / 2, y);
            x.textAlign = 'left'; x.fillStyle = ink; x.font = '500 20px Arial'; x.fillText(fit(b.t, 475), 1035, y);
        });
        x.textAlign = 'center'; x.fillStyle = muted; x.font = '500 18px Arial'; x.fillText('dayone · “The world before you. The day you arrived.”', W / 2, H - 74);
        canvas.toBlob(blob => {
            if (!blob) return;
            const a = document.createElement('a'), url = URL.createObjectURL(blob);
            a.href = url; a.download = `dayone-comparison-${A.y}-${B.y}.png`; a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, 'image/png');
    }

    function render(A, B, nA, nB) {
        const gap = Math.round(Math.abs(Date.UTC(B.y, B.mo - 1, B.d) - Date.UTC(A.y, A.mo - 1, A.d)) / 864e5);
        const [o, n] = Date.UTC(A.y, A.mo - 1, A.d) <= Date.UTC(B.y, B.mo - 1, B.d) ? [A, B] : [B, A];
        const ok = t => !NONE.includes(t), pairs = A.rows.map((r, i) => [r, B.rows[i]]);
        const comp = pairs.filter(([a, b]) => ok(a.t) && ok(b.t)), same = comp.filter(([a, b]) => a.t === b.t).length, pct = comp.length ? Math.round(same / comp.length * 100) : 0;
        const groups = {}; pairs.forEach(p => (groups[p[0].c] = groups[p[0].c] || []).push(p));
        const row = ([a, b]) => {
            const eq = ok(a.t) && a.t === b.t; let ca = '', cb = '', ha = '', hb = '';
            if (a.n != null && b.n != null && a.n !== b.n) {
                const lo = Math.min(a.n, b.n), hi = Math.max(a.n, b.n), r = lo > 0 ? hi / lo : 0, chip = r ? `<em>${r >= 11 ? '×' + Math.round(r) : '+' + Math.round((r - 1) * 100) + '%'}</em>` : '';
                if (a.n > b.n) { ha = 'hi'; ca = chip; } else { hb = 'hi'; cb = chip; }
            }
            return `<div class="cr${eq ? ' same' : ''}"><span class="v ${ha}">${esc(a.t)}${ca}</span><i>${esc(a.k)}</i><span class="v ${hb}">${esc(b.t)}${cb}</span></div>`;
        };
        $('cres').innerHTML = `<section class="duo">${person(A, nA, 'a', A.loc ? A.loc.label : 'Global archive')}
            <div class="gap"><b>${gap.toLocaleString()}</b><small>days apart</small><em>${gap ? span(o, n) : 'Same day!'}</em></div>
            ${person(B, nB, 'b', B.loc ? B.loc.label : 'Global archive')}</section>
            <section class="gl sim"><div class="ring" style="--p:${pct}"><b>${pct}%</b></div>
                <div class="sim-t"><h3>${same} of ${comp.length} things were exactly the same</h3><p>${phrase(pct)}</p><div class="meter"><i style="width:${pct}%"></i></div></div>
                <div class="cmp-tools"><button class="btn btn-secondary" type="button" id="cdownload">Download PNG</button><button class="btn btn-secondary" type="button" id="ccopy-summary">Copy summary</button><button class="btn btn-secondary" type="button" id="ccopy-link">Copy link</button></div></section>
            <div class="cats">${Object.keys(groups).map(c => `<section class="gl cat"><div class="cat-h"><span class="chip a">${esc(nA)}</span><h3>${CATS[c][0]} ${c}${CATS[c][1] ? `<small>${CATS[c][1]}</small>` : ''}</h3><span class="chip b">${esc(nB)}</span></div><div class="rows">${groups[c].map(row).join('')}</div></section>`).join('')}</div>`;
        $('cdownload').onclick = () => downloadComparison(A, B, nA, nB, gap);
        $('ccopy-summary').onclick = e => writeClipboard(comparisonText(A, B, nA, nB, gap)).then(() => { e.target.textContent = 'Summary copied'; setTimeout(() => e.target.textContent = 'Copy summary', 1800); }).catch(() => prompt('Copy this comparison summary:', comparisonText(A, B, nA, nB, gap)));
        $('ccopy-link').onclick = e => writeClipboard(location.href).then(() => { e.target.textContent = 'Link copied'; setTimeout(() => e.target.textContent = 'Copy link', 1800); }).catch(() => prompt('Copy this comparison link:', location.href));
        $('cres').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async function run() {
        if (busy) return;
        const da = $('da').value, db = $('db').value, err = $('cerr'), btn = $('cgo'), prog = $('cprog');
        err.textContent = '';
        if (!da || !db) { err.textContent = 'Please choose both dates of birth.'; return; }
        const nA = $('na').value.trim() || 'Person A', nB = $('nb').value.trim() || 'Person B';
        busy = true; btn.disabled = true; done = 0; $('cfill').style.width = '0'; $('cpct').textContent = '0%'; $('cstep').textContent = 'Starting…'; prog.hidden = false;
        history.replaceState(null, '', '?' + new URLSearchParams({ a: da, b: db, na: $('na').value.trim(), nb: $('nb').value.trim(), pa: $('pa').value, pb: $('pb').value }));
        try {
            const [A, B] = await Promise.all([profile(da, $('pa').value.trim()), profile(db, $('pb').value.trim())]);
            render(A, B, nA, nB);
        } catch (e) { err.textContent = 'Something went wrong. Please try again.'; }
        finally { prog.hidden = true; btn.disabled = false; busy = false; }
    }
    $('cgo').onclick = run;
    $('cmp').onsubmit = e => e.preventDefault();
    $('cmp').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); run(); } });
    if (q.get('a') && q.get('b')) run();
})();
