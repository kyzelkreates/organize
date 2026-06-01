import { getState, setState, generateId, createTimestamp, updateTimestamp } from '../storage.js';
import { showModal } from '../components/Modal.js';
import { showToast } from '../components/Toast.js';
import { renderEmptyState } from '../components/EmptyState.js';
import { formatRelativeTime, truncateText } from '../utils/formatters.js';

const AI_PROVIDERS = [
  { id:'groq',       name:'Groq',          url:'https://console.groq.com/keys',           docs:'https://console.groq.com/docs',       free:true,  models:['llama3-8b-8192','llama3-70b-8192','mixtral-8x7b-32768','gemma2-9b-it','llama-3.1-8b-instant'] },
  { id:'openrouter', name:'OpenRouter',     url:'https://openrouter.ai/keys',              docs:'https://openrouter.ai/docs',           free:true,  models:['mistralai/mistral-7b-instruct:free','meta-llama/llama-3.1-8b-instruct:free','google/gemma-2-9b-it:free','qwen/qwen-2-7b-instruct:free'] },
  { id:'huggingface',name:'Hugging Face',   url:'https://huggingface.co/settings/tokens',  docs:'https://huggingface.co/docs/api-inference', free:true, models:['mistralai/Mistral-7B-Instruct-v0.3','HuggingFaceH4/zephyr-7b-beta','microsoft/DialoGPT-medium'] },
  { id:'together',   name:'Together AI',    url:'https://api.together.xyz/settings/api-keys', docs:'https://docs.together.ai', free:false, models:['meta-llama/Llama-3-8b-chat-hf','mistralai/Mistral-7B-Instruct-v0.3','google/gemma-2b-it'] },
  { id:'cohere',     name:'Cohere',         url:'https://dashboard.cohere.com/api-keys',   docs:'https://docs.cohere.com',              free:true,  models:['command-r','command-r-plus','command-light'] },
  { id:'mistral',    name:'Mistral AI',     url:'https://console.mistral.ai/api-keys/',    docs:'https://docs.mistral.ai',              free:false, models:['mistral-small-latest','mistral-medium-latest','open-mistral-7b'] },
  { id:'openai',     name:'OpenAI',         url:'https://platform.openai.com/api-keys',    docs:'https://platform.openai.com/docs',     free:false, models:['gpt-4o-mini','gpt-4o','gpt-3.5-turbo'] },
  { id:'anthropic',  name:'Anthropic',      url:'https://console.anthropic.com/settings/keys', docs:'https://docs.anthropic.com',       free:false, models:['claude-3-haiku-20240307','claude-3-sonnet-20240229'] },
  { id:'custom',     name:'Custom / Other', url:'',                                        docs:'',                                     free:true,  models:[] },
];

const KEY_CATEGORIES = ['AI / LLM','Database','Deployment','Maps & Geo','Payments','Storage','Auth','Monitoring','Other'];

export function renderKeyVault(state) {
  const keys = state.keys || [];
  const params = new URLSearchParams(window.location.hash.split('?')[1]||'');
  const search = params.get('q')||'';
  const filterCat = params.get('cat')||'';

  let filtered = [...keys];
  if (search) { const q=search.toLowerCase(); filtered=filtered.filter(k=>k.name.toLowerCase().includes(q)||(k.provider||'').toLowerCase().includes(q)||(k.category||'').toLowerCase().includes(q)); }
  if (filterCat) filtered=filtered.filter(k=>k.category===filterCat);
  filtered.sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));

  const aiKeys = keys.filter(k=>k.category==='AI / LLM');
  const testedKeys = keys.filter(k=>k.lastTestStatus==='ok');
  const failedKeys = keys.filter(k=>k.lastTestStatus==='fail');

  return `
    <div class="page-header">
      <div class="page-title">Key Vault</div>
      <div class="page-subtitle">Store, test, and manage API keys for all your projects and AI providers. Keys are saved locally — never sent anywhere.</div>
    </div>

    <div class="stat-grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr));margin-bottom:24px;">
      <div class="stat-card" style="--stat-color:#00f5ff"><div class="stat-card-value">${keys.length}</div><div class="stat-card-label">Total Keys</div></div>
      <div class="stat-card" style="--stat-color:#7c3aed"><div class="stat-card-value">${aiKeys.length}</div><div class="stat-card-label">AI Keys</div></div>
      <div class="stat-card" style="--stat-color:#10b981"><div class="stat-card-value">${testedKeys.length}</div><div class="stat-card-label">Verified ✓</div></div>
      <div class="stat-card" style="--stat-color:#ef4444"><div class="stat-card-value">${failedKeys.length}</div><div class="stat-card-label">Failed ✗</div></div>
    </div>

    <div class="notice mb-16">
      <span class="notice-icon">🔒</span>
      <span>Keys are stored only in your browser's localStorage. They are <strong>never sent to any server</strong> by this app. You test them directly from your browser to the provider's API.</span>
    </div>

    <div class="toolbar">
      <div class="search-box"><span class="search-icon">⌕</span><input class="search-input" id="key-search" placeholder="Search keys…" value="${search}" /></div>
      <select class="form-select" style="width:auto;" id="filter-key-cat">
        <option value="">All Categories</option>
        ${KEY_CATEGORIES.map(c=>`<option value="${c}" ${filterCat===c?'selected':''}>${c}</option>`).join('')}
      </select>
      <button class="btn btn-primary" id="btn-new-key">+ Add Key</button>
    </div>

    <!-- AI PROVIDER QUICK ADD -->
    <div class="section">
      <div class="section-header"><span class="section-title">AI Providers — Quick Add</span></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-bottom:24px;">
        ${AI_PROVIDERS.map(p=>{
          const hasKey = keys.find(k=>k.providerId===p.id);
          return `<div class="ai-provider-chip ${hasKey?'has-key':''}" data-quick-add="${p.id}" style="background:var(--card);border:1px solid ${hasKey?'rgba(0,245,255,0.35)':'var(--border)'};border-radius:10px;padding:12px 14px;cursor:pointer;transition:all 0.18s;display:flex;flex-direction:column;gap:4px;" title="Add ${p.name} key">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:13px;font-weight:600;color:${hasKey?'var(--accent)':'var(--text)'};">${p.name}</span>
              ${hasKey?'<span style="color:var(--success);font-size:12px;">✓</span>':'<span style="color:var(--text3);font-size:16px;">+</span>'}
            </div>
            <span style="font-size:10px;color:${p.free?'var(--success)':'var(--text3)'};">${p.free?'Free tier':'Paid'}</span>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- KEY LIST -->
    <div id="keys-list">
      ${filtered.length===0
        ? renderEmptyState({icon:'🔑',title:'No keys yet',desc:'Add your first API key to get started.',action:'<button class="btn btn-primary" id="btn-new-key-2">+ Add Key</button>'})
        : filtered.map(k=>renderKeyCard(k, keys)).join('')
      }
    </div>
  `;
}

function renderKeyCard(k, allKeys) {
  const statusColor = k.lastTestStatus==='ok'?'#10b981':k.lastTestStatus==='fail'?'#ef4444':'#64748b';
  const statusLabel = k.lastTestStatus==='ok'?'✓ Verified':k.lastTestStatus==='fail'?'✗ Failed':'Not tested';
  const maskedKey = k.keyValue ? '•'.repeat(Math.min(20,k.keyValue.length-4)) + k.keyValue.slice(-4) : '—';
  const provider = AI_PROVIDERS.find(p=>p.id===k.providerId);
  return `<div class="card" id="key-${k.id}" style="border-left:3px solid ${statusColor};">
    <div class="card-header">
      <div style="flex:1;min-width:0;">
        <div class="card-title" style="display:flex;align-items:center;gap:8px;">
          ${truncateText(k.name,50)}
          <span style="font-size:11px;color:${statusColor};background:${statusColor}22;border:1px solid ${statusColor}44;padding:2px 8px;border-radius:20px;">${statusLabel}</span>
        </div>
        <div class="card-meta">
          <span class="badge badge-tag">${k.category||'Other'}</span>
          ${k.providerId&&k.providerId!=='custom'?`<span style="color:var(--accent);font-size:11px;">${provider?.name||k.providerId}</span>`:''}
          ${k.linkedProjectName?`<span>→ ${k.linkedProjectName}</span>`:''}
          <span>${formatRelativeTime(k.updatedAt)}</span>
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;flex-shrink:0;">
        <button class="btn btn-xs btn-secondary" data-test-key="${k.id}" title="Test this key">⚡ Test</button>
        <button class="btn btn-xs btn-secondary" data-copy-key="${k.id}" title="Copy key">⎘ Copy</button>
        <button class="btn btn-xs btn-secondary" data-edit-key="${k.id}">✎</button>
        <button class="btn btn-xs btn-danger" data-delete-key="${k.id}">✕</button>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;margin-top:8px;">
      <code style="font-family:monospace;font-size:12px;color:var(--text3);background:var(--bg3);padding:4px 10px;border-radius:6px;flex:1;">${maskedKey}</code>
      <button class="btn btn-xs btn-ghost" data-reveal-key="${k.id}" title="Show/hide">${k._revealed?'Hide':'Show'}</button>
    </div>
    ${k.notes?`<div class="card-desc mt-8">${truncateText(k.notes,100)}</div>`:''}
    ${k.selectedModel?`<div style="margin-top:8px;font-size:11px;color:var(--text3);">Model: <span style="color:var(--accent);">${k.selectedModel}</span></div>`:''}
    ${k.lastTestMessage?`<div style="margin-top:8px;font-size:11px;color:${statusColor};background:${statusColor}11;border-radius:6px;padding:6px 10px;">${truncateText(k.lastTestMessage,120)}</div>`:''}
  </div>`;
}

// ── EVENT HANDLERS ────────────────────────────────────────────────────────────

document.addEventListener('click', e => {
  if (e.target.matches('#btn-new-key,#btn-new-key-2')) openKeyModal(null);

  const qa = e.target.closest('[data-quick-add]');
  if (qa) { const pid=qa.dataset.quickAdd; const p=AI_PROVIDERS.find(x=>x.id===pid); openKeyModal(null,p); }

  const editBtn = e.target.closest('[data-edit-key]');
  if (editBtn) { const k=getKey(editBtn.dataset.editKey); if(k) openKeyModal(k); }

  const delBtn = e.target.closest('[data-delete-key]');
  if (delBtn&&confirm('Delete this key?')) { deleteKey(delBtn.dataset.deleteKey); }

  const copyBtn = e.target.closest('[data-copy-key]');
  if (copyBtn) { const k=getKey(copyBtn.dataset.copyKey); if(k&&k.keyValue) { navigator.clipboard.writeText(k.keyValue).then(()=>showToast('Key copied!','success')); } }

  const revealBtn = e.target.closest('[data-reveal-key]');
  if (revealBtn) { toggleReveal(revealBtn.dataset.revealKey, revealBtn); }

  const testBtn = e.target.closest('[data-test-key]');
  if (testBtn) { testKey(testBtn.dataset.testKey, testBtn); }
});

document.addEventListener('change', e => {
  if (e.target.matches('#filter-key-cat')) {
    const p=getKP(); p.cat=e.target.value; window.location.hash=buildKH(p);
  }
});

document.addEventListener('input', e => {
  if (e.target.matches('#key-search')) {
    clearTimeout(window._ksd);
    window._ksd=setTimeout(()=>{const p=getKP();p.q=e.target.value;window.location.hash=buildKH(p);},300);
  }
});

function getKP(){const u=new URLSearchParams(window.location.hash.split('?')[1]||'');return{q:u.get('q')||'',cat:u.get('cat')||''};}
function buildKH(p){const parts=[];if(p.q)parts.push('q='+encodeURIComponent(p.q));if(p.cat)parts.push('cat='+encodeURIComponent(p.cat));return'/key-vault'+(parts.length?'?'+parts.join('&'):'');}
function getKey(id){return (getState().keys||[]).find(k=>k.id===id);}

function toggleReveal(id, btn) {
  const card = document.getElementById('key-'+id);
  if (!card) return;
  const code = card.querySelector('code');
  const k = getKey(id);
  if (!k) return;
  const isRevealed = btn.textContent==='Hide';
  if (isRevealed) {
    const masked = '•'.repeat(Math.min(20,k.keyValue.length-4))+k.keyValue.slice(-4);
    code.textContent = masked;
    btn.textContent = 'Show';
  } else {
    code.textContent = k.keyValue;
    btn.textContent = 'Hide';
  }
}

async function testKey(id, btn) {
  const k = getKey(id);
  if (!k) return;
  btn.textContent = '⏳ Testing…';
  btn.disabled = true;
  const provider = AI_PROVIDERS.find(p=>p.id===k.providerId);
  let result = { ok: false, message: 'Unknown provider — cannot auto-test.' };
  try {
    if (k.providerId==='groq') result = await testGroq(k);
    else if (k.providerId==='openrouter') result = await testOpenRouter(k);
    else if (k.providerId==='huggingface') result = await testHuggingFace(k);
    else if (k.providerId==='together') result = await testTogether(k);
    else if (k.providerId==='cohere') result = await testCohere(k);
    else if (k.providerId==='mistral') result = await testMistral(k);
    else if (k.providerId==='openai') result = await testOpenAI(k);
    else if (k.providerId==='anthropic') result = await testAnthropic(k);
    else result = { ok: false, message: 'No test available for this provider. Try copying and using the key manually.' };
  } catch(err) {
    result = { ok: false, message: err.message || 'Network error during test.' };
  }
  updateKeyTestResult(id, result);
  btn.textContent = '⚡ Test';
  btn.disabled = false;
  showToast(result.ok ? '✓ Key verified!' : '✗ Test failed — see card for details.', result.ok?'success':'error');
}

function updateKeyTestResult(id, result) {
  setState(s => ({
    ...s,
    keys: (s.keys||[]).map(k => k.id===id ? {
      ...k,
      lastTestStatus: result.ok?'ok':'fail',
      lastTestMessage: result.message,
      lastTestedAt: createTimestamp(),
      updatedAt: updateTimestamp()
    } : k),
    activityLog: [{ id:generateId(), action:'KEY_TESTED', label:`Tested key: ${getKey(id)?.name} — ${result.ok?'✓ OK':'✗ Failed'}`, timestamp:createTimestamp() }, ...(s.activityLog||[])]
  }));
}

// ── PROVIDER TEST FUNCTIONS ──────────────────────────────────────────────────

async function testGroq(k) {
  const model = k.selectedModel||'llama3-8b-8192';
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:'POST', headers:{'Authorization':'Bearer '+k.keyValue,'Content-Type':'application/json'},
    body: JSON.stringify({model, messages:[{role:'user',content:'Say "AP3X key verified" in 3 words.'}], max_tokens:20})
  });
  const data = await res.json();
  if (res.ok && data.choices?.[0]) return { ok:true, message:'✓ Groq OK — '+model+': "'+data.choices[0].message.content.trim()+'"' };
  return { ok:false, message: data.error?.message||'Groq error: '+res.status };
}

async function testOpenRouter(k) {
  const model = k.selectedModel||'mistralai/mistral-7b-instruct:free';
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method:'POST', headers:{'Authorization':'Bearer '+k.keyValue,'Content-Type':'application/json','HTTP-Referer':'https://ap3x-os.local','X-Title':'AP3X OS'},
    body: JSON.stringify({model, messages:[{role:'user',content:'Say "verified" only.'}], max_tokens:10})
  });
  const data = await res.json();
  if (res.ok && data.choices?.[0]) return { ok:true, message:'✓ OpenRouter OK — '+model+': "'+data.choices[0].message.content.trim()+'"' };
  return { ok:false, message: data.error?.message||'OpenRouter error: '+res.status };
}

async function testHuggingFace(k) {
  const model = k.selectedModel||'mistralai/Mistral-7B-Instruct-v0.3';
  const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method:'POST', headers:{'Authorization':'Bearer '+k.keyValue,'Content-Type':'application/json'},
    body: JSON.stringify({inputs:'Reply with just the word: verified'})
  });
  const data = await res.json();
  if (res.ok) return { ok:true, message:'✓ HuggingFace OK — model responded.' };
  return { ok:false, message: data.error||'HuggingFace error: '+res.status };
}

async function testTogether(k) {
  const model = k.selectedModel||'meta-llama/Llama-3-8b-chat-hf';
  const res = await fetch('https://api.together.xyz/v1/chat/completions', {
    method:'POST', headers:{'Authorization':'Bearer '+k.keyValue,'Content-Type':'application/json'},
    body: JSON.stringify({model, messages:[{role:'user',content:'Say verified.'}], max_tokens:10})
  });
  const data = await res.json();
  if (res.ok && data.choices?.[0]) return { ok:true, message:'✓ Together AI OK — '+model };
  return { ok:false, message: data.error?.message||'Together error: '+res.status };
}

async function testCohere(k) {
  const res = await fetch('https://api.cohere.com/v1/chat', {
    method:'POST', headers:{'Authorization':'Bearer '+k.keyValue,'Content-Type':'application/json'},
    body: JSON.stringify({model:k.selectedModel||'command-r',message:'Say verified.'})
  });
  const data = await res.json();
  if (res.ok && data.text) return { ok:true, message:'✓ Cohere OK: "'+data.text.slice(0,60)+'"' };
  return { ok:false, message: data.message||'Cohere error: '+res.status };
}

async function testMistral(k) {
  const model = k.selectedModel||'mistral-small-latest';
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method:'POST', headers:{'Authorization':'Bearer '+k.keyValue,'Content-Type':'application/json'},
    body: JSON.stringify({model, messages:[{role:'user',content:'Say verified.'}], max_tokens:10})
  });
  const data = await res.json();
  if (res.ok && data.choices?.[0]) return { ok:true, message:'✓ Mistral OK — '+model };
  return { ok:false, message: data.message||'Mistral error: '+res.status };
}

async function testOpenAI(k) {
  const model = k.selectedModel||'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method:'POST', headers:{'Authorization':'Bearer '+k.keyValue,'Content-Type':'application/json'},
    body: JSON.stringify({model, messages:[{role:'user',content:'Say verified.'}], max_tokens:10})
  });
  const data = await res.json();
  if (res.ok && data.choices?.[0]) return { ok:true, message:'✓ OpenAI OK — '+model };
  return { ok:false, message: data.error?.message||'OpenAI error: '+res.status };
}

async function testAnthropic(k) {
  const model = k.selectedModel||'claude-3-haiku-20240307';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST', headers:{'x-api-key':k.keyValue,'anthropic-version':'2023-06-01','Content-Type':'application/json'},
    body: JSON.stringify({model, max_tokens:20, messages:[{role:'user',content:'Say verified.'}]})
  });
  const data = await res.json();
  if (res.ok && data.content?.[0]) return { ok:true, message:'✓ Anthropic OK — '+model };
  return { ok:false, message: data.error?.message||'Anthropic error: '+res.status };
}

// ── MODAL ────────────────────────────────────────────────────────────────────

function openKeyModal(key, prefillProvider=null) {
  const isEdit=!!key, k=key||{};
  const state=getState();
  const defaultProvider = prefillProvider || AI_PROVIDERS.find(p=>p.id===k.providerId) || null;
  const isAI = k.category==='AI / LLM' || prefillProvider?.id;

  const body=`
    <div class="form-group">
      <label class="form-label">Key Name *</label>
      <input class="form-input" id="km-name" value="${k.name||''}" placeholder="${defaultProvider?defaultProvider.name+' API Key':'My API Key'}" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-select" id="km-cat">
          ${KEY_CATEGORIES.map(c=>`<option value="${c}" ${(k.category||'AI / LLM')===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">AI Provider</label>
        <select class="form-select" id="km-provider">
          <option value="">None / Custom</option>
          ${AI_PROVIDERS.map(p=>`<option value="${p.id}" ${(k.providerId||defaultProvider?.id)===p.id?'selected':''}>${p.name}${p.free?' (free)':''}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group" id="km-model-group" style="${isAI?'':'display:none;'}">
      <label class="form-label">Model to Use</label>
      <select class="form-select" id="km-model">
        ${(defaultProvider?.models||[]).map(m=>`<option value="${m}" ${k.selectedModel===m?'selected':''}>${m}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">API Key *</label>
      <div style="position:relative;">
        <input class="form-input" id="km-value" type="password" value="${k.keyValue||''}" placeholder="sk-… or gsk_… or hf_…" style="padding-right:70px;" />
        <button type="button" class="btn btn-xs btn-ghost" id="km-toggle-vis" style="position:absolute;right:6px;top:50%;transform:translateY(-50%);">Show</button>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Linked Project (optional)</label>
      <select class="form-select" id="km-project">
        <option value="">None</option>
        ${state.projects.filter(p=>p.status!=='Archived').map(p=>`<option value="${p.id}" ${k.linkedProjectId===p.id?'selected':''}>${p.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Custom Endpoint (optional)</label>
      <input class="form-input" id="km-endpoint" value="${k.endpoint||''}" placeholder="https://api.example.com/v1" />
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea class="form-textarea" id="km-notes" rows="2" placeholder="What is this key for? Rotation date?">${k.notes||''}</textarea>
    </div>
    ${defaultProvider?.url?`<div class="notice mt-4"><span class="notice-icon">🔗</span><span>Get your key at: <a href="${defaultProvider.url}" target="_blank" rel="noopener" style="color:var(--accent);">${defaultProvider.url}</a></span></div>`:''}
    <div id="km-errors" class="text-danger text-sm mt-8"></div>
  `;

  const footer=`
    ${isEdit?`<button class="btn btn-danger" id="km-delete">Delete</button>`:''}
    <button class="btn btn-ghost" id="km-cancel">Cancel</button>
    <button class="btn btn-primary" id="km-save">${isEdit?'Save':'Add Key'}</button>
  `;

  const modal=showModal({title:isEdit?'Edit Key':'Add API Key',body,footer});

  // Toggle show/hide password
  document.getElementById('km-toggle-vis').addEventListener('click',()=>{
    const inp=document.getElementById('km-value');
    const btn=document.getElementById('km-toggle-vis');
    inp.type=inp.type==='password'?'text':'password';
    btn.textContent=inp.type==='password'?'Show':'Hide';
  });

  // Update model list when provider changes
  document.getElementById('km-provider').addEventListener('change',()=>{
    const pid=document.getElementById('km-provider').value;
    const prov=AI_PROVIDERS.find(p=>p.id===pid);
    const mg=document.getElementById('km-model-group');
    const ms=document.getElementById('km-model');
    if(prov&&prov.models.length>0){mg.style.display='';ms.innerHTML=prov.models.map(m=>`<option value="${m}">${m}</option>`).join('');}
    else{mg.style.display='none';ms.innerHTML='';}
    // Also set category to AI/LLM if AI provider
    if(prov&&prov.id!=='custom') document.getElementById('km-cat').value='AI / LLM';
  });

  document.getElementById('km-cancel').addEventListener('click',()=>modal.close());
  document.getElementById('km-save').addEventListener('click',()=>{
    const name=document.getElementById('km-name').value.trim();
    const keyValue=document.getElementById('km-value').value.trim();
    if(!name){document.getElementById('km-errors').textContent='Key name is required.';return;}
    if(!keyValue){document.getElementById('km-errors').textContent='API key value is required.';return;}
    const projId=document.getElementById('km-project').value||null;
    const projName=projId?state.projects.find(p=>p.id===projId)?.name:null;
    const data={name,category:document.getElementById('km-cat').value,providerId:document.getElementById('km-provider').value||'custom',selectedModel:document.getElementById('km-model').value||null,keyValue,linkedProjectId:projId,linkedProjectName:projName,endpoint:document.getElementById('km-endpoint').value.trim()||null,notes:document.getElementById('km-notes').value.trim()};
    const final=isEdit?{...k,...data,updatedAt:updateTimestamp()}:{id:generateId(),...data,lastTestStatus:null,lastTestMessage:null,lastTestedAt:null,createdAt:createTimestamp(),updatedAt:createTimestamp()};
    setState(s=>({...s,keys:isEdit?(s.keys||[]).map(x=>x.id===final.id?final:x):[final,...(s.keys||[])],activityLog:[{id:generateId(),action:isEdit?'KEY_UPDATED':'KEY_ADDED',label:`${isEdit?'Updated':'Added'} key: ${final.name}`,timestamp:createTimestamp()},...(s.activityLog||[])]}));
    showToast(isEdit?'Key updated.':'Key added.','success');
    modal.close();
  });

  if(isEdit){
    document.getElementById('km-delete')?.addEventListener('click',()=>{
      if(confirm('Delete this key? This cannot be undone.')) { deleteKey(k.id); modal.close(); }
    });
  }
}

function deleteKey(id) {
  const k=getKey(id);
  setState(s=>({...s,keys:(s.keys||[]).filter(x=>x.id!==id),activityLog:[{id:generateId(),action:'KEY_DELETED',label:`Deleted key: ${k?.name}`,timestamp:createTimestamp()},...(s.activityLog||[])]}));
  showToast('Key deleted.','info');
}
