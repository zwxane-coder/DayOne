/* Certificate of History — drawn on a canvas so it can be downloaded or printed. */
const CERT = {
    spring: { bg: ['#FFF7F9', '#FDE6EE'], ink: '#2D2524', ac: '#B03A68', gold: '#F4C9A8', soft: '#FBD3DF' },
    summer: { bg: ['#FFF9EC', '#FBEAC2'], ink: '#2D2524', ac: '#B4572B', gold: '#E8C25A', soft: '#F8DDB0' },
    autumn: { bg: ['#FCF4EA', '#F0D3B5'], ink: '#33241C', ac: '#7A2E22', gold: '#C99A3C', soft: '#EBC7A8' },
    winter: { bg: ['#F1FAFD', '#D5EEF8'], ink: '#2D2524', ac: '#0B6A94', gold: '#BFE3F0', soft: '#C9EAF5' },
    tropical: { bg: ['#FCFBEA', '#E8F6CF'], ink: '#2D2524', ac: '#278A3C', gold: '#F2C94C', soft: '#E4F3B5' },
    rainy: { bg: ['#07080F', '#0D1024'], ink: '#E8EBFA', ac: '#B9C3FF', gold: '#8E98D8', soft: '#1C2142', muted: '#A3A9CC' },
    cloudy: { bg: ['#FFFFFF', '#F3F7FB'], ink: '#263447', ac: '#47678C', gold: '#FFEFC2', soft: '#EAF0F7' }
};
function wrapText(x, text, cx, y, maxW, lh, maxLines = 2) {
    let line = '', lines = [];
    text.split(' ').forEach(w => { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    lines.push(line);
    if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/\s?\S*$/, '…'); }
    lines.forEach((l, i) => x.fillText(l, cx, y + i * lh));
}
async function drawCertificate(cv, d, key) {
    const T = CERT[key] || CERT.spring, W = cv.width = 1600, H = cv.height = 1130, x = cv.getContext('2d');
    const serif = '"Playfair Display", Georgia, serif', sans = 'Inter, Arial, sans-serif', muted = T.muted || '#756C67';
    try { await Promise.all([document.fonts.load('700 80px "Playfair Display"'), document.fonts.load('italic 400 30px "Playfair Display"'), document.fonts.load('600 20px Inter')]); } catch (e) {}
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, T.bg[0]); g.addColorStop(1, T.bg[1]); x.fillStyle = g; x.fillRect(0, 0, W, H);
    [[220, 180, 280], [1400, 960, 340]].forEach(([cx, cy, r]) => { const rg = x.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, T.soft + 'cc'); rg.addColorStop(1, T.soft + '00'); x.fillStyle = rg; x.fillRect(0, 0, W, H); });
    x.strokeStyle = T.ac; x.lineWidth = 6; x.strokeRect(36, 36, W - 72, H - 72);
    x.strokeStyle = T.gold; x.lineWidth = 2; x.strokeRect(58, 58, W - 116, H - 116);
    [[58, 58, 1, 1], [W - 58, 58, -1, 1], [58, H - 58, 1, -1], [W - 58, H - 58, -1, -1]].forEach(([cx, cy, sx, sy]) => {
        x.fillStyle = T.gold; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + sx * 50, cy); x.lineTo(cx, cy + sy * 50); x.fill();
        x.fillStyle = T.bg[0]; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + sx * 28, cy); x.lineTo(cx, cy + sy * 28); x.fill(); });
    x.textAlign = 'center';
    const C = (t, y, font, col, ls = 0) => { x.font = font; x.fillStyle = col; x.letterSpacing = ls + 'px'; x.fillText(t, W / 2, y); x.letterSpacing = '0px'; };
    C('DAY ONE · A CELEBRATION OF LIFE', 135, `600 21px ${sans}`, T.ac, 6);
    C('Certificate of History', 215, `700 74px ${serif}`, T.ink);
    C('The day the world welcomed you', 262, `italic 400 30px ${serif}`, T.ac);
    C('THIS CERTIFIES THAT', 325, `600 19px ${sans}`, muted, 5);
    C(d.name, 420, `700 ${d.name.length > 18 ? 78 : 100}px ${serif}`, T.ac);
    x.fillStyle = T.gold; x.fillRect(W / 2 - 220, 445, 440, 3);
    C('was born on', 495, `italic 400 28px ${serif}`, muted);
    C(d.date, 555, `700 52px ${serif}`, T.ink);
    C(d.place || 'Global Historical Archive', 603, `500 25px ${sans}`, T.ac);
    const row = (items, yy) => { const cw = (W - 240) / items.length;
        items.forEach(([l, v], i) => { const cx = 120 + cw * i + cw / 2;
            x.font = `600 14px ${sans}`; x.fillStyle = muted; x.letterSpacing = '3px'; x.fillText(l.toUpperCase(), cx, yy); x.letterSpacing = '0px';
            x.font = `700 25px ${serif}`; x.fillStyle = T.ink; wrapText(x, v, cx, yy + 38, cw - 36, 30);
            if (i) { x.fillStyle = T.soft; x.fillRect(120 + cw * i, yy - 20, 2, 80); } }); };
    row(d.facts, 668); row(d.facts2, 790);
    if (d.headline) { x.font = `italic 400 23px ${serif}`; x.fillStyle = T.ink; wrapText(x, '“' + d.headline + '”', W / 2, 910, 1100, 31); }
    if (d.msg) { x.font = `500 23px ${sans}`; x.fillStyle = T.ac; wrapText(x, d.msg, W / 2, 985, 900, 31); }
    C('dayone · “The world before you. The day you arrived.”', 1070, `500 17px ${sans}`, muted, 2);
    const sg = x.createRadialGradient(W - 200, H - 170, 8, W - 200, H - 170, 72); sg.addColorStop(0, T.bg[0]); sg.addColorStop(1, T.gold);
    x.fillStyle = sg; x.beginPath(); x.arc(W - 200, H - 170, 70, 0, 7); x.fill(); x.strokeStyle = T.ac; x.lineWidth = 3; x.beginPath(); x.arc(W - 200, H - 170, 58, 0, 7); x.stroke();
    C('✦', H - 156, `700 52px ${serif}`, T.ac);
}
