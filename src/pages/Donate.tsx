import { useId, useState, type ComponentType } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { OrnamentDivider, PatternBackground, StarMark } from "@/components/IslamicPattern";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Heart, Landmark, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";

const DEFAULT_PRESETS = [50, 100, 250, 500];

// TODO: replace with the real Islamic Cultural Centre (Lund mosque) website.
const IKC_WEBSITE_URL = "https://ikclund.se/donate";

type DonationPanelProps = {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  presets?: number[];
  defaultAmount?: number;
};

const DonationPanel = ({
  title,
  description,
  icon: Icon,
  presets = DEFAULT_PRESETS,
  defaultAmount = 100,
}: DonationPanelProps) => {
  const inputId = useId();
  const [amount, setAmount] = useState<number>(defaultAmount);
  const [customValue, setCustomValue] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const resolvedAmount =
    customValue.trim() !== "" ? Number(customValue) : amount;

  const handleDonate = async () => {
    const value = Math.round(resolvedAmount);
    if (!Number.isFinite(value) || value < 3) {
      toast.error("Please enter an amount of at least 3 SEK.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiRequest("/donations/checkout", "POST", {
        amount: value,
      });
      if (result?.url) {
        window.location.assign(result.url);
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start donation",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-8 shadow-soft backdrop-blur-sm transition-all duration-300 ease-organic hover:-translate-y-1.5 hover:shadow-lift">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-gold/15 ring-1 ring-border/60 transition-transform duration-500 ease-spring group-hover:scale-110 group-hover:-rotate-3">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h2 className="text-2xl font-display">{title}</h2>
      <p className="mt-3 flex-1 text-muted-foreground leading-relaxed">
        {description}
      </p>

      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant={
                amount === preset && customValue.trim() === ""
                  ? "default"
                  : "outline"
              }
              onClick={() => {
                setAmount(preset);
                setCustomValue("");
              }}
            >
              {preset} SEK
            </Button>
          ))}
        </div>

        <div>
          <label
            className="text-sm text-muted-foreground"
            htmlFor={inputId}
          >
            Custom amount (SEK)
          </label>
          <Input
            id={inputId}
            type="number"
            min={3}
            inputMode="numeric"
            placeholder="e.g. 100"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className="mt-1"
          />
        </div>

        <Button
          className="w-full"
          onClick={handleDonate}
          disabled={submitting}
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className="h-4 w-4" />
          )}
          Donate{" "}
          {Number.isFinite(resolvedAmount) ? `${resolvedAmount} SEK` : ""}
        </Button>
      </div>
    </div>
  );
};

const Donate = () => {
  return (
    <div className="min-h-dvh flex flex-col page">
      <Navbar overlay />
      <main className="flex-1">
        {/* ── Header + donation ─────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <PatternBackground tintClassName="opacity-[0.16] dark:opacity-[0.12]" />
          <div
            className="pointer-events-none absolute -bottom-40 -left-40 h-[42rem] w-[42rem] rounded-full bg-[hsl(var(--aurora-2)/0.35)] blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-gold/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-background"
            aria-hidden="true"
          />
          <div className="container relative z-10 pt-24 md:pt-32 pb-12 md:pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-14 items-center">
              <Reveal>
                <span className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-gold">
                  <StarMark className="h-3.5 w-3.5 text-gold" />
                  Give back
                </span>
                <h1 className="mt-4 font-display text-5xl md:text-7xl tracking-tight text-balance">
                  Support our <em className="italic text-gold">community</em>
                </h1>
              </Reveal>

              <Reveal delay={120}>
                <DonationPanel
                  title="Support LUMS"
                  description="Help fund our student activities, events, and day-to-day operations. May Allah SWT reward you for your contribution."
                  icon={Heart}
                />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Encouraging note ──────────────────────────────────────── */}
        <section className="relative pb-14 md:pb-20">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <Reveal>
                <OrnamentDivider />
                <p className="mt-6 text-muted-foreground leading-relaxed">
                  LUMS is an independent Muslim Student association run by
                  volunteers for the sake of Allah SWT, and funded entirely by{" "}
                  <em className="not-italic font-semibold text-gold">YOU</em>,
                  our community. A small donation goes a long way in keeping our
                  events, resources, and community initiatives running.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Lund Mosque (IKC) ───────────────────────────────────────── */}
        <section className="relative py-14 md:py-20 bg-muted/40">
          <div className="container max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
              <Reveal>
                <img src="/assets/ikc_lund.webp" alt="Lund Mosque (IKC)" className="h-full w-full object-cover rounded-2xl" />
              </Reveal>
              <Reveal delay={120}>
                <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
                  Also support
                </span>
                <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
                  Lund Mosque (IKC)
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  The Islamic Cultural Centre in Lund is an integral part of the Muslim community in Lund.
                  The Muslim community in Lund is growing, and we are rebuilding the mosque to accomodate
                  their growing number and provide a place of worship for the future generations.
                  Be a part of building this house of Allah SWT. Donate now!
                </p>
                <Button asChild className="mt-6">
                  <a href={IKC_WEBSITE_URL} target="_blank" rel="noreferrer">
                    Donate to the mosque
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </Reveal>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Donate;
