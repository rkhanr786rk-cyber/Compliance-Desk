(() => {
  'use strict';
  const items = [
    {id:'workbooks',title:'Excel workbooks',description:'Download statutory registers, filing trackers, meeting planners and financial worksheets.'},
    {id:'calendar',title:'Compliance calendar',description:'Build filing and meeting reminders around the financial year, meeting date and company events.'},
    {id:'notice-dates',title:'Notice and date calculator',description:'Calculate dispatch and meeting dates, Board intervals, AGM limits and filing deadlines.'},
    {id:'filing-index',title:'Filing and form index',description:'Find 139 form references with their procedures, records to collect and related rules.'},
    {id:'stamp',title:'Stamp duty estimator',description:'Model incorporation and capital increases using an archived state-by-state duty schedule.'},
    {id:'cases',title:'Case law',description:'Explore judgments by issue, court and citation, then read the related provisions.'},
    {id:'subjects',title:'Subject index',description:'Find a term or topic and open the corresponding sections of the Companies Act.'},
  ];
  const h = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const pending = new Map();
  const base = new URL('./tool-data/',document.currentScript?.src || new URL('desk/tools.js',document.baseURI));
  function load(key) {
    const data = window.DeskToolData;
    if (data?.[key]) return Promise.resolve(data[key]);
    if (pending.has(key)) return pending.get(key);
    const promise = new Promise((resolve,reject) => {
      const script = document.createElement('script');
      script.src = new URL((/^c\d+$/.test(key) ? 'cases/' : '') + key + '.js',base).href;
      script.onload = () => {
        const value = window.DeskToolData?.[key];
        pending.delete(key);
        if (value) resolve(value); else reject(new Error('Missing collection'));
      };
      script.onerror = () => {pending.delete(key);script.remove();reject(new Error('Unreadable collection'));};
      document.head.append(script);
    });
    pending.set(key,promise);
    return promise;
  }
  function styles(){
    if(document.getElementById('practice-tool-style'))return;
    const style=document.createElement('style');
    style.id='practice-tool-style';
    style.textContent=`
      .pt{line-height:1.55}.pt h2,.pt h3{font-family:var(--serif,Georgia,serif);line-height:1.28}.pt h2{font-size:1.5rem;margin:1.25rem 0 .6rem}.pt h3{font-size:1.18rem}.pt p{margin:.55rem 0}.pt .pt-note,.pt small{color:var(--muted,#655f60)}.pt .pt-controls{display:flex;gap:.8rem;flex-wrap:wrap;align-items:end;margin:1rem 0}.pt .pt-controls label{display:grid;gap:.3rem;min-width:0;flex:1 1 12rem;font-size:.9rem;font-weight:550}.pt input:not([type=checkbox]),.pt select{max-width:100%;padding:.65rem .7rem;border:1px solid var(--line,#d8d4cd);border-radius:.45rem;background:var(--card,white);min-height:2.7rem;color:var(--ink,#342d2e)}.pt input[type=checkbox]{width:1rem;height:1rem;accent-color:var(--wine,#682b40)}.pt select{appearance:auto}.pt fieldset{border:1px solid var(--line,#d8d4cd);border-radius:.5rem;padding:.6rem 1rem 1rem;margin:.8rem 0}.pt legend{font-weight:600;padding:0 .3rem}.pt .pt-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,16.5rem),1fr));gap:.7rem}.pt .pt-card,.pt details{border:1px solid var(--line,#ddd);border-radius:.5rem;background:var(--card,white);padding:1rem}.pt .pt-card{display:flex;flex-direction:column;align-items:flex-start;gap:.25rem}.pt .pt-card h3{margin:0}.pt .pt-card small{margin-bottom:.65rem}.pt .pt-card a{margin-top:auto}.pt details{margin:.55rem 0}.pt summary{cursor:pointer;font-weight:600;line-height:1.55}.pt summary small{font-weight:400;display:block;margin-left:1rem}.pt .pt-actions,.pt .pt-letters{display:flex;gap:.45rem;flex-wrap:wrap;align-items:center;margin:.7rem 0}.pt .pt-button{display:inline-block;background:var(--wine,#682b40);color:white;border:1px solid var(--wine,#682b40);border-radius:.4rem;padding:.5rem .75rem;font-weight:550;font-size:.9rem;text-decoration:none}.pt .pt-button.secondary,.pt .pt-letters button{background:var(--card,white);color:var(--wine,#682b40);border:1px solid var(--line,#ddd);border-radius:.38rem;padding:.45rem .65rem}.pt .pt-letters button[aria-pressed=true]{background:var(--wine,#682b40);color:white}.pt .pt-button:disabled{opacity:.48}.pt .pt-table-wrap{overflow:auto}.pt table{border-collapse:collapse;width:100%;font-size:.94rem}.pt th,.pt td{padding:.6rem .52rem;border-bottom:1px solid var(--line,#ddd);text-align:left;vertical-align:top}.pt th{font-weight:600}.pt thead th{background:var(--soft,#f4f1eb)}.pt .pt-entry>strong,.pt td small{display:block}.pt td.date{white-space:nowrap}.pt .pt-text{font-family:var(--serif,Georgia,serif);line-height:1.72;font-size:1.1rem;max-width:76ch}.pt .pt-entry{border-bottom:1px solid var(--line,#ddd);padding:.65rem 0}.pt .pt-ref{margin:.45rem .6rem .45rem 0;display:inline-block;text-decoration:underline;text-underline-offset:2px}.pt .pt-feedback{padding:.65rem 0;color:var(--wine,#682b40);font-weight:550}.pt .pt-check{display:block;margin:.45rem 0}.pt .pt-print-only{display:none}
      @media print{.pt .pt-controls,.pt .pt-actions,.pt fieldset,.pt input,.pt .pt-check,.pt .pt-noprint{display:none!important}.pt tr:has(input[type=checkbox]:not(:checked)){display:none}.pt .pt-print-only{display:block}.pt .pt-table-wrap{overflow:visible}}
    `;
    document.head.append(style);
  }
  const normalize = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const matches = (q,...s) => normalize(q).split(/\s+/).every(t=>normalize(s.join(' ')).includes(t));
  const options = list => list.map(s=>`<option value="${h(s)}">${h(s)}</option>`).join('');
  const filters=(name,groups,placeholder) => `<div class="pt-controls"><label>Search ${name}<input type="search" data-query placeholder="${h(placeholder)}"></label><label>Category<select data-group><option value="">All categories</option>${options(groups)}</select></label></div>`;
  const refs = nums=>nums.map(n=>`<a class="pt-ref" href="#reader/act-${encodeURIComponent(n)}">Section ${h(n)}</a>`).join('');
  function directory(host, data, kind) {
    const isCase=kind==='cases';
    const rows = isCase ? data.cases : data;
    const groups = [...new Set(rows.map(r=>isCase?r.topic:r.group))];
    host.innerHTML=filters(isCase?'cases':'workbooks',groups,isCase?'Party, court, topic or citation':'Form, register or task')+'<div data-results></div>';
    const out=host.querySelector('[data-results]');
    const draw=()=>{
      const q=host.querySelector('[data-query]').value, group=host.querySelector('[data-group]').value;
      const found=rows.filter(r=>(!group||(isCase?r.topic:r.group)===group)&&(isCase?matches(q,r.t,r.cit,r.court,r.topic,r.sections.join(' '),r.brief.issue,r.brief.principle):matches(q,r.title,r.basis,r.description,r.group)));
      const extra = isCase ? data.extra.filter(r=>(!group||r.topic===group)&&matches(q,r.t,r.cit,r.topic)) : [];
      const summary=`<p class="pt-note" role="status">${found.length} ${isCase?'case records':'workbooks'}${extra.length?` · ${extra.length} additional citations`:''}</p>`;
      if(!found.length&&!extra.length){out.innerHTML=summary+'<p>Try a different term or category.</p>';return;}
      if(!isCase){
        out.innerHTML=summary+`<div class="pt-cards">${found.map(r=>`<article class="pt-card"><h3>${h(r.title)}</h3><p>${h(r.description)}</p><small>${h(r.basis)}</small><a class="pt-button secondary" href="${h(new URL('workbooks/'+encodeURIComponent(r.file),base).href)}" download="${h(r.file)}">Download Excel</a></article>`).join('')}</div>`;return;
      }
      out.innerHTML=summary+found.map(r=>`<details><summary>${h(r.t)}<small>${h(r.court)} · ${h(r.cit)}</small></summary><p class="pt-note">${h(r.topic)} · Case note</p>${[['facts','Facts'],['issue','Issue'],['held','Decision'],['principle','Principle']].map(([key,title])=>r.brief[key]?`<h3>${title}</h3><p class="pt-text">${h(r.brief[key])}</p>`:'').join('')}<h3>Related provisions</h3>${refs(r.sections)}<details data-case="${h(r.id)}"><summary>Read judgment extract</summary><div class="pt-text" data-body></div></details></details>`).join('')+(extra.length?`<h2>Additional citations</h2><p class="pt-note">For these entries, search the court’s judgment index using the party names, citation and year. Check the operative order and later treatment before relying on the decision.</p>${extra.map(r=>`<div class="pt-entry"><strong>${h(r.t)}</strong><small>${h(r.cit)} · ${h(r.topic)}</small></div>`).join('')}`:'');
      out.querySelectorAll('[data-case]').forEach(el=>el.addEventListener('toggle',async()=>{
        if(!el.open||el.dataset.loaded)return;
        const body=el.querySelector('[data-body]');body.textContent='Opening extract…';
        try{const lines=await load(el.dataset.case);body.innerHTML=lines.map(l=>'<p>'+h(l)+'</p>').join('');el.dataset.loaded='1';}
        catch{body.textContent='Reopen the entry to try loading the extract again.';}
      }));
    };
    host.querySelector('[data-query]').oninput=draw;host.querySelector('[data-group]').onchange=draw;draw();
  }
  function subjects(host,data){
    const letters=Object.keys(data), all=Object.values(data).flat();
    host.innerHTML='<div class="pt-controls"><label>Search index<input type="search" data-q placeholder="Term or section number"></label></div><nav class="pt-letters" aria-label="Subject initials"></nav><div data-list></div>';
    const nav=host.querySelector('nav'),out=host.querySelector('[data-list]'),query=host.querySelector('input');
    let letter=letters[0];
    nav.innerHTML=letters.map(l=>`<button data-letter="${h(l)}" type="button">${h(l)}</button>`).join('');
    const draw=()=>{
      const q=query.value.trim(), found=(q?all:data[letter]).filter(r=>!q||matches(q,r.t,r.s.map(s=>s[0]).join(' ')));
      nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(!q&&b.dataset.letter===letter)));
      out.innerHTML=`<p class="pt-note" role="status">${found.length} subjects</p>`+(found.length?found.map(r=>`<div class="pt-entry"><strong>${h(r.t)}</strong>${r.s.map(([n,t,sub])=>`<a class="pt-ref" href="#reader/act-${encodeURIComponent(n)}">§ ${h(n+sub)} · ${h(t)}</a>`).join('')}</div>`).join(''):'<p>No matching subjects.</p>');
    };
    nav.onclick=e=>{const b=e.target.closest('[data-letter]');if(b){letter=b.dataset.letter;query.value='';draw();}};query.oninput=draw;draw();
  }
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const D = (y, m, d) => new Date(Date.UTC(y, m, d));
const parse = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); return m ? D(+m[1], +m[2] - 1, +m[3]) : null; };
const addD = (d, n) => new Date(d.getTime() + n * 864e5);
const addM = (d, n) => { const y = d.getUTCFullYear(), m = d.getUTCMonth() + n, day = d.getUTCDate(); const t = D(y, m, 1); const last = D(t.getUTCFullYear(), t.getUTCMonth() + 1, 0).getUTCDate(); return D(t.getUTCFullYear(), t.getUTCMonth(), Math.min(day, last)); };
const addWD = (d, n) => { let x = d; while (n > 0) { x = addD(x, 1); const w = x.getUTCDay(); if (w !== 0 && w !== 6) n--; } return x; };
const fmt = d => `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const iso = d => d.toISOString().slice(0, 10);
const ymd = d => iso(d).replace(/-/g, "");

const EVENTS = [
  ["Appointment of a director or key managerial personnel", "DIR-12", 30, "Section 170(2)", "Within 30 days"],
  ["Resignation of a director (the company's filing)", "DIR-12", 30, "Section 168", "Within 30 days of receiving the notice"],
  ["Passing of a special resolution", "MGT-14", 30, "Section 117", "Within 30 days"],
  ["Allotment of shares by private placement", "PAS-3", 15, "Rule 14, Prospectus and Allotment Rules", "Within 15 days"],
  ["Allotment of shares (other than private placement)", "PAS-3", 30, "Section 39(4)", "Within 30 days"],
  ["Issue of share certificates after an allotment", "SH-1", "M2", "Section 56(4)", "Within 2 months of the allotment"],
  ["Creation of a registrable charge", "CHG-1 / CHG-9", 30, "Section 77", "Normal registration window. Check the separate extended windows and additional fees if delayed."],
  ["Satisfaction of a charge", "CHG-4", 30, "Section 82", "Within 30 days"],
  ["Change of the registered office within the same city", "INC-22", 30, "Section 12", "Within 30 days"],
  ["Incorporation: first Board meeting", "Board meeting", 30, "Section 173(1)", "Within 30 days of incorporation"],
  ["Incorporation: first auditor by the Board", "Board appointment", 30, "Section 139(6)", "Non-government company. Separately diary any return triggered by the appointment."],
  ["Incorporation: declaration of commencement of business", "INC-20A", 180, "Section 10A", "Within 180 days of incorporation"],
  ["Incorporation: issue of share certificates to the subscribers", "SH-1", "M2", "Section 56(4)", "Within 2 months of incorporation"],
  ["Auditor's resignation (the auditor's filing)", "ADT-3", 30, "Section 140(2)", "Within 30 days of the resignation"],
  ["Receipt of a declaration of significant beneficial ownership", "BEN-2", 30, "Section 90; SBO Rules", "Within 30 days of receiving BEN-1"],
  ["Board meeting held (send the draft minutes)", "Draft minutes", 15, "Secretarial Standard 1", "Within 15 days of the meeting"],
  ["Board meeting held (enter the minutes in the minute book)", "Minute-book entry", 30, "Secretarial Standard 1", "Within 30 days of the meeting"],
  ["Transfer instrument lodged (deliver certificate)", "Share certificate", "M1", "Section 56(4)(c)", "Within one month of receipt, where the statutory certificate requirement applies."],
];
  function annual(fy,meeting,kind,audit){
    const rows=[],y=fy.getUTCFullYear(),march=D(y,2,31),recordYear=fy<march?y-1:y,opc=kind==='opc';
    const put=(id,date,what,form,basis,note)=>rows.push({id,date,what,form,basis,note});
    const dispatch=addD(meeting,-22);
    if(!opc){
      put('board',dispatch,'Approve accounts and the Board’s report','Planning target','Sections 134 and 173','Schedule the Board ahead of dispatch. Adjust for delivery time and any valid shorter-notice consent.');
      put('notice',dispatch,'Dispatch the AGM notice','Notice','Section 101','Electronic or hand delivery with 21 clear days. Allow extra service time for post or courier.');
      put('agm',meeting,'Hold the AGM','Meeting','Section 96','Date entered. Check nine months for a first AGM or six months for a subsequent AGM, the 15-month interval, and any authorised extension.');
    }
    put('accounts',opc?addD(fy,180):addD(meeting,30),'File the financial statements','AOC-4 series','Section 137',opc?'180 days from financial year end.':'30 days from the AGM. Select the applicable filing variant.');
    put('return',addD(meeting,60),'File the annual return',['small','opc'].includes(kind)?'MGT-7A':'MGT-7','Sections 92 and 122',opc?'Planning date using the sole member’s signed and dated resolution minute. Confirm the filing period for the case.':'60 days from the AGM. For an unheld AGM, determine its statutory due date and record the reasons.');
    put('auditor',addD(meeting,15),'Notify auditor appointment or reappointment','ADT-1','Section 139 and Audit Rules','Include when an auditor is appointed or reappointed on the meeting or sole-member decision date.');
    put('special',addD(meeting,30),'File a registrable resolution','MGT-14','Section 117','Include when a resolution requiring filing passed on the meeting or decision date.');
    put('deposits',D(recordYear,5,30),'Return of deposits or applicable exempt receipts','DPT-3','Acceptance of Deposits Rules 16 and 16A','Where applicable. The return uses figures as at 31 March.');
    put('msme1',D(recordYear-1,9,31),'Review April–September outstanding supplier payments','MSME-1','Section 405 and Specified Companies Order','Only specified companies with qualifying micro or small enterprise dues beyond 45 days.');
    put('msme2',D(recordYear,3,30),'Review October–March outstanding supplier payments','MSME-1','Section 405 and Specified Companies Order','Only specified companies with qualifying micro or small enterprise dues beyond 45 days.');
    if(audit)put('audit',opc?meeting:dispatch,'Obtain the secretarial audit report','MR-3','Section 204','Planning target. Obtain before approving or dispatching the Board’s report, as applicable.');
    if(kind==='listed'){
      for(let q=1;q<=4;q++){
        const shifted=addM(fy,-12+3*q),qe=D(shifted.getUTCFullYear(),shifted.getUTCMonth()+1,0);
        const prefix='Q'+q+' · ';
        put('financial'+q,addD(qe,q===4?60:45),prefix+'Submit integrated financial filing','Financial results','Regulation 33','Main-board equity reporting cycle. Check the security type and any special first-year timeline.');
        put('pattern'+q,addD(qe,21),prefix+'Submit the shareholding pattern','Holdings statement','Regulation 31','Within 21 days of quarter end where applicable.');
        put('governance'+q,addD(qe,30),prefix+'Submit integrated governance filing','Governance and grievances','Regulations 10B, 13 and 27','Include applicable governance disclosures and the investor grievance statement.');
      }
      put('listed-audit',addD(fy,60),'Submit annual secretarial compliance report','Stock exchange filing','Regulation 24A','Where applicable. Check entity-specific exemptions.');
      put('reports',dispatch,'Send the annual report to the exchanges','Annual report','Regulation 34','Planning target. File no later than the day dispatch to shareholders starts.');
      put('voting',addWD(meeting,2),'Submit voting results','Voting results','Regulation 44(3)','Two working days. This estimate excludes weekends. Adjust for exchange holidays.');
    }
    return rows;
  }
  function saveFile(data,mime,name){
    const anchor=document.createElement('a'),url=URL.createObjectURL(new Blob([data],{type:mime}));
    anchor.href=url;anchor.download=name;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
  }
  function calendar(host){
    const now=new Date(),year=now.getMonth()>=3?now.getFullYear()+1:now.getFullYear();
    host.innerHTML=`<p class="pt-note">Use the company’s actual dates. Select the filings that apply before exporting. Exchange holidays, extensions and company-specific exemptions need a separate check.</p>
      <fieldset><legend>Company and reporting year</legend><div class="pt-controls"><label>Company name<input data-name maxlength="140" placeholder="Company name for reminders"></label><label>Company type<select data-type><option value="private">Private / unlisted public</option><option value="small">Small company</option><option value="opc">One Person Company</option><option value="listed">Listed equity · main board</option></select></label></div><div class="pt-controls"><label>Financial year end<input type="date" data-fy value="${year}-03-31"></label><label><span data-datelabel>AGM date</span><input type="date" data-meeting value="${year}-09-30"></label></div><label class="pt-check"><input type="checkbox" data-audit> Secretarial audit applies</label></fieldset>
      <fieldset><legend>Event-based filing</legend><div class="pt-controls"><label>Event<select data-event><option value="">Choose an event (optional)</option>${EVENTS.map((e,i)=>`<option value="${i}">${h(e[0])}</option>`).join('')}</select></label><label>Event date<input type="date" data-date></label></div></fieldset>
      <h2>Filing schedule</h2><div class="pt-actions"><button class="pt-button" data-ics>Download calendar (.ics)</button><button class="pt-button secondary" data-csv>Download CSV</button><button class="pt-button secondary" data-print>Print schedule</button></div><div data-plan></div>`;
    const el=s=>host.querySelector('[data-'+s+']'),excluded=new Set();
    let rows=[];
    function draw(){
      const fy=parse(el('fy').value),meeting=parse(el('meeting').value),ev=el('event').value,eventDate=parse(el('date').value),kind=el('type').value;
      el('datelabel').textContent=kind==='opc'?'Signed sole-member resolution date':'AGM date';
      const wrong=!fy||!meeting||meeting<=fy||(ev!==''&&!eventDate)||(ev===''&&eventDate);
      el('ics').disabled=el('csv').disabled=el('print').disabled=Boolean(wrong);
      if(wrong){
        rows=[];
        el('plan').innerHTML='<p class="pt-feedback" role="status">'+(!fy||!meeting?'Enter the year end and meeting or decision date.':meeting<=fy?'The annual meeting or decision must fall after the financial year end.':'Select both an event and its date, or clear both fields.')+'</p>';return;
      }
      rows=annual(fy,meeting,kind,el('audit').checked);
      if(ev!==''){
        const [what,form,gap,basis,note]=EVENTS[Number(ev)];
        rows.push({id:'event-'+ev,what,form,basis,note,date:gap==='M2'?addM(eventDate,2):gap==='M1'?addM(eventDate,1):addD(eventDate,gap)});
      }
      rows.sort((a,b)=>a.date-b.date);
      const company=el('name').value.trim();
      el('plan').innerHTML=`<p class="pt-print-only">${h(company)} · Financial year ended ${fmt(fy)}</p><p class="pt-note" data-selected></p><div class="pt-table-wrap"><table><thead><tr><th>Include</th><th>Date</th><th>Task</th><th>Timing and applicability</th></tr></thead><tbody>${rows.map(r=>`<tr><td><input type="checkbox" aria-label="Include ${h(r.what)}" data-id="${h(r.id)}" ${excluded.has(r.id)?'':'checked'}></td><td class="date">${fmt(r.date)}</td><td>${h(r.what)}<small>${h(r.form)}</small></td><td>${h(r.basis)}<small>${h(r.note)}</small></td></tr>`).join('')}</tbody></table></div>`;
      updateCount();
    }
    function updateCount(){const count=rows.filter(r=>!excluded.has(r.id)).length;el('selected').textContent=count+' of '+rows.length+' entries selected';el('ics').disabled=el('csv').disabled=el('print').disabled=!count;}
    host.addEventListener('change',e=>{
      if(e.target.matches('[data-id]')){if(e.target.checked)excluded.delete(e.target.dataset.id);else excluded.add(e.target.dataset.id);updateCount();return;}
      if(e.target===el('fy')){const fy=parse(el('fy').value);if(fy)el('meeting').value=iso(addM(fy,6));}
      draw();
    });
    el('name').oninput=draw;
    el('csv').onclick=()=>{const cell=s=>'"'+String(s).replaceAll('"','""')+'"';const csv=[['Date','Task','Form or record','Legal provision','Application'],...rows.filter(r=>!excluded.has(r.id)).map(r=>[iso(r.date),r.what,r.form,r.basis,r.note])].map(row=>row.map(cell).join(',')).join('\r\n');saveFile('\ufeff'+csv,'text/csv;charset=utf-8','compliance-calendar.csv');};
    el('ics').onclick=()=>downloadDates(el('name').value.trim()||'Company',rows.filter(r=>!excluded.has(r.id)),[7],'compliance-calendar.ics');
    el('print').onclick=()=>window.print();draw();
  }
  function stamp(host,data){
    const amount=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(n);
    const states=data.states,unitOptions='<option value="1">Rupees</option><option value="100000" selected>Lakh</option><option value="10000000">Crore</option>';
    host.innerHTML=`<p class="pt-note">For companies with share capital, excluding section 8 companies. These archived rates use earlier incorporation form names and territorial divisions. Use the calculation as an estimate. At payment, check the current state schedule for the instrument and the assessment displayed in the filing.</p><fieldset><legend>Capital and registered office</legend><div class="pt-controls"><label>State or jurisdiction<select data-state>${states.map((s,i)=>`<option value="${i}" ${s[0]==='Delhi'?'selected':''}>${h(s[0])}</option>`).join('')}<option value="manual">Other / changed jurisdiction</option></select></label><label>Instrument<select data-mode><option value="formation">Incorporation</option><option value="increase">Increase of capital · SH-7</option></select></label></div><div class="pt-controls"><label><span data-cap-label>Authorised capital</span><input type="number" min="0" step="any" value="10" data-cap></label><label>Amount unit<select data-unit>${unitOptions}</select></label></div><div class="pt-controls" data-oldrow hidden><label>Previous authorised capital<input type="number" min="0" step="any" value="1" data-old></label><label>Previous amount unit<select data-oldunit>${unitOptions}</select></label></div></fieldset><div data-result></div>`;
    const el=s=>host.querySelector('[data-'+s+']');
    const table=(headers,arr)=>`<div class="pt-table-wrap"><table><thead><tr>${headers.map(v=>'<th>'+h(v)+'</th>').join('')}</tr></thead><tbody>${arr.map(row=>`<tr>${row.map(v=>'<td>'+h(v)+'</td>').join('')}</tr>`).join('')}</tbody></table></div>`;
    function draw(){
      const inc=el('mode').value==='increase',selected=el('state').value;
      el('oldrow').hidden=!inc;el('cap-label').textContent=inc?'Revised authorised capital':'Authorised capital';
      const cap=Number(el('cap').value)*Number(el('unit').value),old=Number(el('old').value)*Number(el('oldunit').value);
      const out=el('result');
      if(selManual(selected)){out.innerHTML='<p class="pt-feedback">Identify the current registering jurisdiction and instrument. Obtain its effective stamp schedule or a state stamp officer’s assessment, then reconcile the amount with the filing before payment.</p>';return;}
      if(!el('cap').value||!Number.isFinite(cap)||cap<=0||cap>Number.MAX_SAFE_INTEGER||(inc&&(!el('old').value||!Number.isFinite(old)||old<=0||cap<=old))){out.innerHTML='<p class="pt-feedback" role="status">'+(inc?'Enter positive capital amounts. The revised amount must exceed the previous amount.':'Enter a positive authorised capital amount within the supported range.')+'</p>';return;}
      const st=states[Number(selected)],duty=s=>inc?data.increase(s,old,cap):s[1]+s[2]+data.articles(s[3],cap);
      const result=duty(st);
      const breakdown=inc?[['Capital increase',amount(cap-old)],['Estimated SH-7 duty',result==null?'Manual assessment required':amount(result)]]:[['Legacy incorporation-form component',amount(st[1])],['Memorandum',amount(st[2])],['Articles',amount(data.articles(st[3],cap))],['Estimated total',amount(result)]];
      out.innerHTML=`<h2>${h(st[0])} estimate</h2>${table(['Component','Amount'],breakdown)}<p class="pt-note">${h(inc?(st[4].x||st[6]):st[5])}.</p><details><summary>Compare jurisdictions at this capital</summary>${table(['Jurisdiction',inc?'Estimated SH-7 duty':'Estimated total'],states.map(s=>[s[0],duty(s)]).sort((a,b)=>(a[1]??Infinity)-(b[1]??Infinity)).map(([n,d])=>[n,d==null?'Manual assessment required':amount(d)]))}</details><details><summary>Rate schedule</summary>${table(['Jurisdiction','Legacy form','Memorandum','Articles','Capital increase'],states.map(s=>[s[0],amount(s[1]),amount(s[2]),s[5],s[6]]))}</details>`;
    }
    const selManual=v=>v==='manual';
    host.addEventListener('input',draw);host.addEventListener('change',draw);draw();
  }
  function downloadDates(name,events,alarms,filename){
      const escape=s=>String(s).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
      const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z');
      const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Compliance Desk//Filing calendar//EN','CALSCALE:GREGORIAN'];
      const hash=Array.from(name).reduce((sum,c)=>(sum*31+c.codePointAt(0))>>>0,11).toString(36);
      events.forEach(r=>lines.push('BEGIN:VEVENT',`UID:${hash}-${r.id}-${ymd(r.date)}@practice-desk`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${ymd(r.date)}`,`DTEND;VALUE=DATE:${ymd(addD(r.date,1))}`,`SUMMARY:${escape(name+' · '+r.what)}`,`DESCRIPTION:${escape(r.form+' · '+r.basis+'. '+r.note)}`,...alarms.flatMap(d=>['BEGIN:VALARM','TRIGGER:-P'+d+'D','ACTION:DISPLAY',`DESCRIPTION:${escape(r.form+' reminder')}`,'END:VALARM']),'END:VEVENT'));
      lines.push('END:VCALENDAR');
      const encoder=new TextEncoder();const fold=s=>{let out='',bytes=0;for(const char of s){const n=encoder.encode(char).length;if(bytes+n>75){out+='\r\n ';bytes=1;}out+=char;bytes+=n;}return out;};
      saveFile(lines.map(fold).join('\r\n')+'\r\n','text/calendar;charset=utf-8',filename);
  }
  const formKinds={
    filing:['Filing or application','Confirm the event and the person authorised to act. Check which service and current form variant applies.','Match the entries to the signed supporting records and certify or submit as required. Retain the submitted copy, receipt and outcome.'],
    internal:['Company record','Identify the person responsible for making, receiving or maintaining this record. Establish the entry or signature date.','Complete the applicable fields and obtain the signatures, if required. Record delivery or enter the particulars in the relevant register.'],
    attachment:['Supporting document','Identify the parent transaction and the person who must prepare, certify or sign the supporting document.','Reconcile its particulars with the parent filing or resolution. Execute the correct version and retain the signed attachment with that matter.'],
    notice:['Notice or communication','Identify the addressees, service method, trigger and prescribed timing. Compile the information and addressee list.','Approve and issue the applicable notice. Save proof of dispatch, publication or service and diary the response date.'],
    issued:['Authority record','Identify the application, order, appeal or receipt that gives rise to this record. Confirm which authority issues or maintains it.','Obtain the issued or certified copy from the case or filing record. Check the reference, effective date and particulars against the underlying instrument.'],
    historical:['Historical format','Establish the date of the underlying matter and whether these provisions applied then. Identify any replacement form or service before using this code.','For a past matter, retrieve the completed record and its filing evidence. For a new matter, use the operative procedure for the current filing date.'],
    tribunal:['Tribunal application','Identify the competent bench, case reference, parties and relief sought. Check the applicable filing directions and limitation period.','Prepare the prescribed pleading and supporting papers, complete verification and service, and retain the filing receipt and any scrutiny objections.']
  };
  function filingIndex(host,data){
    const {forms,families}=data;
    const preset=location.hash.split('/')[2]||'', direct=forms.find(f=>f.code===preset);
    host.innerHTML=filters('forms',Object.values(families).map(f=>f[0]),'Form code, topic or legal section')+'<div data-results></div>';
    const q=host.querySelector('[data-query]'),group=host.querySelector('[data-group]'),out=host.querySelector('[data-results]');
    if(direct)q.value=direct.code;
    const draw=()=>{
      const value=q.value.trim(),compact=s=>s.replace(/[^a-z0-9]/gi,'').toUpperCase();
      const rows=forms.filter(f=>(!group.value||families[f.group][0]===group.value)&&(!value||compact(f.code).includes(compact(value))||matches(value,f.title,families[f.group][0],f.sections.map(s=>'section '+s).join(' '),formKinds[f.kind][0])));
      out.innerHTML='<p class="pt-note" role="status">'+rows.length+' of '+forms.length+' form references</p>'+(rows.length?rows.map(f=>{
        const meta=families[f.group],kind=formKinds[f.kind];
        const blank=f.kind==='issued'?'Ask the authority or registry for the issued record or a certified copy using the matter number.':f.kind==='historical'?'Request the blank applicable on the transaction date and the operative notification or annexure for that date.':f.kind==='tribunal'?'Request the applicable rules annexure, current bench filing directions, and a blank pleading or registry checklist.':['internal','notice','attachment'].includes(f.kind)?'Obtain the blank annexure to the applicable rules and any amendment effective on the execution date.':'In the authorised filing account, search by the exact code and identify the applicable service. Save the instruction kit, blank preview and attachment list, including conditional screens.';
        const draft=window.DeskForms?.templates?.find(t=>String(t.code||'').toUpperCase()===f.code);
        const rules=f.rules.map(([id,n,t])=>`<a class="pt-ref" href="#reader/${encodeURIComponent(id)}">Rule ${h(n)} · ${h(t)}</a>`).join('');
        return `<details ${compact(value)===compact(f.code)?'open':''}><summary>${h(f.code)} · ${h(f.title)}<small>${h(meta[0])} · ${h(kind[0])}</small></summary><h3>Preparation</h3><ol><li>${h(kind[1])}</li><li>Assemble the matter file for ${h(f.code)}. ${h(meta[1])}</li><li>${h(kind[2])}</li></ol><h3>Legal references</h3><p>${refs(f.sections)}${rules}</p>${draft?`<p><a class="pt-button secondary" href="#documents/${encodeURIComponent(draft.id)}">Prepare ${h(f.code)} working copy</a></p>`:''}<h3>Obtain the exact format</h3><p>${h(blank)} Record the version date and remove client identifiers from any specimen shared for drafting.</p></details>`;
      }).join(''):'<p>Try a different code, topic or category.</p>');
    };
    q.oninput=draw;group.onchange=draw;draw();
  }
  const noticeEvents=[
    ['Registrable resolution passed','117','MGT-14',30],['Securities allotted outside private placement','39','PAS-3',30],['Private placement securities allotted','42','PAS-3',15],
    ['Registrable charge created or modified','77','CHG-1',30],['Director or KMP appointment or change','170','DIR-12',30],['Registered office changed','12','INC-22',30],
    ['Significant beneficial ownership declaration received','90','BEN-2',30],['Meeting concluded · enter minutes','118','',30],['Auditor appointed at the AGM','139','ADT-1',15],
    ['AGM held · file financial statements','137','AOC-4',30],['AGM held · file annual return','92','MGT-7',60]
  ];
  function noticeDates(host){
    const today=new Date(),year=today.getMonth()>=3?today.getFullYear():today.getFullYear()-1;
    host.innerHTML=`<div class="pt-controls"><label>Company name for reminders (optional)<input data-co maxlength="140" autocomplete="organization"></label></div>
      <fieldset><legend>Meeting notice</legend><div class="pt-controls"><label>Meeting<select data-meettype><option value="general">General meeting</option><option value="board">Board meeting</option></select></label><label>Starting point<select data-direction><option value="meeting">Known meeting date</option><option value="dispatch">Known dispatch date</option></select></label><label>Delivery<select data-post><option value="0">Electronic or by hand</option><option value="2">Post (+2 days)</option></select></label><label>Date<input type="date" data-noticedate></label></div><div data-noticeout></div></fieldset>
      <fieldset><legend>Interval between Board meetings</legend><div class="pt-controls"><label>Last Board meeting<input type="date" data-lastboard></label></div><div data-gapout></div></fieldset>
      <fieldset><legend>AGM and annual filing dates</legend><div class="pt-controls"><label>Financial year end<input type="date" value="${year}-03-31" data-end></label><label>AGM type<select data-agmtype><option value="6">Subsequent AGM</option><option value="9">First AGM</option></select></label><label>Previous AGM (optional)<input type="date" data-previous></label><label>Planned or actual AGM (optional)<input type="date" data-agm></label></div><div data-yearout></div></fieldset>
      <fieldset><legend>Deadline following an event</legend><div class="pt-controls"><label>Event<select data-event>${noticeEvents.map((r,i)=>`<option value="${i}">${h(r[0])}</option>`).join('')}</select></label><label>Event date<input type="date" data-eventdate></label></div><div data-eventout></div></fieldset>
      <p class="pt-note">Calculations use the ordinary periods for the selected event. Check company-class exemptions, extensions, service terms and orders for the matter. Use the compliance calendar for OPCs and listed-entity reporting.</p>`;
    const el=k=>host.querySelector('[data-'+k+']');
    const groups={};
    const row=(date,title,section,form)=>({date,title,section,form});
    const output=(key,rows,note)=>{
      groups[key]=rows;
      el(key+'out').innerHTML=(rows.length?`<div class="pt-table-wrap"><table><thead><tr><th>Date</th><th>Task</th><th>Provision</th></tr></thead><tbody>${rows.map(r=>`<tr><td class="date">${fmt(r.date)}</td><td>${h(r.title)}${r.form?'<small>'+h(r.form)+'</small>':''}</td><td>${refs([r.section])}</td></tr>`).join('')}</tbody></table></div>`:'')+`<p class="pt-note">${h(note)}</p>`+(rows.length?`<button type="button" class="pt-button secondary pt-noprint" data-export="${key}">Save dates (.ics)</button>`:'');
    };
    function draw(){
      const general=el('meettype').value==='general',before=el('direction').value==='meeting',days=(general?22:7)+Number(el('post').value),notice=parse(el('noticedate').value),sec=general?'101':'173';
      output('notice',notice?(before?[row(addD(notice,-days),'Dispatch notice',sec),row(notice,'Hold the meeting',sec)]:[row(addD(notice,days),'Earliest ordinary meeting date',sec)]):[],
        general?'Normal notice gives 21 clear days between service and the meeting. Check section 101 for shorter-notice consent.':'Ordinary Board notice uses seven days. Check the articles for a longer period and section 173(3) if urgent business requires shorter notice.');
      const board=parse(el('lastboard').value);output('gap',board?[row(addD(board,120),'Latest next Board meeting under the ordinary interval','173')]:[],'Ordinary companies also need at least four Board meetings a year. Check section 173(5) before applying this interval to a small, dormant or One Person Company.');
      const end=parse(el('end').value),prev=parse(el('previous').value),held=parse(el('agm').value),months=Number(el('agmtype').value),first=months===9;
      el('previous').disabled=first;
      let yearRows=[],yearNote='Enter the company’s financial year end.';
      if(end){
        let last=addM(end,months);
        if(prev&&!first){const gap=addM(prev,15);if(gap<last)last=gap;}
        const base=held||last;
        if((held&&held<=end)||(!first&&prev&&prev>=base)||last<=end)yearNote='Check the financial year end and the order of the AGM dates.';
        else{
          yearRows=[row(addD(base,-22),'Send notice and accounts together by electronic or hand delivery','101'),row(last,'Latest ordinary AGM date','96'),row(addD(base,15),'Notify auditor appointment, if made','139','ADT-1'),row(addD(base,30),'File financial statements','137','AOC-4'),row(addD(base,60),'File annual return','92','MGT-7 / MGT-7A')].sort((a,b)=>a.date-b.date);
          yearNote=(held?'Filing dates use the AGM date entered. ':'Filing dates assume the AGM is held on the last ordinary date. ')+(held&&held>last?'The entered AGM falls after the calculated ordinary limit. ':(!first&&!prev?'Enter the previous AGM to test the 15-month limit. ':''))+'Check sections 101 and 136 separately for dispatch and shorter consent. Any granted extension needs a separate check.';
        }
      }
      output('year',yearRows,yearNote);
      const d=parse(el('eventdate').value),[title,section,form,period]=noticeEvents[Number(el('event').value)||0];
      output('event',d?[row(addD(d,period),title,section,form)]:[],`Normal period: ${period} calendar days beginning the day after the event. Use the correct form variant for the company and instrument.`);
    }
    host.oninput=draw;host.onchange=draw;
    host.onclick=e=>{
      const key=e.target.closest('[data-export]')?.dataset.export;
      if(!key||!groups[key]?.length)return;
      const name=el('co').value.trim()||'Company', events=groups[key].map((r,i)=>({id:key+'-'+i,date:r.date,what:r.title,form:r.form||r.title,basis:'Section '+r.section,note:'Check the applicable filing or meeting conditions.'}));
      downloadDates(name,events,[7,1],'notice-and-filing-dates.ics');
    };
    draw();
  }
  async function render(host,id){
    styles();
    const view=document.createElement('section');
    view.className='pt';
    host.replaceChildren(view);
    if(id==='calendar'){calendar(view);return;}
    if(id==='notice-dates'){noticeDates(view);return;}
    if(!items.some(r=>r.id===id)){view.textContent='Choose a practice tool.';return;}
    view.textContent='Opening '+items.find(r=>r.id===id).title+'…';
    try{
      const data=await load(id);
      if(!view.isConnected)return;
      if(id==='stamp')stamp(view,data);
      else if(id==='filing-index')filingIndex(view,data);
      else if(id==='subjects')subjects(view,data);
      else directory(view,data,id);
    }catch{
      if(!view.isConnected)return;
      view.innerHTML='<p role="status">The local collection could not be opened.</p><button class="pt-button" type="button">Try again</button>';
      view.querySelector('button').onclick=()=>render(host,id);
    }
  }
  window.PracticeTools={items,render};
})();
