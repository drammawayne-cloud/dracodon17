(()=>{
  'use strict';
  const grid=document.getElementById('photo-grid'),dialog=document.getElementById('album-viewer');
  const filters=document.getElementById('album-filters'),search=document.getElementById('album-search');
  const status=document.getElementById('album-status'),empty=document.getElementById('album-empty');
  const viewerImage=document.getElementById('viewer-image'),viewerTitle=document.getElementById('viewer-title');
  const viewerCaption=document.getElementById('viewer-caption'),original=document.getElementById('viewer-original');
  const initial=JSON.parse(document.getElementById('album-data').textContent);
  let records=initial,visible=records,category='all',current=0,trigger,previousOverflow='';
  const make=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
  const safe=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}};
  function updateFilters(){
    filters.replaceChildren();
    for(const [key,label] of [['all','All images'],['photo','Artist photos'],['artwork','Release artwork'],['identity','DD17 identity']]){
      const count=key==='all'?records.length:records.filter(r=>r.category===key).length;if(!count)continue;
      const b=make('button',`${label} (${count})`);b.type='button';b.dataset.category=key;b.setAttribute('aria-pressed',String(category===key));b.setAttribute('aria-controls','photo-grid');
      b.onclick=()=>{category=key;for(const other of filters.children)other.setAttribute('aria-pressed',String(other===b));render();};filters.append(b);
    }
  }
  function render(){
    const query=search.value.trim().toLowerCase();visible=records.filter(r=>(category==='all'||r.category===category)&&`${r.title} ${r.kind}`.toLowerCase().includes(query));
    grid.replaceChildren();visible.forEach((r,i)=>{
      const figure=make('figure',null,'photo-card');figure.dataset.category=r.category;
      const a=make('a',null,'photo-open');a.href=r.src;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',`View ${r.title}`);
      const img=make('img');img.src=r.src;img.alt=r.title;img.width=600;img.height=600;img.loading=i<3?'eager':'lazy';img.decoding='async';
      const number=make('span',String(records.indexOf(r)+1).padStart(2,'0'),'photo-number');number.setAttribute('aria-hidden','true');
      a.append(img,number);a.onclick=e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();open(i,a);};
      const caption=make('figcaption');caption.append(make('span',r.title),make('small',r.kind));figure.append(a,caption);grid.append(figure);
    });
    empty.hidden=visible.length>0;status.textContent=`${visible.length} ${visible.length===1?'image':'images'}${query?' found':' in view'}`;
  }
  function show(index){
    current=(index+visible.length)%visible.length;const r=visible[current];viewerImage.src=r.src;viewerImage.alt=r.title;viewerTitle.textContent=r.title;viewerCaption.textContent=`${current+1} / ${visible.length} · ${r.kind}`;original.href=r.src;
    document.getElementById('viewer-feedback').textContent='';history.replaceState(null,'',`#image=${encodeURIComponent(r.id)}`);
  }
  function open(index,from){if(!visible.length)return;trigger=from;show(index);if(!dialog.open){previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();}}
  document.getElementById('viewer-close').onclick=()=>dialog.close();
  document.getElementById('viewer-prev').onclick=()=>show(current-1);document.getElementById('viewer-next').onclick=()=>show(current+1);
  dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();show(current+(e.key==='ArrowRight'?1:-1));}});
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;history.replaceState(null,'',location.pathname+location.search);trigger?.focus({preventScroll:true});});
  async function copyLink(image=false){const out=document.getElementById(image?'viewer-feedback':'album-feedback'),url=new URL(location.href);if(!image)url.hash='';try{await navigator.clipboard.writeText(url.href);out.textContent=image?'Image link copied.':'Album link copied.';}catch{out.textContent=`Copy this link: ${url.href}`;}}
  document.getElementById('album-share').onclick=()=>copyLink();document.getElementById('viewer-share').onclick=()=>copyLink(true);
  document.getElementById('album-reset').onclick=()=>{category='all';search.value='';updateFilters();render();search.focus();};search.addEventListener('input',render);
  function openHash(){const id=new URLSearchParams(location.hash.slice(1)).get('image');if(!id)return;const index=visible.findIndex(r=>r.id===id);if(index>=0)open(index,grid.children[index]?.querySelector('a'));}
  updateFilters();render();openHash();window.addEventListener('hashchange',openHash);
  document.getElementById('year').textContent=new Date().getFullYear();
  // Only images in the artist's published Photos section are added automatically.
  async function loadPublishedPhotos(){try{
    const r=await fetch('https://console.richrowmusic.com/api/addon/page?slug=dracodon17',{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(8000)});if(!r.ok)return;const page=await r.json();if(!Array.isArray(page.blocks))return;
    let inPhotos=false;const additions=[],seen=new Set(records.map(r=>r.src));
    for(const b of page.blocks){if(b.hidden)continue;if(b.type==='heading'){inPhotos=/^photos(?:\s|$)/i.test(b.title||'');continue;}if(!inPhotos)continue;
      const media=b.type==='gallery'&&Array.isArray(b.media)?b.media:['image','cover','release'].includes(b.type)&&b.media?[b.media]:[];
      for(const m of media){const src=safe(m.url);if(!src||seen.has(src))continue;seen.add(src);const artwork=['cover','release'].includes(b.type);additions.push({id:`published-${encodeURIComponent(src)}`,src,title:b.type==='gallery'?(m.name||'Draco Don17'):(b.title||m.name||'Draco Don17'),category:artwork?'artwork':'photo',kind:artwork?'Release artwork':'Artist photo'});}
    }
    if(additions.length){if(dialog.open)dialog.close();records=[...additions,...initial];updateFilters();render();openHash();}
  }catch{/* The saved album remains fully available when the photo source is offline. */}}
  loadPublishedPhotos();
})();
