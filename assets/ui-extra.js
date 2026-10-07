(function(){
  'use strict';
  const drafts=window.ELIFA_UI_EXTRA_DRAFTS||{};
  const source=drafts.en||{};
  const originals=new WeakMap();
  const ignored='[data-i18n], [data-i18n-ph], [data-i18n-title], [data-i18n-aria], #accountDialog, script, style, svg';
  function language(){return window.ElifaLocale?.current?.()||localStorage.getItem('elifaLang')||'tr';}
  function applyNode(node){
    if(node.nodeType!==Node.TEXT_NODE||node.parentElement?.closest(ignored))return;
    const raw=node.nodeValue,trimmed=raw.trim();
    let key=originals.get(node);
    if(!key){if(!Object.prototype.hasOwnProperty.call(source,trimmed))return;key=trimmed;originals.set(node,key);}
    const values=drafts[language()]||source;
    const target=language()==='tr'?key:(values[key]||source[key]);
    if(raw.trim()!==target)node.nodeValue=raw.replace(trimmed,target);
  }
  function walk(root){
    if(root.nodeType===Node.TEXT_NODE){applyNode(root);return;}
    if(root.nodeType!==Node.ELEMENT_NODE||root.matches?.(ignored))return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    while(walker.nextNode())applyNode(walker.currentNode);
  }
  walk(document.body);
  window.addEventListener('elifa:language-changed',()=>walk(document.body));
  new MutationObserver(changes=>{
    for(const change of changes){
      for(const node of change.addedNodes)walk(node);
    }
  }).observe(document.body,{subtree:true,childList:true});
})();
