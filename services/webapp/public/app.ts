// Keycloak JS adapter is loaded from the Keycloak server at runtime
declare const Keycloak: any;

interface Language {
  code: string;
  name: string;
}

interface TranslateResult {
  translatedText: string;
  detectedSourceLanguage: string;
  targetLanguage: string;
}

interface AppConfig {
  keycloak: {
    url: string;
    realm: string;
    clientId: string;
  };
}

// --- Keycloak ---

let keycloak: any = null;

async function initKeycloak(cfg: AppConfig['keycloak']): Promise<void> {
  if (typeof Keycloak === 'undefined') {
    console.warn('Keycloak JS not loaded — auth disabled');
    loginBtn.hidden = false;
    loginBtn.disabled = true;
    loginBtn.textContent = 'Auth unavailable';
    return;
  }

  keycloak = new Keycloak({
    url: cfg.url,
    realm: cfg.realm,
    clientId: cfg.clientId,
  });

  try {
    const authenticated = await keycloak.init({ onLoad: 'check-sso' });
    updateAuthUI(authenticated);
  } catch (err) {
    console.error('Keycloak init failed:', err);
    loginBtn.hidden = false;
  }
}

function updateAuthUI(authenticated: boolean): void {
  if (authenticated) {
    loginBtn.hidden = true;
    userInfo.hidden = false;
    usernameSpan.textContent = keycloak.tokenParsed?.preferred_username ?? 'User';
  } else {
    loginBtn.hidden = false;
    loginBtn.disabled = false;
    userInfo.hidden = true;
  }
}

function getAuthHeader(): Record<string, string> {
  if (keycloak?.authenticated && keycloak.token) {
    return { Authorization: `Bearer ${keycloak.token}` };
  }
  return {};
}

// --- DOM refs ---

const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;
const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;
const userInfo = document.getElementById('user-info') as HTMLElement;
const usernameSpan = document.getElementById('username') as HTMLElement;
const form = document.getElementById('translate-form') as HTMLFormElement;
const sourceText = document.getElementById('source-text') as HTMLTextAreaElement;
const targetLang = document.getElementById('target-language') as HTMLSelectElement;
const translateBtn = document.getElementById('translate-btn') as HTMLButtonElement;
const resultDiv = document.getElementById('result') as HTMLElement;
const detectedLang = document.getElementById('detected-language') as HTMLElement;
const translatedText = document.getElementById('translated-text') as HTMLElement;
const errorDiv = document.getElementById('error') as HTMLElement;

// --- Events ---

loginBtn.addEventListener('click', () => keycloak?.login());
logoutBtn.addEventListener('click', () => keycloak?.logout());

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  await doTranslate();
});

sourceText.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    doTranslate();
  }
});

// --- API calls ---

async function loadLanguages(): Promise<void> {
  try {
    const res = await fetch('/api/languages');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const languages: Language[] = await res.json();
    targetLang.innerHTML = languages
      .map((l) => `<option value="${l.code}">${l.name}</option>`)
      .join('');
  } catch (err) {
    targetLang.innerHTML = '<option value="">Failed to load</option>';
    console.error('Failed to load languages:', err);
  }
}

async function doTranslate(): Promise<void> {
  const text = sourceText.value.trim();
  if (!text || !targetLang.value) return;

  translateBtn.disabled = true;
  translateBtn.textContent = 'Translating…';
  errorDiv.hidden = true;
  resultDiv.hidden = true;

  // Refresh token if close to expiry
  if (keycloak?.authenticated) {
    try {
      await keycloak.updateToken(30);
    } catch {
      // ignore — will proceed without auth
    }
  }

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ text, targetLanguage: targetLang.value }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }

    const result: TranslateResult = await res.json();
    detectedLang.textContent = `Detected source language: ${result.detectedSourceLanguage}`;
    translatedText.textContent = result.translatedText;
    resultDiv.hidden = false;
  } catch (err) {
    errorDiv.textContent = err instanceof Error ? err.message : 'Translation failed';
    errorDiv.hidden = false;
  } finally {
    translateBtn.disabled = false;
    translateBtn.textContent = 'Translate';
  }
}

// --- Init ---

async function init(): Promise<void> {
  // Fetch Keycloak config from backend
  try {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const cfg: AppConfig = await res.json();

    // Load keycloak-js from the Keycloak server
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${cfg.keycloak.url}/js/keycloak.js`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load keycloak.js'));
      document.head.appendChild(script);
    });

    await initKeycloak(cfg.keycloak);
  } catch (err) {
    console.warn('Keycloak unavailable:', err);
    loginBtn.hidden = false;
    loginBtn.disabled = true;
    loginBtn.textContent = 'Auth unavailable';
  }
}

init();
loadLanguages();
