(() => {
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  const params = new URLSearchParams(window.location.search);
  const company = params.get('entreprise');
  const companySelect = document.querySelector('#company');
  if (companySelect && ['hugo', 'matheo'].includes(company)) companySelect.value = company;
})();
