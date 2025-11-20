// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href.length > 1) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  });
});

// Header shrink on scroll
const header = document.querySelector('.site-header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
});

// Reveal on scroll 
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      io.unobserve(e.target); 
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Favorite (heart) toggle
document.querySelectorAll('.fav').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const el = e.currentTarget;
    if (el.classList.contains('liked')) {
      el.classList.remove('liked');
      el.textContent = '♡';
    } else {
      el.classList.add('liked');
      el.textContent = '❤';
    }
  });
});


(function () {
  // helper storage functions
  function _getUsers() { try { return JSON.parse(localStorage.getItem('cf_users') || '{}'); } catch (e) { return {} } }
  function _setUsers(u) { localStorage.setItem('cf_users', JSON.stringify(u)); }
  function _getSession() { try { return JSON.parse(localStorage.getItem('cf_session') || 'null'); } catch (e) { return null } }
  function _setSession(s) { localStorage.setItem('cf_session', JSON.stringify(s)); }
  function _clearSession() { localStorage.removeItem('cf_session'); }
  function validateEmail(email) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email); }

  // build modal HTML + CSS once
  const css = `
  /* auth modal styles injected by codefigma.js */
  .cf-auth-backdrop{position:fixed;inset:0;background:rgba(10,12,14,0.45);display:flex;align-items:center;justify-content:center;z-index:1200}
  .cf-auth-card{width:96%;max-width:720px;background:#fff;border-radius:12px;box-shadow:0 30px 80px rgba(0,0,0,0.25);display:grid;grid-template-columns:1fr 420px;overflow:hidden}
  .cf-auth-left{padding:28px}
  .cf-auth-right{background:linear-gradient(180deg,#0b5256,#083b3c);color:#fff;padding:28px;display:flex;flex-direction:column;justify-content:center;align-items:center}
  .cf-auth-tabs{display:flex;gap:8px;margin-bottom:12px}
  .cf-tab{padding:8px 12px;border-radius:8px;background:#f4f4f4;cursor:pointer}
  .cf-tab.active{background:var(--accent);color:#111}
  .cf-field{display:block;width:100%;padding:10px 12px;margin:8px 0;border:1px solid #eee;border-radius:8px}
  .cf-actions{display:flex;justify-content:flex-end;gap:12px;margin-top:12px}
  .cf-msg{display:none;padding:8px;border-radius:8px;margin-top:8px}
  .cf-msg.error{background:#FFECEC;color:#A33}
  .cf-msg.success{background:#EBFFEF;color:#0A6}
  .cf-close{position:absolute;right:18px;top:18px;background:transparent;border:0;color:#fff;font-weight:700;cursor:pointer}
  @media (max-width:820px){ .cf-auth-card{grid-template-columns:1fr} .cf-auth-right{display:none} }
  `;

  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  const modal = document.createElement('div'); modal.className = 'cf-auth-backdrop'; modal.style.display = 'none';
  modal.innerHTML = ` 
    <div class="cf-auth-card" role="dialog" aria-modal="true" aria-label="Sign in or sign up">
      <div class="cf-auth-left">
        <button class="cf-close" aria-label="close">✕</button>
        <div class="cf-auth-tabs">
          <div class="cf-tab active" data-tab="login">Sign in</div>
          <div class="cf-tab" data-tab="signup">Sign up</div>
        </div>
        <div class="cf-forms">
          <form id="cf-login" style="display:block">
            <input id="cf-login-email" class="cf-field" type="email" placeholder="Email" required>
            <input id="cf-login-password" class="cf-field" type="password" placeholder="Password" required>
            <div id="cf-auth-msg" class="cf-msg"></div>
            <div class="cf-actions">
              <button type="submit" class="btn-primary">Sign in</button>
            </div>
          </form>

          <form id="cf-signup" style="display:none">
            <input id="cf-name" class="cf-field" type="text" placeholder="Full name" required>
            <input id="cf-email" class="cf-field" type="email" placeholder="Email" required>
            <input id="cf-password" class="cf-field" type="password" placeholder="Password (min 6)" required>
            <input id="cf-password2" class="cf-field" type="password" placeholder="Repeat password" required>
            <div id="cf-auth-msg-2" class="cf-msg"></div>
            <div class="cf-actions">
              <button type="submit" class="btn-primary">Create account</button>
            </div>
          </form>
        </div>
      </div>
      <div class="cf-auth-right">
        <h3 style="margin:0 0 8px">Welcome to Let'sFood</h3>
        <p style="opacity:0.95;text-align:center;max-width:260px">Fast delivery, quality dishes and friendly service. Sign in or create an account to continue.</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // utility to show/hide messages
  function showMsg(el, msg, type = 'error') {
    el.textContent = msg; el.className = 'cf-msg ' + (type === 'error' ? 'error' : 'success'); el.style.display = 'block';
  }

  // open modal
  function openAuth(tab = 'login') {
    modal.style.display = 'flex'; document.body.style.overflow = 'hidden';
    const login = document.getElementById('cf-login'), signup = document.getElementById('cf-signup');
    const tabs = modal.querySelectorAll('.cf-tab'); tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    if (tab === 'login') { login.style.display = 'block'; signup.style.display = 'none'; }
    else { login.style.display = 'none'; signup.style.display = 'block'; }
    // focus first input
    setTimeout(() => {
      const f = modal.querySelector(tab === 'login' ? '#cf-login-email' : '#cf-name'); if (f) f.focus();
    }, 120);
  }

  function closeAuth() {
    modal.style.display = 'none'; document.body.style.overflow = '';
    // clear messages
    const m = document.getElementById('cf-auth-msg'); if (m) { m.style.display = 'none'; }
    const m2 = document.getElementById('cf-auth-msg-2'); if (m2) { m2.style.display = 'none'; }
  }

  // tab click
  modal.addEventListener('click', (ev) => {
    if (ev.target.classList.contains('cf-tab')) {
      const tab = ev.target.dataset.tab; openAuth(tab);
    }
    if (ev.target.classList.contains('cf-close') || ev.target === modal) closeAuth();
  });

  // ESC to close
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAuth(); });

  // register handler
  modal.querySelector('#cf-signup')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('cf-name').value.trim();
    const email = document.getElementById('cf-email').value.trim();
    const pass = document.getElementById('cf-password').value || '';
    const pass2 = document.getElementById('cf-password2').value || '';
    const msg = document.getElementById('cf-auth-msg-2');
    if (!name || !email || !pass) return showMsg(msg, 'Please fill all fields', 'error');
    if (!validateEmail(email)) return showMsg(msg, 'Invalid email', 'error');
    if (pass.length < 6) return showMsg(msg, 'Password must be at least 6 characters', 'error');
    if (pass !== pass2) return showMsg(msg, 'Passwords do not match', 'error');
    const users = _getUsers(); if (users[email]) return showMsg(msg, 'An account with that email already exists', 'error');
    users[email] = { name, password: pass }; _setUsers(users);
    showMsg(msg, 'Account created — signing you in...', 'success');
    // auto sign in
    _setSession({ email, name, ts: Date.now() });
    setTimeout(() => { updateHeader(); closeAuth(); }, 900);
  });

  // login handler
  modal.querySelector('#cf-login')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('cf-login-email').value.trim();
    const pass = document.getElementById('cf-login-password').value || '';
    const msg = document.getElementById('cf-auth-msg');
    if (!email || !pass) return showMsg(msg, 'Enter email and password', 'error');
    if (!validateEmail(email)) return showMsg(msg, 'Invalid email', 'error');
    const users = _getUsers();
    if (!users[email] || users[email].password !== pass) return showMsg(msg, 'Email or password incorrect', 'error');
    _setSession({ email, name: users[email].name, ts: Date.now() });
    showMsg(msg, 'Signed in — redirecting...', 'success');
    setTimeout(() => { updateHeader(); closeAuth(); }, 700);
  });

  // update header UI (Sign in -> Hi, Name / Sign out)
  function updateHeader() {
    const hdrBtn = document.querySelector('.site-header .btn-primary');
    const session = _getSession();
    if (!hdrBtn) return;
    if (session && session.name) {
      hdrBtn.textContent = `Hi, ${session.name.split(' ')[0]}`;
      hdrBtn.classList.add('cf-logged');
      // attach dropdown sign out on click
      hdrBtn.onclick = (e) => {
        const ok = confirm('Sign out?'); if (ok) { _clearSession(); updateHeader(); }
      };
    } else {
      hdrBtn.textContent = 'Sign in'; hdrBtn.classList.remove('cf-logged');
      hdrBtn.onclick = (e) => { e.preventDefault(); openAuth('login'); };
    }
  }

  // wire initial header button
  document.addEventListener('DOMContentLoaded', () => {
    const hdrBtn = document.querySelector('.site-header .btn-primary');
    if (hdrBtn) { hdrBtn.addEventListener('click', (e) => { e.preventDefault(); openAuth('login'); }); }
    // if session exists update header
    updateHeader();
  });

  // --- Cart module (non-intrusive, uses localStorage) -----------------
  (function cartModule() {
    const STORAGE_KEY = 'cf_cart';
    function _getCart() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch (e) { return []; } }
    function _setCart(c) { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); }

    function createCartButton() {
      if (document.querySelector('.cf-cart-btn')) return;
      const btn = document.createElement('button'); btn.className = 'cf-cart-btn';
      btn.innerHTML = '<span class="cart-icon">🛒</span><span class="cf-cart-badge">0</span>';
      btn.addEventListener('click', togglePanel);
      document.body.appendChild(btn);
      renderCart();
    }

    function togglePanel() {
      const panel = document.querySelector('.cf-cart-panel');
      if (panel) { panel.remove(); return; }
      renderPanel();
    }

    function renderCart() {
      const badge = document.querySelector('.cf-cart-badge');
      const cart = _getCart();
      const totalQty = cart.reduce((s,i) => s + (i.qty||1), 0);
      if (badge) badge.textContent = totalQty;
    }

    function renderPanel() {
      const existing = document.querySelector('.cf-cart-panel'); if (existing) return;
      const panel = document.createElement('div'); panel.className = 'cf-cart-panel';
      const cart = _getCart();
      if (!cart.length) {
        panel.innerHTML = '<div class="cf-cart-empty">Your cart is empty</div>';
        document.body.appendChild(panel);
        return;
      }
      cart.forEach(item => {
        const row = document.createElement('div'); row.className = 'cf-cart-item';
        row.innerHTML = `<div class="c-left"><strong>${escapeHtml(item.title)}</strong><div class="muted small">$${Number(item.price).toFixed(2)}</div></div>
          <div class="c-right"><div class="c-qty"><button class="cf-decr">-</button><span class="qty">${item.qty}</span><button class="cf-incr">+</button></div><div style="margin-top:6px"><button class="cf-remove">Remove</button></div></div>`;
        // qty handlers
        row.querySelector('.cf-incr').addEventListener('click', () => { changeQty(item.id, 1); renderPanelRefresh(panel); });
        row.querySelector('.cf-decr').addEventListener('click', () => { changeQty(item.id, -1); renderPanelRefresh(panel); });
        row.querySelector('.cf-remove').addEventListener('click', () => { removeItem(item.id); renderPanelRefresh(panel); });
        panel.appendChild(row);
      });
      const footer = document.createElement('div'); footer.className = 'cf-cart-footer';
      const total = cart.reduce((s,i) => s + (i.price * i.qty), 0);
      footer.innerHTML = `<div><strong>Total</strong></div><div><strong>$${total.toFixed(2)}</strong></div>`;
      const checkout = document.createElement('button'); checkout.className = 'cf-cart-checkout'; checkout.textContent = 'Checkout';
      checkout.addEventListener('click', () => { alert('Checkout: ' + JSON.stringify(_getCart())); });
      footer.appendChild(checkout);
      panel.appendChild(footer);
      document.body.appendChild(panel);
    }

    function renderPanelRefresh(panel) {
      if (panel && panel.parentNode) panel.remove(); renderPanel(); renderCart();
    }

    function changeQty(id, delta) {
      const cart = _getCart();
      const idx = cart.findIndex(i => i.id === id);
      if (idx === -1) return;
      cart[idx].qty = Math.max(0, (cart[idx].qty||1) + delta);
      if (cart[idx].qty === 0) cart.splice(idx,1);
      _setCart(cart);
    }

    function removeItem(id) { const cart = _getCart().filter(i=>i.id!==id); _setCart(cart); }

    function addItem(item) {
      const cart = _getCart();
      const found = cart.find(i => i.id === item.id);
      if (found) { found.qty = (found.qty||1) + 1; }
      else { cart.push({ id: item.id, title: item.title, price: Number(item.price)||0, qty: 1 }); }
      _setCart(cart); renderCart();
    }

    function escapeHtml(str){ return String(str).replace(/[&<>\"]/g, s=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[s]||s)); }

    // enhance the menu cards by adding an "Add" button (safe, non-destructive)
    function wireMenuAddButtons() {
      document.querySelectorAll('.menu-card').forEach(card => {
        if (card.querySelector('.cf-add-btn')) return; // already added
        const title = card.querySelector('.dish')?.textContent?.trim() || 'Item';
        const priceText = card.querySelector('.price')?.textContent || '0';
        const price = parseFloat(priceText.replace(/[^0-9\.]/g,'')) || 0;
        const metaRight = card.querySelector('.meta-right') || card.querySelector('.card-body');
        const btn = document.createElement('button'); btn.className = 'cf-add-btn'; btn.textContent = 'Add';
        btn.addEventListener('click', (e) => { e.preventDefault(); addItem({ id: title, title, price }); createCartButton(); });
        if (metaRight) metaRight.appendChild(btn);
      });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => { createCartButton(); wireMenuAddButtons(); });
    } else { createCartButton(); wireMenuAddButtons(); }
  })();

})();
