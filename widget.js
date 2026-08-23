(() => {
  const REGION = { ko:'KR', en:'US', ja:'JP', vi:'VN', id:'ID', es:'ES', zh:'CN', fr:'FR', de:'DE' };
  const flag = (region) => region ? [...region.toUpperCase()].map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join('') : '';
  const apiFromScript = () => {
    const script = [...document.scripts].find(s => /\/widget\.js(?:\?|$)/.test(s.src));
    if (!script) return '';
    const u = new URL(script.src);
    const baked='https://api-localizehub.suaveforge.com:18025';
    const fallback=baked.startsWith('__') ? 'http://127.0.0.1:18090' : baked;
    return u.searchParams.get('api') || fallback;
  };

  class LocalizeSwitcher extends HTMLElement {
    async connectedCallback() {
      const project = this.getAttribute('project');
      if (!project) return;
      const type = this.getAttribute('type') || 'dropdown';
      const api = this.getAttribute('api') || apiFromScript();
      const current = this.getAttribute('locale') || localStorage.getItem(`localizehub:${project}:locale`) || '';
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = '<span>Loading…</span>';
      try {
        const res = await fetch(`${api.replace(/\/$/,'')}/api/v1/public/projects/${encodeURIComponent(project)}/locales`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const cfg = await res.json();
        const locales = cfg.supportedLocales || [];
        const active = locales.includes(current) ? current : cfg.defaultLocale;
        const display = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames([active || 'en'], { type:'language' }) : null;
        const css = document.createElement('link');
        css.rel = 'stylesheet'; css.href = 'https://cdn.jsdelivr.net/npm/@tabler/core@1.0.0/dist/css/tabler.min.css';
        root.innerHTML = '';
        root.append(css);

        if (type === 'flags' || type === 'text') {
          const wrap = document.createElement('div'); wrap.className = 'btn-list';
          locales.forEach(code => {
            const b = document.createElement('button');
            b.type = 'button'; b.className = code === active ? 'btn btn-primary btn-sm' : 'btn btn-outline-secondary btn-sm';
            const label = display ? display.of(code) : code;
            b.textContent = type === 'flags' ? `${flag(REGION[code])} ${label}` : label;
            b.addEventListener('click', () => this.setLocale(project, code));
            wrap.append(b);
          });
          root.append(wrap);
        } else {
          const select = document.createElement('select'); select.className = type === 'compact' ? 'form-select form-select-sm' : 'form-select';
          locales.forEach(code => {
            const opt = document.createElement('option'); opt.value = code; opt.selected = code === active;
            const label = display ? display.of(code) : code;
            opt.textContent = `${flag(REGION[code])} ${label}`;
            select.append(opt);
          });
          select.addEventListener('change', () => this.setLocale(project, select.value));
          root.append(select);
        }
      } catch (e) {
        root.innerHTML = '<span part="error">Language selector unavailable</span>';
      }
    }
    setLocale(project, locale) {
      localStorage.setItem(`localizehub:${project}:locale`, locale);
      this.setAttribute('locale', locale);
      this.dispatchEvent(new CustomEvent('localechange', { detail: { project, locale }, bubbles: true, composed: true }));
    }
  }
  if (!customElements.get('localize-switcher')) customElements.define('localize-switcher', LocalizeSwitcher);
})();
