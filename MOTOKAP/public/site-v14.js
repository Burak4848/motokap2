/* MOTOKAP V9: file:// is a safe preview; HTTP(S) enables real WA/phone links.
   Önizlemede gerçek WhatsApp/arama açılmaz; gönderilecek mesaj ekranda gösterilir.
   Ölçüm (Pixel vb.) çağrısı YOKTUR — canlı entegrasyonda mevcut runtime.js olayları korunacaktır. */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const WA='905332403888';

  /* ---------- V5 galeriler: fotoğraf sabit, yalnız slayt değişir ---------- */
  $$('.gal').forEach(g=>{
    const track=$('.track',g); if(!track)return;
    const slides=$$('figure',track),n=slides.length;
    slides.forEach(sl=>{const im=$('img',sl);if(im)im.draggable=false});
    track.addEventListener('dragstart',e=>e.preventDefault());
    const dots=$('.dots',g),cnt=$('.count',g),prev=$('.arr.p',g),next=$('.arr.n',g);
    if(dots) dots.innerHTML=Array.from({length:n},()=>'<i></i>').join('');
    let current=0;
    const set=(i)=>{
      current=((i % n)+n)%n;
      slides.forEach((s,j)=>{const on=j===current;s.classList.toggle('is-active',on);
        s.setAttribute('aria-hidden',String(!on));
        const img=$('img[data-lb]',s);if(img){img.tabIndex=on?0:-1;img.setAttribute('aria-hidden',String(!on))}
      });
      if(cnt){cnt.textContent=(current+1)+' / '+n;cnt.setAttribute('aria-live','polite')}
      if(dots)$$('i',dots).forEach((d,j)=>d.classList.toggle('on',j===current));
      if(prev)prev.disabled=n<2;
      if(next)next.disabled=n<2;
      const th=g.dataset.thumbs&&$(g.dataset.thumbs);
      if(th)$$('button',th).forEach((b,j)=>b.setAttribute('aria-current',String(j===current)));
    };
    g._go=set;g._idx=()=>current;
    prev&&prev.addEventListener('click',()=>set(current-1));
    next&&next.addEventListener('click',()=>set(current+1));
    if(n>1){
      track.tabIndex=0;
      track.setAttribute('aria-roledescription','fotoğraf galerisi');
      track.addEventListener('keydown',e=>{
        if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
          e.preventDefault();set(current+(e.key==='ArrowRight'?1:-1));
        }
      });
      // Fare ve parmakla yatay hareket slaytı değiştirir; fotoğrafın pozisyonu hiç değişmez.
      let px=0,py=0,pid=null,down=false,swiping=false,avoidClick=false;
      track.addEventListener('pointerdown',e=>{
        if(e.pointerType==='mouse'&&e.button!==0)return;
        down=true;pid=e.pointerId;px=e.clientX;py=e.clientY;swiping=false;
      });
      track.addEventListener('pointermove',e=>{
        if(!down||e.pointerId!==pid)return;
        if(Math.abs(e.clientX-px)>12&&Math.abs(e.clientX-px)>Math.abs(e.clientY-py)*1.2){
          if(!swiping){
            swiping=true;
            // Desktop/tablet browsers may send pointerup to another element after dragging.
            // Capture only after a real horizontal gesture; normal image clicks remain intact.
            try{track.setPointerCapture(pid)}catch{}
          }
          if(e.pointerType==='mouse')e.preventDefault();
        }
      });
      const endSwipe=e=>{
        if(!down||e.pointerId!==pid)return;
        const dx=e.clientX-px,dy=e.clientY-py;
        if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.25){
          avoidClick=true;
          set(current+(dx<0?1:-1));
          setTimeout(()=>{avoidClick=false},250);
        }
        const releasedPid=pid;
        down=false;pid=null;swiping=false;
        try{if(track.hasPointerCapture(releasedPid))track.releasePointerCapture(releasedPid)}catch{}
      };
      track.addEventListener('pointerup',endSwipe);
      document.addEventListener('pointerup',endSwipe); // drag completion outside the gallery
      track.addEventListener('pointercancel',()=>{down=false;pid=null;swiping=false});
      track.addEventListener('click',e=>{
        if(avoidClick){e.preventDefault();e.stopPropagation()}
      },true);
    }else{prev&&prev.remove();next&&next.remove();dots&&dots.remove();cnt&&cnt.remove()}
    // Gallery itself may have no explicit label on background click; arrows/keyboard work.
    set(0);
  });
  $$('.thumbs').forEach(th=>{
    const g=$('[data-thumbs="#'+th.id+'"]');
    $$('button',th).forEach((b,i)=>b.addEventListener('click',()=>g&&g._go(i)));
  });

  /* ---------- V5 teknik kartlar: fareyle sürükleme, dokunarak kaydırma, oklarla geçiş ---------- */
  $$('#neden .parts,#malzeme .parts').forEach(track=>{
    const section=track.closest('section'),head=$('.head',section),cards=$$('.part',track);
    $$('img',track).forEach(img=>{img.draggable=false});
    track.addEventListener('dragstart',e=>e.preventDefault());
    if(!head||cards.length<2)return;
    const controls=document.createElement('div');controls.className='parts-controls';
    controls.setAttribute('aria-label','Teknik görselleri kaydır');
    controls.innerHTML='<button type="button" class="parts-prev" aria-label="Önceki teknik görsel">‹</button><span class="pages" aria-live="polite">1 / '+cards.length+'</span><button type="button" class="parts-next" aria-label="Sonraki teknik görsel">›</button>';
    head.append(controls);
    const p=$('.parts-prev',controls),n=$('.parts-next',controls),pages=$('.pages',controls);
    const step=()=>cards[1].offsetLeft-cards[0].offsetLeft||cards[0].clientWidth;
    const visible=()=>Math.min(cards.length,Math.max(1,Math.floor((track.clientWidth+18)/step())));
    const idx=()=>Math.max(0,Math.round(track.scrollLeft/Math.max(1,step())));
    const update=()=>{
      const i=idx(), canScroll=track.scrollWidth>track.clientWidth+4;
      p.disabled=!canScroll;n.disabled=!canScroll;
      pages.textContent=(i+1)+' / '+cards.length;
    };
    const go=d=>{
      const end=Math.max(0,track.scrollWidth-track.clientWidth);
      if(end<=4)return;
      const x=track.scrollLeft;
      if(d<0&&x<=4)track.scrollTo({left:end,behavior:'smooth'});
      else if(d>0&&x>=end-4)track.scrollTo({left:0,behavior:'smooth'});
      else track.scrollBy({left:step()*d,behavior:'smooth'});
      setTimeout(update,420);
    };
    p.addEventListener('click',()=>go(-1));n.addEventListener('click',()=>go(1));
    track.addEventListener('scroll',()=>{cancelAnimationFrame(track._raf);track._raf=requestAnimationFrame(update)},{passive:true});
    track.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
      e.preventDefault();go(e.key==='ArrowLeft'?-1:1);
    }});
    track.tabIndex=0;
    let down=false,startX=0,startScroll=0,moved=false,suppress=false,pid=null;
    track.addEventListener('pointerdown',e=>{
      if(e.pointerType!=='mouse'||e.button!==0)return;
      down=true;startX=e.clientX;startScroll=track.scrollLeft;pid=e.pointerId;moved=false;
    });
    track.addEventListener('pointermove',e=>{
      if(!down||e.pointerId!==pid)return;
      const dx=e.clientX-startX;
      if(!moved&&Math.abs(dx)>7){moved=true;track.classList.add('dragging');track.setPointerCapture(pid)}
      if(moved){e.preventDefault();track.scrollLeft=startScroll-dx}
    });
    const done=e=>{
      if(!down)return;down=false;
      if(moved){suppress=true;track.classList.remove('dragging');
        if(pid!==null&&track.hasPointerCapture(pid))track.releasePointerCapture(pid);
        setTimeout(()=>{suppress=false},200);
      }
      pid=null;update();
    };
    track.addEventListener('pointerup',done);track.addEventListener('pointercancel',done);
    track.addEventListener('click',e=>{if(suppress){e.preventDefault();e.stopPropagation()}},true);
    requestAnimationFrame(update);window.addEventListener('resize',update,{passive:true});
  });

  /* ---------- tam ekran görüntüleyici ---------- */
  const lb=$('#lb');
  if(lb){
    const lt=$('.track',lb), cap=$('.cap',lb), prev=$('.prev',lb), next=$('.next',lb);
    let list=[], cur=0, opener=null;
    const label=()=>{cap.textContent=(cur+1)+' / '+list.length+' · '+(list[cur]?.alt||'');prev.disabled=list.length<2;next.disabled=list.length<2};
    let lock=0;
    const hydrate=i=>{for(const j of [i-1,i,i+1]){const im=lt.children[j]?.querySelector('img[data-src]');if(im){im.src=im.dataset.src;delete im.dataset.src;im.loading=j===i?'eager':'lazy'}}};
    const show=(i,smooth)=>{if(!list.length)return;cur=((i%list.length)+list.length)%list.length;hydrate(cur);lock=Date.now()+700;lt.scrollTo({left:cur*lt.clientWidth,behavior:smooth?'smooth':'auto'});label()};
    const open=(grp,el)=>{opener=document.activeElement;list=$$('img[data-lb="'+grp+'"]');
      lt.innerHTML=list.map(im=>'<figure><img data-src="'+(im.dataset.full||im.currentSrc||im.src)+'" width="'+(im.getAttribute('width')||'')+'" height="'+(im.getAttribute('height')||'')+'" alt="'+(im.alt||'').replace(/"/g,'&quot;')+'" decoding="async"></figure>').join('');
      lb.classList.add('open');document.body.classList.add('lb-open');document.documentElement.style.overflow='hidden';
      requestAnimationFrame(()=>{show(Math.max(0,list.indexOf(el)));$('.x',lb).focus()})};
    const close=()=>{lb.classList.remove('open');document.body.classList.remove('lb-open');document.documentElement.style.overflow='';opener&&opener.focus&&opener.focus()};
    document.addEventListener('click',e=>{const im=e.target.closest('img[data-lb]');if(im&&!lb.contains(im)){e.preventDefault();open(im.dataset.lb,im)}});
    document.addEventListener('keydown',e=>{const im=e.target.closest&&e.target.closest('img[data-lb]');if(im&&!lb.contains(im)&&(e.key==='Enter'||e.key===' ')){e.preventDefault();open(im.dataset.lb,im)}});
    $('.x',lb).addEventListener('click',close);
    prev.addEventListener('click',()=>show(cur-1,true));
    next.addEventListener('click',()=>show(cur+1,true));
    const lsync=()=>{if(Date.now()<lock||!list.length)return;cur=Math.round(lt.scrollLeft/Math.max(1,lt.clientWidth));label()};
    lt.addEventListener('scroll',()=>{clearTimeout(lt._s);lt._s=setTimeout(lsync,70)},{passive:true});
    lt.addEventListener('scrollend',lsync,{passive:true});
    // Full-screen photos also wrap when swiping at either end.
    let t0x=0,t0y=0,edgeIndex=0;
    lt.addEventListener('touchstart',e=>{if(!e.touches.length)return;
      t0x=e.touches[0].clientX;t0y=e.touches[0].clientY;edgeIndex=cur;
    },{passive:true});
    lt.addEventListener('touchend',e=>{if(!e.changedTouches.length||list.length<2)return;
      const dx=e.changedTouches[0].clientX-t0x,dy=e.changedTouches[0].clientY-t0y;
      if(Math.abs(dx)<55||Math.abs(dx)<=Math.abs(dy)*1.25)return;
      if(edgeIndex===0&&dx>0)show(list.length-1,false);
      else if(edgeIndex===list.length-1&&dx<0)show(0,false);
    },{passive:true});
    lb.addEventListener('click',e=>{if(e.target===lb||e.target.tagName==='FIGURE')close()});
    document.addEventListener('keydown',e=>{if(!lb.classList.contains('open'))return;
      if(e.key==='Escape')close(); if(e.key==='ArrowRight')show(cur+1,true); if(e.key==='ArrowLeft')show(cur-1,true);
      if(e.key==='Tab'){const f=$$('button',lb);const a=f.indexOf(document.activeElement);if(e.shiftKey&&a<=0){e.preventDefault();f[f.length-1].focus()}else if(!e.shiftKey&&a===f.length-1){e.preventDefault();f[0].focus()}}});
    $$('.zoom').forEach(z=>z.addEventListener('click',()=>{const g=z.closest('.gal');const ims=$$('img[data-lb]',g);open(ims[0].dataset.lb,ims[g._idx?g._idx():0])}));
  }

  /* ---------- mobil menü ---------- */
  const dr=$('#drawer'), mb=$('.menu-btn');
  if(dr&&mb){const set=o=>{dr.classList.toggle('open',o);mb.setAttribute('aria-expanded',String(o));document.documentElement.style.overflow=o?'hidden':'';if(o)$('.x',dr).focus();else mb.focus()};
    mb.addEventListener('click',()=>set(true));$('.x',dr).addEventListener('click',()=>set(false));
    dr.addEventListener('click',e=>{if(e.target===dr||e.target.closest('a'))set(false)});
    document.addEventListener('keydown',e=>{if(!dr.classList.contains('open'))return;
      if(e.key==='Escape'){e.preventDefault();set(false);return}
      if(e.key==='Tab'){
        const f=$$('a[href],button:not([disabled]),input,select,[tabindex]:not([tabindex="-1"])',$('.panel',dr)).filter(x=>x.getClientRects().length>0);
        if(!f.length)return;const first=f[0],last=f[f.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
      }})}

  /* ---------- ilk CTA ile çakışmayı önlemek ---------- */
  const primary=$('.hero')||$('.pdp');
  if(primary&&'IntersectionObserver' in window){
    document.body.classList.add('has-hero-near');
    const io=new IntersectionObserver(entries=>document.body.classList.toggle('has-hero-near',entries[0].isIntersecting),{threshold:0,rootMargin:'0px 0px -72px 0px'});
    io.observe(primary);
  }
  /* ---------- filtre (modeller sayfası) ---------- */
  $$('.chips[data-filter]').forEach(f=>f.addEventListener('click',e=>{const c=e.target.closest('.chip');if(!c)return;
    $$('.chip',f).forEach(x=>x.setAttribute('aria-pressed',String(x===c)));const v=c.dataset.v;
    $$('[data-cat]').forEach(m=>m.hidden=!(v==='all'||m.dataset.cat.split(' ').includes(v)))}));

  /* ---------- Preview mode keeps real external links from opening locally. ---------- */
  const preview = window.location.protocol === 'file:' || document.documentElement.dataset.motokapPreview === 'true';
  const toast=$('#toast');
  const say=t=>{if(!toast)return;toast.textContent='ÖNİZLEME — gerçek WhatsApp açılmaz.\nYayında hazırlanacak mesaj:\n\n'+t;toast.style.display='block';clearTimeout(toast._t);toast._t=setTimeout(()=>toast.style.display='none',7000)};
  const waUrl=t=>'https://wa.me/'+WA+'?text='+encodeURIComponent(t);
  const ORDER_START='Merhaba MOTOKAP, web sitenizden ürünlerinizi inceledim. Sipariş vermek istiyorum.';
  const questionMsg=model=>'Merhaba MOTOKAP, web sitenizde '+model+' modelini inceledim. Ürün hakkında bir sorum var, yardımcı olabilir misiniz?';
  const orderMsg=model=>'Merhaba MOTOKAP, web sitenizde '+model+' modelini inceledim. Bu model için sipariş oluşturmak istiyorum.';
  const msgForKey=k=>{
    const selected=k==='fit'?'':k;
    return ORDER_START+(selected?' İlgilendiğim model: '+selected+'.':'')+' Uygun ölçü ve sipariş detayları hakkında yardımcı olabilir misiniz?';
  };

  /* ---------- kısa model danışma formu ---------- */
  const fitForm=$('#fit-form');
  if(fitForm){
    fitForm.addEventListener('submit',e=>{
      e.preventDefault();
      const motor=($('#fit-motor')?.value||'').trim();
      if(!motor){const field=$('#fit-motor');if(field){field.setCustomValidity('Motosikletinizin marka ve modelini yazın.');field.reportValidity();field.focus()}return}
      const details=($('#fit-details')?.value||'').trim();
      const model=($('#fit-model')?.value||'').trim();
      const msg=ORDER_START+' Motosikletim: '+motor+'. '+(details?'Aksesuar / park alanı: '+details+'. ':'')+(model?'İlgilendiğim model: '+model+'. ':'')+'Motosikletime uygun garaj ölçüsünü ve sipariş detaylarını teyit etmek istiyorum.';
      if(preview){say(msg)}else{window.location.assign(waUrl(msg))}
    });
    $('#fit-motor')?.addEventListener('input',e=>e.target.setCustomValidity(''));
  }

  document.addEventListener('click',e=>{
    const order=e.target.closest('[data-wa-order]');
    if(order){const msg=orderMsg(order.dataset.waOrder);order.href=waUrl(msg);order.target='_blank';order.rel='noopener noreferrer';
      if(preview){e.preventDefault();say(msg)}return;
    }
    const qa=e.target.closest('[data-wa-question]');
    if(qa){const msg=questionMsg(qa.dataset.waQuestion);qa.href=waUrl(msg);qa.target='_blank';qa.rel='noopener noreferrer';
      if(preview){e.preventDefault();say(msg)}return;
    }
    const a=e.target.closest('[data-wa]');
    if(a){const k=a.dataset.wa||'';
      if(k==='fit'){e.preventDefault();const f=$('#fit');if(f)f.scrollIntoView({behavior:'smooth',block:'start'});return}
      // Always keep a working href for people without JavaScript.
      a.href=waUrl(msgForKey(k));
      a.target='_blank';a.rel='noopener noreferrer';
      if(preview){e.preventDefault();say(msgForKey(k))}
      return;
    }
    const c=e.target.closest('[data-call]');
    if(c){c.href='tel:+905332403888';if(preview){e.preventDefault();say('Telefon: 0533 240 38 88')}}
  });
})();


/* V10: gerçek kullanım fotoğrafları için bağımsız yatay galeri. */
(()=>{
 const reel=document.querySelector('#kullanim .reel[data-reel]');
 if(!reel)return;
 const items=[...reel.querySelectorAll('figure')];
 if(items.length<2)return;
 const head=reel.closest('section')?.querySelector('.head');
 if(!head)return;
 const controls=document.createElement('div');controls.className='reel-controls';
 controls.innerHTML='<button type="button" class="reel-prev" aria-label="Önceki müşteri fotoğrafı">‹</button><span class="reel-pos" aria-live="polite">1 / '+items.length+'</span><button type="button" class="reel-next" aria-label="Sonraki müşteri fotoğrafı">›</button>';
 reel.before(controls);
 const prev=controls.querySelector('.reel-prev'),next=controls.querySelector('.reel-next'),pos=controls.querySelector('.reel-pos');
 let active=0;
 const update=()=>{
   const x=reel.scrollLeft, max=Math.max(0,reel.scrollWidth-reel.clientWidth);
   // Use actual slide positions: progress-based indexing skips items on wide screens.
   if(x>=max-4) active=items.length-1;
   else {
     const first=items[0].offsetLeft;let best=Infinity,found=0;
     items.forEach((el,i)=>{const diff=Math.abs((el.offsetLeft-first)-x);if(diff<best){best=diff;found=i;}});
     active=found;
   }
   pos.textContent=(active+1)+' / '+items.length;
   prev.disabled=false;
   next.disabled=false;
 };
 const go=(i)=>{const idx=((i%items.length)+items.length)%items.length;
   const x=items[idx].offsetLeft-items[0].offsetLeft;
   reel.scrollTo({left:x,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
   setTimeout(update,400)};
 prev.addEventListener('click',()=>go(active-1));next.addEventListener('click',()=>go(active+1));
 reel.addEventListener('scroll',()=>{cancelAnimationFrame(reel._r);reel._r=requestAnimationFrame(update)},{passive:true});
 reel.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight') {e.preventDefault();go(active+(e.key==='ArrowLeft'?-1:1));}});
 let mouse=false,startX=0,startScroll=0,pid=null,dragged=false;
 reel.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;mouse=true;pid=e.pointerId;startX=e.clientX;startScroll=reel.scrollLeft;dragged=false;});
 reel.addEventListener('pointermove',e=>{if(!mouse||e.pointerId!==pid)return;let dx=e.clientX-startX;
  if(!dragged&&Math.abs(dx)>7){dragged=true;reel.classList.add('dragging');reel.setPointerCapture(pid)}
  if(dragged){e.preventDefault();reel.scrollLeft=startScroll-dx;}
 });
 function finish(e){
   if(!mouse)return;
   const dx=(e?.clientX??startX)-startX;
   const edgeGap=Math.max(28,Math.min(42,reel.clientWidth*.075));
   const fromFirst=startScroll<=edgeGap,fromLast=startScroll>=reel.scrollWidth-reel.clientWidth-edgeGap;
   mouse=false;reel.classList.remove('dragging');
   if(pid!==null&&reel.hasPointerCapture(pid))reel.releasePointerCapture(pid);
   pid=null;
   if(dragged&&Math.abs(dx)>40&&((fromFirst&&dx>0)||(fromLast&&dx<0)))go(fromFirst?items.length-1:0);
   else if(dragged)setTimeout(update,80);
 }
 reel.addEventListener('pointerup',finish);reel.addEventListener('pointercancel',finish);
 // iOS/Android: doğal kaydırma devam eder; yalnız iki uçta ters yöne kaydırma döngü yapar.
 let tx=0,ty=0,edge=0;
 reel.addEventListener('touchstart',e=>{if(!e.touches.length)return;tx=e.touches[0].clientX;ty=e.touches[0].clientY;edge=reel.scrollLeft<=Math.max(28,Math.min(42,reel.clientWidth*.075))?-1:(reel.scrollLeft>=reel.scrollWidth-reel.clientWidth-Math.max(28,Math.min(42,reel.clientWidth*.075))?1:0)}, {passive:true});
 reel.addEventListener('touchend',e=>{if(!e.changedTouches.length||!edge)return;
   const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;
   if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.3&&((edge===-1&&dx>0)||(edge===1&&dx<0)))
     go(edge===-1?items.length-1:0);
 },{passive:true});
 window.addEventListener('resize',update,{passive:true});requestAnimationFrame(update);
})();
