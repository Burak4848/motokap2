/* MOTOKAP güvenli galeri: mevcut kart ve görsel ölçülerine müdahale etmez. */
(() => {
  "use strict";
  document.querySelectorAll(".model .card-gallery").forEach(gallery => {
    let start = null;
    gallery.addEventListener("touchstart", event => {
      if (event.touches.length !== 1) return;
      start = {x:event.touches[0].clientX, y:event.touches[0].clientY};
    }, {passive:true});
    gallery.addEventListener("touchend", event => {
      if (!start || event.changedTouches.length !== 1) return;
      const dx=event.changedTouches[0].clientX-start.x;
      const dy=event.changedTouches[0].clientY-start.y;
      start=null;
      if (Math.abs(dx)<42 || Math.abs(dx)<=Math.abs(dy)*1.25) return;
      gallery.closest(".model")?.querySelector('[data-photo-step="'+(dx<0?1:-1)+'"]')?.click();
    }, {passive:true});
    gallery.addEventListener("touchcancel", () => {start=null;}, {passive:true});
  });

  const dialog=document.querySelector("dialog.lightbox");
  const displayed=dialog?.querySelector("img");
  if (!dialog || !displayed) return;

  const controls=document.createElement("div");
  controls.className="motokap-lightbox-controls";
  controls.setAttribute("aria-label","Fotoğraflar arasında gezin");
  controls.hidden=true;
  const prev=document.createElement("button");
  prev.type="button";prev.textContent="‹";prev.setAttribute("aria-label","Önceki fotoğraf");
  const counter=document.createElement("span");
  counter.setAttribute("aria-live","polite");
  const next=document.createElement("button");
  next.type="button";next.textContent="›";next.setAttribute("aria-label","Sonraki fotoğraf");
  controls.append(prev,counter,next);
  dialog.append(controls);
  let images=[],current=0;

  const absolute = path => new URL(path,document.baseURI).href;
  function change(delta) {
    if (!dialog.open || images.length<2) return;
    current=(current+delta+images.length)%images.length;
    displayed.src=images[current].src;
    displayed.alt=images[current].alt;
    counter.textContent=(current+1)+" / "+images.length;
  }
  prev.addEventListener("click", () => change(-1));
  next.addEventListener("click", () => change(1));

  document.addEventListener("click", event => {
    const target=event.target.closest?.("[data-lightbox]");
    if (!target || dialog.contains(target)) return;
    let group;
    if (target.closest(".product-layout")) {
      group=[...document.querySelectorAll(".product-layout .product-thumbs button[data-lightbox]")];
    } else {
      const container=target.closest("#galeri .gallery-row, .quality-four, .detail-photo-grid");
      group=container?[...container.querySelectorAll("[data-lightbox]")]:[target];
    }
    if (!group.length) group=[target];
    images=group.map(button=>({
      src:absolute(button.dataset.lightbox),
      alt:button.querySelector("img")?.alt || "MOTOKAP ürün fotoğrafı"
    }));
    const index=images.findIndex(img=>img.src===absolute(target.dataset.lightbox));
    current=index>=0?index:0;
    counter.textContent=(current+1)+" / "+images.length;
    controls.hidden=images.length<2;
  }, true);

  let touchStart=null;
  dialog.addEventListener("touchstart", event=>{
    if(event.touches.length!==1) return;
    touchStart={x:event.touches[0].clientX,y:event.touches[0].clientY};
  },{passive:true});
  dialog.addEventListener("touchend", event=>{
    if (!touchStart || event.changedTouches.length!==1) return;
    const dx=event.changedTouches[0].clientX-touchStart.x;
    const dy=event.changedTouches[0].clientY-touchStart.y;
    touchStart=null;
    if(Math.abs(dx)<45 || Math.abs(dx)<=Math.abs(dy)*1.25) return;
    event.preventDefault();
    change(dx<0?1:-1);
  },{passive:false});
  dialog.addEventListener("touchcancel",()=>{touchStart=null;});
  dialog.addEventListener("keydown",event=>{
    if(event.key!=="ArrowLeft"&&event.key!=="ArrowRight")return;
    event.preventDefault();
    change(event.key==="ArrowRight"?1:-1);
  });
  dialog.addEventListener("close",()=>{images=[];controls.hidden=true;});
})();
