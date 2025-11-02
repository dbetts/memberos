export default function RiskPill({ level }: { level: "Low" | "Med" | "High" }) {
    const tone = level === "High" ? "bg-rose-100 text-rose-700"
        : level === "Med"  ? "bg-amber-100 text-amber-800"
            :                    "bg-green-100 text-green-700";
    return <span className={`text-xs px-2 py-0.5 rounded ${tone}`}>{level}</span>;
}