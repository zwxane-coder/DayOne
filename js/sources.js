/* Sources & Accuracy page: renders the source cards and the category filter. */
(function () {
    var S = [
        { n: 'Wikipedia — music charts', c: 'Music', u: 'https://en.wikipedia.org/', t: 'Billboard Year-End lists, UK Singles Chart number ones, national charts and “year in music” pages.', ch: 'Chapter 3 · Explore', a: 'Charts are read from tables Wikipedia editors maintain, so they follow what has been published. Every chart has a “Verify the chart” link.' },
        { n: 'Apple iTunes Search', c: 'Music', u: 'https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/index.html', t: 'Album artwork shown next to each song in the soundtrack.', ch: 'Chapter 3', a: 'Artwork is matched by song title and artist, so a few songs may show a different cover or none.' },
        { n: 'Wikipedia &amp; Wikimedia — news and culture', c: 'News &amp; culture', u: 'https://api.wikimedia.org/', t: 'Current-events pages, monthly pages, “On this day” events, year pages, box-office tables and famous birthdays.', ch: 'Chapter 5 · Discover cards · Explore', a: 'Exact daily news logs exist only for some dates. Otherwise DayOne shows events from the same date in other years and says so.' },
        { n: 'Open-Meteo Historical Weather', c: 'Weather', u: 'https://open-meteo.com/en/docs/historical-weather-api', t: 'Daily weather, temperatures, wind, sunshine, sunrise, sunset and daylight length (ERA5 reanalysis).', ch: 'Chapter 2', a: 'Available from 1940. It is modelled from observations and may differ from a local weather station.' },
        { n: 'Open-Meteo Geocoding', c: 'Places', u: 'https://open-meteo.com/en/docs/geocoding-api', t: 'Turns the birthplace you type into coordinates and a country.', ch: 'All place-based chapters', a: 'If a place cannot be found, DayOne says so and shows global data instead.' },
        { n: 'REST Countries', c: 'Places', u: 'https://restcountries.com/', t: 'Country names, currencies and demonyms.', ch: 'Chapters 3 and 4', a: 'Used to pick the right currency and to search for national charts.' },
        { n: 'World Bank Open Data', c: 'Prices &amp; stats', u: 'https://data.worldbank.org/', t: 'Population, life expectancy, GDP per person, fertility, internet use, inflation, purchasing-power and exchange-rate data.', ch: 'Chapters 1, 4 and 5 · Discover cards · Explore', a: 'Coverage varies by country and year. Values that are missing are left out, not guessed.' },
        { n: 'DayOne reference tables', c: 'Prices &amp; stats', u: 'about.html', t: 'United States benchmark prices (bread, milk, gasoline, movie ticket, stamp, minimum wage), a consumer-price index, world population, a list of nearby stars, and the moon-phase calculation.', ch: 'Chapters 1, 2 and 4 · Explore · Compare', a: 'These are approximations. Prices are national averages estimated between benchmark years, and are labelled “estimated” wherever they appear.' }
    ];
    var cats = ['All'].concat(S.map(function (s) { return s.c; }).filter(function (v, i, a) { return a.indexOf(v) === i; })), cur = 'All';
    var f = document.getElementById('sf'), g = document.getElementById('sg');
    f.innerHTML = cats.map(function (c) { return '<button type="button" class="pill" data-c="' + c + '">' + c + '</button>'; }).join('');
    g.innerHTML = S.map(function (s) {
        var ext = /^https?:/.test(s.u);
        return '<article class="gl src-card" data-c="' + s.c + '"><span class="src-tag">' + s.c + '</span><h3>' + s.n + '</h3><p>' + s.t + '</p>' +
            '<dl><div><dt>Used in</dt><dd>' + s.ch + '</dd></div><div><dt>Good to know</dt><dd>' + s.a + '</dd></div></dl>' +
            '<a href="' + s.u + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + (ext ? 'Visit source' : 'About DayOne') + ' &rarr;</a></article>';
    }).join('');
    function paint() {
        f.querySelectorAll('.pill').forEach(function (b) { b.classList.toggle('on', b.dataset.c === cur); });
        g.querySelectorAll('.src-card').forEach(function (c) { c.classList.toggle('hide', cur !== 'All' && c.dataset.c !== cur); });
    }
    f.addEventListener('click', function (e) { var b = e.target.closest('.pill'); if (!b) return; cur = b.dataset.c; paint(); });
    paint();
})();
