import { useState } from "react";
import type { ComponentType } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuroraBackground } from "@/components/AuroraBackground";
import { Reveal } from "@/components/Reveal";
import { OrnamentDivider } from "@/components/IslamicPattern";
import { Button } from "@/components/ui/button";
import governance from "@/config/governance.json";
import {
  ScrollText,
  Users,
  FileText,
  ExternalLink,
  ArrowRight,
  Check,
  Copy,
  Scale,
  Mail,
} from "lucide-react";

type BoardMember = {
  fullname: string;
  role: string;
  email: string;
};

type Report = {
    name: string;
    desc: string;
    link: string;
}

type GovernanceConfig = {
  year: string;
  board: {
    main_board: BoardMember[];
    auxiliary_board: BoardMember[];
  };
  by_laws: string;
  reports: Report[];
};

const config = governance as GovernanceConfig;

const hasEmail = (email: string) => !!email && email !== "N/A";

const ORG_NUMBER = "802543-6604";

const OrgNumber = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ORG_NUMBER);
    } catch {
      // Clipboard unavailable — the user can still copy the number manually.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
      <span className="text-sm text-muted-foreground">Org. no.</span>
      <span className="text-md font-semibold tracking-wide text-foreground">
        {ORG_NUMBER}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-primary" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copy
          </>
        )}
      </button>
    </div>
  );
};

const MemberRow = ({ member }: { member: BoardMember }) => (
  <li className="py-4">
    <p className="font-medium leading-tight">{member.fullname}</p>
    <p className="text-sm text-gold">{member.role}</p>
    {hasEmail(member.email) && (
      <a
        href={`mailto:${member.email}`}
        className="flex items-center gap-1 text-muted-foreground text-sm"
      >
        <Mail className="h-3.5 w-3.5 shrink-0" />
        <span className="break-all">{member.email}</span>
      </a>
    )}
  </li>
);

const DocCard = ({
  title,
  description,
  url,
}: {
  title: string;
  description: string;
  url: string;
}) => {
  const body = (
    <>
      <h4 className="mt-4 text-lg font-display">{title}</h4>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </>
  );

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card/70 p-6 shadow-soft backdrop-blur-sm transition-all duration-300 ease-organic hover:-translate-y-1 hover:shadow-lift"
      >
        {body}
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          Read document
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </a>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border/70 bg-card/70 p-6 shadow-soft backdrop-blur-sm">
      {body}
      <span className="mt-4 text-sm text-muted-foreground">Coming soon</span>
    </div>
  );
};

const Governance = () => {
  const { year, board, by_laws, reports } =
    config;

  return (
    <div className="min-h-dvh flex flex-col page">
      <Navbar overlay />
      <main className="flex-1 relative">
        <AuroraBackground />
        <div className="container relative z-10 pt-28 md:pt-36 pb-14 md:pb-20">
          {/* ── Header ─────────────────────────────────────────────── */}
          <Reveal className="text-center">
            <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
              Governance
            </span>
            <h1 className="mt-3 text-4xl md:text-5xl font-display tracking-tight">
              By-laws &amp; Governance
            </h1>
            <OrnamentDivider className="mt-5" />
          </Reveal>

          {/* ── General info + by-laws link ───────────────────────── */}
          <section className="mt-12 max-w-4xl mx-auto">
            <Reveal>
              <div className="rounded-2xl border border-border/70 bg-card/70 p-8 md:p-10 shadow-soft backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-gold/15 ring-1 ring-border/60">
                    <Scale className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl md:text-3xl font-display tracking-tight">
                      How our association is governed
                    </h2>
                    <p className="mt-4 text-muted-foreground leading-relaxed">
                      Lund University Muslim Students is a registered, independent, non-profit
                      student association. Its highest decision-making body is the general
                      meeting of members, which elects a board to run the
                      association between meetings and adopts the documents that
                      guide its work.
                    </p>
                    <OrgNumber />
                    <p className="mt-3 text-muted-foreground leading-relaxed">
                      Our by-laws set out the association's purpose, membership,
                      meetings, and the duties of the board. Everything we do — from
                      events to finances — happens within that framework and is
                      reported back to the members every year.
                    </p>
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-4 border-t border-border/70 pt-6">
                  {by_laws ? (
                    <Button
                      asChild
                      size="lg"
                      className="h-12 rounded-full px-8 shadow-glow transition-all duration-300 ease-organic hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]"
                    >
                      <a href={by_laws} target="_blank" rel="noreferrer">
                        <ScrollText className="h-4 w-4" />
                        Read our by-laws
                        <ExternalLink className="h-4 w-4 opacity-70" />
                      </a>
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      disabled
                      className="h-12 rounded-full px-8 opacity-60"
                    >
                      <ScrollText className="h-4 w-4" />
                      By-laws coming soon
                    </Button>
                  )}
                </div>
              </div>
            </Reveal>
          </section>

          {/* ── Current operational year ──────────────────────────── */}
          <section className="mt-16 md:mt-24 max-w-5xl mx-auto">
            <Reveal className="text-center">
              <span className="text-sm font-medium uppercase tracking-[0.2em] text-gold">
                Current operational year
              </span>
              <h2 className="mt-3 text-3xl md:text-4xl font-display tracking-tight">
                {year}
              </h2>
              <OrnamentDivider className="mt-5" />
            </Reveal>

            {/* The board */}
            <div className="mt-12">
              <Reveal>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gold" />
                  <h3 className="text-xl font-display tracking-tight">The Board</h3>
                </div>
              </Reveal>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div>
                  <Reveal>
                    <h4 className="text-sm font-medium uppercase tracking-[0.15em] text-muted-foreground">
                      Main board
                    </h4>
                  </Reveal>
                  <Reveal>
                    <ul className="mt-4 divide-y divide-border/70">
                      {board.main_board.map((member) => (
                        <MemberRow key={member.fullname} member={member} />
                      ))}
                    </ul>
                  </Reveal>
                </div>

                <div>
                  <Reveal>
                    <h4 className="text-sm font-medium uppercase tracking-[0.15em] text-muted-foreground">
                      Auxiliary board
                    </h4>
                  </Reveal>
                  <Reveal>
                    <ul className="mt-4 divide-y divide-border/70">
                      {board.auxiliary_board.map((member) => (
                        <MemberRow key={member.fullname} member={member} />
                      ))}
                    </ul>
                  </Reveal>
                </div>
              </div>
            </div>

            {/* Annual meeting protocol + financial report */}
            <div className="mt-14">
              <Reveal>
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gold" />
                  <h3 className="text-xl font-display tracking-tight">
                    Documents &amp; Reports
                  </h3>
                </div>
              </Reveal>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                {reports.map(report => (
                    <Reveal>
                        <DocCard
                            title={report.name}
                            description={report.desc}
                            url={report.link}
                        />
                    </Reveal>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Governance;
