import { type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useClerk, useUser } from '@clerk/react';
import { Activity, ArrowUpRight, BookOpen, ChartNoAxesCombined, CircleHelp, LogOut, Settings2, ShieldCheck, SlidersHorizontal, Waves } from 'lucide-react';

const links = [
  { href: '/dashboard', label: 'Workspace', icon: ChartNoAxesCombined },
  { href: '/markets', label: 'Markets', icon: Waves },
  { href: '/methodology', label: 'Methodology', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: SlidersHorizontal },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  return <div className="min-h-[100dvh] bg-background md:flex">
    <aside className="md:fixed md:inset-y-0 md:flex md:w-[248px] md:flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-[76px] items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"><Activity size={18} strokeWidth={2.4}/></div>
        <div><div className="text-[15px] font-extrabold tracking-[-.04em]">PHOTON</div><div className="mono text-[9px] tracking-[.19em] text-sidebar-foreground/55">DERIV TRADER</div></div>
      </div>
      <div className="px-5 pt-8 pb-3 mono text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/45">Analysis workspace</div>
      <nav className="space-y-1 px-3">
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} data-testid={`link-nav-${label.toLowerCase()}`} className={`group flex items-center gap-3 rounded-md px-3 py-3 text-[13px] font-semibold transition-colors ${location === href ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}>
          <Icon size={17} strokeWidth={1.8}/><span>{label}</span>{location === href && <span className="ml-auto size-1.5 rounded-full bg-sidebar-primary"/>}
        </Link>)}
      </nav>
      <div className="mx-5 mt-8 rounded-md border border-sidebar-border bg-sidebar-accent/45 p-4">
        <div className="flex items-center gap-2 text-[11px] font-bold"><ShieldCheck size={14} className="text-sidebar-primary"/> Guardrails active</div>
        <p className="mt-2 text-[11px] leading-5 text-sidebar-foreground/55">Real-money execution is disabled. Workspace is for study and explicit risk constraints.</p>
      </div>
      <div className="mt-auto border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-[11px] font-bold text-sidebar-foreground">{user?.firstName?.slice(0,1) || user?.emailAddresses[0]?.emailAddress.slice(0,1).toUpperCase() || 'U'}</div>
          <div className="min-w-0 flex-1"><div className="truncate text-[12px] font-semibold">{user?.fullName || 'Trader workspace'}</div><div className="truncate text-[10px] text-sidebar-foreground/50">{user?.emailAddresses[0]?.emailAddress || 'Signed in'}</div></div>
          {user ? <button aria-label="Sign out" data-testid="button-sign-out" onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL || '/' })} className="rounded p-2 text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground"><LogOut size={15}/></button> : <Link href="/sign-in" data-testid="link-sidebar-sign-in" className="rounded px-2 py-1 text-[10px] font-bold text-sidebar-foreground/70 hover:bg-sidebar-accent">Sign in</Link>}
        </div>
      </div>
    </aside>
    <div className="md:ml-[248px] min-w-0 flex-1">
      <header className="sticky top-0 z-20 flex h-[58px] items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-md md:px-9">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><span className="size-1.5 rounded-full bg-primary"/><span>DERIV PUBLIC DATA</span><span className="hidden sm:inline">/</span><span className="hidden sm:inline">No account connected</span></div>
        <Link href="/methodology" className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground"><CircleHelp size={14}/> Operating notes <ArrowUpRight size={12}/></Link>
      </header>
      <main className="mx-auto max-w-[1440px] px-5 py-8 md:px-9 md:py-10">{children}</main>
    </div>
  </div>;
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-enter">
    <div><div className="mono mb-2 text-[10px] uppercase tracking-[.17em] text-primary">{eyebrow}</div><h1 className="text-[30px] font-extrabold leading-tight tracking-[-.055em] md:text-[36px]">{title}</h1>{description && <p className="mt-2 max-w-2xl text-[13px] leading-6 text-muted-foreground">{description}</p>}</div>
    {action}
  </div>;
}
