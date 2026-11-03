/* DayOne results page (my-day.html). Needs js/core.js. */
document.addEventListener('DOMContentLoaded', init);

async function init() {
    document.documentElement.classList.add('js');
    const p = new URLSearchParams(location.search), place = (p.get('place') || '').trim(), name = (p.get('name') || '').trim().slice(0, 40);
    const m = (p.get('date') || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const [y, mo, d] = m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
    const bd = new Date(Date.UTC(y, mo - 1, d)), now = new Date();
    const todayU = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    if (!m || bd.getUTCMonth() !== mo - 1 || bd.getUTCDate() !== d || bd.getTime() > todayU) {
        $('displayFormattedDate').textContent = 'No valid birthday selected';
        $('introPassage').innerHTML = 'Please <a href="index.html">choose a date of birth</a> to begin.';
        return;
    }
    const formatted = new Date(y, mo - 1, d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const dow = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][bd.getUTCDay()];
    const daysLived = Math.floor((todayU - bd.getTime()) / 864e5);
    let age = now.getFullYear() - y;
    if (now.getMonth() + 1 < mo || (now.getMonth() + 1 === mo && now.getDate() < d)) age--;
    let nb = Date.UTC(now.getFullYear(), mo - 1, d);
    if (nb < todayU) nb = Date.UTC(now.getFullYear() + 1, mo - 1, d);
    $('displayFormattedDate').textContent = formatted;
    if (name) { document.title = `${name}’s Day — DayOne`; $('celeSub').textContent = `The Day the World Welcomed ${name}`; }
    $('statAge').textContent = age;
    $('statDaysLived').textContent = daysLived.toLocaleString();
    $('statDayOfWeek').textContent = dow;
    $('statNextBirthday').textContent = Math.round((nb - todayU) / 864e5);
    const zodiac = getZodiacSign(mo, d), chineseZodiac = getChineseZodiac(y, mo, d), mp = moonPhase(y, mo, d);
        $('statGeneration').textContent = getGeneration(y);
    renderLife(y, mo, d, name);
    renderSky(dow, mp);
    initNav();
    const dq = p.get('date');
    $('giftLink').href = 'gift.html?' + new URLSearchParams({ date: dq, ...(name && { name }), ...(place && { place }) });
    $('cmpLink').href = 'compare.html?' + new URLSearchParams({ a: dq, ...(place && { pa: place }) });

    const loc = await resolvePlace(place);
    $('displayLocation').textContent = !place ? 'Global Historical Archive'
        : loc ? `Birthplace Archive: ${loc.label}` : `${place} (location not found — showing global data)`;
    const season = getSeason(mo, loc ? loc.lat : null), [key, emoji] = SEASONS[season];
    $('page').dataset.season = document.documentElement.dataset.theme || key;
    window.addEventListener('themechange', e => $('page').dataset.season = e.detail);
    $('seasonEmoji').textContent = emoji;
    $('seasonChip').textContent = `${emoji} ${season === 'Equatorial / Tropical' ? 'Tropical climate' : season}`;
    $('introPassage').textContent = `On ${formatted}, the world welcomed ${name || 'your story'}${loc ? ` in ${loc.label}` : ''}. Born on a ${dow}, ` +
        `${key === 'tropical' ? 'in a tropical climate' : 'during ' + season.toLowerCase()}, under the ${zodiac} sign.`;

    // Country stats are slow, so start them now and fill the tiles in as soon as they arrive; nothing else waits on them.
    const hasCountry = !!(loc && loc.cc);
    const statsP = hasCountry ? getStats(loc.cc, y).catch(() => null) : Promise.resolve(null);
    const ctry = hasCountry ? await getCountry(loc.cc) : null;
    const cname = (ctry && ctry.name) || (loc && loc.country) || '';
    const big = n => n >= 1e6 ? (n / 1e6).toFixed(1) + ' million' : Math.round(n).toLocaleString();
    
    const zodiacImgPath = `images/zodiac/${zodiac.toLowerCase()}.png`;
    const baseFacts = [
        ['Day', dow], 
        ['Season', `${emoji} ${key === 'tropical' ? 'Tropical' : season}`], 
        ['World population', worldPop(y)], 
        ['Zodiac', `<div style="display:inline-flex;align-items:center;justify-content:center;gap:6px;"><img src="${zodiacImgPath}" alt="${zodiac}" style="width:20px;height:20px;object-fit:contain;vertical-align:middle;"><span>${zodiac}</span></div>`]
    ];
    const paintFacts = st => { // st: undefined = still loading, null = no data, object = data
        const rows = baseFacts.map(([l, v]) => [l, v, '']);
        if (hasCountry) {
            const none = y < 1960 ? 'Not on record' : 'Unavailable', cell = (v, ok) => st === undefined ? ['…', ' wait'] : ok ? [v, ''] : [none, ' na'];
            const pop = cell(st && st.pop && big(st.pop), !!(st && st.pop)), life = cell(st && st.life && st.life.toFixed(1) + ' yrs', !!(st && st.life));
            rows.push([`${cname || 'Country'} population`, pop[0], pop[1]], ['Life expectancy then', life[0], life[1]]);
        }
        $('facts').innerHTML = rows.map(([l, v, c]) => `<div class="fact${c}"><small>${esc(l)}</small><b>${v}</b></div>`).join('');
    };
    paintFacts(undefined);
    statsP.then(paintFacts);

    await Promise.allSettled([renderWeather(y, mo, d, loc, mp), renderSoundtrack(y, mo, loc, cname, ctry), renderReceipt(y, formatted, loc, ctry), renderHeadlines(y, mo, d, loc, cname, statsP, big), renderDiscover(y, mo, d, age, loc, ctry, zodiac, chineseZodiac)]);
}

function initNav() {
    const links = [...document.querySelectorAll('#rail a')], secs = [...document.querySelectorAll('.chap')];
    const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-35% 0px -55% 0px' });
    const rev = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rev.unobserve(e.target); } }), { threshold: 0.05 });
    secs.forEach(s => { spy.observe(s); rev.observe(s); });
}

function moonSVG(mp) { // draws the real phase: lit shape = half disc + half ellipse
    const f = parseFloat(mp.days) / 29.530588, g = f <= 0.5 ? f : 1 - f, rx = (50 * Math.abs(Math.cos(2 * Math.PI * g))).toFixed(1), sw = g < 0.25 ? 0 : 1;
    return `<svg class="moonsvg" viewBox="0 0 120 120" role="img" aria-label="${mp.name}"><defs><radialGradient id="mgl" cx="38%" cy="35%" r="75%"><stop offset="0" stop-color="#fffef4"/><stop offset="1" stop-color="#f0dca0"/></radialGradient></defs>
        <circle cx="60" cy="60" r="50" fill="#262b52"/><path d="M60 10A50 50 0 0 1 60 110A${rx} 50 0 0 ${sw} 60 10Z" fill="url(#mgl)"${f > 0.5 ? ' transform="translate(120 0) scale(-1 1)"' : ''}/>
        <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="1.5"/></svg>`;
}
function renderSky(dow, mp) {
    const f = parseFloat(mp.days) / 29.530588, chip = (ico, l, v, bar) => `<div class="skchip"><span>${ico}</span><small>${l}</small><b>${v}</b>${bar || ''}</div>`, bar = p => `<em class="bar"><i style="width:${p}%"></i></em>`;
    $('skyBox').innerHTML = `<div class="nightcard"><i class="stars"></i>${moonSVG(mp)}<b>${mp.name}</b><div class="illum"><i style="width:${mp.illum}%"></i></div><small>${mp.illum}% illuminated</small></div>
        <div class="skyr"><div><h3>The Sky Above You</h3><p>The Moon was a ${mp.name.toLowerCase()} when you arrived.</p></div>
        <div class="skchips">${chip('📅', 'Day', dow)}${chip(mp.icon, 'Phase', mp.name)}${chip('💡', 'Illumination', mp.illum + '%', bar(mp.illum))}${chip('⏳', 'Moon age', mp.days + ' days', bar(Math.min(f * 100, 100).toFixed(0)))}</div>
        <div class="sunpath"><svg class="arc" viewBox="0 0 300 112" aria-hidden="true"><defs><radialGradient id="sg"><stop offset="0" stop-color="#fff6c2"/><stop offset="1" stop-color="#ffb83d"/></radialGradient></defs>
        <path class="arc-bg" d="M20 104Q150 -44 280 104"/><path class="arc-fg" pathLength="1" d="M20 104Q150 -44 280 104"/><line class="horizon" x1="6" y1="104" x2="294" y2="104"/><circle class="sunball" cx="150" cy="30" r="10" fill="url(#sg)"/></svg>
        <div class="sun3"><div><small>🌅 Sunrise</small><b id="sky-sunrise">—</b></div><div><small>☀️ Daylight</small><b id="sky-daylight">—</b></div><div><small>🌇 Sunset</small><b id="sky-sunset">—</b></div></div>
        <div class="daybar"><i id="dayseg"></i></div><div class="dbl"><span>12 am</span><span>6 am</span><span>12 pm</span><span>6 pm</span><span>12 am</span></div></div></div>`;
}

async function renderWeather(y, mo, d, loc, mp) {
    const box = $('weatherBox'), F = t => Math.round(t * 9 / 5 + 32);
    const msg = t => box.innerHTML = `<div class="wx"><div class="wx-main"><span class="wx-ico">🌍</span><div><h3>${t}</h3></div></div></div>`;
    if (!loc) return msg('Choose a birthplace to see the weather');
    if (y < 1940) return msg('Weather records begin in 1940');
    const ds = `${y}-${pad(mo)}-${pad(d)}`;
    try {
        const w = (await jget(`https://archive-api.open-meteo.com/v1/archive?latitude=${loc.lat}&longitude=${loc.lon}&start_date=${ds}&end_date=${ds}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,sunrise,sunset,daylight_duration,sunshine_duration&timezone=auto`)).daily;
        const hi = w.temperature_2m_max[0], lo = w.temperature_2m_min[0], [cond, ico] = wmo(w.weather_code[0]);
        const hm = s => s ? new Date(s).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';
        const dl = w.daylight_duration[0], sun = w.sunshine_duration[0];
        box.innerHTML = `<div class="wx"><div class="wx-top"><div class="wx-main"><span class="wx-ico">${ico}</span><div><h3>${cond}</h3><small>Reanalysis data · Open-Meteo / ERA5</small></div></div>
            <div class="wx-temp"><b>${F(hi)}°F <i>/ ${Math.round(hi)}°C</i></b><small>low ${F(lo)}°F · ${Math.round(lo)}°C</small></div></div>
            <div class="wx-row"><div><small>Precipitation</small><b>${(w.precipitation_sum[0] ?? 0).toFixed(1)} mm</b></div><div><small>Wind</small><b>${Math.round(w.windspeed_10m_max[0] ?? 0)} km/h</b></div>
            <div><small>Sunshine</small><b>${sun != null ? (sun / 3600).toFixed(1) + ' h' : '—'}</b></div><div><small>Conditions</small><b>${cond}</b></div></div></div>`;
        $('sky-sunrise').textContent = hm(w.sunrise[0]);
        $('sky-sunset').textContent = hm(w.sunset[0]);
        $('sky-daylight').textContent = dl ? `${Math.floor(dl / 3600)}h ${Math.round(dl % 3600 / 60)}m` : '—';
        const hr = s => { const t = new Date(s); return t.getHours() + t.getMinutes() / 60; }, seg = $('dayseg');
        if (seg && w.sunrise[0] && w.sunset[0]) { const a = hr(w.sunrise[0]), b = hr(w.sunset[0]); seg.style.left = (a / 24 * 100) + '%'; seg.style.width = (Math.max(b - a, 0) / 24 * 100) + '%'; seg.parentElement.classList.add('on'); }
    } catch (e) { msg('Weather for this day is not available'); }
}

async function renderSoundtrack(y, mo, loc, cname, ctry) {
    const box = $('soundtrackContainer'), mon = MONTHS[mo - 1], cy = Math.min(Math.max(y, 1950), new Date().getFullYear() - 1);
    box.innerHTML = '<p class="note">Gathering charts from several archives…</p>';
    const [w, l] = await Promise.all([billboard(cy, mon).catch(() => null), loc ? localChart(y, cname, loc.cc, ctry && ctry.dem, mon).catch(() => null) : null]);
    let local = l && { rows: l.rows, head: `${flag(loc.cc)} Hits in ${cname} in ${y}`, sub: l.kind === 'year' ? `${l.title} · via Wikipedia` : 'National chart · via Wikipedia', title: l.title };
    if (!local) {
        const uk = await ukChart(cy, mon).catch(() => null);
        if (uk) local = { rows: uk.rows, head: `🇬🇧 Chart toppers of ${cy}`, sub: `${loc ? 'No ' + cname + ' chart found · ' : ''}UK Singles Chart #1s`, title: uk.title };
        else if (w && w.rows.length > 10) local = { rows: w.rows.slice(10, 20), head: `🎧 More hits of ${cy}`, sub: 'Billboard Year-End #11–20', title: w.title };
    }
    const wiki_ = t => `https://en.wikipedia.org/wiki/${encodeURIComponent(t.replace(/ /g, '_'))}`;
    const col = (head, sub, c, link, text) => `<div class="col"><h3>${head}</h3><small>${sub}</small><ol>${c ? c.map((s, i) => `
        <li><span class="rk">${i + 1}</span><img data-t="${esc(s.title)}" data-a="${esc(s.artist)}" alt=""><div><b>${esc(s.title)}</b><span>${esc(s.artist)}</span></div></li>`).join('')
        : '<li class="note">No chart found for this one.</li>'}</ol><a href="${link}" target="_blank" rel="noopener">${text} &rarr;</a></div>`;
    box.innerHTML = (y < 1950 ? '<p class="note">Weekly charts began around 1950, so the earliest year on record is shown.</p>' : '') + `<div class="cols">
        ${col(`🌐 Top 10 hits of ${cy}`, 'Billboard Year-End Hot 100 · via Wikipedia', w && w.rows.slice(0, 10), w ? wiki_(w.title) : 'https://www.billboard.com/charts/year-end/', 'Verify the chart')}
        ${col(local ? local.head : `🎧 ${y}`, local ? local.sub : 'Chart unavailable', local && local.rows.slice(0, 10), local ? wiki_(local.title) : `https://en.wikipedia.org/wiki/${y}_in_music`, local ? 'Verify the chart' : `${y} in music`)}</div>`;
    box.querySelectorAll('img[data-t]').forEach(async img => { const u = await cover(img.dataset.t, img.dataset.a); if (u) img.src = u; });
}

async function renderReceipt(y, label, loc, ctry) {
    const box = $('receiptContainer'), cur = ctry && Object.keys(ctry.currencies || {})[0], nowY = new Date().getFullYear();
    let k = 1, code = 'USD', note = 'Average US prices';
    if (loc && loc.cc && loc.cc !== 'US' && cur) {
        const r = `${y - 4}:${y + 4}`, [ppp, fx] = await Promise.all([wb(loc.cc, 'PA.NUS.PPP', r), wb(loc.cc, 'PA.NUS.FCRF', r)]);
        const f = near(ppp, y, 4) ?? near(fx, y, 4);
        if (f) { k = f; code = cur; note = `US benchmark prices converted to ${cur} using purchasing-power data`; }
        else note = `Local currency data isn't available for ${y}, so prices are shown in US dollars`;
    }
    let infl = lerp(CPI, nowY, 1) / lerp(CPI, y, 1), where = 'United States';
    if (code !== 'USD' || (loc && cur === 'USD' && loc.cc !== 'US')) {
        const c = await wb(loc.cc, 'FP.CPI.TOTL', `${Math.max(y, 1960)}:${nowY}`), c0 = near(c, y, 3);
        infl = c0 && c.length ? [...c].sort((a, b) => b.y - a.y)[0].v / c0 : null; where = loc.country;
    }
    const fmt = v => { try { const g = v < 10 ? 2 : 0; return new Intl.NumberFormat('en-US', { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol', minimumFractionDigits: g, maximumFractionDigits: g }).format(v); } catch (e) { return `${code} ${v.toFixed(2)}`; } };
    const items = [['White bread, per lb', 1], ['Whole milk, per gallon', 2], ['Gasoline, per gallon', 3], ['Movie ticket', 4], ['Postage stamp', 5]];
    if (k === 1) items.push(['Federal minimum wage, per hour', 6]);
    let sub = 0;
    const rows = items.map(([n, i]) => { const b = usPrice(Math.max(y, 1900), i); if (b == null) return ''; const v = b * k; if (i !== 6) sub += v;
        return `<div class="ri"><span class="nm">${n}</span><i></i><span class="pr"><b>${fmt(v)}</b>${infl ? `<small>${fmt(v * infl)} today</small>` : ''}</span></div>`; }).join('');
    $('priceScopeTag').textContent = `Estimated · ${code}`;
    box.innerHTML = `<div class="rwrap"><div class="rcpt"><span class="stamp">PAID<br>${y}</span>
        <div class="rhead"><span>✦</span><b>DAYONE GENERAL STORE</b><small>Receipt #${y}${Math.round(sub * 100)} · ${esc(label)}</small></div>
        <div class="rlist">${rows}</div>
        <div class="rtot"><span>TOTAL</span><b>${fmt(sub)}</b></div>${infl ? `<div class="rnow"><span>Same basket today</span><b>${fmt(sub * infl)}</b></div>` : ''}
        <div class="barcode"></div><p class="rthanks">THANK YOU · COME AGAIN</p></div>
        <aside class="rside"><small>Then vs now</small><b class="mult">${infl ? infl.toFixed(1) + '×' : '—'}</b>
        <p>${infl ? `Prices have risen about <b>${infl.toFixed(2)}×</b> since ${y} (${esc(where)}, CPI). Today you need ${infl.toFixed(1)} times the money for the same things.` : 'Inflation data is not available for this year.'}</p>
        <p class="src">${esc(note)}.</p><a href="#" class="copy" id="copyReceipt">📋 Copy receipt</a></aside></div>`;
    $('copyReceipt').onclick = e => { e.preventDefault(); const t = `My DayOne receipt — ${label}\n` + [...box.querySelectorAll('.ri')].map(r => r.textContent.replace(/\s+/g, ' ').trim()).join('\n') + `\nTotal ${fmt(sub)}`;
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => alert('Receipt copied!')).catch(() => alert(t)); };
}

async function renderHeadlines(y, mo, d, loc, cname, statsP, big) {
    const ul = $('eventsListContainer');
    ul.innerHTML = '<li class="note">Reading the history books…</li>';
    const [g, l, stats] = await Promise.all([worldEvents(y, mo, d).catch(() => null), loc && cname ? localEvents(y, mo, d, cname).catch(() => null) : null, statsP]);
    const li = (type, tag, text, link) => `<li class="ev ${type}"><span class="tag">${esc(tag)}</span><p>${esc(text)}</p>${link ? `<a href="${link}" target="_blank" rel="noopener">Source &rarr;</a>` : ''}</li>`;
    let h = '';
    if (g) {
        if (!g.exact) h += `<li class="note">No detailed news log exists for your exact day, so these are notable events on ${MONTHS[mo - 1]} ${d} from other years.</li>`;
        h += g.items.map(it => li('world', g.exact ? 'World news' : `On this date · ${it.year}`, it.text, g.link)).join('');
    } else h += li('world', 'World news', 'Could not load world headlines right now. Please try again later.');
    if (stats) {
        const bits = [stats.pop && `population about ${big(stats.pop)}`, stats.life && `life expectancy ${stats.life.toFixed(1)} years`, stats.gdp && `GDP per person about US$${Math.round(stats.gdp).toLocaleString()}`].filter(Boolean);
        h += li('local', `${cname} at a glance`, `Around ${y}: ${bits.join(', ')}.`, `https://data.worldbank.org/country/${loc.cc}`);
    }
    if (l) h += l.items.map(t => li('local', `${cname} · ${y}`, t, l.link)).join('');
    ul.innerHTML = h;
}

function renderLife(y, mo, d, name) {
    const b = new Date(y, mo - 1, d).getTime(), box = $('lifeBox');
    const V = { orbits: ms => ms / (365.2425 * 864e5), moons: ms => ms / (29.530588 * 864e5), days: ms => ms / 864e5, beats: ms => ms / 6e4 * 72, breaths: ms => ms / 6e4 * 16, sleep: ms => ms / 36e5 / 3, sun: ms => ms / 864e5, steps: ms => ms / 864e5 * 6000 };
    const card = (k, ico, l, s) => `<div class="stat"><span class="ico">${ico}</span><small>${l}</small><b data-k="${k}">0</b><em>${s}</em></div>`;
    box.innerHTML = `<h3 class="big">${name ? esc(name) + ', you' : 'You'}’بre been here for <i data-k="days">0</i> days.</h3><div class="timer" id="lifeTimer">—</div>
        <div class="stats">${card('orbits', '☀️', 'Trips around the sun', 'Complete orbits')}${card('moons', '🌙', 'Full moons since you arrived', 'So far')}${card('days', '✦', 'Days alive', 'And counting')}${card('beats', '♡', 'Heartbeats', 'Approx. at 72 bpm')}
        ${card('breaths', '🌬️', 'Breaths taken', 'Approx. 16 per minute')}${card('sleep', '🛌', 'Hours slept', 'About a third of your life')}${card('sun', '🌅', 'Sunrises you’ve seen', 'One for every day')}${card('steps', '👟', 'Steps walked', 'Approx. 6,000 a day')}</div>
        <p class="note">Based on your birth details. Heartbeats and breaths are estimated and keep ticking live.</p>`;
    const els = [...box.querySelectorAll('[data-k]')], timer = $('lifeTimer');
    const paint = (ease = 1) => { const ms = Date.now() - b; els.forEach(e => e.textContent = Math.floor(V[e.dataset.k](ms) * ease).toLocaleString());
        const n = new Date(); let ly = n.getFullYear(); if (Date.UTC(ly, mo - 1, d) > Date.UTC(ly, n.getMonth(), n.getDate())) ly--;
        timer.textContent = `${ly - y}y ${Math.floor((Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) - Date.UTC(ly, mo - 1, d)) / 864e5)}d ${n.toTimeString().slice(0, 8)}`; };
    paint(0);
    new IntersectionObserver((es, o) => { if (!es[0].isIntersecting) return; o.disconnect(); let t0;
        const step = ts => { t0 = t0 ?? ts; const p = Math.min((ts - t0) / 2200, 1); paint(1 - Math.pow(1 - p, 3)); if (p < 1) requestAnimationFrame(step); else setInterval(paint, 120); };
        requestAnimationFrame(step); }, { threshold: 0.3 }).observe(box);
}

/* ---------- Discover: star, famous birthdays, films, numbers ---------- */
const STARS = [['Alpha Centauri',4.4,'Centaurus'],['Sirius',8.6,'Canis Major'],['Procyon',11.5,'Canis Minor'],['Altair',16.7,'Aquila'],['Vega',25,'Lyra'],['Fomalhaut',25.1,'Piscis Austrinus'],['Pollux',34,'Gemini'],['Arcturus',37,'Boötes'],
    ['Capella',43,'Auriga'],['Castor',51,'Gemini'],['Aldebaran',65,'Taurus'],['Regulus',79,'Leo'],['Alioth',82,'Ursa Major'],['Algol',90,'Perseus'],['Dubhe',123,'Ursa Major'],['Alphard',177,'Hydra'],['Spica',250,'Virgo']];
async function renderDiscover(y, mo, d, age, loc, ctry, zodiac, chineseZodiac) {
    const fill = (id, h) => { $(id).querySelector('.dbody').innerHTML = h; }, ext = (u, t) => `<a class="more" href="${u}" target="_blank" rel="noopener">${t} &rarr;</a>`;
    $('dSkySub').textContent = `The famous people born on ${MONTHS[mo - 1]} ${d}.`;
    const st = STARS.reduce((a, b) => Math.abs(b[1] - age) < Math.abs(a[1] - age) ? b : a);
    fill('dStar', `<div class="bigstar">★</div><b class="sname">${st[0]}</b><p class="small">${st[2]} · ${st[1]} light-years away. At ${age}, you are about as old as this star is far, in light-years. The light you see from it tonight left around ${Math.round(NOWY - st[1])}${Math.abs(NOWY - st[1] - y) <= 2 ? ', right around the year you were born' : ''}.</p>`);
    
    const zodiacMeta = {
        Aries:['Mar 21 – Apr 19','Fire','Often linked with initiative, energy, and a pioneering spirit.'], Taurus:['Apr 20 – May 20','Earth','Often linked with patience, steadiness, and an eye for beauty.'],
        Gemini:['May 21 – Jun 20','Air','Often linked with curiosity, quick wit, and a love of conversation.'], Cancer:['Jun 21 – Jul 22','Water','Often linked with empathy, imagination, and a strong sense of home.'],
        Leo:['Jul 23 – Aug 22','Fire','Often linked with warmth, confidence, and generous creativity.'], Virgo:['Aug 23 – Sep 22','Earth','Often linked with thoughtfulness, precision, and practical care.'],
        Libra:['Sep 23 – Oct 22','Air','Often linked with harmony, diplomacy, and a feel for design.'], Scorpio:['Oct 23 – Nov 21','Water','Often linked with focus, resourcefulness, and emotional depth.'],
        Sagittarius:['Nov 22 – Dec 21','Fire','Often linked with optimism, independence, and a taste for discovery.'], Capricorn:['Dec 22 – Jan 19','Earth','Often linked with ambition, discipline, and lasting devotion.'],
        Aquarius:['Jan 20 – Feb 18','Air','Often linked with originality, independence, and big ideas.'], Pisces:['Feb 19 – Mar 20','Water','Often linked with imagination, compassion, and artistic sensitivity.']
    };
    const animalIcons = { Rat:'🐀', Ox:'🐂', Tiger:'🐅', Rabbit:'🐇', Dragon:'🐉', Snake:'🐍', Horse:'🐎', Goat:'🐐', Monkey:'🐒', Rooster:'🐓', Dog:'🐕', Pig:'🐖' };
    const animalNotes = { Rat:'Resourceful and observant in traditional readings.', Ox:'Steady, patient, and dependable in traditional readings.', Tiger:'Bold, energetic, and independent in traditional readings.', Rabbit:'Gentle, perceptive, and diplomatic in traditional readings.', Dragon:'Confident, imaginative, and ambitious in traditional readings.', Snake:'Thoughtful, intuitive, and composed in traditional readings.', Horse:'Lively, independent, and adventurous in traditional readings.', Goat:'Creative, considerate, and calm in traditional readings.', Monkey:'Inventive, curious, and quick-witted in traditional readings.', Rooster:'Perceptive, expressive, and detail-minded in traditional readings.', Dog:'Loyal, sincere, and protective in traditional readings.', Pig:'Warm, generous, and optimistic in traditional readings.' };
    const elementNotes = { Wood:'growth and creativity', Fire:'energy and expression', Earth:'stability and patience', Metal:'focus and resolve', Water:'intuition and adaptability' };
    
    const zodiacArt = (src, alt) => `<div class="astro-art"><img src="${src}" alt="${alt}"></div>`;
    const [zodiacDates, zodiacElement, zodiacDescription] = zodiacMeta[zodiac];
    
    fill('dZodiac', `${zodiacArt(`images/zodiac/${zodiac.toLowerCase()}.png`, `${zodiac} zodiac emblem`)}<b class="sname">${zodiac}</b><small class="astro-meta">${zodiacElement} sign · ${zodiacDates}</small><p class="small">${zodiacDescription} In Western astrology, the twelve signs mark sections of the year-long path of the Sun. These are traditional associations, not scientific personality measures.</p>`);
    fill('dChinese', `${zodiacArt(`images/chinesezodiac/${chineseZodiac.animal.toLowerCase()}.png`, `${chineseZodiac.animal} Chinese zodiac emblem`)}<b class="sname">${chineseZodiac.element} ${chineseZodiac.animal}</b><small class="astro-meta">${chineseZodiac.element} element · ${chineseZodiac.animal} year</small><p class="small">The Chinese zodiac pairs one of twelve animals with a five-element cycle. ${animalNotes[chineseZodiac.animal]} ${chineseZodiac.element} is traditionally associated with ${elementNotes[chineseZodiac.element]}. Lunar New Year falls on a different date each year.</p>`);
    
    const ps = [
        jget(`https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/births/${pad(mo)}/${pad(d)}`).then(r => {
            const p = (r.births || []).filter(x => x.pages && x.pages[0] && x.pages[0].thumbnail).sort((a, b) => Math.abs(a.year - y) - Math.abs(b.year - y)).slice(0, 6);
            fill('dSky', p.length ? `<div class="people">${p.map(x => { const g = x.pages[0]; return `<a class="person" href="${g.content_urls.desktop.page}" target="_blank" rel="noopener"><img src="${g.thumbnail.source}" alt=""><div><b>${esc(g.titles.normalized)}</b><span>${x.year} · ${esc(g.description || '')}</span></div></a>`; }).join('')}</div>` : '<p class="note">No famous birthdays found for this date.</p>');
        }).catch(() => fill('dSky', '<p class="note">Could not load birthdays right now.</p>')),
        filmsOf(y).then(f => fill('dFilm', (f ? `<ol class="mini">${f.slice(0, 5).map((x, i) => `<li><span>${i + 1}</span><div><b>${esc(x.title)}</b><small>${esc(x.gross || x.studio)}</small></div></li>`).join('')}</ol>` : `<p class="note">No box-office table was found for ${y}.</p>`) +
            ext(`https://en.wikipedia.org/wiki/${y}_in_film`, `${y} in film`) + ' ' + ext(`https://en.wikipedia.org/wiki/${y}_in_television`, 'TV that year'))),
        (async () => {
            const has = loc && loc.cc, cc = has ? loc.cc : 'WLD', r = `${y - 3}:${y + 3}`, cur = ctry && Object.keys(ctry.currencies || {})[0];
            const [life, fert, net, gdp, fx] = await Promise.all([wb(cc, 'SP.DYN.LE00.IN', r), wb(cc, 'SP.DYN.TFRT.IN', r), wb(cc, 'IT.NET.USER.ZS', r), wb(cc, 'NY.GDP.PCAP.CD', r), has ? wb(cc, 'PA.NUS.FCRF', r) : []]);
            const v = (a, f) => { const n = near(a, y, 3); return n != null ? f(n) : null; };
            const t = [['World population', worldPop(y)], ['Life expectancy', v(life, n => n.toFixed(1) + ' yrs')], ['Children per woman', v(fert, n => n.toFixed(1))], ['Internet users', v(net, n => n.toFixed(1) + '%')],
                ['GDP per person', v(gdp, n => 'US$' + Math.round(n).toLocaleString())], ['Exchange rate', cur && v(fx, n => `US$1 = ${n.toFixed(2)} ${cur}`)]].filter(x => x[1]);
            fill('dNum', `<p class="sub">${esc(has ? loc.country : 'World')} · ${y}</p><div class="mtiles">${t.map(([l, x]) => `<div class="mt"><small>${l}</small><b>${esc(x)}</b></div>`).join('')}</div>`);
        })().catch(() => fill('dNum', '<p class="note">Statistics are unavailable right now.</p>'))
    ];
    await Promise.allSettled(ps);
}