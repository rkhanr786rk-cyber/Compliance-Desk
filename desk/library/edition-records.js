/*
 * Companies Act 2013, section 173(2).
 * S.O. 902(E), 26 March 2014, entry 66: commencement of sections 173–175.
 * Companies (Amendment) Act 2017 (1 of 2018), section 56: insertion after
 * the first proviso. S.O. 1833(E), 7 May 2018, entry 13: sections 54–58.
 * Compared with the Act as enacted and the supplied Act edition, page 117.
 * Dates are inclusive, in India's civil calendar. A through date can be the
 * evidence cutoff; it does not necessarily indicate repeal or substitution.
 * Section 173 compares base Act wording; delegated rules and exemptions have separate histories.
 * Small-company limits: G.S.R. 700(E), 15 September 2022, and G.S.R. 880(E),
 * 1 December 2025, each rule 2 substituting clause 2(1)(t) on publication.
 * Gazette identifiers 238857 and 268124. The second Gazette explicitly identifies
 * 700(E) as the previous amendment. MCA confirmed the 2025 limits in Rajya
 * Sabha unstarred question 2763, answered 17 March 2026, annexure, entry 16.
 */
(() => {
  'use strict';

  const principalText = [
    '(2) The participation of directors in a meeting of the Board may be either in person or through video conferencing or other audio visual means, as may be prescribed, which are capable of recording and recognising the participation of the directors and of recording and storing the proceedings of such meetings along with date and time:',
    'Provided that the Central Government may, by notification, specify such matters which shall not be dealt with in a meeting through video conferencing or other audio visual means.'
  ];
  const secondProviso = 'Provided further that where there is quorum in a meeting through physical presence of directors, any other director may participate through video conferencing or other audio visual means in such meeting on any matter specified under the first proviso.';

  const thresholdsClause = 'For the purposes of sub-clause (i) and sub-clause (ii) of clause (85) of section 2 of the Act, paid up capital and turnover of the small company shall not exceed';

  window.DeskEditionRecords = {
    'act-173': {
      scope: 'Section 173(2) · Participation in Board meetings',
      changeDate: '2018-05-07',
      summary: 'A second proviso allowed other directors to participate remotely on a matter covered by the first proviso when the directors physically present formed a quorum.',
      versions: [
        {
          from: '2014-04-01',
          through: '2018-05-06',
          paragraphs: principalText.slice()
        },
        {
          from: '2018-05-07',
          through: '2021-04-01',
          paragraphs: [...principalText, secondProviso]
        }
      ]
    },
    'rule-the-companies-specification-of-definitions-details-rules-2014-2': {
      scope: 'Rule 2(1)(t) · Small company thresholds',
      changeDate: '2025-12-01',
      summary: 'The paid-up capital limit increased from ₹4 crore to ₹10 crore, and the turnover limit increased from ₹40 crore to ₹100 crore. Section 2(85) contains the other conditions and exclusions.',
      versions: [
        {
          from: '2022-09-15',
          through: '2025-11-30',
          paragraphs: [`(t) ${thresholdsClause} rupees four crore and rupees forty crore respectively.`]
        },
        {
          from: '2025-12-01',
          through: '2026-03-17',
          paragraphs: [`(t) ${thresholdsClause} rupees ten crores and rupees one hundred crores respectively.`]
        }
      ]
    }
  };
})();
