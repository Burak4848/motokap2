(() => {
 const filters=[...document.querySelectorAll('.filter')];
 filters.forEach(button=>button.addEventListener('click',()=>{
  filters.forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))});
  document.querySelectorAll('.model').forEach(card=>card.hidden=button.dataset.filter!=='all'&&card.dataset.category!==button.dataset.filter);
 }));
 document.querySelectorAll('.card-gallery').forEach(gallery=>gallery.addEventListener('keydown',e=>{
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();gallery.scrollBy({left:(e.key==='ArrowRight'?1:-1)*gallery.clientWidth,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}
 }));
 const form=document.getElementById('selection');
 form?.addEventListener('submit',e=>{
  e.preventDefault();if(!form.reportValidity())return;
  const bike=document.getElementById('bike').value.trim();
  if(!bike){document.getElementById('bike').focus();return}
  const note=document.getElementById('accessories').value.trim(),model=document.getElementById('model').value;
  const message='Merhaba, motosikletime uygun MOTOKAP modelini ve fiyatını öğrenmek istiyorum.\nMotosiklet: '+bike+'\nÇanta / cam / park alanı: '+(note||'Belirtilmedi')+'\nİlgilendiğim model: '+model;
  window.dispatchEvent(new CustomEvent('motokap:enquiry_ready',{detail:{model,page:location.pathname,source:'model_enquiry'}}));
  window.open('https://wa.me/'+window.MOTOKAP.phone+'?text='+encodeURIComponent(message),'_blank','noopener,noreferrer');
 });
})();
