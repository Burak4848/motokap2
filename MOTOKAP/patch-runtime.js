const fs = require('path');
const fileSystem = require('fs');
const targetFile = 'motokap2/MOTOKAP/public/runtime.js';

let code = fileSystem.readFileSync(targetFile, 'utf8');
const lines = code.split(/\r?\n/);
const startIdx = lines.findIndex(l => l.includes("let consent='denied'"));
const endIdx = lines.findIndex(l => l.includes("if(curModel)track('product_view'"));

console.log('Found startIdx:', startIdx, 'endIdx:', endIdx);

const replacement = [
  " let consent='denied';try{consent=localStorage.getItem('motokap-measurement')||'unset'}catch{}",
  " let loaded=false;",
  " const curSlug=location.pathname.split('/')[2],curModel=curSlug?find(curSlug):null;",
  "",
  " function loadMeasurement(){",
  "  if(loaded||consent!=='granted')return;",
  "  const ga4=(cfg.analytics?.ga4Id||'').trim();",
  "  const pixel=(cfg.analytics?.metaPixelId||'').trim();",
  "  const clarity=(cfg.analytics?.clarityId||'').trim();",
  "  if(/^G-[A-Za-z0-9]+$/i.test(ga4)){",
  "    window.dataLayer=window.dataLayer||[];",
  "    window.gtag=function(){dataLayer.push(arguments)};",
  "    gtag('js',new Date());",
  "    gtag('config',ga4);",
  "    const script=document.createElement('script');",
  "    script.async=true;",
  "    script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(ga4);",
  "    document.head.append(script);",
  "  }",
  "  if(/^\\d+$/.test(pixel)){",
  "    if(!window.fbq){",
  "      window.fbq=function(){if(fbq.callMethod)fbq.callMethod.apply(fbq,arguments);else fbq.queue.push(arguments)};",
  "      window._fbq=window.fbq;",
  "      fbq.push=fbq;",
  "      fbq.queue=[];",
  "      fbq.loaded=true;",
  "      fbq.version='2.0';",
  "      const script=document.createElement('script');",
  "      script.async=true;",
  "      script.src='https://connect.facebook.net/en_US/fbevents.js';",
  "      document.head.append(script);",
  "      fbq('init',pixel);",
  "    }",
  "  }",
  "  if(/^[a-z0-9]{6,15}$/i.test(clarity)){",
  "    (function(c,l,a,r,i,t,y){",
  "      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};",
  "      t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;",
  "      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)",
  "    })(window,document,'clarity','script',clarity);",
  "  }",
  "  loaded=true;",
  "  if(window.fbq){",
  "    fbq('track','PageView');",
  "    if(curModel){",
  "      fbq('track','ViewContent',{",
  "        content_name:curModel.name,",
  "        content_category:'Motosiklet Garajı',",
  "        content_ids:[curModel.slug],",
  "        value:curModel.price,",
  "        currency:'TRY'",
  "      });",
  "    }",
  "  }",
  " }",
  "",
  " function track(name,data){",
  "  window.dispatchEvent(new CustomEvent('motokap:'+name,{detail:data}));",
  "  if(consent!=='granted'||!loaded)return;",
  "  if(window.fbq){",
  "   if(name==='whatsapp_click'){",
  "    fbq('track','Contact',{",
  "      content_name:data?.model||'WhatsApp İletişim',",
  "      contact_channel:'whatsapp'",
  "    });",
  "   } else if(name==='phone_click'){",
  "    fbq('track','Contact',{",
  "      content_name:'Telefon Arama',",
  "      contact_channel:'phone'",
  "    });",
  "   } else if(name==='form_submit'){",
  "    fbq('track','Lead',{",
  "      content_name:data?.model||'Model Seçim Talebi',",
  "      content_category:'Motosiklet Garajı'",
  "    });",
  "   }",
  "  }",
  "  if(window.gtag)gtag('event',name,data);",
  "  if(window.clarity)clarity('event',name);",
  " }"
];

if (startIdx !== -1 && endIdx !== -1) {
  lines.splice(startIdx, endIdx - startIdx + 1, ...replacement);
  fileSystem.writeFileSync(targetFile, lines.join('\r\n'), 'utf8');
  console.log('SUCCESS: Patched runtime.js successfully!');
} else {
  console.error('ERROR: Could not find start/end lines');
}
