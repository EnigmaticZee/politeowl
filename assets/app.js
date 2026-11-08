// Polite Owl — app shelf filters. Without JS every app is simply listed.
(function () {
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  var grid = document.getElementById('grid');
  if (!grid) return;
  var filters = document.querySelector('.filters');
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.card[data-price]'));
  var soon = grid.querySelector('[data-soon]');
  var count = document.getElementById('count');
  var empty = document.getElementById('empty');
  var reset = document.getElementById('reset');
  var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var state = { price: 'all', cat: 'all' };

  var params = new URLSearchParams(location.search);
  ['price', 'cat'].forEach(function (k) {
    var v = params.get(k);
    if (v && document.querySelector('[data-filter="' + k + '"][data-value="' + v + '"]')) state[k] = v;
  });

  function render(push) {
    var shown = 0;
    cards.forEach(function (c) {
      var ok = (state.price === 'all' || c.dataset.price === state.price) &&
               (state.cat === 'all' || c.dataset.cat === state.cat);
      c.hidden = !ok;
      if (ok) shown++;
    });
    var unfiltered = state.price === 'all' && state.cat === 'all';
    if (soon) soon.hidden = !unfiltered;
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(state[b.dataset.filter] === b.dataset.value));
    });
    count.textContent = shown + (shown === 1 ? ' app' : ' apps') + (unfiltered ? '' : ' shown');
    empty.hidden = shown !== 0;
    if (push) {
      var q = new URLSearchParams();
      if (state.price !== 'all') q.set('price', state.price);
      if (state.cat !== 'all') q.set('cat', state.cat);
      var qs = q.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + '#apps');
    }
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      state[b.dataset.filter] = b.dataset.value;
      render(true);
    });
  });
  reset.addEventListener('click', function () {
    state.price = 'all'; state.cat = 'all';
    render(true);
  });

  filters.hidden = false;
  render(false);
})();
