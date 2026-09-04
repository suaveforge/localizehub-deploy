(() => {
  const HOME_PATH = '/';

  function projectNavButton(target) {
    const button = target?.closest?.('button.nav-link');
    if (!button) return null;
    const title = button.querySelector('.nav-link-title')?.textContent?.trim();
    return title === '프로젝트' ? button : null;
  }

  function brand(target) {
    return target?.closest?.('.navbar-brand') || null;
  }

  function goHome() {
    const url = new URL(HOME_PATH, window.location.origin);
    window.location.assign(url.href);
  }

  document.addEventListener('click', (event) => {
    if (!brand(event.target) && !projectNavButton(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    goHome();
  }, true);

  document.addEventListener('keydown', (event) => {
    const home = brand(event.target);
    if (!home || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    goHome();
  }, true);

  function armBrand(root = document) {
    root.querySelectorAll?.('.navbar-brand').forEach((el) => {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', 'LocalizeHub 홈');
    });
  }

  armBrand();
  const observer = new MutationObserver(() => armBrand());
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
