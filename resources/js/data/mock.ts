export type KPI = { label: string; value: string; delta?: string; good?: boolean; help?: string };

export const kpis: KPI[] = [
    { label: "Monthly Churn", value: "2.3%", delta: "-0.4%", good: true, help: "Percent of active members who canceled this month" },
    { label: "Class Fill Rate", value: "87%", delta: "+6%", good: true, help: "Average seats filled across all classes" },
    { label: "No‑Show Rate", value: "7.8%", delta: "-2.1%", good: true, help: "Bookings not attended" },
    { label: "MRR", value: "$1.20M", delta: "+$34k", good: true, help: "Monthly recurring revenue (dues + memberships)" }
];

export const retentionSeries = [
    { month: "Jan", retained: 93, joins: 380, churn: 7 },
    { month: "Feb", retained: 94, joins: 410, churn: 6 },
    { month: "Mar", retained: 94, joins: 422, churn: 6 },
    { month: "Apr", retained: 95, joins: 450, churn: 5 },
    { month: "May", retained: 95, joins: 470, churn: 5 },
    { month: "Jun", retained: 97, joins: 520, churn: 3 }
];

export const classes = [
    { id: "C-101", name: "Power Cycle", start: "06:00", capacity: 24, booked: 23, waitlist: 2 },
    { id: "C-225", name: "HIIT 45", start: "07:00", capacity: 18, booked: 16, waitlist: 0 },
    { id: "C-338", name: "Reformer Pilates", start: "08:00", capacity: 12, booked: 12, waitlist: 4 },
    { id: "C-441", name: "Strength Lab", start: "09:00", capacity: 20, booked: 18, waitlist: 1 }
];

export const atRiskMembers = [
    { id: "M-1001", name: "Jordan Lee", lastCheckIn: "12 days", risk: "High", reason: "Streak break + overdue payment" },
    { id: "M-1018", name: "Sam Carter", lastCheckIn: "8 days", risk: "Med", reason: "Missed 2 booked classes" },
    { id: "M-1022", name: "Ava Patel", lastCheckIn: "16 days", risk: "High", reason: "No check‑ins in 2 weeks" },
    { id: "M-1083", name: "Riley Chen", lastCheckIn: "6 days", risk: "Med", reason: "Survey NPS = 6" }
];

export const leads = [
    { id: "L-9001", name: "Taylor Morgan", stage: "Trial", source: "Referral", owner: "Front Desk", score: 82 },
    { id: "L-9002", name: "Chris Diaz", stage: "Tour", source: "Web", owner: "Sam", score: 67 },
    { id: "L-9003", name: "Jamie O’Neal", stage: "New Lead", source: "Ad: FB", owner: "Ava", score: 58 },
    { id: "L-9004", name: "Alex Kim", stage: "Close", source: "Walk‑in", owner: "Jordan", score: 90 }
];

export const playbooks = [
    { id: "P-1", name: "Streak Save", trigger: "7 days no check‑in", channel: "SMS", audience: "All members", status: "Active" },
    { id: "P-2", name: "Freeze Rescue", trigger: "Freeze request", channel: "Email + Offer", audience: "At‑risk", status: "Paused" },
    { id: "P-3", name: "Win‑back <30d", trigger: "Cancel within 30 days", channel: "SMS", audience: "New joins", status: "Active" }
];