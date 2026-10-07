(function(global){
  'use strict';
  const supported=new Set(['tr','de','en','ru','ar','fr','es','el','zh','ja','ko','hi','ur','it','id','nl','pt','fa','bn','ms','sw']);
  const countryLanguages={
    TR:['tr'],DE:['de'],AT:['de'],CH:['de','fr','it'],LI:['de'],
    GB:['en'],US:['en'],IE:['en'],AU:['en'],NZ:['en'],CA:['en','fr'],
    RU:['ru'],BY:['ru'],KZ:['ru'],KG:['ru'],
    SA:['ar'],AE:['ar'],QA:['ar'],KW:['ar'],BH:['ar'],OM:['ar'],YE:['ar'],
    EG:['ar'],JO:['ar'],LB:['ar'],SY:['ar'],IQ:['ar'],PS:['ar'],MA:['ar'],DZ:['ar'],TN:['ar'],LY:['ar'],SD:['ar'],MR:['ar'],SO:['ar'],
    FR:['fr'],BE:['nl','fr','de'],LU:['fr','de'],MC:['fr'],SN:['fr'],CI:['fr'],
    BF:['fr'],BJ:['fr'],CF:['fr'],CG:['fr'],CD:['fr','sw'],DJ:['fr','ar'],GA:['fr'],GN:['fr'],GQ:['es','fr'],HT:['fr'],KM:['fr','ar'],MG:['fr'],ML:['fr'],NE:['fr'],TD:['fr','ar'],TG:['fr'],VU:['fr'],
    ES:['es'],MX:['es'],AR:['es'],CL:['es'],CO:['es'],PE:['es'],VE:['es'],EC:['es'],BO:['es'],PY:['es'],UY:['es'],
    CR:['es'],CU:['es'],DO:['es'],GT:['es'],HN:['es'],NI:['es'],PA:['es'],SV:['es'],PR:['es','en'],
    GR:['el'],CY:['el','tr'],CN:['zh'],TW:['zh'],HK:['zh','en'],MO:['zh','pt'],
    JP:['ja'],KR:['ko'],IN:['hi','en','bn','ur'],PK:['ur','en'],FJ:['en','hi'],
    IT:['it'],SM:['it'],VA:['it'],ID:['id'],NL:['nl'],SR:['nl'],AW:['nl'],CW:['nl'],PT:['pt'],BR:['pt'],AO:['pt'],MZ:['pt'],CV:['pt'],GW:['pt'],ST:['pt'],TL:['pt'],
    IR:['fa'],AF:['fa'],BD:['bn'],MY:['ms','en','zh'],BN:['ms'],
    TZ:['sw','en'],KE:['sw','en'],UG:['sw','en'],SG:['en','ms','zh']
  };
  function base(value){return String(value||'').toLowerCase().split(/[-_]/)[0];}
  function deviceLanguage(preferences){
    for(const value of preferences||[]){const language=base(value);if(supported.has(language))return language;}
    return 'en';
  }
  function countryLanguage(country,preferences){
    const choices=countryLanguages[String(country||'').toUpperCase()];
    if(!choices)return 'en';
    if(choices.length===1)return choices[0];
    for(const value of preferences||[]){const language=base(value);if(choices.includes(language))return language;}
    return choices[0];
  }
  function preferences(){
    const values=[];
    try{values.push(...(navigator.languages||[]));}catch{}
    try{values.push(navigator.language);}catch{}
    return values;
  }
  function current(){
    try{const saved=localStorage.getItem('elifaLang');if(supported.has(saved))return saved;}catch{}
    return global.__elifaBootLang||deviceLanguage(preferences());
  }
  function boot(){
    const prefs=preferences();
    let saved=null,mode=null;
    try{saved=localStorage.getItem('elifaLang');mode=localStorage.getItem('elifaLangMode');}catch{}
    if(saved&&!supported.has(saved)){saved=null;try{localStorage.removeItem('elifaLang');}catch{}}
    // Older builds saved the device-language guess in elifaLang without recording
    // whether it was automatic. Only a value different from the current device
    // language is evidence of an intentional legacy choice.
    if(saved&&!mode){
      mode=saved===deviceLanguage(prefs)?'auto':'manual';
      try{localStorage.setItem('elifaLangMode',mode);}catch{}
    }
    const initial=saved||deviceLanguage(prefs);
    global.__elifaBootLang=initial;
    if(!saved){try{localStorage.setItem('elifaLang',initial);localStorage.setItem('elifaLangMode','auto');}catch{}}
    if(saved&&mode!=='auto')return;
    if(typeof fetch!=='function')return;
    fetch('/api/locale',{credentials:'same-origin',cache:'no-store'})
      .then(response=>response.ok?response.json():null)
      .then(data=>{
        if(!data||!data.country)return;
        const language=countryLanguage(data.country,prefs);
        try{
          if(localStorage.getItem('elifaLangMode')!=='auto')return;
          localStorage.setItem('elifaCountry',String(data.country).toUpperCase());
          if(localStorage.getItem('elifaLang')===language)return;
          localStorage.setItem('elifaLang',language);
        }catch{return;}
        location.reload();
      }).catch(()=>{});
  }
  global.ElifaLocale={supported,countryLanguage,deviceLanguage,current,boot};
  boot();
})(globalThis);
