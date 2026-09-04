(() => {
  'use strict';

  const META = {
    ko: { region: 'KR', native: '한국어', country: '대한민국' },
    en: { region: 'US', native: 'English', country: 'United States' },
    ja: { region: 'JP', native: '日本語', country: '日本' },
    vi: { region: 'VN', native: 'Tiếng Việt', country: 'Việt Nam' },
    id: { region: 'ID', native: 'Bahasa Indonesia', country: 'Indonesia' },
    es: { region: 'ES', native: 'Español', country: 'España' },
    zh: { region: 'CN', native: '中文', country: '中国' },
    fr: { region: 'FR', native: 'Français', country: 'France' },
    de: { region: 'DE', native: 'Deutsch', country: 'Deutschland' },
    ru: { region: 'RU', native: 'Русский', country: 'Россия' }
  };

  const SVG_FLAGS = {
    KR: `<svg viewBox="0 0 72 48" aria-hidden="true"><rect width="72" height="48" fill="#fff"/><g transform="translate(36 24) rotate(-28)"><path d="M-10 0a10 10 0 0 1 20 0 5 5 0 0 1-10 0 5 5 0 0 0-10 0Z" fill="#cd2e3a"/><path d="M10 0a10 10 0 0 1-20 0 5 5 0 0 1 10 0 5 5 0 0 0 10 0Z" fill="#0047a0"/></g><g fill="#111"><rect x="12" y="8" width="12" height="2"/><rect x="12" y="12" width="12" height="2"/><rect x="12" y="16" width="12" height="2"/><rect x="48" y="30" width="12" height="2"/><rect x="48" y="34" width="12" height="2"/><rect x="48" y="38" width="12" height="2"/></g></svg>`,
    CN: `<svg viewBox="0 0 72 48" aria-hidden="true"><rect width="72" height="48" fill="#de2910"/><polygon points="12,7 14,12 20,12 15,15 17,21 12,17 7,21 9,15 4,12 10,12" fill="#ffde00"/></svg>`,
    JP: `<svg viewBox="0 0 72 48" aria-hidden="true"><rect width="72" height="48" fill="#fff"/><circle cx="36" cy="24" r="12" fill="#bc002d"/></svg>`,
    VN: `<svg viewBox="0 0 72 48" aria-hidden="true"><rect width="72" height="48" fill="#da251d"/><polygon points="36,9 39.5,19.5 50.5,19.5 41.5,26 45,36.5 36,30 27,36.5 30.5,26 21.5,19.5 32.5,19.5" fill="#ff0"/></svg>`,
    ES: `<svg viewBox="0 0 72 48" aria-hidden="true"><rect width="72" height="48" fill="#aa151b"/><rect y="12" width="72" height="24" fill="#f1bf00"/></svg>`,
    RU: `<svg viewBox="0 0 72 48" aria-hidden="true"><rect width="72" height="16" fill="#fff"/><rect y="16" width="72" height="16" fill="#0039a6"/><rect y="32" width="72" height="16" fill="#d52b1e"/></svg>`,
    US: `<svg viewBox="0 0 72 48" aria-hidden="true"><rect width="72" height="48" fill="#fff"/><g fill="#b22234"><rect y="0" width="72" height="4"/><rect y="8" width="72" height="4"/><rect y="16" width="72" height="4"/><rect y="24" width="72" height="4"/><rect y="32" width="72" height="4"/><rect y="40" width="72" height="4"/></g><rect width="30" height="26" fill="#3c3b6e"/></svg>`,
    ID: `<svg viewBox="0 0 72 48" aria-hidden="true"><rect width="72" height="24" fill="#ce1126"/><rect y="24" width="72" height="24" fill="#fff"/></svg>`,
    FR: `<svg viewBox="0 0 72 48" aria-hidden="true"><rect width="24" height="48" fill="#0055a4"/><rect x="24" width="24" height="48" fill="#fff"/><rect x="48" width="24" height="48" fill="#ef4135"/></svg>`,
    DE: `<svg viewBox="0 0 72 48" aria-hidden="true"><rect width="72" height="16" fill="#000"/><rect y="16" width="72" height="16" fill="#dd0000"/><rect y="32" width="72" height="16" fill="#ffce00"/></svg>`
  };

  const boolAttr = (el, name, fallback = false) => {
    if (!el.hasAttribute(name)) return fallback;
    const value = String(el.getAttribute(name) ?? '').trim().toLowerCase();
    return !['0', 'false', 'no', 'off'].includes(value);
  };
  const csvAttr = (el, name) => String(el.getAttribute(name) || '')
    .split(',').map(v => v.trim()).filter(Boolean);
  const apiFromScript = () => {
    const script = [...document.scripts].find(s => /\/widget\.js(?:\?|$)/.test(s.src));
    if (!script) return '';
    const u = new URL(script.src);
    const baked = 'https://api-localizehub.suaveforge.com:18025';
    const fallback = baked.startsWith('__') ? 'http://127.0.0.1:18090' : baked;
    return u.searchParams.get('api') || fallback;
  };
  const emojiFlag = (region) => region
    ? [...region.toUpperCase()].map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join('')
    : '';

  class LocalizeSwitcher extends HTMLElement {
    async connectedCallback() {
      if (this._booted) return;
      this._booted = true;
      const project = this.getAttribute('project');
      if (!project) return;

      const api = this.getAttribute('api') || apiFromScript();
      const type = (this.getAttribute('type') || 'dropdown').toLowerCase();
      const size = (this.getAttribute('size') || (type === 'compact' ? 'sm' : 'md')).toLowerCase();
      const flags = boolAttr(this, 'flags', true);
      const flagStyle = (this.getAttribute('flag-style') || 'svg').toLowerCase();
      const flagShape = (this.getAttribute('flag-shape') || 'rounded').toLowerCase();
      const labelMode = (this.getAttribute('label-mode') || 'native').toLowerCase();
      const controlShape = (this.getAttribute('control-shape') || 'rounded').toLowerCase();
      const frame = (this.getAttribute('frame') || 'outline').toLowerCase();
      const queryParam = (this.getAttribute('query-param') || '').trim();
      const navigate = (this.getAttribute('navigate') || (queryParam ? 'reload' : 'none')).toLowerCase();
      const requestedLocales = csvAttr(this, 'locales').map(v => v.toLowerCase());
      const requestedRegions = new Set(csvAttr(this, 'countries').map(v => v.toUpperCase()));

      let queryLocale = '';
      if (queryParam) {
        try { queryLocale = new URL(location.href).searchParams.get(queryParam) || ''; } catch {}
      }
      const storageKey = `localizehub:${project}:locale`;
      const current = this.getAttribute('locale')
        || queryLocale
        || localStorage.getItem(storageKey)
        || '';

      const root = this.shadowRoot || this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>${this.styles()}</style><span class="loading" part="loading">Loading…</span>`;

      try {
        const res = await fetch(`${api.replace(/\/$/,'')}/api/v1/public/projects/${encodeURIComponent(project)}/locales`, {
          headers: { Accept: 'application/json' },
          cache: 'no-store'
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const cfg = await res.json();
        const supported = Array.isArray(cfg.supportedLocales)
          ? cfg.supportedLocales.map(v => String(v).toLowerCase())
          : [];
        let locales = requestedLocales.length
          ? requestedLocales.filter(code => supported.includes(code))
          : supported;
        if (requestedRegions.size) {
          locales = locales.filter(code => requestedRegions.has((META[code]?.region || '').toUpperCase()));
        }
        if (!locales.length) throw new Error('No matching locales');
        const active = locales.includes(String(current).toLowerCase())
          ? String(current).toLowerCase()
          : (locales.includes(String(cfg.defaultLocale).toLowerCase()) ? String(cfg.defaultLocale).toLowerCase() : locales[0]);

        root.innerHTML = `<style>${this.styles()}</style>`;
        const state = { project, locales, active, flags, flagStyle, flagShape, labelMode, size, controlShape, frame, queryParam, navigate };
        if (type === 'flags' || type === 'text') this.renderButtons(root, state, type);
        else this.renderDropdown(root, state);
        this.setAttribute('locale', active);
      } catch (error) {
        root.innerHTML = `<style>${this.styles()}</style><span class="error" part="error">Language selector unavailable</span>`;
        this.dispatchEvent(new CustomEvent('localizeerror', { detail: { project, error: String(error?.message || error) }, bubbles: true, composed: true }));
      }
    }

    styles() {
      return `
        :host{--lh-bg:#fff;--lh-text:#1f2937;--lh-muted:#6b7280;--lh-border:#cbd5e1;--lh-hover:#f8fafc;--lh-active:#eff6ff;--lh-focus:#2563eb;display:inline-block;position:relative;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--lh-text);min-width:var(--lh-switcher-width,148px)}
        *{box-sizing:border-box}
        button{font:inherit;color:inherit}
        .loading,.error{font-size:13px;color:var(--lh-muted)}
        .control{width:100%;display:flex;align-items:center;gap:8px;background:var(--lh-bg);border:1px solid var(--lh-border);cursor:pointer;text-align:left;transition:border-color .15s,box-shadow .15s,background .15s}
        .control[data-frame="soft"]{background:#f8fafc;border-color:transparent}
        .control[data-frame="none"]{border-color:transparent;background:transparent}
        .control[data-shape="pill"]{border-radius:999px}.control[data-shape="square"]{border-radius:0}.control[data-shape="rounded"]{border-radius:10px}
        .control[data-size="sm"]{min-height:34px;padding:6px 10px;font-size:12px}.control[data-size="md"]{min-height:40px;padding:8px 11px;font-size:14px}.control[data-size="lg"]{min-height:46px;padding:10px 13px;font-size:15px}
        .control:hover{background:var(--lh-hover)}.control:focus-visible{outline:2px solid var(--lh-focus);outline-offset:2px}
        .chev{margin-left:auto;font-size:12px;color:var(--lh-muted);transition:transform .15s}.open .chev{transform:rotate(180deg)}
        .flag{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;overflow:hidden;background:#fff;box-shadow:inset 0 0 0 1px rgba(15,23,42,.12)}
        .flag svg{width:100%;height:100%;display:block}.flag.emoji{box-shadow:none;background:transparent;overflow:visible}
        .flag[data-size="sm"]{width:22px;height:15px;font-size:16px}.flag[data-size="md"]{width:26px;height:18px;font-size:19px}.flag[data-size="lg"]{width:31px;height:21px;font-size:23px}
        .flag[data-shape="circle"]{width:22px;height:22px;border-radius:50%}.flag[data-size="md"][data-shape="circle"]{width:26px;height:26px}.flag[data-size="lg"][data-shape="circle"]{width:31px;height:31px}
        .flag[data-shape="rounded"]{border-radius:4px}.flag[data-shape="square"]{border-radius:0}
        .labels{min-width:0;display:flex;flex-direction:column;line-height:1.15}.main{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sub{font-size:10px;color:var(--lh-muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .menu{position:absolute;top:calc(100% + 6px);right:0;left:0;z-index:2147483000;background:var(--lh-bg);border:1px solid var(--lh-border);border-radius:10px;padding:5px;box-shadow:0 14px 35px rgba(15,23,42,.16);display:none;max-height:320px;overflow:auto}
        .open .menu{display:block}
        .option{width:100%;display:flex;align-items:center;gap:9px;border:0;background:transparent;padding:8px 9px;border-radius:7px;cursor:pointer;text-align:left;font-size:13px}
        .option:hover,.option:focus-visible{background:var(--lh-hover);outline:none}.option[aria-selected="true"]{background:var(--lh-active);font-weight:650}
        .check{margin-left:auto;color:var(--lh-focus);font-weight:700}
        .button-list{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
        .choice{display:inline-flex;align-items:center;gap:6px;min-height:34px;padding:6px 9px;border:1px solid var(--lh-border);border-radius:9px;background:var(--lh-bg);cursor:pointer;font-size:12px}
        .choice[aria-pressed="true"]{border-color:var(--lh-focus);background:var(--lh-active)}
      `;
    }

    label(code, mode) {
      const meta = META[code] || { native: code, country: '', region: '' };
      switch (mode) {
        case 'code': return { main: code.toUpperCase(), sub: '' };
        case 'country': return { main: meta.country || code.toUpperCase(), sub: '' };
        case 'native-country': return { main: meta.native || code, sub: meta.country || '' };
        case 'none': return { main: '', sub: '' };
        default: return { main: meta.native || code, sub: '' };
      }
    }

    flagNode(code, state) {
      if (!state.flags || state.flagStyle === 'none') return null;
      const region = META[code]?.region || '';
      if (!region) return null;
      const span = document.createElement('span');
      span.className = `flag ${state.flagStyle === 'emoji' ? 'emoji' : ''}`;
      span.dataset.shape = state.flagShape;
      span.dataset.size = state.size;
      span.setAttribute('aria-hidden', 'true');
      if (state.flagStyle === 'emoji' || !SVG_FLAGS[region]) span.textContent = emojiFlag(region);
      else span.innerHTML = SVG_FLAGS[region];
      return span;
    }

    labelNode(code, state) {
      const label = this.label(code, state.labelMode);
      if (!label.main && !label.sub) return null;
      const wrap = document.createElement('span');
      wrap.className = 'labels';
      if (label.main) {
        const main = document.createElement('span');
        main.className = 'main';
        main.textContent = label.main;
        wrap.append(main);
      }
      if (label.sub) {
        const sub = document.createElement('span');
        sub.className = 'sub';
        sub.textContent = label.sub;
        wrap.append(sub);
      }
      return wrap;
    }

    appendVisual(target, code, state) {
      const flag = this.flagNode(code, state);
      const label = this.labelNode(code, state);
      if (flag) target.append(flag);
      if (label) target.append(label);
      if (!flag && !label) {
        const fallback = document.createElement('span');
        fallback.textContent = code.toUpperCase();
        target.append(fallback);
      }
    }

    renderDropdown(root, state) {
      const wrap = document.createElement('div');
      wrap.className = 'dropdown';
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'control';
      trigger.dataset.size = state.size;
      trigger.dataset.shape = state.controlShape;
      trigger.dataset.frame = state.frame;
      trigger.setAttribute('aria-haspopup', 'listbox');
      trigger.setAttribute('aria-expanded', 'false');
      this.appendVisual(trigger, state.active, state);
      const chev = document.createElement('span');
      chev.className = 'chev';
      chev.textContent = '▾';
      trigger.append(chev);

      const menu = document.createElement('div');
      menu.className = 'menu';
      menu.setAttribute('role', 'listbox');

      state.locales.forEach(code => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'option';
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', String(code === state.active));
        option.dataset.locale = code;
        this.appendVisual(option, code, state);
        if (code === state.active) {
          const check = document.createElement('span');
          check.className = 'check';
          check.textContent = '✓';
          option.append(check);
        }
        option.addEventListener('click', () => this.setLocale(state, code));
        menu.append(option);
      });

      const close = () => {
        wrap.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      };
      trigger.addEventListener('click', event => {
        event.stopPropagation();
        const next = !wrap.classList.contains('open');
        close();
        if (next) {
          wrap.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
      document.addEventListener('click', event => {
        if (!this.contains(event.target) && !root.contains(event.target)) close();
      });
      root.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          close();
          trigger.focus();
        }
      });

      wrap.append(trigger, menu);
      root.append(wrap);
    }

    renderButtons(root, state, type) {
      const wrap = document.createElement('div');
      wrap.className = 'button-list';
      state.locales.forEach(code => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'choice';
        button.setAttribute('aria-pressed', String(code === state.active));
        const buttonState = { ...state, flags: type === 'flags' ? state.flags : false };
        this.appendVisual(button, code, buttonState);
        button.addEventListener('click', () => this.setLocale(state, code));
        wrap.append(button);
      });
      root.append(wrap);
    }

    setLocale(state, locale) {
      localStorage.setItem(`localizehub:${state.project}:locale`, locale);
      this.setAttribute('locale', locale);
      this.dispatchEvent(new CustomEvent('localechange', {
        detail: { project: state.project, locale, region: META[locale]?.region || '' },
        bubbles: true,
        composed: true
      }));
      if (!state.queryParam || state.navigate === 'none') return;
      const url = new URL(location.href);
      url.searchParams.set(state.queryParam, locale);
      if (state.navigate === 'replace') location.replace(url.toString());
      else location.href = url.toString();
    }
  }

  if (!customElements.get('localize-switcher')) {
    customElements.define('localize-switcher', LocalizeSwitcher);
  }
})();
