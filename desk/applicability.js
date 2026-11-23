(function () {
  'use strict';

  const boardLaw = [
    ['act-173'], ['act-173', 'act-118'], ['lodr-29', 'lodr-30'],
    ['act-174', 'act-184'], ['act-118'], ['act-117', 'act-118']
  ];

  // IDs belong to the workflow and stay stable when the matter profile changes.
  function item(id, title, detail, lawIds, reason, final = false) {
    return { id, title, detail, lawIds, reason, final };
  }

  function lawsForReference(flow, reference) {
    const targets = flow.related || [];
    const result = [];
    const section = /\bsections?\s+([0-9][0-9A-Za-z()–, &-]*(?: and [0-9][0-9A-Za-z()–, &-]*)?)/i.exec(reference);
    const regulation = /\bregulations?\s+([0-9][0-9A-Za-z()–, &-]*(?: and [0-9][0-9A-Za-z()–, &-]*)?)/i.exec(reference);
    const rule = /\brules?\s+([0-9][0-9A-Za-z()–, &-]*(?: and [0-9][0-9A-Za-z()–, &-]*)?)/i.exec(reference);
    for (const [match, prefix] of [[section, 'act-'], [regulation, 'lodr-'], [rule, 'rule-']]) {
      if (!match) continue;
      const numbers = match[1].replace(/\([^)]*\)/g, '').match(/\b\d+[A-Z]*\b/g) || [];
      for (const id of targets) {
        if (id.startsWith(prefix) && numbers.includes(id.split('-').pop()) && !result.includes(id)) result.push(id);
      }
    }
    return result;
  }

  function baseSteps(flow) {
    return (flow.steps || []).map((entry, index) => {
      const lawIds = flow.id === 'board-meeting' ? (boardLaw[index] || []) : lawsForReference(flow, entry.reference || '');
      return item('step-' + index, entry.title, entry.detail, lawIds, entry.reference || '');
    });
  }

  function evidence(flow) {
    return (flow.checks || []).map((title, index) => item('check-' + index, title, '', [], 'Completion evidence', true));
  }

  function classifyListing(listing) {
    if (listing === 'Listed') return 'Listed';
    if (listing === 'Unlisted') return 'Unlisted';
    return 'Review needed';
  }

  function companyListingStep(listing, role) {
    const isBoard = role === 'board';
    const covered = listing === 'Listed';
    const prefix = isBoard ? 'board' : 'event';
    const title = covered ? 'Identify the listed securities and disclosure trigger' : 'Establish listing status and disclosure scope';
    const detail = covered
      ? 'Record the security class, exchange and applicable LODR chapter. For specified securities, test the agenda against Regulations 29 and 30. For listed non-convertible securities, assess Regulations 50 and 51. Compare actual event and meeting times with the applicable filing deadline.'
      : 'Confirm the issuer, security class, exchange and listing status with the company secretary or registrar and transfer agent. Record any applicable intimation or disclosure and its deadline before proceeding.';
    return item(prefix + (covered ? '-listed-scope' : '-listing-review'), title, detail,
      ['lodr-29', 'lodr-30', 'lodr-50', 'lodr-51'],
      covered ? 'The matter is marked listed. The security class determines which provisions apply.' : 'Listing status requires review.');
  }

  function soleDirectorPath(matter, listing) {
    const reason = 'One Person Company with a single director.';
    const result = [
      item('opc-board-authority', 'Confirm the director and the decision-making authority',
        'Verify the current director register and articles. Identify the business reserved for the Board and distinguish it from business requiring a resolution of the sole member.',
        ['act-122', 'act-173', 'act-174'], reason),
      item('opc-board-entry', 'Enter the single director’s resolution in the minutes book',
        'Record the actual decision in the section 118 minute book. The sole director signs and dates the entry. That date is the deemed Board meeting date for the decision.',
        ['act-118', 'act-122'], reason)
    ];
    if (matter.interest === true) {
      result.push(item('opc-board-interest', 'Examine the sole director’s interest',
        'Record the interest and check the substantive approval provisions for the transaction. If the sole member is also a director and contracts with the OPC, test the recording and Registrar intimation requirements in section 193 and its ordinary-course exception.',
        ['act-184', 'act-188', 'act-193'], 'A director interest is flagged for this decision.'));
    }
    if (listing !== 'Unlisted') result.push(companyListingStep(listing, 'board'));
    result.push(
      item('opc-board-follow-up', 'Complete filings required for the actual decision',
        'Test the signed resolution against section 117 and event-specific forms. Use the deemed meeting date where relevant, record the decision owner and retain any filing receipt.',
        ['act-117', 'act-122'], reason),
      item('opc-board-signed', 'Signed and dated sole-director entry retained', '', ['act-118', 'act-122'], reason, true),
      item('opc-board-action-log', 'Applicable filings and decisions recorded', '', ['act-117'], reason, true)
    );
    return result;
  }

  function limitedBoard(matter) {
    const reason = matter.companyType === 'Other'
      ? 'One director is recorded and the company’s legal class requires confirmation.'
      : 'One director is recorded for a company outside the one-director OPC route.';
    return [
      item('board-vacancies', 'Verify the registered class, vacancies and quorum',
        'Obtain the latest director register and articles. If a continuing director is below statutory quorum, section 174(2) limits the available action to restoring the Board to quorum or summoning a general meeting. Identify any special provision that governs the company.',
        ['act-149', 'act-174'], reason),
      item('board-restore', 'Record the permitted action and reassess the agenda',
        'Document the authority and the action taken to restore quorum or summon the members. Reassess the ordinary agenda once a duly constituted Board can consider it.',
        ['act-174'], reason),
      item('board-restore-record', 'Authority and resulting Board position confirmed', '', ['act-149', 'act-174'], reason, true)
    ];
  }

  function conflictStep(matter) {
    const privateCompany = matter.companyType === 'Private company' || matter.companyType === 'One Person Company';
    const detail = privateCompany
      ? 'Identify the affected contract and director. Before counting the director for quorum or permitting participation, document disclosure, the precise private-company notification relied on, filing-default conditions and any stricter related-party, listing or articles requirement. Record the quorum and vote on the item.'
      : 'Record the nature of the interest before the affected item. Test section 184(2), any applicable exception and the section 174(3) quorum where at least two-thirds of directors are interested. Record who withdrew, who remained eligible and how the item was decided.';
    return item('board-interest-' + (privateCompany ? 'private' : 'general'), 'Determine participation and quorum for the interested item', detail,
      privateCompany ? ['act-174', 'act-184', 'act-188', 'act-92', 'act-137'] : ['act-174', 'act-184', 'act-188'],
      'A director interest has been flagged.');
  }

  function ordinaryBoard(flow, matter, listing) {
    const original = baseSteps(flow);
    const result = [];
    const finish = evidence(flow);
    if (matter.companyType === 'Other') {
      result.push(item('board-class-review', 'Identify the company class and applicable meeting standard',
        'Record the legal class and any special notification. For example, SS-1 has a section 8 scope exception, and the applicable Companies Act meeting provisions still require a separate check.',
        ['act-8', 'act-118', 'act-173'], 'The matter uses the Other company class.'));
    }
    original.forEach((step, index) => {
      if (index === 0 && matter.companyType === 'One Person Company') {
        step.detail = 'Confirm the OPC has more than one director. Check the first meeting position, then calendar at least one Board meeting in each half of the calendar year with a gap of at least 90 days between the two meetings. Check the articles and retain the meeting calendar.';
        step.reason = 'OPC with more than one director · section 173(5)';
      }
      if (index === 0 && matter.companyType === 'Private company') {
        step.detail += ' Establish whether the company qualifies as small, dormant or a recognised start-up eligible for a different meeting frequency before fixing the date.';
      }
      if (index === 0 && matter.companyType === 'Public company') {
        step.detail += ' Check whether the financial thresholds or listing class require independent directors and verify the actual Board composition.';
        step.lawIds = ['act-149', 'act-173'];
      }
      if (index === 1 && matter.shortNotice === true) {
        step.title = 'Send the shorter-notice meeting papers';
        step.detail = 'Identify the urgent business and state that the meeting is at shorter notice. Send the notice, agenda and relevant papers to every director and record dispatch.';
        step.reason = 'Urgent business at shorter notice · section 173(3)';
      }
      if (index === 2) {
        if (listing !== 'Unlisted') {
          const exchange = companyListingStep(listing, 'board');
          // It remains the original exchange task and keeps any existing completion.
          if (listing === 'Listed') exchange.id = step.id;
          result.push(exchange);
        }
        return;
      }
      if (index === 3) {
        if (matter.mode === 'Video conference' || matter.mode === 'Hybrid') {
          result.push(item('board-remote', 'Set up and record electronic participation',
            'Give joining instructions, test two-way audio and video, and take a roll call of each remote director. Record location, identity, receipt of papers and attendance changes, maintain quorum and secure the recording for the prescribed period.',
            ['act-173', 'act-174', 'rule-board-3'], 'One or more directors will participate electronically.'));
        } else if (matter.mode === 'In person') {
          result.push(item('board-in-person', 'Prepare attendance at the meeting venue',
            'Confirm the venue, attendance register and quorum calculation. Arrange for signatures and capture arrivals or departures that affect an item.',
            ['act-173', 'act-174', 'act-118'], 'In-person meeting selected.'));
        }
        if (matter.interest === true) result.push(conflictStep(matter));
        if (matter.shortNotice === true) {
          result.push(item('board-short-ratification', 'Check attendance and ratification for shorter notice',
            'If the company has independent directors, secure attendance by one or circulate the decisions to all directors and obtain ratification from at least one independent director. If the company has none and SS-1 applies, a majority of the full Board must approve at the meeting or ratify afterwards. Record the outcome before relying on the decision.',
            ['act-173', 'act-118'], 'Shorter notice selected · SS-1, paragraph 1.3.11'));
        }
      }
      if (index === 4 && matter.companyType === 'Other') {
        step.detail += ' Apply the deadlines appropriate to the company class confirmed above.';
      }
      result.push(step);
    });
    if (matter.mode === 'Video conference' || matter.mode === 'Hybrid') {
      const attendance = finish.find(entry => entry.id === 'check-6');
      if (attendance) {
        attendance.title = 'Attendance authenticated for physical and electronic participants';
        attendance.detail = 'Record electronic attendance in the register and have it authenticated under the applicable meeting standard.';
      }
    }
    const disclosures = finish.find(entry => entry.id === 'check-2');
    if (disclosures && matter.interest !== true) {
      disclosures.title = 'Disclosure triggers checked and any required notices recorded';
    }
    return result.concat(finish);
  }

  function soleMember(flow) {
    const reason = 'A One Person Company has a single member, regardless of Board size.';
    const result = [
      item('opc-member-business', 'Identify the business reserved for the sole member',
        'List each item requiring the member’s ordinary or special resolution and prepare the proposed decision and supporting papers.',
        ['act-96', 'act-114', 'act-122'], reason),
      item('opc-member-entry', 'Record the sole member’s resolution',
        'The member communicates the resolution to the company. Enter it in the minutes book, then have the member sign and date it. Use that date as the deemed meeting date.',
        ['act-118', 'act-122'], reason)
    ];
    if (flow.id === 'annual-general-meeting') {
      result.push(item('opc-annual-accounts', 'Set the OPC annual filing dates',
        'Obtain the duly adopted financial statements and required attachments. Section 137 gives an OPC 180 days from financial year close to file them. Separately assess the annual return and any current relief for the relevant filing year.',
        ['act-92', 'act-122', 'act-137'], reason));
    }
    result.push(item('opc-member-filing', 'Identify the resulting resolution filings',
      'Check whether the actual resolution falls under section 117 and prepare any other transaction-specific filing.',
      ['act-117', 'act-122'], reason),
      item('opc-member-proof', 'Signed member entry and applicable filing evidence retained', '', ['act-118', 'act-122'], reason, true));
    return result;
  }

  function otherFlow(flow, listing) {
    const changes = baseSteps(flow);
    const finish = evidence(flow);
    // These rows exclusively address an issuer's own listing. Subsidiary duties can
    // still matter for other procedures, especially related party transactions.
    const issuerStep = { 'appoint-director': 'step-5', 'director-resignation': 'step-4' }[flow.id];
    if (issuerStep) {
      const pos = changes.findIndex(entry => entry.id === issuerStep);
      if (pos >= 0 && listing === 'Unlisted') {
        changes.splice(pos, 1);
      } else if (pos >= 0 && listing === 'Review needed') {
        changes.splice(pos, 1, companyListingStep(listing, 'event'));
      } else if (pos >= 0) {
        changes[pos].detail += ' Identify the listed securities and confirm the applicable LODR chapter before setting obligations.';
        changes[pos].lawIds = ['lodr-17', 'lodr-30', 'lodr-51'];
      }
      if (flow.id === 'appoint-director' && listing === 'Unlisted' && finish[4]) {
        finish[4].title = 'Member approval and end of additional director’s term calendared';
      }
    }
    return changes.concat(finish);
  }

  function steps(flow, matter = {}) {
    if (!flow || !Array.isArray(flow.steps)) return [];
    matter = matter || {};
    const listing = classifyListing(matter.listing);
    const opc = matter.companyType === 'One Person Company';
    if (opc && (flow.id === 'annual-general-meeting' || flow.id === 'egm')) return soleMember(flow);
    if (flow.id !== 'board-meeting') return otherFlow(flow, listing);
    if (matter.singleDirector === true) {
      return opc ? soleDirectorPath(matter, listing) : limitedBoard(matter);
    }
    return ordinaryBoard(flow, matter, listing);
  }

  window.DeskApplicability = Object.freeze({ steps });
}());
