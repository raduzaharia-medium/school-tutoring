/* Caietul Clasei a IV-a · framework comun pentru toate prezentările.
   Pagina conține <main class="deck" id="deck"> cu <section class="slide"> și apelează, după acest fișier:
     Caiet.start({ Q: [...], SORTERS: {...}, ranks: [...] });
   Toate cheile sunt opționale. Ce nu e în framework rămâne în scriptul paginii.

   Cuprinsul (index.html) folosește <body class="cuprins"> și Caiet.cuprins(S).

   Ce face:
   - bara de jos (Cuprins, ←, puncte, contor, →), navigare cu tastele ← → și glisare pe telefon;
   - butoanele .reveal cu data-t (indiciu / răspuns sub butoane);
   - sortările din SORTERS (id → {cats, items:[[text, cheie]], expl});
   - misiunile din Q, în #qhost (tipuri: mcq, num, order, sort), cu 2 puncte din prima și 1 punct cu indiciu.

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
  var NO_SWIPE = '.svgwrap,.svgbox,.tblwrap,.three,canvas,input,textarea,select';

  function buildBar(){
    if ($('prev')) return;
    var nav = document.createElement('nav');
    nav.className = 'bar';
    nav.setAttribute('aria-label','Navigare prezentare');
    nav.innerHTML =
      '<a class="home" href="' + (Caiet.home || '../../index.html') + '" aria-label="Înapoi la cuprins">☰<span> Cuprins</span></a>' +
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

  /* ---------- cuprinsul (index.html) ----------
     S = [{name, color, tint, units:[{u:'Unitatea N. Titlu', items:[{f, l, t, d, r}]}]}]
     f = fișierul, l = eticheta („Lecția 1”), t = titlul, d = descrierea, r:1 = recapitulare */
  Caiet.cuprins = function(S){
    var host = $('subjects'), total = 0, recs = 0;
    S.forEach(function(s){
      var sec = document.createElement('section');
      sec.className = 'subject';
      var h = '<div class="subject-head"><h2>'+s.name+'</h2></div>';
      s.units.forEach(function(u){
        h += '<div class="unitblock" style="--accent:'+s.color+'"><h3 class="unit">'+u.u+'</h3><div class="cards">';
        u.items.forEach(function(it){
          total++; if (it.r) recs++;
          h += '<a class="card" href="'+it.f+'" style="--accent:'+s.color+';--tint:'+s.tint+'"><div class="meta"><span class="lbl">'+it.l+'</span><span class="kind'+(it.r?' rec':'')+'">'+(it.r?'Recapitulare':'Lecție')+'</span></div><h3>'+it.t+'</h3><p>'+it.d+'</p></a>';
        });
        h += '</div></div>';
      });
      if (s.note) h += '<p class="note">'+s.note+'</p>';
      sec.innerHTML = h;
      host.appendChild(sec);
    });
    var st = $('stats');
    if (st) st.innerHTML = '<span>'+S.length+' materii</span><span>'+(total-recs)+' lecții</span><span>'+recs+' recapitulări</span>';
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
