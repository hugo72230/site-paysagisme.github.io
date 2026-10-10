(() => {
  const form = document.querySelector('#booking-form');
  if (!form) return;
  const message = document.querySelector('#form-message');
  const submit = document.querySelector('#submit-booking');
  const dateInput = document.querySelector('#date');
  const localToday = new Date();
  dateInput.min = `${localToday.getFullYear()}-${String(localToday.getMonth()+1).padStart(2,'0')}-${String(localToday.getDate()).padStart(2,'0')}`;
  const config = window.SITE_CONFIG || {};
  const configured = config.SUPABASE_URL && !config.SUPABASE_URL.includes('VOTRE-PROJET') && config.SUPABASE_ANON_KEY && !config.SUPABASE_ANON_KEY.includes('VOTRE_CLE');
  const client = configured && window.supabase ? window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY) : null;
  function show(text, type) { message.hidden = false; message.className = `form-message ${type}`; message.textContent = text; }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (form.website.value) return; // champ piège anti-spam
    if (!form.reportValidity()) return;
    if (!client) { show('Le formulaire est prêt, mais la connexion Supabase n’est pas encore configurée. Suivez le fichier LISEZ-MOI.md pour connecter la base de données.', 'error'); return; }
    submit.disabled = true; submit.textContent = 'Envoi en cours…';
    const data = {
      company: form.company.value,
      service: form.service.value,
      customer_name: form.elements.namedItem('name').value.trim(),
      email: form.elements.namedItem('email').value.trim(),
      phone: form.elements.namedItem('phone').value.trim(),
      preferred_date: form.elements.namedItem('date').value,
      city: form.elements.namedItem('city').value.trim(),
      details: form.elements.namedItem('details').value.trim() || null,
      status: 'pending'
    };
    try {
      const { error } = await client.from('appointments').insert(data);
      if (error) throw error;
      form.reset();
      show('Votre demande a bien été envoyée. Elle est en attente de validation. Nous vous recontacterons pour confirmer les détails.', 'success');
    } catch (err) {
      console.error('Erreur d’envoi de demande :', err);
      show('Impossible d’envoyer la demande pour le moment. Vérifiez la configuration Supabase et réessayez plus tard.', 'error');
    } finally { submit.disabled = false; submit.innerHTML = 'Envoyer ma demande <span>↗</span>'; }
  });
})();
