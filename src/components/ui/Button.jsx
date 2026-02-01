import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Button({ className, variant = 'primary', ...props }) {
    const baseStyles = "w-full rounded-2xl py-4 font-bold text-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2";
    const variants = {
        primary: "bg-toss-blue text-white hover:bg-blue-600 shadow-lg shadow-blue-100",
        secondary: "bg-blue-50 text-toss-blue hover:bg-blue-100",
        outline: "bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50",
        ghost: "bg-transparent text-slate-500 hover:bg-slate-100" // For less important actions
    };

    return (
        <button className={twMerge(baseStyles, variants[variant], className)} {...props} />
    );
}
