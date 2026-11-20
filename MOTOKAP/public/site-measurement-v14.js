/* MOTOKAP V14 — Consent/Pixel compatibility bridge, one tracker per new page.
 Reuses existing window.MOTOKAP from production /content.js and the existing consent key.
 Existing legacy pages continue to use their own runtime.js unchanged.
*/
(() => {
  'use strict';
  const storageKey='motokap-measurement';
  let consent='unset'; try {consent=localStorage.getItem(storageKey)||'unset'} catch(_){}
  let enabled=false;
  const cfg=()=>window.MOTOKAP||{};
  const current=location.pathname;
  const slug=current.includes('/orta-boy/')?'orta-boy':current.includes('/buyuk-boy/')?'buyuk-boy':current.includes('/iki-motosiklet-atv/')?'xxl':null;
  const model=()=>slug?(cfg().models||[]).find(x=>x.slug===slug):null;
  function load(){
    if(enabled || consent!=='granted') return;
    enabled=true;
    const analytics=cfg().analytics||{};
    const ga4=(analytics.ga4Id||'').trim(),pixel=(analytics.metaPixelId||'').trim(),clarity=(analytics.clarityId||'').trim();
    if(/^G-[A-Za-z0-9]+$/i.test(ga4)&&!window.gtag){
      window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};
      window.gtag('js',new Date());window.gtag('config',ga4);
      const el=document.createElement('script');el.async=true;el.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(ga4);document.head.append(el);
    }
    if(/^\d+$/.test(pixel)&&!window.fbq){
      window.fbq=function(){if(window.fbq.callMethod)window.fbq.callMethod.apply(window.fbq,arguments);else window.fbq.queue.push(arguments)};
      window._fbq=window.fbq;window.fbq.queue=[];window.fbq.push=window.fbq;window.fbq.loaded=true;window.fbq.version='2.0';
      const el=document.createElement('script');el.async=true;el.src='https://connect.facebook.net/en_US/fbevents.js';document.head.append(el);
      window.fbq('init',pixel);
    }
    if(/^[a-z0-9]{6,15}$/i.test(clarity)&&!window.clarity){
      (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,'clarity','script',clarity);
    }
    if(window.fbq){
      window.fbq('track','PageView');
      const m=model();if(m)window.fbq('track','ViewContent',{content_name:m.name,content_category:'Motosiklet Garajı',content_ids:[slug],value:m.price,currency:'TRY'});
    }
  }
  function measure(name,data){
    window.dispatchEvent(new CustomEvent('motokap:'+name,{detail:data}));
    if(!enabled)return;
    if(window.fbq){
      if(name==='whatsapp_click'||name==='phone_click')window.fbq('track','Contact',{content_name:data.model||'MOTOKAP',contact_channel:name==='phone_click'?'phone':'whatsapp'});
    }
    if(window.gtag)window.gtag('event',name,data);
    if(window.clarity)window.clarity('event',name);
  }
  // The model consultation form navigates directly to WhatsApp (no anchor click).
  // Count that as Contact intent, not a completed order or qualified Lead.
  window.addEventListener('motokap:fit_whatsapp_click',e=>measure('whatsapp_click',e.detail||{page:current,model:'Model seçim formu'}));
  document.addEventListener('click',e=>{
    const link=e.target.closest('a');if(!link)return;
    // Do not preempt the existing V14 click handler or replace the WhatsApp message.
    const href=link.getAttribute('href')||'';
    if(href.startsWith('tel:')) measure('phone_click',{page:current});
    else if(href.includes('wa.me/')||link.hasAttribute('data-wa-order')||link.hasAttribute('data-wa-question')||link.hasAttribute('data-wa'))
      measure('whatsapp_click',{model:link.getAttribute('data-wa-order')||link.getAttribute('data-wa-question')||link.getAttribute('data-wa')||'Genel bilgi',page:current});
  },true);
  const style=document.createElement('style');style.textContent=`
    #motokap-cookie-panel{position:fixed;z-index:1200;bottom:12px;left:12px;right:12px;margin:auto;max-width:760px;border-radius:16px;background:#fff;color:#1d1d1d;box-shadow:0 12px 60px #0004;padding:20px;font:14px/1.6 system-ui,sans-serif}
    #motokap-cookie-panel p{margin:8px 0 14px}
    #motokap-cookie-panel .actions{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}
    #motokap-cookie-panel button{padding:10px 16px;border-radius:8px;border:1px solid #888;cursor:pointer;background:#fff;color:#111;font-weight:700}
    #motokap-cookie-panel button.accept{background:#ad512c;border-color:#ad512c;color:white}
    @media(max-width:430px){#motokap-cookie-panel{bottom:8px;left:8px;right:8px;padding:14px}#motokap-cookie-panel button{flex:1}}
  `;document.head.append(style);
  function chooser(){
    document.getElementById('motokap-cookie-panel')?.remove();
    const panel=document.createElement('aside');panel.id='motokap-cookie-panel';panel.setAttribute('role','region');panel.setAttribute('aria-label','Çerez tercihleri');
    panel.innerHTML='<strong>Çerez ve Gizlilik Tercihleri</strong><p>Sitemizde isteğe bağlı ölçüm ve reklam teknolojilerini yalnızca onayınızla kullanıyoruz. <a href="/cerezler/">Çerez bilgilendirmesi</a></p><div class="actions"><button data-choice="denied" type="button">Yalnızca gerekli</button><button class="accept" data-choice="granted" type="button">Kabul et</button></div>';
    panel.addEventListener('click',e=>{
      const b=e.target.closest('button[data-choice]');if(!b)return;
      const before=consent;consent=b.dataset.choice;
      try{localStorage.setItem(storageKey,consent)}catch(_){}
      panel.remove();
      if(consent==='granted')load();
      if(consent==='denied'&&before==='granted')location.reload();
    });
    document.body.append(panel);
  }
  document.addEventListener('DOMContentLoaded',()=>{
    if(consent==='unset')chooser();else load();
    const b=document.createElement('button');b.className='motokap-cookie-settings';b.type='button';b.textContent='Çerez tercihleri';
    b.style.cssText='border:0;background:transparent;color:inherit;text-decoration:underline;cursor:pointer;font:inherit;margin:4px';
    b.onclick=chooser;document.querySelector('footer')?.append(b);
  });
})();