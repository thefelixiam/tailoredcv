const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function humanizeDate(fragment: string): string {
    const m = fragment.trim().match(/^(\d{4})-(\d{1,2})$/);
    if (m) {
        const month = MONTHS[parseInt(m[2], 10) - 1];
        if (month)
            return `${month} ${m[1]}`;
    }
    return fragment.trim();
}
