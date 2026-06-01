import { getState, setState, generateId, createTimestamp } from '../storage.js';
import { showToast } from '../components/Toast.js';
import { renderEmptyState } from '../components/EmptyState.js';
import { truncateText } from '../utils/formatters.js';

const AI_PROVIDERS = [
  { id:'groq',       name:'Groq',         endpoint:'https://api.groq.com/openai/v1/chat/completions',          authHeader:k=>'Bearer '+k, type:'openai-compat' },
  { id:'openrouter', name:'OpenRouter',   endpoint:'https://openrouter.ai/api/v1/chat/completions',            authHeader:k=>'Bearer '+k, type:'openai-compat', extraHeaders:{'HTTP-Referer':'https://ap3x-os.local','X-Title':'AP3X OS'} },
  { id:'together',   name:'Together AI',  endpoint:'https://api.together.xyz/v1/chat/completions',             authHeader:k=>'Bearer '+k, type:'openai-compat' },
  { id:'cohere',     name:'Cohere',       endpoint:'https://api.cohere.com/v1/chat',                           authHeader:k=>'Bearer '+k, type:'cohere' },
  { id:'mistral',    name:'Mistral AI',   endpoint:'https://api.mistral.ai/v1/chat/completions',               authHeader:k=>'Bearer '+k, type:'openai-compat' },
  { id:'openai',     name:'OpenAI',       endpoint:'https://api.openai.com/v1/chat/completions',               authHeader:k=>'Bearer '+k, type:'openai-compat' },
  { id:'anthropic',  name:'Anthropic',    endpoint:'https://api.anthropic.com/v1/messages',                    authHeader:k=>k, type:'anthropic' },
  { id:'huggingface',name:'Hugging Face', endpoint:'https://api-inference.huggingface.co/models/',             authHeader:k=>'Bearer '+k, type:'hf' },
];

export function renderAIPlayground(state) {
  const keys = (state.keys||[]).filter(k=>k.category==='AI / LLM'&&k.keyValue);
  const history = state.aiChatHistory||[];

  return `
    <div class="page-header">
      <div class="page-title">AI Playground</div>
      <div class="page-subtitle">Test your AI keys, compare models, and run prompts from your vault — all locally.</div>
    </div>

    ${keys.length===0 ? `
      ${renderEmptyState({icon:'🤖',title:'No AI keys yet',desc:'Add an AI key in the Key Vault first, then come back to test it here.',action:'<button class="btn btn-primary" data-nav="/key-vault">Go to Key Vault →</button>'})}
    ` : `
      <div style="display:grid;grid-template-columns:1fr 360px;gap:24px;align-items:start;">
        <!-- CHAT AREA -->
        <div>
          <div class="card" style="padding:0;overflow:hidden;">
            <!-- Config bar -->
            <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;gap:12px;flex-wrap:wrap;align-items:center;background:var(--bg3);">
              <div style="flex:1;min-width:160px;">
                <label class="form-label" style="margin-bottom:4px;">Key</label>
                <select class="form-select" id="pg-key" style="padding:6px 10px;font-size:12px;">
                  ${keys.map(k=>`<option value="${k.id}">[${k.providerId?.toUpperCase()||'?'}] ${truncateText(k.name,30)} ${k.selectedModel?'— '+k.selectedModel.split('/').pop():''}</option>`).join('')}
                </select>
              </div>
              <div style="flex:1;min-width:160px;">
                <label class="form-label" style="margin-bottom:4px;">Model override (optional)</label>
                <input class="form-input" id="pg-model-override" style="padding:6px 10px;font-size:12px;" placeholder="Leave blank to use key's model" />
              </div>
              <div style="min-width:80px;">
                <label class="form-label" style="margin-bottom:4px;">Max tokens</label>
                <input class="form-input" id="pg-max-tokens" style="padding:6px 10px;font-size:12px;width:90px;" type="number" value="512" min="10" max="4096" />
              </div>
              <div>
                <label class="form-label" style="margin-bottom:4px;">Temp</label>
                <input class="form-input" id="pg-temp" style="padding:6px 10px;font-size:12px;width:70px;" type="number" value="0.7" min="0" max="2" step="0.1" />
              </div>
            </div>

            <!-- System prompt -->
            <div style="padding:10px 18px;border-bottom:1px solid var(--border);background:var(--bg2);">
              <label class="form-label" style="margin-bottom:4px;">System prompt</label>
              <textarea class="form-textarea" id="pg-system" rows="2" style="min-height:unset;font-size:12px;" placeholder="You are a helpful coding assistant…">You are AP3X AI — a sharp, expert software engineer who gives concise, actionable answers.</textarea>
            </div>

            <!-- Messages -->
            <div id="pg-messages" style="min-height:300px;max-height:480px;overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:12px;">
              <div style="text-align:center;color:var(--text3);font-size:12px;padding:20px 0;">Start a conversation. Your key is tested live.</div>
            </div>

            <!-- Input -->
            <div style="padding:14px 18px;border-top:1px solid var(--border);display:flex;gap:10px;align-items:flex-end;">
              <textarea class="form-textarea" id="pg-input" rows="2" style="flex:1;min-height:unset;resize:none;font-size:13px;" placeholder="Type a message… (Shift+Enter for new line, Enter to send)"></textarea>
              <div style="display:flex;flex-direction:column;gap:6px;">
                <button class="btn btn-primary" id="pg-send" style="white-space:nowrap;">Send ↑</button>
                <button class="btn btn-ghost btn-sm" id="pg-clear">Clear</button>
              </div>
            </div>
          </div>

          <!-- Response stats -->
          <div id="pg-stats" style="font-size:11px;color:var(--text3);margin-top:8px;padding:0 4px;"></div>
        </div>

        <!-- RIGHT PANEL -->
        <div>
          <!-- Prompt Vault quick insert -->
          <div class="info-card">
            <div class="info-card-title">⚡ Quick Prompts from Vault</div>
            ${state.prompts&&state.prompts.length>0
              ? state.prompts.slice(0,8).map(p=>`
                <div style="padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;" data-inject-prompt="${p.id}">
                  <div style="font-size:12px;font-weight:600;color:var(--text);">${truncateText(p.title,40)}</div>
                  <div style="font-size:11px;color:var(--text3);">${p.category}</div>
                </div>`).join('')
              : '<div class="text-muted text-sm">No prompts in vault yet.</div>'
            }
            ${state.prompts?.length>8?`<button class="btn btn-xs btn-ghost mt-8" data-nav="/prompts">View all →</button>`:''}
          </div>

          <!-- Chat history -->
          <div class="info-card">
            <div class="info-card-title" style="display:flex;align-items:center;justify-content:space-between;">
              Recent Chats
              ${history.length>0?'<button class="btn btn-xs btn-danger" id="pg-clear-history">Clear</button>':''}
            </div>
            ${history.length===0
              ? '<div class="text-muted text-sm">No chat history yet.</div>'
              : history.slice(0,6).map(h=>`
                  <div style="padding:8px 0;border-bottom:1px solid var(--border);">
                    <div style="font-size:11px;color:var(--accent);">${h.model||'Unknown model'}</div>
                    <div style="font-size:12px;color:var(--text2);">${truncateText(h.userMsg,50)}</div>
                    <div style="font-size:11px;color:var(--text3);">${truncateText(h.assistantMsg,60)}</div>
                  </div>`).join('')
            }
          </div>

          <!-- Tips -->
          <div class="info-card" style="border-color:rgba(124,58,237,0.2);background:rgba(124,58,237,0.03);">
            <div class="info-card-title">💡 Tips</div>
            <div style="font-size:12px;color:var(--text2);line-height:1.7;">
              • <strong>Groq</strong> is fastest for open models (free)<br/>
              • <strong>OpenRouter</strong> gives access to 100+ models<br/>
              • Use model override to try any model ID<br/>
              • Inject prompts from your vault with one click<br/>
              • All requests go browser → provider directly
            </div>
          </div>
        </div>
      </div>
    `}
  `;
}

// ── PLAYGROUND EVENT HANDLERS ─────────────────────────────────────────────────

let _pgMessages = [];

document.addEventListener('click', e => {
  if (e.target.matches('#pg-send')) sendPlaygroundMessage();
  if (e.target.matches('#pg-clear')) { _pgMessages=[]; refreshMessages(); }
  if (e.target.matches('#pg-clear-history')) { setState(s=>({...s,aiChatHistory:[]})); showToast('History cleared.','info'); }

  const inject = e.target.closest('[data-inject-prompt]');
  if (inject) {
    const p = getState().prompts?.find(pr=>pr.id===inject.dataset.injectPrompt);
    if (p) { const inp=document.getElementById('pg-input'); if(inp){inp.value=p.body;inp.focus();} }
  }
});

document.addEventListener('keydown', e => {
  if (e.target.matches('#pg-input') && e.key==='Enter' && !e.shiftKey) {
    e.preventDefault();
    sendPlaygroundMessage();
  }
});

function refreshMessages() {
  const container = document.getElementById('pg-messages');
  if (!container) return;
  if (_pgMessages.length===0) {
    container.innerHTML = '<div style="text-align:center;color:var(--text3);font-size:12px;padding:20px 0;">Start a conversation. Your key is tested live.</div>';
    return;
  }
  container.innerHTML = _pgMessages.map(m => `
    <div style="display:flex;flex-direction:column;gap:4px;align-items:${m.role==='user'?'flex-end':'flex-start'};">
      <div style="font-size:10px;color:var(--text3);padding:0 4px;">${m.role==='user'?'You':m.model||'AI'}</div>
      <div style="background:${m.role==='user'?'rgba(0,245,255,0.1)':'var(--bg3)'};border:1px solid ${m.role==='user'?'rgba(0,245,255,0.2)':'var(--border)'};border-radius:10px;padding:10px 14px;max-width:90%;font-size:13px;line-height:1.6;color:var(--text);white-space:pre-wrap;word-break:break-word;">
        ${m.content}
      </div>
      ${m.stats?`<div style="font-size:10px;color:var(--text3);padding:0 4px;">${m.stats}</div>`:''}
    </div>
  `).join('');
  container.scrollTop = container.scrollHeight;
}

async function sendPlaygroundMessage() {
  const input = document.getElementById('pg-input');
  const sendBtn = document.getElementById('pg-send');
  const statsEl = document.getElementById('pg-stats');
  if (!input || !input.value.trim()) return;

  const userMsg = input.value.trim();
  input.value = '';
  _pgMessages.push({ role:'user', content: userMsg });
  refreshMessages();

  sendBtn.textContent = '⏳';
  sendBtn.disabled = true;

  const keyId = document.getElementById('pg-key')?.value;
  const state = getState();
  const k = (state.keys||[]).find(x=>x.id===keyId);
  if (!k) { showToast('No key selected.','error'); sendBtn.textContent='Send ↑'; sendBtn.disabled=false; return; }

  const modelOverride = document.getElementById('pg-model-override')?.value.trim();
  const model = modelOverride || k.selectedModel || 'llama3-8b-8192';
  const maxTokens = parseInt(document.getElementById('pg-max-tokens')?.value||512);
  const temp = parseFloat(document.getElementById('pg-temp')?.value||0.7);
  const system = document.getElementById('pg-system')?.value||'';
  const provider = AI_PROVIDERS.find(p=>p.id===k.providerId);

  const t0 = Date.now();
  try {
    let result;
    if (!provider) throw new Error('Unknown provider for this key.');
    if (provider.type==='openai-compat') result = await callOpenAICompat(k, provider, model, system, maxTokens, temp);
    else if (provider.type==='cohere')       result = await callCohere(k, model, system, maxTokens, temp);
    else if (provider.type==='anthropic')    result = await callAnthropic(k, model, system, maxTokens, temp);
    else if (provider.type==='hf')           result = await callHuggingFace(k, model);
    else throw new Error('Provider type not supported in playground.');

    const elapsed = ((Date.now()-t0)/1000).toFixed(1);
    const stats = `${elapsed}s · ${model}`;
    _pgMessages.push({ role:'assistant', content:result, model:provider.name+' / '+model.split('/').pop(), stats });
    if (statsEl) statsEl.textContent = `Last response: ${elapsed}s · Model: ${model}`;

    // Save to history
    setState(s=>({...s,aiChatHistory:[{id:generateId(),model,userMsg:userMsg.slice(0,80),assistantMsg:result.slice(0,120),timestamp:createTimestamp()},...(s.aiChatHistory||[])].slice(0,50)}));
  } catch(err) {
    _pgMessages.push({ role:'assistant', content:'⚠ Error: '+err.message, model:'Error' });
    showToast('Error: '+err.message,'error');
  }

  refreshMessages();
  sendBtn.textContent = 'Send ↑';
  sendBtn.disabled = false;
}

async function callOpenAICompat(k, provider, model, system, maxTokens, temp) {
  const messages = [];
  if (system) messages.push({role:'system',content:system});
  _pgMessages.filter(m=>m.role!=='system').slice(-10).forEach(m=>messages.push({role:m.role,content:m.content}));
  const res = await fetch(provider.endpoint, {
    method:'POST',
    headers:{'Authorization':provider.authHeader(k.keyValue),'Content-Type':'application/json',...(provider.extraHeaders||{})},
    body: JSON.stringify({model,messages,max_tokens:maxTokens,temperature:temp})
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message||'API error: '+res.status);
  return data.choices?.[0]?.message?.content || '[No response]';
}

async function callCohere(k, model, system, maxTokens, temp) {
  const preamble = system||undefined;
  const chatHistory = _pgMessages.filter(m=>m.role!=='system').slice(-10,-1).map(m=>({role:m.role==='user'?'USER':'CHATBOT',message:m.content}));
  const lastMsg = _pgMessages[_pgMessages.length-1]?.content||'';
  const body = {model,message:lastMsg,chat_history:chatHistory,max_tokens:maxTokens,temperature:temp};
  if(preamble) body.preamble=preamble;
  const res = await fetch('https://api.cohere.com/v1/chat',{method:'POST',headers:{'Authorization':'Bearer '+k.keyValue,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data = await res.json();
  if (!res.ok) throw new Error(data.message||'Cohere error: '+res.status);
  return data.text||'[No response]';
}

async function callAnthropic(k, model, system, maxTokens, temp) {
  const msgs = _pgMessages.filter(m=>m.role!=='system').slice(-10).map(m=>({role:m.role,content:m.content}));
  const body = {model,max_tokens:maxTokens,temperature:temp,messages:msgs};
  if(system) body.system=system;
  const res = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'x-api-key':k.keyValue,'anthropic-version':'2023-06-01','Content-Type':'application/json'},body:JSON.stringify(body)});
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message||'Anthropic error: '+res.status);
  return data.content?.[0]?.text||'[No response]';
}

async function callHuggingFace(k, model) {
  const lastMsg = _pgMessages[_pgMessages.length-1]?.content||'';
  const res = await fetch(`https://api-inference.huggingface.co/models/${model}`,{method:'POST',headers:{'Authorization':'Bearer '+k.keyValue,'Content-Type':'application/json'},body:JSON.stringify({inputs:lastMsg})});
  const data = await res.json();
  if (!res.ok) throw new Error(data.error||'HF error: '+res.status);
  if (Array.isArray(data)) return data[0]?.generated_text||data[0]?.text||JSON.stringify(data[0]);
  return JSON.stringify(data);
}
