<script>
/* Make the PRODUCTS / SECTORS folder titles clickable on desktop.

   Replaces the earlier version, which matched on label text:

       if (el.textContent.trim() === 'PRODUCTS') { ... }

   That broke as soon as the navigation labels were renamed to "Products" and
   "Sectors" — the comparison stopped matching, so the handler never attached.

   This keys off aria-controls instead, which Squarespace derives from the folder
   and does not change when you rename the label.

   Note: the button's own data-href is NOT used — it points at the folder's first
   child (/product -> /reports, /sector -> /developers), not the landing page. */
document.addEventListener('DOMContentLoaded', function () {
  var TARGETS = {
    products: 'https://landuselabs.com/products',
    sectors:  'https://landuselabs.com/sectors'
  };

  var isDesktop = function () {
    return window.matchMedia('(min-width: 768px)').matches;
  };

  document.querySelectorAll('.header-nav-folder-title').forEach(function (el) {
    var url = TARGETS[el.getAttribute('aria-controls')];
    if (!url) return;                       // other folders keep default behaviour

    el.style.cursor = 'pointer';
    el.addEventListener('click', function (e) {
      if (!isDesktop()) return;             // mobile: let the folder toggle open
      e.preventDefault();
      e.stopPropagation();
      window.location.href = url;
    });
  });
});
</script>
