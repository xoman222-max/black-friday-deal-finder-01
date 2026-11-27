// HTML for each page of DealDrop, built from the deal data. Every value is
// escaped before it goes into the page, so a deal's text can never break
// the markup. Prices are computed from the two numbers each deal carries,
// so a card can never show a discount its prices do not add up to.

const escape = (s) =>
  String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const usd = (n) =>
  `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

export const percentOff = (d) => Math.round((1 - d.price / d.was) * 100);

export const saved = (d) => Math.round((d.was - d.price) * 100) / 100;

const checkedOn = (iso) =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  }) + ' UTC';

export const VERDICTS = {
  'new-low': { label: 'NEW LOW', hint: 'Lowest price tracked' },
  strong: { label: 'STRONG DEAL', hint: 'Big genuine cut' },
  routine: { label: 'ROUTINE SALE', hint: 'Real discount, seen before' },
};

const verdictBadge = (d) =>
  `<span class="verdict verdict-${d.verdict}" title="${escape(VERDICTS[d.verdict].hint)}">${VERDICTS[d.verdict].label}</span>`;

const storeLink = (d) =>
  d.link === 'store'
    ? `<a class="go" href="${escape(d.url)}" target="_blank" rel="noopener">View at ${escape(d.store)} ↗</a>`
    : `<a class="go go-source" href="${escape(d.url)}" target="_blank" rel="noopener">See it via ${escape(d.source)} ↗</a>`;

export function card(d) {
  return `<article class="card">
  <div class="card-top"><span class="cat">${escape(d.category)}</span>${verdictBadge(d)}</div>
  <h3><a href="#/deal/${encodeURIComponent(d.id)}">${escape(d.title)}</a></h3>
  <p class="store">${escape(d.store)}</p>
  <p class="price"><strong>${usd(d.price)}</strong> <s>${usd(d.was)}</s> <em>${percentOff(d)}% off · save ${usd(saved(d))}</em></p>
  <p class="note">${escape(d.note)}</p>
  <p class="meta">Checked ${checkedOn(d.checked)} · ${escape(d.source)}</p>
  ${d.condition ? `<p class="cond">${escape(d.condition)}</p>` : ''}
  <p class="actions">${storeLink(d)} <a class="details" href="#/deal/${encodeURIComponent(d.id)}">Details</a></p>
</article>`;
}

export function listPage(deals, stats) {
  return `<section class="hero">
  <p class="kicker">BLACK FRIDAY · NOV 27–30, 2026</p>
  <h1>Real deals, checked today.</h1>
  <p class="lede">Every price below was read live on Black Friday, November 27, 2026 — at the store or in a deals source that names the store. Each deal carries its check time and its evidence, and an honest verdict on whether it is really a deal.</p>
  <ul class="stats">
    <li><strong>${stats.count}</strong> verified deals</li>
    <li><strong>${stats.newLows}</strong> new lows</li>
    <li><strong>${usd(stats.totalSaved)}</strong> total savings</li>
    <li><strong>${stats.medianOff}%</strong> median discount</li>
  </ul>
</section>
<section class="filters" aria-label="Search and filter deals">
  <label class="search">Search <input id="q" type="search" placeholder="Product, store or category…" autocomplete="off"></label>
  <label>Category <select id="cat"></select></label>
  <label>Store <select id="store"></select></label>
  <label>Discount <select id="minoff">
    <option value="0">Any discount</option>
    <option value="20">20% off or more</option>
    <option value="30">30% off or more</option>
    <option value="40">40% off or more</option>
    <option value="50">50% off or more</option>
  </select></label>
  <label>Sort <select id="sort">
    <option value="discount">Biggest discount first</option>
    <option value="saved">Biggest saving first</option>
    <option value="price">Lowest price first</option>
    <option value="newlow">New lows first</option>
  </select></label>
  <label class="check"><input id="lows" type="checkbox"> New lows only</label>
</section>
<p class="count" id="count" role="status"></p>
<div class="grid" id="grid"></div>
<section class="how">
  <h2>How to read a verdict</h2>
  <dl>
    <dt><span class="verdict verdict-new-low">NEW LOW</span></dt><dd>The lowest price the named source has ever tracked for that product.</dd>
    <dt><span class="verdict verdict-strong">STRONG DEAL</span></dt><dd>A big, genuine cut off a stable usual price — worth buying now.</dd>
    <dt><span class="verdict verdict-routine">ROUTINE SALE</span></dt><dd>A real discount, but modest, or the same price has appeared before.</dd>
  </dl>
  <p>Prices change fast on Black Friday. The check time on each deal says when its price was last read; the link takes you to the store (or, where the store page could not be opened directly, to the deals page that names the store and price) so you can confirm it before you buy.</p>
</section>`;
}

export function detailPage(d, similar) {
  return `<p class="back"><a href="#/">&larr; All deals</a></p>
<article class="detail">
  <div class="card-top"><span class="cat">${escape(d.category)}</span>${verdictBadge(d)}</div>
  <h1>${escape(d.title)}</h1>
  <p class="store">${escape(d.store)}</p>
  <p class="big-price"><strong>${usd(d.price)}</strong> <s>${usd(d.was)}</s></p>
  <p class="big-off">${percentOff(d)}% off — you save ${usd(saved(d))}</p>
  <dl class="facts">
    <dt>Is it really a deal?</dt><dd><strong>${VERDICTS[d.verdict].label}</strong> — ${escape(d.note)}</dd>
    <dt>Checked</dt><dd>${checkedOn(d.checked)} (Nov 27, 2026)</dd>
    <dt>Read in</dt><dd>${escape(d.source)}</dd>
    ${d.condition ? `<dt>Good to know</dt><dd>${escape(d.condition)}</dd>` : ''}
    <dt>Usual price</dt><dd>${usd(d.was)} — the price the store or source lists as usual; the ${percentOff(d)}% discount is computed from these two prices.</dd>
  </dl>
  <p class="actions">${storeLink(d)}</p>
</article>
${similar.length ? `<section class="similar"><h2>More ${escape(d.category)} deals</h2><div class="grid">${similar.map(card).join('')}</div></section>` : ''}`;
}

export function missingPage() {
  return `<h1>Not found</h1><p>There is no deal at this address. <a href="#/">See all deals</a>.</p>`;
}

export function emptyGrid() {
  return `<li class="empty">No deal matches. Try a different search or clear a filter.</li>`;
}
