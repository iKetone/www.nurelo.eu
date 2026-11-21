# Erzeugt je Kachelart (st, am, hn) die Fläche als SVG-Daten-URI für styles.css (Abschnitt „Kacheln im Stil der Landschaft“).
# Bewusst ohne Körnung (feTurbulence): Safari berechnet den Filter bei jeder Größenänderung neu, die Hero-Kacheln skalieren in jedem Bild.
# Aufruf: python3 tools/tile-faces.py <Ordner für die SVG-Vorschauen>  -> gibt die drei CSS-Regeln aus
import sys
def hx(h): h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
def mix(a, b, p):  # color-mix(in srgb, a p, b)
    A, B = hx(a), hx(b)
    return '#' + ''.join(f'{min(255, int(x * p + y * (1 - p) + 0.5)):02x}' for x, y in zip(A, B))
P = dict(olive='#7a734a', ochre='#c59045', terra='#bf6d47', terra_d='#9e4e2e', cream='#f2eadd', ink='#241b14')
KIND = {
  'st': dict(c=P['olive'], back=mix(P['olive'], P['ink'], .72), front=P['ochre']),
  'am': dict(c=P['ochre'], back=mix(P['terra'], P['ochre'], .70), front=P['terra_d']),
  'hn': dict(c=P['terra'], back=mix(P['terra_d'], P['ink'], .72), front='#2a2018'),
}
def fir(x, base, h):
    w = h * 0.62
    return (f"<path d='M{x} {base - h:.1f}L{x + w*0.34:.1f} {base - h*0.5:.1f}H{x + w*0.2:.1f}L{x + w/2:.1f} {base - h*0.08:.1f}"
            f"H{x - w/2:.1f}L{x - w*0.2:.1f} {base - h*0.5:.1f}H{x - w*0.34:.1f}Z'/><rect x='{x - .7:.1f}' y='{base - h*0.1:.1f}' width='1.4' height='{h*0.16:.1f}'/>")
def tree(x, base, r):
    return f"<circle cx='{x}' cy='{base - r*1.9:.1f}' r='{r}'/><rect x='{x - .7:.1f}' y='{base - r*1.4:.1f}' width='1.4' height='{r*1.5:.1f}'/>"
def house(x, base, w):
    h = w * 0.62
    return f"<path d='M{x} {base}V{base - h:.1f}L{x + w/2:.1f} {base - h - w*0.42:.1f}L{x + w} {base - h:.1f}V{base}Z'/>"
BACK = {
  'st': "M0 74C16 66 34 66 52 71S84 66 100 62V100H0Z",
  'am': "M0 70C14 66 30 72 48 70S80 62 100 66V100H0Z",
  'hn': "M0 68C20 63 36 70 56 69S86 64 100 67V100H0Z",
}
FRONT = {
  'st': "<path d='M0 87C22 77 46 80 64 85S88 82 100 79V100H0Z'/>" + tree(20, 84, 5.5) + tree(30, 82, 3.8) + tree(81, 82, 4.6),
  'am': "<path d='M0 86C20 80 42 82 60 86S86 80 100 78V100H0Z'/>" + fir(18, 85, 19) + fir(27, 84, 12) + house(68, 84, 11) + fir(88, 81, 14),
  'hn': "<path d='M0 85C22 80 44 83 62 85S86 81 100 80V100H0Z'/>" + house(17, 84, 11) + fir(36, 84, 15) + house(62, 85, 10) + fir(84, 82, 18),
}
WINS = {'am': [(73.5, 79.5)], 'hn': [(22.5, 79.5), (67, 81)]}
def svg(k):
    d = KIND[k]
    sky_top = mix(d['c'], P['cream'], .82)
    s = ("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'>"
         f"<linearGradient id='s' x2='0' y2='1'><stop offset='0' stop-color='{sky_top}'/><stop offset='.75' stop-color='{d['c']}'/></linearGradient>"
         "<rect width='100' height='100' fill='url(#s)'/>"
         f"<g fill='{P['cream']}' fill-opacity='.11'><circle cx='50' cy='41' r='28.6'/><circle cx='50' cy='41' r='20.9'/></g>"
         f"<path d='{BACK[k]}' fill='{d['back']}'/>"
         f"<g fill='{d['front']}'>{FRONT[k]}</g>"
         + ''.join(f"<circle cx='{x}' cy='{y}' r='2.1' fill='#ffd98a'/>" for x, y in WINS.get(k, []))
         + "</svg>")
    return s
def uri(s):
    return 'url("data:image/svg+xml,' + s.replace('%', '%25').replace('<', '%3C').replace('>', '%3E').replace('#', '%23').replace('"', '%22') + '")'
if __name__ == '__main__':
    for k in ['st', 'am', 'hn']:
        open(f'{sys.argv[1]}/face-{k}.svg', 'w').write(svg(k))
        print(f".tile.{k} .tile-body {{ background-image: {uri(svg(k))}; }}")
