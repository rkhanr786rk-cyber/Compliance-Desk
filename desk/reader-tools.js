(() => {
  'use strict';
  const records=window.DeskEditionRecords;
  const stamp=iso=>new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(iso+'T12:00:00Z'));
  function editionDay(label) {
    const parts=/^(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{4})$/.exec(label||'');
    if(!parts)return '';
    const month='Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ').indexOf(parts[2])+1;
    return parts[3]+'-'+String(month).padStart(2,'0')+'-'+parts[1].padStart(2,'0');
  }
  function dateView(r,day,h) {
    if(!day)return 'Choose a date to check the wording held for this provision.';
    const record=records[r.id];
    const match=record?.versions.find(v=>v.from<=day&&day<=v.through);
    const full=editionDay(r.asOf)===day;
    const status=full?'The bundled edition matches '+stamp(day)+'.':match?'Verified wording for '+record.scope+' on '+stamp(day)+'.':
      editionDay(r.asOf)?'There is no verified text for '+stamp(day)+' in this entry. The full reader shows the '+r.asOf+' edition.':'The rule set has no confirmed edition date. This desk cannot establish its wording on '+stamp(day)+'.';
    return '<p>'+h(status)+'</p>'+(match?'<div class="historical-wording"><strong>'+h(record.scope)+'</strong>'+match.paragraphs.map(p=>'<p>'+h(p)+'</p>').join('')+'</div>':'');
  }
  function comparison(record,h) {
    if(!record)return '';
    const versions=record.versions;
    return '<details class="edition-compare"><summary>Compare amended wording · '+h(record.scope)+'</summary><p>'+h(record.summary)+'</p><div class="version-columns">'+versions.map((v,i)=>'<section><h3>'+ (i?'After amendment':'Before amendment')+'</h3><small>Verified '+stamp(v.from)+' – '+stamp(v.through)+'</small>'+v.paragraphs.map(p=>'<p class="'+(versions[i?0:1].paragraphs.includes(p)?'':'changed')+'">'+h(p)+'</p>').join('')+'</section>').join('')+'</div></details>';
  }
  function attach({page,r,body,catalog,read,ref,html:h,state,persist,focusNote}) {
    const layout=page.querySelector('.detail-layout'), reading=layout.querySelector('.reading'), sidebar=layout.querySelector('aside');
    const paras=Array.from(reading.querySelectorAll('.statute > p'));
    const record=records[r.id];
    const panel=document.createElement('section');panel.className='law-desk-tools';
    panel.innerHTML='<details class="law-editions"><summary>Law as on a date</summary><label class="desk-field"><span>Check wording on</span><input type="date" data-date></label><div data-date-answer aria-live="polite">'+dateView(r,'',h)+'</div>'+comparison(record,h)+'<a class="text-link" href="#editions">Edition register</a></details>';
    reading.querySelector('.reading-toolbar').after(panel);
    panel.querySelector('[data-date]').oninput=e=>{panel.querySelector('[data-date-answer]').innerHTML=dateView(r,e.target.value,h);};
    const noteKey=i=>r.id+'|'+r.asOf+'|'+i;
    state.readerNotes??={};
    if(paras.length) {
      const notes=document.createElement('details');notes.className='law-notes';
      notes.innerHTML='<summary>Passage notes'+(Object.keys(state.readerNotes).some(k=>k.startsWith(r.id+'|'))?' · saved':'')+'</summary>'+
        '<label class="desk-field"><span>Passage</span><select data-passage>'+body.paragraphs.map((p,i)=>'<option value="'+i+'">'+(i+1)+' · '+h(p.slice(0,75))+'</option>').join('')+'</select></label><label class="desk-field"><span>Your note</span><textarea data-note rows="3"></textarea></label><div class="work-actions"><button type="button" class="btn" data-save-note>Save note</button><button type="button" class="btn" data-jump>Go to passage</button></div><p class="meta" data-note-status role="status"></p>';
      panel.append(notes);
      const select=notes.querySelector('[data-passage]'),area=notes.querySelector('[data-note]'),signal=notes.querySelector('[data-note-status]');
      function showNote(){area.value=state.readerNotes[noteKey(select.value)]?.text||'';signal.textContent=area.value?'Saved in this browser.':'';}
      function jump(){const p=paras[Number(select.value)];if(!p)return;p.setAttribute('tabindex','-1');p.focus({preventScroll:true});p.scrollIntoView({block:'center'});}
      select.onchange=showNote;notes.querySelector('[data-jump]').onclick=jump;
      notes.querySelector('[data-save-note]').onclick=()=>{const text=area.value.trim(),i=Number(select.value);
        if(text)state.readerNotes[noteKey(i)]={id:r.id,asOf:r.asOf,i,text};
        else delete state.readerNotes[noteKey(i)];
        persist();signal.textContent=text?'Note saved in this browser.':'Note cleared.';};
      if(/^p\d+$/.test(focusNote||'')){const i=Number(focusNote.slice(1));if(paras[i]){select.value=String(i);notes.open=true;jump();}}
      showNote();
    }
    const linked=(body.related||[]).map(x=>catalog.get(x.id)).filter(Boolean);
    if(!linked.length)return;
    const control=document.createElement('div');control.className='alongside-select';
    control.innerHTML='<label class="desk-field"><span>Read alongside</span><select>'+linked.map(v=>'<option value="'+h(v.id)+'">'+h(ref(v)+' · '+v.title)+'</option>').join('')+'</select></label><button class="btn" type="button">Open alongside</button>';
    panel.append(control);
    let secondary,sequence=0,origin;
    function anchor(){const p=paras.find(el=>el.getBoundingClientRect().bottom>90);return p&&[p,p.getBoundingClientRect().top];}
    function align(a){if(a)window.scrollBy({top:a[0].getBoundingClientRect().top-a[1],behavior:'instant'});}
    function close(){
      sequence++;
      if(!secondary)return;
      secondary.remove();secondary=null;sidebar.hidden=false;layout.classList.remove('paired-reading');
      origin?.button?.focus({preventScroll:true});if(origin)window.scrollTo({top:origin.y,behavior:'instant'});
    }
    async function open(id,button) {
      const entry=catalog.get(id);if(!entry)return;
      const order=++sequence;
      if(!secondary)origin={button,y:window.scrollY};
      const pos=anchor();
      if(!secondary){secondary=document.createElement('aside');secondary.className='reading parallel-reading';layout.insertBefore(secondary,sidebar);}
      sidebar.hidden=true;layout.classList.add('paired-reading');
      const node=secondary;node.innerHTML='<div class="parallel-heading"><strong>Alongside</strong><button type="button" class="btn">Close</button></div><h2>'+h(ref(entry)+' · '+entry.title)+'</h2><p class="meta">'+h(entry.group)+' · '+h(entry.asOf)+'</p><div class="parallel-text" aria-live="polite">Opening provision…</div>';
      node.querySelector('button').onclick=close;control.querySelector('select').value=id;
      if(window.matchMedia('(min-width: 900px)').matches){align(pos);node.querySelector('button').focus({preventScroll:true});}
      else{node.scrollIntoView({block:'start'});node.querySelector('button').focus({preventScroll:true});}
      try{
        const other=await read(entry);
        if(order!==sequence||!node.isConnected)return;
        node.querySelector('.parallel-text').innerHTML=(other.note?'<p class="source-note">'+h(other.note)+'</p>':'')+
          '<div class="statute" style="--reading-size:'+Number(state.sizes||1.16)+'">'+other.paragraphs.map(p=>'<p>'+h(p)+'</p>').join('')+'</div>'+
          (other.pdf?'<a class="btn" href="'+h(other.pdf)+'">Read schedule pages</a>':'')+
          '<a class="text-link" href="#reader/'+encodeURIComponent(id)+'">Open full reader</a>';
      }catch{if(order===sequence&&node.isConnected)node.querySelector('.parallel-text').textContent='Could not open this provision. Close it and try again.';}
    }
    control.querySelector('button').onclick=e=>open(control.querySelector('select').value,e.currentTarget);
    sidebar.querySelectorAll('.link-group a').forEach(a=>{a.title='Read alongside';a.onclick=e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();open(decodeURIComponent(a.hash.slice(8)),a);};});
  }
  function register({page,catalog,flows,templates,ref,html:h,state,persist,header}) {
    const statuses=state.editionReview??={};
    page.innerHTML=header('Legal references','Edition register','Check the dates covered by the reader and review related practice materials when wording changes.')+
      '<div class="coverage-bar"><span><strong>Companies Act</strong>1 April 2021 edition</span><span><strong>SEBI LODR</strong>15 October 2026 edition</span><span><strong>Companies Rules</strong>Dates shown per rule set</span></div>'+
      '<h2 class="edition-subtitle">Tracked amendments</h2>'+Object.entries(records).map(([id,rec])=>{
        const parent=catalog.get(id),relatedFlows=flows.filter(p=>p.related?.includes(id)),docIds=new Set(relatedFlows.flatMap(p=>p.templates||[]));
        const docs=templates.filter(d=>docIds.has(d.id)||(parent?.kind==='act'&&String(d.section)===String(parent.number)));
        return '<article class="panel edition-card"><div class="kicker">Effective '+stamp(rec.changeDate)+'</div><h2><a href="#reader/'+encodeURIComponent(id)+'/history">'+h(rec.scope)+'</a></h2><p>'+h(rec.summary)+'</p>'+
          '<p class="meta">Coverage checked through '+stamp(rec.versions.at(-1).through)+'</p>'+comparison(rec,h)+
          '<details class="impact"><summary>Materials to review</summary><p><a href="#reader/'+encodeURIComponent(id)+'">'+h(ref(parent))+' · linked provisions</a></p><div data-edition-links="'+h(id)+'"></div>'+
          [...relatedFlows.map(p=>['#procedures/'+encodeURIComponent(p.id),p.title]),...docs.map(d=>['#documents/'+encodeURIComponent(d.id),d.title])].map(([url,title])=>'<a class="impact-link" href="'+url+'">'+h(title)+'</a>').join('')+
          '<label class="desk-tick"><input type="checkbox" data-reviewed="'+h(id)+'" '+(statuses[id]?'checked':'')+'>I reviewed the linked materials</label></details></article>';
      }).join('')+'<p class="meta">For dates outside the verified coverage, the reader displays the available edition. <a class="text-link" href="#materials">How to add missing amendments</a></p>';
    for(const el of page.querySelectorAll('[data-edition-links]')) {
      const parent=catalog.get(el.dataset.editionLinks);
      window.DeskData.load('desk/library/'+parent.part).then(chunk=>{
        if(!el.isConnected)return;const related=chunk[parent.id]?.related||[];
        el.innerHTML=related.map(x=>catalog.get(x.id)).filter(Boolean).map(x=>'<a class="impact-link" href="#reader/'+encodeURIComponent(x.id)+'">'+h(ref(x)+' · '+x.title)+'</a>').join('');
      }).catch(()=>{el.textContent='Open the reader to view indexed links.';});
    }
    page.querySelectorAll('[data-reviewed]').forEach(c=>c.onchange=()=>{statuses[c.dataset.reviewed]=c.checked;persist();});
  }
  window.DeskReaderTools={attach,register};
})();
