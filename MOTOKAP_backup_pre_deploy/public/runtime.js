(() => {
 const cfg=window.MOTOKAP;
 const find=slug=>cfg.models.find(m=>m.slug===slug);
 const format=price=>Number.isFinite(price)?new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(price):'Güncel fiyatı sorun';
 document.querySelectorAll('[data-price]').forEach(el=>el.textContent=format(find(el.dataset.price)?.price));
 let consent='denied';try{consent=localStorage.getItem('motokap-measurement')||'unset'}catch{}
 let loaded=false;
 function loadMeasurement(){
  if(loaded||consent!=='granted')return;
  const {metaPixelId,ga4Id,clarityId}=cfg.analytics;
  if(/^G-[A-Z0-9]+$/.test(ga4Id)){window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config',ga4Id);const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(ga4Id);document.head.append(script)}
  if(/^\d+$/.test(metaPixelId)){window.fbq=function(){if(fbq.callMethod)fbq.callMethod.apply(fbq,arguments);else fbq.queue.push(arguments)};window._fbq=window.fbq;fbq.push=fbq;fbq.queue=[];fbq.loaded=true;fbq.version='2.0';const script=document.createElement('script');script.async=true;script.src='https://connect.facebook.net/en_US/fbevents.js';document.head.append(script);fbq('init',metaPixelId);fbq('track','PageView')}
  if(/^[a-z0-9]{6,15}$/i.test(clarityId||'')){(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,'clarity','script',clarityId)}
  loaded=true;
  const slug=location.pathname.split('/')[2],m=find(slug);if(m)track('product_view',{model:m.name,slug:m.slug});
 }
 window.addEventListener('motokap:enquiry_ready',e=>track('whatsapp_click',e.detail));
 function track(name,data){window.dispatchEvent(new CustomEvent('motokap:'+name,{detail:data}));if(consent!=='granted')return;if(window.gtag)gtag('event',name,data);if(window.clarity)clarity('event',name);if(window.fbq){if(name==='product_view')fbq('track','ViewContent',{content_ids:[data.slug],content_name:data.model,content_type:'product'});else if(name==='whatsapp_click'||name==='phone_click')fbq('track','Contact',{content_name:data.model||'MOTOKAP',contact_channel:name==='phone_click'?'phone':'whatsapp'});else fbq('trackCustom',name,data)}}
 document.querySelectorAll('[data-wa]').forEach(a=>{
  const m=find(a.dataset.model),message=m?.template?'Merhaba, web sitenizdeki '+m.name+' hakkında bilgi almak istiyorum.':m?'Merhaba, '+m.name+' modelini web sitenizden inceledim. Güncel fiyat ve sipariş bilgisi almak istiyorum.':'Merhaba, MOTOKAP ürünleri hakkında bilgi almak istiyorum.';
  a.href='https://wa.me/'+cfg.phone+'?text='+encodeURIComponent(message);
  a.addEventListener('click',()=>track('whatsapp_click',{model:m?.name||'Genel bilgi',page:location.pathname}));
 });
 document.querySelector('.menu-toggle')?.addEventListener('click',e=>{const nav=document.getElementById('main-nav'),opened=nav.classList.toggle('mobile-open');e.currentTarget.setAttribute('aria-expanded',String(opened))});
 document.querySelectorAll('#main-nav a').forEach(a=>a.addEventListener('click',()=>{document.getElementById('main-nav').classList.remove('mobile-open');document.querySelector('.menu-toggle')?.setAttribute('aria-expanded','false')}));
  document.querySelectorAll('[data-detail-model]').forEach(section=>{const m=find(section.dataset.detailModel),grid=section.querySelector('.detail-photo-grid');if(m?.detailPhotos?.length){section.querySelector('.small').textContent='Kaplama, bağlantılar ve mekanizmayı yakından inceleyin.';m.detailPhotos.forEach((photo,i)=>{const b=document.createElement('button');b.className='gallery-photo';b.dataset.lightbox='/'+photo;const img=document.createElement('img');img.src='/'+photo;img.alt=m.name+' ürün detayı '+(i+1);img.loading='lazy';b.append(img);grid.append(b)})}else {section.hidden=true;['Kaplama detayı','Dikiş ve cırt bağlantısı','Çelik mekanizma'].forEach(label=>{const slot=document.createElement('div');slot.className='photo-slot';slot.textContent=label+' · fotoğraf eklenecek';grid.append(slot)})}});
 document.querySelectorAll('a[href^="tel:"]').forEach(a=>a.addEventListener('click',()=>track('phone_click',{page:location.pathname})));
 if(cfg.seo?.googleSiteVerification){const meta=document.createElement('meta');meta.name='google-site-verification';meta.content=cfg.seo.googleSiteVerification;document.head.append(meta)}
 document.querySelectorAll('.card-gallery').forEach(gallery=>{
  const card=gallery.closest('.model'),count=card.querySelector('.photo-count'),total=gallery.children.length;
  let width=gallery.clientWidth,frame=0,last=0;
  const update=()=>{frame=0;const index=Math.max(0,Math.min(total-1,Math.round(gallery.scrollLeft/Math.max(1,width))));if(count&&index!==last){count.textContent=(index+1)+' / '+total;last=index}};
  gallery.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update)},{passive:true});
  if('ResizeObserver' in window)new ResizeObserver(entries=>{width=entries[0].contentRect.width;if(!frame)frame=requestAnimationFrame(update)}).observe(gallery);
  else window.addEventListener('resize',()=>{width=gallery.clientWidth},{passive:true});
  card.querySelectorAll('[data-photo-step]').forEach(button=>button.addEventListener('click',()=>{width=gallery.clientWidth;const current=Math.round(gallery.scrollLeft/Math.max(1,width));const next=(current+Number(button.dataset.photoStep)+total)%total;gallery.scrollTo({left:next*width,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}));
 });
 document.querySelectorAll('[data-quality-index]').forEach(slot=>{const item=cfg.qualityGallery?.[Number(slot.dataset.qualityIndex)];if(!item?.image)return;const b=document.createElement('button');b.className='gallery-photo';b.dataset.lightbox='/'+item.image;b.setAttribute('aria-label',item.title+' — görseli büyüt');const img=document.createElement('img');img.src='/'+item.image;img.alt=item.alt||item.title;img.loading='lazy';b.append(img);slot.replaceChildren(b)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.getElementById('main-nav')?.classList.remove('mobile-open');document.querySelector('.menu-toggle')?.setAttribute('aria-expanded','false')}});
 document.querySelectorAll('.faq-items').forEach(group=>group.querySelectorAll('details').forEach(item=>item.addEventListener('toggle',()=>{if(item.open)group.querySelectorAll('details').forEach(other=>{if(other!==item)other.open=false})})));
 const dialog=document.createElement('dialog');dialog.className='lightbox';dialog.setAttribute('aria-label','MOTOKAP ürün fotoğrafı');
 dialog.innerHTML='<button type="button" aria-label="Fotoğrafı kapat">Kapat ×</button><img alt="">';document.body.append(dialog);
 dialog.querySelector('button').onclick=()=>dialog.close();
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
 document.querySelectorAll('img').forEach(img=>{img.decoding='async';const path=img.getAttribute('src')?.replace(/^\//,'');const variants=cfg.imageVariants?.[path];if(variants&&!img.srcset){img.srcset=variants.map(v=>'/'+v.src+' '+v.width+'w').join(', ');img.sizes='(max-width:650px) calc(100vw - 40px), (max-width:1000px) 45vw, 32vw'}});
 document.querySelectorAll('[data-lightbox]').forEach(button=>button.addEventListener('click',()=>{const img=dialog.querySelector('img');img.src=button.dataset.lightbox;img.alt=button.querySelector('img')?.alt||'MOTOKAP kullanım fotoğrafı';dialog.showModal()}));
 if(cfg.media.usageVideo)document.querySelectorAll('[data-video-slot]').forEach(slot=>{const video=document.createElement('video');video.controls=true;video.preload='none';video.src='/'+cfg.media.usageVideo;slot.replaceChildren(video);slot.hidden=false});
 if(cfg.media.workshopImage)document.querySelectorAll('[data-workshop-slot]').forEach(slot=>{const img=document.createElement('img');img.src='/'+cfg.media.workshopImage;img.alt='MOTOKAP üretim atölyesi';img.style.width='100%';slot.replaceChildren(img);slot.hidden=false});
 if(cfg.media.detailImages.length)document.getElementById('malzeme')?.removeAttribute('hidden');
 cfg.media.detailImages.forEach((path,i)=>{const slot=document.querySelectorAll('.quality-card .media-empty')[i];if(slot){const img=document.createElement('img');img.src='/'+path;img.alt='MOTOKAP malzeme ve mekanizma detayı';img.style.width='100%';slot.replaceChildren(img)}});
 function clearTrackingCookies(){const exp='=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';document.cookie.split(';').forEach(c=>{const n=c.split('=')[0].trim();if(/^(_ga|_gid|_gat|_fbp|_fbc|_clck|_clsk|CLID|ANONCHK|MR|SM|SRM_B)/.test(n)){const h=location.hostname.split('.');for(let i=0;i<h.length-1;i++){const d=h.slice(i).join('.');document.cookie=n+exp+';domain='+d;document.cookie=n+exp+';domain=.'+d}document.cookie=n+exp}})}
 function preferences(){
  document.querySelector('.cookie-panel')?.remove();
  const panel=document.createElement('aside');panel.className='cookie-panel';panel.setAttribute('aria-label','Ölçüm tercihleri');
  const enabled=Boolean(cfg.analytics.metaPixelId||cfg.analytics.ga4Id||cfg.analytics.clarityId);
  panel.innerHTML='<strong>Ölçüm tercihleri</strong><p>'+(enabled?'İzninizle sitedeki gezinme, tıklama ve kaydırma davranışınız ile WhatsApp/telefon tıklamalarınız anonim olarak ölçülebilir.':'Pixel ve Analytics şu anda etkin değil. Tercihinizi sonraki ziyaretler için kaydedebilirsiniz.')+'</p><a href="/cerezler/" style="font-size:12px;text-decoration:underline">Çerez bilgilendirmesi</a><div class="actions"><button class="button outline" data-choice="denied">Yalnızca gerekli</button><button class="button" data-choice="granted">Ölçüme izin ver</button></div>';
  panel.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{consent=b.dataset.choice;try{localStorage.setItem('motokap-measurement',consent)}catch{}panel.remove();if(consent==='denied'){clearTrackingCookies();if(loaded)location.reload()}else loadMeasurement()});
  document.body.append(panel);
 }
 document.querySelectorAll('.cookie-settings').forEach(b=>b.onclick=preferences);
 if(consent==='unset'&&(cfg.analytics.metaPixelId||cfg.analytics.ga4Id||cfg.analytics.clarityId))preferences();
  /* Etkileşim ölçümü: yalnızca izin verilmişse track() GA4/Pixel/Clarity'ye iletir */
 const page=location.pathname,sentKeys=new Set();
 const once=(key,name,data)=>{if(sentKeys.has(key))return;sentKeys.add(key);track(name,data)};
 const modelOf=el=>{const c=el?.closest?.('.model');return c?.querySelector('h2,h3')?.textContent?.trim()||c?.dataset.model||''};
 window.addEventListener('motokap:enquiry_ready',e=>track('form_submit',e.detail));
 document.addEventListener('click',e=>{
  const t=e.target.closest?.('a,button,[data-lightbox],[data-photo-step],.filter');if(!t)return;
  if(t.matches('[data-photo-step]'))track('gallery_step',{model:modelOf(t),page});
  else if(t.matches('[data-lightbox]'))track('lightbox_open',{image:t.dataset.lightbox,page});
  else if(t.matches('.filter'))track('filter_use',{filter:t.dataset.filter,page});
  else if(t.matches('a[href*="instagram.com"]'))track('social_click',{network:'instagram',page});
  else if(t.matches('a[href*="google.com/maps"]'))track('directions_click',{page});
  else if(t.matches('#main-nav a'))track('nav_click',{target:(t.getAttribute('href')||'').slice(0,60),page});
 },true);
 document.addEventListener('toggle',e=>{const d=e.target;if(d.matches?.('.faq-items details')&&d.open)track('faq_open',{question:(d.querySelector('summary')?.textContent||'').trim().slice(0,80),page})},true);
 document.addEventListener('scroll',e=>{const g=e.target;if(g.classList?.contains('card-gallery')&&g.scrollLeft>20){const all=[...document.querySelectorAll('.card-gallery')];once('swipe:'+all.indexOf(g),'gallery_swipe',{model:modelOf(g),page})}},true);
 document.getElementById('selection')?.addEventListener('focusin',()=>once('form_start','form_start',{page}));
 const onScrollDepth=()=>{const h=document.documentElement.scrollHeight-innerHeight;if(h<=0)return;const pct=scrollY/h*100;[25,50,75,90].forEach(m=>{if(pct>=m)once('scroll:'+m,'scroll_depth',{percent:m,page})})};
 addEventListener('scroll',onScrollDepth,{passive:true});
 let visibleMs=0,stamp=document.hidden?0:Date.now();
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(stamp){visibleMs+=Date.now()-stamp;stamp=0}}else stamp=Date.now()});
 setInterval(()=>{const sec=(visibleMs+(stamp?Date.now()-stamp:0))/1000;[15,30,60,120].forEach(s=>{if(sec>=s)once('time:'+s,'engaged_time',{seconds:s,page})})},5000);
 if('IntersectionObserver' in window){const io=new IntersectionObserver(list=>list.forEach(en=>{if(en.isIntersecting){once('section:'+en.target.id,'section_view',{section:en.target.id,page});io.unobserve(en.target)}}),{threshold:.4});document.querySelectorAll('main section[id]').forEach(sec=>io.observe(sec))}
 loadMeasurement();
 const schema={"@context": "https://schema.org", "@type": "Organization", "@id": "https://motokap-garaj.snowylion32.chatgpt.site/#motokap", "name": "MOTOKAP", "description": "Fethiye / Muğla merkezli katlanır motosiklet garajı üreticisi.", "url": "https://motokap-garaj.snowylion32.chatgpt.site/", "logo": "https://motokap-garaj.snowylion32.chatgpt.site/assets/web-cc97c4ad4b2b.webp", "telephone": "+90 533 240 38 88", "address": {"@type": "PostalAddress", "streetAddress": "Karaçulha Mahallesi, Atatürk Bulvarı No: 124/1", "addressLocality": "Fethiye", "addressRegion": "Muğla", "addressCountry": "TR"}, "sameAs": ["https://www.instagram.com/motokaptr/", "https://www.tiktok.com/@motokapstore", "https://share.google/t9Hn2Crw8fZ8bILBf"], "contactPoint": {"@type": "ContactPoint", "telephone": "+90 533 240 38 88", "contactType": "sales", "availableLanguage": "Turkish"}, "hasMap": "https://share.google/t9Hn2Crw8fZ8bILBf"};
 if(!['/iletisim/','/hakkimizda/'].includes(location.pathname)){const node=document.createElement('script');node.type='application/ld+json';node.textContent=JSON.stringify(schema);document.head.append(node)}
})();
