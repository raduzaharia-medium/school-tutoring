# Caietul Clasei a IV-a

Site static cu prezentările interactive pentru clasa a IV-a.

## Cum îl deschizi
- **Pe calculator:** dublu-click pe `index.html`. Se deschide în browser, fără nicio instalare.
- **Pe internet (opțional):** urcă tot folderul `site` pe orice găzduire de pagini statice, de exemplu GitHub Pages, Netlify sau Cloudflare Pages. Nu are nevoie de server sau de bază de date.

## Structură
- `index.html`: cuprinsul, pe materii.
- `istorie/`, `stiinte/`, `geografie/`, `civica/`: câte un folder pe materie, cu un subfolder pentru fiecare unitate (`unitatea-1/`, `unitatea-2/`…).
- În fiecare unitate: `lectia-N-<subiect>.html` pentru fiecare lecție și `recapitulare.html` pentru recapitularea unității.
- `vendor/`: biblioteca three.js (licență MIT), folosită pentru modelul 3D de la geografie, ca să meargă și fără internet.

## Bine de știut
- Nimic nu urmărește ce lecții au fost deschise. Fiecare prezentare pornește de la început. Singurul lucru salvat este fișa „Localitatea mea”, de la lecția 4 de istorie, și doar în browserul de pe dispozitivul folosit.
- Fonturile se încarcă de pe Google Fonts. Fără internet, paginile folosesc fonturile calculatorului.
- Fișierele din acest folder sunt singura sursă a prezentărilor.
