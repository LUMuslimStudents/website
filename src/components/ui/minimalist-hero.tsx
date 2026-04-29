import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Navbar } from '@/components/Navbar';

// Define the props interface for type safety and reusability
export interface MinimalistHeroProps {
  mainText: string;
  readMoreLink: string;
  imageSrc: string;
  imageAlt: string;
  overlayText: {
    part1: string;
    part2: string;
  };
  locationText: string;
  className?: string;
}

// The main reusable Hero Section component
export const MinimalistHero = ({
  mainText,
  readMoreLink,
  imageSrc,
  imageAlt,
  overlayText,
  locationText,
  className,
}: MinimalistHeroProps) => {
  return (
    <div
      className={cn(
        'relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background p-8 font-sans md:p-12',
        className
      )}
    >
      {/* Clean elegant background gradient */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />

      {/* Main Content Area */}
      <div className="relative z-10 grid w-full max-w-7xl flex-grow grid-cols-1 items-center md:grid-cols-3 mt-16 md:mt-0">
        {/* Left Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="z-20 order-2 md:order-1 text-center md:text-left mt-8 md:mt-0"
        >
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-foreground/80 md:mx-0">{mainText}</p>
          <a href={readMoreLink} className="mt-4 inline-block text-sm font-bold text-primary underline decoration-primary decoration-2 underline-offset-4 hover:text-secondary hover:decoration-secondary transition-colors">
            Discover More
          </a>
        </motion.div>

        {/* Center Image with Circle */}
        <div className="relative order-1 md:order-2 flex justify-center items-center h-full min-h-[300px]">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                className="absolute z-0 h-[280px] w-[280px] rounded-full bg-secondary/20 md:h-[350px] md:w-[350px] lg:h-[450px] lg:w-[450px]"
            ></motion.div>
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                className="absolute z-0 h-[260px] w-[260px] translate-x-4 translate-y-4 rounded-full bg-primary/10 md:h-[330px] md:w-[330px] lg:h-[430px] lg:w-[430px]"
            ></motion.div>
            <motion.img
                src={imageSrc}
                alt={imageAlt}
                className="relative z-10 h-auto w-48 md:w-64 lg:w-80 object-contain drop-shadow-2xl transition-transform duration-700 hover:scale-105"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            />
        </div>

        {/* Right Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="z-20 order-3 flex items-center justify-center text-center md:justify-end mt-8 md:mt-0"
        >
          <h1 className="text-6xl font-extrabold text-foreground md:text-7xl lg:text-8xl tracking-tighter text-right">
            {overlayText.part1}
            <br />
            <span className="text-primary">{overlayText.part2}</span>
          </h1>
        </motion.div>
      </div>

      {/* Footer Elements */}
      <footer className="z-30 flex w-full max-w-7xl items-center justify-between pb-4 mt-auto relative">
         <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="text-sm font-bold text-foreground tracking-widest uppercase"
        >
          {locationText}
        </motion.div>
      </footer>
    </div>
  );
};
