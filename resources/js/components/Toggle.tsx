export default function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            aria-pressed={checked}
            onClick={() => onChange(!checked)}
            className={`w-11 h-6 rounded-full transition relative ${checked ? "bg-brand-600" : "bg-slate-300"}`}
        >
            <span className={`absolute top-0.5 transition ${checked ? "translate-x-5" : "translate-x-1"} inline-block w-5 h-5 bg-white rounded-full`} />
        </button>
    );
}