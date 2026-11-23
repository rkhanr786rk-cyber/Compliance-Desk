(() => {
const LK = 100000, CR = 10000000;
const inr = n => { n = String(Math.round(n)); if (n.length <= 3) return n; let r = n.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ","); return r + "," + n.slice(-3); };
/* Rule types. fix: a fixed amount. thr: lo up to a limit, hi above it. pct: rate of capital, with a minimum and a maximum.
   blk: an amount for each block of capital or part of a block, with an optional maximum. ker: Kerala's own scale. chk: not worked out here. */
const fix = v => ({ t: "fix", v }), thr = (l, lo, hi) => ({ t: "thr", l, lo, hi }), pct = (r, min, max) => ({ t: "pct", r, min: min || 0, max: max || 0 }), blk = (a, s, max, min) => ({ t: "blk", a, s, max: max || 0, min: min || 0 });
const NIL = { t: "nil" }, KER = { t: "ker" }, chk = x => ({ t: "chk", x });
const S = [
  // name, form fee (INC-2, INC-7, INC-29), MoA, AoA on authorised capital, SH-7 on the increase, text of the AoA rule, text of the SH-7 rule
  ["Andaman and Nicobar", 20, 200, fix(300), NIL, "Rs. 300", "Nil"],
  ["Andhra Pradesh", 20, 500, pct(.0015, 1000, 5 * LK), pct(.0015, 1000, 5 * LK), "0.15% of authorised capital, minimum Rs. 1,000, maximum Rs. 5 lakh", "0.15% of the increase, minimum Rs. 1,000, maximum Rs. 5 lakh"],
  ["Arunachal Pradesh", 10, 200, fix(500), NIL, "Rs. 500", "Nil"],
  ["Assam", 15, 200, fix(310), NIL, "Rs. 310", "Nil"],
  ["Bihar", 20, 500, pct(.0015, 1000, 5 * LK), pct(.0015, 1000, 5 * LK), "0.15% of authorised capital or Rs. 1,000, whichever is more, maximum Rs. 5 lakh", "The higher of Rs. 1,000 and the same rate on the increase, maximum Rs. 5 lakh"],
  ["Chandigarh", 3, 500, fix(1000), NIL, "Rs. 1,000", "Nil"],
  ["Chhattisgarh", 10, 500, pct(.0015, 1000, 5 * LK), pct(.0015, 1000, 5 * LK), "0.15% of authorised capital or Rs. 1,000, whichever is more, maximum Rs. 5 lakh", "The higher of Rs. 1,000 and the same rate on the increase"],
  ["Dadra and Nagar Haveli", 1, 15, fix(25), NIL, "Rs. 25", "Nil"],
  ["Daman and Diu", 20, 150, blk(1000, 5 * LK), blk(1000, 5 * LK), "Rs. 1,000 for each Rs. 5 lakh of capital or part of it", "Rs. 1,000 for each Rs. 5 lakh of the increase or part of it"],
  ["Delhi", 10, 200, pct(.0015, 0, 25 * LK), pct(.0015, 0, 25 * LK), "0.15% of authorised capital, maximum Rs. 25 lakh", "0.15% of the increase, maximum Rs. 25 lakh"],
  ["Goa", 50, 150, blk(1000, 5 * LK), blk(1000, 5 * LK), "Rs. 1,000 for each Rs. 5 lakh of capital or part of it", "Rs. 1,000 for each Rs. 5 lakh of the increase or part of it"],
  ["Gujarat", 20, 100, pct(.005, 0, 5 * LK), chk("Calculate the applicable Gujarat differential duty against the earlier duty paid and current state schedule. Record the assessment before payment."), "0.5% of authorised capital, maximum Rs. 5 lakh", "A formula based on the increase, maximum Rs. 5 lakh"],
  ["Haryana", 15, 60, thr(LK, 60, 120), NIL, "Rs. 60 if capital is up to Rs. 1 lakh; Rs. 120 above that", "Nil"],
  ["Himachal Pradesh", 3, 60, thr(LK, 60, 120), NIL, "Rs. 60 if capital is up to Rs. 1 lakh; Rs. 120 above that", "Nil"],
  ["Jammu and Kashmir", 10, 150, thr(LK, 150, 300), NIL, "Rs. 150 if capital is up to Rs. 1 lakh; Rs. 300 above that", "Nil"],
  ["Jharkhand", 5, 63, fix(105), NIL, "Rs. 105", "Nil"],
  ["Karnataka", 20, 1000, blk(500, 10 * LK), blk(500, 10 * LK, 0, 500), "Rs. 500 for each Rs. 10 lakh of capital or part of it", "Rs. 500 for each Rs. 10 lakh of the increase or part of it, minimum Rs. 500"],
  ["Kerala", 25, 1000, KER, NIL, "Rs. 2,000 up to Rs. 10 lakh; Rs. 5,000 from Rs. 10 lakh to Rs. 25 lakh; 0.5% above Rs. 25 lakh", "Nil"],
  ["Lakshadweep", 25, 500, fix(1000), NIL, "Rs. 1,000", "Nil"],
  ["Madhya Pradesh", 50, 2500, pct(.0015, 5000, 25 * LK), chk("Check the date and duty paid on the last capital increase. Apply the appropriate Madhya Pradesh rate and assessment to the increase."), "0.15% of authorised capital, minimum Rs. 5,000, maximum Rs. 25 lakh", "A formula on the increase, depending on the date of the last increase"],
  ["Maharashtra", 100, 200, blk(1000, 5 * LK, 50 * LK), { t: "mh" }, "Rs. 1,000 for each Rs. 5 lakh of capital or part of it, maximum Rs. 50 lakh", "Rs. 1,000 for each Rs. 5 lakh of the increase or part of it, maximum Rs. 50 lakh. No SH-7 duty once authorised capital exceeds Rs. 250 crore"],
  ["Manipur", 10, 100, fix(150), NIL, "Rs. 150", "Nil"],
  ["Meghalaya", 10, 100, fix(300), NIL, "Rs. 300", "Nil"],
  ["Mizoram", 10, 100, fix(150), NIL, "Rs. 150", "Nil"],
  ["Nagaland", 10, 100, fix(150), NIL, "Rs. 150", "Nil"],
  ["Odisha", 10, 300, fix(300), NIL, "Rs. 300", "Nil"],
  ["Puducherry", 10, 200, fix(300), NIL, "Rs. 300", "Nil"],
  ["Punjab", 25, 5000, thr(LK, 5000, 10000), NIL, "Rs. 5,000 if capital is up to Rs. 1 lakh; Rs. 10,000 above that", "Nil"],
  ["Rajasthan", 10, 500, pct(.005, 0, 0), pct(.002, 0, 25 * LK), "0.5% of authorised capital", "0.2% of the increase, maximum Rs. 25 lakh"],
  ["Tamil Nadu", 20, 200, fix(300), NIL, "Rs. 300", "Nil"],
  ["Telangana", 20, 500, pct(.0015, 1000, 5 * LK), pct(.0015, 1000, 5 * LK), "0.15% of authorised capital, minimum Rs. 1,000, maximum Rs. 5 lakh", "0.15% of the increase, minimum Rs. 1,000, maximum Rs. 5 lakh"],
  ["Tripura", 10, 100, fix(150), NIL, "Rs. 150", "Nil"],
  ["Uttar Pradesh", 10, 500, fix(500), NIL, "Rs. 500", "Nil"],
  ["Uttarakhand", 10, 500, fix(500), NIL, "Rs. 500", "Nil"],
  ["West Bengal", 10, 60, fix(300), NIL, "Rs. 300", "Nil"],
];
function calc(rule, cap) {
  if (cap <= 0) return 0;
  switch (rule.t) {
    case "fix": return rule.v;
    case "nil": return 0;
    case "thr": return cap <= rule.l ? rule.lo : rule.hi;
    case "pct": { let v = cap * rule.r; if (rule.min) v = Math.max(v, rule.min); if (rule.max) v = Math.min(v, rule.max); return v; }
    case "blk": { let v = rule.a * Math.ceil(cap / rule.s); if (rule.min) v = Math.max(v, rule.min); if (rule.max) v = Math.min(v, rule.max); return v; }
    case "ker": return cap <= 10 * LK ? 2000 : cap <= 25 * LK ? 5000 : cap * 0.005;
    default: return null;
  }
}
function sh7(s, oldCap, newCap) {
  const rule = s[4], inc = newCap - oldCap; if (inc <= 0) return 0;
  if (rule.t === "chk") return null;
  if (rule.t === "mh") { const paid = calc(s[3], oldCap), cap = 50 * LK; return Math.max(0, Math.min(calc(s[3], inc), cap - paid)); }
  return calc(rule, inc);
}

window.DeskToolData ||= {}; window.DeskToolData.stamp={states:S,articles:calc,increase:sh7};
})();