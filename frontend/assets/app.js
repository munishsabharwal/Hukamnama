
window.App = (function(){
  async function me(){
    try {
      const r = await fetch('/.auth/me');
      const p = await r.json();
      return p.clientPrincipal || null;
    } catch { return null; }
  }
  function setAuthUI(principal){
    const roles = new Set(principal?.userRoles || ['anonymous']);
    const signedIn = !!principal;
    const adminLink = document.getElementById('adminLink');
    const editorLink = document.getElementById('editorLink');
    const signin = document.getElementById('signin');
    const signout = document.getElementById('signout');
    if(adminLink) adminLink.style.display = roles.has('admin') ? '' : 'none';
    if(editorLink) editorLink.style.display = (roles.has('admin')||roles.has('editor')) ? '' : 'none';
    if(signin) signin.style.display = signedIn ? 'none' : '';
    if(signout) signout.style.display = signedIn ? '' : 'none';
  }

  async function loadGurudwaras(selectId){
    // Static list for now; replace with fetch from config if needed
    const list = [
      {code:'GTB', name:'Guru Tegh Bahadur'},
      {code:'DLS', name:'Dixie Lakkar Singh'}
    ];
    const sel = document.getElementById(selectId);
    if(!sel) return list;
    list.forEach(g=>{
      const o = document.createElement('option');
      o.value = g.code; o.textContent = `${g.code} — ${g.name}`;
      sel.appendChild(o);
    });
    return list;
  }

  function fmtDate(d){
    return (d || new Date()).toISOString().slice(0,10);
  }

  async function initPublic(){
    const principal = await me();
    setAuthUI(principal);
    // date init
    const dateInput = document.getElementById('datePicker');
    dateInput.value = fmtDate(new Date());
    await loadGurudwaras('gSelect');

    async function refresh(){
      const date = dateInput.value;
      const g = document.getElementById('gSelect').value || '';
      const url = new URL('/api/hukams/getDaily', location.origin);
      if(date) url.searchParams.set('date', date);
      if(g) url.searchParams.set('gurudwara', g);
      const r = await fetch(url);
      const items = await r.json();
      const wrap = document.getElementById('cards');
      wrap.innerHTML = '';
      items.forEach(i=>{
        const div = document.createElement('div');
        div.className = 'card';
        div.innerHTML = `
          <div class="small">${i.gurudwaraCode} | ${i.date}</div>
          <div style="margin:6px 0; font-size:16px; line-height:1.5">${(i.hukam?.gurmukhi||'')}</div>
          <div class="small">${(i.hukam?.translation_en||'')}</div>
        `;
        wrap.appendChild(div);
      });
    }

    document.getElementById('datePicker').addEventListener('change', refresh);
    document.getElementById('gSelect').addEventListener('change', refresh);
    refresh();
  }

  async function initEditor(){
    const principal = await me();
    setAuthUI(principal);
    const roles = new Set(principal?.userRoles || []);
    if(!(roles.has('editor') || roles.has('admin'))){
      const no = document.getElementById('noAccess');
      if(no) no.style.display = '';
      return;
    }
    const pubDate = document.getElementById('pubDate');
    pubDate.value = fmtDate(new Date());
    await loadGurudwaras('eGSelect');

    // Load library
    const lib = await (await fetch('/api/hukams/getLibrary')).json();
    const sel = document.getElementById('hukamSelect');
    lib.forEach(h=>{
      const o = document.createElement('option');
      o.value = h.id; o.textContent = `${h.id} — ${(h.raags||[]).join(', ')} | ${(h.tags||[]).join(', ')}`;
      sel.appendChild(o);
    });

    document.getElementById('publishBtn').addEventListener('click', async ()=>{
      const body = {
        hukamId: sel.value,
        date: pubDate.value,
        gurudwaraCode: document.getElementById('eGSelect').value
      };
      const r = await fetch('/api/hukams/publishDaily', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)
      });
      document.getElementById('pubResult').textContent = r.ok ? 'Published.' : (await r.text());
    });
  }

  async function initAdmin(){
    const principal = await me();
    setAuthUI(principal);
    const roles = new Set(principal?.userRoles || []);
    if(!roles.has('admin')){
      const no = document.getElementById('noAccess');
      if(no) no.style.display = '';
      return;
    }
    document.getElementById('saveEditorBtn').addEventListener('click', async ()=>{
      const email = document.getElementById('edEmail').value.trim();
      const gurudwaras = document.getElementById('edGurdwaras').value.trim();
      const role = document.getElementById('edRole').value;
      const r = await fetch('/api/admin/saveUser', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, role, gurudwaraCodes: gurudwaras.split(',').map(s=>s.trim()).filter(Boolean)})});
      alert(r.ok ? 'Saved' : 'Error saving user');
    });

    document.getElementById('sendInviteBtn').addEventListener('click', async ()=>{
      const email = document.getElementById('inviteEmail').value.trim();
      const gurudwaras = document.getElementById('inviteGurdwaras').value.trim();
      const r = await fetch('/api/admin/sendInvite', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, gurudwaraCodes: gurudwaras.split(',').map(s=>s.trim()).filter(Boolean)})});
      document.getElementById('inviteResult').textContent = r.ok ? 'Invite sent.' : (await r.text());
    });
  }

  return { initPublic, initEditor, initAdmin };
})();
