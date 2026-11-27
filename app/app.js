// DealDrop's behaviour: hash routes, search and filters, sorting, and
// rendering. The deals are in deals.js, the markup in views.js; this file
// only wires them together. Nothing here fetches anything: the site works
// with no network request.
//
//   #/                 the deal list, with search and filters
//   #/deal/<id>        one deal, with its verdict and evidence
//   #/cat/<category>   the list, pre-filtered to one category
//
// window.__shotReady is false while a page renders and true once it is on
// screen, so a screenshot script knows when to capture.

import { deals, CHECKED_DAY } from './deals.js';
import { card, listPage, detailPage, missingPage, emptyGrid, percentOff, saved, usd } from './views.js';

const app = document.getElementById('app');
const year = document.getElementById('year');

const CATEGORIES = [...new Set(deals.map((d) => d.category))].sort();
const STORES = [...new Set(deals.map((d) => d.store))].sort();

const state = { q: '', cat: 'All', store: 'All', minoff: 0, sort: 'discount', lows: false };

function stats() {
  const offs = deals.map(percentOff).sort((a, b) => a - b);
  return {
    count: deals.length,
    newLows: deals.filter((d) => d.verdict === 'new-low').length,
    totalSaved: Math.round(deals.reduce((s, d) => s + saved(d), 0)),
    medianOff: offs[Math.floor(offs.length / 2)],
  };
}

function filtered() {
  const q = state.q.trim().toLowerCase();
  let out = deals.filter((d) => {
    if (state.cat !== 'All' && d.category !== state.cat) return false;
    if (state.store !== 'All' && d.store !== state.store) return false;
    if (percentOff(d) < state.minoff) return false;
    if (state.lows && d.verdict !== 'new-low') return false;
    if (q && !`${d.title} ${d.store} ${d.category}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const by = {
    discount: (a, b) => percentOff(b) - percentOff(a) || saved(b) - saved(a),
    saved: (a, b) => saved(b) - saved(a),
    price: (a, b) => a.price - b.price,
    newlow: (a, b) => (a.verdict === 'new-low' ? 0 : 1) - (b.verdict === 'new-low' ? 0 : 1) || percentOff(b) - percentOff(a),
  };
  return out.sort(by[state.sort] ?? by.discount);
}

function fillOptions(select, values) {
  select.innerHTML = ['All', ...values]
    .map((v) => `<option value="${v}"${v === 'All' ? ' selected' : ''}>${v === 'All' ? 'All' : v}</option>`)
    .join('');
}

function paintGrid() {
  const grid = document.getElementById('grid');
  const count = document.getElementById('count');
  const shown = filtered();
  grid.innerHTML = shown.length ? shown.map(card).join('') : emptyGrid();
  const parts = [`${shown.length} of ${deals.length} deals`];
  if (state.cat !== 'All') parts.push(state.cat);
  if (state.store !== 'All') parts.push(state.store);
  if (state.minoff) parts.push(`${state.minoff}% off or more`);
  if (state.lows) parts.push('new lows only');
  count.textContent = parts.join(' · ');
}

function renderList() {
  document.title = 'DealDrop — Real Black Friday deals, checked today';
  app.innerHTML = listPage(deals, stats());
  const q = document.getElementById('q');
  const cat = document.getElementById('cat');
  const store = document.getElementById('store');
  const minoff = document.getElementById('minoff');
  const sort = document.getElementById('sort');
  const lows = document.getElementById('lows');
  fillOptions(cat, CATEGORIES);
  fillOptions(store, STORES);
  q.value = state.q;
  cat.value = state.cat;
  store.value = state.store;
  minoff.value = String(state.minoff);
  sort.value = state.sort;
  lows.checked = state.lows;
  q.addEventListener('input', () => { state.q = q.value; paintGrid(); });
  cat.addEventListener('change', () => { state.cat = cat.value; paintGrid(); });
  store.addEventListener('change', () => { state.store = store.value; paintGrid(); });
  minoff.addEventListener('change', () => { state.minoff = Number(minoff.value); paintGrid(); });
  sort.addEventListener('change', () => { state.sort = sort.value; paintGrid(); });
  lows.addEventListener('change', () => { state.lows = lows.checked; paintGrid(); });
  paintGrid();
}

function render() {
  window.__shotReady = false;
  const hash = location.hash || '#/';
  const dealMatch = hash.match(/^#\/deal\/([^/?]+)/);
  const catMatch = hash.match(/^#\/cat\/([^/?]+)/);
  if (dealMatch) {
    const found = deals.find((d) => d.id === decodeURIComponent(dealMatch[1]));
    if (found) {
      document.title = `${found.title} — ${usd(found.price)} at ${found.store} | DealDrop`;
      const similar = deals.filter((d) => d.category === found.category && d.id !== found.id).slice(0, 3);
      app.innerHTML = detailPage(found, similar);
    } else {
      document.title = 'Not found | DealDrop';
      app.innerHTML = missingPage();
    }
  } else {
    if (catMatch) {
      const wanted = decodeURIComponent(catMatch[1]);
      state.cat = CATEGORIES.includes(wanted) ? wanted : 'All';
    }
    renderList();
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

if (year) year.textContent = CHECKED_DAY;
window.addEventListener('hashchange', render);
render();
