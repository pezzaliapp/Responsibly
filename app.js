// Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const id = btn.getAttribute('data-target');
    document.querySelector(id).classList.add('active');
  });
});

// Helpers
function shuffle(a){
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a;
}
function pickKFromN(k,n,opts={}){
  const arr=[...Array(n).keys()].map(x=>x+1);
  shuffle(arr);
  let chosen=arr.slice(0,k);
  // Aesthetic filters (do not change odds—just reshuffle until condition satisfied, limited attempts)
  const maxTries=200;
  let tries=0;
  function hasConsecutive(xs){xs=[...xs].sort((a,b)=>a-b);for(let i=1;i<xs.length;i++){if(xs[i]-xs[i-1]===1) return true}return false}
  function decileSpreadOK(xs){ // try to spread across 10s buckets
    const buckets=new Set(xs.map(v=>Math.floor((v-1)/10)));
    return buckets.size>=Math.min(xs.length,6); // heuristic
  }
  while(tries<maxTries){
    const avoidConsec = opts.avoidConsecutive;
    const spread = opts.decileSpread;
    const cond1 = !avoidConsec || !hasConsecutive(chosen);
    const cond2 = !spread || decileSpreadOK(chosen);
    if(cond1 && cond2) break;
    shuffle(arr); chosen=arr.slice(0,k); tries++;
  }
  return chosen.sort((a,b)=>a-b);
}

// SuperEnalotto picker
document.getElementById('btn-se').addEventListener('click', ()=>{
  const avoid = document.getElementById('no-consecutivi').checked;
  const spread = document.getElementById('no-uguali-decine').checked;
  const nums = pickKFromN(6,90,{avoidConsecutive:avoid,decileSpread:spread});
  document.getElementById('out-se').textContent = nums.join(' – ');
});

// Lotto picker
document.getElementById('btn-lotto').addEventListener('click', ()=>{
  const avoid = document.getElementById('lotto-no-consecutivi').checked;
  const nums = pickKFromN(5,90,{avoidConsecutive:avoid});
  document.getElementById('out-lotto').textContent = nums.join(' – ');
});

// EV & probabilities
// SuperEnalotto jackpot probability: C(90,6)^-1
function comb(n,k){
  k=Math.min(k,n-k);
  let nf=1, df=1;
  for(let i=1;i<=k;i++){ nf *= (n - (i-1)); df *= i; }
  return nf/df;
}
function seJackpotProb(){
  // C(90,6)
  const c = comb(90,6);
  return 1/c;
}
document.getElementById('btn-se-ev').addEventListener('click', ()=>{
  const cost = Number(document.getElementById('se-cost').value||0);
  const prize = Number(document.getElementById('se-prize').value||0);
  const p = seJackpotProb();
  const ev = p*prize - cost;
  const breakevenPrize = cost/p;
  const oneIn = 1/p;
  const fmt = new Intl.NumberFormat('it-IT',{maximumFractionDigits:2});
  const fmt0 = new Intl.NumberFormat('it-IT',{maximumFractionDigits:0});
  document.getElementById('se-ev-out').innerHTML = `
    Probabilità di jackpot: 1 su <strong>${fmt0.format(oneIn)}</strong><br>
    Valore atteso (considerando solo il jackpot): <strong>€ ${fmt.format(ev)}</strong><br>
    Premio di pareggio (solo jackpot): <strong>€ ${fmt0.format(breakevenPrize)}</strong>
  `;
});

// Lotto ambo approx probability (single chosen pair on one wheel)
// Exact probability of getting a specific unordered pair among 5 drawn from 90 without replacement is:
// C(2,2)*C(88,3)/C(90,5) = C(88,3)/C(90,5) ≈ 1/400.5
function lottoAmboProb(){
  function combF(n,k){
    let res=1;
    for(let i=1;i<=k;i++){res*= (n - (i-1)); res/= i;}
    return res;
  }
  const p = combF(88,3)/combF(90,5);
  return p;
}
document.getElementById('btn-lotto-ev').addEventListener('click', ()=>{
  const cost = Number(document.getElementById('lotto-cost').value||0);
  const prize = Number(document.getElementById('lotto-prize').value||0);
  const p = lottoAmboProb();
  const ev = p*prize - cost;
  const oneIn = 1/p;
  const fmt = new Intl.NumberFormat('it-IT',{maximumFractionDigits:2});
  const fmt0 = new Intl.NumberFormat('it-IT',{maximumFractionDigits:1});
  document.getElementById('lotto-ev-out').innerHTML = `
    Probabilità di ambo (una ruota, una coppia): 1 su <strong>${fmt0.format(oneIn)}</strong><br>
    Valore atteso (stima): <strong>€ ${fmt.format(ev)}</strong>
  `;
});

// Budget Guard
const LS_KEY = 'responsibly_budget_v1';
function getState(){
  try{
    return JSON.parse(localStorage.getItem(LS_KEY)) || { monthly:20, spentByMonth:{} };
  }catch(_){ return { monthly:20, spentByMonth:{} }; }
}
function setState(s){ localStorage.setItem(LS_KEY, JSON.stringify(s)); }
function monthKey(){
  const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function renderBudget(){
  const s=getState();
  const k=monthKey();
  const spent=s.spentByMonth[k]||0;
  const remain = (s.monthly||0) - spent;
  const warn = remain<0 ? '⚠️ Hai superato il budget mensile' : (remain<=0 ? '⚠️ Budget esaurito' : 'OK');
  const fmt = new Intl.NumberFormat('it-IT',{maximumFractionDigits:2});
  document.getElementById('budget-out').innerHTML = `
    Mese: <strong>${k}</strong><br>
    Budget: <strong>€ ${fmt.format(s.monthly||0)}</strong><br>
    Speso: <strong>€ ${fmt.format(spent)}</strong><br>
    Rimanente: <strong>€ ${fmt.format(remain)}</strong><br>
    Stato: <strong>${warn}</strong>
  `;
  document.getElementById('budget-monthly').value = s.monthly||0;
}
document.getElementById('btn-add-spent').addEventListener('click', ()=>{
  const add = Number(document.getElementById('spent-add').value||0);
  const s=getState(); const k=monthKey();
  s.spentByMonth[k]=(s.spentByMonth[k]||0)+add;
  s.monthly = Number(document.getElementById('budget-monthly').value||0);
  setState(s); renderBudget();
});
document.getElementById('btn-reset-month').addEventListener('click', ()=>{
  const s=getState(); const k=monthKey();
  s.spentByMonth[k]=0; setState(s); renderBudget();
});
document.getElementById('budget-monthly').addEventListener('change', ()=>{
  const s=getState(); s.monthly=Number(document.getElementById('budget-monthly').value||0); setState(s); renderBudget();
});
renderBudget();


// Export budget TXT (human-readable)
document.getElementById('btn-export-budget').addEventListener('click', ()=>{
  const s = getState();
  const k = monthKey();
  const spent = s.spentByMonth[k] || 0;
  const remain = (s.monthly || 0) - spent;
  const fmt = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 });

 const lines = [
  'RESPONSIBLY – Esportazione Budget',
  `Mese: ${k}`,
  `Budget mensile: € ${fmt.format(s.monthly || 0)}`,
  `Speso: € ${fmt.format(spent)}`,
  `Rimanente: € ${fmt.format(remain)}`,
  '',
  'Dettagli (JSON):',
  '',
  JSON.stringify(s, null, 2)
].join('\n');

  const blob = new Blob([lines], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; 
  a.download = 'responsibly_budget.txt';
  a.click();
  URL.revokeObjectURL(url);
});

// Add to Home Screen (A2HS)
let deferredPrompt;
const banner=document.getElementById('a2hs-banner');
const btnA2hs=document.getElementById('btn-a2hs');
window.addEventListener('beforeinstallprompt',(e)=>{
  e.preventDefault();
  deferredPrompt=e;
  banner.classList.remove('hidden');
});
btnA2hs.addEventListener('click',()=>{
  banner.classList.add('hidden');
  if(deferredPrompt){
    deferredPrompt.prompt();
    deferredPrompt.userChoice.finally(()=>{ deferredPrompt=null; });
  }
});
