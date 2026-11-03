/* DayOne shared helpers — data sources, charts, prices, moon, seasons. Loaded before each page script. */
const $ = id => document.getElementById(id);
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean = s => s.replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();
const jget = (url, ms = 9000) => { const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
    return fetch(url, { signal: c.signal }).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).finally(() => clearTimeout(t)); };
const wiki = title => jget(`https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&redirects=1&format=json&formatversion=2&origin=*`, 15000)
    .then(d => new DOMParser().parseFromString(d.parse.text, 'text/html'));
const wsearch = q => jget(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=8&format=json&origin=*`).then(d => d.query.search).catch(() => []);
const wb = (cc, ind, range) => jget(`https://api.worldbank.org/v2/country/${cc}/indicator/${ind}?format=json&per_page=200&date=${range}`)
    .then(d => (d[1] || []).filter(x => x.value != null).map(x => ({ y: +x.date, v: x.value }))).catch(() => []);
const near = (arr, y, w) => { const s = [...arr].sort((a, b) => Math.abs(a.y - y) - Math.abs(b.y - y))[0]; return s && Math.abs(s.y - y) <= w ? s.v : null; };
const flag = cc => cc && cc.length === 2 ? String.fromCodePoint(...[...cc.toUpperCase()].map(c => 127397 + c.charCodeAt(0))) : '🌍';
const lerp = (T, y, i) => { y = Math.min(Math.max(y, T[0][0]), T[T.length - 1][0]); const k = T.findIndex(r => r[0] >= y);
    if (T[k][0] === y) return T[k][i]; const a = T[k - 1], b = T[k]; return a[i] == null || b[i] == null ? null : a[i] + (b[i] - a[i]) * (y - a[0]) / (b[0] - a[0]); };
const pad = n => String(n).padStart(2, '0');
const SEASONS = { Winter: ['winter', '❄️'], Spring: ['spring', '🌸'], Summer: ['summer', '☀️'], Autumn: ['autumn', '🍂'], 'Equatorial / Tropical': ['tropical', '🌴'] };

/* ---------- Navigation + reveal ---------- */

/* ---------- Places & countries ---------- */
async function resolvePlace(text) {
    if (!text) return null;
    const parts = text.split(',').map(s => s.trim()).filter(Boolean), hint = parts.slice(1).join(' ').toLowerCase();
    try {
        const r = (await jget(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(parts[0])}&count=10&language=en&format=json`)).results || [];
        const b = (hint && r.find(x => [x.country, x.country_code, x.admin1].some(v => v && hint.includes(v.toLowerCase())))) || r[0];
        if (b) return { lat: b.latitude, lon: b.longitude, cc: b.country_code, country: b.country, label: [b.name, b.admin1, b.country].filter((v, i, a) => v && a.indexOf(v) === i).join(', ') };
    } catch (e) {}
    try {
        const c = (await jget(`https://restcountries.com/v3.1/name/${encodeURIComponent(parts[parts.length - 1])}?fields=cca2,latlng,name`))[0];
        return { lat: c.latlng[0], lon: c.latlng[1], cc: c.cca2, country: c.name.common, label: text };
    } catch (e) { return null; }
}
async function getCountry(cc) {
    try {
        let c = await jget(`https://restcountries.com/v3.1/alpha/${cc}?fields=name,currencies,demonyms`);
        c = Array.isArray(c) ? c[0] : c;
        return { name: c.name.common, currencies: c.currencies || {}, dem: c.demonyms && c.demonyms.eng && c.demonyms.eng.m };
    } catch (e) { return null; }
}
async function getStats(cc, y) {
    const r = `${y - 3}:${y + 3}`;
    const [pop, life, gdp] = await Promise.all([wb(cc, 'SP.POP.TOTL', r), wb(cc, 'SP.DYN.LE00.IN', r), wb(cc, 'NY.GDP.PCAP.CD', r)]);
    const s = { pop: near(pop, y, 3), life: near(life, y, 3), gdp: near(gdp, y, 3) };
    return s.pop || s.life || s.gdp ? s : null;
}

/* ---------- Chapter 2: weather + sky ---------- */
const wmo = c => c === 0 ? ['Clear sky', '☀️'] : c <= 2 ? ['Partly cloudy', '⛅'] : c === 3 ? ['Overcast', '☁️'] : c <= 48 ? ['Foggy', '🌫️'] : c <= 57 ? ['Drizzle', '🌦️'] : c <= 67 ? ['Rain', '🌧️'] : c <= 77 ? ['Snow', '❄️'] : c <= 82 ? ['Rain showers', '🌦️'] : c <= 86 ? ['Snow showers', '🌨️'] : ['Thunderstorm', '⛈️'];
const MOONS = ['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous','Last Quarter','Waning Crescent'], MOON_ICONS = ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'];
function moonPhase(y, m, d) {
    const jd = Date.UTC(y, m - 1, d, 12) / 864e5 + 2440587.5, age = (((jd - 2451550.1) / 29.530588853) % 1 + 1) % 1, i = Math.floor(age * 8 + 0.5) % 8;
    return { name: MOONS[i], icon: MOON_ICONS[i], illum: Math.round((1 - Math.cos(2 * Math.PI * age)) / 2 * 100), days: (age * 29.53).toFixed(1) };
}

/* ---------- Chapter 3: soundtrack (several reference sources) ---------- */
function songsFrom(doc, mon, max = 10) {
    const rows = [...doc.querySelectorAll('table tr')].map(tr => [...tr.children].map(c => clean(c.textContent)));
    const rk = []; let last = '';
    rows.forEach(c => {
        const r = parseInt(c[0]);
        if (/^\d{1,2}(\s*\(\d+\))?$/.test(c[0]) && r >= 1 && r <= max && c.length >= 2 && c[1] && !rk.some(o => o.r === r)) { const a = c.length === 2 ? last : c[2]; last = a; rk.push({ r, title: c[1].replace(/[“”"]/g, ''), artist: a }); }
    });
    if (rk.length >= 5) return rk.sort((a, b) => a.r - b.r);
    const q = rows.map(c => { const i = c.findIndex(x => /^[“"]/.test(x)); return i < 0 ? null : { title: c[i].replace(/[“”"]/g, ''), artist: c[i + 1] || '', m: c[0] }; }).filter(Boolean);
    const out = [], s = Math.max(0, q.findIndex(o => o.m.includes(mon)) - 1);
    for (const o of q.slice(s)) { if (!out.some(x => x.title === o.title)) out.push(o); if (out.length >= max) break; }
    return out;
}
async function firstChart(titles, mon, max) {
    for (const t of titles) { try { const s = songsFrom(await wiki(t), mon, max); if (s.length >= 5) return { rows: s, title: t }; } catch (e) {} }
    return null;
}
const billboard = (y, mon) => firstChart([`Billboard Year-End Hot 100 singles of ${y}`, `Billboard year-end top 50 singles of ${y}`, `Billboard year-end top 30 singles of ${y}`, `Billboard year-end top singles of ${y}`], mon, 20);
/* Top songs for ANY year: Billboard year-end lists (1946+), then Wikipedia's "{year} in music" ranked table, then its list of popular songs (1920s–30s). */
async function songsOf(y) {
    if (y >= 1946) { const b = await billboard(y, 'January').catch(() => null); if (b) return { rows: b.rows, title: b.title, kind: 'chart' }; }
    const title = `${y} in music`;
    try {
        const doc = await wiki(title), rows = [];
        doc.querySelectorAll('table').forEach(t => {
            if (rows.length) return;
            const tr = [...t.querySelectorAll('tr')], hd = [...(tr[0] ? tr[0].children : [])].map(c => clean(c.textContent).toLowerCase());
            const ir = hd.findIndex(h => /^(rank|no)/.test(h)), it = hd.findIndex(h => /title|song|single|record/.test(h)), ia = hd.findIndex(h => /artist|performer|band/.test(h));
            if (ir < 0 || it < 0) return;
            tr.slice(1).forEach(r => { const c = [...r.children].map(x => clean(x.textContent)), n = parseInt(c[ir]); if (n >= 1 && n <= 10 && c[it] && !rows.some(o => o.r === n)) rows.push({ r: n, title: c[it].replace(/[“”"]/g, ''), artist: ia >= 0 ? c[ia] : '' }); });
        });
        if (rows.length >= 5) return { rows: rows.sort((a, b) => a.r - b.r), title, kind: 'chart' };
        const songs = [];
        doc.querySelectorAll('li').forEach(li => {
            const m = clean(li.textContent).match(/^[“"]\s*([^”"]{2,70}?)\s*[”"]\s*((?:w\.m\.|w\.|m\.|words|music).*)$/i); if (!m) return;
            const by = m[2].split(/\s(?:Introduced|Performed|From|Featured|in the)\b/)[0].replace(/words and music:?|music:?/gi, 'w.m.').split(/(?:^|\s)(?:w\.m\.|w\.|m\.)\s+/).map(s => s.trim().replace(/[,;.]+$/, '')).filter(Boolean).join(' & ');
            if (!songs.some(o => o.title === m[1])) songs.push({ title: m[1], artist: by ? 'by ' + by : '' });
        });
        if (songs.length >= 5) return { rows: pickEvenly(songs, 10), title, kind: 'list' };
    } catch (e) {}
    return null;
}
async function ukChart(y, mon) {
    const t = (await wsearch(`List of UK Singles Chart number ones of ${y}`)).map(r => r.title).filter(t => t.includes(String(y)) && /UK Singles Chart/i.test(t));
    return firstChart(t.slice(0, 3), mon, 10);
}
async function localChart(y, country, cc, dem, mon) {
    if (!country) return null;
    const names = [country, country.split(' ').pop(), { GB: 'UK' }[cc], dem].filter(Boolean).map(s => s.toLowerCase());
    const qs = [`${country} number-one singles ${y}`, `${country} year-end singles chart ${y}`, `${dem || country} singles chart ${y}`, `List of number-one hits ${y} ${country}`, `${country} top songs ${y}`];
    const seen = new Set(), t = (await Promise.all(qs.map(wsearch))).flat().map(r => r.title)
        .filter(t => !seen.has(t) && seen.add(t) && t.includes(String(y)) && /single|chart|hits|number|song/i.test(t) && names.some(n => t.toLowerCase().includes(n)));
    return firstChart(t.slice(0, 5), mon, 10);
}
const cover = (t, a) => new Promise(res => {
    const cb = 'cb' + Math.random().toString(36).slice(2), s = document.createElement('script');
    const done = v => { res(v); s.remove(); delete window[cb]; };
    window[cb] = r => done(r.results && r.results[0] ? r.results[0].artworkUrl100 : null);
    s.onerror = () => done(null);
    s.src = `https://itunes.apple.com/search?term=${encodeURIComponent(a + ' ' + t)}&entity=song&limit=1&callback=${cb}`;
    document.head.appendChild(s); setTimeout(() => done(null), 6000);
});

/* ---------- Chapter 4: prices ---------- */
// US benchmark: year, bread/lb, milk/gal, gasoline/gal, movie ticket, stamp, federal minimum wage
const US = [[1920,.10,.60,.30,.25,.02,null],[1940,.08,.34,.18,.24,.03,.30],[1950,.12,.83,.27,.46,.03,.75],[1960,.20,1.04,.31,.69,.04,1.00],[1970,.24,1.32,.36,1.55,.06,1.60],
    [1980,.51,2.16,1.19,2.69,.15,3.10],[1990,.70,2.78,1.16,4.23,.25,3.80],[2000,.99,2.80,1.51,5.39,.33,5.15],[2005,1.06,3.22,2.30,6.41,.37,5.15],[2010,1.39,3.06,2.79,7.89,.44,7.25],
    [2015,1.43,3.32,2.43,8.43,.49,7.25],[2020,1.40,3.54,2.17,9.16,.55,7.25],[2025,1.75,4.00,3.15,11.30,.73,7.25]];
const CPI = [[1900,8.3],[1913,9.9],[1920,20],[1930,16.7],[1940,14],[1950,24.1],[1960,29.6],[1970,38.8],[1980,82.4],[1990,130.7],[2000,172.2],[2010,218.1],[2020,258.8],[2026,326]];
const usPrice = (y, i) => y >= 1920 ? lerp(US, y, i) : US[0][i] == null ? null : US[0][i] * lerp(CPI, y, 1) / lerp(CPI, 1920, 1);

/* ---------- Chapter 5: headlines ---------- */
async function worldEvents(y, mo, d) {
    const mon = MONTHS[mo - 1], U = u => `https://en.wikipedia.org/wiki/${u}`;
    if (y >= 2001) try {
        const items = [...(await wiki(`Portal:Current events/${y} ${mon} ${d}`)).querySelectorAll('li')].filter(l => !l.querySelector('li')).map(l => clean(l.textContent)).filter(t => t.length > 40).slice(0, 8);
        if (items.length) return { exact: true, items: items.map(text => ({ text })), link: U(`Portal:Current_events/${y}_${mon}_${d}`) };
    } catch (e) {}
    try { // monthly page, e.g. "March 1987" → the section for the day
        const re = new RegExp(`\\b${mon}\\s+${d}\\b|\\b${d}\\s+${mon}\\b`), out = []; let on = false;
        (await wiki(`${mon} ${y}`)).querySelectorAll('h2,h3,h4,li').forEach(el => {
            if (/^H/.test(el.tagName)) { on = re.test(clean(el.textContent)); return; }
            if (on && !el.querySelector('li')) { const t = clean(el.textContent); if (t.length > 40) out.push(t); }
        });
        if (out.length) return { exact: true, items: out.slice(0, 8).map(text => ({ text })), link: U(`${mon}_${y}`) };
    } catch (e) {}
    const ev = (await jget(`https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/events/${pad(mo)}/${pad(d)}`)).events || [];
    const ex = ev.filter(e => e.year === y), pick = ex.length ? ex : [...ev].sort((a, b) => Math.abs(a.year - y) - Math.abs(b.year - y)).slice(0, 6);
    return { exact: ex.length > 0, items: pick.slice(0, 8).map(e => ({ text: e.text, year: e.year })), link: U(`${mon}_${d}`) };
}
async function localEvents(y, mo, d, country) {
    for (const t of [`${y} in ${country}`, `${y} in the ${country}`]) try {
        const doc = await wiki(t), mon = MONTHS[mo - 1], all = [...doc.querySelectorAll('li')].map(l => clean(l.textContent)).filter(x => x.length > 40);
        const day = new RegExp(`^(${d}\\s+${mon}|${mon}\\s+${d})\\b`), inM = new RegExp(`^.{0,20}\\b${mon}\\b`);
        const pick = all.filter(x => day.test(x)).concat(all.filter(x => inM.test(x) && !day.test(x))), items = (pick.length ? pick : all).slice(0, 4);
        if (items.length) return { items, link: `https://en.wikipedia.org/wiki/${encodeURIComponent(t.replace(/ /g, '_'))}` };
    } catch (e) {}
    return null;
}

/* ---------- Chapter 6: life in numbers (live, counting up) ---------- */

/* ---------- Helpers ---------- */
const WORLD = [[1800,.98],[1850,1.26],[1900,1.65],[1910,1.75],[1920,1.86],[1930,2.07],[1940,2.30],[1950,2.54],[1960,3.03],[1970,3.70],[1980,4.45],[1990,5.33],[2000,6.15],[2005,6.54],[2010,6.96],[2015,7.43],[2020,7.84],[2025,8.2]];
const worldPop = y => `~${lerp(WORLD, y, 1).toFixed(2)} Billion`;
function getZodiacSign(m, d) {
    const z = [['Capricorn',19],['Aquarius',18],['Pisces',20],['Aries',19],['Taurus',20],['Gemini',20],['Cancer',22],['Leo',22],['Virgo',22],['Libra',22],['Scorpio',21],['Sagittarius',21],['Capricorn',31]];
    return d <= z[m - 1][1] ? z[m - 1][0] : z[m][0];
}
function getGeneration(y) {
    return y <= 1927 ? 'Greatest Generation' : y <= 1945 ? 'Silent Generation' : y <= 1964 ? 'Baby Boomer' : y <= 1980 ? 'Generation X' : y <= 1996 ? 'Millennial' : y <= 2012 ? 'Generation Z' : 'Generation Alpha';
}
function getChineseZodiac(y, m = 7, d = 1) {
    const animals = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];
    const stems = ['jia','yi','bing','ding','wu','ji','geng','xin','ren','gui'];
    const branches = ['zi','chou','yin','mao','chen','si','wu','wei','shen','you','xu','hai'];
    const elements = ['Wood','Wood','Fire','Fire','Earth','Earth','Metal','Metal','Water','Water'];
    let stem = ((y - 4) % 10 + 10) % 10, branch = ((y - 1900) % 12 + 12) % 12;
    try {
        const parts = new Intl.DateTimeFormat('en-u-ca-chinese', { year: 'numeric' }).formatToParts(new Date(y, m - 1, d));
        const yearName = (parts.find(part => part.type === 'yearName') || {}).value || '';
        const match = yearName.toLowerCase().match(/(jia|yi|bing|ding|wu|ji|geng|xin|ren|gui)[- ](zi|chou|yin|mao|chen|si|wu|wei|shen|you|xu|hai)/);
        if (match) { stem = stems.indexOf(match[1]); branch = branches.indexOf(match[2]); }
    } catch (e) {}
    return { animal: animals[branch], element: elements[stem] };
}
function getSeason(m, lat) {
    if (lat != null && Math.abs(lat) < 15) return 'Equatorial / Tropical';
    const s = ['Winter','Winter','Spring','Spring','Spring','Summer','Summer','Summer','Autumn','Autumn','Autumn','Winter'][m - 1];
    return lat != null && lat < 0 ? { Winter: 'Summer', Summer: 'Winter', Spring: 'Autumn', Autumn: 'Spring' }[s] : s;
}

/* ---------- Extra shared helpers (explore / compare / gift / my-day) ---------- */
const NOWY = new Date().getFullYear();
async function filmsOf(y) { // biggest films of a year (Wikipedia "{year} in film")
    try {
        const out = [];
        (await wiki(`${y} in film`)).querySelectorAll('table tr').forEach(tr => {
            const c = [...tr.children].map(x => clean(x.textContent)), r = parseInt(c[0]);
            if (/^\d{1,2}$/.test(c[0]) && r >= 1 && r <= 10 && c[1] && !out.some(o => o.r === r) && c.some(x => /^\$/.test(x))) out.push({ r, title: c[1], studio: c[2] || '', gross: c.find(x => /^\$/.test(x)) });
        });
        return out.length >= 3 ? out.sort((a, b) => a.r - b.r) : null;
    } catch (e) { return null; }
}
async function weatherOf(loc, y, mo, d) {
    if (!loc || y < 1940) return null;
    const ds = `${y}-${pad(mo)}-${pad(d)}`;
    try {
        const w = (await jget(`https://archive-api.open-meteo.com/v1/archive?latitude=${loc.lat}&longitude=${loc.lon}&start_date=${ds}&end_date=${ds}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`)).daily;
        const [cond, ico] = wmo(w.weather_code[0]);
        return { cond, ico, hi: w.temperature_2m_max[0], lo: w.temperature_2m_min[0], rain: w.precipitation_sum[0] };
    } catch (e) { return null; }
}
function pickEvenly(a, n) { return a.length <= n ? a : Array.from({ length: n }, (_, i) => a[Math.floor(i * a.length / n)]); }
async function yearPage(y) { // events + science/technology items for a whole year
    const scan = doc => { const ev = [], tech = []; let cur = '';
        doc.querySelectorAll('h2,h3,li').forEach(el => {
            if (/^H/.test(el.tagName)) { cur = clean(el.textContent); return; }
            if (el.querySelector('li') || /birth|death|nobel|sport|see also|reference|further|external|notes/i.test(cur)) return;
            const t = clean(el.textContent); if (t.length < 40 || t.length > 300) return;
            (/science|technol|invention/i.test(cur) ? tech : ev).push(t);
        });
        return { ev, tech }; };
    let a = { ev: [], tech: [] }, b = { ev: [], tech: [] };
    try { a = scan(await wiki(String(y))); } catch (e) {}
    if (a.tech.length < 3) try { b = scan(await wiki(`${y} in science`)); } catch (e) {}
    return { events: pickEvenly(a.ev, 8), tech: pickEvenly(a.tech.length >= 3 ? a.tech : b.ev.concat(a.tech), 6) };
}
function placeSuggest(i, l) { // birthplace autocomplete for any <input list>
    let t;
    i.addEventListener('input', () => { clearTimeout(t); const q = i.value.split(',')[0].trim(); if (q.length < 2) return;
        t = setTimeout(() => jget(`https://geocoding-api.open-meteo.com/v1/search?count=8&language=en&name=${encodeURIComponent(q)}`).then(d => {
            l.innerHTML = (d.results || []).map(p => `<option value="${esc([p.name, p.admin1, p.country].filter((v, k, a) => v && a.indexOf(v) === k).join(', '))}">`).join('');
        }).catch(() => {}), 250); });
}
