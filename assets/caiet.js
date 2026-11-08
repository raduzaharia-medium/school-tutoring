/* Caietul Clasei a IV-a · framework comun pentru toate prezentările.
   Pagina conține <main class="deck" id="deck"> cu <section class="slide"> și apelează, după acest fișier:
     Caiet.start({ Q: [...], SORTERS: {...}, ranks: [...] });
   Toate cheile sunt opționale. Ce nu e în framework rămâne în scriptul paginii.

   Cuprinsul: index.html folosește Caiet.materii(), iar <materie>/index.html folosește Caiet.materie(id);
   ambele citesc lista din assets/cuprins.js. Butonul „Cuprins” din lecții duce la pagina materiei.

   Ce face:
   - bara de jos (Cuprins, ←, puncte, contor, →), navigare cu tastele ← → și glisare pe telefon;
   - butoanele .reveal cu data-t (indiciu / răspuns sub butoane);
   - sortările din SORTERS (id → {cats, items:[[text, cheie]], expl});
   - misiunile din Q, în #qhost (tipuri: mcq, num, order, sort), cu 2 puncte din prima și 1 punct cu indiciu;
   - grafică: Caiet.harta (hărți din assets/harti/), Caiet.axa (axa timpului), Caiet.bare (grafice), Caiet.scena3d (3D cu three.js).

   Tipurile de misiuni:
     {t:'mcq',  tags:[], d:'eticheta', q:'întrebarea', o:['variante'], a:indexCorect, h:'indiciu', e:'explicație'}
     {t:'num',  ..., a:numărCorect, u:'unitate (opțional, ex. „ani”)'}
     {t:'order',..., items:['în ordinea corectă']}
     {t:'sort', ..., items:[['text','s'|'n']], labels:{s:'…', n:'…'}}
*/
(function(){
  'use strict';
  var Caiet = window.Caiet = {};

  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
  function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
  function $(id){return document.getElementById(id);}
  Caiet.esc = esc;
  Caiet.shuffle = shuffle;

  /* ---------- bara de navigare și slide-urile ---------- */
  var NO_SWIPE = '.svgwrap,.svgbox,.tblwrap,.three,.scena3d,.harta,.axa,canvas,input,textarea,select';

  function buildBar(){
    if ($('prev')) return;
    var nav = document.createElement('nav');
    nav.className = 'bar';
    nav.setAttribute('aria-label','Navigare prezentare');
    nav.innerHTML =
      '<a class="home" href="' + (Caiet.home || '../index.html') + '" aria-label="Înapoi la cuprins">☰<span> Cuprins</span></a>' +
      '<button class="nav" id="prev" type="button" aria-label="Slide-ul anterior">←</button>' +
      '<div class="dots" id="dots"></div>' +
      '<span class="count" id="count"></span>' +
      '<button class="nav" id="next" type="button" aria-label="Slide-ul următor">→</button>';
    var deck = $('deck');
    deck.parentNode.insertBefore(nav, deck.nextSibling);
  }

  Caiet.deck = function(){
    buildBar();
    var slides = [].slice.call(document.querySelectorAll('.slide'));
    var dots = $('dots'), prev = $('prev'), next = $('next'), count = $('count'), deck = $('deck');
    var cur = 0, listeners = [];
    slides.forEach(function(s,i){
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label','Mergi la slide-ul '+(i+1));
      b.onclick = function(){go(i);};
      dots.appendChild(b);
    });
    function go(i){
      if (i<0 || i>=slides.length) return;
      slides[cur].classList.remove('active'); dots.children[cur].classList.remove('on');
      cur = i;
      slides[cur].classList.add('active'); dots.children[cur].classList.add('on');
      slides[cur].scrollTop = 0;
      prev.disabled = cur===0; next.disabled = cur===slides.length-1;
      count.textContent = (cur+1)+' / '+slides.length;
      listeners.forEach(function(f){f(cur, slides[cur]);});
    }
    prev.onclick = function(){go(cur-1);};
    next.onclick = function(){go(cur+1);};
    document.addEventListener('keydown', function(e){
      var t = e.target && e.target.tagName;
      if (t==='INPUT' || t==='TEXTAREA' || t==='SELECT') return;
      if (e.key==='ArrowRight' || e.key==='PageDown') go(cur+1);
      if (e.key==='ArrowLeft' || e.key==='PageUp') go(cur-1);
    });
    var sx = null;
    deck.addEventListener('touchstart', function(e){
      sx = (e.target.closest && e.target.closest(NO_SWIPE)) ? null : e.touches[0].clientX;
    }, {passive:true});
    deck.addEventListener('touchend', function(e){
      if (sx===null) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 60) go(cur + (dx<0 ? 1 : -1));
      sx = null;
    }, {passive:true});
    slides[0].classList.add('active'); dots.children[0].classList.add('on');
    go(0);
    Caiet.go = go;
    Caiet.current = function(){return cur;};
    Caiet.onSlide = function(f){listeners.push(f);};
    return {go:go};
  };

  /* ---------- butoane indiciu / răspuns (.reveal cu data-t) ---------- */
  Caiet.reveals = function(){
    document.querySelectorAll('.reveal[data-t]').forEach(function(b){
      var hint = b.classList.contains('hint');
      var d = document.createElement('div');
      d.className = 'ans '+(hint?'h':'a'); d.hidden = true;
      d.textContent = (hint?'💡 ':'✅ ')+b.getAttribute('data-t');
      b.parentNode.parentNode.appendChild(d);
      var label = b.textContent;
      b.onclick = function(){d.hidden = !d.hidden; b.textContent = d.hidden ? label : 'Ascunde';};
    });
  };

  /* ---------- sortări pe slide ---------- */
  Caiet.sorters = function(SORTERS){
    Object.keys(SORTERS||{}).forEach(function(id){
      var S = SORTERS[id], host = $(id), fb = $(id+'-fb'), ans = {};
      if (!host) return;
      function build(){
        ans = {}; fb.innerHTML = '';
        host.innerHTML = S.items.map(function(it,i){
          return '<div class="srow" data-i="'+i+'"><span style="font-weight:700">'+it[0]+'</span><div class="seg">'+
            Object.keys(S.cats).map(function(k){return '<button type="button" aria-pressed="false" data-v="'+k+'">'+S.cats[k]+'</button>';}).join('')+
            '</div></div>';
        }).join('');
        host.querySelectorAll('.srow').forEach(function(r){
          var i = r.getAttribute('data-i');
          r.querySelectorAll('button').forEach(function(b){
            b.onclick = function(){
              ans[i] = b.getAttribute('data-v');
              r.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed', x===b?'true':'false');});
              r.classList.remove('ok','bad');
            };
          });
        });
      }
      document.querySelector('[data-check="'+id+'"]').onclick = function(){
        if (Object.keys(ans).length < S.items.length){fb.innerHTML = '<div class="fb h">Alege o variantă pentru fiecare rând.</div>'; return;}
        var n = 0;
        host.querySelectorAll('.srow').forEach(function(r){
          var i = r.getAttribute('data-i'), g = ans[i]===S.items[i][1];
          if (g) n++;
          r.classList.toggle('ok', g); r.classList.toggle('bad', !g);
        });
        fb.innerHTML = '<div class="fb '+(n===S.items.length?'ok':'h')+'"><b>'+n+' din '+S.items.length+'.</b> '+S.expl+'</div>';
      };
      var rs = document.querySelector('[data-reset="'+id+'"]');
      if (rs) rs.onclick = build;
      build();
    });
  };

  /* ---------- misiunile ---------- */
  var RANKS = {
    istorie:   ['Istoric de top','Cronicar','Arhivist','Ucenic de istoric'],
    geografie: ['Explorator de top','Cartograf','Cercetaș','Ucenic de geograf'],
    stiinte:   ['Om de știință','Cercetător','Observator','Ucenic de cercetător'],
    civica:    ['Cetățean de top','Cetățean activ','Cetățean în formare','Ucenic de cetățean']
  };
  var ICONS = ['🏆','⭐','👍','🔍'];
  var MSGS = [
    'Ai făcut legături între lecții ca un adevărat specialist.',
    'Foarte bine! Mai treci o dată prin misiunile la care ai pierdut puncte.',
    'Bun început. Recitește slide-urile lecției, apoi mai încearcă o dată.',
    'Recitește lecția din manual și slide-urile, apoi mai încearcă o dată.'
  ];
  function subject(){
    var m = location.pathname.match(/\/(istorie|geografie|stiinte|civica)\//);
    return (document.body.getAttribute('data-materie')) || (m && m[1]) || 'istorie';
  }

  Caiet.quiz = function(Q, opts){
    opts = opts || {};
    var host = $('qhost'), bar = $('qbar'), sc = $('qscore');
    if (!host || !Q || !Q.length) return;
    var qi = 0, score = 0, MAX = Q.length*2;
    function setScore(){sc.textContent = score+(score===1?' punct':' puncte');}
    function render(){
      bar.style.width = (qi/Q.length*100)+'%';
      if (qi>=Q.length) return finish();
      var q = Q[qi], tries = 0, done = false, hinted = false;
      host.innerHTML = '<div class="qcard"><div class="qtop" style="margin-bottom:6px"><div class="qmeta">'+
        (q.tags||[]).map(function(t){return '<span>'+t+'</span>';}).join('')+(q.d?'<span class="d">'+q.d+'</span>':'')+
        '</div><span style="color:var(--soft);font-weight:800" class="mono">'+(qi+1)+' / '+Q.length+'</span></div><p class="stem">'+esc(q.q)+
        '</p><div id="qbody"></div><div id="qfb"></div><div class="qnav"><button class="act sec" id="qhint" type="button">💡 Indiciu</button><button class="act" id="qnext" type="button" hidden>Misiunea următoare →</button></div></div>';
      var body = $('qbody'), fb = $('qfb'), hint = $('qhint'), nx = $('qnext');
      function showFb(k,txt){fb.innerHTML = '<div class="fb '+k+'">'+txt+'</div>';}
      hint.onclick = function(){hinted = true; showFb('h','💡 '+q.h); hint.hidden = true;};
      nx.onclick = function(){qi++; render();};
      function finishQ(ok){
        done = true;
        var pts = ok ? (tries===0 && !hinted ? 2 : 1) : 0;
        score += pts; setScore();
        showFb(ok?'ok':'no', (ok ? '✅ <b>Corect! +'+pts+(pts===1?' punct':' puncte')+'</b> ' : '🔎 <b>Răspunsul corect:</b> ')+esc(q.e));
        hint.hidden = true; nx.hidden = false;
        nx.textContent = qi===Q.length-1 ? 'Vezi rezultatul →' : 'Misiunea următoare →';
        nx.focus();
      }
      function miss(){
        tries++;
        if (tries>=2) return finishQ(false);
        showFb('no','Nu încă. '+(hinted ? 'Mai citește indiciul și încearcă din nou.' : '💡 '+q.h));
        hinted = true; hint.hidden = true;
      }
      if (q.t==='mcq'){
        body.innerHTML = '<div class="opts">'+q.o.map(function(o,i){return '<button type="button" data-i="'+i+'">'+esc(o)+'</button>';}).join('')+'</div>';
        var bs = body.querySelectorAll('button');
        bs.forEach(function(b){b.onclick = function(){
          if (done) return;
          var i = +b.getAttribute('data-i');
          if (i===q.a){b.classList.add('right'); bs.forEach(function(x){x.disabled = true;}); finishQ(true);}
          else {b.classList.add('wrong'); b.disabled = true; miss(); if (done){bs[q.a].classList.add('right'); bs.forEach(function(x){x.disabled = true;});}}
        };});
      }
      if (q.t==='num'){
        body.innerHTML = '<div class="numrow"><input id="qnum" type="number" inputmode="numeric" aria-label="Răspunsul tău">'+(q.u?'<span style="font-weight:800">'+esc(q.u)+'</span>':'')+'<button class="act" id="qcheck" type="button">Verifică</button></div>';
        var inp = $('qnum'), ck = $('qcheck');
        var chk = function(){
          if (done) return;
          var v = parseFloat(String(inp.value).replace(',','.'));
          if (isNaN(v)){showFb('h','Scrie mai întâi un număr.'); return;}
          if (v===q.a){finishQ(true); ck.disabled = true; inp.disabled = true;}
          else {miss(); if (done){ck.disabled = true; inp.disabled = true;}}
        };
        ck.onclick = chk;
        inp.addEventListener('keydown', function(e){if (e.key==='Enter') chk();});
      }
      if (q.t==='order'){
        var picked = [], shuffled = shuffle(q.items);
        body.innerHTML = '<p style="margin:.2em 0;font-weight:800;color:var(--soft)">De ales:</p><div class="order-pool" id="opool"></div><p style="margin:.6em 0 .2em;font-weight:800;color:var(--soft)">Ordinea ta:</p><div class="order-done" id="odone"></div><div class="qnav" style="justify-content:flex-start"><button class="act sec" id="oreset" type="button">Ia de la capăt</button></div>';
        var pool = $('opool'), dn = $('odone');
        var draw = function(){
          pool.innerHTML = '';
          shuffled.forEach(function(it){
            if (picked.indexOf(it)>-1) return;
            var b = document.createElement('button'); b.type = 'button'; b.textContent = it;
            b.onclick = function(){if (done) return; picked.push(it); draw(); if (picked.length===q.items.length) check();};
            pool.appendChild(b);
          });
          dn.innerHTML = picked.map(function(p){return '<span>'+esc(p)+'</span>';}).join('') || '<span style="opacity:.5">…</span>';
        };
        var check = function(){
          var ok = picked.every(function(p,i){return p===q.items[i];});
          var sp = dn.querySelectorAll('span');
          picked.forEach(function(p,i){sp[i].classList.add(p===q.items[i]?'ok':'bad');});
          if (ok) finishQ(true);
          else {miss(); if (!done) setTimeout(function(){picked = []; draw();}, 1200);}
        };
        $('oreset').onclick = function(){if (done) return; picked = []; draw();};
        draw();
      }
      if (q.t==='sort'){
        var L = q.labels || {s:'scrisă', n:'nescrisă'};
        body.innerHTML = '<div class="sort">'+q.items.map(function(it,i){
          return '<div class="srow" data-i="'+i+'"><span style="font-weight:700">'+esc(it[0])+'</span><div class="seg"><button type="button" aria-pressed="false" data-v="s">'+L.s+'</button><button type="button" aria-pressed="false" data-v="n">'+L.n+'</button></div></div>';
        }).join('')+'</div><div class="qnav" style="justify-content:flex-start"><button class="act" id="scheck" type="button">Verifică sortarea</button></div>';
        var ans = {};
        body.querySelectorAll('.srow').forEach(function(r){
          var i = r.getAttribute('data-i');
          r.querySelectorAll('button').forEach(function(b){b.onclick = function(){
            if (done) return;
            ans[i] = b.getAttribute('data-v');
            r.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed', x===b?'true':'false');});
            r.classList.remove('ok','bad');
          };});
        });
        $('scheck').onclick = function(){
          if (done) return;
          if (Object.keys(ans).length<q.items.length){showFb('h','Alege o variantă pentru fiecare rând.'); return;}
          var ok = true;
          body.querySelectorAll('.srow').forEach(function(r){
            var i = r.getAttribute('data-i'), g = ans[i]===q.items[i][1];
            if (!g) ok = false;
            r.classList.toggle('ok', g); r.classList.toggle('bad', !g);
          });
          if (ok) finishQ(true); else miss();
          if (done) $('scheck').disabled = true;
        };
      }
    }
    function finish(){
      bar.style.width = '100%';
      var p = score/MAX, k = p>=.85 ? 0 : p>=.6 ? 1 : p>=.35 ? 2 : 3;
      var names = opts.ranks || RANKS[subject()] || RANKS.istorie;
      var msg = (opts.messages || MSGS)[k];
      host.innerHTML = '<div class="qcard" style="text-align:center"><div style="font-size:3em">'+ICONS[k]+'</div><p style="margin:0;font-weight:800;color:var(--soft)">Rangul tău</p><p class="rank">'+names[k]+'</p><p class="mono" style="font-weight:800;font-size:1.2em">'+score+' din '+MAX+' puncte</p><p>'+msg+'</p><p style="color:var(--soft);font-size:.9em">2 puncte din prima încercare, fără indiciu · 1 punct cu indiciu sau din a doua încercare</p><button class="act" id="qagain" type="button">Joacă din nou</button></div>';
      $('qagain').onclick = function(){qi = 0; score = 0; setScore(); render();};
    }
    setScore(); render();
  };


  /* =====================================================================
     GRAFICĂ: hărți, axa timpului, grafice cu bare, scene 3D
     ===================================================================== */
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent){
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k]!==undefined && attrs[k]!==null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function host(x){return typeof x==='string' ? (document.getElementById(x) || document.querySelector(x)) : x;}
  Caiet.svg = el;

  /* ---------- hărți ----------
     Necesită fișierul hărții: <script src="../../assets/harti/romania.js"> (sau europa.js, lume.js).
     Caiet.harta('id', {
       map:'romania'|'europa'|'lume',
       fill: function(zona){return culoare;}   // zona = {id, name, prov?}; implicit gri
       info: 'idElement',                        // unde se scrie textul la apăsare
       text: function(zona){return 'html';},     // ce se scrie la apăsare
       labels: [{lon,lat,text}], points:[{lon,lat,text,color}],
       routes: [{pts:[[lon,lat],…], color, text}],
       view: [x,y,w,h]                           // decupaj (zoom) din hartă
     }) → {redraw(opts)} */
  Caiet.proj = function(map, lon, lat){
    var P = Caiet.HARTI[map].proj, r = Math.PI/180;
    return [P.tx + P.k*lon*r, P.ty - P.k*Math.log(Math.tan(Math.PI/4 + lat*r/2))];
  };
  Caiet.harta = function(target, opts){
    var box = host(target), M = Caiet.HARTI[opts.map];
    box.classList.add('harta');
    var api = {};
    function draw(){
      box.innerHTML = '';
      var v = opts.view || [0,0,M.w,M.h];
      var svg = el('svg',{viewBox:v.join(' '),role:'img','aria-label':opts.label||'Hartă'},box);
      var zones = M.judete || M.tari, info = host(opts.info);
      var gz = el('g',{},svg);
      zones.forEach(function(z){
        var f = opts.fill ? opts.fill(z) : null;
        var pth = el('path',{d:z.d,'class':'ar'+(f?' on':''),fill:f||'var(--map-off)',tabindex:opts.text?0:null,'aria-label':z.name},gz);
        if (opts.text){
          var act = function(){
            gz.querySelectorAll('.sel').forEach(function(x){x.classList.remove('sel');});
            pth.classList.add('sel'); gz.appendChild(pth);
            if (info) info.innerHTML = opts.text(z) || '<b>'+z.name+'</b>';
          };
          pth.addEventListener('click', act);
          pth.addEventListener('keydown', function(e){if (e.key==='Enter'||e.key===' '){e.preventDefault(); act();}});
        }
      });
      var k = v[2]/560;   // grosimi și texte proporționale cu decupajul
      (opts.routes||[]).forEach(function(r){
        var d = r.pts.map(function(p,i){var q = Caiet.proj(opts.map,p[0],p[1]); return (i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1);}).join(' ');
        var line = el('path',{d:d,'class':'ruta',stroke:r.color||'var(--red)','stroke-width':3*k,fill:'none','stroke-dasharray':r.dash?(6*k)+' '+(4*k):null},svg);
        if (r.animate !== false){
          var L = line.getTotalLength ? line.getTotalLength() : 0;
          if (L){line.style.strokeDasharray = L; line.style.strokeDashoffset = L; requestAnimationFrame(function(){line.style.transition='stroke-dashoffset 2.2s ease-in-out'; line.style.strokeDashoffset = 0;});}
        }
        var a = r.pts[r.pts.length-1], b = r.pts[r.pts.length-2] || a, pa = Caiet.proj(opts.map,a[0],a[1]);
        el('circle',{cx:pa[0],cy:pa[1],r:4*k,fill:r.color||'var(--red)'},svg);
      });
      (opts.points||[]).forEach(function(pt){
        var q = Caiet.proj(opts.map,pt.lon,pt.lat);
        el('circle',{cx:q[0],cy:q[1],r:(pt.r||4)*k,fill:pt.color||'var(--ink)',stroke:'var(--paper)','stroke-width':1.5*k},svg);
        if (pt.text){var t = el('text',{x:q[0]+7*k,y:q[1]+4*k,'class':'mlabel','font-size':14*k},svg); t.textContent = pt.text;}
      });
      (opts.labels||[]).forEach(function(lb){
        var q = lb.x!==undefined ? [lb.x,lb.y] : Caiet.proj(opts.map,lb.lon,lb.lat);
        var t = el('text',{x:q[0],y:q[1],'class':'mlabel','text-anchor':'middle','font-size':(lb.size||14)*k},svg); t.textContent = lb.text;
      });
      if (opts.after) opts.after(svg, k);
    }
    api.redraw = function(o){for (var x in o) opts[x] = o[x]; draw();};
    draw();
    return api;
  };

  /* ---------- axa timpului ----------
     Caiet.axa('id', {
       from:-3000, to:2026,                      // ani (negativi = î.H.); sau ago:true și ani în urmă
       bands:[{from,to,label,color}],            // perioade (ere, epoci)
       events:[{y, label, info, color}],         // puncte pe care apeși
       views:[{label, from, to}],                // butoane de zoom
       info:'idElement'
     }) */
  function fmtYear(y, ago){
    if (ago){
      if (y>=1e9) return (y/1e9).toLocaleString('ro-RO')+' mld. ani';
      if (y>=1e6) return (y/1e6).toLocaleString('ro-RO')+' mil. ani';
      if (y>=1e3) return (y/1e3).toLocaleString('ro-RO')+' mii ani';
      return y+' ani';
    }
    return y<0 ? (-y)+' î.H.' : String(y);
  }
  Caiet.fmtYear = fmtYear;
  Caiet.axa = function(target, opts){
    var box = host(target); box.classList.add('axa');
    var W = 1000, ago = !!opts.ago;
    var bar = document.createElement('div'); bar.className = 'axa-views';
    var holder = document.createElement('div');
    box.innerHTML = ''; if (opts.views) box.appendChild(bar); box.appendChild(holder);
    var info = host(opts.info);
    var cur = {from:opts.from, to:opts.to};
    function X(y){var a = ago ? -cur.from : cur.from, b = ago ? -cur.to : cur.to, v = ago ? -y : y; return 40 + (v-a)/(b-a)*(W-80);}
    function niceStep(span){var mx = Math.max(3, Math.floor(W/105)), s = Math.pow(10, Math.floor(Math.log10(span/mx))); [1,2,5,10,20,50].some(function(m){if (span/(s*m)<=mx){s*=m; return true;}}); return s;}
    var lastW = 0;
    function draw(){
      W = Math.max(300, holder.clientWidth || box.clientWidth || 0);
      if (!holder.clientWidth && !box.clientWidth) return;   // slide ascuns: desenăm când apare
      lastW = W;
      holder.innerHTML = '';
      var lo = Math.min(cur.from,cur.to), hi = Math.max(cur.from,cur.to);
      var vis = (opts.events||[]).filter(function(e){return e.y>=lo && e.y<=hi;});
      // rânduri de etichete, ca să nu se suprapună
      var rows = [], RW = W<560 ? 96 : 130;
      vis.sort(function(a,b){return X(a.y)-X(b.y);}).forEach(function(e){
        var x = X(e.y), r = 0;
        while (rows[r]!==undefined && Math.abs(x-rows[r]) < RW) r++;
        rows[r] = x; e._row = r;
      });
      var nr = Math.max(1, rows.length), top = 18 + nr*30, H = top + 70;
      var svg = el('svg',{viewBox:'0 0 '+W+' '+H,role:'img','aria-label':opts.label||'Axa timpului'},holder);
      (opts.bands||[]).forEach(function(b){
        var a = Math.max(lo, Math.min(b.from,b.to)), z = Math.min(hi, Math.max(b.from,b.to));
        if (z<=a) return;
        var x1 = X(ago?z:a), x2 = X(ago?a:z), xa = Math.min(x1,x2), w = Math.abs(x2-x1);
        el('rect',{x:xa,y:top-6,width:Math.max(w,1),height:28,rx:6,fill:b.color||'var(--blue)',opacity:.9},svg);
        if (w>70){var t = el('text',{x:xa+w/2,y:top+13,'text-anchor':'middle','class':'band-l'},svg); t.textContent = b.label;}
      });
      el('line',{x1:40,y1:top+30,x2:W-40,y2:top+30,'class':'axa-line'},svg);
      var span = hi-lo, st = niceStep(span), t0 = Math.ceil(lo/st)*st;
      for (var y=t0; y<=hi; y+=st){
        var x = X(y); el('line',{x1:x,y1:top+26,x2:x,y2:top+34,'class':'axa-line'},svg);
        var tl = el('text',{x:x,y:top+52,'text-anchor':'middle','class':'tick'},svg); tl.textContent = y===0&&!ago ? '' : fmtYear(Math.abs(y)===0?0:y, ago);
      }
      if (!ago && lo<0 && hi>0){var x0 = X(0); el('line',{x1:x0,y1:8,x2:x0,y2:top+36,'class':'axa-zero'},svg); var tz = el('text',{x:x0,y:top+66,'text-anchor':'middle','class':'tick'},svg); tz.textContent='anul 1';}
      vis.forEach(function(e){
        var x = X(e.y), yy = 14 + e._row*30;
        el('line',{x1:x,y1:yy+10,x2:x,y2:top+30,'class':'axa-stem'},svg);
        var g = el('g',{'class':'ev',tabindex:0,role:'button','aria-label':e.label},svg);
        el('rect',{x:x-14,y:yy-12,width:28,height:top+44-yy,fill:'transparent'},g);
        el('circle',{cx:x,cy:top+30,r:7,fill:e.color||'var(--red)'},g);
        var anc = x>W-90 ? 'end' : x<90 ? 'start' : 'middle', tx = anc==='end' ? x+8 : anc==='start' ? x-8 : x;
        var t = el('text',{x:tx,y:yy+6,'text-anchor':anc,'class':'ev-l'},g); t.textContent = e.label;
        var act = function(){svg.querySelectorAll('.ev.sel').forEach(function(q){q.classList.remove('sel');}); g.classList.add('sel'); if (info) info.innerHTML = '<b>'+(e.when||fmtYear(e.y, ago))+' · '+e.label+'</b>'+(e.info?'<br>'+e.info:'');};
        g.addEventListener('click', act);
        g.addEventListener('keydown', function(k){if (k.key==='Enter'||k.key===' '){k.preventDefault(); act();}});
      });
    }
    if (opts.views){
      opts.views.forEach(function(v,i){
        var b = document.createElement('button'); b.type = 'button'; b.textContent = v.label; b.setAttribute('aria-pressed', i===0?'true':'false');
        b.onclick = function(){cur = {from:v.from, to:v.to}; bar.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed', x===b?'true':'false');}); draw();};
        bar.appendChild(b);
      });
      cur = {from:opts.views[0].from, to:opts.views[0].to};
    }
    draw();
    if (window.ResizeObserver) new ResizeObserver(function(){var w = holder.clientWidth; if (w && Math.abs(w-lastW)>4) draw();}).observe(holder);
    return {show:function(f,t){cur = {from:f,to:t}; draw();}};
  };

  /* ---------- grafic cu bare ----------
     Caiet.bare('id', {items:[{label, value, color, note}], unit:'%', max:100, source:'text'}) */
  Caiet.bare = function(target, opts){
    var box = host(target); box.classList.add('bare');
    var max = opts.max || Math.max.apply(null, opts.items.map(function(i){return i.value;}));
    box.innerHTML = opts.items.map(function(it){
      var val = (it.text!==undefined ? it.text : it.value.toLocaleString('ro-RO')+(opts.unit||''));
      return '<div class="bar-row"><span class="bar-l">'+it.label+'</span><div class="bar-t"><i style="--w:'+(it.value/max*100)+'%;background:'+(it.color||'var(--blue)')+'"></i><b>'+val+'</b></div>'+(it.note?'<small>'+it.note+'</small>':'')+'</div>';
    }).join('') + (opts.source?'<p class="sursa">Sursa: '+opts.source+'</p>':'');
    // animația pornește când slide-ul devine vizibil
    function go(){box.classList.add('go');}
    if (box.closest('.slide.active')) setTimeout(go,60);
    if (Caiet.onSlide) Caiet.onSlide(function(i,s){if (s.contains(box)) setTimeout(go,60);});
  };

  /* ---------- cercuri concentrice ----------
     Caiet.cercuri('id', {items:[{label, emoji, text, color}], info:'idElement'})   // items de la cel mai mare la cel mai mic */
  Caiet.cercuri = function(target, opts){
    var box = host(target), n = opts.items.length, W = 520, H = 400, cx = W/2, cy = H-10, R = 380;
    box.classList.add('cercuri');
    box.innerHTML = '';
    var svg = el('svg',{viewBox:'0 0 '+W+' '+H,role:'img','aria-label':opts.label||'Cercuri unul în altul'},box), info = host(opts.info);
    opts.items.forEach(function(it,i){
      var r = R*(n-i)/n, g = el('g',{'class':'cerc',tabindex:0,role:'button','aria-label':it.label},svg);
      el('path',{d:'M'+(cx-r)+' '+cy+' A'+r+' '+r+' 0 0 1 '+(cx+r)+' '+cy+' Z',fill:it.color||'var(--blue)',stroke:'var(--paper)','stroke-width':3},g);
      var t = el('text',{x:cx,y:cy-r+(r>60?30:r*.55),'text-anchor':'middle','class':'cerc-l'},g);
      t.textContent = (it.emoji?it.emoji+' ':'')+it.label;
      var act = function(){svg.querySelectorAll('.cerc.sel').forEach(function(q){q.classList.remove('sel');}); g.classList.add('sel'); if (info) info.innerHTML = '<b>'+(it.emoji?it.emoji+' ':'')+it.label+'</b>'+(it.text?' · '+it.text:'');};
      g.addEventListener('click', act);
      g.addEventListener('keydown', function(e){if (e.key==='Enter'||e.key===' '){e.preventDefault(); act();}});
    });
  };

  /* ---------- scenă 3D (three.js din vendor/) ----------
     Caiet.scena3d('id', {setup:function(T, scene, camera, ctx){…}, tick:function(t, dt, ctx){…}, camera:[x,y,z]})
     ctx = {renderer, controls, el}. Desenează doar cât timp slide-ul e vizibil. */
  Caiet.scena3d = function(target, opts){
    var box = host(target), T = window.THREE;
    box.classList.add('scena3d');
    if (!T){box.innerHTML = '<p class="sursa">Modelul 3D nu s-a putut încărca.</p>'; return;}
    var r = new T.WebGLRenderer({antialias:true, alpha:false});
    r.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
    r.setClearColor(opts.background || 0x0B1030);
    box.appendChild(r.domElement);
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(opts.fov||45, 1, .1, 5000);
    var c = opts.camera || [0,6,14]; cam.position.set(c[0],c[1],c[2]);
    var ctl = T.OrbitControls ? new T.OrbitControls(cam, r.domElement) : null;
    if (ctl){ctl.enableDamping = true; ctl.enablePan = false; if (opts.minDistance) ctl.minDistance = opts.minDistance; if (opts.maxDistance) ctl.maxDistance = opts.maxDistance;}
    var ctx = {renderer:r, controls:ctl, el:box, camera:cam, scene:scene};
    if (opts.setup) opts.setup(T, scene, cam, ctx);
    function size(){var w = box.clientWidth, h = box.clientHeight; if (!w||!h) return; r.setSize(w,h,false); cam.aspect = w/h; cam.updateProjectionMatrix();}
    if (window.ResizeObserver) new ResizeObserver(size).observe(box); else window.addEventListener('resize', size);
    size();
    var last = performance.now(), t = 0;
    (function loop(now){
      requestAnimationFrame(loop);
      var dt = Math.min(.05,(now-last)/1000); last = now;
      if (!box.offsetParent) return;          // slide ascuns: nu desenăm
      if (!r.domElement.width) size();
      t += dt;
      if (opts.tick) opts.tick(t, dt, ctx);
      if (ctl) ctl.update();
      r.render(scene, cam);
    })(last);
    return ctx;
  };

  /* ---------- ajutoare 3D ---------- */
  // textura Pământului desenată din contururile din assets/harti/glob.js (fără imagini externe)
  Caiet.globTexture = function(T, opts){
    opts = opts || {};
    var G = Caiet.HARTI && Caiet.HARTI.glob, cv = document.createElement('canvas');
    cv.width = 2048; cv.height = 1024;
    var c = cv.getContext('2d');
    c.fillStyle = opts.ocean || '#2F6FD6'; c.fillRect(0,0,2048,1024);
    if (G && window.Path2D){
      c.scale(2,2);
      c.fillStyle = opts.land || '#5BB06A'; c.fill(new Path2D(G.land));
      c.fillStyle = '#EDF2FF'; c.fillRect(0,0,1024,26); c.fillRect(0,486,1024,26);   // gheața de la poli
      if (opts.romania !== false){c.fillStyle = opts.romaniaColor || '#E2433A'; c.fill(new Path2D(G.romania));}
    }
    var tx = new T.CanvasTexture(cv);
    return tx;
  };
  // poziția pe o sferă de rază r (lat, lon în grade), potrivită cu textura de mai sus
  Caiet.latLon3d = function(T, lat, lon, r){
    var phi = (90-lat)*Math.PI/180, th = (lon+180)*Math.PI/180;
    return new T.Vector3(-r*Math.sin(phi)*Math.cos(th), r*Math.cos(phi), r*Math.sin(phi)*Math.sin(th));
  };
  // etichetă text care stă mereu cu fața spre cameră
  Caiet.label3d = function(T, text, opts){
    opts = opts || {};
    var cv = document.createElement('canvas'), c = cv.getContext('2d'), fs = 44;
    c.font = '800 '+fs+'px "Baloo 2", system-ui, sans-serif';
    var w = Math.ceil(c.measureText(text).width) + 24;
    cv.width = w; cv.height = fs + 20;
    c.font = '800 '+fs+'px "Baloo 2", system-ui, sans-serif';
    c.fillStyle = opts.bg || 'rgba(11,16,48,.75)';
    if (c.roundRect){c.beginPath(); c.roundRect(0,0,w,cv.height,14); c.fill();} else c.fillRect(0,0,w,cv.height);
    c.fillStyle = opts.color || '#fff'; c.textBaseline = 'middle'; c.fillText(text, 12, cv.height/2+2);
    var sp = new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(cv), depthTest:false, transparent:true}));
    var h = opts.size || .6; sp.scale.set(h*w/cv.height, h, 1); sp.renderOrder = 10;
    return sp;
  };

  /* ---------- cuprinsul ----------
     Datele sunt în assets/cuprins.js (Caiet.CUPRINS).
     index.html (rădăcina)      → Caiet.materii(): câte un card pentru fiecare materie.
     <materie>/index.html       → Caiet.materie('istorie'): unitățile și lecțiile materiei. */
  function counts(m){
    var n = {units:m.units.length, lessons:0, recaps:0};
    m.units.forEach(function(u){u.items.forEach(function(it){if (it.r) n.recaps++; else n.lessons++;});});
    return n;
  }
  function plural(n, one, many){return n+' '+(n===1?one:many);}
  function statsHtml(n){
    return '<span>'+plural(n.units,'unitate','unități')+'</span><span>'+plural(n.lessons,'lecție','lecții')+'</span><span>'+plural(n.recaps,'recapitulare','recapitulări')+'</span>';
  }

  Caiet.materii = function(){
    var host = $('subjects'), all = {units:0, lessons:0, recaps:0};
    host.className = 'subjects';
    host.innerHTML = Caiet.CUPRINS.map(function(m){
      var n = counts(m);
      all.units += n.units; all.lessons += n.lessons; all.recaps += n.recaps;
      return '<a class="subjcard" href="'+m.id+'/index.html" style="--accent:'+m.color+';--tint:'+m.tint+'">'+
        '<span class="emo" aria-hidden="true">'+m.emoji+'</span><h2>'+m.name+'</h2><p>'+m.desc+'</p>'+
        '<ul>'+m.units.map(function(u){return '<li>'+u.u+'</li>';}).join('')+'</ul>'+
        '<div class="mini">'+statsHtml(n)+'</div></a>';
    }).join('');
    var st = $('stats');
    if (st) st.innerHTML = '<span>'+plural(Caiet.CUPRINS.length,'materie','materii')+'</span><span>'+plural(all.lessons,'lecție','lecții')+'</span><span>'+plural(all.recaps,'recapitulare','recapitulări')+'</span>';
  };

  Caiet.materie = function(id){
    var m = Caiet.CUPRINS.filter(function(x){return x.id===id;})[0];
    if (!m) return;
    document.title = m.name+' · Caietul Clasei a IV-a';
    document.documentElement.style.setProperty('--accent', m.color);
    var t = $('mtitle'); if (t) t.innerHTML = '<span aria-hidden="true">'+m.emoji+'</span> '+m.name;
    var d = $('mdesc'); if (d) d.textContent = m.desc;
    var st = $('stats'); if (st) st.innerHTML = statsHtml(counts(m));
    var host = $('subjects'), pre = id+'/', h = '';
    m.units.forEach(function(u){
      h += '<section class="unitblock" style="--accent:'+m.color+'"><h2 class="unit">'+u.u+'</h2><div class="cards">';
      u.items.forEach(function(it){
        var f = it.f.indexOf(pre)===0 ? it.f.slice(pre.length) : '../'+it.f;
        h += '<a class="card" href="'+f+'" style="--accent:'+m.color+';--tint:'+m.tint+'"><div class="meta"><span class="lbl">'+it.l+'</span><span class="kind'+(it.r?' rec':'')+'">'+(it.r?'Recapitulare':'Lecție')+'</span></div><h3>'+it.t+'</h3><p>'+it.d+'</p></a>';
      });
      h += '</div></section>';
    });
    host.innerHTML = h;
  };

  /* ---------- pornirea ---------- */
  Caiet.start = function(cfg){
    cfg = cfg || {};
    Caiet.deck();
    Caiet.reveals();
    if (cfg.SORTERS) Caiet.sorters(cfg.SORTERS);
    if (cfg.Q) Caiet.quiz(cfg.Q, cfg);
  };
})();
