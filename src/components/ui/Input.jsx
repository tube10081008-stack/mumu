export function Input({ label, ...props }) {
    return (
        <div className="space-y-1">
            {label && <label className="text-sm font-semibold text-slate-600 ml-1">{label}</label>}
            <input
                className="w-full bg-toss-grey border-0 rounded-2xl p-4 text-base focus:ring-2 focus:ring-toss-blue transition-all"
                {...props}
            />
        </div>
    );
}
