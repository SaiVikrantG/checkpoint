export function getClerkAppearance() {
  const s = getComputedStyle(document.documentElement);
  const v = (name) => s.getPropertyValue(name).trim();

  const bg = v('--bg');
  const bg2 = v('--bg-2');
  const bg3 = v('--bg-3');
  const fg = v('--fg');
  const sub = v('--sub');
  const main = v('--main');
  const border = v('--border');
  const font = v('--font-mono');

  return {
    variables: {
      colorPrimary: main,
      colorText: fg,
      colorTextSecondary: sub,
      colorBackground: bg2,
      colorInputBackground: bg3,
      colorInputText: fg,
      colorNeutral: fg,
      fontFamily: font,
      borderRadius: '6px',
    },
    elements: {
      card: {
        background: bg2,
        border: `1px solid ${border}`,
        boxShadow: 'none',
      },
      rootBox: {
        width: '100%',
        maxWidth: '420px',
      },
      headerTitle: { color: fg },
      headerSubtitle: { color: sub },
      socialButtonsBlockButton: {
        background: bg3,
        border: `1px solid ${border}`,
        color: fg,
      },
      socialButtonsBlockButtonText: { color: fg },
      formFieldLabel: { color: sub },
      formFieldInput: {
        background: bg3,
        border: `1px solid ${border}`,
        color: fg,
      },
      formButtonPrimary: {
        background: main,
        color: bg,
        fontWeight: 600,
      },
      footerActionLink: { color: main },
      dividerLine: { background: border },
      dividerText: { color: sub },
      formFieldInputShowPasswordButton: { color: sub },
      identityPreview: { background: bg3, border: `1px solid ${border}` },
      identityPreviewText: { color: fg },
      identityPreviewEditButton: { color: main },
      alert: { background: bg3, border: `1px solid ${border}` },
      alertText: { color: fg },
      formResendCodeLink: { color: main },
      otpCodeFieldInput: {
        background: bg3,
        border: `1px solid ${border}`,
        color: fg,
      },
      footer: { background: 'transparent' },
      footerActionText: { color: sub },
    },
  };
}
