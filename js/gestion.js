(() => {
  const config = window.SITE_CONFIG || {};
  const configured = config.SUPABASE_URL && !config.SUPABASE_URL.includes('VOTRE-PROJET') && config.SUPABASE_ANON_KEY && !config.SUPABASE_ANON_KEY.includes('VOTRE_CLE');
  const client = configured && window.supabase ? window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;
  const loginPanel = document.querySelector('#login-panel'), dashboard = document.querySelector('#dashboard');
  const loginForm = document.querySelector('#login-form'), loginMessage = document.querySelector('#login-message');
  const adminMessage = document.querySelector('#admin-message'), list = document.querySelector('#appointments-list');
  const statusFilter = document.querySelector('#status-filter'), companyFilter = document.querySelector('#company-filter');
  const labels = { pending: 'En attente', accepted: 'Acceptée', declined: 'Refusée', completed: 'Terminée' };
  const companyLabels = { hugo: 'Hugo', matheo: 'Mathéo', indifferent: 'Sans préférence' };
  function message(el, text, type='error') { el.hidden = false; el.className = `form-message ${type}`; el.textContent = text; }
  function configuredMessage() { message(loginMessage, 'Supabase n’est pas configuré. Remplissez js/config.js et exécutez supabase.sql en suivant LISEZ-MOI.md.', 'error'); }
  function safeDate(value) { if (!value) return 'Non précisée'; const [y,m,d] = value.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('fr-FR', {day:'2-digit',month:'long',year:'numeric'}); }
  function escapeText(value='') { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  async function loadAppointments() {
    if (!client) return;
    list.innerHTML = '<p class="muted">Chargement des demandes…</p>';
    let query = client.from('appointments').select('*').order('created_at', { ascending: false });
    if (statusFilter.value !== 'all') query = query.eq('status', statusFilter.value);
    if (companyFilter.value !== 'all') query = query.eq('company', companyFilter.value);
    const { data, error } = await query;
    if (error) { console.error(error); list.innerHTML = ''; message(adminMessage, 'Impossible de charger les demandes. Vérifiez que votre compte est autorisé dans site_admins.', 'error'); return; }
    adminMessage.hidden = true;
    const { data: all } = await client.from('appointments').select('id,status,company');
    const stats = document.querySelector('#stats');
    const records = all || [];
    stats.innerHTML = `<div class="stat-card"><span>Total</span><strong>${records.length}</strong></div><div class="stat-card"><span>En attente</span><strong>${records.filter(x=>x.status==='pending').length}</strong></div><div class="stat-card"><span>Acceptées</span><strong>${records.filter(x=>x.status==='accepted').length}</strong></div><div class="stat-card"><span>Terminées</span><strong>${records.filter(x=>x.status==='completed').length}</strong></div>`;
    if (!data?.length) { list.innerHTML = '<div class="empty-state"><span>✓</span><h3>Aucune demande à afficher</h3><p>Les nouvelles demandes apparaîtront ici.</p></div>'; return; }
    list.innerHTML = data.map(item => `<article class="appointment-card"><div class="appointment-head"><div><span class="status status-${escapeText(item.status)}">${escapeText(labels[item.status] || item.status)}</span><h3>${escapeText(item.customer_name)}</h3><p class="appointment-meta">${escapeText(companyLabels[item.company] || item.company)} · ${escapeText(item.service)}</p></div><div class="appointment-date"><strong>${escapeText(safeDate(item.preferred_date))}</strong><span>${escapeText(item.city)}</span></div></div><div class="appointment-details"><p><strong>E-mail :</strong> <a href="mailto:${escapeText(item.email)}">${escapeText(item.email)}</a></p><p><strong>Téléphone :</strong> <a href="tel:${escapeText(item.phone)}">${escapeText(item.phone)}</a></p>${item.details ? `<p><strong>Détails :</strong> ${escapeText(item.details)}</p>` : ''}<p class="created-date">Demande reçue le ${escapeText(new Date(item.created_at).toLocaleString('fr-FR'))}</p></div><div class="appointment-actions"><label for="status-${item.id}">Statut</label><select id="status-${item.id}" data-status-id="${item.id}">${Object.entries(labels).map(([key,label])=>`<option value="${key}" ${item.status===key?'selected':''}>${label}</option>`).join('')}</select><button class="button button-small button-dark" data-save-id="${item.id}">Enregistrer</button><button class="button button-small button-danger" data-delete-id="${item.id}">Supprimer</button></div></article>`).join('');
  }
  async function refreshSession() {
    if (!client) { loginPanel.hidden = false; dashboard.hidden = true; configuredMessage(); return; }
    const { data: { session } } = await client.auth.getSession();
    loginPanel.hidden = !!session; dashboard.hidden = !session;
    if (session) { document.querySelector('#signed-in-as').textContent = `Connecté : ${session.user.email}`; await loadAppointments(); }
  }
  loginForm.addEventListener('submit', async e => {
    e.preventDefault(); if (!client) return configuredMessage();
    const button = document.querySelector('#login-button'); button.disabled = true;
    const { error } = await client.auth.signInWithPassword({ email: document.querySelector('#login-email').value.trim(), password: document.querySelector('#login-password').value });
    button.disabled = false;
    if (error) { message(loginMessage, 'Connexion impossible. Vérifiez vos identifiants et que le compte a été autorisé par un administrateur.', 'error'); return; }
    loginMessage.hidden = true; await refreshSession();
  });
  document.querySelector('#logout-button').addEventListener('click', async () => { if (client) { await client.auth.signOut(); await refreshSession(); } });
  document.querySelector('#refresh-button').addEventListener('click', loadAppointments);
  statusFilter.addEventListener('change', loadAppointments); companyFilter.addEventListener('change', loadAppointments);
  list.addEventListener('click', async e => {
    if (!client) return;
    const save = e.target.closest('[data-save-id]');
    const del = e.target.closest('[data-delete-id]');
    if (save) {
      const id = save.dataset.saveId, select = document.querySelector(`[data-status-id="${CSS.escape(id)}"]`);
      save.disabled = true;
      const { error } = await client.from('appointments').update({ status: select.value, updated_at: new Date().toISOString() }).eq('id', id);
      save.disabled = false;
      if (error) message(adminMessage, 'Le statut n’a pas pu être modifié. Vérifiez les droits administrateur.', 'error'); else { message(adminMessage, 'Statut mis à jour.', 'success'); await loadAppointments(); }
    }
    if (del) {
      if (!window.confirm('Supprimer définitivement cette demande ?')) return;
      del.disabled = true;
      const { error } = await client.from('appointments').delete().eq('id', del.dataset.deleteId);
      if (error) { del.disabled = false; message(adminMessage, 'La demande n’a pas pu être supprimée.', 'error'); } else { message(adminMessage, 'Demande supprimée.', 'success'); await loadAppointments(); }
    }
  });
  if (client) client.auth.onAuthStateChange(() => { setTimeout(refreshSession, 0); });
  refreshSession();
})();
