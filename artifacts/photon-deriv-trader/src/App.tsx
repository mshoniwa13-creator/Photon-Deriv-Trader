import { type ReactNode, useEffect, useRef } from 'react';
import { ClerkProvider, Show, SignIn, SignUp, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { DashboardPage, HomePage, MarketsPage, MethodologyPage, SettingsPage } from '@/pages/pages';
import { Redirect, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#286d5d',
    colorForeground: '#24333a',
    colorMutedForeground: '#68746f',
    colorDanger: '#bd443c',
    colorBackground: '#fbfaf6',
    colorInput: '#fbfaf6',
    colorInputForeground: '#24333a',
    colorNeutral: '#24333a',
    fontFamily: 'Manrope, sans-serif',
    borderRadius: '0.65rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#fbfaf6] rounded-xl w-[440px] max-w-full overflow-hidden border border-[#d8d4ca]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#24333a] font-extrabold tracking-tight',
    headerSubtitle: 'text-[#68746f]',
    socialButtonsBlockButtonText: 'text-[#24333a] font-semibold',
    formFieldLabel: 'text-[#34434a] font-semibold',
    footerActionLink: 'text-[#286d5d] font-bold',
    footerActionText: 'text-[#68746f]',
    dividerText: 'text-[#68746f]',
    identityPreviewEditButton: 'text-[#286d5d]',
    formFieldSuccessText: 'text-[#286d5d]',
    alertText: 'text-[#24333a]',
    logoBox: 'mb-3',
    logoImage: 'max-h-9',
    socialButtonsBlockButton: 'border border-[#d8d4ca] bg-[#fbfaf6] hover:bg-[#f1efe8]',
    formButtonPrimary: 'bg-[#286d5d] text-white hover:bg-[#20584c]',
    formFieldInput: 'border-[#d8d4ca] bg-[#fbfaf6] text-[#24333a]',
    footerAction: 'text-[#68746f]',
    dividerLine: 'bg-[#d8d4ca]',
    alert: 'border-[#bd443c]/30 bg-[#bd443c]/5',
    otpCodeFieldInput: 'border-[#d8d4ca] bg-[#fbfaf6] text-[#24333a]',
    formFieldRow: 'mb-4',
    main: 'text-[#24333a]',
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) client.clear();
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, client]);
  return null;
}

function HomeRedirect() {
  return <><Show when="signed-in"><Redirect to="/dashboard"/></Show><Show when="signed-out"><HomePage/></Show></>;
}

function Protected({ children }: { children: ReactNode }) {
  return <><Show when="signed-in">{children}</Show><Show when="signed-out"><Redirect to="/"/></Show></>;
}

function SignInPage() {
  return <div className="panel-grid flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10"><div className="w-full max-w-[440px]"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`}/></div></div>;
}
function SignUpPage() {
  return <div className="panel-grid flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10"><div className="w-full max-w-[440px]"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`}/></div></div>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function ClerkRoutes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={clerkAppearance}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    localization={{
      signIn: { start: { title: 'Welcome back', subtitle: 'Return to your analysis workspace.' } },
      signUp: { start: { title: 'Create your workspace', subtitle: 'Start studying synthetic markets with clear constraints.' } },
    }}
    routerPush={(to) => setLocation(stripBase(to))}
    routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
  >
    <ClerkQueryClientCacheInvalidator/>
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={HomeRedirect}/>
        <Route path="/sign-in/*?" component={SignInPage}/>
        <Route path="/sign-up/*?" component={SignUpPage}/>
        <Route path="/dashboard"><Protected><DashboardPage/></Protected></Route>
        <Route path="/markets"><Protected><MarketsPage/></Protected></Route>
        <Route path="/methodology" component={MethodologyPage}/>
        <Route path="/settings"><Protected><SettingsPage/></Protected></Route>
        <Route component={NotFound}/>
      </Switch>
    </RoutedErrorBoundary>
  </ClerkProvider>;
}

function App() {
  return <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkRoutes/>
      </WouterRouter>
      <Toaster/>
    </TooltipProvider>
  </QueryClientProvider>;
}

export default App;
