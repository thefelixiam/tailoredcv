"use client";
import { useLayoutEffect, useRef, useState } from "react";
const A4_PX = 794;
export function ScaleToFit({ children }: {
    children: React.ReactNode;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el)
            return;
        const update = () => setZoom(Math.min(1, el.clientWidth / A4_PX));
        update();
        const reset = () => setZoom(1);
        const ro = new ResizeObserver(update);
        ro.observe(el);
        window.addEventListener("beforeprint", reset);
        window.addEventListener("afterprint", update);
        return () => {
            ro.disconnect();
            window.removeEventListener("beforeprint", reset);
            window.removeEventListener("afterprint", update);
        };
    }, []);
    return (<div ref={ref} className="w-full">
      <div style={{ zoom }}>
        {children}
      </div>
    </div>);
}
