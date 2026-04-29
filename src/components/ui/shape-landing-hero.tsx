"use client";

import { motion } from "framer-motion";
import { MoonStar } from "lucide-react";
import { cn } from "@/lib/utils";

function ElegantShape({
    className,
    delay = 0,
    width = 400,
    height = 100,
    rotate = 0,
    gradient = "from-white/[0.08]",
}: {
    className?: string;
    delay?: number;
    width?: number;
    height?: number;
    rotate?: number;
    gradient?: string;
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: -150,
                rotate: rotate - 15,
            }}
            animate={{
                opacity: 1,
                y: 0,
                rotate: rotate,
            }}
            transition={{
                duration: 2.4,
                delay,
                ease: [0.23, 0.86, 0.39, 0.96],
                opacity: { duration: 1.2 },
            }}
            className={cn("absolute", className)}
        >
            <motion.div
                animate={{
                    y: [0, 15, 0],
                }}
                transition={{
                    duration: 12,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                }}
                style={{
                    width,
                    height,
                }}
                className="relative"
            >
                <div
                    className={cn(
                        "absolute inset-0 rounded-t-full rounded-b-md", // Changed to Arch shape!
                        "bg-gradient-to-t to-transparent",
                        gradient,
                        "backdrop-blur-[2px] border-2 border-primary/[0.15]",
                        "shadow-[0_8px_32px_0_rgba(0,74,172,0.1)]", // Blue tint shadow
                        "after:absolute after:inset-0 after:rounded-t-full after:rounded-b-md",
                        "after:bg-[radial-gradient(circle_at_50%_50%,rgba(0,74,172,0.1),transparent_70%)]"
                    )}
                />
            </motion.div>
        </motion.div>
    );
}

function HeroGeometric({
    badge = "Lund University Muslim Students",
    title1 = "Faith & Community",
    title2 = "United in Lund",
}: {
    badge?: string;
    title1?: string;
    title2?: string;
}) {
    const fadeUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                duration: 1,
                delay: 0.5 + i * 0.2,
                ease: [0.25, 0.4, 0.25, 1],
            },
        }),
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-secondary/[0.05] blur-3xl" />

            <div className="absolute inset-0 overflow-hidden">
                {/* Floating Islamic Arches */}
                <ElegantShape
                    delay={0.3}
                    width={200}
                    height={400}
                    rotate={12}
                    gradient="from-primary/[0.15]"
                    className="left-[-5%] md:left-[5%] top-[10%] md:top-[15%]"
                />

                <ElegantShape
                    delay={0.5}
                    width={150}
                    height={300}
                    rotate={-15}
                    gradient="from-secondary/[0.15]"
                    className="right-[-5%] md:right-[10%] top-[60%] md:top-[65%]"
                />

                <ElegantShape
                    delay={0.4}
                    width={100}
                    height={200}
                    rotate={-8}
                    gradient="from-primary/[0.1]"
                    className="left-[10%] md:left-[20%] bottom-[5%] md:bottom-[10%]"
                />

                <ElegantShape
                    delay={0.6}
                    width={120}
                    height={250}
                    rotate={20}
                    gradient="from-secondary/[0.1]"
                    className="right-[15%] md:right-[25%] top-[10%] md:top-[15%]"
                />

                <ElegantShape
                    delay={0.7}
                    width={80}
                    height={160}
                    rotate={-25}
                    gradient="from-primary/[0.15]"
                    className="left-[20%] md:left-[30%] top-[5%] md:top-[10%]"
                />
            </div>

            <div className="relative z-10 container mx-auto px-4 md:px-6 pt-24 md:pt-32">
                <div className="max-w-4xl mx-auto text-center flex flex-col items-center">


                    <motion.div
                        custom={1}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="mb-8"
                    >
                        <img 
                            src="/logos/LUMS - Banner Logo_Transparent.png" 
                            alt="LUMS Logo" 
                            className="h-24 md:h-32 mx-auto object-contain mb-6"
                        />
                        <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold mb-6 md:mb-8 tracking-tighter">
                            <span className="text-foreground">
                                {title1}
                            </span>
                            <br />
                            <span
                                className={cn(
                                    "bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-secondary "
                                )}
                            >
                                {title2}
                            </span>
                        </h1>
                    </motion.div>

                    <motion.div
                        custom={2}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <p className="text-lg sm:text-xl text-foreground/60 mb-10 leading-relaxed font-medium tracking-wide max-w-2xl mx-auto px-4">
                            Empowering Muslim students at Lund University through spiritual growth, academic excellence, and lasting brotherhood and sisterhood.
                        </p>
                    </motion.div>

                    <motion.div
                        custom={3}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex gap-4 justify-center"
                    >
                        <a href="/membership" className="inline-flex items-center justify-center px-8 py-3 text-sm font-medium text-white transition-colors duration-300 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-primary/25">
                            Join the Community
                        </a>
                        <a href="/events" className="inline-flex items-center justify-center px-8 py-3 text-sm font-medium text-primary transition-colors duration-300 rounded-full bg-primary/10 hover:bg-primary/20 backdrop-blur-sm">
                            Upcoming Events
                        </a>
                    </motion.div>
                </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/80 pointer-events-none" />
        </div>
    );
}

export { HeroGeometric }
