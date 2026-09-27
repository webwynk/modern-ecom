document.querySelectorAll('[data-product-tabs]').forEach(function (root) {
  if (root.dataset.tabsInitialized) return;
  root.dataset.tabsInitialized = 'true';

  const triggers = Array.from(root.querySelectorAll('[data-tab-trigger]'));
  const panels = Array.from(root.querySelectorAll('[data-tab-panel]'));

  function activate(name, focusTrigger) {
    triggers.forEach(function (trigger) {
      const isActive = trigger.dataset.tabTrigger === name;
      trigger.setAttribute('aria-selected', isActive ? 'true' : 'false');
      trigger.tabIndex = isActive ? 0 : -1;
      if (isActive && focusTrigger) trigger.focus();
    });

    panels.forEach(function (panel) {
      const isActive = panel.dataset.tabPanel === name;
      panel.toggleAttribute('hidden', !isActive);
    });
  }

  triggers.forEach(function (trigger, index) {
    trigger.addEventListener('click', function () {
      activate(trigger.dataset.tabTrigger, false);
    });

    trigger.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const nextIndex =
        event.key === 'ArrowRight'
          ? (index + 1) % triggers.length
          : (index - 1 + triggers.length) % triggers.length;
      activate(triggers[nextIndex].dataset.tabTrigger, true);
    });
  });
});
