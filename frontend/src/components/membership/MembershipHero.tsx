
const MembershipHero = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 to-primary/5 py-16 mb-12">
      <div className="container relative z-10">
        <h1 className="text-5xl font-bold text-center mb-4 animate-in slide-in-from-bottom duration-700">
          Join Our Community
        </h1>
        <p className="text-xl text-center text-muted-foreground max-w-2xl mx-auto animate-in slide-in-from-bottom duration-700 delay-200">
          Be part of Lund University's vibrant Muslim community. Connect, learn, and grow together.
        </p>
      </div>
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
    </div>
  );
};

export default MembershipHero;
