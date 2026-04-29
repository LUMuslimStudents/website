import { cn } from "@/lib/utils";
import React from "react";
import { Link } from "react-router-dom";

export function GradientCTA() {
    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col items-center justify-center text-center bg-gradient-to-b from-[#004aac] to-[#002f6c] dark:from-secondary dark:to-secondary rounded-3xl p-10 md:p-16 text-white shadow-2xl relative overflow-hidden">
                {/* Decorative background blur */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/20 rounded-full blur-3xl opacity-50" />
                    <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#ffdb80]/20 dark:bg-black/10 rounded-full blur-3xl opacity-50" />
                </div>

                <div className="relative z-10 flex flex-wrap items-center justify-center p-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm mb-6">
                    <div className="flex items-center pl-2 pr-4 py-1">
                        <div className="flex -space-x-3 mr-4">
                            <img className="size-8 rounded-full border-2 border-[#004aac] dark:border-secondary object-cover"
                                src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?q=80&w=100&auto=format&fit=crop" alt="Student" />
                            <img className="size-8 rounded-full border-2 border-[#004aac] dark:border-secondary object-cover"
                                src="https://images.unsplash.com/photo-1544717302-de2939b7ef71?q=80&w=100&auto=format&fit=crop" alt="Student" />
                            <img className="size-8 rounded-full border-2 border-[#004aac] dark:border-secondary object-cover"
                                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop" alt="Student" />
                        </div>
                        <p className="font-medium">Join our growing community</p>
                    </div>
                </div>
                
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold max-w-2xl mt-2 bg-gradient-to-r from-white via-white to-white/70 text-transparent bg-clip-text tracking-tight pb-2">
                    Unlock your next big opportunity at LUMS.
                </h2>
                
                <p className="mt-6 text-blue-100/80 dark:text-white/80 max-w-xl text-lg md:text-xl font-medium">
                    Connect with fellow Muslim students, access exclusive resources, and be part of our events and support network.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mt-10 relative z-10">
                    <Link to="/membership" className="px-8 py-3 text-[#004aac] dark:text-secondary bg-white hover:bg-gray-50 transition-all rounded-full font-semibold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                        Become a Member
                    </Link>
                    <Link to="/events" className="px-8 py-3 text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all rounded-full font-semibold text-base">
                        View Events
                    </Link>
                </div>
            </div>
        </div>
    );
}
