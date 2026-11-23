/* Board papers use the same editable Word layout and ZIP writer as Document Studio. */
(() => {
  'use strict';

  const choices = Object.freeze([
    { id: 'notice', title: 'Board meeting notice' },
    { id: 'agenda', title: 'Meeting agenda' },
    { id: 'attendance', title: 'Attendance sheet' },
    { id: 'minutes', title: 'Draft board minutes' },
    { id: 'resolution', title: 'Draft resolution extract' }
  ].map(Object.freeze));

  const soleDecision={id:'sole-decision',title:'Draft sole-director minute-book entry'};
  const isSoleDirector=m=>m.companyType==='One Person Company' && m.singleDirector===true;
  const choicesFor=m=>isSoleDirector(m)?[soleDecision]:choices;
  const p = text => ({ type: 'paragraph', text });
  const h = text => ({ type: 'heading', text });
  const table = (headings, rows, widths) => ({ type: 'table', headings, rows, widths });
  const text = (value, fallback = '') => typeof value === 'string' && value.trim() ? value.trim() : fallback;
  const lines = value => text(value).split(/\r\n?|\n/).map(line => line.trim()).filter(Boolean);
  const names = m => lines(m.directors);
  const agendaItems = m => lines(m.agenda);
  const company = m => text(m.company, '[Company name]');
  const office = m => p('CIN: ' + text(m.cin, '[CIN]') + '\nRegistered office: ' + text(m.office, '[Registered office address]'));
  function date(value, fallback) {
    const raw = text(value);
    if (!raw) return '[' + fallback + ']';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const parsed = new Date(raw + 'T12:00:00Z');
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,10) !== raw) return raw;
    return new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parsed);
  }
  function details(m) {
    return p('Meeting no.: [Serial number]\nDate: ' + date(m.date, 'Meeting date') +
      '\nScheduled start: ' + text(m.time, '[Time and time zone]') +
      '\nVenue: ' + text(m.venue, '[Full address]') + '\nMode: ' + text(m.mode, '[Meeting mode]'));
  }
  const listAgenda = m => {
    const items = agendaItems(m);
    return items.length ? items.map((item, i) => p((i + 1) + '. ' + item)) : [p('[Insert each proposed item of business.]')];
  };
  const signature = (name, role) => p('Signature: __________________________\n' + text(name, '[Name]') + '\n' + role);
  const actualAttendance = m => p(text(m.attendance, '[Enter actual attendance, mode of participation, invitees and apologies from the attendance record.]'));
  const exactResolution = m => p(typeof m.resolution === 'string' && m.resolution.trim() ? m.resolution : '[Insert the exact adopted wording after checking the meeting record.]');

  const builders = {
    'sole-decision'(m) {
      return [office(m),p('Decision date: '+date(m.date,'Decision date')),p('Minutes book reference: [Volume / page / entry]'),
        h('Decision recorded'),exactResolution(m),p(text(m.decisions,'[Record material particulars of the decision.]')),
        signature(m.signatory,'Sole director'),p('Date of signature: [Date]')];
    },
    notice(m) {
      const recipients = names(m);
      const join = ['Video conference', 'Hybrid'].includes(m.mode)
        ? 'Joining details: [Insert access instructions and contact for assistance.]'
        : 'Electronic participation arrangements: [Insert the arrangements and contact details available to directors.]';
      return [
        office(m), p('Date of notice: ' + date(m.noticeDate, 'Notice date')),
        p('To the directors of ' + company(m) + (recipients.length ? '\n' + recipients.join('\n') : '\n[Insert directors to whom the notice is to be sent.]')),
        p('A meeting of the Board of Directors is convened to consider the business set out below.'),
        details(m), h('Agenda'), ...listAgenda(m),
        h('Participation'), p(join), p('Attendance confirmation: [Name, telephone number or email address].'),
        h('Meeting papers'), p('[List the agenda notes, draft resolutions and papers circulated with this notice.]'),
        p('For ' + company(m)), signature(m.signatory, '[Designation and authority to issue notice]')
      ];
    },
    agenda(m) {
      const items = agendaItems(m);
      return [
        office(m), details(m),
        table(['Item', 'Business for consideration', 'Presenter / papers'], (items.length ? items : ['[Agenda item]']).map((item,i) =>
          [String(i+1), item, '[Presenter and relevant papers]']), [10,58,32]),
        h('Notes on the agenda'), p('[For each item, add the background, interests to disclose, decision requested and relevant papers.]')
      ];
    },
    attendance(m) {
      const directors = names(m);
      const rows = (directors.length ? directors : ['[Director’s name]']).map(name => [name, '', '', '']);
      return [
        office(m), details(m), h('Directors'),
        p('Complete the attendance and participation details at the meeting.'),
        table(['Director on roster', 'Presence / mode', 'Joining / leaving time', 'Signature or attendance record'], rows,[30,23,21,26]),
        h('Company secretary and other attendees'),
        table(['Name and capacity', 'Presence / mode', 'Joining / leaving time', 'Signature or attendance record'], [['','','',''],['','','','']], [30,23,21,26]),
        h('Attendance details entered'), actualAttendance(m),
        p('Recorded by: __________________________\nDate: __________________________')
      ];
    },
    minutes(m) {
      return [
        office(m), details(m), p('Actual commencement: [Time]\nConclusion: ' + text(m.endTime, '[Time]')),
        h('Chair and attendance'), p('Chair: ' + text(m.chair, '[Confirm the chair of the meeting]')), actualAttendance(m),
        p('Quorum: [Record the determination at commencement and during business, including interests, withdrawals or changes in participation.]'),
        h('Agenda as circulated'), ...listAgenda(m),
        h('Proceedings and decisions'), p(text(m.decisions, '[Record the discussion and decision for each item, including deferred items, abstentions and dissent as applicable.]')),
        h('Resolution wording'), exactResolution(m),
        h('Additional meeting notes'), p(text(m.notes, '[Record additional facts or remove this heading.]')),
        p('Date of entry in the minutes book: [Date]'),
        signature(m.chair, 'Chairperson'), p('Date of signing: [Date]\nPlace of signing: [Place]')
      ];
    },
    resolution(m) {
      return [
        office(m), p('Board meeting no.: [Serial number]\nMeeting date: ' + date(m.date, 'Meeting date') +
          '\nVenue: ' + text(m.venue, '[Venue]')),
        p('Minute book reference: [Volume / page / entry]\nResolution or item no.: [Number]\nSubject: [Subject]'),
        h('Resolution'), exactResolution(m),
        h('Certification'), p('[After checking the minutes book, complete the certification of this extract and sign in the authorised capacity.]'),
        p('For ' + company(m)), signature(m.signatory, '[Designation and identifier, where applicable]'),
        p('Date of certification: [Date]\nPlace of certification: [Place]')
      ];
    }
  };

  async function make(matter, id) {
    const choice = choicesFor(matter||{}).find(item => item.id === id);
    if (!choice) throw new RangeError('Unknown board document.');
    const m = matter && typeof matter === 'object' ? matter : {};
    const model = { code: company(m), title: choice.title, basis: 'Board of Directors', parts: builders[id](m) };
    return new Uint8Array(await window.DeskForms.exports.wordFile(model).arrayBuffer());
  }

  async function zip(entries) {
    if (!Array.isArray(entries)) throw new TypeError('Document list required.');
    const files = Object.create(null);
    for (const entry of entries) {
      const name = entry?.name;
      if (typeof name !== 'string' || !name.trim() || name.split('/').some(part => !part || part==='.' || part==='..') || /[\\\x00-\x1f\x7f]/.test(name)) {
        throw new TypeError('Each document needs a safe relative filename.');
      }
      if (Object.hasOwn(files,name)) throw new TypeError('Duplicate document filename.');
      if (!(entry.bytes instanceof Uint8Array)) throw new TypeError('Each document must contain bytes.');
      files[name] = entry.bytes;
    }
    return new Uint8Array(await window.DeskForms.exports.packageXML(files).arrayBuffer());
  }
  window.BoardDocuments = Object.freeze({ choices, choicesFor, isSoleDirector, make, zip });
})();
