import { type Dispatch, type FormEvent, type SetStateAction, useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGetSettings, getGetSettingsQueryKey, useUpdateSettings } from '@workspace/api-client-react';
import type { UserSettingsInput } from '@workspace/api-client-react';
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, Check, CircleAlert, Clock3, Database, ExternalLink, Gauge, LockKeyhole, RefreshCw, ShieldCheck, SlidersHorizontal, TriangleAlert, Waves } from 'lucide-react';
import { AppShell, SectionHeading } from '@/components/shell';
import { usePublicMarket } from '@/hooks/use-public-market';
import { useDerivSymbols } from '@/hooks/use-deriv-symbols';

const frames = ['D1','H4','M15','M1'] as const;
const granularity: Record<typeof frames[number], number> = { D1:86400, H4:14400, M15:900, M1:60 };
const frameLabel: Record<typeof frames[number], string> = { D1:'1 day', H4:'4 hours', M15:'15 minutes', M1:'1 minute' };
const cash = (value: number | null | undefined) => value == null ? 'Not available' : new Intl.NumberFormat(undefined,{style:'currency',currency:'USD'}).format(value);
const dateTime = (epoch: number) => new Date(epoch * 1000).toLocaleString([], { dateStyle:'medium', timeStyle:'short' });

function LoadingPanel({ label = 'Loading workspace data' }: {label?:string}) {
  return <div className="rounded-md border border-border bg-card p-6" aria-label={label}><div className="h-3 w-28 animate-pulse rounded bg-muted"/><div className="mt-5 h-8 w-52 animate-pulse rounded bg-muted"/><div className="mt-4 h-3 w-full animate-pulse rounded bg-muted"/></div>;
}
function QueryFailure({ retry }: {retry:()=>void}) {
  return <div role="alert" className="flex flex-col items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><CircleAlert className="mt-0.5 text-destructive" size={18}/><div><div className="text-sm font-bold">Workspace data is unavailable</div><p className="mt-1 text-xs text-muted-foreground">The authenticated API did not return a response. No values are being estimated.</p></div></div><button onClick={retry} data-testid="button-retry-query" className="rounded-md border border-border px-3 py-2 text-xs font-bold hover:bg-muted">Retry request</button></div>;
}

export function HomePage() {
  return <div className="min-h-[100dvh] overflow-hidden bg-background">
    <header className="mx-auto flex max-w-[1360px] items-center justify-between px-5 py-5 md:px-10">
      <Link href="/" className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground"><Activity size={18}/></span><span><b className="block text-[14px] tracking-[-.04em]">PHOTON</b><span className="mono text-[9px] tracking-[.16em] text-muted-foreground">DERIV TRADER</span></span></Link>
      <nav className="flex items-center gap-5"><Link href="/methodology" className="hidden text-xs font-semibold text-muted-foreground hover:text-foreground sm:block">Methodology</Link><Link href="/sign-in" className="text-xs font-bold hover:text-primary" data-testid="link-sign-in">Sign in</Link><Link href="/sign-up" className="rounded-md bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90" data-testid="link-sign-up">Open workspace</Link></nav>
    </header>
    <main>
      <section className="relative mx-auto grid max-w-[1360px] items-center gap-12 px-5 pb-16 pt-16 md:grid-cols-[1.03fr_.97fr] md:px-10 md:pb-24 md:pt-20">
        <div className="absolute right-[8%] top-10 -z-0 h-[520px] w-[520px] rounded-full bg-accent/10 blur-[90px]"/>
        <div className="relative z-10 animate-enter"><div className="mono mb-6 inline-flex items-center gap-2 rounded-sm border border-primary/25 bg-primary/5 px-3 py-2 text-[10px] font-medium uppercase tracking-[.16em] text-primary"><span className="size-1.5 rounded-full bg-primary"/>A market study instrument</div>
          <h1 className="max-w-[740px] text-[48px] font-extrabold leading-[1.04] tracking-[-.065em] md:text-[72px]">Read the market.<br/><span className="text-primary">Respect the limits.</span></h1>
          <p className="mt-6 max-w-[580px] text-[15px] leading-7 text-muted-foreground">A focused analysis workspace for Deriv Synthetic Indices. Inspect public market candles, document provisional structure, and make your operating constraints explicit.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3"><Link href="/sign-up" className="inline-flex items-center gap-3 rounded-md bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground hover:opacity-90" data-testid="link-start-analysis">Start with a workspace <ArrowRight size={16}/></Link><Link href="/methodology" className="rounded-md border border-border bg-card px-5 py-3.5 text-sm font-bold hover:bg-muted" data-testid="link-review-methodology">Review methodology</Link></div>
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-5 text-[11px] font-semibold text-muted-foreground"><span className="flex items-center gap-2"><Database size={14} className="text-primary"/> Public Deriv WebSocket</span><span className="flex items-center gap-2"><LockKeyhole size={14} className="text-primary"/> No real-money execution</span></div>
        </div>
        <div className="relative animate-enter [animation-delay:100ms]">
          <div className="relative overflow-hidden rounded-md border border-border bg-card shadow-[0_20px_70px_-35px_rgba(25,43,50,.35)]">
            <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><div className="mono text-[9px] tracking-[.16em] text-muted-foreground">MARKET OBSERVATION</div><div className="mt-1 text-sm font-extrabold">Synthetic indices</div></div><div className="mono flex items-center gap-2 text-[9px] text-muted-foreground"><span className="size-1.5 rounded-full bg-accent"/> LIVE DATA ONLY</div></div>
            <div className="panel-grid relative h-[285px] p-5">
              <svg viewBox="0 0 520 260" className="absolute inset-3 h-[calc(100%-24px)] w-[calc(100%-24px)]" aria-label="Illustrative chart grid, no market values shown">
                <path d="M12 215 C55 202 63 170 101 180 S151 205 184 160 S228 168 260 129 S306 145 342 103 S391 128 420 77 S466 92 508 42" fill="none" stroke="hsl(167 44% 31%)" strokeWidth="2.4"/>
                <path d="M12 215 C55 202 63 170 101 180 S151 205 184 160 S228 168 260 129 S306 145 342 103 S391 128 420 77 S466 92 508 42 V260 H12Z" fill="hsl(167 44% 31% / .07)"/>
                <path d="M12 220H508M12 165H508M12 110H508M12 55H508" stroke="hsl(38 16% 83% / .7)" strokeDasharray="3 6"/>
                <circle cx="508" cy="42" r="5" fill="hsl(39 86% 54%)"/>
              </svg>
              <div className="absolute bottom-4 left-5 mono text-[9px] text-muted-foreground">Chart graphic is illustrative · connect to load real candles</div>
            </div>
            <div className="grid grid-cols-3 border-t border-border">
              {[['DATA SOURCE','Deriv public WS'],['EXECUTION','Disabled'],['STRUCTURE','Provisional']].map(([k,v])=><div key={k} className="border-r border-border p-4 last:border-0"><div className="mono text-[8px] tracking-[.12em] text-muted-foreground">{k}</div><div className="mt-1.5 text-[11px] font-bold">{v}</div></div>)}
            </div>
          </div>
          <div className="absolute -bottom-5 -left-4 hidden rounded-md border border-border bg-background px-4 py-3 shadow-lg sm:block"><div className="mono text-[8px] tracking-[.15em] text-muted-foreground">OPERATING PRINCIPLE</div><div className="mt-1 text-xs font-bold">Evidence before action</div></div>
        </div>
      </section>
      <section className="border-y border-border bg-card/55">
        <div className="mx-auto max-w-[1360px] px-5 py-14 md:px-10 md:py-16"><div className="grid gap-9 md:grid-cols-[.8fr_1.2fr]">
          <div><div className="mono text-[10px] uppercase tracking-[.17em] text-primary">Built around restraint</div><h2 className="mt-3 max-w-sm text-3xl font-extrabold tracking-[-.05em]">An analysis tool, not a trade signal machine.</h2></div>
          <div className="grid gap-4 sm:grid-cols-3">{[
            {n:'01',t:'Observe',d:'View historical candles from a clearly identified, public Deriv WebSocket feed.'},
            {n:'02',t:'Qualify',d:'Keep emerging structure ideas labeled as provisional until they are independently verified.'},
            {n:'03',t:'Constrain',d:'Set personal stake, loss, position, frequency and cooldown limits in one persisted profile.'},
          ].map((x)=><article key={x.n} className="border-l border-primary/35 pl-4"><div className="mono text-[10px] text-primary">{x.n} / FIELD NOTE</div><h3 className="mt-4 text-base font-extrabold">{x.t}</h3><p className="mt-2 text-xs leading-6 text-muted-foreground">{x.d}</p></article>)}</div>
        </div></div>
      </section>
      <section className="mx-auto max-w-[1360px] px-5 py-14 md:px-10 md:py-20">
        <div className="flex flex-col justify-between gap-7 rounded-md border border-primary/20 bg-primary/[.045] p-7 sm:flex-row sm:items-center md:p-10"><div><div className="mono text-[9px] uppercase tracking-[.17em] text-primary">Explicit by design</div><h2 className="mt-3 text-2xl font-extrabold tracking-[-.04em]">No account balance. No profitability promises.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Account connection is not implemented. Paper trading is a selectable workspace mode only; demo execution is not available yet.</p></div><Link href="/sign-up" className="inline-flex shrink-0 items-center gap-2 rounded-md bg-foreground px-5 py-3 text-sm font-bold text-background" data-testid="link-create-workspace">Create workspace <ArrowRight size={15}/></Link></div>
      </section>
    </main>
    <footer className="border-t border-border px-5 py-6 text-center mono text-[9px] tracking-[.1em] text-muted-foreground">PHOTON DERIV TRADER · MARKET DATA IS SUBJECT TO SOURCE AVAILABILITY</footer>
  </div>;
}

export function DashboardPage() {
  const query = useGetDashboardSummary();
  const summary = query.data;
  const items = [
    {label:'Account status', value:summary?.accountStatus === 'not_connected' ? 'Not connected' : 'Unavailable', detail:'No account data is requested', icon:LockKeyhole},
    {label:'Account balance', value:cash(summary?.accountBalance), detail:'Unavailable until account connection exists', icon:Gauge},
    {label:'Daily P&L', value:cash(summary?.dailyProfitLoss), detail:'No profit or loss estimate shown', icon:summary?.dailyProfitLoss != null && summary.dailyProfitLoss < 0 ? ArrowDownRight : ArrowUpRight},
    {label:'Active signals', value:summary ? String(summary.activeSignalCount) : 'Not available', detail:'Count returned by the workspace API', icon:Activity},
    {label:'Open positions', value:summary?.openPositionCount == null ? 'Not available' : String(summary.openPositionCount), detail:'Execution is not implemented', icon:Activity},
  ];
  return <AppShell><SectionHeading eyebrow="Control room / 01" title="Workspace overview" description="A sober readout of your analysis workspace. Values are shown only when returned by your account API or live public market source." action={<Link href="/markets" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-xs font-bold text-primary-foreground"><Waves size={15}/> Open markets</Link>}/>{query.isLoading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><LoadingPanel/><LoadingPanel/><LoadingPanel/><LoadingPanel/></div> : query.isError || !summary ? <QueryFailure retry={()=>void query.refetch()}/> : <>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{items.map(({label,value,detail,icon:Icon})=><section key={label} className="rounded-md border border-border bg-card p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-muted-foreground">{label}</span><Icon size={16} className="text-primary"/></div><div className="mono mt-6 min-h-7 text-[17px] font-medium tracking-[-.04em]" data-testid={`value-${label.toLowerCase().replaceAll(' ','-')}`}>{value}</div><div className="mt-2 text-[10px] leading-4 text-muted-foreground">{detail}</div></section>)}</div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <section className="overflow-hidden rounded-md border border-border bg-card"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><div className="mono text-[9px] tracking-[.15em] text-muted-foreground">CURRENT INSTRUMENT</div><h2 className="mt-1 text-base font-extrabold">{summary.selectedSymbol}</h2></div><div className="rounded-sm bg-secondary px-2.5 py-1.5 mono text-[9px] uppercase">{summary.operatingMode.replace('_',' ')}</div></div>
        <div className="panel-grid flex min-h-[212px] items-center justify-center p-6"><div className="max-w-sm text-center"><div className="mx-auto flex size-11 items-center justify-center rounded-full border border-primary/25 bg-primary/5 text-primary"><Waves size={19}/></div><h3 className="mt-4 text-sm font-bold">Market context awaits</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">Open the market view to request historical candles directly from Deriv’s public WebSocket. No quote is fabricated in this overview.</p><Link href="/markets" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-primary">Inspect market data <ArrowRight size={14}/></Link></div></div>
        <div className="flex flex-wrap justify-between gap-3 border-t border-border px-5 py-3 mono text-[9px] text-muted-foreground"><span>PROVIDER · {summary.marketDataProvider}</span><span>ACCOUNT · {summary.accountStatus}</span></div>
      </section>
      <div className="space-y-5">
        <section className="rounded-md border border-border bg-card p-5"><div className="flex items-center gap-2 text-xs font-bold"><ShieldCheck size={15} className="text-primary"/> Active constraints</div><p className="mt-3 text-xs leading-5 text-muted-foreground">Risk limits are persisted in Settings. They are workspace constraints, not broker-enforced protections.</p><Link href="/settings" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-primary">Review settings <ArrowRight size={13}/></Link></section>
        <section className="rounded-md border border-accent/40 bg-accent/[.08] p-5"><div className="flex items-center gap-2 text-xs font-bold"><TriangleAlert size={15} className="text-accent"/> Execution status</div><p className="mt-3 text-xs leading-5 text-muted-foreground">Real-money trading is disabled. Demo execution is not implemented. Paper trading mode does not place orders.</p></section>
      </div>
    </div>
    <div className="mt-5 flex items-start gap-3 border-t border-border pt-4 text-[10px] leading-5 text-muted-foreground"><Database size={14} className="mt-0.5 shrink-0 text-primary"/> Summary sourced from the authenticated Photon workspace API. Market prices and candles are not included in this summary.</div>
  </>}</AppShell>;
}

function CandleChart({ candles }: {candles: {epoch:number;open:number;high:number;low:number;close:number}[]}) {
  const { min, max } = useMemo(() => {
    const vals = candles.flatMap((c)=>[c.high,c.low]);
    return {min:Math.min(...vals),max:Math.max(...vals)};
  }, [candles]);
  if (!candles.length) return <div className="flex h-[360px] items-center justify-center text-center"><div><div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"><Waves size={18}/></div><p className="mt-3 text-sm font-bold">No candle history received</p><p className="mt-1 text-xs text-muted-foreground">Waiting for the Deriv public feed response.</p></div></div>;
  const range = max-min || 1;
  const width=1000, height=360, plotTop=20, plotHeight=300, step=width/candles.length, bar=Math.max(2,Math.min(8,step*.55));
  const y=(v:number)=>plotTop+(max-v)/range*plotHeight;
  return <div className="w-full overflow-hidden">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Historical candles for ${candles.length} intervals`} className="h-[320px] w-full">
      {[0,.25,.5,.75,1].map((f)=><g key={f}><line x1="0" x2={width} y1={plotTop+f*plotHeight} y2={plotTop+f*plotHeight} stroke="hsl(38 16% 83%)" strokeDasharray="3 6"/><text x={width-3} y={plotTop+f*plotHeight-4} textAnchor="end" fill="hsl(216 10% 48%)" fontSize="10" fontFamily="DM Mono">{(max-f*range).toPrecision(7)}</text></g>)}
      {candles.map((c,i)=>{const x=i*step+step/2, up=c.close>=c.open, color=up?'hsl(167 44% 31%)':'hsl(5 65% 48%)';return <g key={c.epoch}><line x1={x} x2={x} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth="1.4"/><rect x={x-bar/2} y={Math.min(y(c.open),y(c.close))} width={bar} height={Math.max(1,Math.abs(y(c.open)-y(c.close)))} fill={color}/></g>})}
      <line x1="0" x2={width} y1={height-34} y2={height-34} stroke="hsl(38 16% 83%)"/>
      {[candles[0],candles[Math.floor(candles.length/2)],candles[candles.length-1]].filter(Boolean).map((c,i)=><text key={c.epoch} x={i===0?0:i===2?width:width/2} y={height-12} textAnchor={i===0?'start':i===2?'end':'middle'} fill="hsl(216 10% 48%)" fontSize="10" fontFamily="DM Mono">{new Date(c.epoch*1000).toLocaleString([],{month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit'})}</text>)}
    </svg>
  </div>;
}

export function MarketsPage() {
  const [symbol,setSymbol]=useState('R_100');
  const [frame,setFrame]=useState<typeof frames[number]>('M15');
  const settings=useGetSettings();
  const marketDirectory=useDerivSymbols();
  useEffect(()=>{if(settings.data){setSymbol(settings.data.selectedSymbol);setFrame(settings.data.analysisTimeframe);}},[settings.data]);
  useEffect(()=>{if(marketDirectory.status==='live'&&marketDirectory.symbols.length&&!marketDirectory.symbols.some((row)=>row.symbol===symbol)){setSymbol(marketDirectory.symbols[0].symbol);}},[marketDirectory.status,marketDirectory.symbols,symbol]);
  const {candles,status,lastUpdate,retry}=usePublicMarket(symbol,granularity[frame]);
  const [stale,setStale]=useState(false);
  useEffect(()=>{setStale(false);if(lastUpdate===null)return;const timer=setTimeout(()=>setStale(true),30000);return()=>clearTimeout(timer);},[lastUpdate]);
  const latest=candles.at(-1);
  const stateLabel=stale?'STALE':status==='live'?'LIVE':status==='connecting'?'CONNECTING':status==='error'?'ERROR':'DISCONNECTED';
  return <AppShell><SectionHeading eyebrow="Market observatory / 02" title="Synthetic markets" description="Historical OHLC candles from Deriv’s unauthenticated public WebSocket. Feed state and timestamp remain visible; no broker account or token is used." action={<a href="https://developers.deriv.com/docs/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-primary">Deriv API docs <ExternalLink size={13}/></a>}/>
    <section className="overflow-hidden rounded-md border border-border bg-card">
      <div className="flex flex-col gap-4 border-b border-border p-4 md:flex-row md:items-center md:justify-between md:px-5">
        <div className="flex flex-wrap items-center gap-3"><label className="mono text-[9px] uppercase tracking-[.13em] text-muted-foreground" htmlFor="symbol-select">Instrument</label><select id="symbol-select" data-testid="select-market-symbol" value={symbol} onChange={(e)=>setSymbol(e.target.value)} disabled={!marketDirectory.symbols.length} className="rounded-md border border-input bg-background px-3 py-2 text-xs font-bold disabled:opacity-60">{!marketDirectory.symbols.some((row)=>row.symbol===symbol)&&<option value={symbol}>{symbol} · saved selection</option>}{marketDirectory.symbols.map((row)=><option key={row.symbol} value={row.symbol}>{row.name} · {row.symbol}{row.tradingSuspended?' · suspended':''}</option>)}</select><span className="mono text-[9px] text-muted-foreground">{marketDirectory.status==='live'?`${marketDirectory.symbols.length} live symbols`:marketDirectory.status==='error'?'Symbol feed unavailable':'Loading symbol list'}</span></div>
        <div className="flex flex-wrap items-center gap-2">{frames.map(f=><button key={f} data-testid={`button-timeframe-${f}`} onClick={()=>setFrame(f)} className={`rounded-sm border px-3 py-2 mono text-[10px] transition-colors ${frame===f?'border-primary bg-primary text-primary-foreground':'border-border text-muted-foreground hover:bg-muted'}`}>{f}</button>)}</div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/35 px-5 py-3">
        <div className="flex items-center gap-2"><span className={`size-2 rounded-full ${stateLabel==='LIVE'?'bg-primary':stateLabel==='STALE'||stateLabel==='ERROR'?'bg-destructive':'bg-accent'}`}/><span className="mono text-[10px] font-medium">{stateLabel}</span><span className="text-[10px] text-muted-foreground">Deriv public WebSocket</span>{marketDirectory.status==='error'&&<button onClick={marketDirectory.retry} className="text-[10px] font-bold text-primary underline">Retry symbols</button>}</div>
        <div className="flex items-center gap-4"><span className="mono text-[9px] text-muted-foreground">INTERVAL {frameLabel[frame]}</span><button onClick={retry} data-testid="button-reconnect-market" aria-label="Reconnect market data" className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><RefreshCw size={14}/></button></div>
      </div>
      {status==='error' && <div role="alert" className="flex items-center justify-between gap-3 border-b border-destructive/25 bg-destructive/5 px-5 py-3"><span className="text-xs text-destructive">Market feed error. No current quote is available.</span><button onClick={retry} className="text-xs font-bold text-destructive underline">Reconnect</button></div>}
      <div className="px-2 pt-4 sm:px-5"><CandleChart candles={candles}/></div>
      <div className="grid grid-cols-2 border-t border-border sm:grid-cols-4">
        {[['OPEN',latest?.open],['HIGH',latest?.high],['LOW',latest?.low],['CLOSE',latest?.close]].map(([label,value])=><div key={label as string} className="border-b border-r border-border p-4 last:border-r-0 sm:border-b-0"><div className="mono text-[9px] tracking-[.13em] text-muted-foreground">{label}</div><div className="mono mt-2 text-[12px]">{typeof value==='number'?value.toPrecision(8):'—'}</div></div>)}
      </div>
      <div className="flex flex-col gap-2 border-t border-border px-5 py-3 text-[9px] text-muted-foreground sm:flex-row sm:justify-between"><span className="mono">SOURCE · wss://api.derivws.com/trading/v1/options/ws/public</span><span className="mono">{candles.length ? `${candles.length} candles · Updated ${lastUpdate?new Date(lastUpdate).toLocaleTimeString():''}` : 'No data received yet'}</span></div>
    </section>
    <div className="mt-4 flex items-start gap-3 rounded-md border border-accent/40 bg-accent/[.08] p-4"><TriangleAlert size={16} className="mt-0.5 shrink-0 text-accent"/><p className="text-[11px] leading-5 text-muted-foreground">A stale, disconnected, or empty feed is not a price. If no server response arrives, chart and OHLC values remain empty. Historical candles do not constitute a trading recommendation.</p></div>
  </AppShell>;
}

const riskFields: {key:'maxStake'|'dailyLossLimit'|'maxConsecutiveLosses'|'maxOpenPositions'|'maxTradesPerDay'|'cooldownMinutes';label:string;detail:string;min:number;step:number}[]=[
  {key:'maxStake',label:'Maximum stake',detail:'Per-trade stake ceiling. Currency/account rules are not connected.',min:0,step:.01},
  {key:'dailyLossLimit',label:'Daily loss limit',detail:'Personal threshold; not broker-enforced.',min:0,step:.01},
  {key:'maxConsecutiveLosses',label:'Consecutive loss limit',detail:'Maximum losses before a manual review.',min:1,step:1},
  {key:'maxOpenPositions',label:'Open position limit',detail:'Personal cap; execution is not implemented.',min:1,step:1},
  {key:'maxTradesPerDay',label:'Trades per day',detail:'A planning limit only; no trades are tracked here.',min:1,step:1},
  {key:'cooldownMinutes',label:'Cooldown minutes',detail:'Minimum pause between intended trades.',min:0,step:1},
];
type FormState = {selectedSymbol:string;analysisTimeframe:typeof frames[number];operatingMode:'analysis_only'|'paper_trading';maxStake:string;dailyLossLimit:string;maxConsecutiveLosses:string;maxOpenPositions:string;maxTradesPerDay:string;cooldownMinutes:string};
const blankForm:FormState={selectedSymbol:'R_100',analysisTimeframe:'M15',operatingMode:'analysis_only',maxStake:'',dailyLossLimit:'',maxConsecutiveLosses:'',maxOpenPositions:'',maxTradesPerDay:'',cooldownMinutes:''};
function SettingsPanel({error,onSave,form,setForm,saving,saveError,success,retry}: {error:boolean;onSave:(e:FormEvent)=>void;form:FormState;setForm:Dispatch<SetStateAction<FormState>>;saving:boolean;saveError:boolean;success:boolean;retry:()=>void}) {
  const change=<K extends keyof FormState>(key:K,value:FormState[K])=>setForm((old)=>({...old,[key]:value}));
  const marketDirectory=useDerivSymbols();
  if(error)return <QueryFailure retry={retry}/>;
  return <form onSubmit={onSave} className="space-y-5">
    <section className="rounded-md border border-border bg-card">
      <div className="border-b border-border px-5 py-4"><div className="flex items-center gap-2 text-sm font-extrabold"><SlidersHorizontal size={15} className="text-primary"/> Analysis defaults</div><p className="mt-1 text-xs text-muted-foreground">These settings persist to your authenticated workspace profile.</p></div>
      <div className="grid gap-5 p-5 sm:grid-cols-2">
        <label className="block"><span className="mb-2 block text-xs font-bold">Default synthetic symbol</span><select value={form.selectedSymbol} onChange={(e)=>change('selectedSymbol',e.target.value)} data-testid="select-settings-symbol" className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm">{!marketDirectory.symbols.some((row)=>row.symbol===form.selectedSymbol)&&<option value={form.selectedSymbol}>{form.selectedSymbol} · saved selection</option>}{marketDirectory.symbols.map((row)=><option key={row.symbol} value={row.symbol}>{row.name} · {row.symbol}{row.tradingSuspended?' · suspended':''}</option>)}</select><span className="mt-1.5 block text-[10px] text-muted-foreground">{marketDirectory.status==='live'?`Available symbols are fetched from Deriv (${marketDirectory.symbols.length} currently listed).`:'Deriv symbol list is unavailable; your saved selection is retained.'}</span></label>
        <label className="block"><span className="mb-2 block text-xs font-bold">Analysis timeframe</span><select value={form.analysisTimeframe} onChange={(e)=>change('analysisTimeframe',e.target.value as FormState['analysisTimeframe'])} data-testid="select-analysis-timeframe" className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm">{frames.map(f=><option key={f} value={f}>{f} · {frameLabel[f]}</option>)}</select><span className="mt-1.5 block text-[10px] text-muted-foreground">Starting interval for your market study.</span></label>
      </div>
    </section>
    <section className="rounded-md border border-border bg-card">
      <div className="border-b border-border px-5 py-4"><div className="flex items-center gap-2 text-sm font-extrabold"><ShieldCheck size={15} className="text-primary"/> Operating mode</div><p className="mt-1 text-xs text-muted-foreground">Neither selection places an order. Real-money execution is disabled.</p></div>
      <div className="grid gap-3 p-5 md:grid-cols-2">{([{value:'analysis_only',title:'Analysis only',desc:'Market observation and workspace review. No simulated or real execution.'},{value:'paper_trading',title:'Paper trading',desc:'Mode preference only. Demo execution and paper order tracking are not implemented.'}] as const).map(option=><button type="button" key={option.value} onClick={()=>change('operatingMode',option.value)} data-testid={`button-mode-${option.value}`} className={`rounded-md border p-4 text-left transition-colors ${form.operatingMode===option.value?'border-primary bg-primary/[.045]':'border-border hover:bg-muted/50'}`}><span className="flex items-center justify-between"><span className="text-sm font-extrabold">{option.title}</span><span className={`flex size-4 items-center justify-center rounded-full border ${form.operatingMode===option.value?'border-primary bg-primary text-primary-foreground':'border-border'}`}>{form.operatingMode===option.value&&<Check size={10}/>}</span></span><span className="mt-2 block text-[11px] leading-5 text-muted-foreground">{option.desc}</span></button>)}</div>
    </section>
    <section className="rounded-md border border-border bg-card">
      <div className="border-b border-border px-5 py-4"><div className="flex items-center gap-2 text-sm font-extrabold"><LockKeyhole size={15} className="text-primary"/> Personal risk limits</div><p className="mt-1 text-xs text-muted-foreground">Leave blank for no configured preference. Limits are not enforced by a broker.</p></div>
      <div className="grid gap-x-5 gap-y-0 p-5 sm:grid-cols-2">{riskFields.map(field=><label key={field.key} className="border-b border-border py-4 first:pt-0 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0"><span className="text-xs font-bold">{field.label}</span><span className="mt-1 block text-[10px] leading-4 text-muted-foreground">{field.detail}</span><input type="number" min={field.min} step={field.step} value={form[field.key]} onChange={(e)=>change(field.key,e.target.value)} data-testid={`input-${field.key}`} placeholder="Not set" className="mono mt-3 w-full rounded-md border border-input bg-background px-3 py-2.5 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"/></label>)}</div>
    </section>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-h-5 text-xs" role="status">{success&&<span className="inline-flex items-center gap-1.5 text-primary"><Check size={14}/> Preferences saved</span>}{saveError&&<span className="text-destructive">Save failed. Your previous settings remain unchanged.</span>}</div><button type="submit" disabled={saving} data-testid="button-save-settings" className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-xs font-bold text-primary-foreground disabled:opacity-60">{saving?'Saving preferences':<><Check size={14}/> Save preferences</>}</button></div>
  </form>;
}

export function SettingsPage() {
  const client=useQueryClient();
  const settingsQuery=useGetSettings();
  const mutation=useUpdateSettings();
  const [form,setForm]=useState<FormState>(blankForm);
  const [dirty,setDirty]=useState(false);
  const [saved,setSaved]=useState(false);
  useEffect(()=>{if(settingsQuery.data&&!dirty){const s=settingsQuery.data;setForm({selectedSymbol:s.selectedSymbol,analysisTimeframe:s.analysisTimeframe,operatingMode:s.operatingMode,maxStake:s.maxStake==null?'':String(s.maxStake),dailyLossLimit:s.dailyLossLimit==null?'':String(s.dailyLossLimit),maxConsecutiveLosses:s.maxConsecutiveLosses==null?'':String(s.maxConsecutiveLosses),maxOpenPositions:s.maxOpenPositions==null?'':String(s.maxOpenPositions),maxTradesPerDay:s.maxTradesPerDay==null?'':String(s.maxTradesPerDay),cooldownMinutes:s.cooldownMinutes==null?'':String(s.cooldownMinutes)});}},[settingsQuery.data,dirty]);
  const submit=(e:FormEvent)=>{e.preventDefault();setSaved(false);const numeric=(v:string)=>v.trim()===''?null:Number(v);const data:UserSettingsInput={selectedSymbol:form.selectedSymbol,analysisTimeframe:form.analysisTimeframe,operatingMode:form.operatingMode,maxStake:numeric(form.maxStake),dailyLossLimit:numeric(form.dailyLossLimit),maxConsecutiveLosses:numeric(form.maxConsecutiveLosses),maxOpenPositions:numeric(form.maxOpenPositions),maxTradesPerDay:numeric(form.maxTradesPerDay),cooldownMinutes:numeric(form.cooldownMinutes)};if(Object.values(data).some(v=>typeof v==='number'&&(!Number.isFinite(v)||v<0)))return;mutation.mutate({data},{onSuccess:()=>{void client.invalidateQueries({queryKey:getGetSettingsQueryKey()});void client.invalidateQueries({queryKey:getGetDashboardSummaryQueryKey()});setDirty(false);setSaved(true);},onError:()=>setSaved(false)});};
  const setDirtyValue:typeof setForm=(value)=>{setDirty(true);setSaved(false);setForm(value);};
  return <AppShell><SectionHeading eyebrow="Workspace configuration / 04" title="Settings & constraints" description="Choose what the workspace opens with and define your own operating thresholds. Nothing here enables live or demo execution." action={settingsQuery.data?.updatedAt?<div className="mono text-[9px] text-muted-foreground">LAST SAVED · {new Date(settingsQuery.data.updatedAt).toLocaleString()}</div>:undefined}/>{settingsQuery.isLoading?<div className="space-y-4"><LoadingPanel/><LoadingPanel/><LoadingPanel/></div>:<SettingsPanel error={settingsQuery.isError} retry={()=>void settingsQuery.refetch()} onSave={submit} form={form} setForm={setDirtyValue} saving={mutation.isPending} saveError={mutation.isError} success={saved}/>}</AppShell>;
}

const methodItems=[
  {num:'01',title:'Market structure',status:'PROVISIONAL',body:'Swing highs, swing lows, breaks, and shifts are visual concepts for inspection only. Their detection rules have not been independently validated for Deriv Synthetic Indices.'},
  {num:'02',title:'Trend and regime',status:'UNVERIFIED',body:'Trend labels, range classification, and regime transitions are not presented as statistically tested signals. Synthetic markets may not behave like conventional exchange instruments.'},
  {num:'03',title:'Candlestick history',status:'SOURCE-DEPENDENT',body:'OHLC values are requested from Deriv’s public WebSocket. Feed interruptions, delayed responses, or missing history are shown as unavailable rather than interpolated.'},
  {num:'04',title:'Risk limits',status:'USER-DEFINED',body:'Limits are persisted preferences. They are not connected to Deriv account controls, do not block an order, and do not imply any risk-free or guaranteed outcome.'},
];
export function MethodologyPage() {
  return <AppShell><SectionHeading eyebrow="Research notes / 03" title="Methodology & evidence" description="A clear boundary between observed public market data and ideas that remain unverified." action={<div className="inline-flex items-center gap-2 rounded-sm border border-accent/40 bg-accent/10 px-3 py-2 mono text-[9px] font-medium text-foreground"><TriangleAlert size={13} className="text-accent"/> NO VERIFIED SIGNALS</div>}/>
    <section className="mb-5 rounded-md border border-primary/25 bg-primary/[.045] p-5 md:p-6"><div className="flex gap-3"><BookOpen size={18} className="mt-0.5 shrink-0 text-primary"/><div><h2 className="text-sm font-extrabold">Evidence status</h2><p className="mt-2 max-w-3xl text-xs leading-6 text-muted-foreground">Photon is an analysis workspace, not an indicator authority. The structure concepts below are provisional or unverified; they are not validated predictive rules. No performance claims or backtest outcomes are asserted.</p></div></div></section>
    <div className="divide-y divide-border rounded-md border border-border bg-card">{methodItems.map((item)=><article key={item.num} className="grid gap-4 p-5 md:grid-cols-[72px_1fr_150px] md:items-start md:p-6"><div className="mono text-[11px] text-primary">{item.num} / NOTE</div><div><h3 className="text-sm font-extrabold">{item.title}</h3><p className="mt-2 max-w-3xl text-xs leading-6 text-muted-foreground">{item.body}</p></div><div className="mono inline-flex w-fit items-center gap-1.5 rounded-sm bg-muted px-2 py-1.5 text-[9px] tracking-[.08em]"><span className={`size-1.5 rounded-full ${item.status==='SOURCE-DEPENDENT'?'bg-primary':'bg-accent'}`}/>{item.status}</div></article>)}</div>
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <section className="rounded-md border border-border bg-card p-5"><div className="flex items-center gap-2 text-xs font-bold"><Database size={15} className="text-primary"/> Market data provenance</div><p className="mt-3 text-xs leading-5 text-muted-foreground">Public, unauthenticated Deriv WebSocket endpoint. Symbol, timeframe, last update, connection state, and returned candles are displayed in the Markets view.</p><code className="mono mt-3 block break-all rounded bg-muted p-3 text-[10px] text-muted-foreground">wss://api.derivws.com/trading/v1/options/ws/public</code></section>
      <section className="rounded-md border border-border bg-card p-5"><div className="flex items-center gap-2 text-xs font-bold"><LockKeyhole size={15} className="text-primary"/> Execution boundary</div><p className="mt-3 text-xs leading-5 text-muted-foreground">Real-money trading is disabled. There is no broker account, order ticket, demo execution flow, or paper order ledger. Paper trading currently records only a mode preference.</p><div className="mt-3 flex items-center gap-2 mono text-[9px] uppercase text-primary"><Check size={13}/> No order controls in this workspace</div></section>
    </div>
    <div className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-5"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 size={14}/> Claims remain provisional until independently verified.</div><Link href="/markets" className="inline-flex items-center gap-2 text-xs font-bold text-primary">Open market view <ArrowRight size={14}/></Link></div>
  </AppShell>;
}
