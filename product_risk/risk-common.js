/* ══════════════ Common helpers for risk-* pages ══════════════ */

function toggleNav(el) {
  el.classList.toggle('open');
  var list = el.nextElementSibling;
  list.style.display = el.classList.contains('open') ? 'block' : 'none';
}

/* ── Multi-select dropdown ── */
function toggleMs(btn, event) {
  if (event) event.stopPropagation();
  var wrap = btn.parentElement;
  var dd = wrap.querySelector('.ms-dropdown');
  var isOpen = dd.classList.contains('open');
  closeAllMs();
  if (!isOpen) {
    dd.classList.add('open');
    btn.classList.add('active');
  }
}
function closeAllMs() {
  document.querySelectorAll('.ms-dropdown').forEach(function(d) { d.classList.remove('open'); });
  document.querySelectorAll('.ms-btn').forEach(function(b) { b.classList.remove('active'); });
}
function msToggleAll(cb) {
  var dd = cb.closest('.ms-dropdown');
  dd.querySelectorAll('.ms-item input[type=checkbox]').forEach(function(i) { i.checked = cb.checked; });
  syncMsState(dd);
}
function msItemChange(cb) {
  var dd = cb.closest('.ms-dropdown');
  var items = dd.querySelectorAll('.ms-item input[type=checkbox]');
  var allCb = dd.querySelector('.ms-all input[type=checkbox]');
  var checkedCount = 0;
  items.forEach(function(i) { if (i.checked) checkedCount++; });
  allCb.checked = checkedCount === items.length;
  allCb.indeterminate = checkedCount > 0 && checkedCount < items.length;
  syncMsState(dd);
}
function syncMsState(dd) {
  var wrap = dd.closest('.ms-wrap');
  var key = wrap.getAttribute('data-key');
  var values = [];
  dd.querySelectorAll('.ms-item input[type=checkbox]').forEach(function(i) {
    if (i.checked) values.push(i.value);
  });
  if (typeof state !== 'undefined') state[key] = values;

  var totalItems = dd.querySelectorAll('.ms-item input[type=checkbox]').length;
  var btnText = wrap.querySelector('.ms-text');
  if (values.length === 0) {
    btnText.textContent = '请选择';
    btnText.classList.add('placeholder');
  } else if (values.length === totalItems) {
    btnText.textContent = '全部';
    btnText.classList.remove('placeholder');
  } else if (values.length <= 2) {
    btnText.textContent = values.join('、');
    btnText.classList.remove('placeholder');
  } else {
    btnText.textContent = values.slice(0, 2).join('、') + ' 等 ' + values.length + ' 项';
    btnText.classList.remove('placeholder');
  }

  if (typeof state !== 'undefined') state.page = 1;
  if (typeof render === 'function') render();
}
function resetAllMs() {
  document.querySelectorAll('.ms-wrap').forEach(function(wrap) {
    var dd = wrap.querySelector('.ms-dropdown');
    dd.querySelectorAll('input[type=checkbox]').forEach(function(i) {
      i.checked = true; i.indeterminate = false;
    });
    var btnText = wrap.querySelector('.ms-text');
    btnText.textContent = '全部';
    btnText.classList.remove('placeholder');
  });
}
document.addEventListener('click', function(e) {
  if (!e.target.closest('.ms-wrap')) closeAllMs();
});

/* ── Sort helper ── */
function sortRows(rows, st) {
  if (!st.sortCol) return rows;
  var col = st.sortCol;
  var dir = st.sortDir === 'asc' ? 1 : -1;
  return rows.slice().sort(function(a, b) {
    var av = a[col], bv = b[col];
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    av = (av == null ? '' : String(av));
    bv = (bv == null ? '' : String(bv));
    return av.localeCompare(bv, 'zh-CN') * dir;
  });
}

/* ── Formatting helpers ── */
function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function formatTime(ts) {
  if (!ts) return '—';
  var d = new Date(ts);
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
    + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
}

/* ── Empty row ── */
function emptyRow(colspan) {
  return '<tr><td colspan="' + colspan + '"><div class="empty-state">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
    + '<p>没有匹配的记录<br/>请尝试调整筛选条件</p>'
    + '</div></td></tr>';
}

/* ── Pager render ── */
function renderPager(containerId, cur, totalPages, onGoto) {
  var pager = document.getElementById(containerId);
  var html = '';
  html += '<button class="page-btn ' + (cur === 1 ? 'disabled' : '') + '" data-go="' + (cur - 1) + '">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px;"><polyline points="15 18 9 12 15 6"/></svg>'
    + '</button>';

  var pages = [];
  if (totalPages <= 7) {
    for (var i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (cur > 4) pages.push('...');
    var s = Math.max(2, cur - 1), e = Math.min(totalPages - 1, cur + 1);
    for (var j = s; j <= e; j++) pages.push(j);
    if (cur < totalPages - 3) pages.push('...');
    pages.push(totalPages);
  }
  pages.forEach(function(p) {
    if (p === '...') html += '<button class="page-btn disabled">...</button>';
    else html += '<button class="page-btn ' + (p === cur ? 'active' : '') + '" data-go="' + p + '">' + p + '</button>';
  });

  html += '<button class="page-btn ' + (cur === totalPages ? 'disabled' : '') + '" data-go="' + (cur + 1) + '">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px;"><polyline points="9 18 15 12 9 6"/></svg>'
    + '</button>';
  pager.innerHTML = html;

  pager.querySelectorAll('button.page-btn[data-go]').forEach(function(b) {
    if (b.classList.contains('disabled')) return;
    b.addEventListener('click', function() {
      onGoto(parseInt(b.getAttribute('data-go'), 10));
    });
  });
}

/* ── Toast ── */
function showToast(title, desc) {
  var t = document.getElementById('toast');
  if (!t) return;
  document.getElementById('toastTitle').textContent = title;
  document.getElementById('toastDesc').textContent  = desc;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2500);
}
