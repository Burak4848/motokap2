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