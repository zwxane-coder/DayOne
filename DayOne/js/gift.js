/* Gift a Story — builds a personalised certificate from the birthday data. */
(function () {
    const KEYS = { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️', tropical: '🌴', rainy: '🌧️', cloudy: '☁️' }, ZODIAC = { Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍', Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓' }, pills = $('gt'), cv = $('cert');
    let key = KEYS[document.documentElement.dataset.theme] ? document.documentElement.dataset.theme : 'spring', last = null, url = '';
    pills.innerHTML = Object.entries(KEYS).map(([k, e]) => `<button type="button" class="pill" data-k="${k}">${e} ${k}</button>`).join('');
    const mark = () => pills.querySelectorAll('.pill').forEach(b => b.classList.toggle('on', b.dataset.k === key));
        window.addEventListener('themechange', e => { key = e.detail; mark(); if (last) draw(); });
    const draw = () => drawCertificate(cv, last, key).then(() => { cv.classList.add('ready'); $('cph').hidden = true; ['gdl', 'gpr', 'gln'].forEach(i => $(i).disabled = false); });
    pills.onclick = e => { const b = e.target.closest('.pill'); if (!b) return; key = b.dataset.k; mark(); if (last) draw(); };
    mark(); placeSuggest($('gp'), $('gpl'));
    $('gd').max = new Date().toISOString().split('T')[0];
    const q0 = new URLSearchParams(location.search); // arrives from "My Day": ?name=&date=&place=
    $('gn').value = (q0.get('name') || '').slice(0, 40); $('gd').value = q0.get('date') || ''; $('gp').value = q0.get('place') || '';

    $('gf').onsubmit = async e => {
        e.preventDefault();
        const name = $('gn').value.trim(), ds = $('gd').value, place = $('gp').value.trim(), btn = $('gbtn'), err = $('gerr');
        err.textContent = '';
        if (!name || !ds) { err.textContent = 'Please add a name and a date of birth.'; return; }
        const [y, mo, d] = ds.split('-').map(Number);
        if (Date.UTC(y, mo - 1, d) > Date.now()) { err.textContent = 'The birth date cannot be in the future.'; return; }
        btn.disabled = true; btn.textContent = 'Gathering their story…';
        try {
            const loc = await resolvePlace(place), mp = moonPhase(y, mo, d), season = getSeason(mo, loc ? loc.lat : null), cy = Math.min(Math.max(y, 1950), NOWY - 1);
            const [wx, bb, ev] = await Promise.all([weatherOf(loc, y, mo, d), billboard(cy, MONTHS[mo - 1]).catch(() => null), worldEvents(y, mo, d).catch(() => null)]);
            const dow = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date(Date.UTC(y, mo - 1, d)).getUTCDay()];
            const zodiac = getZodiacSign(mo, d), chineseZodiac = getChineseZodiac(y, mo, d);
            last = { name, place: loc ? loc.label : place, msg: $('gm').value.trim(),
                date: new Date(y, mo - 1, d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                facts: [['Day', dow], ['Zodiac', `${ZODIAC[zodiac]} ${zodiac}`], ['Season', season.startsWith('Equ') ? 'Tropical' : season], ['Moon', `${mp.name} · ${mp.illum}%`]],
                facts2: [['Generation', getGeneration(y)], ['Chinese zodiac', `${chineseZodiac.element} ${chineseZodiac.animal}`], ['World population', worldPop(y)], ['Weather', wx ? `${wx.cond}, ${Math.round(wx.hi)}°C` : 'Not recorded'], [`Hit song of ${cy}`, bb ? `${bb.rows[0].title} — ${bb.rows[0].artist}` : 'A year of great music']],
                headline: ev && ev.exact && ev.items[0] ? ev.items[0].text.slice(0, 150) : '' };
            url = new URL('my-day.html', location.href); url.search = new URLSearchParams({ date: ds, place }).toString(); url = url.href;
            await draw();
        } catch (x) { err.textContent = 'Something went wrong. Please try again.'; }
        btn.disabled = false; btn.textContent = 'Create certificate';
    };
    $('gdl').onclick = () => cv.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `dayone-${last.name.replace(/\W+/g, '-').toLowerCase()}.png`; a.click(); });
    $('gpr').onclick = () => { $('printimg').src = cv.toDataURL('image/png'); setTimeout(() => window.print(), 150); };
    $('gln').onclick = () => (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => { $('gln').textContent = '✓ Link copied'; setTimeout(() => $('gln').textContent = '🔗 Copy story link', 2000); }).catch(() => prompt('Copy this link:', url));
})();
