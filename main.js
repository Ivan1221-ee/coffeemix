const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
const menu = document.getElementById('site-menu');
const mobile = matchMedia('(max-width: 850px)');

function setMenu(open, restoreFocus = false) {
  menu.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.textContent = open ? 'Закрыть' : 'Меню';
  if (restoreFocus) toggle.focus();
}
toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
menu.addEventListener('click', event => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false, true);
});
document.addEventListener('pointerdown', event => {
  if (!header.contains(event.target) && menu.classList.contains('is-open')) setMenu(false);
});
mobile.addEventListener('change', () => setMenu(false));

function updateHeader() {
  header.classList.toggle('is-scrolled', scrollY > 4);
}
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

for (const button of document.querySelectorAll('.feature-toggle')) {
  button.addEventListener('click', () => {
    button.setAttribute('aria-expanded', String(button.getAttribute('aria-expanded') === 'false'));
  });
}

if ('IntersectionObserver' in window && matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  const revealText = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('text-revealed');
      revealText.unobserve(entry.target);
    }
  }, { threshold: 0.15 });

  for (const text of document.querySelectorAll('main > section:not(.hero) :is(h2, h3, p):not(.feature-description), .kit-list li')) {
    revealText.observe(text);
  }
}

function bindDialog(dialog, links, prepare = () => {}) {
  let opener;
  for (const link of links) {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      event.preventDefault();
      opener = link;
      prepare();
      dialog.showModal();
    });
  }
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const { top, right, bottom, left } = dialog.getBoundingClientRect();
      if (event.clientX < left || event.clientX > right ||
          event.clientY < top || event.clientY > bottom) dialog.close();
    }
  });
  dialog.addEventListener('close', () => {
    if (opener?.getClientRects().length) opener.focus({ preventScroll: true });
    else if (mobile.matches) toggle.focus({ preventScroll: true });
  });
}

const orderDialog = document.getElementById('order-dialog');
if (orderDialog) {
  const form = orderDialog.querySelector('.order-form');
  const { name, phone, comment, summary } = form.elements;
  const result = form.querySelector('.order-result');
  const status = result.querySelector('[role=status]');

  bindDialog(orderDialog, document.querySelectorAll('[data-order]'), () => {
    form.reset();
    phone.setCustomValidity('');
    result.hidden = true;
    status.textContent = '';
  });
  form.addEventListener('input', () => { result.hidden = true; });
  phone.addEventListener('input', () => {
    const digits = phone.value.replace(/\D/g, '').replace(/^[78]/, '').slice(0, 10);
    phone.value = digits ? '+7 (' + digits.slice(0, 3)
      + (digits.length > 3 ? ') ' + digits.slice(3, 6) : '')
      + (digits.length > 6 ? '-' + digits.slice(6, 8) : '')
      + (digits.length > 8 ? '-' + digits.slice(8) : '') : '';
    phone.setCustomValidity('');
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (phone.value.replace(/\D/g, '').length !== 11) {
      phone.setCustomValidity('Введите номер телефона полностью.');
      phone.reportValidity();
      return;
    }
    summary.value = [
      'Заказ кофемашины Eletta perfetto',
      'Имя: ' + name.value.trim(),
      'Телефон: ' + phone.value,
      comment.value.trim()
    ].filter(Boolean).join('\n');
    result.hidden = false;
    status.textContent = 'Заявка подготовлена. Позвоните, чтобы уточнить условия заказа.';
    summary.focus();
  });
  result.querySelector('[data-copy]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(summary.value);
      status.textContent = 'Заявка скопирована.';
    } catch {
      summary.select();
      status.textContent = 'Текст выделен. Скопируйте его с помощью клавиатуры.';
    }
  });

  const detailsDialog = document.getElementById('details-dialog');
  bindDialog(detailsDialog, document.querySelectorAll('[data-details]'));
  detailsDialog.querySelector('a').addEventListener('click', () => detailsDialog.close());
}
