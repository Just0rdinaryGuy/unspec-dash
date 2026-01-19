"use client";
import React, { useEffect } from "react";
import mermaid from "mermaid";

mermaid.initialize({
    startOnLoad: true,
    theme: "default",
    securityLevel: "loose",
});

interface MermaidProps {
    chart: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
    useEffect(() => {
        mermaid.contentLoaded();
    }, [chart]);

    return <div className="mermaid">{chart}</div>;
};

export default Mermaid;
