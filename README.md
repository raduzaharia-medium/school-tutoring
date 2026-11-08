# Caietul Clasei a IV-a

Site static cu prezentările interactive pentru clasa a IV-a.

## Cum îl deschizi
- **Pe calculator:** dublu-click pe `index.html`. Se deschide în browser, fără nicio instalare.
- **Pe internet (opțional):** urcă tot folderul `site` pe orice găzduire de pagini statice, de exemplu GitHub Pages, Netlify sau Cloudflare Pages. Nu are nevoie de server sau de bază de date.

## Structură
- `index.html`: pagina principală, cu câte un card pentru fiecare materie (`Caiet.materii()`).
- `<materie>/index.html` (istorie, stiinte, geografie, civica): pagina materiei, cu unitățile și lecțiile ei (`Caiet.materie('istorie')`). Butonul „Cuprins” din lecții duce aici.
- `assets/cuprins.js`: lista tuturor materiilor, unităților și lecțiilor. **Pentru o lecție nouă adaugi doar un rând aici**; pagina principală și pagina materiei se actualizează singure.
- `istorie/`, `stiinte/`, `geografie/`, `civica/`: câte un folder pe materie, cu un subfolder pentru fiecare unitate (`unitatea-1/`, `unitatea-2/`…).
- În fiecare unitate: `lectia-N-<subiect>.html` pentru fiecare lecție și `recapitulare.html` pentru recapitularea unității.
- `assets/caiet.css` și `assets/caiet.js`: framework-ul comun (vezi mai jos).
- `vendor/`: biblioteca three.js (licență MIT), folosită pentru modelul 3D de la geografie, ca să meargă și fără internet.

## Bine de știut
- Nimic nu urmărește ce lecții au fost deschise. Fiecare prezentare pornește de la început. Singurul lucru salvat este fișa „Localitatea mea”, de la lecția 4 de istorie, și doar în browserul de pe dispozitivul folosit.
- Fonturile se încarcă de pe Google Fonts. Fără internet, paginile folosesc fonturile calculatorului.
- Fișierele din acest folder sunt singura sursă a prezentărilor.

## Framework-ul comun (`assets/`)
Toate prezentările arată și funcționează la fel, așa că partea comună stă într-un singur loc:

- **`caiet.css`**: culorile (cu temă întunecată automată), fonturile, slide-urile, bara de jos, casetele (`.box`, `.tip`, `.mc` „Manualul spune / Context”, `.q`, `.badge`), grilele (`.grid.g2/.g3/.g4`), sortările și misiunile.
- **`caiet.js`**: creează bara de jos (Cuprins, ←, puncte, →), navigarea cu tastele și glisarea, butoanele de indiciu/răspuns (`.reveal` cu `data-t`), sortările și misiunile cu punctaj și ranguri pe materie.

O pagină nouă are doar conținutul ei și, eventual, câteva stiluri și scripturi proprii:

```html
<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Titlul lecției</title>
<link rel="stylesheet" href="../../assets/caiet.css">
</head>
<body>
<main class="deck" id="deck">
  <section class="slide" aria-label="Copertă">…</section>
  …
  <section class="slide" aria-label="Misiunile">
    <div class="wrap">
      <div class="qtop"><span class="badge" style="background:var(--purple);margin:0">Misiunile lecției</span><span class="score" id="qscore"></span></div>
      <div class="qprog"><i id="qbar"></i></div>
      <div id="qhost"></div>
    </div>
  </section>
</main>
<script src="../../assets/caiet.js"></script>
<script>
(function(){
  var Q=[
    {t:'mcq', tags:['L1'], d:'Gândire', q:'Întrebarea?', o:['a','b','c'], a:1, h:'Indiciul', e:'Explicația'},
    {t:'num', tags:['L1','Matematică'], d:'Matematică', q:'Câți ani…?', a:37, u:'ani', h:'…', e:'…'}
  ];
  Caiet.start({Q:Q});   // opțional: SORTERS:{…}, ranks:[…]
})();
</script>
</body>
</html>
```

Tipuri de misiuni: `mcq` (variante), `num` (număr, cu unitatea opțională `u`), `order` (pui în ordine; `items` în ordinea corectă), `sort` (două categorii, `labels:{s:…, n:…}`). Fiecare are indiciu (`h`) și explicație (`e`).
