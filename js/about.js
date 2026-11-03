/* About page: gentle reveal + counting-up numbers. Needs nothing else. */
(function () {
    document.documentElement.classList.add('js');
    var reveal = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.ab-story,.ab-pillars>article,.ab-steps li').forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 90 + 'ms'; reveal.observe(el); });

    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, box = document.getElementById('abStats');
    function count(el) {
        var to = +el.dataset.to, suf = el.dataset.suffix || '', t0;
        if (reduce || !to) { el.textContent = to + suf; return; }
        (function step(ts) {
            t0 = t0 || ts; var p = Math.min((ts - t0) / 1400, 1);
            el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + (p === 1 ? suf : '');
            if (p < 1) requestAnimationFrame(step);
        })(performance.now());
    }
    new IntersectionObserver(function (es, o) {
        if (!es[0].isIntersecting) return; o.disconnect();
        box.querySelectorAll('b[data-to]').forEach(count);
    }, { threshold: 0.4 }).observe(box);
})();
