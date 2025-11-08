export default function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            aria-pressed={checked}
            onClick={() => onChange(!checked)}
            className={`w-11 h-6 rounded-full transition relative ${
                checked ? "bg-brand-500" : "bg-slate-300"
            }`}
        >
            <span
                className={`absolute top-0.5 left-0 inline-block h-5 w-5 rounded-full bg-white shadow transition ${
                    checked ? "translate-x-5" : "translate-x-1"
                }`}
            />
        </button>
    );
}
