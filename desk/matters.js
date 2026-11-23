(() => {
  'use strict';
  const store = window.MatterStore;
  const stages = ['In progress', 'Awaiting signature', 'Pending filing', 'Closed'];
  const companyTypes = ['Private company','Public company','One Person Company','Other'];
  const listings = ['Review needed','Listed','Unlisted'];
  const modes = ['In person','Video conference','Hybrid'];
  const fileTypes = ['Signed document','Filing acknowledgement','Supporting record'];
  const uid = () => crypto.randomUUID ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const route = (id, tab = '') => '#matter/' + encodeURIComponent(id) + (tab ? '/' + tab : '');
  const isoToday = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const displayDate = date => date ? new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(date + 'T12:00:00Z')) : 'Unscheduled';
  const stamp = data => new TextEncoder().encode(data);
  const safeName = value => (value || 'Matter').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-').replace(/^[. ]+|[. ]+$/g,'').slice(0,110) || 'Matter';
  const selectOptions = (options, selected) => options.map(x => '<option' + (x === selected ? ' selected' : '') + '>' + esc(x) + '</option>').join('');
  const section = (title,body) => '<section class="panel matter-panel"><h2>'+esc(title)+'</h2>'+body+'</section>';
  const links = (href,label,primary = false) => '<a class="btn '+(primary?'primary':'')+'" href="'+esc(href)+'">'+esc(label)+'</a>';
  function field(key,label,value='',settings={}) {
    const {type='text',options,wide=false,required=false,hint=''}=settings;
    const attr = ' name="'+key+'"'+(required?' required':'');
    const control = options ? '<select'+attr+'>'+selectOptions(options,value)+'</select>'
      : type==='textarea' ? '<textarea rows="3"'+attr+'>'+esc(value)+'</textarea>'
      : '<input type="'+type+'"'+attr+' value="'+esc(value)+'">';
    return '<label class="desk-field '+(wide?'wide':'')+'"><span>'+esc(label)+'</span>'+control+(hint?'<small>'+esc(hint)+'</small>':'')+'</label>';
  }
  const tick = (name,label,on) => '<label class="desk-tick"><input type="checkbox" name="'+name+'" '+(on?'checked':'')+'>'+esc(label)+'</label>';
  function companyFields(c={}) {
    return field('company','Company name',c.company,{required:true,wide:true})+field('cin','CIN',c.cin)+
      field('companyType','Company type',c.companyType,{options:companyTypes})+
      field('listing','Listing status',c.listing,{options:listings})+
      field('office','Registered office',c.office,{type:'textarea',wide:true})+
      field('directors','Director roster',c.directors,{type:'textarea',wide:true,hint:'One name per line.'})+
      tick('singleDirector','The OPC has only one director',c.singleDirector);
  }
  function getCompany(form) {
    const values = new FormData(form);
    return Object.fromEntries(['company','cin','office','directors','companyType','listing'].map(k=>[k,String(values.get(k)||'').trim()]).concat([['singleDirector',values.get('singleDirector')==='on']]));
  }
  function toggleOpc(form) {
    const type=form.elements.namedItem('companyType'), only=form.elements.namedItem('singleDirector');
    if(!type||!only)return;
    only.closest('label').hidden=type.value!=='One Person Company';
  }
  function download(bytes,filename,mime) {
    const url=URL.createObjectURL(new Blob([bytes],{type:mime||(filename.endsWith('.zip')?'application/zip':'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}));
    const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  function indexFile(m,flow,steps,paths) {
    const row=(l,v)=>'<dt>'+esc(l)+'</dt><dd>'+esc(v||'—')+'</dd>';
    return '<!doctype html><html lang="en"><meta charset="utf-8"><title>'+esc(m.title)+' · Closing index</title>'+
      '<style>body{font:16px/1.6 system-ui;color:#302a2d;max-width:52rem;margin:3rem auto;padding:0 1rem}h1,h2{font-family:Georgia,serif}dt{font-weight:bold}dd{margin:0 0 .5rem}p,dd,li{white-space:pre-wrap;overflow-wrap:anywhere}</style><main><h1>'+esc(m.title)+'</h1><dl>'+
      row('Company',m.company)+row('CIN',m.cin)+row('Procedure',flow.title)+row('Status',m.status)+row('Target date',m.due)+row('Meeting date',m.date)+row('Export date (India)',isoToday())+'</dl>'+
      '<h2>Checklist</h2><ol>'+steps.map(s=>'<li><strong>'+(m.checked?.[s.id]?'Complete':'Open')+' · '+esc(s.title)+'</strong><br>'+esc(s.detail||'')+(s.reason?'<br>'+esc(s.reason):'')+'</li>').join('')+'</ol>'+
      '<h2>Records in this file</h2>'+(paths.length?'<ul>'+paths.map(([p,label])=>'<li><a href="'+esc(p.split('/').map(encodeURIComponent).join('/'))+'">'+esc(label)+'</a></li>').join('')+'</ul>':'<p>No documents included.</p>')+
      '<h2>Filing references</h2><p>'+esc(m.filings||'None recorded.')+'</p><h2>Matter notes</h2><p>'+esc(m.notes||'None recorded.')+'</p></main></html>';
  }
  async function exportFile(id, flow, closing) {
    const m=await store.read('matters',id), entries=[], index=[];
    const choices=flow.id==='board-meeting' ? window.BoardDocuments.choicesFor(m).filter(c=>m.documents?.[c.id]!==false) : [];
    for(const item of choices) {
      const name=(closing?'Working drafts/':'')+safeName(item.title)+'.docx';
      entries.push({name,bytes:await window.BoardDocuments.make(m,item.id)});
      index.push([name,'Working draft · '+item.title]);
    }
    if(closing) {
      const files=(await store.files(id,true)).sort((a,b)=>a.created.localeCompare(b.created)||a.id.localeCompare(b.id));
      for(const [i,f] of files.entries()) {
        const name='Records/'+String(i+1).padStart(3,'0')+'-'+safeName(f.name);
        entries.push({name,bytes:new Uint8Array(await f.data.arrayBuffer())});
        index.push([name,f.category+' · '+f.name]);
      }
      entries.unshift({name:'Index.html',bytes:stamp(indexFile(m,flow,window.DeskApplicability.steps(flow,m),index))});
    }
    if(!entries.length)throw new Error('Select at least one document.');
    download(await window.BoardDocuments.zip(entries),safeName(m.company+' - '+m.title)+(closing?' - closing file.zip':' - meeting pack.zip'));
  }
  function context(o) {
    const {page,flows,nav,crumb,header,notify,current,state,lawLabel}=o;
    const setPage=(trail,title,group='today')=>{nav(group);crumb(trail,title);document.title=title+' · Compliance Desk';};
    function alertError(e) { console.error(e);notify(e.message==='Select at least one document.'?e.message:'Could not complete this action. Check available browser storage and try again.'); }
    function run(button,work) {
      button.disabled=true;
      Promise.resolve().then(work).catch(alertError).finally(()=>{button.disabled=false;});
    }
    const procedure=id=>flows.find(p=>p.id===id);
    const applicable=(flow,m)=>window.DeskApplicability.steps(flow,m);
    const newLink=(flow='board-meeting')=>'#new/'+encodeURIComponent(flow);
    const baseTrail=[['Workspace','#overview']];
    function matterRow(m) {
      const flow=procedure(m.flowId); if(!flow)return '';
      const all=applicable(flow,m), next=all.find(s=>!m.checked?.[s.id]);
      const target=m.status==='Closed' || m.status==='Awaiting signature' || m.status==='Pending filing' || !next?'records':'checklist';
      return '<a class="work-row" href="'+route(m.id,target)+'"><div><strong>'+esc(m.title)+'</strong><small>'+esc(m.company)+' · '+esc(flow.title)+'</small></div><div class="work-due">'+esc(displayDate(m.due))+'<small>'+esc(m.status)+'</small></div></a>';
    }
    async function today() {
      const records=await store.read('matters');if(!current())return;
      setPage(baseTrail,'Today');
      const date=isoToday(), active=records.filter(m=>m.status!=='Closed').sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999')||a.title.localeCompare(b.title));
      const buckets=[['Overdue',active.filter(m=>m.due&&m.due<date)],['Due today',active.filter(m=>m.due===date)],['Awaiting signature',active.filter(m=>m.status==='Awaiting signature')],['Pending filing',active.filter(m=>m.status==='Pending filing')]];
      page.innerHTML=header('Client workspace','Today',displayDate(date)+' · India')+
        '<div class="work-actions">'+links(newLink(),'New Board Meeting Pack',true)+links('#new','New matter')+links('#companies','Company profiles')+'</div>'+
        '<div class="work-metrics">'+buckets.map(([title,items],i)=>'<button type="button" data-bucket="'+i+'" aria-pressed="false"><span>'+esc(title)+'</span><strong>'+items.length+'</strong></button>').join('')+'</div>'+
        section('Matter register','<div class="work-actions"><label class="desk-field grow"><span>Find a matter</span><input id="matter-find" type="search" placeholder="Company or matter name"></label><label class="desk-field"><span>Show</span><select id="matter-scope">'+selectOptions(['All open matters',...buckets.map(b=>b[0]),'Closed matters'],'All open matters')+'</select></label></div><div id="work-list" aria-live="polite"></div>')+
        legacyList(records);
      function filter() {
        const name=page.querySelector('#matter-scope').value, q=page.querySelector('#matter-find').value.toLowerCase().trim();
        const group=buckets.find(b=>b[0]===name);
        const rows=(group?group[1]:name==='Closed matters'?records.filter(m=>m.status==='Closed'):active).filter(m=>(m.company+' '+m.title).toLowerCase().includes(q));
        page.querySelector('#work-list').innerHTML=rows.map(matterRow).join('')||'<p class="work-empty">'+(records.length?'No matters match this view.':'Create a Board Meeting Pack or start a matter to track its next action here.')+'</p>';
        page.querySelectorAll('[data-bucket]').forEach((b,i)=>b.setAttribute('aria-pressed',String(buckets[i][0]===name)));
      }
      page.querySelector('#matter-scope').onchange=page.querySelector('#matter-find').oninput=filter;
      page.querySelectorAll('[data-bucket]').forEach((b,i)=>b.onclick=()=>{page.querySelector('#matter-scope').value=buckets[i][0];filter();});
      filter();
    }
    function legacyList(records) {
      const imported=new Set(records.map(r=>JSON.stringify([r.flowId,r.legacyName])));
      const rows=[];
      for(const [id,ms] of Object.entries(state.matters||{})) {
        const flow=procedure(id);if(!flow)continue;
        for(const name of Object.keys(ms)) {
          if(imported.has(JSON.stringify([id,name])))continue;
          rows.push('<div class="work-row"><div><strong>'+esc(name)+'</strong><small>'+esc(flow.title)+'</small></div>'+links(newLink(id)+'/'+encodeURIComponent(name),'Add to register')+'</div>');
        }
      }
      return rows.length?section('Earlier checklists',rows.join('')):'';
    }
    async function companies(id) {
      const list=await store.read('companies');if(!current())return;
      setPage(baseTrail,'Company profiles','companies');
      const edit=id?list.find(c=>c.id===id):null;
      if(id&&id!=='new'&&!edit)return o.missing();
      page.innerHTML=header('Client workspace','Company profiles','Use a saved profile when you start a matter. Each matter keeps its own copy of the company particulars.')+
        (id?section(edit?'Edit company':'Add a company','<form id="profile-form" class="desk-fields">'+companyFields(edit||{})+'<div class="wide work-actions"><button class="btn primary">Save company</button>'+links('#companies','Cancel')+'</div></form>'):
        '<div class="work-actions">'+links('#companies/new','Add company',true)+'</div>'+section('Companies',list.length?list.sort((a,b)=>a.company.localeCompare(b.company)).map(c=>'<a class="work-row" href="#companies/'+c.id+'"><div><strong>'+esc(c.company)+'</strong><small>'+esc(c.companyType)+' · '+esc(c.listing)+'</small></div><span>Edit profile</span></a>').join(''):'<p class="work-empty">Add a company here or save one while creating your first matter.</p>'));
      const form=page.querySelector('#profile-form');if(!form)return;
      toggleOpc(form);form.onchange=()=>toggleOpc(form);
      form.onsubmit=e=>{e.preventDefault();const c=getCompany(form);if(!c.company)return;
        run(form.querySelector('button'),async()=>{if(edit)await store.patch('companies',edit.id,c);else await store.addCompany({...c,id:uid()});location.hash='#companies';});};
    }
    async function create(flowId,legacyName) {
      const list=(await store.read('companies')).sort((a,b)=>a.company.localeCompare(b.company));if(!current())return;
      if(flowId&&!procedure(flowId))return o.missing();
      const board=flowId==='board-meeting';
      setPage([['Today','#today']],board?'New Board Meeting Pack':'New matter');
      const flow=procedure(flowId)||flows[0];
      const old=legacyName&&Object.hasOwn(state.matters?.[flow.id]||{},legacyName)?legacyName:'';
      const picks=flows.map(p=>'<option value="'+esc(p.id)+'" '+(p.id===flow.id?'selected':'')+'>'+esc(p.title)+'</option>').join('');
      page.innerHTML=header('Client workspace',board?'New Board Meeting Pack':'New matter','Choose the company and procedure to open a working file in this browser.')+
        '<form id="matter-create">'+section('Matter particulars','<div class="desk-fields"><label class="desk-field wide"><span>Procedure</span><select name="flowId" '+(old?'disabled':'')+'>'+picks+'</select></label>'+
        field('title','Matter name',old|| (board?'Board meeting':flow.title),{wide:true,required:true})+field('due','Target date','',{type:'date',hint:'Your working deadline.'})+'</div>')+
        section('Company','<label class="desk-field"><span>Company profile</span><select name="profile"><option value="">Add a company</option>'+list.map(c=>'<option value="'+c.id+'">'+esc(c.company)+'</option>').join('')+'</select></label><fieldset id="new-profile" class="desk-fields">'+companyFields()+'</fieldset>')+
        '<div class="work-actions"><button class="btn primary">Create matter</button>'+links('#today','Cancel')+'</div></form>';
      const form=page.querySelector('#matter-create'),profile=form.elements.profile,panel=form.querySelector('#new-profile');
      if(list.length===1)profile.value=list[0].id;
      function choose(){panel.hidden=panel.disabled=Boolean(profile.value);toggleOpc(form);}
      choose();profile.onchange=choose;form.elements.companyType.onchange=()=>toggleOpc(form);
      form.elements.flowId.onchange=()=>{form.elements.title.value=procedure(form.elements.flowId.value).title;};
      form.onsubmit=e=>{e.preventDefault();const title=form.elements.title.value.trim();if(!title)return;
        run(form.querySelector('button'),async()=>{
          const saved=list.find(c=>c.id===profile.value),c=saved||{...getCompany(form),id:uid()};if(!c.company)throw new Error('Missing company');
          const f=procedure(form.elements.flowId.value);
          const checked={};if(old)Object.entries(state.matters[f.id][old]).forEach(([k,v])=>{const i=Number(k);checked[i<f.steps.length?'step-'+i:'check-'+(i-f.steps.length)]=Boolean(v);});
          const {id:companyId,...snapshot}=c;
          const m={...snapshot,id:uid(),companyId,flowId:f.id,title,due:form.elements.due.value,status:'In progress',mode:modes[0],checked,documents:{},created:new Date().toISOString(),legacyName:old};
          await store.saveMatter(m,saved?null:c);location.hash=route(m.id,'details');
        });};
    }
    function details(m,board) {
      const info=field('title','Matter name',m.title,{wide:true,required:true})+
        field('due','Target date',m.due,{type:'date'})+field('status','Status',m.status,{options:stages});
      const meeting=field('date','Meeting date',m.date,{type:'date'})+field('noticeDate','Notice date',m.noticeDate,{type:'date'})+
        field('time','Start time',m.time,{type:'time'})+field('endTime','End time',m.endTime,{type:'time'})+
        field('venue','Venue or joining details',m.venue,{wide:true})+field('mode','Meeting mode',m.mode,{options:modes})+
        field('chair','Chairperson',m.chair)+field('signatory','Signatory',m.signatory)+
        field('agenda','Agenda items',m.agenda,{type:'textarea',wide:true,hint:'Enter one item per line.'})+
        tick('shortNotice','Review shorter notice',m.shortNotice)+tick('interest','A director has disclosed an interest',m.interest)+
        field('attendance','Attendance actually recorded',m.attendance,{type:'textarea',wide:true})+
        field('decisions','Decisions and dissent recorded at the meeting',m.decisions,{type:'textarea',wide:true})+
        field('resolution','Exact wording of the adopted resolution',m.resolution,{type:'textarea',wide:true});
      return '<form id="matter-edit">'+section('Matter particulars','<div class="desk-fields">'+info+'</div>')+
        (board?'<div id="ordinary-board-fields" '+(window.BoardDocuments.isSoleDirector(m)?'hidden':'')+'>'+section('Meeting particulars','<div class="desk-fields">'+meeting+'</div>')+'</div><div id="sole-board-fields" '+(window.BoardDocuments.isSoleDirector(m)?'':'hidden')+'>'+section('Sole-director decision','<div class="desk-fields">'+field('soleDate','Decision date',m.date,{type:'date'})+field('soleSignatory','Sole director signing',m.signatory)+field('soleResolution','Exact resolution entered in the minutes book',m.resolution,{type:'textarea',wide:true})+field('soleDecisions','Decision particulars',m.decisions,{type:'textarea',wide:true})+'</div>')+'</div>':'')+
        '<details class="panel matter-panel"><summary>Company particulars for this matter</summary><div class="desk-fields">'+companyFields(m)+'</div></details>'+
        section('Notes and filing references','<div class="desk-fields">'+field('notes','Working notes and actions',m.notes,{type:'textarea',wide:true})+
        field('filings','Filing acknowledgements and SRNs',m.filings,{type:'textarea',wide:true})+'</div>')+'</form>';
    }
    function checklist(m,flow) {
      const steps=applicable(flow,m),done=steps.filter(s=>m.checked?.[s.id]).length;
      let prev;
      return section('Working checklist','<p id="step-count" class="meta">'+done+' of '+steps.length+' complete</p>'+
        steps.map(s=>{
          const group=s.final?'Completion checks':'Procedure steps';
          const title=group===prev?'':'<h3 class="work-subhead">'+group+'</h3>';prev=group;
          return title+'<div class="work-step"><label class="step"><input type="checkbox" data-track="'+esc(s.id)+'" '+(m.checked?.[s.id]?'checked':'')+'><span><strong>'+esc(s.title)+'</strong>'+
            (s.detail?'<p>'+esc(s.detail)+'</p>':'')+'</span></label>'+
            (s.reason?'<p class="why-step">'+esc(s.reason)+'</p>':'')+
            ((s.lawIds||[]).length?'<div class="step-laws">'+s.lawIds.map(id=>{const label=lawLabel(id);return label?'<a href="#reader/'+encodeURIComponent(id)+'">'+esc(label)+'</a>':'';}).join('')+'</div>':'')+'</div>';
        }).join(''));
    }
    function records(m,board,files) {
      const docs=board?section('Board Meeting Pack','<p>Choose the editable Word drafts to include. Each uses the particulars saved for this matter.</p>'+
        window.BoardDocuments.choicesFor(m).map(c=>'<div class="work-row"><label class="desk-tick"><input type="checkbox" data-doc="'+c.id+'" '+(m.documents?.[c.id]!==false?'checked':'')+'>'+esc(c.title)+'</label><button class="btn" type="button" data-word="'+c.id+'">Word</button></div>').join('')+
        '<div class="work-actions"><button class="btn primary" id="download-pack">Download selected documents (.zip)</button></div>'):'';
      const attached=files.map(f=>'<div class="work-row"><div><strong>'+esc(f.name)+'</strong><small>'+esc(f.category)+' · '+Math.max(1,Math.ceil(f.size/1024))+' KB</small></div><div class="record-actions"><button type="button" class="btn" data-get-file="'+f.id+'" aria-label="Download '+esc(f.name)+'">Download</button><button type="button" class="btn" data-remove="'+f.id+'" aria-label="Remove '+esc(f.name)+'">Remove</button></div></div>').join('');
      return docs+section('Matter records','<p>Add signed documents, filing acknowledgements and supporting papers. The files stay in this browser.</p>'+
        '<form id="add-files" class="work-actions"><label class="desk-field"><span>Record type</span><select name="category">'+selectOptions(fileTypes,fileTypes[0])+'</select></label><label class="desk-field grow"><span>Choose files</span><input type="file" name="records" multiple required></label><button class="btn">Add records</button></form>'+
        (attached||'<p class="work-empty">No records attached yet.</p>'))+
        section('Closing file','<p>Download an index, the checklist with its current status, filing references, selected working drafts and all attached records.</p><button id="close-export" type="button" class="btn primary">Download closing file (.zip)</button>');
    }
    async function matter(id,tab='details') {
      const [m,files]=await Promise.all([store.read('matters',id),store.files(id)]);if(!current())return;
      const flow=m&&procedure(m.flowId);if(!flow||!['details','checklist','records'].includes(tab))return o.missing();
      const board=flow.id==='board-meeting';
      setPage([['Today','#today']],m.title);
      const tabs=[['details',board?'Meeting details':'Matter details'],['checklist','Checklist'],['records','Documents & closing file']];
      page.innerHTML='<header class="page-head work-head"><div class="kicker">'+esc(m.company)+'</div><h1>'+esc(m.title)+'</h1><p>'+esc(flow.title)+'</p></header>'+
        '<div class="matter-caption"><span class="chip" id="matter-status">'+esc(m.status)+'</span><span id="save-state" role="status">Saved in this browser</span></div>'+
        '<nav aria-label="Matter sections" class="tabs">'+tabs.map(([key,label])=>'<a class="tab '+(tab===key?'selected':'')+'" '+(tab===key?'aria-current="page"':'')+' href="'+route(id,key)+'">'+label+'</a>').join('')+'</nav>'+
        (tab==='details'?details(m,board):tab==='checklist'?checklist(m,flow):records(m,board,files));
      let seq=0;
      function save(fields,nested) {
        const n=++seq,signal=page.querySelector('#save-state');signal.textContent='Saving…';
        return store.patch('matters',id,fields,nested).then(()=>{if(seq===n&&current())signal.textContent='Saved in this browser';})
          .catch(e=>{if(current())signal.textContent='Save failed';alertError(e);});
      }
      const form=page.querySelector('#matter-edit');
      if(form) {
        toggleOpc(form);form.onsubmit=e=>e.preventDefault();
        form.oninput=e=>{const el=e.target;if(!el.name)return;
          if((el.name==='company'||el.name==='title')&&!el.value.trim()){el.setCustomValidity('Enter a name.');el.reportValidity();return;}
          el.setCustomValidity('');const v=el.type==='checkbox'?el.checked:el.value;
          if(el.name==='companyType')toggleOpc(form);
          const counterpart={soleDate:'date',soleSignatory:'signatory',soleResolution:'resolution',soleDecisions:'decisions'};
          const key=counterpart[el.name]||el.name;
          if(board){
            const twin=counterpart[el.name]||Object.keys(counterpart).find(k=>counterpart[k]===el.name);
            if(twin)form.elements[twin].value=v;
            const sole=form.elements.companyType.value==='One Person Company'&&form.elements.singleDirector.checked;
            form.querySelector('#ordinary-board-fields').hidden=sole;
            form.querySelector('#sole-board-fields').hidden=!sole;
          }
          if(el.name==='status')page.querySelector('#matter-status').textContent=v;
          if(el.name==='company')page.querySelector('.work-head .kicker').textContent=v;
          if(el.name==='title'){page.querySelector('.work-head h1').textContent=v;document.title=v+' · Compliance Desk';}
          save({[key]:v});
        };
      }
      const checks=[...page.querySelectorAll('[data-track]')];checks.forEach(c=>c.onchange=()=>{
        save({[c.dataset.track]:c.checked},'checked');
        page.querySelector('#step-count').textContent=checks.filter(x=>x.checked).length+' of '+checks.length+' complete';
      });
      if(tab==='checklist'){const next=checks.find(c=>!c.checked);if(next)next.focus({preventScroll:true});if(next&&checks[0]!==next)next.scrollIntoView({block:'center'});}
      const docChecks=[...page.querySelectorAll('[data-doc]')];
      const pack=page.querySelector('#download-pack');
      docChecks.forEach(c=>c.onchange=()=>{save({[c.dataset.doc]:c.checked},'documents');pack.disabled=!docChecks.some(x=>x.checked);});
      if(pack){pack.disabled=!docChecks.some(x=>x.checked);pack.onclick=()=>run(pack,()=>exportFile(id,flow,false));}
      page.querySelectorAll('[data-word]').forEach(b=>b.onclick=()=>run(b,async()=>{
        const refreshed=await store.read('matters',id),choice=window.BoardDocuments.choicesFor(refreshed).find(c=>c.id===b.dataset.word);
        download(await window.BoardDocuments.make(refreshed,choice.id),safeName(refreshed.company+' - '+choice.title)+'.docx');
      }));
      const close=page.querySelector('#close-export');if(close)close.onclick=()=>run(close,()=>exportFile(id,flow,true));
      const add=page.querySelector('#add-files');if(add)add.onsubmit=e=>{e.preventDefault();
        run(add.querySelector('button'),async()=>{const uploads=Array.from(add.elements.records.files,f=>({id:uid(),matterId:id,name:f.name,size:f.size,category:add.elements.category.value,data:f,created:new Date().toISOString()}));
          await store.addFiles(uploads);if(current())await matter(id,tab);});};
      page.querySelectorAll('[data-get-file]').forEach(b=>b.onclick=()=>run(b,async()=>{
        const f=await store.read('files',b.dataset.getFile);
        if(!f||f.matterId!==id)throw new Error('Record unavailable');
        download(f.data,f.name,f.data.type||'application/octet-stream');
      }));
      page.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{if(confirm('Remove this attached copy from the matter?'))run(b,async()=>{await store.removeFile(b.dataset.remove);if(current())await matter(id,tab);});});
    }
    return {today,companies,create,matter};
  }
  window.DeskMatters = {context};
})();
