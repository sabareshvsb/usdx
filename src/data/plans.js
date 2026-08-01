const fiveHundred = [
  ["Month 1", "Investment: $500", "Create 1 Main ID. Collect the monthly ROI and keep the re-stake balance in your account. Do not create new IDs this month."],
  ["Month 2", "Continue the Main ID", "Collect the monthly ROI and add it to the re-stake balance. No new IDs yet."],
  ["Months 3–13", "Build the balance", "Follow the same process each month. Allow the re-stake balance to accumulate until the required balance is reached."],
  ["Month 14", "Create 1 new $500 ID", "The accumulated re-stake balance reaches the required amount. Total IDs increase according to the plan."],
  ["Months 15–24", "Continue", "Collect ROI from all active IDs and build the re-stake balance."],
  ["Month 25", "Create 1 new $500 ID", "Total active IDs: 2."],
  ["Months 26–30", "Continue", "Continue ROI collection and build the balance."],
  ["Month 31", "Create 1 new ID", "Add the next ID when the plan balance is available."],
  ["Month 33", "Create 1 new ID", "Continue the standard ROI and re-stake cycle."],
  ["Month 35", "Create 1 new ID", "Continue the standard ROI and re-stake cycle."],
  ["Month 39", "Create 1 new ID", "Continue the standard ROI and re-stake cycle."],
  ["Month 40", "Create 1 new ID", "Continue the standard ROI and re-stake cycle."],
  ["Month 41", "Create 1 new ID", "Continue the standard ROI and re-stake cycle."],
  ["Month 42", "Create 1 new ID", "Continue the standard ROI and re-stake cycle."],
  ["Month 45", "Create IDs 10 and 11", "Create two new IDs."],
  ["Month 47", "Create IDs 13 and 14", "Create two new IDs."],
  ["Month 48", "Create IDs 15 and 16", "Create two new IDs."],
  ["Month 49", "Create ID 17", "Create one new ID."],
  ["Month 51", "Create IDs 18 and 19", "Create two new IDs."],
  ["Month 52", "Create IDs 20, 21, 22", "Create three new IDs."],
  ["Month 53", "Create IDs 23, 24, 25", "Create three new IDs."],
  ["Month 54", "Create ID 26", "Create one new ID."],
  ["Month 56", "Create IDs 27–30", "Create four new IDs."],
  ["Month 57", "Create IDs 31–34", "Create four new IDs."],
  ["Month 58", "Create IDs 35–38", "Create four new IDs."],
  ["Month 59", "Create IDs 39–42", "Create four new IDs."],
  ["Month 60", "Final month", "Create IDs 43, 44, and 45."],
];

const oneThousandSchedule = [7, 12, 15, 18, 20, 22, 24, 26, 27, 29, 30, 31, 33, 34, 35, 36, 37, 38, 39, 40];
const oneThousand = [
  ["Initial setup · Month 1", "Invest $1,000 in the Main ID", "The Main ID earns 9% ROI every 30 days. No Sub IDs are active initially. Re-stake balance starts accumulating; affiliate income begins after Sub IDs are created."],
  ["Months 2–60", "Repeat the monthly process", "Keep the $1,000 Main ID active. Add all Sub IDs, calculate 9% ROI on Main and Sub IDs, calculate 10% affiliate volume and 9% affiliate ROI, then combine total ROI."],
  ["ROI handling", "Split and re-stake", "Split total ROI: 50% into USDX and the remainder into DAI under the sheet formula. Convert DAI using the 0.70 factor, add it to Grand Total ROI, and increase the re-stake balance."],
  ["ID creation rule", "Create whenever balance reaches $500", "Deduct $500 for each new ID, increase active IDs and withdraw limit, then calculate Spot Income at 20% of every new ID amount. Repeat every 30 days."],
  ["Months 1–6", "Initial balance phase", "Build the initial re-stake balance."],
  ["Months 8–11", "Continue compounding", "Continue the monthly process after the first new ID."],
  ["Months 13–24", "Accelerating phase", "New IDs begin appearing more frequently."],
  ["Months 25–36", "Multiple-ID phase", "Compounding accelerates as multiple IDs generate ROI."],
  ["Months 37–48", "Higher re-staking frequency", "Continue following the $500 balance rule."],
  ["Months 49–60", "Mature compounding phase", "Highest ROI generation and multiple active IDs; create new IDs whenever the balance reaches $500."],
  ...oneThousandSchedule.map((month) => [`Month ${month}`, "Create 1 new ID", "The re-stake balance has reached the $500 creation threshold."]),
];

const fiveThousandActions = [
  "Invest $5,000. Create $3,000 in 1st-level IDs. Begin ROI and affiliate calculations.", "Continue compounding. No new IDs.", "Create $500 in 2nd-level IDs.", "Create $500 in 2nd-level IDs.", "Create $500 in 2nd-level IDs.", "Create $500 in 2nd-level IDs.", "Create $500 in 1st-level IDs.", "Create $500 in 1st-level IDs.", "Create $500 in 1st-level IDs.", "Create $500 in 1st-level IDs.", "Create $500 in 1st-level IDs.", "Create $500 in both 1st-level and 2nd-level IDs.", "Create $500 in both 1st-level and 2nd-level IDs.", "Create $500 in both 1st-level and 2nd-level IDs.", "Create $500 in both 1st-level and 2nd-level IDs.", "Create $500 in both 1st-level and 2nd-level IDs.", "Create $500 in both 1st-level and 2nd-level IDs.", "Create $500 in both 1st-level and 2nd-level IDs.", "Create $500 in the 1st, 2nd, and 3rd-level IDs.", "Create $500 in the 1st, 2nd, and 3rd-level IDs.", "Create $500 in the 1st, 2nd, 3rd, and 4th-level IDs.", "Create $500 in the 1st, 2nd, 3rd, and 4th-level IDs.", "Create $500 in the 1st, 2nd, 3rd, and 4th-level IDs.", "Create $500 in the 1st, 2nd, 3rd, and 4th-level IDs.", "Continue creating $500 IDs in Levels 1–4.", "Continue creating $500 IDs in Levels 1–4.", "Continue creating $500 IDs in Levels 1–4.", "Create $500 in Levels 1–4 and $5,500 in 5th-level IDs.", "Create $500 in Levels 1–4 and $4,500 in 5th-level IDs.", "Create $500 in every level (Levels 1–5).", "Create $500 in Levels 1–4 and $7,000 in 5th-level IDs.", "Create $500 in Levels 1–4 and $2,000 in 5th-level IDs.", "Create $500 in Levels 1–4 and $3,000 in 5th-level IDs.", "Create $500 in Levels 1–4 and $7,000 in 5th-level IDs.", "Create $500 in every level (Levels 1–5).", "Create $500 in every level (Levels 1–5). Continue the normal compounding cycle.",
];
const fiveThousand = fiveThousandActions.map((action, index) => [`Month ${index + 1}`, index === 0 ? "Initial deployment" : "Level expansion", action]);

export const plans = {
  500: { slug: "500", price: "$500", name: "Starter Compounding Plan", horizon: 60, summary: "A deliberate Main-ID roadmap that expands into 45 IDs over 60 months.", download: "/downloads/usdx-500-compounding.xlsx", downloadName: "USDX 500 Compounding Plan.xlsx", steps: fiveHundred, graph: [1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,4,4,5,5,6,6,6,7,8,9,10,10,10,12,12,14,16,17,17,19,22,25,26,26,30,34,38,42,45] },
  1000: { slug: "1000", price: "$1,000", name: "Advanced Compounding Plan", horizon: 60, summary: "A $1,000 Main-ID system with ROI, affiliate volume, and threshold-based ID creation.", download: "/downloads/usdx-1000-compounding.xlsx", downloadName: "USDX 1000 Compounding Plan.xlsx", steps: oneThousand, graph: oneThousandSchedule.map((month, index) => ({ month, ids: index + 2 })) },
  5000: { slug: "5000", price: "$5,000", name: "Professional Compounding Plan", horizon: 36, summary: "A multi-level ROI and affiliate plan with structured deployment across five levels.", download: "/downloads/usdx-5000-aff-070.xlsx", downloadName: "USDX 5000 AFF 0.70.xlsx", steps: fiveThousand, graph: fiveThousandActions.map((_, index) => Math.min(5, Math.max(1, Math.ceil((index + 1) / 7)))) },
};
