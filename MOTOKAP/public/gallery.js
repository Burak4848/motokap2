/* MOTOKAP - ürün galerilerinde kaydırma ve fotoğraf seçimi */
(()=>{
 document.querySelectorAll('.card-gallery').forEach(g=>{
  let start=null;
  g.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;start={x:e.clientX,left:g.scrollLeft};g.setPointerCapture?.(e.pointerId)});
  g.addEventListener('pointermove',e=>{if(!start)return;g.classList.add('is-dragging');g.scrollLeft=start.left-(e.clientX-start.x)});
  const finish=()=>{if(!start)return;start=null;g.classList.remove('is-dragging');const i=Math.round(g.scrollLeft/Math.max(1,g.clientWidth));g.scrollTo({left:i*g.clientWidth,behavior:'smooth'})};
  g.addEventListener('pointerup',finish);g.addEventListener('pointercancel',finish);
  g.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();g.closest('.model')?.querySelector('[data-photo-step="'+(e.key==='ArrowLeft'?-1:1)+'"]')?.click()});
 });
 const img=document.querySelector('.product-layout .product-main-image');
 const main=img?.closest('button[data-lightbox]');
 const thumbs=[...document.querySelectorAll('.product-layout .product-thumbs button[data-lightbox]')];
 if(!main||thumbs.length<2)return;
 let current=0,swiped=false;
 const controls=document.createElement('div');controls.className='product-gallery-controls';
 const prev=document.createElement('button');prev.type='button';prev.textContent='‹ Önceki';
 const counter=document.createElement('span');counter.className='photo-counter';counter.setAttribute('aria-live','polite');
 const next=document.createElement('button');next.type='button';next.textContent='Sonraki ›';
 controls.append(prev,counter,next);main.after(controls);
 function select(i){current=(i+thumbs.length)%thumbs.length;const b=thumbs[current],source=b.querySelector('img');if(!source)return;
  img.src=source.getAttribute('src');if(source.hasAttribute('srcset'))img.setAttribute('srcset',source.getAttribute('srcset'));else img.removeAttribute('srcset');
  img.alt=source.alt;main.dataset.lightbox=b.dataset.lightbox;counter.textContent=(current+1)+' / '+thumbs.length;
  thumbs.forEach((t,index)=>t.setAttribute('aria-pressed',String(index===current)));
 }
 prev.onclick=()=>select(current-1);next.onclick=()=>select(current+1);
 thumbs.forEach((b,i)=>b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();select(i)},true));
 select(0);
 let touch=null;
 main.addEventListener('touchstart',e=>{if(e.touches.length===1)touch={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});
 main.addEventListener('touchend',e=>{if(!touch)return;const dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;touch=null;
 if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.25){e.preventDefault();swiped=true;select(current+(dx<0?1:-1));setTimeout(()=>swiped=false,400)}},{passive:false});
 main.addEventListener('click',e=>{if(swiped){e.preventDefault();e.stopImmediatePropagation();swiped=false}},true);
 let drag=null;
 main.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')drag=e.clientX});
 main.addEventListener('pointerup',e=>{if(drag===null||e.pointerType!=='mouse')return;const dx=e.clientX-drag;drag=null;if(Math.abs(dx)>45){swiped=true;select(current+(dx<0?1:-1));setTimeout(()=>swiped=false,400)}});
 const dialog=document.querySelector('dialog.lightbox');
 let openedProduct=false;main.addEventListener('click',()=>{openedProduct=true});
 dialog?.addEventListener('close',()=>{openedProduct=false});
 const move=delta=>{if(!dialog?.open||!openedProduct)return;select(current+delta);dialog.querySelector('img').src=main.dataset.lightbox;dialog.querySelector('img').alt=img.alt};
 dialog?.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key)||!openedProduct)return;e.preventDefault();move(e.key==='ArrowRight'?1:-1)});
 let dTouch=null;dialog?.addEventListener('touchstart',e=>{if(e.touches.length===1)dTouch={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});
 dialog?.addEventListener('touchend',e=>{if(!dTouch)return;const dx=e.changedTouches[0].clientX-dTouch.x,dy=e.changedTouches[0].clientY-dTouch.y;dTouch=null;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.25){e.preventDefault();move(dx<0?1:-1)}},{passive:false});
})();

/* Büyütülmüş fotoğrafta, aynı ürünün tüm görsellerini tek seferde gezin. */
(()=>{
 const dialog=document.querySelector('dialog.lightbox');
 if(!dialog)return;
 const display=dialog.querySelector('img');
 const nav=document.createElement('div');
 nav.className='lightbox-nav';
 nav.hidden=true;
 nav.setAttribute('aria-label','Fotoğraf galerisi kontrolleri');
 const back=document.createElement('button');back.type='button';back.textContent='‹';back.setAttribute('aria-label','Önceki fotoğraf');
 const counter=document.createElement('span');counter.setAttribute('aria-live','polite');
 const forward=document.createElement('button');forward.type='button';forward.textContent='›';forward.setAttribute('aria-label','Sonraki fotoğraf');
 nav.append(back,counter,forward);
 dialog.append(nav);
 let items=[],position=0;
 const url=src=>new URL(src,location.href).href;
 function show(i){
   if(!items.length)return;
   position=(i+items.length)%items.length;
   const item=items[position];
   display.src=item.src;
   display.alt=item.alt;
   counter.textContent=(position+1)+' / '+items.length;
 }
 function step(delta){
   if(!dialog.open||items.length<2)return;
   show(position+delta);
 }
 document.addEventListener('click',e=>{
   const b=e.target.closest?.('[data-lightbox]');
   if(!b||b.closest('.product-thumbs'))return;
   let buttons;
   if(b.closest('.product-layout')&&b.querySelector('.product-main-image')){
     buttons=[...document.querySelectorAll('.product-layout .product-thumbs button[data-lightbox]')];
     const currentSrc=url(b.dataset.lightbox);
     items=buttons.map(t=>({src:t.dataset.lightbox,alt:t.querySelector('img')?.alt||'Ürün fotoğrafı'}));
     position=Math.max(0,items.findIndex(t=>url(t.src)===currentSrc));
   }else{
     const group=b.closest('#galeri .gallery-row')||b.closest('.quality-four')||b.closest('.detail-photo-grid');
     buttons=group?[...group.querySelectorAll('[data-lightbox]')]:[b];
     items=buttons.map(t=>({src:t.dataset.lightbox,alt:t.querySelector('img')?.alt||'MOTOKAP fotoğrafı'}));
     position=Math.max(0,buttons.indexOf(b));
   }
   nav.hidden=items.length<2;
   counter.textContent=(position+1)+' / '+items.length;
 },true);
 back.addEventListener('click',()=>step(-1));
 forward.addEventListener('click',()=>step(1));
 // Capture: eski ürün sayfası keydown/touch işleyicileriyle iki kez ilerlemeyi engeller.
 dialog.addEventListener('keydown',e=>{
   if(!dialog.open||!['ArrowLeft','ArrowRight'].includes(e.key))return;
   e.preventDefault();
   e.stopImmediatePropagation();
   step(e.key==='ArrowRight'?1:-1);
 },true);
 let swipe=null;
 dialog.addEventListener('touchstart',e=>{
   if(!dialog.open||e.touches.length!==1)return;
   swipe={x:e.touches[0].clientX,y:e.touches[0].clientY};
 },{capture:true,passive:true});
 dialog.addEventListener('touchend',e=>{
   if(!swipe||e.changedTouches.length!==1)return;
   const dx=e.changedTouches[0].clientX-swipe.x;
   const dy=e.changedTouches[0].clientY-swipe.y;
   swipe=null;
   if(items.length<2||Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)*1.2)return;
   e.preventDefault();e.stopImmediatePropagation();
   step(dx<0?1:-1);
 },{capture:true,passive:false});
 dialog.addEventListener('touchcancel',()=>{swipe=null},{capture:true});
 let mouseStart=null;
 display.addEventListener('pointerdown',e=>{
   if(e.pointerType==='mouse'&&e.button===0)mouseStart=e.clientX;
 });
 display.addEventListener('pointerup',e=>{
   if(mouseStart===null||e.pointerType!=='mouse')return;
   const dx=e.clientX-mouseStart;mouseStart=null;
   if(Math.abs(dx)>=45)step(dx<0?1:-1);
 });
 dialog.addEventListener('close',()=>{items=[];position=0;nav.hidden=true});
})();
