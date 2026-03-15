// Remindly script — fully rebuilt for reliability
console.log('=== Remindly JS loaded ===');

var selectedDays = [];
var swRegistration = null;
var firedToday = {};

// ══════════════════════════════════
// INIT
// ══════════════════════════════════
window.onload = function() {
  console.log('window.onload fired');
  startClock();
  loadCategories();
  loadReminders();
  initNotifications();
  startNotificationPoller();

  // Close modal when clicking the dark background (not the modal itself)
  var overlay = document.getElementById('modal-overlay');
  var inner   = document.getElementById('modal-inner');
  if (overlay) {
    overlay.addEventListener('click', function(e) {
      // if click target is the overlay itself (not a child), close
      if (e.target === overlay) closeModal();
    });
  }
};

// ══════════════════════════════════
// CLOCK
// ══════════════════════════════════
function startClock() {
  function tick() {
    var now = new Date();
    var h = String(now.getHours()).padStart(2,'0');
    var m = String(now.getMinutes()).padStart(2,'0');
    var el = document.getElementById('clock');
    var ds = document.getElementById('datestr');
    if (el) el.textContent = h + ':' + m;
    if (ds) ds.textContent = now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  }
  tick();
  setInterval(tick, 5000);
}

// ══════════════════════════════════
// VIEWS
// ══════════════════════════════════
function switchView(name, btn) {
  document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
  document.querySelectorAll('.nav-tab').forEach(function(t) { t.classList.remove('active'); });
  var view = document.getElementById('view-' + name);
  if (view) view.classList.add('active');
  if (btn) btn.classList.add('active');
  if (name === 'suggestions') loadSuggestions();
  if (name === 'manage') loadManage();
}

// ══════════════════════════════════
// LOAD CATEGORIES into selects
// ══════════════════════════════════
function loadCategories() {
  fetch('/categories')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var cats = data.categories || [];
      console.log('Categories loaded:', cats);
      fillSelect('r-category', cats);
      fillSelect('sug-category', cats);
    })
    .catch(function(e) { console.error('loadCategories error:', e); });
}

function fillSelect(id, options) {
  var sel = document.getElementById(id);
  if (!sel) return;
  sel.innerHTML = options.map(function(c) {
    return '<option value="' + esc(c) + '">' + esc(c) + '</option>';
  }).join('');
}

// ══════════════════════════════════
// MODAL OPEN / CLOSE
// ══════════════════════════════════
function openModal() {
  // Re-load categories each time modal opens so dropdown is fresh
  loadCategories();
  selectedDays = [];
  document.querySelectorAll('.day-btn').forEach(function(b) { b.classList.remove('selected'); });

  var fields = ['r-task-name', 'r-note', 'r-time'];
  fields.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });

  var err = document.getElementById('modal-err');
  if (err) err.textContent = '';

  var overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.add('open');

  setTimeout(function() {
    var t = document.getElementById('r-task-name');
    if (t) t.focus();
  }, 100);
}

function closeModal() {
  var overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.remove('open');
}

function closeModalOnBg(e) {
  if (e.target && e.target.id === 'modal-overlay') closeModal();
}

// ══════════════════════════════════
// DAY TOGGLE
// ══════════════════════════════════
function toggleDay(day) {
  if (day === 'Daily') {
    selectedDays = (selectedDays.indexOf('Daily') >= 0) ? [] : ['Daily'];
  } else {
    // remove Daily if individual day selected
    var i = selectedDays.indexOf('Daily');
    if (i >= 0) selectedDays.splice(i, 1);
    var j = selectedDays.indexOf(day);
    if (j >= 0) selectedDays.splice(j, 1);
    else selectedDays.push(day);
  }
  // update button styles
  document.querySelectorAll('.day-btn').forEach(function(btn) {
    var label = btn.textContent.trim();
    btn.classList.toggle('selected', selectedDays.indexOf(label) >= 0);
  });
  console.log('Selected days:', selectedDays);
}

// ══════════════════════════════════
// SAVE REMINDER — the main function
// ══════════════════════════════════
function saveReminder() {
  console.log('saveReminder() called');

  var taskEl     = document.getElementById('r-task-name');
  var catEl      = document.getElementById('r-category');
  var timeEl     = document.getElementById('r-time');
  var noteEl     = document.getElementById('r-note');
  var errEl      = document.getElementById('modal-err');

  // Null checks — if any element missing, something is very wrong
  if (!taskEl || !catEl || !timeEl || !errEl) {
    alert('Form elements missing — please refresh the page.');
    return;
  }

  var taskName = taskEl.value.trim();
  var category = catEl.value;
  var time     = timeEl.value;
  var note     = noteEl ? noteEl.value.trim() : '';

  console.log('Form values:', {taskName: taskName, category: category, time: time, days: selectedDays});

  // Validation
  errEl.textContent = '';
  if (!taskName) { errEl.textContent = 'Enter a task name.'; return; }
  if (!time)     { errEl.textContent = 'Pick a time.'; return; }
  if (!selectedDays.length) { errEl.textContent = 'Pick at least one day.'; return; }

  var payload = {
    title:    taskName,
    category: category || 'General',
    task:     taskName.toLowerCase().replace(/\s+/g, '_'),
    time:     time,
    days:     selectedDays,
    note:     note
  };

  console.log('Sending payload:', JSON.stringify(payload));

  // Disable button to prevent double-submit
  var btn = document.querySelector('.submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  fetch('/reminders', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload)
  })
  .then(function(response) {
    console.log('Response status:', response.status);
    return response.text().then(function(text) {
      console.log('Response body:', text);
      return { status: response.status, text: text };
    });
  })
  .then(function(result) {
    if (btn) { btn.disabled = false; btn.textContent = 'Save Reminder'; }

    if (result.status !== 200) {
      errEl.textContent = 'Server error ' + result.status + ': ' + result.text;
      return;
    }

    closeModal();
    loadReminders();
    showToast('Reminder saved! 🌸', 'success');
  })
  .catch(function(err) {
    console.error('Fetch error:', err);
    if (btn) { btn.disabled = false; btn.textContent = 'Save Reminder'; }
    errEl.textContent = 'Could not reach server. Is uvicorn running?';
  });
}

// ══════════════════════════════════
// LOAD & RENDER REMINDERS
// ══════════════════════════════════
function loadReminders() {
  fetch('/reminders')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      renderReminders(data.reminders || []);
      updateNextPill(data.reminders || []);
    })
    .catch(function(e) { console.error('loadReminders error:', e); });
}

var ICONS = { fitness:'🏋️', skincare:'✨', study:'📚', health:'💊', work:'💼', food:'🍎', sleep:'😴', wellness:'🌿' };
var CCLASS = { fitness:'cat-fitness', skincare:'cat-skincare', study:'cat-study', health:'cat-health' };
function cIcon(c)  { return ICONS[(c||'').toLowerCase()] || '🔔'; }
function cClass(c) { return CCLASS[(c||'').toLowerCase()] || 'cat-default'; }

function renderReminders(list) {
  var el = document.getElementById('reminders-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🌸</div><p>No reminders yet — add your first one!</p></div>';
    return;
  }
  list.sort(function(a,b){ return (a.time||'').localeCompare(b.time||''); });
  el.innerHTML = list.map(function(r) {
    var active = r.active !== false;
    return '<div class="reminder-card ' + (active?'':'inactive') + '">' +
      '<div class="cat-icon ' + cClass(r.category) + '">' + cIcon(r.category) + '</div>' +
      '<div class="reminder-info">' +
        '<div class="reminder-title">' + esc(r.title) + '</div>' +
        '<div class="reminder-meta">' +
          '<span class="meta-pill">' + esc(r.category) + '</span>' +
          '<span class="meta-pill blue">' + esc((r.days||[]).join(' · ')) + '</span>' +
          (r.note ? '<span>' + esc(r.note) + '</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="reminder-time">' + fmtTime(r.time) + '</div>' +
      '<div class="reminder-actions">' +
        '<button class="icon-btn" onclick="toggleReminder(' + r.id + ')">' + (active?'⏸':'▶') + '</button>' +
        '<button class="icon-btn del" onclick="deleteReminder(' + r.id + ')">🗑</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function fmtTime(t) {
  if (!t) return '';
  var p = t.split(':'), h = parseInt(p[0]);
  return (h % 12 || 12) + ':' + p[1] + (h >= 12 ? ' PM' : ' AM');
}

function updateNextPill(list) {
  var now = new Date();
  var nowM = now.getHours() * 60 + now.getMinutes();
  var today = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][now.getDay()];
  var upcoming = list.filter(function(r) {
    if (r.active === false) return false;
    var p = (r.time||'00:00').split(':');
    var rm = parseInt(p[0])*60 + parseInt(p[1]||0);
    var d = r.days || [];
    return rm > nowM && (d.indexOf('Daily') >= 0 || d.indexOf(today) >= 0);
  }).sort(function(a,b){ return a.time.localeCompare(b.time); });
  var el = document.getElementById('next-text');
  if (el) el.textContent = upcoming.length
    ? 'Next: ' + upcoming[0].title + ' at ' + fmtTime(upcoming[0].time)
    : 'No more reminders today';
}

function toggleReminder(id) {
  fetch('/reminders/' + id + '/toggle', { method: 'PUT' })
    .then(function() { loadReminders(); });
}

function deleteReminder(id) {
  if (!confirm('Delete this reminder?')) return;
  fetch('/reminders/' + id, { method: 'DELETE' })
    .then(function() { loadReminders(); });
}

// ══════════════════════════════════
// SUGGESTIONS
// ══════════════════════════════════
function loadSuggestions() {
  var catEl = document.getElementById('sug-category');
  if (!catEl || !catEl.value) return;
  var cat = catEl.value;
  var grid = document.getElementById('suggestions-grid');
  if (grid) grid.innerHTML = '<div style="color:var(--muted);padding:16px 0;">Loading…</div>';

  fetch('/suggestions/' + encodeURIComponent(cat))
    .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function(data) {
      var list = data.suggestions || [];
      if (!list.length) { grid.innerHTML = '<div style="color:var(--muted);">No suggestions yet.</div>'; return; }
      var max = list[0][1] || 1;
      grid.innerHTML = list.map(function(item, i) {
        var opt = item[0], score = item[1], pct = Math.round(score/max*100);
        return '<div class="suggestion-card ' + (i===0?'top-pick':'') + '" onclick="pickSuggestion(\'' + esc(cat) + '\',\'' + esc(opt) + '\')">' +
          (i===0 ? '<span class="top-badge">TOP PICK</span>' : '') +
          '<div class="sug-label">' + opt.replace(/_/g,' ') + '</div>' +
          '<div class="sug-score">Score: ' + score + '</div>' +
          '<div class="sug-bar"><div class="sug-bar-fill" style="width:' + pct + '%"></div></div>' +
        '</div>';
      }).join('');
    })
    .catch(function() {
      if (grid) grid.innerHTML = '<div style="color:var(--muted);">No suggestions available yet.</div>';
    });
}

function pickSuggestion(cat, opt) {
  fetch('/action?reminder_id=1&category=' + encodeURIComponent(cat) + '&action=snooze&value=' + encodeURIComponent(opt), { method: 'POST' })
    .then(function() {
      var st = document.getElementById('sug-status');
      if (st) { st.textContent = '✅ Updated preference for "' + opt.replace(/_/g,' ') + '"'; setTimeout(function(){ st.textContent=''; }, 2500); }
      loadSuggestions();
    });
}

// ══════════════════════════════════
// MANAGE
// ══════════════════════════════════
function loadManage() {
  loadCategories();
  var container = document.getElementById('manage-cats-list');
  if (!container) return;
  container.innerHTML = '<div style="color:var(--muted);font-size:14px;padding:8px 0;">Loading…</div>';

  fetch('/categories')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var cats = data.categories || [];
      if (!cats.length) { container.innerHTML = '<div style="color:var(--muted);">No categories yet.</div>'; return; }
      var tasks_promises = cats.map(function(cat) {
        return fetch('/tasks/' + encodeURIComponent(cat))
          .then(function(r) { return r.json(); })
          .then(function(d) { return { cat: cat, tasks: d.tasks || [] }; });
      });
      Promise.all(tasks_promises).then(function(results) {
        container.innerHTML = '';
        results.forEach(function(item) {
          var div = document.createElement('div');
          div.className = 'manage-cat-card';
          var tagsHtml = item.tasks.length
            ? item.tasks.map(function(t){ return '<span class="cat-task-tag">' + esc(t.replace(/_/g,' ')) + '</span>'; }).join('')
            : '<span style="color:var(--muted);font-size:12px;">No tasks yet</span>';
          div.innerHTML =
            '<div class="cat-row">' +
              '<span class="cat-name">' + cIcon(item.cat) + ' ' + esc(item.cat) + '</span>' +
              '<button class="delete-cat-btn" onclick="deleteCategory(\'' + esc(item.cat) + '\')">Delete</button>' +
            '</div>' +
            '<div class="cat-tasks">' + tagsHtml + '</div>';
          container.appendChild(div);
        });
      });
    });
}

function addCategory() {
  var input  = document.getElementById('new-cat-input');
  var errDiv = document.getElementById('cat-err');
  if (!input) return;
  var name = input.value.trim();
  if (errDiv) errDiv.textContent = '';
  if (!name) { if (errDiv) errDiv.textContent = 'Enter a category name.'; return; }

  fetch('/categories?name=' + encodeURIComponent(name), { method: 'POST' })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, d: d }; }); })
    .then(function(res) {
      if (!res.ok) { if (errDiv) errDiv.textContent = (res.d && res.d.detail) || 'Error.'; return; }
      input.value = '';
      loadManage();
      loadCategories();
      showToast('Category "' + name + '" added 🎀', 'success');
    });
}

function deleteCategory(name) {
  if (!confirm('Delete category "' + name + '"?')) return;
  fetch('/categories/' + encodeURIComponent(name), { method: 'DELETE' })
    .then(function() { loadManage(); loadCategories(); });
}

// ══════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════
function initNotifications() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/static/sw.js')
      .then(function(reg) { swRegistration = reg; updateBellUI(); })
      .catch(function(e) { console.warn('SW:', e); });
  }
  updateBellUI();
}

function updateBellUI() {
  var btn = document.getElementById('notif-btn');
  if (!btn || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    btn.style.borderColor = 'var(--blue)';
    btn.style.background  = 'var(--blue-pale)';
    btn.title = 'Notifications ON — click to test';
  } else if (Notification.permission === 'denied') {
    btn.textContent = '🔕';
    btn.style.opacity = '0.5';
  }
}

function requestNotificationPermission() {
  if (!('Notification' in window)) { showToast('Browser does not support notifications.', 'error'); return; }
  if (Notification.permission === 'granted') { fireNotification('Remindly 🔔', 'Test — works!', 'test'); return; }
  if (Notification.permission === 'denied')  { showToast('Blocked in browser settings.', 'error'); return; }
  Notification.requestPermission().then(function(r) {
    updateBellUI();
    if (r === 'granted') { showToast('Notifications enabled! 🌸', 'success'); fireNotification('Remindly ✅', 'Alerts are live.', 'welcome'); }
    else showToast('Notifications not enabled.', 'error');
  });
}

function fireNotification(title, body, tag) {
  if (Notification.permission !== 'granted') return;
  if (swRegistration && swRegistration.active)
    swRegistration.active.postMessage({ type: 'SHOW_NOTIFICATION', title: title, body: body, tag: tag });
  else
    try { new Notification(title, { body: body, tag: tag }); } catch(e) {}
}

function startNotificationPoller() {
  checkDueReminders();
  setInterval(checkDueReminders, 30000);
}

function checkDueReminders() {
  if (Notification.permission !== 'granted') return;
  fetch('/notify/due')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      (data.due || []).forEach(function(r) {
        var key = r.id + '-' + r.time;
        if (firedToday[key]) return;
        firedToday[key] = true;
        var body = (r.note ? r.note + '\n' : '') + 'Category: ' + r.category;
        fireNotification('⏰ ' + r.title, body, 'reminder-' + r.id);
        showToast('⏰ ' + r.title, 'reminder');
      });
    })
    .catch(function() {});
}

// Reset at midnight
(function() {
  var now = new Date(), mid = new Date(now); mid.setHours(24,0,0,0);
  setTimeout(function() { firedToday = {}; setInterval(function(){ firedToday={}; }, 86400000); }, mid - now);
})();

// ══════════════════════════════════
// TOAST
// ══════════════════════════════════
function showToast(msg, type) {
  var colors = { success: 'var(--pink)', error: 'var(--danger)', reminder: 'var(--blue)', info: 'var(--muted)' };
  var cont = document.getElementById('toast-container');
  if (!cont) {
    cont = document.createElement('div');
    cont.id = 'toast-container';
    cont.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:flex-end;pointer-events:none;';
    document.body.appendChild(cont);
  }
  var t = document.createElement('div');
  t.style.cssText = 'background:#fff;border:1.5px solid ' + (colors[type]||colors.info) + ';color:var(--text);padding:11px 16px;border-radius:12px;font-size:13px;box-shadow:0 4px 18px rgba(232,113,154,0.18);max-width:280px;opacity:0;transition:opacity .2s;';
  t.textContent = msg;
  cont.appendChild(t);
  requestAnimationFrame(function() { t.style.opacity = '1'; });
  setTimeout(function() { t.style.opacity='0'; setTimeout(function(){ t.remove(); }, 200); }, 3500);
}

// ══════════════════════════════════
// UTILS
// ══════════════════════════════════
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
