export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background green decorations */}
      <div className="absolute -top-48 -right-48 w-[700px] h-[700px] bg-emerald-400/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-48 -left-48 w-[650px] h-[650px] bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-emerald-300/15 rounded-full blur-2xl pointer-events-none" />
      <div className="relative z-10 w-full flex justify-center">
        {children}
      </div>
    </div>
  );
}
