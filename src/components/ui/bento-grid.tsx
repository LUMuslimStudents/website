import { cn } from "@/lib/utils";
import React from "react";

export interface BentoItem {
    title: string;
    description: string;
    icon: React.ReactNode;
    status?: string;
    tags?: string[];
    meta?: string;
    cta?: string;
    colSpan?: number;
    hasPersistentHover?: boolean;
}

interface BentoGridProps {
    items: BentoItem[];
}

function BentoGrid({ items }: BentoGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 max-w-6xl mx-auto">
            {items.map((item, index) => (
                <div
                    key={index}
                    className={cn(
                        "group relative p-6 rounded-2xl overflow-hidden transition-all duration-300",
                        "border border-primary/10 bg-background/50 backdrop-blur-sm",
                        "hover:shadow-[0_8px_32px_rgba(0,74,172,0.08)]",
                        "hover:-translate-y-1 will-change-transform",
                        item.colSpan === 2 ? "md:col-span-2" : "col-span-1",
                        item.hasPersistentHover ? "shadow-[0_8px_32px_rgba(0,74,172,0.08)] -translate-y-1" : ""
                    )}
                >
                    <div className="relative flex flex-col h-full space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
                                {item.icon}
                            </div>
                            {item.status && (
                                <span className={cn(
                                    "text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm",
                                    "bg-secondary/10 text-secondary border border-secondary/20",
                                    "transition-colors duration-300 group-hover:bg-secondary/20"
                                )}>
                                    {item.status}
                                </span>
                            )}
                        </div>

                        <div className="space-y-2 flex-grow">
                            <h3 className="font-bold text-foreground tracking-tight text-xl">
                                {item.title}
                                {item.meta && (
                                    <span className="ml-3 text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded-md">
                                        {item.meta}
                                    </span>
                                )}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                {item.description}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 mt-auto border-t border-border/50">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                {item.tags?.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-1 rounded-md bg-muted/50 font-medium transition-colors duration-200 hover:bg-muted"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                            <span className="text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                                {item.cta || "Read more"} <span className="text-lg leading-none">&rarr;</span>
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export { BentoGrid }
