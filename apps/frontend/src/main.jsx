import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './styles/theme.css';
import './styles/pages.css';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function ClerkApp() {
  const mono = "'Roboto Mono', monospace";
  const v = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const bg = v('--bg') || '#323437';
  const bg2 = v('--bg-2') || '#2c2e31';
  const fg = v('--fg') || '#d1d0c5';
  const main = v('--main') || '#e2b714';
  const sub = v('--sub') || '#646669';
  const border = v('--border') || '#3a3c40';

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      appearance={{
        variables: {
          colorPrimary: main,
          colorBackground: bg2,
          colorInputBackground: bg,
          colorInputText: fg,
          colorText: fg,
          colorTextSecondary: sub,
          fontFamily: mono,
          borderRadius: '6px',
          fontSize: '13px',
        },
        elements: {
          card: { backgroundColor: bg2, border: `1px solid ${border}`, borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
          headerTitle: { color: fg, fontFamily: mono },
          headerSubtitle: { color: sub, fontFamily: mono },
          formButtonPrimary: { backgroundColor: main, color: bg2, fontFamily: mono, fontWeight: '500', fontSize: '12px', textTransform: 'lowercase' },
          formFieldInput: { backgroundColor: bg, border: `1px solid ${border}`, color: fg, fontFamily: mono, fontSize: '13px' },
          formFieldInput__focused: { borderColor: main, boxShadow: `0 0 0 1px ${main}` },
          formFieldLabel: { color: sub, fontFamily: mono, fontSize: '11px', textTransform: 'lowercase' },
          footerActionLink: { color: main, fontFamily: mono },
          footerActionText: { color: sub, fontFamily: mono },
          socialButtonsBlockButton: { backgroundColor: bg, border: `1px solid ${border}`, color: fg, fontFamily: mono, fontSize: '12px' },
          dividerLine: { backgroundColor: border },
          dividerText: { color: sub, fontFamily: mono },
          identityPreview: { backgroundColor: bg, border: `1px solid ${border}` },
          identityPreviewText: { color: fg, fontFamily: mono },
          formResendCodeLink: { color: main },
          otpCodeFieldInput: { backgroundColor: bg, border: `1px solid ${border}`, color: fg },
        },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkApp />
  </React.StrictMode>
);
