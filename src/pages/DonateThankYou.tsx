import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Home, Loader2, RotateCcw } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

type State = "loading" | "thankyou" | "failed";

const CONFETTI_COLORS = [
  "#1f6feb",
  "#b27334",
  "#2f9e44",
  "#e03131",
  "#f59f00",
  "#7048e8",
];

const ConfettiBurst = () => {
  const particles = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 140 + Math.random() * 220;
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          rotate: (Math.random() - 0.5) * 720,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          delay: Math.random() * 0.2,
          size: 6 + Math.random() * 9,
          round: Math.random() > 0.5,
        };
      }),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, scale: 1, opacity: 0, rotate: p.rotate }}
          transition={{ duration: 1.5, delay: p.delay, ease: "easeOut" }}
          className="absolute left-1/2 top-1/2"
          style={{
            width: p.size,
            height: p.size * (p.round ? 1 : 0.4),
            backgroundColor: p.color,
            borderRadius: p.round ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
};

const FloatingHearts = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    {Array.from({ length: 6 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: -240, opacity: [0, 0.6, 0] }}
        transition={{
          duration: 4 + i * 0.7,
          delay: i * 0.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute"
        style={{ left: `${12 + i * 15}%`, bottom: "-40px" }}
      >
        <Heart className="h-5 w-5 text-[#b27334]/70" fill="currentColor" />
      </motion.div>
    ))}
  </div>
);

const CheckMark = () => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
    className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50"
  >
    <motion.svg
      viewBox="0 0 24 24"
      className="h-12 w-12 text-emerald-600"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.path
        d="M5 13l4 4L19 7"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
      />
    </motion.svg>
  </motion.div>
);

const DonateThankYou = () => {
  const [state, setState] = useState<State>("loading");
  const location = useLocation();
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    const verify = async () => {
      const sessionId = new URLSearchParams(location.search).get("session_id");
      if (!sessionId) {
        if (!cancelled) setState("failed");
        return;
      }

      for (let attempt = 0; attempt < 3; attempt++) {
        if (cancelled) return;
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        try {
          const result = await apiRequest(
            `/payment/verify?session_id=${encodeURIComponent(sessionId)}`,
            "GET",
          );
          if (cancelled) return;
          if (result?.paid) {
            setState("thankyou");
            return;
          }
        } catch (error) {
          console.error("Donation verification attempt failed:", error);
        }
      }

      if (!cancelled) setState("failed");
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [location.search, authLoading]);

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar overlay />
      <main className="relative flex-1 container flex items-center justify-center pt-32 md:pt-36 pb-16">
        {state === "thankyou" && (
          <>
            <ConfettiBurst />
            <FloatingHearts />
          </>
        )}

        <div className="relative w-full max-w-md text-center">
          {state === "loading" ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Confirming your donation…
              </p>
            </div>
          ) : state === "thankyou" ? (
            <div className="space-y-6">
              <CheckMark />
              <div className="space-y-2">
                <motion.h1
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="text-3xl md:text-4xl font-semibold"
                >
                  Thank you!
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.65 }}
                  className="text-muted-foreground"
                >
                  Your donation has been received. May Allah SWT reward you
                  abundantly for your generosity.
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="flex flex-col gap-2 sm:flex-row sm:justify-center"
              >
                <Button onClick={() => navigate("/")}>
                  <Home className="h-4 w-4" />
                  Return home
                </Button>
                <Button variant="outline" onClick={() => navigate("/donate")}>
                  <Heart className="h-4 w-4" />
                  Donate again
                </Button>
              </motion.div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50">
                  <Heart className="h-8 w-8 text-amber-600" />
                </div>
                <h1 className="text-2xl font-semibold">
                  We couldn&apos;t confirm your donation
                </h1>
                <p className="text-muted-foreground">
                  If you completed the payment, give it a moment and try again.
                  Otherwise, you can return to the donation page.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button onClick={() => navigate("/donate")}>
                  <RotateCcw className="h-4 w-4" />
                  Try again
                </Button>
                <Button variant="outline" onClick={() => navigate("/")}>
                  <Home className="h-4 w-4" />
                  Return home
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DonateThankYou;
