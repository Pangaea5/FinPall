
const KEY='finpalData';
const APP_VERSION=24;
const CATS={"Konut":["Kira","Aidat","Elektrik","Su","Doğalgaz","İnternet","Ev Bakımı"],"Gıda":["Market","Kasap","Restoran","Kafe"],"Ulaşım":["Yakıt","Toplu Taşıma","Otopark","Bakım"],"Sağlık":["Muayene","İlaç","Diş"],"Eğitim":["Kurs","Kitap","Okul"],"Abonelik":["Telefon","Netflix","Spotify","Diğer"],"Giyim":["Kıyafet","Ayakkabı"],"Eğlence":["Sinema","Hobi","Tatil"],"Borçlar":["Kredi","Kredi Kartı","Diğer"],"Yatırım":["Altın","Döviz","Hisse","Fon"],"Diğer":["Diğer"]};
let data=load(), modalType=null, modalTypeCardId=null, budgetMonth=month(), reportMonth=month();
try{snapshotNetWorth45();localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function base(){return {version:APP_VERSION,accounts:[],transactions:[],envelopes:[],budgets:[],allocations:[],obligations:[],paymentPlans:[],assets:[],netWorthHistory:[],emergencyFund:{enabled:false,essentialMonthly:0,targetMonths:6,balance:0,accountId:''},security:{pinEnabled:false,pinHash:'',pinSalt:'',pinKdf:'',autoLock:5,biometricEnabled:false,credentialId:'',failedAttempts:0,lockUntil:0,lastUnlock:0,lockOnHidden:true},goals:[],subscriptions:[],shopping:[],categories:CATS}}
function load(){try{let x=JSON.parse(localStorage.getItem(KEY));return x&&x.version?migrate(x):base()}catch(e){return base()}}
function migrate(x){x.accounts=x.accounts||[];x.transactions=x.transactions||[];x.envelopes=x.envelopes||[];x.budgets=x.budgets||[];x.allocations=x.allocations||[];x.obligations=x.obligations||[];x.paymentPlans=(x.paymentPlans||[]).map(p=>Object.assign({frequency:'monthly',kind:'expense',active:true,category:'Diğer',lastPaid:'',paidCount:0},p));x.assets=x.assets||[];x.netWorthHistory=Array.isArray(x.netWorthHistory)?x.netWorthHistory:[];x.emergencyFund=Object.assign({enabled:false,essentialMonthly:0,targetMonths:6,balance:0,accountId:''},x.emergencyFund||{});x.security=Object.assign({pinEnabled:false,pinHash:'',pinSalt:'',pinKdf:'',autoLock:5,biometricEnabled:false,credentialId:'',failedAttempts:0,lockUntil:0,lastUnlock:0,lockOnHidden:true},x.security||{});x.app=Object.assign({notifications:false,lastActive:Date.now()},x.app||{});x.goals=x.goals||[];x.subscriptions=x.subscriptions||[];x.shopping=x.shopping||[];x.categories=x.categories||CATS;x.envelopes=x.envelopes.map(e=>{e.target=Number(e.target||e.budget||0);e.priority=Number(e.priority||3);e.rollover=e.rollover!==false;return e});x.accounts=x.accounts.map(a=>{if(a.type==='credit'){a.cardLimit=Number(a.cardLimit||0);a.statementDay=Number(a.statementDay||1);a.dueDay=Number(a.dueDay||10)}return a});x.transactions=x.transactions.map(t=>{if(t.type==='expense'&&t.category){let hit=Object.entries(CATS).find(([g,subs])=>subs.includes(t.category));t.categoryGroup=t.categoryGroup||hit?.[0]||'Diğer';t.categorySubcategory=t.categorySubcategory||t.category}return t});x.budgets=x.budgets.map(b=>{let hit=Object.entries(CATS).find(([g,subs])=>subs.includes(b.category));b.month=b.month||month();b.categoryGroup=b.categoryGroup||hit?.[0]||'Diğer';b.categorySubcategory=b.categorySubcategory||b.category||hit?.[1]?.[0]||'Diğer';return b});x.bank25=Object.assign({provider:'',connected:false,lastSync:'',accountIds:[]},x.bank25||{});x.assetTargets=Object.assign({},x.assetTargets||{});x.marketProvider25=Object.assign({url:''},x.marketProvider25||{});x.market30=Object.assign({items:[],lastUpdate:'',source:'',currency:'TRY'},x.market30||{});x.investment30=Object.assign({priceApi:'',autoUpdate:false},x.investment30||{});x.version=APP_VERSION;return x}
function snapshotNetWorth45(){
  data.netWorthHistory=Array.isArray(data.netWorthHistory)?data.netWorthHistory:[];
  const d=new Date().toISOString().slice(0,10),t=totals(),entry={date:d,assets:Number(t.assets||0),liabilities:Number(t.liab||0),net:Number(t.net||0)};
  const i=data.netWorthHistory.findIndex(x=>x.date===d);
  if(i>=0)data.netWorthHistory[i]=entry;else data.netWorthHistory.push(entry);
  data.netWorthHistory=data.netWorthHistory.sort((a,b)=>a.date.localeCompare(b.date)).slice(-730);
}
function save(){snapshotNetWorth45();localStorage.setItem(KEY,JSON.stringify(data));render()}
function money(n){return new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:2}).format(Number(n)||0)}
function month(d=new Date()){return d.toISOString().slice(0,7)}
function fmt(d){return new Date(d).toLocaleDateString('tr-TR')}
function accountBalance(id){let a=data.accounts.find(x=>x.id===id);if(!a)return 0;let b=Number(a.opening||0),today=new Date();today.setHours(23,59,59,999);data.transactions.forEach(t=>{let td=new Date((t.date||'9999-12-31')+'T23:59:59');if(td>today)return;if(t.type==='transfer'){if(t.from===id)b-=+t.amount;if(t.to===id)b+=+t.amount}else if(t.accountId===id)b+=(t.type==='income'?1:-1)*+t.amount});return b}
function cardDebt(id){return Math.max(0,-accountBalance(id));}
function creditAvailable(id){let a=data.accounts.find(x=>x.id===id);if(!a||a.type!=='credit')return 0;return Math.max(0,Number(a.cardLimit||0)-cardDebt(id))}
function dateFromDay(year,month,day){let last=new Date(year,month+1,0).getDate();return new Date(year,month,Math.min(Math.max(1,day),last))}
function cardCycle(id,baseDate=new Date()){let a=data.accounts.find(x=>x.id===id);if(!a||a.type!=='credit')return null;let y=baseDate.getFullYear(),m=baseDate.getMonth(),today=baseDate.getDate(),sd=Math.min(Math.max(1,Number(a.statementDay||1)),31);let end=dateFromDay(y,m,sd);if(today<sd){end=dateFromDay(y,m-1,sd)}let start=new Date(end.getFullYear(),end.getMonth()-1,end.getDate()+1);let due=new Date(end.getFullYear(),end.getMonth(),Math.min(Number(a.dueDay||10),new Date(end.getFullYear(),end.getMonth()+1,0).getDate()));if(due<=end)due=new Date(end.getFullYear(),end.getMonth()+1,Math.min(Number(a.dueDay||10),new Date(end.getFullYear(),end.getMonth()+2,0).getDate()));return {start,end,due}}
function cardStatement(id){let c=cardCycle(id);if(!c)return 0;return data.transactions.filter(t=>t.accountId===id&&t.type==='expense').filter(t=>{let d=new Date(t.date+'T00:00:00');return d>c.start&&d<=c.end}).reduce((s,t)=>s+Number(t.amount),0)-data.transactions.filter(t=>t.type==='transfer'&&t.to===id).filter(t=>{let d=new Date(t.date+'T00:00:00');return d>c.start&&d<=c.end}).reduce((s,t)=>s+Number(t.amount),0)}
function cardInfo(id){let a=data.accounts.find(x=>x.id===id),c=cardCycle(id);if(!a||!c)return null;return {debt:cardDebt(id),available:creditAvailable(id),statement:Math.max(0,cardStatement(id)),due:c.due}}
function trackedAssetTotal(){return data.assets.reduce((s,a)=>s+Number(a.quantity||0)*Number(a.currentPrice||0),0)}
function trackedAssetCost(){return data.assets.reduce((s,a)=>s+Number(a.quantity||0)*Number(a.unitCost||0),0)}
function totals(){let assets=0,liab=0;data.accounts.forEach(a=>{let b=accountBalance(a.id);if(a.type==='debt'||a.type==='credit')liab+=Math.max(0,-b||b);else assets+=Math.max(0,b)});assets+=trackedAssetTotal();let mi=data.transactions.filter(t=>t.type==='income'&&t.date.slice(0,7)===month()).reduce((s,t)=>s+ +t.amount,0),me=data.transactions.filter(t=>t.type==='expense'&&t.date.slice(0,7)===month()).reduce((s,t)=>s+ +t.amount,0);return{assets,liab,net:assets-liab,mi,me}}

function tab(id,btn){document.querySelectorAll('section[id]').forEach(s=>s.classList.add('hide'));document.getElementById(id).classList.remove('hide');document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');render()}
function openModal(title,type,body){modalType=type;document.getElementById('modalTitle').textContent=title;document.getElementById('modalBody').innerHTML=body;document.getElementById('modal').classList.add('on')}
function closeModal(){document.getElementById('modal').classList.remove('on');modalType=null;let b=document.querySelector('#modal .actions button:last-child');if(b)b.style.display='block'}
function val(id){return document.getElementById(id).value}
function submitModal(){let m=modalType;if(m==='account'){let name=val('aName').trim(),type=val('aType');if(!name)return alert('Hesap adı gerekli.');let a={id:uid(),name,type,opening:0};if(type==='credit'){a.cardLimit=Math.max(0,+val('aLimit')||0);a.statementDay=Math.min(31,Math.max(1,+val('aStatementDay')||1));a.dueDay=Math.min(31,Math.max(1,+val('aDueDay')||10));}data.accounts.push(a);save();closeModal()}
else if(m==='tx'){let type=val('tType'),amount=+val('tAmount'),desc=val('tDesc').trim(),group=val('tGroup')||'Diğer',cat=val('tCat'),accountId=val('tAccount'),envelopeId=val('tEnvelope'),date=val('tDate');if(!(amount>0)||!accountId)return alert('Tutar ve hesap gerekli.');let acc=data.accounts.find(a=>a.id===accountId);let installment=document.getElementById('tInstallment')?.checked;let count=Math.max(2,Math.min(60,Number(val('tInstallments')||2)));let firstDate=val('tFirstDate')||date;if(type==='expense'&&acc&&acc.type==='credit'){let available=creditAvailable(accountId);if(amount>available)return alert('Kredi kartı limitini aşıyorsunuz. Kullanılabilir limit: '+money(available));if(installment){let group=uid(),baseAmount=Math.floor((amount/count)*100)/100,rest=Math.round((amount-baseAmount*(count-1))*100)/100;for(let i=0;i<count;i++){data.transactions.push({id:uid(),type,amount:i===count-1?rest:baseAmount,description:desc||'Taksitli alışveriş',category:cat,categoryGroup:group,categorySubcategory:cat,accountId,envelopeId,date:addMonthsDate(firstDate,i),installmentGroup:group,installmentNo:i+1,installmentCount:count,installmentTotal:amount});}}else data.transactions.push({id:uid(),type,amount,description:desc,category:cat,categoryGroup:group,categorySubcategory:cat,accountId,envelopeId,date});}else data.transactions.push({id:uid(),type,amount,description:desc,category:cat,categoryGroup:group,categorySubcategory:cat,accountId,envelopeId,date});save();closeModal()}
else if(m==='cardPayment'){let to=modalTypeCardId,from=val('cpFrom'),amount=+val('cpAmount'),date=val('cpDate');if(!(amount>0)||!to||!from)return alert('Ödeme bilgilerini kontrol edin.');if(amount>cardDebt(to))return alert('Ödeme tutarı mevcut kart borcundan fazla olamaz.');if(amount>accountBalance(from))return alert('Ödeme yapılacak hesapta yeterli bakiye yok.');data.transactions.push({id:uid(),type:'transfer',amount,from,to,description:'Kredi Kartı Ödemesi',date});save();closeModal()}
else if(m==='budget'){let group=val('bGroup'),cat=val('bCat'),amount=+val('bAmount'),env=val('bEnv')||null,mth=val('bMonth')||month();if(!(amount>0)||!group||!cat)return alert('Kategori ve tutar gerekli.');let old=data.budgets.find(x=>(x.categorySubcategory||x.category)===cat&&x.month===mth);if(old){old.amount=amount;old.envelopeId=env;old.categoryGroup=group;old.categorySubcategory=cat;old.category=cat}else data.budgets.push({id:uid(),category:cat,categoryGroup:group,categorySubcategory:cat,amount,month:mth,envelopeId:env});budgetMonth=mth;save();closeModal()}
else if(m==='envelope'){let name=val('eName').trim(),budget=+val('eBudget')||0;if(!name||budget<0)return alert('Bilgileri kontrol edin.');data.envelopes.push({id:uid(),name,budget,spent:0});save();closeModal()}}
function saveAccountDirect(){
  try{
    const name=(document.getElementById('aName')?.value||'').trim();
    const type=document.getElementById('aType')?.value||'bank';
    if(!name){alert('Hesap adı gerekli.');return;}
    const a={id:uid(),name,type,opening:0};
    if(type==='credit'){
      const rawLimit=document.getElementById('aLimit')?.value;
      const rawStatement=document.getElementById('aStatementDay')?.value;
      const rawDue=document.getElementById('aDueDay')?.value;
      a.cardLimit=Math.max(0,Number(rawLimit)||0);
      a.statementDay=Math.min(31,Math.max(1,parseInt(rawStatement,10)||1));
      a.dueDay=Math.min(31,Math.max(1,parseInt(rawDue,10)||10));
    }
    if(!Array.isArray(data.accounts))data.accounts=[];
    data.accounts.push(a);
    localStorage.setItem(KEY,JSON.stringify(data));
    closeModal();
    render();
  }catch(err){console.error('Hesap kaydetme hatası',err);alert('Hesap kaydedilemedi: '+(err?.message||err));}
}
function openAccount(){openModal('Yeni Hesap','account',`<label>Hesap adı</label><input id="aName" placeholder="Örn. Bonus Kart"><label>Tür</label><select id="aType" onchange="toggleAccountFields()"><option value="bank">Banka</option><option value="cash">Nakit</option><option value="credit">Kredi Kartı</option><option value="investment">Yatırım</option><option value="debt">Borç</option></select><div class="muted" style="margin:8px 0 12px">Yeni hesap 0 TL ile başlar. Kart borcu girdiğin harcamalardan oluşur.</div><div id="creditFields" style="display:none"><label>Kart limiti (isteğe bağlı)</label><input id="aLimit" type="number" inputmode="decimal" min="0" step="0.01" placeholder="Örn. 50000"><label>Ekstre kesim günü</label><input id="aStatementDay" type="number" inputmode="numeric" min="1" max="31" value="1"><label>Son ödeme günü</label><input id="aDueDay" type="number" inputmode="numeric" min="1" max="31" value="10"></div>`);toggleAccountFields();let b=document.querySelector('#modal .actions button:last-child');if(b)b.setAttribute('onclick','saveAccountDirect()')}
function openTx(type){let opts=data.accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');let env=data.envelopes.map(e=>`<option value="${e.id}">${e.name}</option>`).join('');let groups=Object.keys(CATS).map(g=>`<option value="${g}">${g}</option>`).join('');let firstGroup=Object.keys(CATS)[0];let subs=CATS[firstGroup].map(s=>`<option value="${s}">${s}</option>`).join('');openModal(type==='income'?'Gelir Ekle':'Gider Ekle','tx',`<input id="tType" type="hidden" value="${type}"><label>Tutar</label><input id="tAmount" type="number" step="0.01" inputmode="decimal" placeholder="0" oninput="toggleInstallment()"><label>Açıklama</label><input id="tDesc" placeholder="Örn. Maaş / Market" oninput="suggestCategory(this.value)"><div id="catSuggestion" class="muted" style="margin:-6px 0 8px"></div><label>Kategori</label><select id="tGroup" onchange="updateSubcats('tGroup','tCat')">${type==='income'?'<option value="Gelir">Gelir</option>':groups}</select><label>Alt kategori</label><select id="tCat">${type==='income'?'<option>Maaş</option><option>Ek Gelir</option><option>Yatırım Geliri</option>':subs}</select><label>Hesap</label><select id="tAccount" onchange="toggleInstallment()">${opts}</select><div id="installmentBox" class="card" style="display:none;padding:12px;margin:2px 0 10px;background:#fff8f2"><label><input id="tInstallment" type="checkbox" onchange="toggleInstallmentFields()" style="width:auto;margin:0 6px 0 0"> Taksitli işlem</label><div id="installmentFields" style="display:none"><label>Taksit sayısı</label><input id="tInstallments" type="number" min="2" max="60" step="1" value="3"><label>İlk taksit tarihi</label><input id="tFirstDate" type="date" value="${new Date().toISOString().slice(0,10)}"><div class="muted">Toplam alışveriş tutarı kaydedilir; her ay yalnızca ilgili taksit gerçekleşmiş gider olarak görünür.</div></div></div><label>Zarf (isteğe bağlı)</label><select id="tEnvelope"><option value="">Yok</option>${env}</select><label>Tarih</label><input id="tDate" type="date" value="${new Date().toISOString().slice(0,10)}">`);toggleInstallment()}
function updateSubcats(groupId,subId){let g=document.getElementById(groupId)?.value,el=document.getElementById(subId);if(!el)return;if(!CATS[g])return;el.innerHTML=CATS[g].map(s=>`<option value="${s}">${s}</option>`).join('')}
function toggleInstallment(){let a=data.accounts.find(x=>x.id===val('tAccount'));let box=document.getElementById('installmentBox');if(box)box.style.display=(val('tType')==='expense'&&a&&a.type==='credit')?'block':'none'}
function toggleInstallmentFields(){let f=document.getElementById('installmentFields');let c=document.getElementById('tInstallment');if(f)f.style.display=c&&c.checked?'block':'none'}
function addMonthsDate(dateStr,n){let d=new Date(dateStr+'T00:00:00');let day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+n);let last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return d.toISOString().slice(0,10)}
function quick(t){tab('transactions',document.querySelectorAll('.tabs button')[1]);setTimeout(()=>openTx(t),20)}
function openBudget(){let groups=Object.keys(CATS).map(g=>`<option value="${g}">${g}</option>`).join('');let g=Object.keys(CATS)[0],subs=CATS[g].map(s=>`<option value="${s}">${s}</option>`).join('');let env=data.envelopes.map(e=>`<option value="${e.id}">${e.name}</option>`).join('');openModal('Aylık Bütçe','budget',`<label>Ay</label><input id="bMonth" type="month" value="${budgetMonth}"><label>Kategori</label><select id="bGroup" onchange="updateSubcats('bGroup','bCat')">${groups}</select><label>Alt kategori</label><select id="bCat">${subs}</select><label>Aylık limit</label><input id="bAmount" type="number" step="0.01" placeholder="0"><label>Zarf</label><select id="bEnv"><option value="">Zarf yok</option>${env}</select>`)}
function setBudgetMonth(v){budgetMonth=v||month();renderBudgets()}
function openEnvelope(){openModal('Yeni Zarf','envelope',`<label>Zarf adı</label><input id="eName" placeholder="Market"><label>Aylık hedef</label><input id="eBudget" type="number" step="0.01" placeholder="8000"><label>Öncelik (1=en yüksek)</label><input id="ePriority" type="number" min="1" max="5" value="3"><label>Ay sonu kalan para</label><select id="eRollover"><option value="yes">Sonraki aya devret</option><option value="no">Devretme</option></select>`)}
function transferAccount(){if(data.accounts.length<2)return alert('En az 2 hesap gerekli.');openModal('Hesaplar Arası Transfer','transfer',`<label>Kaynak</label><select id="trFrom">${data.accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}</select><label>Hedef</label><select id="trTo">${data.accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('')}</select><label>Tutar</label><input id="trAmount" type="number" step="0.01">`);modalType='transfer'}
function transferEnvelope(){if(data.envelopes.length<2)return alert('En az 2 zarf gerekli.');openModal('Zarflar Arası Transfer','etransfer',`<label>Ay</label><input id="erMonth" type="month" value="${budgetMonth}" onchange="budgetMonth=this.value"><label>Kaynak</label><select id="erFrom">${data.envelopes.map(e=>`<option value="${e.id}">${e.name}</option>`).join('')}</select><label>Hedef</label><select id="erTo">${data.envelopes.map(e=>`<option value="${e.id}">${e.name}</option>`).join('')}</select><label>Tutar</label><input id="erAmount" type="number" step="0.01">`);modalType='etransfer'}
const oldSubmit=submitModal;submitModal=function(){if(modalType==='transfer'){let f=val('trFrom'),t=val('trTo'),a=+val('trAmount');if(f===t||!(a>0))return alert('Transfer bilgilerini kontrol edin.');if(accountBalance(f)<a)return alert('Kaynak hesapta yeterli bakiye yok.');data.transactions.push({id:uid(),type:'transfer',amount:a,from:f,to:t,description:'Hesap Transferi',date:new Date().toISOString().slice(0,10)});save();closeModal();return}if(modalType==='etransfer'){let f=data.envelopes.find(e=>e.id===val('erFrom')),t=data.envelopes.find(e=>e.id===val('erTo')),a=+val('erAmount');if(!f||!t||f.id===t.id||!(a>0))return alert('Transfer bilgilerini kontrol edin.');let available=f.budget-f.spent;if(a>available)return alert('Kaynak zarfta yeterli kullanılabilir para yok.');f.budget-=a;t.budget+=a;save();closeModal();return}oldSubmit()}
function deleteTx(id){let t=data.transactions.find(x=>x.id===id);if(t&&confirm('İşlem silinsin mi?')){data.transactions=data.transactions.filter(x=>x.id!==id);save()}}

function editExpenseTx(id){
  let t=data.transactions.find(x=>x.id===id);if(!t||t.type!=='expense')return;
  let opts=data.accounts.map(a=>`<option value="${a.id}" ${a.id===t.accountId?'selected':''}>${esc(a.name)}</option>`).join('');
  let groups=Object.keys(CATS).map(g=>`<option value="${g}" ${g===txExpenseGroup(t)?'selected':''}>${g}</option>`).join('');
  let g=txExpenseGroup(t),subs=(CATS[g]||['Diğer']).map(s=>`<option value="${s}" ${s===(t.categorySubcategory||t.category)?'selected':''}>${s}</option>`).join('');
  openModal('Harcamayı Düzenle','expenseEdit',`<input id="xeId" type="hidden" value="${t.id}"><label>Tutar</label><input id="xeAmount" type="number" step="0.01" inputmode="decimal" value="${Number(t.amount||0)}"><label>Açıklama</label><input id="xeDesc" value="${esc(t.description||'')}"><label>Kategori</label><select id="xeGroup" onchange="updateSubcats('xeGroup','xeCat')">${groups}</select><label>Alt kategori</label><select id="xeCat">${subs}</select><label>Hesap / Kart</label><select id="xeAccount">${opts}</select><label>Tarih</label><input id="xeDate" type="date" value="${t.date||new Date().toISOString().slice(0,10)}">`);
}

function deleteAccount(id){if(confirm('Hesap silinsin mi?')){data.accounts=data.accounts.filter(x=>x.id!==id);data.transactions=data.transactions.filter(t=>t.accountId!==id&&t.from!==id&&t.to!==id);save()}}
function budgetSpent(b){let group=b.categoryGroup||b.group,sub=b.categorySubcategory||b.category;return data.transactions.filter(t=>t.type==='expense'&&t.date.slice(0,7)===(b.month||month())&&(t.categorySubcategory||t.category)===sub&&(t.categoryGroup||'Diğer')===group).reduce((s,t)=>s+ +t.amount,0)}
function envelopeAllocated(id,m=budgetMonth){return data.allocations.filter(a=>a.envelopeId===id&&a.month===m).reduce((s,a)=>s+Number(a.amount||0),0)}
function envelopeSpent(id,m=budgetMonth){return data.transactions.filter(t=>t.type==='expense'&&t.envelopeId===id&&t.date.slice(0,7)===m).reduce((s,t)=>s+Number(t.amount||0),0)}
function previousMonth(m){let [y,mo]=m.split('-').map(Number),d=new Date(y,mo-2,1);return d.toISOString().slice(0,7)}
function envelopeCarryover(id,m=budgetMonth,depth=24){if(depth<=0)return 0;let pm=previousMonth(m),e=data.envelopes.find(x=>x.id===id);if(!e||!e.rollover)return 0;let prev=Number(envelopeAllocated(id,pm)||0)+envelopeCarryover(id,pm,depth-1)-Number(envelopeSpent(id,pm)||0);return Math.max(0,prev)}
function envelopeAvailable(id,m=budgetMonth){return Math.max(0,Number(envelopeAllocated(id,m))+envelopeCarryover(id,m)-Number(envelopeSpent(id,m)))}
function totalAllocated(m=budgetMonth){return data.allocations.filter(a=>a.month===m).reduce((s,a)=>s+Number(a.amount||0),0)}
function liquidBalance(){return data.accounts.filter(a=>a.type==='bank'||a.type==='cash').reduce((s,a)=>s+accountBalance(a.id),0)}
function availableToAssign(m=budgetMonth){return liquidBalance()-totalAllocated(m)}
function openAllocation(){let env=data.envelopes.map(e=>`<option value="${e.id}">${e.name}</option>`).join('');if(!env)return alert('Önce en az bir zarf oluşturun.');openModal('Para Tahsis Et','allocation',`<label>Ay</label><input id="aMonth" type="month" value="${budgetMonth}"><label>Zarf</label><select id="aEnv">${env}</select><label>Tahsis edilecek tutar</label><input id="aAmount" type="number" step="0.01" inputmode="decimal" placeholder="0"><div class="muted">Bu işlem banka bakiyesini azaltmaz; paranı o ay için o zarfa ayırır. Kullanılabilir tahsis tutarı: <b>${money(availableToAssign())}</b></div>`)}
function renderFinancialCenter(){let el=document.getElementById('financialCenter');if(!el)return;let m=month(),t=totals(),avail=availableToAssign(m);let budgets=data.budgets.filter(b=>b.month===m),bLimit=budgets.reduce((s,b)=>s+Number(b.amount||0),0),bSpent=budgets.reduce((s,b)=>s+budgetSpent(b),0),bRemain=bLimit-bSpent;let envTotal=data.envelopes.reduce((s,e)=>s+envelopeAvailable(e.id,m),0);let today=new Date();today.setHours(0,0,0,0);let d30=new Date(today);d30.setDate(d30.getDate()+30);let due30=data.obligations.filter(o=>o.type==='debt'&&obligationRemaining(o)>0&&o.dueDate).filter(o=>{let d=new Date(o.dueDate+'T23:59:59');return d>=today&&d<=d30}).reduce((s,o)=>s+obligationRemaining(o),0);let plans30=data.paymentPlans.filter(p=>p.nextDate).reduce((s,p)=>{let d=new Date(p.nextDate+'T23:59:59');return d>=today&&d<=d30?s+Number(p.amount||0):s},0);let upcoming=due30+plans30;let rate=t.mi>0?Math.round((t.mi-t.me)/t.mi*100):0;let status=rate>=20?'Güçlü':rate>=0?'Dengeli':'Dikkat';el.innerHTML=`<div class="cardMini"><span>Net varlık<br><b>${money(t.net)}</b></span><span>Bu ay net<br><b class="${t.mi-t.me>=0?'positive':'negative'}">${money(t.mi-t.me)}</b></span><span>Tasarruf<br><b>${rate}%</b></span></div><div class="grid"><div class="accountBox"><b>💰 Para Durumu</b><div class="row"><span>Nakit / Banka</span><b>${money(liquidBalance())}</b></div><div class="row"><span>Bu ay tahsis edilebilir</span><b class="${avail<0?'negative':'positive'}">${money(avail)}</b></div><div class="row"><span>Zarflarda kullanılabilir</span><b>${money(envTotal)}</b></div></div><div class="accountBox"><b>📊 Bütçe Durumu</b><div class="row"><span>Limit</span><b>${money(bLimit)}</b></div><div class="row"><span>Harcanan</span><b>${money(bSpent)}</b></div><div class="row"><span>Kalan</span><b class="${bRemain<0?'negative':'positive'}">${money(bRemain)}</b></div><div class="progress"><div class="bar" style="width:${bLimit?Math.min(100,Math.max(0,bSpent/bLimit*100)):0}%"></div></div></div></div><div class="accountBox"><b>📅 Önümüzdeki 30 Gün</b><div class="row"><span>Planlı borç ödemeleri</span><b class="negative">${money(due30)}</b></div><div class="row"><span>Düzenli ödeme tahmini</span><b class="negative">${money(plans30)}</b></div><div class="row"><span>Toplam planlanan</span><b class="negative">${money(upcoming)}</b></div></div><div class="pill">Finansal durum: ${status}</div>`}
function renderAllocationSummary(){let el=document.getElementById('allocationSummary');if(!el)return;let total=totalAllocated(),avail=availableToAssign();el.innerHTML=`<div class="cardMini"><span>Nakit/Banka<br><b>${money(liquidBalance())}</b></span><span>Tahsis edilen<br><b>${money(total)}</b></span><span>Tahsis edilebilir<br><b class="${avail<0?'negative':''}">${money(avail)}</b></span></div>${avail<0?'<div class="danger-text">⚠ Bu ay mevcut nakit bakiyenden fazla para tahsis ettin.</div>':'<div class="muted">Paranı önce amaçlarına tahsis et; harcamalar ilgili zarfın kalanından düşer.</div>'}`}
function renderBudgets(){let el=document.getElementById('budgets');if(!el)return;let sel=document.getElementById('budgetMonth');if(sel&&sel.value!==budgetMonth)sel.value=budgetMonth;let arr=data.budgets.filter(x=>x.month===budgetMonth);let total=arr.reduce((s,b)=>s+Number(b.amount),0),spent=arr.reduce((s,b)=>s+budgetSpent(b),0),remaining=total-spent;let head=`<div class="cardMini"><span>Limit<br><b>${money(total)}</b></span><span>Harcanan<br><b>${money(spent)}</b></span><span>Kalan<br><b class="${remaining<0?'negative':''}">${money(remaining)}</b></span></div>`;el.innerHTML=head+(arr.length?arr.map(b=>{let s=budgetSpent(b),p=b.amount?Math.round(s/b.amount*100):0;return `<div class="accountBox"><div class="row"><div style="flex:1"><b>${b.categoryGroup||'Diğer'} › ${b.categorySubcategory||b.category}</b><div class="progress"><div class="bar" style="width:${Math.min(100,p)}%"></div></div><span class="muted">${money(s)} / ${money(b.amount)} · ${p}%${s>b.amount?' · ⚠ Limit aşıldı':''}${b.envelopeId?' · 🟠 '+(data.envelopes.find(e=>e.id===b.envelopeId)?.name||'Zarf'):''}</span></div><button class="small danger" onclick="deleteBudget('${b.id}')">Sil</button></div></div>`}).join(''):'<div class="empty">Bu ay için bütçe yok.</div>')}
function deleteBudget(id){if(confirm('Bu bütçe kaydı silinsin mi?')){data.budgets=data.budgets.filter(b=>b.id!==id);save()}}
function renderEnvelopes(){let el=document.getElementById('envelopes');if(!el)return;el.innerHTML=data.envelopes.map(e=>{let allocated=envelopeAllocated(e.id),carry=envelopeCarryover(e.id),s=envelopeSpent(e.id),avail=envelopeAvailable(e.id),base=allocated+carry,p=base?Math.min(100,s/base*100):0;return `<div class="accountBox"><div class="row"><div style="flex:1"><b>${e.name}</b><span class="pill">Öncelik ${e.priority||3}</span><div class="progress"><div class="bar" style="width:${p}%"></div></div><span class="muted">Tahsis ${money(allocated)} · Devir ${money(carry)} · Harcanan ${money(s)} · <b>Kalan ${money(avail)}</b>${e.target?` · Hedef ${money(e.target)}`:''}</span></div><button class="small" onclick="editEnvelope('${e.id}')">Düzenle</button></div></div>`}).join('')||'<div class="empty">Zarf ekleyin.</div>'}
function renderCategories(){categories.innerHTML=Object.entries(CATS).map(([k,v])=>`<div class="row"><div><b>${k}</b><div class="muted">${v.join(' · ')}</div></div><span class="pill">${v.length} alt kategori</span></div>`).join('')}
function obligationRemaining(o){return Math.max(0,Number(o.remaining??o.amount??0))}
function renderObligations(){let el=document.getElementById('obligations');if(!el)return;let arr=[...data.obligations].sort((a,b)=>(a.dueDate||'9999').localeCompare(b.dueDate||'9999'));el.innerHTML=arr.map(o=>{let rem=obligationRemaining(o),pct=Number(o.amount)>0?Math.min(100,Math.round((1-rem/Number(o.amount))*100)):0;let overdue=o.dueDate&&new Date(o.dueDate+'T23:59:59')<new Date()&&rem>0;return `<div class="accountBox"><div class="row"><div><b>${o.type==='debt'?'🔴':'🟢'} ${o.name}</b><div class="muted">${o.type==='debt'?'Borç':'Alacak'}${o.dueDate?' · Vade '+fmt(o.dueDate):''}</div></div><div><b>${money(rem)}</b><div class="muted">Kalan</div></div></div><div class="progress"><div class="bar" style="width:${pct}%"></div></div><div class="muted">Başlangıç ${money(o.amount)} · Ödenen/Tahsil ${money(Number(o.amount)-rem)}${overdue?' · ⛔ Vadesi geçti':''}</div><div class="account-actions" style="margin-top:7px"><button class="small" onclick="openObligationPayment('${o.id}')">${o.type==='debt'?'Ödeme Yap':'Tahsil Et'}</button><button class="small danger" onclick="deleteObligation('${o.id}')">Sil</button></div></div>`}).join('')||'<div class="empty">Henüz borç veya alacak kaydı yok.</div>'}
function openObligation(type){openModal(type==='debt'?'Yeni Borç':'Yeni Alacak','obligation',`<input id="oType" type="hidden" value="${type}"><label>${type==='debt'?'Borçlu olduğunuz kişi/kurum':'Sizden alacağı olan kişi/kurum'}</label><input id="oName" placeholder="Örn. Ahmet / Banka"><label>Toplam tutar</label><input id="oAmount" type="number" step="0.01" inputmode="decimal" placeholder="0"><label>Vade tarihi (isteğe bağlı)</label><input id="oDue" type="date"><div class="grid"><div><label>Yıllık faiz (%)</label><input id="oInterest" type="number" step="0.01" value="0"></div><div><label>Minimum aylık ödeme</label><input id="oMinPay" type="number" step="0.01" value="0"></div></div><label>Not</label><input id="oNote" placeholder="Örn. 3 taksit, senet vb."><div class="muted">Faiz ve minimum ödeme bilgileri girilirse Avalanche / Snowball simülasyonu daha doğru çalışır.</div>`)}
function openObligationPayment(id){let o=data.obligations.find(x=>x.id===id);if(!o)return;let opts=data.accounts.filter(a=>a.type!=='credit'&&accountBalance(a.id)>0).map(a=>`<option value="${a.id}">${a.name} · ${money(accountBalance(a.id))}</option>`).join('');if(!opts)return alert(o.type==='debt'?'Ödeme için yeterli bakiyeli banka/nakit hesabı yok.':'Tahsilat için önce bir banka/nakit hesabı ekleyin.');openModal(o.type==='debt'?'Borç Ödemesi':'Alacak Tahsilatı','obligationPayment',`<input id="opId" type="hidden" value="${id}"><label>${o.type==='debt'?'Ödeme yapılacak hesap':'Tahsilat yapılacak hesap'}</label><select id="opAccount">${opts}</select><label>Tutar</label><input id="opAmount" type="number" step="0.01" value="${Math.min(obligationRemaining(o),accountBalance(data.accounts.find(a=>a.id===document.getElementById('opAccount')?.value)?.id)||obligationRemaining(o))}"><label>Tarih</label><input id="opDate" type="date" value="${new Date().toISOString().slice(0,10)}"><div class="muted">Kalan ${money(obligationRemaining(o))}</div>`)}
function deleteObligation(id){if(confirm('Bu borç/alacak kaydı silinsin mi?')){data.obligations=data.obligations.filter(o=>o.id!==id);save()}}

function renderPaymentPlan(){let el=document.getElementById('paymentPlan');if(!el)return;let today=new Date();today.setHours(0,0,0,0);let horizon=new Date(today);horizon.setMonth(horizon.getMonth()+6);let upcoming=data.transactions.filter(t=>new Date((t.date||'')+'T00:00:00')>=today&&new Date((t.date||'')+'T00:00:00')<=horizon&&t.type==='expense').map(t=>{let a=data.accounts.find(x=>x.id===t.accountId);return {...t,source:a?.name||'Hesap'};});data.obligations.forEach(o=>{let rem=obligationRemaining(o);if(rem>0&&o.dueDate){let d=new Date(o.dueDate+'T00:00:00');if(d>=today&&d<=horizon)upcoming.push({id:'ob-'+o.id,type:'expense',amount:rem,description:(o.type==='debt'?'Borç: ':'Alacak beklenen: ')+o.name,date:o.dueDate,source:o.type==='debt'?'Borç':'Alacak',isObligation:true});}});upcoming.sort((a,b)=>a.date.localeCompare(b.date));let total=upcoming.reduce((s,t)=>s+Number(t.amount),0);el.innerHTML=`<div class="cardMini"><span>Önümüzdeki 6 ay<br><b>${money(total)}</b></span><span>Kalem<br><b>${upcoming.length}</b></span><span>İlk ödeme<br><b>${upcoming[0]?fmt(upcoming[0].date):'—'}</b></span></div>`+(upcoming.length?upcoming.slice(0,15).map(t=>`<div class="row"><div><b>${t.description||t.category}</b><div class="muted">${fmt(t.date)} · ${t.source}${t.installmentCount?` · ${t.installmentNo}/${t.installmentCount} taksit`:''}</div></div><b class="negative">${money(t.amount)}</b></div>`).join(''):'<div class="empty">Yaklaşan ödeme bulunmuyor.</div>');}
function recurringNextDate(p){let d=new Date((p.nextDate||new Date().toISOString().slice(0,10))+'T12:00:00');if(p.frequency==='weekly')d.setDate(d.getDate()+7);else if(p.frequency==='yearly')d.setFullYear(d.getFullYear()+1);else d.setMonth(d.getMonth()+1);return d.toISOString().slice(0,10)}
function recurringDaysUntil(date){let t=new Date();t.setHours(0,0,0,0);let d=new Date(date+'T00:00:00');return Math.ceil((d-t)/86400000)}
function renderPlans(){let el=document.getElementById('plans');if(!el)return;let active=data.paymentPlans.filter(p=>p.active!==false),monthly=active.reduce((s,p)=>s+Number(p.amount||0)*(p.frequency==='weekly'?52/12:p.frequency==='yearly'?1/12:1)*(p.kind==='income'?-1:1),0),due7=active.filter(p=>recurringDaysUntil(p.nextDate)>=0&&recurringDaysUntil(p.nextDate)<=7).length;let head=`<div class="cardMini"><span>Aktif plan<br><b>${active.length}</b></span><span>7 gün içinde<br><b>${due7}</b></span><span>Aylık net yük<br><b class="${monthly>0?'negative':'positive'}">${money(Math.abs(monthly))}</b></span></div>`;let rows=data.paymentPlans.length?data.paymentPlans.slice().sort((a,b)=>(a.nextDate||'').localeCompare(b.nextDate||'')).map(p=>{let days=recurringDaysUntil(p.nextDate),state=p.active===false?'⏸ Duraklatıldı':days<0?'🔴 Gecikti':days<=3?'🟠 Çok yakın':days<=7?'🟡 Yaklaşıyor':'🟢 Planlı',freq=p.frequency==='weekly'?'Her hafta':p.frequency==='yearly'?'Her yıl':'Her ay';return `<div class="accountBox"><div class="row"><div><b>${p.kind==='income'?'💰':'🔁'} ${esc(p.name)}</b><div class="muted">${money(p.amount)} · ${freq} · ${fmt(p.nextDate)} · ${state}</div><div class="muted">${esc(p.category||'Diğer')}${p.lastPaid?' · Son ödeme '+fmt(p.lastPaid):''}</div></div><div class="actions">${p.active!==false?`<button class="small" onclick="markRecurringPaid('${p.id}')">${p.kind==='income'?'Alındı':'Ödendi'}</button>`:''}<button class="small secondary" onclick="toggleRecurring('${p.id}')">${p.active===false?'Başlat':'Duraklat'}</button><button class="small danger" onclick="deletePlan('${p.id}')">Sil</button></div></div></div>`}).join(''):'<div class="empty">Düzenli işlem ekleyin. Örn. kira, maaş, internet, aidat.</div>';el.innerHTML=head+rows}
function markRecurringPaid(id){let p=data.paymentPlans.find(x=>x.id===id);if(!p||p.active===false)return;let date=p.nextDate||new Date().toISOString().slice(0,10);let acc=data.accounts.find(a=>a.id===p.accountId);if(!acc)return alert('Bu planın hesabı bulunamadı.');if((p.kind||'expense')==='expense'&&acc.type!=='credit'&&Number(p.amount||0)>accountBalance(p.accountId)){if(!confirm('Hesap bakiyesi bu ödeme için yetersiz görünüyor. Yine de kaydetmek istiyor musun?'))return}data.transactions.push({id:uid(),type:p.kind||'expense',amount:Number(p.amount||0),description:p.name,category:p.category||'Diğer',accountId:p.accountId,date,recurringPlanId:p.id});p.lastPaid=date;p.paidCount=Number(p.paidCount||0)+1;p.nextDate=recurringNextDate(p);save()}
function toggleRecurring(id){let p=data.paymentPlans.find(x=>x.id===id);if(!p)return;p.active=p.active===false;save()}
function openRecurring(){let opts=data.accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');if(!opts)return alert('Düzenli işlem için önce bir hesap ekleyin.');openModal('Düzenli İşlem Ekle','recurring',`<label>İşlem adı</label><input id="rpName" placeholder="Kira, maaş, internet..."><label>Tür</label><select id="rpKind"><option value="expense">Gider / ödeme</option><option value="income">Gelir</option></select><label>Tutar</label><input id="rpAmount" type="number" step="0.01" placeholder="0"><label>Tekrarlama</label><select id="rpFreq"><option value="monthly">Her ay</option><option value="weekly">Her hafta</option><option value="yearly">Her yıl</option></select><label>Sonraki tarih</label><input id="rpDate" type="date" value="${new Date().toISOString().slice(0,10)}"><label>Hesap</label><select id="rpAccount">${opts}</select><label>Kategori</label><input id="rpCat" value="Diğer">`)}
function deletePlan(id){if(confirm('Bu düzenli işlem silinsin mi?')){data.paymentPlans=data.paymentPlans.filter(p=>p.id!==id);save()}}
function renderChart(){let months=[];let d=new Date();for(let i=5;i>=0;i--){let x=new Date(d.getFullYear(),d.getMonth()-i,1),m=x.toISOString().slice(0,7);months.push(m)}let vals=months.map(m=>{let inc=data.transactions.filter(t=>t.type==='income'&&t.date.slice(0,7)===m).reduce((s,t)=>s+ +t.amount,0),exp=data.transactions.filter(t=>t.type==='expense'&&t.date.slice(0,7)===m).reduce((s,t)=>s+ +t.amount,0);return{inc,exp,label:m.slice(5)} });let mx=Math.max(1,...vals.flatMap(x=>[x.inc,x.exp]));chart.innerHTML=vals.map(x=>`<div class="col" title="${x.label}"><div class="vbar in" style="height:${x.inc/mx*95}%"></div><div class="vbar" style="height:${x.exp/mx*95}%"></div></div>`).join('')}
function renderAccounts(){let el=document.getElementById('accounts');if(!el)return;el.innerHTML=data.accounts.length?data.accounts.map(a=>{let b=accountBalance(a.id),isCard=a.type==='credit',ci=isCard?cardInfo(a.id):null;return `<div class="accountBox"><div class="row"><div><b>${a.name}</b><div class="muted">${a.type==='bank'?'Banka':a.type==='cash'?'Nakit':a.type==='credit'?'Kredi Kartı':a.type==='investment'?'Yatırım':'Borç'}</div></div><b>${money(isCard?(ci?.debt||0):b)}</b></div>${isCard?`<div class="muted">Limit ${money(a.cardLimit)} · Kullanılabilir ${money(ci?.available||0)} · Ekstre ${money(ci?.statement||0)} · Son ödeme ${ci?.due?fmt(ci.due):'—'}</div>`:''}<div class="account-actions" style="margin-top:7px">${isCard?`<button class="small" onclick="openCardPayment('${a.id}')">Kart Öde</button>`:''}<button class="small danger" onclick="deleteAccount('${a.id}')">Sil</button></div></div>`}).join(''):'<div class="empty">Henüz hesap eklenmedi.</div>'}
function openCardPayment(id){let card=data.accounts.find(a=>a.id===id);let opts=data.accounts.filter(a=>a.id!==id&&a.type!=='credit').map(a=>`<option value="${a.id}">${a.name}</option>`).join('');if(!card||!opts)return alert('Kart ödemesi için banka veya nakit hesabı ekleyin.');openModal('Kredi Kartı Ödeme','cardPayment',`<label>Ödeme yapılacak hesap</label><select id="cpFrom">${opts}</select><label>Tutar</label><input id="cpAmount" type="number" step="0.01" max="${cardDebt(id)}" placeholder="${cardDebt(id).toFixed(2)}"><label>Tarih</label><input id="cpDate" type="date" value="${new Date().toISOString().slice(0,10)}"><div class="muted">Mevcut kart borcu: <b>${money(cardDebt(id))}</b></div>`);modalTypeCardId=id}

function monthTotals(m){let inc=data.transactions.filter(t=>t.type==='income'&&t.date.slice(0,7)===m).reduce((s,t)=>s+Number(t.amount||0),0);let exp=data.transactions.filter(t=>t.type==='expense'&&t.date.slice(0,7)===m).reduce((s,t)=>s+Number(t.amount||0),0);return{inc,exp,net:inc-exp}}
function renderReports(){let rm=reportMonth||month(),rmEl=document.getElementById('reportMonth');if(rmEl&&rmEl.value!==rm)rmEl.value=rm;let mt=monthTotals(rm),b=data.budgets.filter(x=>x.month===rm),bl=b.reduce((s,x)=>s+Number(x.amount||0),0),bs=b.reduce((s,x)=>s+budgetSpent(x),0);let ie=document.getElementById('reportIncomeExpense');if(ie)ie.innerHTML=`<div class="cardMini"><span>Gelir<br><b class="positive">${money(mt.inc)}</b></span><span>Gider<br><b class="negative">${money(mt.exp)}</b></span><span>Net<br><b class="${mt.net>=0?'positive':'negative'}">${money(mt.net)}</b></span></div><div class="progress"><div class="bar" style="width:${mt.inc?Math.min(100,Math.max(0,mt.exp/mt.inc*100)):0}%"></div></div><div class="muted">Gider / gelir oranı: ${mt.inc?Math.round(mt.exp/mt.inc*100):0}%</div>`;let rb=document.getElementById('reportBudget');if(rb)rb.innerHTML=`<div class="cardMini"><span>Limit<br><b>${money(bl)}</b></span><span>Harcanan<br><b>${money(bs)}</b></span><span>Kalan<br><b class="${bl-bs<0?'negative':'positive'}">${money(bl-bs)}</b></span></div><div class="progress"><div class="bar" style="width:${bl?Math.min(100,Math.max(0,bs/bl*100)):0}%"></div></div><div class="muted">${bl?Math.round(bs/bl*100):0}% kullanıldı · ${b.length} bütçe kalemi</div>`;
let months=[];let d=new Date(rm+'-01T00:00:00');for(let i=5;i>=0;i--){let x=new Date(d.getFullYear(),d.getMonth()-i,1);months.push(x.toISOString().slice(0,7))}let vals=months.map(m=>({...monthTotals(m),label:m.slice(5)}));let mx=Math.max(1,...vals.flatMap(x=>[x.inc,x.exp]));let rt=document.getElementById('reportTrend');if(rt)rt.innerHTML=vals.map(x=>`<div class="col" title="${x.label}: gelir ${money(x.inc)} · gider ${money(x.exp)}"><div class="vbar in" style="height:${x.inc/mx*95}%"></div><div class="vbar" style="height:${x.exp/mx*95}%"></div></div>`).join('');
let cats={};data.transactions.filter(t=>t.type==='expense'&&t.date.slice(0,7)===rm).forEach(t=>{let k=(t.categoryGroup||'Diğer')+' › '+(t.categorySubcategory||t.category||'Diğer');cats[k]=(cats[k]||0)+Number(t.amount||0)});let catArr=Object.entries(cats).sort((a,b)=>b[1]-a[1]);let rc=document.getElementById('reportCategories');if(rc)rc.innerHTML=catArr.length?catArr.map(([k,v])=>`<div class="row"><div style="flex:1"><b>${k}</b><div class="progress"><div class="bar" style="width:${mt.exp?Math.min(100,v/mt.exp*100):0}%"></div></div><span class="muted">${mt.exp?Math.round(v/mt.exp*100):0}%</span></div><b>${money(v)}</b></div>`).join(''):'<div class="empty">Bu ay harcama yok.</div>';
let cards=data.accounts.filter(a=>a.type==='credit');let rcard=document.getElementById('reportCards');if(rcard)rcard.innerHTML=cards.length?cards.map(a=>{let c=cardInfo(a.id);let use=a.cardLimit?Math.round((a.cardLimit-c.available)/a.cardLimit*100):0;return `<div class="row"><div style="flex:1"><b>${a.name}</b><div class="progress"><div class="bar" style="width:${Math.min(100,use)}%"></div></div><span class="muted">Borç ${money(c.debt)} · Limit kullanımı ${use}% · Ekstre ${money(c.statement)} · Son ödeme ${c.due?fmt(c.due):'—'}</span></div></div>`}).join(''):'<div class="empty">Kredi kartı yok.</div>';
let ins=[];let saveRate=mt.inc?mt.net/mt.inc*100:0;if(mt.exp>mt.inc&&mt.inc>0)ins.push('🔴 Bu ay giderlerin gelirlerini aşıyor. Harcamaları gözden geçir.');else if(saveRate>=20)ins.push('🟢 Bu ay gelirinin %'+Math.round(saveRate)+' kadarını koruyabiliyorsun.');else if(mt.inc>0)ins.push('🟡 Tasarruf oranı %'+Math.round(Math.max(0,saveRate))+'. Öncelikli zarfları korumaya odaklan.');if(bl&&bs>bl)ins.push('🔴 Bütçe limitinin '+money(bs-bl)+' üzerindesin.');let liquid=liquidBalance(),upcoming=0,today=new Date();today.setHours(0,0,0,0);let d30=new Date(today);d30.setDate(d30.getDate()+30);data.obligations.filter(o=>o.type==='debt'&&obligationRemaining(o)>0&&o.dueDate).forEach(o=>{let d=new Date(o.dueDate+'T23:59:59');if(d>=today&&d<=d30)upcoming+=obligationRemaining(o)});data.paymentPlans.forEach(p=>{if(p.nextDate){let d=new Date(p.nextDate+'T23:59:59');if(d>=today&&d<=d30)upcoming+=Number(p.amount||0)}});if(upcoming>liquid&&upcoming>0)ins.push('⚠️ Önümüzdeki 30 günlük planlı ödemeler mevcut nakit/banka bakiyene yaklaşıyor veya aşıyor.');cards.forEach(a=>{let c=cardInfo(a.id),u=a.cardLimit?(a.cardLimit-c.available)/a.cardLimit*100:0;if(u>=80)ins.push('⚠️ '+a.name+' kartında limit kullanımın %'+Math.round(u)+'.')});if(!ins.length)ins.push('🟢 Şu an kritik bir uyarı görünmüyor. Düzenli kayıt tutmaya devam et.');let ri=document.getElementById('reportInsights');if(ri)ri.innerHTML=ins.map(x=>`<div class="row"><span>${x}</span></div>`).join('')}

function toggleAccountFields(){let t=document.getElementById('aType')?.value,box=document.getElementById('creditFields');if(box)box.style.display=t==='credit'?'block':'none'}
function cashflowDateKey(d){return d.toISOString().slice(0,10)}
function addDays(d,n){let x=new Date(d);x.setDate(x.getDate()+n);return x}
function recurringOccurrences(p,start,end){let out=[],d=new Date(p.nextDate+'T12:00:00');if(p.active===false||isNaN(d))return out;while(d<=end){if(d>=start)out.push({date:cashflowDateKey(d),amount:Number(p.amount||0),name:p.name,type:'recurring',kind:p.kind||'expense',accountId:p.accountId});if(p.frequency==='weekly')d.setDate(d.getDate()+7);else if(p.frequency==='yearly')d.setFullYear(d.getFullYear()+1);else d.setMonth(d.getMonth()+1)}return out}
function cashflowEvents(days){let start=new Date();start.setHours(0,0,0,0);let end=addDays(start,days),events=[];
 data.transactions.forEach(t=>{let d=new Date((t.date||'')+'T12:00:00');if(isNaN(d)||d<=start||d>end)return;let amt=Number(t.amount||0);if(t.type==='transfer'){let from=data.accounts.find(a=>a.id===t.from),to=data.accounts.find(a=>a.id===t.to);if(from&&['bank','cash'].includes(from.type))events.push({date:t.date,amount:-amt,name:t.description||'Transfer',type:'transfer'});if(to&&['bank','cash'].includes(to.type))events.push({date:t.date,amount:amt,name:t.description||'Transfer',type:'transfer'});return}let a=data.accounts.find(a=>a.id===t.accountId);if(!a||!['bank','cash'].includes(a.type))return;if(t.type==='income')events.push({date:t.date,amount:amt,name:t.description||'Gelir',type:'income'});else events.push({date:t.date,amount:-amt,name:t.description||t.category||'Gider',type:'expense'});});
 data.paymentPlans.forEach(p=>{recurringOccurrences(p,start,end).forEach(e=>events.push({date:e.date,amount:(e.kind==='income'?e.amount:-e.amount),name:e.name,type:'recurring'}))});
 data.obligations.filter(o=>o.type==='debt'&&obligationRemaining(o)>0&&o.dueDate).forEach(o=>{let d=new Date(o.dueDate+'T12:00:00');if(d>start&&d<=end)events.push({date:o.dueDate,amount:-obligationRemaining(o),name:'Borç: '+o.name,type:'debt'})});
 // Credit cards: estimate payment of today's outstanding balance at the next due date.
 data.accounts.filter(a=>a.type==='credit').forEach(a=>{let c=cardInfo(a.id);if(!c||c.debt<=0)return;let due=new Date(c.due);due.setHours(12,0,0,0);if(due<=start)due=addDays(due,30);if(due>start&&due<=end)events.push({date:cashflowDateKey(due),amount:-c.debt,name:'Tahmini kart ödemesi: '+a.name,type:'card'});});
 return events.sort((a,b)=>a.date.localeCompare(b.date))}
function renderCashflow(){let sum=document.getElementById('cashflowSummary');if(!sum)return;let days=cashflowDays,start=new Date();start.setHours(0,0,0,0),events=cashflowEvents(days),real=liquidBalance(),balance=real;events.forEach(e=>balance+=e.amount);let totalIn=events.filter(e=>e.amount>0).reduce((s,e)=>s+e.amount,0),totalOut=events.filter(e=>e.amount<0).reduce((s,e)=>s-e.amount,0),min=real,run=real;events.forEach(e=>{run+=e.amount;min=Math.min(min,run)});let status=min<0?'negative':min<real*.15?'danger-text':'positive';sum.innerHTML=`<div class="cardMini"><span>Gerçek bakiye<br><b>${money(real)}</b></span><span>${days} gün sonra<br><b class="${balance<0?'negative':'positive'}">${money(balance)}</b></span><span>En düşük nokta<br><b class="${min<0?'negative':'positive'}">${money(min)}</b></span></div><div class="grid"><div class="accountBox"><b>Gelecek girişler</b><div class="row"><span>Planlanan gelir/transfer</span><b class="positive">${money(totalIn)}</b></div></div><div class="accountBox"><b>Gelecek çıkışlar</b><div class="row"><span>Gider + planlı ödeme</span><b class="negative">${money(totalOut)}</b></div></div></div><div class="pill">Nakit durumu: <span class="${status}">${min<0?'⚠️ Negatife düşüyor':min<real*.15?'🟡 Dar marj':'🟢 Güvenli marj'}</span></div>`;
 let chart=document.getElementById('cashflowChart'),pts=[{d:start,v:real}],r=real;events.forEach(e=>{r+=e.amount;pts.push({d:new Date(e.date+'T12:00:00'),v:r})});let step=Math.max(1,Math.ceil(pts.length/14)),sel=pts.filter((x,i)=>i===0||i===pts.length-1||i%step===0),mx=Math.max(real,...sel.map(x=>x.v)),mn=Math.min(0,...sel.map(x=>x.v)),range=Math.max(1,mx-mn);chart.innerHTML=sel.map(x=>{let h=Math.max(4,(x.v-mn)/range*100);return `<div class="col"><div class="vbar" style="height:${h}%" title="${fmt(x.d.toISOString().slice(0,10))}: ${money(x.v)}"></div></div>`}).join('');
 let items=document.getElementById('cashflowItems');items.innerHTML=events.length?events.slice(0,20).map(e=>`<div class="row"><div><b>${e.name}</b><div class="muted">${fmt(e.date)} · ${e.type}</div></div><b class="${e.amount>=0?'positive':'negative'}">${e.amount>=0?'+':''}${money(e.amount)}</b></div>`).join(''):'<div class="empty">Seçilen dönemde planlı bir hareket yok.</div>';
 let warns=[];if(min<0)warns.push('🔴 Tahmini nakit bakiyesi dönem içinde negatife düşüyor.');else if(min<real*.15)warns.push('🟡 Tahmini en düşük bakiye bugünkü gerçek bakiyenin %15’inden daha düşük.');if(totalOut>real+totalIn)warns.push('⚠️ Planlanan çıkışlar, mevcut nakit ve gelecek girişlerden yüksek.');if(!warns.length)warns.push('🟢 Seçilen dönemde belirgin bir nakit açığı görünmüyor.');document.getElementById('cashflowWarnings').innerHTML=warns.map(w=>`<div class="row"><span>${w}</span></div>`).join('')}

function monthKey(d){return d.toISOString().slice(0,7)}
function monthStart(y,m){return new Date(y,m,1)}
function monthEnd(y,m){return new Date(y,m+1,0)}
function historicalAverages(){
 let now=new Date(), vals=[];
 for(let i=1;i<=3;i++){
  let d=new Date(now.getFullYear(),now.getMonth()-i,1), m=monthKey(d);
  let inc=data.transactions.filter(t=>t.type==='income'&&t.date?.slice(0,7)===m).reduce((s,t)=>s+Number(t.amount||0),0);
  let exp=data.transactions.filter(t=>t.type==='expense'&&t.date?.slice(0,7)===m).reduce((s,t)=>s+Number(t.amount||0),0);
  vals.push({inc,exp});
 }
 let n=vals.length||1;
 return {inc:vals.reduce((s,x)=>s+x.inc,0)/n,exp:vals.reduce((s,x)=>s+x.exp,0)/n};
}
function forecastEventsForMonth(start,end){
 let out=[];
 data.transactions.forEach(t=>{
  if(!t.date)return;
  let d=new Date(t.date+'T12:00:00'); if(isNaN(d)||d<start||d>end)return;
  let a=Number(t.amount||0);
  if(t.type==='income')out.push({date:t.date,amount:a,name:t.description||'Gelir',kind:'income'});
  else if(t.type==='expense')out.push({date:t.date,amount:-a,name:t.description||t.category||'Gider',kind:'expense'});
 });
 data.paymentPlans.forEach(p=>recurringOccurrences(p,start,end).forEach(e=>out.push({date:e.date,amount:(e.kind==='income'?e.amount:-e.amount),name:e.name,kind:'recurring'})));
 data.obligations.filter(o=>o.type==='debt'&&obligationRemaining(o)>0&&o.dueDate).forEach(o=>{
  let d=new Date(o.dueDate+'T12:00:00');if(d>=start&&d<=end)out.push({date:o.dueDate,amount:-obligationRemaining(o),name:'Borç: '+o.name,kind:'debt'});
 });
 data.accounts.filter(a=>a.type==='credit').forEach(a=>{
  let c=cardInfo(a.id);if(!c||c.debt<=0)return;let d=new Date(c.due);d.setHours(12,0,0,0);if(d<start)d=addDays(d,30);if(d>=start&&d<=end)out.push({date:cashflowDateKey(d),amount:-c.debt,name:'Kart ödemesi: '+a.name,kind:'card'});
 });
 return out;
}
function renderForecast(){
 let sum=document.getElementById('forecastSummary'),box=document.getElementById('forecastMonths'),warn=document.getElementById('forecastWarnings');if(!sum||!box)return;
 let av=historicalAverages(), now=new Date(), start=new Date(now.getFullYear(),now.getMonth()+1,1), balance=liquidBalance(), months=[];
 for(let i=0;i<6;i++){
  let d=new Date(start.getFullYear(),start.getMonth()+i,1),e=monthEnd(d.getFullYear(),d.getMonth()), key=monthKey(d), events=forecastEventsForMonth(d,e);
  let knownInc=events.filter(x=>x.amount>0).reduce((s,x)=>s+x.amount,0),knownOut=events.filter(x=>x.amount<0).reduce((s,x)=>s-x.amount,0);
  let actualKnownInc=data.transactions.some(t=>t.type==='income'&&t.date?.slice(0,7)===key), actualKnownOut=data.transactions.some(t=>t.type==='expense'&&t.date?.slice(0,7)===key);
  let projectedInc=actualKnownInc?knownInc:av.inc+knownInc;
  let projectedOut=actualKnownOut?knownOut:av.exp+knownOut;
  let net=projectedInc-projectedOut; balance+=net;
  months.push({key,label:d.toLocaleDateString('tr-TR',{month:'long',year:'numeric'}),inc:projectedInc,out:projectedOut,net,balance,events});
 }
 let end=months[months.length-1],min=Math.min(...months.map(x=>x.balance)),totalNet=months.reduce((s,x)=>s+x.net,0);
 sum.innerHTML=`<div class="cardMini"><span>Bugünkü gerçek bakiye<br><b>${money(liquidBalance())}</b></span><span>6 ay sonrası tahmin<br><b class="${end.balance>=0?'positive':'negative'}">${money(end.balance)}</b></span><span>6 aylık net değişim<br><b class="${totalNet>=0?'positive':'negative'}">${money(totalNet)}</b></span></div><div class="muted">Tahmin tabanı: son 3 tamamlanmış ayın ortalama geliri ${money(av.inc)} · ortalama gideri ${money(av.exp)}.</div>`;
 box.innerHTML=months.map(x=>`<div class="accountBox"><div class="row"><div style="flex:1"><b>${x.label}</b><div class="muted">Tahmini gelir ${money(x.inc)} · Tahmini gider ${money(x.out)}</div></div><b class="${x.balance>=0?'positive':'negative'}">${money(x.balance)}</b></div><div class="progress"><div class="bar" style="width:${Math.min(100,Math.max(0,x.inc?x.out/x.inc*100:0))}%"></div></div><div class="muted">Aylık net: <b class="${x.net>=0?'positive':'negative'}">${money(x.net)}</b> · Tahmini dönem sonu bakiye: ${money(x.balance)}</div></div>`).join('');
 let ws=[];if(min<0)ws.push('🔴 6 aylık tahminde nakit bakiyesi negatife düşüyor. Gelir artırma veya gider azaltma planı gerekli.');if(months.some(x=>x.net<0))ws.push('🟡 En az bir ayda tahmini giderler gelirlerden yüksek.');if(end.balance<liquidBalance()*0.25&&end.balance>=0)ws.push('🟠 6 ay sonunda nakit tamponu belirgin şekilde azalıyor.');if(!ws.length)ws.push('🟢 Mevcut varsayımlarla 6 aylık nakit görünümü pozitif.');warn.innerHTML=ws.map(x=>`<div class="row"><span>${x}</span></div>`).join('');
}

function setScenario(inc,exp){let a=document.getElementById('scIncome'),b=document.getElementById('scExpense');if(a)a.value=inc;if(b)b.value=exp;runScenario()}
function runScenario(){
 let box=document.getElementById('scenarioResult');if(!box)return;
 let incPct=Number(document.getElementById('scIncome')?.value||0)/100,expPct=Number(document.getElementById('scExpense')?.value||0)/100,av=historicalAverages(),base=liquidBalance(),bal=base,min=base,total=0,months=[];
 for(let i=1;i<=6;i++){let d=new Date();d=new Date(d.getFullYear(),d.getMonth()+i,1),e=monthEnd(d.getFullYear(),d.getMonth()),ev=forecastEventsForMonth(d,e);let knownIn=ev.filter(x=>x.amount>0).reduce((s,x)=>s+x.amount,0),knownOut=ev.filter(x=>x.amount<0).reduce((s,x)=>s-x.amount,0),mi=av.inc*(1+incPct)+knownIn,mo=av.exp*(1+expPct)+knownOut,net=mi-mo;bal+=net;min=Math.min(min,bal);total+=net;months.push({label:d.toLocaleDateString('tr-TR',{month:'short'}),net,bal})}
 let end=months[5],cls=end.bal<0?'negative':end.bal<base*.25?'danger-text':'positive';
 box.innerHTML=`<div class="cardMini"><span>Başlangıç<br><b>${money(base)}</b></span><span>6 ay sonrası<br><b class="${cls}">${money(end.bal)}</b></span><span>Toplam değişim<br><b class="${total>=0?'positive':'negative'}">${money(total)}</b></span></div><div class="grid" style="margin-top:10px">${months.map(m=>`<div class="accountBox"><div class="row"><b>${m.label}</b><b class="${m.net>=0?'positive':'negative'}">${m.net>=0?'+':''}${money(m.net)}</b></div><div class="muted">Dönem sonu: ${money(m.bal)}</div></div>`).join('')}</div><div class="pill">${min<0?'🔴 Bu senaryoda nakit açığı oluşuyor.':end.bal<base*.25?'🟠 Nakit tamponu ciddi azalıyor.':'🟢 Bu senaryoda nakit görünümü pozitif.'}</div>`;
}
function renderCoach(){
  const box=document.getElementById('coachSummary'), adv=document.getElementById('coachAdvice');
  if(!box||!adv)return;
  const now=new Date(), cm=month(now), mt=monthTotals(cm);
  const liquid=data.accounts.filter(a=>a.type==='bank'||a.type==='cash').reduce((x,a)=>x+Math.max(0,accountBalance(a.id)),0);
  const assets=totals().assets, liab=totals().liab;
  const savings=mt.inc-mt.exp, rate=mt.inc>0?(savings/mt.inc*100):0;
  const budgets=data.budgets.filter(b=>b.month===cm), bLimit=budgets.reduce((x,b)=>x+Number(b.amount||0),0), bSpent=budgets.reduce((x,b)=>x+budgetSpent(b),0);
  const cards=data.accounts.filter(a=>a.type==='credit').map(a=>({a,d:cardDebt(a.id),l:Number(a.cardLimit||0)}));
  const cardDebtTotal=cards.reduce((x,c)=>x+c.d,0), cardLimitTotal=cards.reduce((x,c)=>x+c.l,0);
  const utilization=cardLimitTotal>0?cardDebtTotal/cardLimitTotal*100:0;
  const overdue=data.obligations.filter(o=>Number(o.remaining||0)>0&&o.dueDate&&new Date(o.dueDate+'T23:59:59')<now).reduce((x,o)=>x+Number(o.remaining||0),0);
  const next30=data.obligations.filter(o=>o.type==='debt'&&Number(o.remaining||0)>0&&o.dueDate&&new Date(o.dueDate+'T00:00:00')>=now&&new Date(o.dueDate+'T00:00:00')<=new Date(now.getTime()+30*86400000)).reduce((x,o)=>x+Number(o.remaining||0),0);
  const top={};data.transactions.filter(t=>t.type==='expense'&&t.date.slice(0,7)===cm).forEach(t=>{let k=t.categoryGroup||t.category||'Diğer';top[k]=(top[k]||0)+Number(t.amount||0)});
  const topCat=Object.entries(top).sort((a,b)=>b[1]-a[1])[0];
  const score=Math.max(0,Math.min(100,Math.round(50+rate*.7-(utilization>=80?20:utilization>=50?10:0)-(liab>assets&&assets>0?15:0)-(overdue>0?20:0)+(liquid>0&&mt.inc>0?Math.min(15,liquid/mt.inc*5):0))));
  box.innerHTML=`<div class="cardMini"><span>Koç skoru<br><b>${score}/100</b></span><span>Tasarruf oranı<br><b>${Math.round(rate)}%</b></span><span>Nakit rezervi<br><b>${money(liquid)}</b></span></div>`;
  let a=[];
  if(mt.inc===0)a.push(['🔵','Bu ay gelir kaydı yok.','Gelirlerini ekle; aksi halde tasarruf oranı ve tahminler eksik kalır.']);
  if(rate<0)a.push(['🔴','Giderlerin gelirini aşıyor.','Önce zorunlu olmayan giderleri azalt ve bütçeyi gelir seviyene göre yeniden dağıt.']);
  else if(rate<10&&mt.inc>0)a.push(['🟠','Tasarruf oranı düşük.','İlk hedef olarak gelirin en az %10’unu ayırmayı dene.']);
  else if(rate>=20)a.push(['🟢','Tasarruf performansın güçlü.','Bu fazlayı acil durum rezervi veya yüksek maliyetli borç kapatma için değerlendirebilirsin.']);
  if(bLimit>0&&bSpent>bLimit)a.push(['🔴','Bütçe aşımı var.',`${money(bSpent-bLimit)} tutarında bütçe aşımı görünüyor. Özellikle yüksek harcama kategorisini incele.`]);
  if(topCat&&mt.inc>0&&topCat[1]/mt.exp>.35)a.push(['🟠','Tek bir kategori bütçeyi zorluyor.',`${topCat[0]} harcamaları ${money(topCat[1])}; toplam giderin yaklaşık %${Math.round(topCat[1]/mt.exp*100)}’i.`]);
  if(utilization>=80)a.push(['🔴','Kredi kartı kullanımı yüksek.',`Kart borcu ${money(cardDebtTotal)} ve kullanım oranı yaklaşık %${Math.round(utilization)}. Yeni harcamalarda temkinli ol.`]);
  else if(utilization>=50)a.push(['🟠','Kredi kartı kullanımını izle.',`Toplam kullanım oranı yaklaşık %${Math.round(utilization)}.`]);
  if(overdue>0)a.push(['🔴','Vadesi geçmiş borç var.',`${money(overdue)} tutarında kalan borcun vadesi geçmiş görünüyor.`]);
  if(next30>liquid&&next30>0)a.push(['🔴','30 günlük borç baskısı oluşuyor.',`Yaklaşan borçlar ${money(next30)}, mevcut likit bakiye ${money(liquid)}.`]);
  if(liquid>0&&mt.inc>0&&liquid<mt.exp)a.push(['🟠','Nakit tamponu zayıf.',`Likit nakit, bu ayki gider seviyesinin altında. Öncelik bir nakit tamponu oluşturmak olmalı.`]);
  if(!a.length)a.push(['🟢','Finansal görünüm dengeli.','Bütçe limitlerini koru, kredi kartı kullanımını takip et ve düzenli olarak rezerv oluştur.']);
  adv.innerHTML=a.slice(0,6).map(x=>`<div class="row"><div><b>${x[0]} ${x[1]}</b><div class="muted">${x[2]}</div></div></div>`).join('');
}
function esc(x){return String(x??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function hashText(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return ('00000000'+(h>>>0).toString(16)).slice(-8)}
function emergencyTarget(){return Math.max(0,Number(data.emergencyFund.essentialMonthly||0)*Math.max(1,Number(data.emergencyFund.targetMonths||6)))}
function emergencyCurrent(){let e=data.emergencyFund;if(Number(e.balance)>0)return Number(e.balance);if(e.accountId)return Math.max(0,accountBalance(e.accountId));return 0}
function emergencyMetrics(){
  const e=data.emergencyFund||{}, essential=Math.max(0,Number(e.essentialMonthly||0)), targetMonths=Math.max(1,Number(e.targetMonths||6));
  const target=essential*targetMonths, current=emergencyCurrent(), missing=Math.max(0,target-current), pct=target?Math.min(100,current/target*100):0;
  const coverageMonths=essential>0?current/essential:0, t=totals(), monthlyNet=Math.max(0,Number(t.mi||0)-Number(t.me||0));
  const baseline=missing>0?Math.ceil(missing/12):0, capacity=monthlyNet>0?Math.round(monthlyNet*0.25):0;
  const recommended=missing>0?Math.min(missing,Math.max(baseline,capacity)):0, etaMonths=recommended>0?Math.ceil(missing/recommended):0;
  return {essential,targetMonths,target,current,missing,pct,coverageMonths,monthlyNet,recommended,etaMonths};
}
function openEmergencyFund(){
  const e=data.emergencyFund, selected=Number(e.targetMonths||6), standard=[3,6,12], options=standard.map(n=>`<option value="${n}" ${selected===n?'selected':''}>${n} ay</option>`).join('')+(standard.includes(selected)?'':`<option value="${selected}" selected>${selected} ay (özel)</option>`);
  openModal('🛡️ Acil Durum Fonu','emergency',`<label>Aylık temel / zorunlu gider</label><input id="efEssential" type="number" step="0.01" min="0" value="${e.essentialMonthly||0}" placeholder="Örn. 30000"><label>Güvence hedefi</label><select id="efMonths">${options}</select><label>Mevcut acil durum fonu</label><input id="efBalance" type="number" step="0.01" min="0" value="${e.balance||0}"><label>Fonun bulunduğu hesap (isteğe bağlı)</label><select id="efAccount"><option value="">Manuel tutar kullan</option>${data.accounts.filter(a=>!['credit','debt'].includes(a.type)).map(a=>`<option value="${a.id}" ${e.accountId===a.id?'selected':''}>${esc(a.name)}</option>`).join('')}</select><div class="securityBadge">FinPal 4.1, güvence hedefini ve aylık nakit fazlanı kullanarak önerilen katkı ile tahmini tamamlanma süresini hesaplar.</div>`);
}
function renderEmergency(){
  const m=emergencyMetrics();
  let html;
  if(!m.target){
    html='<div class="empty">Aylık temel giderini ve 3 / 6 / 12 aylık güvence hedefini girerek acil durum fonunu başlat.</div>';
  }else{
    const coverageText=m.essential>0?`${m.coverageMonths.toFixed(1).replace('.',',')} ay`:'—';
    const status=m.pct>=100?'🟢 Hedef tamamlandı':m.coverageMonths>=3?'🟢 Temel güvence oluştu':m.coverageMonths>=1?'🟠 Güvence gelişiyor':'🔴 Güvence düşük';
    const eta=m.pct>=100?'Hedefe ulaşıldı':m.recommended>0?`Bu katkı hızıyla yaklaşık ${m.etaMonths} ayda hedefe ulaşabilirsin`:'Aylık katkı için pozitif nakit fazlası oluştur';
    html=`<div class="kpi"><div>Mevcut<b>${money(m.current)}</b></div><div>Hedef (${m.targetMonths} ay)<b>${money(m.target)}</b></div><div>Kalan<b>${money(m.missing)}</b></div></div><div class="progress"><div class="bar" style="width:${m.pct}%"></div></div><div class="row"><span>Tamamlanma</span><b>%${Math.round(m.pct)}</b></div><div class="row"><span>Gider güvencesi</span><b>${coverageText}</b></div><div class="row"><span>Önerilen aylık katkı</span><b>${money(m.recommended)}</b></div><div class="row"><span>Tahmini süre</span><b>${m.pct>=100?'Tamamlandı':m.etaMonths?m.etaMonths+' ay':'—'}</b></div><div class="${m.pct>=100?'okBox':'warnBox'}">${status}<br><span class="muted">${eta}</span></div>`;
  }
  ['emergencySummary','emergencyDetail'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=html});
}
function assetLabel(t){return {gold:'Altın',fx:'Döviz',stock:'Hisse',fund:'Fon',crypto:'Kripto',vehicle:'Araç',realestate:'Gayrimenkul',other:'Diğer'}[t]||'Diğer'}
function openAsset(){openModal('📈 Varlık Ekle','asset',`<label>Varlık adı</label><input id="asName" placeholder="Gram Altın / USD / Araç..." required><label>Tür</label><select id="asType"><option value="gold">Altın</option><option value="fx">Döviz</option><option value="stock">Hisse</option><option value="fund">Fon</option><option value="crypto">Kripto</option><option value="vehicle">Araç</option><option value="realestate">Gayrimenkul</option><option value="other">Diğer</option></select><div class="grid"><div><label>Miktar / adet</label><input id="asQty" type="number" step="0.000001" value="1"></div><div><label>Alış birim fiyatı</label><input id="asCost" type="number" step="0.01" placeholder="0"></div></div><label>Güncel birim fiyat / değer</label><input id="asCurrent" type="number" step="0.01" placeholder="0"><label>Not</label><input id="asNote" placeholder="İsteğe bağlı"><div class="muted">Varlık değerleri manuel girilir; otomatik piyasa fiyatı çekilmez. Böylece tek HTML dosyası çevrimdışı da çalışabilir.</div>`)}
function editAsset(id){let a=data.assets.find(x=>x.id===id);if(!a)return;openModal('Varlığı Güncelle','assetEdit',`<input id="aeId" type="hidden" value="${id}"><label>Varlık adı</label><input id="aeName" value="${esc(a.name)}"><label>Miktar</label><input id="aeQty" type="number" step="0.000001" value="${a.quantity}"><label>Alış birim fiyatı</label><input id="aeCost" type="number" step="0.01" value="${a.unitCost}"><label>Güncel birim fiyat / değer</label><input id="aeCurrent" type="number" step="0.01" value="${a.currentPrice}"><label>Not</label><input id="aeNote" value="${esc(a.note||'')}"><button class="danger" onclick="deleteAsset('${id}')">Varlığı Sil</button>`)}
function deleteAsset(id){if(confirm('Bu varlık silinsin mi?')){data.assets=data.assets.filter(a=>a.id!==id);save();closeModal()}}
function renderAssets(){let el=document.getElementById('assetsDetail'),sum=document.getElementById('assetSummary');let total=trackedAssetTotal(),cost=trackedAssetCost(),gain=total-cost,pct=cost?gain/cost*100:0;let rows=data.assets.map(a=>{let v=Number(a.quantity||0)*Number(a.currentPrice||0),c=Number(a.quantity||0)*Number(a.unitCost||0),g=v-c;return `<div class="assetLine"><div><b>${esc(a.name)}</b><div class="muted">${assetLabel(a.type)} · ${a.quantity} adet</div></div><div style="text-align:right"><b>${money(v)}</b><div class="mini ${g>=0?'positive':'negative'}">${g>=0?'+':''}${money(g)} · ${c?((g/c)*100).toFixed(1):'0'}%</div><button class="light smallBtn" onclick="editAsset('${a.id}')">Düzenle</button></div></div>`}).join('');if(el)el.innerHTML=(rows||'<div class="empty">Henüz varlık eklenmedi.</div>')+`<div class="kpi"><div>Değer<b>${money(total)}</b></div><div>Maliyet<b>${money(cost)}</b></div><div>K/Z<b class="${gain>=0?'positive':'negative'}">${gain>=0?'+':''}${money(gain)}</b></div></div>`;if(sum)sum.innerHTML=`<div class="kpi"><div>Portföy<b>${money(total)}</b></div><div>K/Z<b class="${gain>=0?'positive':'negative'}">${gain>=0?'+':''}${money(gain)}</b></div><div>Getiri<b>${pct.toFixed(1)}%</b></div></div>`+(rows?'<div class="muted">Varlıklar toplam net varlığa dahil edilir.</div>':'')}

/* FinPal 4.5 Pro — Varlık Takibi ve Net Değer */
function assetMetrics45(){
  const rows=(data.assets||[]).map(a=>{
    const value=Number(a.quantity||0)*Number(a.currentPrice||0);
    const cost=Number(a.quantity||0)*Number(a.unitCost||0);
    return {...a,value,cost,gain:value-cost,returnPct:cost?(value-cost)/cost*100:0};
  });
  const portfolio=rows.reduce((s,a)=>s+a.value,0),cost=rows.reduce((s,a)=>s+a.cost,0),gain=portfolio-cost;
  const byType={}; rows.forEach(a=>byType[a.type]=(byType[a.type]||0)+a.value);
  const top=[...rows].sort((a,b)=>b.value-a.value)[0],concentration=portfolio&&top?top.value/portfolio*100:0,t=totals();
  return {rows,portfolio,cost,gain,returnPct:cost?gain/cost*100:0,byType,top,concentration,assets:t.assets,liabilities:t.liab,net:t.net};
}
function svgNetWorth45(history){
  const h=(history||[]).slice(-90);
  if(!h.length)return '<div class="empty">Net değer geçmişi henüz oluşmadı. Bugünü kaydet veya FinPal kullanmaya devam et.</div>';
  const pts=h.map(x=>Number(x.net||0)),min=Math.min(...pts),max=Math.max(...pts),span=Math.max(1,max-min),W=640,H=190,P=18;
  const xy=h.map((x,i)=>[P+(W-2*P)*(h.length===1?.5:i/(h.length-1)),H-P-(H-2*P)*((Number(x.net||0)-min)/span)]);
  const path=xy.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const first=h[0],last=h[h.length-1],delta=Number(last.net||0)-Number(first.net||0);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="190" role="img" aria-label="Net değer grafiği"><path d="${path}" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${xy[xy.length-1][0]}" cy="${xy[xy.length-1][1]}" r="6" fill="currentColor"/></svg><div class="row"><span>${fmt(first.date)} → ${fmt(last.date)}</span><b class="${delta>=0?'positive':'negative'}">${delta>=0?'+':''}${money(delta)}</b></div>`;
}
function renderAssets45(){
  const el=document.getElementById('asset45Dashboard');if(!el)return;
  const m=assetMetrics45(),history=Array.isArray(data.netWorthHistory)?data.netWorthHistory:[];
  const allocation=Object.entries(m.byType).sort((a,b)=>b[1]-a[1]).map(([type,value])=>{
    const pct=m.portfolio?value/m.portfolio*100:0;
    return `<div class="row"><span>${assetLabel(type)}</span><b>${money(value)} · %${pct.toFixed(1)}</b></div><div class="progress"><div class="bar" style="width:${Math.min(100,pct)}%"></div></div>`;
  }).join('');
  const risk=m.concentration>=70?'🔴 Yüksek yoğunlaşma':m.concentration>=45?'🟠 Orta yoğunlaşma':'🟢 Dengeli dağılım';
  const topText=m.top?`${esc(m.top.name)} · %${m.concentration.toFixed(1)}`:'—';
  el.innerHTML=`<div class="kpi"><div>Net Değer<b class="${m.net>=0?'positive':'negative'}">${money(m.net)}</b></div><div>Portföy<b>${money(m.portfolio)}</b></div><div>Toplam K/Z<b class="${m.gain>=0?'positive':'negative'}">${m.gain>=0?'+':''}${money(m.gain)}</b></div></div>
  <div class="kpi"><div>Portföy Getirisi<b class="${m.returnPct>=0?'positive':'negative'}">%${m.returnPct.toFixed(1)}</b></div><div>En Büyük Pozisyon<b>${topText}</b></div><div>Risk<b>${risk}</b></div></div>
  <div class="grid"><div><h3>📊 Varlık Dağılımı</h3>${allocation||'<div class="empty">Henüz varlık yok.</div>'}</div><div><h3>📈 Net Değer Geçmişi</h3>${svgNetWorth45(history)}</div></div>
  <div class="muted" style="margin-top:10px">Net değer = tüm varlıklar − borçlar. Geçmiş, FinPal veri kaydettiğinde günlük tek bir nokta olarak saklanır.</div>`;
}
function downloadAssets45CSV(){
  const m=assetMetrics45(),rows=[['Varlık','Tür','Miktar','Alış Birim Fiyatı','Güncel Birim Fiyat','Maliyet','Güncel Değer','Kar/Zarar','Getiri %']];
  m.rows.forEach(a=>rows.push([a.name,assetLabel(a.type),a.quantity,a.unitCost,a.currentPrice,a.cost,a.value,a.gain,a.returnPct.toFixed(2)]));
  const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='FinPal_Varliklar_'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
}

function debtPayoffDate(months){if(!months||months>=600)return '—';let d=new Date();d.setDate(1);d.setMonth(d.getMonth()+months);return d.toLocaleDateString('tr-TR',{month:'long',year:'numeric'})}
function debtMetrics(extra=0,strategy='avalanche'){
 let debts=data.obligations.filter(o=>o.type==='debt'&&obligationRemaining(o)>0).map(o=>({id:o.id,name:o.name||'Borç',o,r:obligationRemaining(o),rate:Math.max(0,Number(o.interestRate||0)),min:Math.max(0,Number(o.minimumPayment||0))}));
 let total=debts.reduce((s,x)=>s+x.r,0),minimum=debts.reduce((s,x)=>s+x.min,0),payment=minimum+Math.max(0,Number(extra)||0);
 let weightedRate=total?debts.reduce((s,x)=>s+x.r*x.rate,0)/total:0;
 let balances=debts.map(x=>({...x,balance:x.r})),interest=0,months=0,payoff={},stalled=false;
 if(total>0&&payment>0){
  while(balances.some(x=>x.balance>.005)&&months<600){
   months++;
   let before=balances.reduce((s,x)=>s+x.balance,0);
   for(let x of balances){if(x.balance<=.005)continue;let im=x.balance*(x.rate/100)/12;x.balance+=im;interest+=im}
   let available=payment;
   for(let x of balances){if(x.balance<=.005||available<=0)continue;let pay=Math.min(x.balance,x.min,available);x.balance-=pay;available-=pay;if(x.balance<=.005&&!payoff[x.id])payoff[x.id]=months}
   while(available>.005){
    let active=balances.filter(x=>x.balance>.005);if(!active.length)break;
    active.sort((a,b)=>strategy==='snowball'?(a.balance-b.balance||b.rate-a.rate):(b.rate-a.rate||a.balance-b.balance));
    let x=active[0],pay=Math.min(x.balance,available);x.balance-=pay;available-=pay;if(x.balance<=.005&&!payoff[x.id])payoff[x.id]=months;
   }
   let after=balances.reduce((s,x)=>s+x.balance,0);
   if(after>=before-.005 && months>3){stalled=true;break}
  }
 }
 let ordered=[...debts].sort((a,b)=>strategy==='snowball'?(a.r-b.r||b.rate-a.rate):(b.rate-a.rate||a.r-b.r));
 return {debts,ordered,total,minimum,payment,weightedRate,interest,months:stalled||months>=600?0:months,payoff,stalled};
}
function debtRecommendedExtra(){let mt=monthTotals(month()),surplus=Math.max(0,mt.inc-mt.exp);if(!surplus)return 0;let efT=emergencyTarget(),efC=emergencyCurrent(),reserveFactor=efT&&efC<efT?0.25:0.5;return Math.round(surplus*reserveFactor/100)*100}
function openDebtStrategy(){let sug=debtRecommendedExtra();openModal('💳 FinPal 4.2 — Borç Özgürlük Planı','debtStrategy',`<div class="kpi"><div>Önerilen ek ödeme<b>${money(sug)}</b></div><div>Yöntem<b>Avalanche / Snowball</b></div></div><label>Ek aylık ödeme</label><input id="dsExtra" type="number" step="100" min="0" value="${sug}"><label>Tercih edilen strateji</label><select id="dsStrategy"><option value="avalanche">Avalanche — en yüksek faiz önce</option><option value="snowball">Snowball — en küçük borç önce</option></select><div class="muted">FinPal iki yöntemi de aynı aylık ödeme ile karşılaştırır. Faiz ve minimum ödeme bilgileri ne kadar eksiksizse tahmin o kadar anlamlı olur.</div><div class="actions"><button onclick="calculateDebtStrategy()">Planı Hesapla</button></div><div id="dsResult" style="margin-top:12px"></div>`);calculateDebtStrategy()}
function calculateDebtStrategy(){
 let extra=Math.max(0,+val('dsExtra')||0),str=val('dsStrategy')||'avalanche',a=debtMetrics(extra,'avalanche'),s=debtMetrics(extra,'snowball'),m=str==='snowball'?s:a,el=document.getElementById('dsResult');if(!el)return;
 if(!m.debts.length){el.innerHTML='<div class="empty">Aktif borç yok.</div>';return}
 let baseline=debtMetrics(0,'avalanche'),saved=(extra>0&&baseline.months&&m.months)?Math.max(0,baseline.interest-m.interest):0;
 let recommended=(a.months&&s.months)?(a.interest<s.interest-1?'Avalanche':s.months<a.months?'Snowball':'İki yöntem benzer'):'Veri gerekli';
 let order=m.ordered.map((x,i)=>`<div class="row"><span>${i+1}. ${esc(x.name)} <span class="muted">· %${x.rate.toFixed(2)}</span></span><b>${money(x.r)}</b></div>`).join('');
 let rows=m.ordered.map(x=>{let pm=m.payoff[x.id];return `<div class="row"><span>${esc(x.name)}</span><b>${pm?pm+'. ay':'—'}</b></div>`}).join('');
 el.innerHTML=`<div class="kpi"><div>Toplam borç<b>${money(m.total)}</b></div><div>Aylık plan<b>${money(m.payment)}</b></div><div>Borçsuz tarih<b>${debtPayoffDate(m.months)}</b></div></div><div class="grid"><div class="accountBox"><b>Avalanche</b><div class="row"><span>Süre</span><b>${a.months?a.months+' ay':'—'}</b></div><div class="row"><span>Tahmini faiz</span><b>${a.months?money(a.interest):'—'}</b></div></div><div class="accountBox"><b>Snowball</b><div class="row"><span>Süre</span><b>${s.months?s.months+' ay':'—'}</b></div><div class="row"><span>Tahmini faiz</span><b>${s.months?money(s.interest):'—'}</b></div></div></div><div class="accountBox" style="margin-top:9px"><div class="row"><span>FinPal önerisi</span><b>${recommended}</b></div><div class="row"><span>Ek ödeme ile tahmini faiz avantajı</span><b class="positive">${saved?money(saved):'—'}</b></div><div class="row"><span>Ağırlıklı yıllık faiz</span><b>%${m.weightedRate.toFixed(2)}</b></div></div><h3>Ödeme önceliği</h3>${order}<h3>Tahmini kapanış sırası</h3>${rows}${m.stalled?'<div class="warnBox">Mevcut aylık ödeme, faiz nedeniyle borcu azaltmaya yetmiyor olabilir. Minimum ödemeleri veya ek ödemeyi artır.</div>':''}`;
}
function renderDebts(){
 let el=document.getElementById('debtSummary');if(!el)return;let m=debtMetrics(0,'avalanche'),mt=monthTotals(month()),income=mt.inc,ratio=income?m.total/income*100:0,service=income?m.minimum/income*100:0,sug=debtRecommendedExtra(),withExtra=debtMetrics(sug,'avalanche');
 if(!m.total){el.innerHTML='<div class="empty">Borç eklediğinde FinPal ödeme sırası, faiz yükü ve borçsuz kalma tarihini hesaplar.</div>';return}
 let risk=service>40?'Yüksek':service>25?'Orta':'Kontrollü';
 el.innerHTML=`<div class="kpi"><div>Toplam borç<b>${money(m.total)}</b></div><div>Ağırlıklı faiz<b>%${m.weightedRate.toFixed(1)}</b></div><div>Min. ödeme<b>${money(m.minimum)}</b></div></div><div class="row"><span>Borç / aylık gelir</span><b>${income?ratio.toFixed(0)+'%':'—'}</b></div><div class="row"><span>Minimum ödeme / gelir</span><b>${income?service.toFixed(0)+'%':'—'} · ${risk}</b></div><div class="row"><span>Mevcut planla borçsuz tarih</span><b>${debtPayoffDate(m.months)}</b></div>${sug?`<div class="row"><span>FinPal önerilen ek ödeme</span><b class="positive">${money(sug)}</b></div><div class="row"><span>Öneri uygulanırsa</span><b>${debtPayoffDate(withExtra.months)}</b></div>`:''}<button onclick="openDebtStrategy()">Borç Özgürlük Planını Aç</button>`;
}
function openSecurity(){let s=data.security;let supported=window.isSecureContext&&window.PublicKeyCredential;openModal('🔐 PIN / Face ID Altyapısı','security',`<label>PIN kilidi</label><select id="secPin"><option value="on" ${s.pinEnabled?'selected':''}>Açık</option><option value="off" ${!s.pinEnabled?'selected':''}>Kapalı</option></select><label>${s.pinEnabled?'Yeni PIN (boş bırak = değiştirme)':'PIN (4-6 hane)'}</label><input id="secPinValue" inputmode="numeric" type="password" maxlength="6" placeholder="••••"><label>Otomatik kilit</label><select id="secAuto"><option value="0" ${s.autoLock==0?'selected':''}>Hemen</option><option value="1" ${s.autoLock==1?'selected':''}>1 dakika</option><option value="5" ${s.autoLock==5?'selected':''}>5 dakika</option><option value="15" ${s.autoLock==15?'selected':''}>15 dakika</option><option value="30" ${s.autoLock==30?'selected':''}>30 dakika</option></select><div class="securityBadge">${supported?'Bu HTTPS ortamında WebAuthn/Passkey desteklenebilir. Face ID görünürse biyometrik doğrulama cihaz tarafından yapılır.':'WebAuthn için HTTPS ve destekleyen tarayıcı gerekir.'}</div><div class="actions"><button ${supported?'':'disabled'} onclick="registerWebAuthn()">Face ID / Biyometri Kaydet</button>${s.biometricEnabled?'<button class="light" onclick="removeBiometric()">Biyometriyi Kaldır</button>':''}</div>`)}
function webauthnAvailable(){return window.isSecureContext&&!!window.PublicKeyCredential&&!!navigator.credentials}
async function registerWebAuthn(){if(!webauthnAvailable())return alert('WebAuthn bu ortamda kullanılamıyor. FinPal HTTPS üzerinden açılmalı.');try{let cred=await navigator.credentials.create({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),rp:{name:'FinPal'},user:{id:crypto.getRandomValues(new Uint8Array(16)),name:'finpal-user',displayName:'FinPal Kullanıcısı'},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],timeout:60000,authenticatorSelection:{userVerification:'required'}}});data.security.biometricEnabled=true;data.security.credentialId=btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));save();alert('Biyometrik giriş altyapısı kaydedildi.');closeModal()}catch(e){alert('Biyometrik kayıt tamamlanamadı: '+(e.message||'İşlem iptal edildi.'))}}
async function unlockWithWebAuthn(){if(!webauthnAvailable()||!data.security.credentialId)return;try{let raw=Uint8Array.from(atob(data.security.credentialId),c=>c.charCodeAt(0));await navigator.credentials.get({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),allowCredentials:[{id:raw,type:'public-key'}],userVerification:'required'},mediation:'optional'});unlock()}catch(e){document.getElementById('lockMsg').textContent='Biyometrik doğrulama başarısız veya iptal edildi.'}}
function removeBiometric(){data.security.biometricEnabled=false;data.security.credentialId='';save();closeModal()}
function openLock(){let ls=document.getElementById('lockScreen');if(!ls)return;ls.classList.add('on');let b=document.getElementById('webauthnUnlock');if(b)b.style.display=data.security.biometricEnabled?'block':'none'}
function unlock(){document.getElementById('lockScreen').classList.remove('on');sessionStorage.setItem('finpalUnlocked','1');touchActivity()}
function unlockWithPin(){let p=(document.getElementById('unlockPin').value||'').trim();if(!/^\d{4,6}$/.test(p))return document.getElementById('lockMsg').textContent='4-6 haneli PIN girin.';if(hashText(p)!==data.security.pinHash){document.getElementById('lockMsg').textContent='PIN hatalı.';return}document.getElementById('unlockPin').value='';unlock()}
let lastActivity=Date.now();function touchActivity(){lastActivity=Date.now()}['click','touchstart','keydown'].forEach(ev=>document.addEventListener(ev,touchActivity,{passive:true}));setInterval(()=>{if(data.security.pinEnabled&&document.getElementById('lockScreen')&&!document.getElementById('lockScreen').classList.contains('on')&&data.security.autoLock>=0&&Date.now()-lastActivity>=Number(data.security.autoLock)*60000){sessionStorage.removeItem('finpalUnlocked');openLock()}},10000);
function renderSecurity(){let el=document.getElementById('securityDetail');if(!el)return;el.innerHTML=`<div class="row"><span>PIN kilidi</span><b>${data.security.pinEnabled?'Açık':'Kapalı'}</b></div><div class="row"><span>Otomatik kilit</span><b>${data.security.autoLock==0?'Hemen':data.security.autoLock+' dk'}</b></div><div class="row"><span>Face ID / WebAuthn</span><b>${data.security.biometricEnabled?'Hazır':'Kurulmadı'}</b></div><div class="muted">Not: Saf HTML doğrudan iOS Face ID API'sine erişmez; WebAuthn/Passkey cihazın biyometrik doğrulamasını kullanır.</div>`}
function renderExecutiveDashboard(){
 let t=totals(),liquid=liquidBalance(),today=new Date(); today.setHours(0,0,0,0);
 let upcoming=[];
 (data.paymentPlans||[]).forEach(p=>{if(p.nextDate){let d=new Date(p.nextDate+'T23:59:59');if(d>=today){upcoming.push({date:p.nextDate,amount:Number(p.amount||0),name:p.name,kind:'Düzenli ödeme'})}}});
 (data.obligations||[]).filter(o=>o.type==='debt'&&obligationRemaining(o)>0&&o.dueDate).forEach(o=>{let d=new Date(o.dueDate+'T23:59:59');if(d>=today)upcoming.push({date:o.dueDate,amount:obligationRemaining(o),name:o.name,kind:'Borç'})});
 upcoming.sort((a,b)=>a.date.localeCompare(b.date));
 let next=upcoming.slice(0,4),next30=upcoming.filter(x=>{let d=new Date(x.date+'T23:59:59'),e=new Date(today);e.setDate(e.getDate()+30);return d<=e}).reduce((s,x)=>s+x.amount,0);
 let safe=Math.max(0,liquid-next30);
 let se=document.getElementById('execSafeSpend');if(se)se.textContent=money(safe);
 let st=document.getElementById('execSafeText');if(st)st.textContent='Mevcut nakitten önümüzdeki 30 günlük planlı çıkışlar ayrıldıktan sonra';
 let ue=document.getElementById('execUpcoming');if(ue)ue.innerHTML=next.length?next.map(x=>`<div class="execRow"><span><b>${esc(x.name)}</b><small class="execSub">${x.kind} · ${fmt(x.date)}</small></span><b class="execNegative">${money(x.amount)}</b></div>`).join(''):`<div class="execEmpty">Önümüzdeki dönem için kayıtlı ödeme yok.</div>`;
 let efTarget=emergencyTarget(),efCur=emergencyCurrent(),efPct=efTarget?Math.min(100,efCur/efTarget*100):0;
 let debt=(data.obligations||[]).filter(x=>x.type==='debt').reduce((s,x)=>s+obligationRemaining(x),0);
 let se2=document.getElementById('execSecurity');if(se2)se2.innerHTML=`<div class="execRow"><span>Acil fon</span><b>${efTarget?Math.round(efPct)+'%':'Ayarlanmadı'}</b></div>${efTarget?`<div class="execProgress"><i style="width:${efPct}%"></i></div>`:''}<div class="execRow"><span>Toplam borç</span><b class="${debt?'execNegative':'execPositive'}">${money(debt)}</b></div><div class="execRow"><span>30 gün çıkışı</span><b>${money(next30)}</b></div>`;
 let ge=document.getElementById('execGoals');if(ge)ge.innerHTML=data.goals?.length?data.goals.slice(0,3).map(g=>{let p=g.target?Math.min(100,g.saved/g.target*100):0;return `<div class="execRow"><span><b>${esc(g.name)}</b><small class="execSub">${money(g.saved)} / ${money(g.target)}</small></span><b>${Math.round(p)}%</b></div><div class="execProgress"><i style="width:${p}%"></i></div>`}).join(''):`<div class="execEmpty">Henüz finansal hedef oluşturulmadı.</div>`;
 let at=trackedAssetTotal(),ac=trackedAssetCost(),gain=at-ac;let ie=document.getElementById('execInvestments');if(ie)ie.innerHTML=`<div class="execMetric">${money(at)}</div><div class="execSub">Portföy değeri</div><div class="execRow"><span>Maliyet</span><b>${money(ac)}</b></div><div class="execRow"><span>Kâr / Zarar</span><b class="${gain>=0?'execPositive':'execNegative'}">${gain>=0?'+':''}${money(gain)}</b></div>`;
 let act=document.getElementById('execNextAction'),actions=[];let rate=t.mi?t.me/t.mi*100:0;if(!efTarget)actions.push('🛟 Acil durum fonunu ayarla.');else if(efPct<50)actions.push('🛟 Acil durum fonunu güçlendir.');if(t.mi&&rate>80)actions.push('⚠️ Bu ay giderlerin gelirin %80’inden fazla; bütçeni kontrol et.');if(debt>0)actions.push('💳 Borç stratejisini gözden geçir ve minimum ödemeleri kontrol et.');if(!actions.length)actions.push('🟢 Kritik bir işlem görünmüyor. Bir finansal hedefe düzenli katkı yap.');if(act)act.innerHTML=actions.slice(0,3).map(x=>`<div class="execAlert">${x}</div>`).join('');
}


function calculateFinancialHealth(){
  const t=totals();
  const m=month();
  const income=Math.max(0,Number(t.mi||0));
  const expense=Math.max(0,Number(t.me||0));
  const savingsRate=income>0?((income-expense)/income)*100:0;

  // 1) Tasarruf oranı: 25 puan
  let savingsScore=0;
  if(income>0){
    if(savingsRate>=20)savingsScore=25;
    else if(savingsRate>=10)savingsScore=18+(savingsRate-10)*0.7;
    else if(savingsRate>=0)savingsScore=8+savingsRate;
    else savingsScore=Math.max(0,8+savingsRate*0.4);
  }

  // 2) Borç yükü: 20 puan. Kayıtlı borç + kredi yükünü gelirle kıyaslar.
  const dm=debtMetrics(0,'avalanche');
  const debtTotal=Math.max(Number(t.liab||0),Number(dm.total||0));
  const debtToIncome=income>0?debtTotal/income:(debtTotal>0?99:0);
  let debtScore=20;
  if(debtTotal>0){
    if(debtToIncome<=1)debtScore=18;
    else if(debtToIncome<=3)debtScore=14;
    else if(debtToIncome<=6)debtScore=8;
    else debtScore=3;
  }

  // 3) Acil durum fonu: 20 puan
  const efTarget=emergencyTarget(), efCur=emergencyCurrent();
  const efRatio=efTarget>0?Math.max(0,Math.min(1,efCur/efTarget)):0;
  const emergencyScore=efTarget>0?20*efRatio:0;

  // 4) Bütçe performansı: 15 puan
  const budgets=(data.budgets||[]).filter(b=>b.month===m);
  const budgetLimit=budgets.reduce((sum,b)=>sum+Number(b.amount||0),0);
  const budgetSpentTotal=budgets.reduce((sum,b)=>sum+budgetSpent(b),0);
  let budgetScore=0;
  if(budgetLimit>0){
    const usage=budgetSpentTotal/budgetLimit;
    if(usage<=1)budgetScore=15;
    else if(usage<=1.10)budgetScore=11;
    else if(usage<=1.25)budgetScore=6;
    else budgetScore=2;
  }

  // 5) Net varlık: 10 puan
  let netWorthScore=0;
  if(t.net>0)netWorthScore=10;
  else if(t.net===0)netWorthScore=5;

  // 6) Düzenli gelir/gider dengesi: 10 puan
  const hist=historicalAverages();
  const avgIncome=Math.max(0,Number(hist.inc||0));
  const avgExpense=Math.max(0,Number(hist.exp||0));
  const balanceBase=avgIncome>0?avgIncome:income;
  const balanceExpense=avgIncome>0?avgExpense:expense;
  let balanceScore=0;
  if(balanceBase>0){
    const ratio=balanceExpense/balanceBase;
    if(ratio<=0.70)balanceScore=10;
    else if(ratio<=0.85)balanceScore=8;
    else if(ratio<=1)balanceScore=5;
    else balanceScore=1;
  }

  const score=Math.max(0,Math.min(100,Math.round(savingsScore+debtScore+emergencyScore+budgetScore+netWorthScore+balanceScore)));
  const label=score>=85?'Mükemmel':score>=70?'Çok İyi':score>=55?'İyi':score>=40?'Dengeli':'Dikkat';

  const notes=[];
  notes.push({ok:savingsRate>=10,text:`Tasarruf oranı ${Math.round(savingsRate)}%${income<=0?' · bu ay gelir kaydı yok':''}`});
  notes.push({ok:debtTotal===0||debtToIncome<=3,text:debtTotal?`Borç yükü aylık gelirin ${income>0?debtToIncome.toFixed(1)+' katı':'üzerinde; gelir verisi yok'}`:'Kayıtlı borç yükü yok'});
  notes.push({ok:efTarget>0&&efRatio>=0.5,text:efTarget?`Acil durum fonu hedefinin %${Math.round(efRatio*100)}'i hazır`:'Acil durum fonu hedefi ayarlanmamış'});
  notes.push({ok:budgetLimit>0&&budgetSpentTotal<=budgetLimit,text:budgetLimit?`Bütçe kullanımı %${Math.round((budgetSpentTotal/budgetLimit)*100)}`:'Bu ay bütçe tanımlanmamış'});
  notes.push({ok:t.net>=0,text:`Net varlık ${money(t.net)}`});
  notes.push({ok:balanceScore>=8,text:balanceBase>0?`Düzenli gider/gelir dengesi %${Math.round(balanceExpense/balanceBase*100)}`:'Düzenli gelir/gider verisi henüz yetersiz'});

  return {score,label,savingsRate,debtTotal,debtToIncome,efTarget,efCur,efRatio,budgetLimit,budgetSpentTotal,netWorth:t.net,balanceScore,notes};
}

function renderFinancialHealth(){
  const h=calculateFinancialHealth();
  const scoreEl=document.getElementById('score'), circle=document.getElementById('scoreCircle'), text=document.getElementById('scoreText'), details=document.getElementById('healthDetails');
  if(scoreEl)scoreEl.textContent=h.score;
  if(circle)circle.style.setProperty('--p',h.score+'%');
  if(text)text.textContent=h.label;
  if(details)details.innerHTML=h.notes.map(n=>`<div class="healthNote ${n.ok?'healthOk':'healthWarn'}"><span>${n.ok?'●':'▲'}</span><span>${n.text}</span></div>`).join('');
}



/* FinPal 5.1 — Aylık Harcamalarım */
let monthlyExpenseMonth=month();
const MONTHLY_EXPENSE_ORDER=['Gıda','Borçlar','Sağlık','Ulaşım','Konut','Abonelik','Eğitim','Giyim','Eğlence','Yatırım','Diğer'];
const MONTHLY_EXPENSE_ICONS={Gıda:'🛒',Borçlar:'🏦',Sağlık:'🏥',Ulaşım:'🚗',Konut:'🏠',Abonelik:'📱',Eğitim:'🎓',Giyim:'👕',Eğlence:'🎬',Yatırım:'📈',Diğer:'💰'};
function txExpenseGroup(t){
  if(t.categoryGroup&&CATS[t.categoryGroup])return t.categoryGroup;
  let cat=t.categorySubcategory||t.category||'Diğer';
  let hit=Object.entries(CATS).find(([g,subs])=>subs.includes(cat));
  return hit?hit[0]:'Diğer';
}
function setMonthlyExpenseMonth(v){monthlyExpenseMonth=v||month();renderMonthlyExpenses()}
function toggleMonthlyExpenseGroup(key){let el=document.getElementById('meg-'+key);if(el)el.classList.toggle('hide')}
function renderMonthlyExpenses(){
  let picker=document.getElementById('monthlyExpenseMonth'),summary=document.getElementById('monthlyExpenseSummary'),box=document.getElementById('monthlyExpenseCategories');
  if(!summary||!box)return; if(picker&&picker.value!==monthlyExpenseMonth)picker.value=monthlyExpenseMonth;
  let rows=(data.transactions||[]).filter(t=>t.type==='expense'&&(t.date||'').slice(0,7)===monthlyExpenseMonth);
  let normal=0,debt=0,groups={};
  rows.forEach(t=>{let g=txExpenseGroup(t),a=Number(t.amount||0);(groups[g]||(groups[g]=[])).push(t);if(g==='Borçlar')debt+=a;else normal+=a});
  let total=normal+debt,prev=previousMonth(monthlyExpenseMonth),prevTotal=(data.transactions||[]).filter(t=>t.type==='expense'&&(t.date||'').slice(0,7)===prev).reduce((s,t)=>s+Number(t.amount||0),0);
  let diff=prevTotal?((total-prevTotal)/prevTotal*100):null;
  let topGroup=Object.entries(groups).map(([g,l])=>[g,l.reduce((s,t)=>s+Number(t.amount||0),0)]).sort((a,b)=>b[1]-a[1])[0];
  summary.innerHTML=`<div class="monthlyExpenseKpis"><div class="monthlyExpenseKpi"><small>Toplam nakit çıkışı</small><b>${money(total)}</b></div><div class="monthlyExpenseKpi"><small>Normal harcamalar</small><b>${money(normal)}</b></div><div class="monthlyExpenseKpi"><small>Kredi / borç</small><b>${money(debt)}</b></div></div><div class="muted">${rows.length} harcama${topGroup?` · En yüksek kategori: ${esc(topGroup[0])} (${money(topGroup[1])})`:''}<br>${diff===null?'Önceki ay karşılaştırması için veri yok.':`Geçen aya göre ${diff>=0?'%'+Math.abs(diff).toFixed(1)+' daha fazla':'%'+Math.abs(diff).toFixed(1)+' daha az'} harcama.`}</div>`;
  let order=[...MONTHLY_EXPENSE_ORDER,...Object.keys(groups).filter(g=>!MONTHLY_EXPENSE_ORDER.includes(g))];
  box.innerHTML=order.map((g,i)=>{let list=(groups[g]||[]).sort((a,b)=>(b.date||'').localeCompare(a.date||'')),sum=list.reduce((s,t)=>s+Number(t.amount||0),0),id='g'+i;
    let items=list.length?list.map(t=>`<div class="expenseTx"><div><b>${esc(t.description||t.categorySubcategory||t.category||'Gider')}</b><div class="muted">${fmt(t.date)} · ${esc(t.categorySubcategory||t.category||g)}</div></div><div class="expenseTxAmount negative">−${money(t.amount)}<div class="expenseTxActions"><button onclick="editExpenseTx('${t.id}')">Düzenle</button> <button class="danger" onclick="deleteTx('${t.id}')">Sil</button></div></div></div>`).join(''):'<div class="empty">Bu ay bu kategoride harcama yok.</div>';
    return `<div class="expenseGroup${list.length?'':' emptyGroup'}"><button class="expenseGroupHead" onclick="toggleMonthlyExpenseGroup('${id}')"><span>${MONTHLY_EXPENSE_ICONS[g]||'💰'} <b>${esc(g)}</b> <span class="muted">(${list.length})</span></span><b>${money(sum)}</b></button><div id="meg-${id}" class="expenseGroupBody${list.length?'':' hide'}">${items}</div></div>`
  }).join('');
}

function render(){let t=totals();document.getElementById('today').textContent=new Date().toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long'});document.getElementById('netWorth').textContent=money(t.net);document.getElementById('assets').textContent=money(t.assets);document.getElementById('liabilities').textContent=money(t.liab);document.getElementById('monthNet').textContent=money(t.mi-t.me);document.getElementById('mIncome').textContent=money(t.mi);document.getElementById('mExpense').textContent=money(t.me);let sr=t.mi>0?Math.round((t.mi-t.me)/t.mi*100):0;document.getElementById('saveRate').textContent=sr+'%';renderFinancialHealth();let recent=[...data.transactions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8);document.getElementById('recent').innerHTML=recent.length?recent.map(x=>`<div class="row"><div><b>${x.description||x.category||'İşlem'}</b><div class="muted">${fmt(x.date)}</div></div><b class="${x.type==='income'?'positive':'negative'}">${x.type==='income'?'+':'−'}${money(x.amount)}</b></div>`).join(''):'<div class="empty">Henüz işlem yok.</div>';let all=[...data.transactions].sort((a,b)=>b.date.localeCompare(a.date));document.getElementById('allTx').innerHTML=all.length?all.map(x=>`<div class="row"><div><b>${x.description||x.category||'İşlem'}</b><div class="muted">${fmt(x.date)} · ${x.categorySubcategory||x.category||''}</div></div><b class="${x.type==='income'?'positive':'negative'}">${x.type==='income'?'+':'−'}${money(x.amount)}</b></div>`).join(''):'<div class="empty">Henüz işlem yok.</div>';renderExecutiveDashboard();renderFinancialCenter();renderCoach();renderAI();renderEmergency();renderAssets();renderAssets45();renderDebts();renderSecurity();renderAllocationSummary();renderReports();renderCashflow();renderForecast();renderBudgets();renderEnvelopes();renderCategories();renderObligations();renderPaymentPlan();renderPlans();renderMonthlyExpenses();renderChart();renderAccounts()}
function backup(){let blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='finpal-2.0-final-yedek-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(a.href)}
function restore(e){let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{let x=JSON.parse(r.result);if(!x||!x.accounts||!x.transactions)throw 0;if(confirm('Mevcut veriler yedek ile değiştirilsin mi?')){data=migrate(x);save();alert('Yedek başarıyla yüklendi.')}}catch(err){alert('Geçersiz FinPal yedeği.')}};r.readAsText(f)}
function resetData(){if(confirm('TÜM FinPal verileri silinecek. Emin misiniz?')){localStorage.removeItem(KEY);data=base();render()}}
const prevSubmitObligation=submitModal;submitModal=function(){
if(modalType==='expenseEdit'){
  let t=data.transactions.find(x=>x.id===val('xeId'));if(!t)return closeModal();
  let amount=+val('xeAmount'),accountId=val('xeAccount'),date=val('xeDate'),group=val('xeGroup')||'Diğer',cat=val('xeCat')||'Diğer';
  if(!(amount>0)||!accountId||!date)return alert('Tutar, hesap ve tarih gerekli.');
  let acc=data.accounts.find(a=>a.id===accountId);
  if(acc&&acc.type==='credit'){
    let currentOwn=(t.accountId===accountId?Number(t.amount||0):0);
    if(amount>creditAvailable(accountId)+currentOwn)return alert('Kredi kartı limitini aşıyorsunuz.');
  }
  t.amount=amount;t.description=val('xeDesc').trim();t.accountId=accountId;t.date=date;t.category=cat;t.categoryGroup=group;t.categorySubcategory=cat;
  save();closeModal();return;
}
if(modalType==='emergency'){data.emergencyFund={enabled:true,essentialMonthly:+val('efEssential')||0,targetMonths:Math.max(1,+val('efMonths')||6),balance:+val('efBalance')||0,accountId:val('efAccount')||''};save();closeModal();return}if(modalType==='asset'){let name=val('asName').trim(),qty=+val('asQty')||0,cost=+val('asCost')||0,current=+val('asCurrent')||0;if(!name||qty<=0)return alert('Varlık adı ve miktar gerekli.');data.assets.push({id:uid(),name,type:val('asType'),quantity:qty,unitCost:cost,currentPrice:current,note:val('asNote').trim()});save();closeModal();return}if(modalType==='assetEdit'){let a=data.assets.find(x=>x.id===val('aeId'));if(a){a.name=val('aeName').trim()||a.name;a.quantity=+val('aeQty')||0;a.unitCost=+val('aeCost')||0;a.currentPrice=+val('aeCurrent')||0;a.note=val('aeNote').trim();save();closeModal()}return}if(modalType==='security'){let enabled=val('secPin')==='on',p=(val('secPinValue')||'').trim();if(enabled){if(p){if(!/^\d{4,6}$/.test(p))return alert('PIN 4-6 haneli olmalı.');data.security.pinHash=hashText(p)}else if(!data.security.pinHash)return alert('PIN belirleyin.')}else{data.security.pinHash='';data.security.biometricEnabled=false;data.security.credentialId=''}data.security.pinEnabled=enabled;data.security.autoLock=Number(val('secAuto')||5);save();closeModal();return}if(modalType==='envelope'){let name=val('eName').trim(),target=+val('eBudget')||0,priority=Math.min(5,Math.max(1,+val('ePriority')||3)),roll=val('eRollover')!=='no';if(!name)return alert('Zarf adı gerekli.');data.envelopes.push({id:uid(),name,budget:target,target,priority,rollover:roll});save();closeModal();return}if(modalType==='envelopeEdit'){let e=data.envelopes.find(x=>x.id===val('eeId'));if(e){e.name=val('eeName').trim()||e.name;e.target=+val('eeTarget')||0;e.budget=e.target;e.priority=Math.min(5,Math.max(1,+val('eePriority')||3));e.rollover=val('eeRollover')==='yes';save();closeModal();}return}if(modalType==='etransfer'){let m=val('erMonth')||budgetMonth,f=val('erFrom'),t=val('erTo'),a=+val('erAmount');if(f===t||!(a>0))return alert('Transfer bilgilerini kontrol edin.');if(a>envelopeAvailable(f,m))return alert('Kaynak zarfta yeterli kullanılabilir para yok.');data.allocations.push({id:uid(),month:m,envelopeId:f,amount:-a,date:new Date().toISOString().slice(0,10),transfer:true});data.allocations.push({id:uid(),month:m,envelopeId:t,amount:a,date:new Date().toISOString().slice(0,10),transfer:true});save();closeModal();return}if(modalType==='smartAllocation'){let m=val('saMonth')||budgetMonth,available=availableToAssign(m),envs=[...data.envelopes].sort((a,b)=>(a.priority||3)-(b.priority||3));if(!(available>0))return alert('Bu ay tahsis edilebilir para yok.');let used=0;envs.forEach(e=>{let target=Math.max(0,Number(e.target||e.budget||0)-envelopeAllocated(e.id,m));if(target>0){let a=Math.min(target,available-used);if(a>0){data.allocations.push({id:uid(),month:m,envelopeId:e.id,amount:a,date:new Date().toISOString().slice(0,10),auto:true});used+=a;}}});budgetMonth=m;save();closeModal();alert(money(used)+' dağıtıldı.');return}if(modalType==='allocation'){let m=val('aMonth')||month(),env=val('aEnv'),amount=+val('aAmount');if(!(amount>0)||!env)return alert('Zarf ve tutar gerekli.');let avail=availableToAssign(m);if(amount>avail)return alert('Tahsis edilebilir tutarı aşıyorsunuz. Bu ay tahsis edilebilir: '+money(avail));data.allocations.push({id:uid(),month:m,envelopeId:env,amount,date:new Date().toISOString().slice(0,10)});budgetMonth=m;save();closeModal();return}if(modalType==='recurring'){let name=val('rpName').trim(),kind=val('rpKind')||'expense',amount=+val('rpAmount'),frequency=val('rpFreq'),nextDate=val('rpDate'),accountId=val('rpAccount'),category=val('rpCat').trim()||'Diğer';if(!name||!(amount>0)||!nextDate||!accountId)return alert('Düzenli işlem bilgilerini kontrol edin.');data.paymentPlans.push({id:uid(),name,kind,amount,frequency,nextDate,accountId,category,active:true,lastPaid:'',paidCount:0});save();closeModal();return}if(modalType==='obligation'){let type=val('oType'),name=val('oName').trim(),amount=+val('oAmount'),due=val('oDue'),note=val('oNote').trim();if(!name||!(amount>0))return alert('İsim ve tutar gerekli.');data.obligations.push({id:uid(),type,name,amount,remaining:amount,dueDate:due,note,payments:[],interestRate:+val('oInterest')||0,minimumPayment:+val('oMinPay')||0});save();closeModal();return}if(modalType==='obligationPayment'){let o=data.obligations.find(x=>x.id===val('opId')),aid=val('opAccount'),amount=+val('opAmount'),date=val('opDate');if(!o||!(amount>0))return alert('Ödeme bilgilerini kontrol edin.');let acc=data.accounts.find(a=>a.id===aid);if(!acc)return alert('Hesap bulunamadı.');if(amount>obligationRemaining(o))return alert('Kalan tutardan fazla işlem yapamazsınız.');if(o.type==='debt'&&amount>accountBalance(aid))return alert('Hesapta yeterli bakiye yok.');let tx={id:uid(),type:o.type==='debt'?'expense':'income',amount,description:(o.type==='debt'?'Borç ödemesi: ':'Alacak tahsilatı: ')+o.name,category:'Borçlar',accountId:aid,date,obligationId:o.id};data.transactions.push(tx);o.remaining=Math.max(0,obligationRemaining(o)-amount);o.payments=o.payments||[];o.payments.push({id:uid(),amount,date,accountId:aid});save();closeModal();return}prevSubmitObligation()}

function openSmartAllocation(){let env=data.envelopes;if(!env.length)return alert('Önce zarf oluşturun.');openModal('✨ Akıllı Para Dağıtımı','smartAllocation',`<label>Ay</label><input id="saMonth" type="month" value="${budgetMonth}"><div class="muted">Para, zarf önceliklerine (1 en yüksek) ve aylık hedeflerine göre otomatik dağıtılır. Önce yüksek öncelikli zarflar doldurulur.</div><div class="accountBox" style="margin-top:10px">Tahsis edilebilir: <b>${money(availableToAssign())}</b></div>`)}
function editEnvelope(id){let e=data.envelopes.find(x=>x.id===id);if(!e)return;openModal('Zarfı Düzenle','envelopeEdit',`<input id="eeId" type="hidden" value="${id}"><label>Zarf adı</label><input id="eeName" value="${e.name}"><label>Aylık hedef</label><input id="eeTarget" type="number" step="0.01" value="${Number(e.target||e.budget||0)}"><label>Öncelik (1=en yüksek)</label><input id="eePriority" type="number" min="1" max="5" value="${e.priority||3}"><label>Ay sonu kalan para</label><select id="eeRollover"><option value="yes" ${e.rollover!==false?'selected':''}>Sonraki aya devret</option><option value="no" ${e.rollover===false?'selected':''}>Devretme</option></select><button class="danger" onclick="deleteEnvelope('${id}')">Zarfı Sil</button>`)}
function deleteEnvelope(id){if(confirm('Bu zarf silinsin mi? Tahsis kayıtları da kaldırılacak.')){data.envelopes=data.envelopes.filter(e=>e.id!==id);data.allocations=data.allocations.filter(a=>a.envelopeId!==id);save();closeModal()}}

function smartTotals(){let m=month(),inc=data.transactions.filter(t=>t.type==='income'&&t.date?.slice(0,7)===m).reduce((s,t)=>s+Number(t.amount||0),0),exp=data.transactions.filter(t=>t.type==='expense'&&t.date?.slice(0,7)===m).reduce((s,t)=>s+Number(t.amount||0),0);return {inc,exp,net:inc-exp}}
function smartForecast(){let t=smartTotals(),avg=historicalAverages(),base=liquidBalance(),out=[];let cur=new Date();for(let i=1;i<=3;i++){let d=new Date(cur.getFullYear(),cur.getMonth()+i,1);let m=d.toISOString().slice(0,7);let fixed=data.paymentPlans.filter(p=>p.nextDate&&p.nextDate.slice(0,7)===m).reduce((s,p)=>s+Number(p.amount||0),0);let knownIn=data.transactions.filter(x=>x.type==='income'&&x.date?.slice(0,7)===m).reduce((s,x)=>s+Number(x.amount||0),0);let knownOut=data.transactions.filter(x=>x.type==='expense'&&x.date?.slice(0,7)===m).reduce((s,x)=>s+Number(x.amount||0),0)+fixed;let ni=knownIn||avg.inc,ne=knownOut||avg.exp;out.push({m,v:base+out.reduce((s,x)=>s+x.net,0)+ni-ne,net:ni-ne})}return out}
function addGoal(){let name=prompt('Hedef adı (örn. Araba)'),target=Number(prompt('Hedef tutarı (TL)')||0),saved=Number(prompt('Mevcut birikim (TL)')||0),date=prompt('Hedef tarihi (YYYY-AA-GG, isteğe bağlı)','2027-09-01');if(!name||target<=0)return;data.goals.push({id:uid(),name,target,saved,date});save()}
function addSubscription(){let name=prompt('Abonelik/Fatura adı'),amount=Number(prompt('Tutar (TL)')||0),date=prompt('Sonraki ödeme tarihi (YYYY-AA-GG)',new Date().toISOString().slice(0,10));if(!name||amount<=0||!date)return;data.subscriptions.push({id:uid(),name,amount,date});save()}
function addShopping(){let item=prompt('Ürün adı'),qty=prompt('Miktar','1'),price=Number(prompt('Tahmini birim fiyat (TL)')||0);if(!item)return;data.shopping.push({id:uid(),item,qty,price,done:false});save()}
function renderSmart(){let c=document.getElementById('smartCoach');if(!c)return;let t=smartTotals(),rate=t.inc?t.net/t.inc*100:0,avg=historicalAverages(),m30=debtMetrics(0,'avalanche'),tips=[];if(t.inc&&rate<10)tips.push('🟡 Tasarruf oranını artırmak için değişken giderlerden birini azaltmayı hedefle.');if(t.exp>t.inc&&t.inc)tips.push('🔴 Bu ay giderlerin gelirlerini aşıyor.');if(m30.total&&t.inc&&m30.total/t.inc>3)tips.push('⚠️ Borç toplamın aylık gelirin 3 katından fazla.');let efTarget=emergencyTarget(),efCur=emergencyCurrent();if(efTarget&&efCur<efTarget)tips.push('🛟 Acil durum fonun hedefin %'+Math.round(efCur/efTarget*100)+' seviyesinde.');if(!tips.length)tips.push('🟢 Finansal görünüm dengeli. Hedeflerine düzenli katkı yapmaya devam et.');c.innerHTML=`<div class="smartGrid"><div class="smartMetric">Bu ay gelir<b>${money(t.inc)}</b></div><div class="smartMetric">Bu ay gider<b>${money(t.exp)}</b></div></div>${tips.map(x=>`<div class="smartWarn">${x}</div>`).join('')}<div class="muted">Son 3 ay ortalama gelir: ${money(avg.inc)} · gider: ${money(avg.exp)}</div>`;let f=document.getElementById('smartForecast'),fs=smartForecast();f.innerHTML=fs.map(x=>`<div class="row"><span>${x.m}</span><b class="${x.v>=0?'positive':'negative'}">${money(x.v)}</b></div>`).join('')||'<div class="empty">Tahmin için veri gerekiyor.</div>';let g=document.getElementById('smartGoals');g.innerHTML=data.goals.length?data.goals.map(x=>{let p=Math.min(100,x.target?x.saved/x.target*100:0);return `<div class="goalLine"><div class="row"><span><b>${esc(x.name)}</b><div class="muted">${money(x.saved)} / ${money(x.target)}${x.date?' · '+x.date:''}</div></span><button class="danger smallBtn" onclick="delSmart('goals','${x.id}')">Sil</button></div><div class="progress"><div class="bar" style="width:${p}%"></div></div><span class="muted">%${Math.round(p)} · Aylık öneri: ${goalMonthly(x)}</span></div>`}).join(''):'<div class="empty">Henüz hedef yok.</div>';let sub=document.getElementById('smartSubs');sub.innerHTML=data.subscriptions.length?data.subscriptions.sort((a,b)=>a.date.localeCompare(b.date)).map(x=>`<div class="row"><div><b>${esc(x.name)}</b><div class="muted">${fmt(x.date)}</div></div><div><b>${money(x.amount)}</b><button class="danger smallBtn" onclick="delSmart('subscriptions','${x.id}')">Sil</button></div></div>`).join(''):'<div class="empty">Abonelik/fatura ekleyin.</div>';let sh=document.getElementById('smartShopping'),sum=data.shopping.reduce((s,x)=>s+Number(x.price||0)*Number(x.qty||1),0);sh.innerHTML=(data.shopping.length?data.shopping.map(x=>`<div class="row"><label><input type="checkbox" ${x.done?'checked':''} onchange="toggleShop('${x.id}')" style="width:auto"> ${esc(x.item)} × ${esc(x.qty)}</label><span><b>${money(Number(x.price||0)*Number(x.qty||1))}</b> <button class="danger smallBtn" onclick="delSmart('shopping','${x.id}')">Sil</button></span></div>`).join(''):'<div class="empty">Liste boş.</div>')+`<div class="row"><b>Tahmini toplam</b><b>${money(sum)}</b></div>`;renderSmartCalendar();let sc=document.getElementById('smartScenarios');let extra=Number(localStorage.getItem('finpalScenarioExtra')||0),impact=smartTotals().net-extra;sc.innerHTML=`<div class="row"><span>Ayda +5.000 TL harcama</span><b class="negative">${money(smartTotals().net-5000)}</b></div><div class="row"><span>Ayda 5.000 TL tasarruf</span><b class="positive">${money(smartTotals().net+5000)}</b></div><div class="muted">Senaryo motorunu açarak kendi tutarını simüle edebilirsin.</div>`}
function goalMonthly(g){if(!g.date||g.saved>=g.target)return '0 TL';let d=new Date(g.date+'T12:00:00'),n=new Date(),months=Math.max(1,(d.getFullYear()-n.getFullYear())*12+d.getMonth()-n.getMonth());return money(Math.max(0,(g.target-g.saved)/months))}
function delSmart(k,id){data[k]=data[k].filter(x=>x.id!==id);save()}
function toggleShop(id){let x=data.shopping.find(a=>a.id===id);if(x){x.done=!x.done;save()}}
function renderSmartCalendar(){let el=document.getElementById('smartCalendar');if(!el)return;let now=new Date(),y=now.getFullYear(),m=now.getMonth(),first=new Date(y,m,1),last=new Date(y,m+1,0),cells=[];for(let i=0;i<first.getDay();i++)cells.push('<div class="day out"></div>');for(let d=1;d<=last.getDate();d++){let key=new Date(y,m,d).toISOString().slice(0,10),ev=[];data.paymentPlans.filter(p=>p.nextDate===key).forEach(p=>ev.push('💳 '+p.name));data.subscriptions.filter(p=>p.date===key).forEach(p=>ev.push('🔔 '+p.name));data.obligations.filter(p=>p.dueDate===key).forEach(p=>ev.push('⚠️ '+p.name));data.transactions.filter(p=>p.date===key).slice(0,2).forEach(p=>ev.push((p.type==='income'?'↑ ':'↓ ')+(p.description||p.category||'İşlem')));cells.push(`<div class="day"><b>${d}</b>${ev.map(e=>`<div class="eventDot">${esc(e)}</div>`).join('')}</div>`)}el.innerHTML='<div class="calendar">'+cells.join('')+'</div>'}
function openScenario(){let extra=Number(prompt('Aylık ek harcama (+) veya tasarruf (-) tutarı', '5000')||0),months=Number(prompt('Kaç ay simüle edilsin?','12')||12);if(!months)return;let net=smartTotals().net,out=[];for(let i=1;i<=months;i++)out.push(net-extra*i);alert(months+' ay sonunda bugünkü aylık nete göre fark: '+money(out[months-1]-(net)));localStorage.setItem('finpalScenarioExtra',extra);render()}
function importCSV(e){let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{let lines=r.result.split(/\r?\n/).filter(Boolean),count=0;lines.slice(1).forEach(line=>{let p=line.split(',');if(p.length<4)return;let [date,description,type,amount]=p;amount=Number(String(amount).replace(',','.'));if(!date||!amount)return;data.transactions.push({id:uid(),date,description,type:type==='income'?'income':'expense',amount,category:'Banka İçe Aktarım',categoryGroup:'Diğer',categorySubcategory:'Banka İçe Aktarım'});count++});save();alert(count+' işlem içe aktarıldı. CSV sütunları: tarih,açıklama,tür,tutar');};r.readAsText(f,'UTF-8')}

function globalSearch(q){let el=document.getElementById('searchResults');if(!el)return;q=String(q||'').trim().toLowerCase();if(!q){el.innerHTML='';return}let rows=[];data.transactions.forEach(t=>{let hay=[t.description,t.category,t.categorySubcategory,t.date].join(' ').toLowerCase();if(hay.includes(q))rows.push({title:t.description||t.category||'İşlem',sub:fmt(t.date)+' · '+(t.categorySubcategory||t.category||''),value:(t.type==='income'?'+':'−')+money(t.amount),cls:t.type==='income'?'positive':'negative'})});data.accounts.forEach(a=>{if((a.name||'').toLowerCase().includes(q))rows.push({title:'🏦 '+a.name,sub:'Hesap',value:money(accountBalance(a.id)),cls:''})});data.goals.forEach(g=>{if((g.name||'').toLowerCase().includes(q))rows.push({title:'🎯 '+g.name,sub:'Hedef',value:money(g.saved)+' / '+money(g.target),cls:''})});el.innerHTML=rows.slice(0,10).map(r=>`<div class="row"><div><b>${esc(r.title)}</b><div class="muted">${esc(r.sub)}</div></div><b class="${r.cls}">${r.value}</b></div>`).join('')||'<div class="empty">Sonuç bulunamadı.</div>'}
let deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;showProStatus('📱 FinPal kuruluma hazır.');});
async function installFinPal(){if(deferredInstallPrompt){deferredInstallPrompt.prompt();let r=await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;showProStatus(r.outcome==='accepted'?'✅ FinPal ana ekrana eklendi.':'Kurulum iptal edildi.')}else showProStatus('iPhone kullanıyorsan Safari paylaş menüsünden “Ana Ekrana Ekle” seçeneğini kullanabilirsin. GitHub Pages HTTPS olduğu için PWA altyapısı uygundur.')}
async function requestNotifications(){if(!('Notification' in window)){return showProStatus('Bu tarayıcı bildirim API’sini desteklemiyor.')}let p=await Notification.requestPermission();data.app.notifications=p==='granted';data.app.lastActive=Date.now();save();showProStatus(p==='granted'?'🔔 Bildirim izni açık.':'Bildirim izni verilmedi.')}
function showProStatus(x){let e=document.getElementById('proStatus');if(e)e.innerHTML='<div class="securityBadge">'+esc(x)+'</div>'}
function exportCSV(){let head='tarih,açıklama,tür,tutar,kategori,hesap\n';let body=data.transactions.map(t=>{let a=data.accounts.find(x=>x.id===t.accountId);return [t.date,t.description||'',t.type,t.amount,t.categorySubcategory||t.category||'',a?.name||''].map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')}).join('\n');let blob=new Blob([head+body],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='finpal-islemler-'+new Date().toISOString().slice(0,10)+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function runDataHealth(){let issues=[],seen=new Set();data.transactions.forEach(t=>{if(seen.has(t.id))issues.push('Mükerrer işlem ID: '+t.id);seen.add(t.id);if(!t.date)issues.push('Tarihsiz işlem bulundu.');if(Number(t.amount)<0)issues.push('Negatif tutarlı işlem: '+(t.description||t.id))});data.accounts.forEach(a=>{if(!a.name)issues.push('İsimsiz hesap bulundu.')});let e=document.getElementById('quickHealth');e.innerHTML=issues.length?'<div class="warnBox">⚠ '+issues.slice(0,8).map(esc).join('<br>')+(issues.length>8?'<br>…':'')+'</div>':'<div class="okBox">✅ Veri yapısı temiz görünüyor. '+data.transactions.length+' işlem, '+data.accounts.length+' hesap kontrol edildi.</div>';showProStatus(issues.length?'⚠ Veri kontrolünde '+issues.length+' uyarı bulundu.':'✅ Veri kontrolü tamamlandı.')}
function normalizeText(x){return String(x||'').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
const SMART_RULES=[
  [['market','migros','carrefour','a101','bim','sok','file','macro','gross','market alışveriş'],'Gıda','Market'],
  [['restoran','restaurant','yemek','getir','yemeksepeti','burger','pizza','kafe','cafe','kahve','starbucks'],'Gıda','Restoran'],
  [['benzin','akaryakit','shell','opet','bp','petrol','total','yakıt','mazot'],'Ulaşım','Yakıt'],
  [['uber','taxi','taksi','metro','otobus','otobüs','ankara kart','dolmus','dolmuş'],'Ulaşım','Toplu Taşıma'],
  [['netflix','spotify','youtube premium','apple.com/bill','icloud','disney','prime video'],'Abonelik','Diğer'],
  [['elektrik','enerjisa','baskent edas','su faturasi','su faturası','aski','dogalgaz','doğalgaz','internet','turk telekom','superonline'],'Konut','Diğer'],
  [['kira','aidat','emlak'],'Konut','Kira'],
  [['eczane','pharmacy','hastane','muayene','doktor','diş','dis'],'Sağlık','İlaç'],
  [['kitap','kurs','okul','egitim','eğitim'],'Eğitim','Diğer'],
  [['giyim','lcw','zara','hm','mavi','ayakkabi','ayakkabı'],'Giyim','Kıyafet'],
  [['sinema','steam','playstation','xbox','oyun','hobi'],'Eğlence','Hobi'],
  [['kredi karti','kredi kartı','kredi ödeme','kredi taksit','borc odeme','borç ödeme'],'Borçlar','Kredi'],
  [['altin','altın','doviz','döviz','hisse','fon','borsa'],'Yatırım','Diğer']
];
function suggestCategory(desc){let el=document.getElementById('catSuggestion');if(!el)return;let hit=SMART_RULES.find(r=>r[0].some(k=>normalizeText(desc).includes(normalizeText(k))));if(hit){el.innerHTML='✨ Öneri: <b>'+esc(hit[1])+' › '+esc(hit[2])+'</b> <button class="smallBtn light" onclick="applyCategorySuggestion(\''+hit[1].replace(/'/g,"\\'")+'\',\''+hit[2].replace(/'/g,"\\'")+'\')">Uygula</button>'}else el.textContent='';}
function applyCategorySuggestion(g,c){let a=document.getElementById('tGroup'),b=document.getElementById('tCat');if(a)a.value=g;updateSubcats('tGroup','tCat');if(b&&[...b.options].some(o=>o.value===c))b.value=c;}
function autoCategory(desc){let hit=SMART_RULES.find(r=>r[0].some(k=>normalizeText(desc).includes(normalizeText(k))));return hit?{group:hit[1],cat:hit[2]}:null}
function autoCategorizeAll(){let changed=0;data.transactions.forEach(t=>{if(t.type!=='expense')return;let h=autoCategory(t.description||'');if(h){t.categoryGroup=h.group;t.categorySubcategory=h.cat;t.category=h.cat;changed++}});save();alert(changed+' işlem otomatik kategorilendirildi.');}
function runSmartAudit(){renderAI();alert('FinPal finansal taraması tamamlandı.');}
function detectSubscriptions(){let map={};data.transactions.filter(t=>t.type==='expense').forEach(t=>{let k=normalizeText(t.description||'').trim();if(!k)return;(map[k]??=[]).push(t)});let found=Object.entries(map).filter(([k,v])=>v.length>=2).sort((a,b)=>b[1].length-a[1].length);let msg=found.slice(0,8).map(([k,v])=>k+' ('+v.length+' işlem)').join('\n');alert(found.length?'Tekrarlanan ödeme adayları:\n\n'+msg:'Tekrarlanan ödeme adayı bulunamadı.');}
function renderAI(){let a=document.getElementById('aiAlerts');if(!a)return;let mt=monthTotals(month()),alerts=[],income=mt.inc,expense=mt.exp;let budgets=data.budgets.filter(b=>b.month===month()),overs=budgets.filter(b=>budgetSpent(b)>Number(b.amount||0));if(income&&expense/income>0.9)alerts.push('🔴 Giderlerin gelirin %90\'ına ulaştı.');if(overs.length)alerts.push('⚠️ '+overs.length+' bütçe kaleminde limit aşımı var.');let efT=emergencyTarget(),efC=emergencyCurrent();if(efT&&efC/efT<0.5)alerts.push('🛟 Acil durum fonu hedefinin %50\'sinin altında.');let d=debtMetrics(0,'avalanche');if(income&&d.total/income>3)alerts.push('💳 Toplam borç aylık gelirin 3 katından fazla.');if(!alerts.length)alerts.push('🟢 Kritik bir uyarı görünmüyor.');a.innerHTML=alerts.map(x=>'<div class="warnBox" style="margin:6px 0">'+x+'</div>').join('');
let by={};data.transactions.filter(t=>t.type==='expense'&&t.date.slice(0,7)===month()).forEach(t=>{let k=t.categoryGroup||t.category||'Diğer';by[k]=(by[k]||0)+Number(t.amount||0)});let total=Object.values(by).reduce((x,y)=>x+y,0);document.getElementById('aiSpending').innerHTML=Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>'<div class="row"><span>'+esc(k)+'</span><b>'+money(v)+' · '+(total?(v/total*100).toFixed(1):0)+'%</b></div>').join('')||'<div class="empty">Bu ay gider verisi yok.</div>';
let pt=trackedAssetTotal(),pc=trackedAssetCost(),gain=pt-pc;document.getElementById('aiPortfolio').innerHTML='<div class="kpi"><div>Değer<b>'+money(pt)+'</b></div><div>Maliyet<b>'+money(pc)+'</b></div><div>K/Z<b class="'+(gain>=0?'positive':'negative')+'">'+money(gain)+'</b></div></div>'+(!pt?'<div class="empty">Varlık ekleyin.</div>':'<div class="muted">Portföy getirisi: '+(pc?(gain/pc*100).toFixed(1):0)+'%</div>');
let avg=historicalAverages(),base=liquidBalance(),m3=avg.inc-avg.exp;document.getElementById('aiProjection').innerHTML='<div class="row"><span>Ortalama aylık net</span><b class="'+(m3>=0?'positive':'negative')+'">'+money(m3)+'</b></div><div class="row"><span>3 ay sonrası tahmini nakit</span><b>'+money(base+m3*3)+'</b></div><div class="row"><span>6 ay sonrası tahmini nakit</span><b>'+money(base+m3*6)+'</b></div>';
let sug=data.transactions.filter(t=>t.type==='expense'&&autoCategory(t.description||'')&&(!t.categoryGroup||t.categoryGroup==='Diğer')).slice(-12).reverse();document.getElementById('aiSuggestions').innerHTML=sug.length?sug.map(t=>{let h=autoCategory(t.description);return '<div class="row"><span>'+esc(t.description||t.category)+'<div class="muted">'+fmt(t.date)+' · '+money(t.amount)+'</div></span><b>'+h.group+' › '+h.cat+'</b></div>'}).join(''):'<div class="empty">Otomatik kategori önerisi bulunamadı.</div>';}
function renderPortfolioAllocation(){let el=document.getElementById('portfolioAllocation');if(!el)return;let total=trackedAssetTotal();if(!total){el.innerHTML='<div class="empty">Varlık ekleyince dağılım burada görünür.</div>';return}let map={};data.assets.forEach(a=>{let v=Number(a.quantity||0)*Number(a.currentPrice||0);map[a.type]=(map[a.type]||0)+v});el.innerHTML=Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="row"><span>${assetLabel(k)}</span><b>${money(v)} · ${((v/total)*100).toFixed(1)}%</b></div>`).join('')}
function renderPro(){renderPortfolioAllocation();let e=document.getElementById('quickHealth');if(e&&!e.innerHTML)e.innerHTML='<div class="muted">Veri kontrolünü çalıştırarak hesaplarını hızlıca denetleyebilirsin.</div>';let m=document.getElementById('marketStatus');if(m)m.textContent='Piyasa fiyatları manuel güncelleniyor; otomatik API bağlantısı eklenirse buradan yönetilecek.'}
function refreshMarketManual(){data.assets.forEach(a=>{if(a.currentPrice==null)a.currentPrice=0});save();let e=document.getElementById('marketStatus');if(e)e.textContent='🔄 Varlık fiyat alanları güncellendi. Güncel piyasa fiyatlarını Varlık Düzenle ekranından girebilirsin.'}
function buildManifest(){let m={name:'FinPal 5.0 Final',short_name:'FinPal',start_url:'.',display:'standalone',background_color:'#f5f6f7',theme_color:'#f07818',lang:'tr'};let blob=new Blob([JSON.stringify(m)],{type:'application/manifest+json'});let l=document.getElementById('manifestLink');if(l)l.href=URL.createObjectURL(blob)}
buildManifest();
const oldRender=render;render=function(){oldRender();renderSmart();renderPro()}
render();
setTimeout(()=>{if(data.security.pinEnabled&&!sessionStorage.getItem('finpalUnlocked'))openLock()},200);


const MARKET_KEY='finpal_market_rates_v24';
function money2(n){return new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:2}).format(Number(n)||0)}
function openOpenBankingInfo(){let x=document.getElementById('bankingRoadmap');if(x)x.style.display=x.style.display==='none'?'block':'none'}
function marketCard(code,label,value,change){return `<div class="card"><div class="muted">${label}</div><div style="font-size:22px;font-weight:800;margin-top:6px">${value}</div>${change!=null?`<div class="mini">Değişim: ${change}%</div>`:''}</div>`}
function renderMarketRates(rates,updated){let el=document.getElementById('marketRates');if(!el)return;let items=[['USD','🇺🇸 USD/TRY',rates.USD],['EUR','🇪🇺 EUR/TRY',rates.EUR],['GBP','🇬🇧 GBP/TRY',rates.GBP],['GA','🥇 Gram Altın',rates.GA]];el.innerHTML=items.map(x=>marketCard(x[0],x[1],x[2]!=null?money2(x[2]):'—')).join('');let u=document.getElementById('marketUpdated');if(u)u.textContent=updated?'Son güncelleme: '+updated:'Canlı veri bekleniyor.'}
async function refreshMarketRates(){
  let status=document.getElementById('marketUpdated');if(status)status.textContent='Fiyatlar alınıyor…';
  try{
    const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),7000);
    const r=await fetch('https://dolartoday.org/api/rates?symbols=USD,EUR,GBP,GA',{signal:ctl.signal,cache:'no-store'});clearTimeout(timer);
    if(!r.ok)throw new Error('HTTP '+r.status);const j=await r.json();
    const out={};(j.rates||[]).forEach(x=>{if(x.code)out[x.code]=Number(x.sell||x.rate||x.buy)});
    if(j.rate&&j.rate.code)out[j.rate.code]=Number(j.rate.sell||j.rate.rate||j.rate.buy);
    localStorage.setItem(MARKET_KEY,JSON.stringify({rates:out,updated:j.updated_at||new Date().toLocaleString('tr-TR')}));renderMarketRates(out,j.updated_at||new Date().toLocaleString('tr-TR'));
  }catch(e){
    let old=null;try{old=JSON.parse(localStorage.getItem(MARKET_KEY)||'null')}catch(_){ }
    if(old){renderMarketRates(old.rates,old.updated);if(status)status.textContent+=' · Canlı bağlantı başarısız, son kayıt gösteriliyor.'}
    else {renderMarketRates({},null);if(status)status.textContent='Canlı veri alınamadı. İnternet bağlantısını kontrol edin.'}
  }
}
function smartAlerts(){let el=document.getElementById('smartAlertList');if(!el)return;let a=[];let t=totals();let income=t.mi||0,expense=t.me||0;if(income&&expense/income>.8)a.push('⚠️ Aylık giderlerin gelirin %80’ini aşıyor.');if(income&&expense/income>.95)a.push('🔴 Nakit akışı kritik seviyede.');let ef=Number(data.emergencyFund?.current||0),target=Number(data.emergencyFund?.target||0);if(target&&ef/target<.25)a.push('🛟 Acil durum fonun hedefin %25’inden az.');let debt=(data.obligations||[]).filter(x=>x.type==='debt').reduce((s,x)=>s+Number(x.remaining||x.amount||0),0);if(income&&debt/income>6)a.push('💳 Borç yükün aylık gelirin 6 katını aşmış görünüyor.');let subs=(data.subscriptions||data.paymentPlans||[]).length;if(subs>=5)a.push('🔔 Birden fazla düzenli ödeme/aboneliğin var; yıllık maliyeti gözden geçir.');if(!a.length)a.push('✅ Şimdilik kritik bir finansal alarm tespit edilmedi.');el.innerHTML=a.map(x=>`<div class="row" style="padding:10px 0;border-bottom:1px solid #eee">${x}</div>`).join('')}
(function(){try{let old=JSON.parse(localStorage.getItem(MARKET_KEY)||'null');if(old)renderMarketRates(old.rates,old.updated)}catch(e){};setTimeout(()=>{smartAlerts();},100)})();

/* FinPal 2.5 */
function bank25Defaults(){return Object.assign({provider:'',connected:false,lastSync:'',accountIds:[]},data.bank25||{})}
function openBank25(){let b=bank25Defaults();openModal('🏦 Açık Bankacılık Bağlantısı','bank25',`<label>Yetkili sağlayıcı adı</label><input id="b25Provider" value="${esc(b.provider||'')}" placeholder="Örn. Yetkili AISP / ödeme hizmeti sağlayıcısı"><label>Bağlantı durumu</label><select id="b25Connected"><option value="0" ${!b.connected?'selected':''}>Bağlı değil</option><option value="1" ${b.connected?'selected':''}>Bağlı</option></select><div class="securityBadge">FinPal banka şifresi istemez. Türkiye'de gerçek hesap erişimi, kullanıcı rızası ve yetkili hizmet sağlayıcının ÖHVPS akışı üzerinden kurulmalıdır.</div>`)}
function simulateBankSync(){data.bank25=bank25Defaults();data.bank25.lastSync=new Date().toISOString();data.bank25.connected=true;save();render25();alert('Senkronizasyon testi tamamlandı. Gerçek banka verisi için yetkili sağlayıcı bağlantısı gerekir.')}
function openTargets25(){let types=['gold','fx','stock','fund','crypto','vehicle','realestate','other'];let labels={gold:'Altın',fx:'Döviz',stock:'Hisse',fund:'Fon',crypto:'Kripto',vehicle:'Araç',realestate:'Gayrimenkul',other:'Diğer'};let cur=data.assetTargets||{};openModal('🎯 Portföy Hedef Dağılımı','targets25',types.map(t=>`<div class="targetRow"><label>${labels[t]} %</label><input id="tg_${t}" type="number" min="0" max="100" step="1" value="${Number(cur[t]||0)}"></div>`).join('')+`<div class="securityBadge">Toplam yüzde 100 olmak zorunda değildir; eksik kalan bölüm "hedeflenmemiş" olarak kabul edilir.</div>`)}
function renderAllocation25(){let el=document.getElementById('allocation25');if(!el)return;let total=trackedAssetTotal(),targets=data.assetTargets||{},types=['gold','fx','stock','fund','crypto','vehicle','realestate','other'],labels={gold:'Altın',fx:'Döviz',stock:'Hisse',fund:'Fon',crypto:'Kripto',vehicle:'Araç',realestate:'Gayrimenkul',other:'Diğer'};if(!total){el.innerHTML='<div class="empty">Portföy verisi yok.</div>';return}let map={};data.assets.forEach(a=>map[a.type]=(map[a.type]||0)+Number(a.quantity||0)*Number(a.currentPrice||0));el.innerHTML=types.map(t=>{let actual=(map[t]||0)/total*100,target=Number(targets[t]||0),diff=actual-target;return `<div class="row"><span>${labels[t]}<div class="muted">Hedef ${target}%</div></span><b class="${Math.abs(diff)>5?'negative':'positive'}">${actual.toFixed(1)}% · ${diff>=0?'+':''}${diff.toFixed(1)} puan</b></div>`}).join('')}
function scanData25(){let seen=new Map(),dupes=[],bad=[];data.transactions.forEach(t=>{if(!t.date||!(Number(t.amount)>=0))bad.push(t);let k=[t.date,Number(t.amount||0).toFixed(2),normalizeText(t.description||''),t.accountId||''].join('|');if(seen.has(k))dupes.push([seen.get(k),t]);else seen.set(k,t)});let el=document.getElementById('dedupe25');if(!el)return;el.innerHTML=`<div class="kpi"><div>Mükerrer aday<b>${dupes.length}</b></div><div>Eksik/hatalı<b>${bad.length}</b></div><div>Toplam işlem<b>${data.transactions.length}</b></div></div>`+(dupes.slice(0,8).map(x=>`<div class="dedupeItem">${esc(x[1].description||'İşlem')} · ${fmt(x[1].date)} · ${money(x[1].amount)}</div>`).join('')||'<div class="okBox">Mükerrer işlem adayı bulunmadı.</div>')}
function cleanDuplicates25(){let seen=new Set(),out=[],removed=0;data.transactions.forEach(t=>{let k=[t.date,Number(t.amount||0).toFixed(2),normalizeText(t.description||''),t.accountId||'',t.type||''].join('|');if(seen.has(k)){removed++;return}seen.add(k);out.push(t)});if(!removed)return alert('Mükerrer işlem bulunamadı.');if(confirm(removed+' mükerrer işlem silinsin mi?')){data.transactions=out;save();scanData25();alert(removed+' işlem temizlendi.')}}
function openProvider25(){let p=data.marketProvider25||{};openModal('🌐 Piyasa Veri Sağlayıcısı','provider25',`<label>JSON endpoint</label><input id="p25Url" value="${esc(p.url||'')}" placeholder="https://ornek.com/finpal-rates.json"><div class="securityBadge">Beklenen örnek: {"USD":42,"EUR":49,"GBP":57,"GA":5600}. CORS açık olmalıdır.</div>`)}
async function refreshCustomMarket25(){let url=data.marketProvider25?.url;if(!url)return alert('Önce endpoint tanımlayın.');try{let r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);let j=await r.json();let out={USD:Number(j.USD||0),EUR:Number(j.EUR||0),GBP:Number(j.GBP||0),GA:Number(j.GA||0)};localStorage.setItem('finpal_market_custom_v25',JSON.stringify({rates:out,updated:new Date().toLocaleString('tr-TR')}));renderMarketRates(out,new Date().toLocaleString('tr-TR'));showProStatus('Özel piyasa endpointinden veri alındı.')}catch(e){showProStatus('Özel piyasa endpointi okunamadı: '+e.message)}}
async function enableNotifications25(){if(!('Notification' in window))return alert('Bu tarayıcı bildirimleri desteklemiyor.');let p=await Notification.requestPermission();data.app=data.app||{};data.app.notifications=p==='granted';save();render25();if(p==='granted')new Notification('FinPal',{body:'Finansal bildirimler aktif.'});else alert('Bildirim izni verilmedi.')}
function runNotificationCheck25(){let t=totals(),msgs=[];if(t.mi>0&&t.me/t.mi>.9)msgs.push('Giderlerin gelirinin %90 üzerine çıktı.');let ef=emergencyTarget(),ec=emergencyCurrent();if(ef&&ec/ef<.5)msgs.push('Acil durum fonun hedefin yarısından az.');if(!msgs.length)msgs.push('Kritik bildirim yok.');if(data.app?.notifications&&'Notification' in window&&Notification.permission==='granted')new Notification('FinPal Finansal Uyarı',{body:msgs.join(' ')});else alert(msgs.join('\n'))}
function render25(){let b=bank25Defaults(),e=document.getElementById('bank25Status');if(e)e.innerHTML=b.connected?`<span class="syncBadge">Bağlantı profili hazır</span><div class="muted">${esc(b.provider||'Sağlayıcı belirtilmedi')} · ${b.lastSync?new Date(b.lastSync).toLocaleString('tr-TR'):'henüz senkronize edilmedi'}</div>`:'<span class="syncBadge warn">Bağlı değil</span>';let n=document.getElementById('notify25Status');if(n)n.innerHTML=data.app?.notifications&&('Notification' in window)&&Notification.permission==='granted'?'<span class="syncBadge">Bildirimler açık</span>':'<span class="syncBadge warn">Bildirimler kapalı</span>';let p=document.getElementById('provider25');if(p)p.innerHTML=data.marketProvider25?.url?`<div class="muted">${esc(data.marketProvider25.url)}</div>`:'<div class="muted">Özel endpoint tanımlanmadı.</div>';renderAllocation25();scanData25()}
const prevSubmit25=submitModal;submitModal=function(){if(modalType==='bank25'){data.bank25=Object.assign(bank25Defaults(),{provider:val('b25Provider').trim(),connected:val('b25Connected')==='1'});save();closeModal();render25();return}if(modalType==='targets25'){let types=['gold','fx','stock','fund','crypto','vehicle','realestate','other'];data.assetTargets={};types.forEach(t=>data.assetTargets[t]=Math.max(0,Math.min(100,+val('tg_'+t)||0)));save();closeModal();render25();return}if(modalType==='provider25'){data.marketProvider25={url:val('p25Url').trim()};save();closeModal();render25();return}prevSubmit25()};

/* FinPal 3.0 — Gerçek Finans Merkezi */
function market30Sources(){return [
  ['TÜBİTAK Market Fiyatı','https://marketfiyati.org.tr/'],
  ['Ankara fiyat karşılaştırma','https://neredeucuz.com.tr/sehir/ankara'],
  ['MarketKıyas','https://marketkiyas.com.tr/'],
  ['Uyguno','https://uyguno.com/']
]}
function openMarket30(){
  openModal('🛒 Market Karşılaştırma','market30',`<label>Ürün</label><input id="m30q" placeholder="Örn. süt 1 L, yumurta 30'lu, ayçiçek yağı 5 L"><label>Adet</label><input id="m30qty" type="number" min="1" value="1"><div class="securityNote">FinPal, market sitelerinin kullanım şartlarını ve CORS kısıtlarını aşmadan çalışır. Bu ekran güvenilir karşılaştırma kaynaklarına yönlendirme ve sepet kaydı sağlar; banka gibi gizli bilgi istemez.</div>`)
}
function searchMarket30(){let q=(document.getElementById('market30Search')?.value||'').trim();if(!q)return alert('Önce ürün adı veya barkod yaz.');let u='https://uyguno.com/?q='+encodeURIComponent(q);window.open(u,'_blank','noopener,noreferrer');}
function saveMarketItem30(){let q=(val('m30q')||'').trim(),qty=Math.max(1,Number(val('m30qty')||1));if(!q)return alert('Ürün adı gerekli.');data.market30=data.market30||{items:[],lastUpdate:'',source:'',currency:'TRY'};data.market30.items.push({id:uid(),name:q,qty,created:new Date().toISOString()});save();closeModal();render30()}
function delMarketItem30(id){data.market30.items=(data.market30.items||[]).filter(x=>x.id!==id);save();render30()}
function openMarketSources30(){let links=market30Sources().map(x=>`<a class="sourceLink" href="${x[1]}" target="_blank" rel="noopener">${esc(x[0])}</a>`).join('');openModal('🌐 Güncel Fiyat Kaynakları','sources30',`<p class="muted">Ankara için güncel fiyat karşılaştırmalarında farklı kaynakları birlikte kullanabilirsin.</p>${links}<div class="securityNote">Fiyatlar mağaza, bölge, kampanya ve teslimat adresine göre değişebilir. FinPal bir fiyatı doğrulamadan “kesin en ucuz” olarak işaretlemez.</div>`)}
function openInvestmentApi30(){let x=data.investment30||{};openModal('📈 Yatırım Fiyat API Ayarı','investapi30',`<label>CORS açık JSON endpoint</label><input id="i30api" value="${esc(x.priceApi||'')}" placeholder="https://ornek.com/prices.json"><label><input id="i30auto" type="checkbox" ${x.autoUpdate?'checked':''} style="width:auto;margin-right:7px"> Açılışta otomatik güncelle</label><div class="securityNote">Beklenen yapı örneği: {"USD":42,"EUR":49,"GA":5600}. Hisse/fon/kripto için sembol anahtarları da eklenebilir. Sağlayıcının güvenilirliği ve kullanım hakkı kullanıcıya aittir.</div>`)}
async function refreshInvestment30(){let url=data.investment30?.priceApi;if(!url)return alert('Önce yatırım fiyat endpointi tanımla.');try{let r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);let j=await r.json();let updated=0;data.assets.forEach(a=>{let key=(a.symbol||a.code||'').toUpperCase();let price=Number(j[key]||j[key?.replace('/','_')]||0);if(price>0){a.currentPrice=price;updated++}});save();render();alert(updated+' varlığın fiyatı güncellendi.')}catch(e){alert('Fiyat servisi okunamadı: '+e.message)}}
function forecast30(){let avg=historicalAverages(),net=avg.inc-avg.exp,months=[1,3,6,12];return months.map(m=>({m,v:net*m}))}
function render30(){
 let e=document.getElementById('market30List');if(!e)return;
 data.market30=data.market30||{items:[],lastUpdate:'',source:'',currency:'TRY'};
 e.innerHTML=(data.market30.items||[]).length?(data.market30.items.map(x=>`<div class="row"><span>🛒 ${esc(x.name)} × ${x.qty}</span><button class="danger smallBtn" onclick="delMarketItem30('${x.id}')">Sil</button></div>`).join('')):'<div class="empty">Alışveriş listen boş.</div>';
 let total=trackedAssetTotal(), net=totals().net, forecast=forecast30();
 let pf=document.getElementById('portfolio30');pf.innerHTML=`<div class="priceGrid"><div class="priceMini">Portföy<b>${money(total)}</b></div><div class="priceMini">Net varlık<b>${money(net)}</b></div><div class="priceMini">Ortalama aylık net<b>${money(forecast30()[0].v)}</b></div><div class="priceMini">12 ay projeksiyon<b>${money(forecast30()[3].v)}</b></div></div>`;
 let f=document.getElementById('forecast30');f.innerHTML=forecast.map(x=>`<div class="row"><span>${x.m} ay</span><b class="${x.v>=0?'positive':'negative'}">${money(x.v)}</b></div>`).join('');
 let s=document.getElementById('market30Sources');s.innerHTML=market30Sources().map(x=>`<a class="sourceLink" href="${x[1]}" target="_blank" rel="noopener">${esc(x[0])}</a>`).join('');
 let api=document.getElementById('investment30Status');api.innerHTML=data.investment30?.priceApi?`<span class="syncDot"></span> Özel yatırım fiyat servisi tanımlı`:'<span class="syncBadge warn">Yatırım fiyat servisi tanımlı değil</span>';
}
const prevSubmit30=submitModal;submitModal=function(){if(modalType==='market30'){saveMarketItem30();return}if(modalType==='investapi30'){data.investment30={priceApi:(val('i30api')||'').trim(),autoUpdate:document.getElementById('i30auto')?.checked||false};save();closeModal();render30();return}prevSubmit30()};
const prevRender30=render;render=function(){prevRender30();render30()};

const prevRender25=render;render=function(){prevRender25();render25()};


setTimeout(()=>{try{render30()}catch(e){}},50);


function mobileTab(id,btn){
  const map={dashboard:0,transactions:1,budget:2,finance30:10,more:6};
  const tabs=document.querySelectorAll('.tabs button');
  tab(id,tabs[map[id]]||tabs[0]);
  document.querySelectorAll('#mobileNav button[data-nav]').forEach(b=>b.classList.toggle('active',b===btn));
  window.scrollTo({top:0,behavior:'smooth'});
}
function openQuickActions(){
  modalType='quick31';
  document.getElementById('modalTitle').textContent='Hızlı İşlem';
  document.getElementById('modalBody').innerHTML=`<div class="grid"><button onclick="closeModal();quick('income')">＋ Gelir Ekle</button><button onclick="closeModal();quick('expense')">－ Gider Ekle</button><button class="secondary" onclick="closeModal();openTransfer()">↔ Transfer</button><button class="light" onclick="closeModal();openBudget()">💰 Bütçe</button><button class="light" onclick="closeModal();openAsset()">📈 Varlık</button><button class="light" onclick="closeModal();openGoal31()">🎯 Hedef</button></div>`;
  document.querySelector('#modal .actions').style.display='none';
  document.getElementById('modal').classList.add('on');
}
function openGoal31(){
  if(typeof openGoal==='function'){openGoal();return}
  alert('Finansal Hedefler bölümünden yeni hedef ekleyebilirsin.');
}
const _closeModal31=closeModal;
closeModal=function(){document.querySelector('#modal .actions').style.display='flex';_closeModal31()};



const AUTOPILOT_KEY='finpal_autopilot_v33';
function autoCfg(){try{return JSON.parse(localStorage.getItem(AUTOPILOT_KEY)||'{}')}catch(e){return {}}}
function openAutopilotSettings(){let c=autoCfg();openModal('🤖 Otomatik Pilot Kuralları','autopilotSettings',`<label>Minimum güvenli nakit tamponu (TL)</label><input id="apBuffer" type="number" value="${Number(c.buffer||5000)}"><label>Önerilerde maksimum aylık tasarruf oranı (%)</label><input id="apMaxSave" type="number" min="0" max="80" value="${Number(c.maxSave||30)}"><div class="autoExplain">Otopilot hiçbir banka hesabından otomatik para çekmez/göndermez. Bu ayarlar yalnızca öneri motorunu sınırlar.</div>`)}
function autopilotSaveSettings(){let c={buffer:Math.max(0,Number(val('apBuffer')||5000)),maxSave:Math.min(80,Math.max(0,Number(val('apMaxSave')||30)))};localStorage.setItem(AUTOPILOT_KEY,JSON.stringify(c));closeModal();runAutopilot()}
const _submitAP=submitModal;submitModal=function(){if(modalType==='autopilotSettings'){autopilotSaveSettings();return}_submitAP()}
function autopilotMetrics(){let t=totals(),today=new Date();today.setHours(0,0,0,0);let horizon=new Date(today);horizon.setDate(horizon.getDate()+30);let planned=0;(data.paymentPlans||[]).forEach(p=>{if(p.nextDate){let d=new Date(p.nextDate+'T23:59:59');if(d>=today&&d<=horizon)planned+=Number(p.amount||0)}});(data.obligations||[]).filter(o=>o.type==='debt'&&obligationRemaining(o)>0&&o.dueDate).forEach(o=>{let d=new Date(o.dueDate+'T23:59:59');if(d>=today&&d<=horizon)planned+=obligationRemaining(o)});let safe=Math.max(0,liquidBalance()-planned);let monthIncome=t.mi||historicalAverages().inc||0,monthExpense=t.me||historicalAverages().exp||0;let variable=Math.max(0,monthIncome-monthExpense);let c=autoCfg(),saveCap=monthIncome*(Number(c.maxSave||30)/100),potential=Math.min(variable,saveCap);let debt=(data.obligations||[]).filter(o=>o.type==='debt').reduce((s,o)=>s+obligationRemaining(o),0);let risk='Düşük',score=0;if(safe<Number(c.buffer||5000))score+=2;if(monthIncome&&monthExpense/monthIncome>.8)score+=2;if(debt&&monthIncome&&debt/monthIncome>3)score+=2;if(emergencyTarget()&&emergencyCurrent()<emergencyTarget()*.5)score++;if(score>=4)risk='Yüksek';else if(score>=2)risk='Orta';return{t,safe,planned,monthIncome,monthExpense,potential,debt,risk,score}}
function runAutopilot(){let m=autopilotMetrics(),actions=[],reasons=[];let efT=emergencyTarget(),efC=emergencyCurrent();if(m.risk==='Yüksek'){actions.push({tag:'ÖNCELİK',title:'Nakit tamponunu koru',text:'Yeni büyük harcama yapmadan önce yaklaşan 30 günlük ödemeleri güvenceye al.',why:`Güvenli harcama ${money(m.safe)} ve planlı çıkış ${money(m.planned)}.`});reasons.push('Nakit marjı veya borç baskısı yüksek risk üretiyor.')}if(efT&&efC<efT){let miss=efT-efC;actions.push({tag:'GÜVENLİK',title:'Acil durum fonunu güçlendir',text:`Hedefe ulaşmak için yaklaşık ${money(miss)} daha gerekiyor.`,why:`Fon ilerlemesi %${Math.round(efC/efT*100)}.`})}else if(!efT){actions.push({tag:'İLK ADIM',title:'Acil durum fonunu kur',text:'Zorunlu aylık giderini ve hedef ay sayısını belirle.',why:'Otopilot güvenlik planı için acil durum rezervini ayrı görmek ister.'})}if(m.debt>0){actions.push({tag:'BORÇ',title:'Borç stratejisini uygula',text:'Minimum ödemeleri aksatma; ekstra para varsa Avalanche ile yüksek faizli borcu öne al.',why:`Toplam kalan borç ${money(m.debt)}.`})}if(m.potential>0&&m.risk!=='Yüksek'){actions.push({tag:'TASARRUF',title:`Bu ay ${money(m.potential)} kadar tasarrufu hedefle`,text:'Bu tutarı harcanabilir para olarak görme; hedef veya acil fon için ayır.',why:`Gelir-gider farkı yaklaşık ${money(Math.max(0,m.monthIncome-m.monthExpense))}.`})}let goals=(data.goals||[]).filter(g=>Number(g.target)>Number(g.saved||0));if(goals.length){let g=goals.sort((a,b)=>(Number(b.target-b.saved)||0)-(Number(a.target-a.saved)||0))[0];actions.push({tag:'HEDEF',title:`“${esc(g.name)}” hedefine katkı yap`,text:`Hedef ${money(g.target)}, mevcut ${money(g.saved||0)}.`,why:'Otopilot uzun vadeli hedefleri kısa vadeli harcamalardan önce görünür tutar.'})}if(!actions.length)actions.push({tag:'DENGELİ',title:'Planın dengeli görünüyor',text:'Günlük harcamalarını normal sınırlar içinde tut ve hedeflerine düzenli katkı yap.',why:'Kritik bir nakit, borç veya hedef sapması tespit edilmedi.'});let p=document.getElementById('autopilotPlan');if(p)p.innerHTML=actions.slice(0,5).map(a=>`<div class="autoAction"><div class="row"><div><span class="autoTag">${a.tag}</span><h3 style="margin:6px 0">${a.title}</h3><div>${a.text}</div></div></div><div class="autoExplain">Neden: ${a.why}</div></div>`).join('');let s=document.getElementById('autoSafeSpend');if(s)s.textContent=money(m.safe);let sp=document.getElementById('autoSavePotential');if(sp)sp.textContent=money(m.potential);let r=document.getElementById('autoRisk');if(r){r.textContent=m.risk;r.className=m.risk==='Yüksek'?'autoRiskHigh':m.risk==='Orta'?'autoRiskMed':'autoRiskLow'}let ex=document.getElementById('autopilotExplain');if(ex)ex.innerHTML=reasons.length?reasons.map(x=>`<div class="autoExplain">${x}</div>`).join(''):'<div class="okBox">FinPal, önerileri mevcut gelir, gider, borç, hedef ve acil fon verilerinden türetiyor.</div>';let conf=document.getElementById('autopilotConfidence');let tx=data.transactions||[],months=new Set(tx.map(x=>x.date?.slice(0,7)).filter(Boolean)).size;let confidence=Math.min(95,35+months*12+(tx.length>30?20:0));if(conf)conf.innerHTML=`<div class="row"><span>Veri temeli</span><b>${confidence}%</b></div><div class="autoConfidence"><i style="width:${confidence}%"></i></div><p class="muted">${months<2?'Daha fazla geçmiş işlem girdikçe tahminler güçlenir.':months<4?'En az birkaç aylık geçmiş verisi var; tahminler orta güven düzeyinde.':'Yeterli geçmiş veri bulunduğu için öneriler daha istikrarlı.'}</p>`;calculateAutopilotScenario(true)}
function calculateAutopilotScenario(silent){let m=autopilotMetrics(),extra=Math.max(0,Number(document.getElementById('autoExtraExpense')?.value||0)),save=Math.max(0,Number(document.getElementById('autoExtraSave')?.value||0)),a=document.getElementById('autoScenarioExpense'),b=document.getElementById('autoScenarioSave');if(a)a.innerHTML=`Aylık güvenli harcama yaklaşık <b>${money(Math.max(0,m.safe-extra))}</b> olur.`;if(b)b.innerHTML=`Aylık hedef/tasarruf kapasitesi yaklaşık <b>${money(m.potential+save)}</b> olur.`;if(!silent&&extra>m.safe)alert('Dikkat: Bu ek harcama güvenli harcama tutarını aşabilir.');}
setTimeout(()=>{try{runAutopilot()}catch(e){}},120);

/* FinPal 3.4 local conversational assistant */
function chatMoney34(n){return money(Number(n)||0)}
function chatTotals34(){let t=totals();return {inc:Number(t.mi||0),exp:Number(t.me||0),net:Number(t.mi||0)-Number(t.me||0),liquid:Number(liquidBalance()||0)}}
function debtRows34(){return (data.obligations||[]).filter(o=>o.type==='debt'&&obligationRemaining(o)>0).map(o=>({name:o.name||'Borç',remaining:Number(obligationRemaining(o)||0),rate:Number(o.interest||o.rate||o.apr||0),min:Number(o.minimumPayment||o.minPayment||o.payment||0),due:o.dueDate||''})).sort((a,b)=>b.rate-a.rate)}
function monthsToGoal34(g){let remain=Math.max(0,Number(g.target||0)-Number(g.saved||0));let monthly=Math.max(0,Number(g.monthly||g.monthlyTarget||0));if(!monthly){let cap=Math.max(0,chatTotals34().net);monthly=cap}return monthly>0?Math.ceil(remain/monthly):null}
function answer34(q){let x=q.toLocaleLowerCase('tr-TR').trim(),m=chatTotals34(),debts=debtRows34(),efT=typeof emergencyTarget==='function'?Number(emergencyTarget()||0):0,efC=typeof emergencyCurrent==='function'?Number(emergencyCurrent()||0):0;let goals=(data.goals||[]).filter(g=>Number(g.target||0)>Number(g.saved||0));
 if(/ne kadar.*harca|harcayabil|harcama.*limit/.test(x)){let avg=m.net;let ap=typeof autopilotMetrics==='function'?autopilotMetrics():{safe:Math.max(0,m.net),planned:0};return {text:`Bu ay için güvenli harcama tutarın yaklaşık ${chatMoney34(ap.safe)}.\\n\\nBu hesapta mevcut likit bakiye, gelir-gider farkı ve önümüzdeki 30 günlük planlı çıkışlar dikkate alınıyor.\\n\\nNot: Bu tutar “mutlaka harca” limiti değil; güvenli üst sınır tahminidir.`,reason:`Gelir ${chatMoney34(m.inc)}, gider ${chatMoney34(m.exp)}, likit bakiye ${chatMoney34(m.liquid)}. 30 günlük planlı çıkışlar düşüldü.`}}
 if(/borç|kredi|borclar/.test(x)){if(!debts.length)return {text:'Kayıtlı ve kalan tutarı bulunan bir borç göremiyorum. Borç eklediğinde Avalanche/Snowball karşılaştırması yapabilirim.',reason:'Obligations içindeki kalan borçlar tarandı.'};let total=debts.reduce((s,d)=>s+d.remaining,0),first=debts[0];return {text:`Toplam kalan borcun yaklaşık ${chatMoney34(total)}.\\n\\nFaiz oranı girilmiş borçlarda önce en yüksek faizli borcu hedeflemek Avalanche yaklaşımıdır. Bu nedenle ilk öncelik: ${first.name} (${chatMoney34(first.remaining)}).\\n\\nMinimum ödemeleri aksatmamak ve ekstra ödeme kapasiteni güvenli nakit tamponunu bozmadan kullanmak daha sağlıklı.`,reason:`${debts.length} borç kaydı analiz edildi; toplam kalan ${chatMoney34(total)}. Faiz verisi bulunanlar yüksekten düşüğe sıralandı.`}}
 if(/acil.*fon|emergency|rezerv/.test(x)){if(!efT)return {text:'Acil durum fonu hedefin henüz tanımlı değil. Aylık zorunlu gider ve hedef ay sayısını girersen hedef tutarı hesaplayabilirim.',reason:'Emergency fund hedef verisi bulunamadı.'};let pct=Math.min(100,efC/efT*100),miss=Math.max(0,efT-efC);return {text:`Acil durum fonun ${Math.round(pct)}% seviyesinde.\\nMevcut: ${chatMoney34(efC)}\\nHedef: ${chatMoney34(efT)}\\nEksik: ${chatMoney34(miss)}\\n\\n%100'e ulaşana kadar yeni büyük harcamalarda daha temkinli olmanı öneririm.`,reason:`Acil fon mevcut/h hedef değerleri karşılaştırıldı.`}}
 if(/hedef|araba|ev almak|tatil/.test(x)){if(!goals.length)return {text:'Henüz tamamlanmamış bir finansal hedef göremiyorum. Hedef eklediğinde kalan tutar ve aylık gerekli birikimi hesaplayabilirim.',reason:'Tamamlanmamış goals kayıtları tarandı.'};let lines=goals.slice(0,5).map(g=>{let rem=Math.max(0,Number(g.target)-Number(g.saved||0)),mo=monthsToGoal34(g);return `• ${g.name||'Hedef'}: ${chatMoney34(rem)} kaldı${mo?`, yaklaşık ${mo} ay`:''}`}).join('\\n');return {text:`Mevcut hedeflerin:\\n${lines}\\n\\nDaha net tarih hesabı için hedefe özel aylık katkı tutarı girmen en doğrusu.`,reason:`${goals.length} tamamlanmamış hedef analiz edildi.`}}
 if(/tasarruf|biriktir|kenara/.test(x)){let cap=Math.max(0,m.net);return {text:`Mevcut aylık gelir-gider farkına göre yaklaşık ${chatMoney34(cap)} tasarruf kapasiten var. Bunun tamamını ayırmak yerine önce güvenli nakit tamponunu korumak daha iyi olabilir.`,reason:`Gelir ${chatMoney34(m.inc)} eksi gider ${chatMoney34(m.exp)} = ${chatMoney34(cap)}.`}}
 if(/yatırım|altın|döviz|hisse|fon|kripto/.test(x)){let assets=Number((typeof totals==='function'?totals():{}).assets||0);return {text:`Yatırım konusunda FinPal mevcut portföy değerini analiz edebilir; ancak tek bir varlığı kesin olarak “al” veya “sat” diye yönlendirmemeli. Portföy dağılımını, borç baskını ve nakit tamponunu birlikte değerlendirmek daha sağlıklı.`,reason:`Mevcut toplam varlık verisi yaklaşık ${chatMoney34(assets)} olarak okunuyor. Kişisel yatırım kararı için risk ve hedef bilgisi de gerekir.`}}
 if(/merhaba|selam|nasıl çalış/.test(x))return {text:'Merhaba 👋 Ben FinPal Finansal Asistan. Bana bütçe, borç, acil fon, hedef, tasarruf veya yatırım portföyün hakkında soru sorabilirsin.',reason:'Yerel asistan komutu.'};
 return {text:`Sorunu finansal verilerin üzerinden hesaplayabilirim. Şunlardan biriyle sor: “Bu ay ne kadar harcayabilirim?”, “Borçlarımı nasıl ödemeliyim?”, “Acil durum fonum yeterli mi?”, “Hedeflerime ne kadar ay kaldı?”`,reason:'Soru tanınan finans komutlarıyla eşleşmedi.'}}
function chatAdd34(role,text){let log=document.getElementById('chatLog34');if(!log)return;let d=document.createElement('div');d.className='chatMsg '+(role==='user'?'chatUser':'chatBot');d.textContent=text;log.appendChild(d);log.scrollTop=log.scrollHeight}
function ask34(q){let i=document.getElementById('chatInput34');if(i)i.value=q;send34()}
function send34(){let i=document.getElementById('chatInput34'),q=(i?.value||'').trim();if(!q)return;chatAdd34('user',q);let a=answer34(q);chatAdd34('bot',a.text);let r=document.getElementById('chatReason34');if(r)r.textContent=a.reason;if(i){i.value='';i.focus()}}
function initChat34(){let log=document.getElementById('chatLog34');if(log&&!log.children.length)chatAdd34('bot','Hazırım. Finansal durumunla ilgili bir soru sor. Örneğin: “Bu ay ne kadar harcayabilirim?”')}
setTimeout(initChat34,150);



const AI35_KEY='finpal_ai35_config';
function ai35Cfg(){try{return JSON.parse(localStorage.getItem(AI35_KEY)||'{}')}catch(e){return {}}}
function ai35SaveCfg(c){localStorage.setItem(AI35_KEY,JSON.stringify(c||{}))}
function ai35Summary(){
  let t=totals(), m=typeof autopilotMetrics==='function'?autopilotMetrics():{safe:0,planned:0,risk:'—',potential:0,debt:0};
  let efT=typeof emergencyTarget==='function'?Number(emergencyTarget()||0):0, efC=typeof emergencyCurrent==='function'?Number(emergencyCurrent()||0):0;
  let goals=(data.goals||[]).map(g=>({name:g.name,target:Number(g.target||0),saved:Number(g.saved||0)})).slice(0,12);
  let assets=Number(t.assets||0),liab=Number(t.liab||0);
  return {currency:'TRY',monthlyIncome:Number(t.mi||0),monthlyExpense:Number(t.me||0),monthlyNet:Number((t.mi||0)-(t.me||0)),liquidBalance:Number(liquidBalance()||0),assets,liabilities:liab,safeSpend:Number(m.safe||0),planned30d:Number(m.planned||0),risk:m.risk||'—',savingsPotential:Number(m.potential||0),debtRemaining:Number(m.debt||0),emergencyFund:{current:efC,target:efT,progress:efT?Math.round(efC/efT*100):0},goals};
}
function renderAI35Preview(){let e=document.getElementById('ai35Preview');if(e)e.textContent=JSON.stringify(ai35Summary(),null,2)}
function initAI35(){let c=ai35Cfg(),u=document.getElementById('ai35Endpoint'),m=document.getElementById('ai35Model');if(u)u.value=c.endpoint||'';if(m)m.value=c.model||'gpt-5.6-luna';renderAI35Preview();let l=document.getElementById('chatLog35');if(l&&!l.children.length)chatAdd35('bot','Hazırım. AI bağlantısını kurduğunda doğal dilde finansal sorularını yanıtlayabilirim.');}
function saveAI35(){let endpoint=(document.getElementById('ai35Endpoint')?.value||'').trim(),model=(document.getElementById('ai35Model')?.value||'gpt-5.6-luna').trim();if(endpoint&&!/^https:\/\//i.test(endpoint)){alert('Güvenlik için HTTPS endpoint kullan.');return}ai35SaveCfg({endpoint,model});showAI35Status(endpoint?'AI endpoint kaydedildi.':'Endpoint boş; yerel asistan kullanılacak.');renderAI35Preview()}
function clearAI35(){localStorage.removeItem(AI35_KEY);document.getElementById('ai35Endpoint').value='';document.getElementById('ai35Model').value='gpt-5.6-luna';showAI35Status('AI bağlantı ayarı temizlendi.')}
function showAI35Status(x){let e=document.getElementById('ai35Status');if(e)e.textContent=x}
function chatAdd35(role,text){let log=document.getElementById('chatLog35');if(!log)return;let d=document.createElement('div');d.className='chatMsg '+(role==='user'?'chatUser':'chatBot');d.textContent=text;log.appendChild(d);log.scrollTop=log.scrollHeight}
function ask35(q){let i=document.getElementById('chatInput35');if(i)i.value=q;send35()}
async function callAI35(question){let c=ai35Cfg();if(!c.endpoint)return null;let summary=ai35Summary();let system='Sen FinPal adlı kişisel finans uygulamasının güvenli AI koçusun. Türkçe cevap ver. Yalnızca verilen toplu finans özetini kullan. Veri yoksa uydurma. Yatırım veya borç konusunda kesin emir verme; varsayımları ve riskleri belirt. Kullanıcıdan IBAN, parola, PIN veya banka giriş bilgisi isteme. Kısa ama uygulanabilir bir plan sun.';let payload={model:c.model||'gpt-5.6-luna',messages:[{role:'system',content:system},{role:'user',content:'Finans özeti:\n'+JSON.stringify(summary)+'\n\nKullanıcı sorusu:\n'+question}],input:question,financial_summary:summary};let r=await fetch(c.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!r.ok)throw new Error('HTTP '+r.status);let j=await r.json();return j.output_text||j.output?.[0]?.content?.[0]?.text||j.choices?.[0]?.message?.content||j.answer||j.text||JSON.stringify(j)}
async function testAI35(){let c=ai35Cfg();if(!c.endpoint){showAI35Status('Önce HTTPS endpoint kaydet.');return}showAI35Status('Bağlantı test ediliyor…');try{let out=await callAI35('Bağlantı testi: yalnızca “FinPal AI bağlantısı çalışıyor.” yaz.');showAI35Status(out?'✅ AI bağlantısı çalışıyor.':'⚠️ Yanıt alındı fakat metin alanı bulunamadı.')}catch(e){showAI35Status('❌ Bağlantı başarısız: '+e.message)}}
async function send35(){let i=document.getElementById('chatInput35'),q=(i?.value||'').trim();if(!q)return;chatAdd35('user',q);if(i){i.value='';i.focus()}let c=ai35Cfg();if(!c.endpoint){let local=typeof answer34==='function'?answer34(q):{text:'AI endpoint ayarlı değil. Yerel asistanı kullanmak için Asistan sekmesine geçebilirsin.',reason:'3.5 için güvenli HTTPS endpoint tanımlanmadı.'};chatAdd35('bot',local.text);let rr=document.getElementById('ai35Reason');if(rr)rr.textContent=local.reason;return}chatAdd35('bot','⏳ Düşünüyorum…');try{let answer=await callAI35(q),log=document.getElementById('chatLog35');if(log&&log.lastChild&&log.lastChild.textContent==='⏳ Düşünüyorum…')log.removeChild(log.lastChild);chatAdd35('bot',answer||'Yanıt alınamadı.');let rr=document.getElementById('ai35Reason');if(rr)rr.textContent='AI, yalnızca toplu finans özetini ve sorunu kullandı. Ham hesap/işlem kimlikleri gönderilmedi.'}catch(e){let log=document.getElementById('chatLog35');if(log&&log.lastChild&&log.lastChild.textContent==='⏳ Düşünüyorum…')log.removeChild(log.lastChild);chatAdd35('bot','❌ AI bağlantısı başarısız. Endpoint, HTTPS ve sunucu yanıt formatını kontrol et.');let rr=document.getElementById('ai35Reason');if(rr)rr.textContent=e.message}}
setTimeout(initAI35,180);



const AI36_KEY='finpal_ai36_privacy';
function ai36Summary(){
  const t=totals(), ap=typeof autopilotMetrics==='function'?autopilotMetrics():{safe:0,planned:0,risk:'—',potential:0,debt:0};
  const efT=Number(typeof emergencyTarget==='function'?emergencyTarget()||0:0), efC=Number(typeof emergencyCurrent==='function'?emergencyCurrent()||0:0);
  const goals=(data.goals||[]).slice(0,10).map(g=>({name:String(g.name||'Hedef'),target:Number(g.target||0),saved:Number(g.saved||0)}));
  return {currency:'TRY',monthlyIncome:Number(t.mi||0),monthlyExpense:Number(t.me||0),monthlyNet:Number((t.mi||0)-(t.me||0)),liquidBalance:Number(liquidBalance()||0),assets:Number(t.assets||0),liabilities:Number(t.liab||0),safeSpend:Number(ap.safe||0),planned30d:Number(ap.planned||0),risk:String(ap.risk||'—'),savingPotential:Number(ap.potential||0),debtRemaining:Number(ap.debt||0),emergencyFund:{current:efC,target:efT,progress:efT?Math.round(efC/efT*100):0},goals};
}
function ai36Cfg(){try{return JSON.parse(localStorage.getItem(AI36_KEY)||'{}')}catch(e){return {consent:false}}}
function saveAI36Privacy(){let c={consent:!!document.getElementById('ai36Consent')?.checked,savedAt:new Date().toISOString()};localStorage.setItem(AI36_KEY,JSON.stringify(c));showAI36Status(c.consent?'✅ AI veri paylaşım izni kaydedildi.':'ℹ️ Harici AI veri paylaşımı kapalı; yerel asistan kullanılacak.')}
function revokeAI36(){localStorage.setItem(AI36_KEY,JSON.stringify({consent:false,savedAt:new Date().toISOString()}));if(document.getElementById('ai36Consent'))document.getElementById('ai36Consent').checked=false;showAI36Status('🔒 AI veri paylaşım izni kaldırıldı.')}
function showAI36Status(x){let e=document.getElementById('ai36PrivacyStatus');if(e)e.textContent=x}
function showAI36Data(){let e=document.getElementById('ai36Data');if(!e)return;e.style.display=e.style.display==='none'?'block':'none';e.textContent=JSON.stringify(ai36Summary(),null,2)}
function runAI36Scenario(){let m=ai36Summary(),extra=Math.max(0,Number(document.getElementById('ai36ExtraExpense')?.value||0)),save=Math.max(0,Number(document.getElementById('ai36ExtraSave')?.value||0)),months=Math.max(1,Math.min(120,Number(document.getElementById('ai36Months')?.value||12)));let base=m.monthlyNet,after=base-extra+save,delta=after-base,impact=delta*months;let e=document.getElementById('ai36Scenario');if(e)e.innerHTML=`<b>${months} aylık senaryo:</b> Aylık net etki <b>${money(after)}</b>. Mevcut duruma göre toplam ${money(impact)} ${impact>=0?'iyileşme':'azalma'} oluşturur. ${after<0?'⚠️ Bu senaryoda aylık nakit akışı negatife düşüyor.':'✅ Aylık nakit akışı pozitif kalıyor.'}`}
function runAI36(){let m=ai36Summary();for(const [id,val] of [['ai36Risk',m.risk],['ai36Safe',money(m.safeSpend)],['ai36Planned',money(m.planned30d)],['ai36Save',money(m.savingPotential)]]){let e=document.getElementById(id);if(e)e.textContent=val}let d=[];if(m.risk==='Yüksek')d.push('🔴 Öncelik: yeni büyük harcamaları ertele ve 30 günlük nakit tamponunu koru.');if(m.debtRemaining>0)d.push('💳 Borç: minimum ödemeleri koru; faiz bilgisi olan borçlarda Avalanche önceliğini değerlendir.');if(m.emergencyFund.target&&m.emergencyFund.progress<100)d.push(`🛟 Acil fon: hedefin %${m.emergencyFund.progress} seviyesinde; eksik tutar ${money(Math.max(0,m.emergencyFund.target-m.emergencyFund.current))}.`);if(m.savingPotential>0)d.push(`💰 Tasarruf: yaklaşık ${money(m.savingPotential)} aylık kapasite var; önce güvenli tamponu ayır.`);if(!d.length)d.push('🟢 Kritik bir sapma bulunmadı. Mevcut planı düzenli izlemeye devam et.');let e=document.getElementById('ai36Decisions');if(e)e.innerHTML=d.map(x=>`<div class="warnBox" style="margin:6px 0">${x}</div>`).join('');runAI36Scenario();let c=ai36Cfg();if(document.getElementById('ai36Consent'))document.getElementById('ai36Consent').checked=!!c.consent;showAI36Status(c.consent?'AI veri paylaşımı açık.':'AI veri paylaşımı kapalı; yerel mod aktif.')}
function sendAI36Question(){let q=prompt('FinPal AI Koçuna ne sormak istiyorsun?','Bu ay finansal olarak en önemli önceliğim ne?');if(!q)return;if(typeof tab==='function'){let btn=[...document.querySelectorAll('.tabs button')].find(b=>b.textContent.includes('AI 3.5'));if(btn)tab('assistant35',btn)}let i=document.getElementById('chatInput35');if(i){i.value=q;if(typeof send35==='function')send35();else alert('AI Asistan ekranı hazır değil.')}}
function initAI36(){let c=ai36Cfg();let e=document.getElementById('ai36Consent');if(e)e.checked=!!c.consent;runAI36()}
setTimeout(initAI36,250);




/* FinPal 4.6 Pro — Yedekleme & Kurtarma */
const FP46_RECOVERY='finpal46RecoveryPoints';

function backupMeta46(payload){
  const count=(x)=>Array.isArray(x)?x.length:0;
  return {
    format:'FinPalBackup',
    version:'4.6 Pro',
    appVersion:15,
    createdAt:new Date().toISOString(),
    currency:'TRY',
    stats:{
      accounts:count(payload.accounts),
      transactions:count(payload.transactions),
      budgets:count(payload.budgets),
      assets:count(payload.assets),
      obligations:count(payload.obligations),
      goals:count(payload.goals),
      subscriptions:count(payload.subscriptions),
      recurring:count(payload.paymentPlans)
    }
  };
}

function downloadJSON46(obj,name){
  const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=name;
  a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),800);
}

function backup46(){
  try{
    snapshotNetWorth45?.();
    const payload=JSON.parse(JSON.stringify(data));
    const pack={meta:backupMeta46(payload),data:payload};
    downloadJSON46(pack,'FinPal_4.6_Yedek_'+new Date().toISOString().slice(0,10)+'.json');
    renderBackup46('✅ Tam yedek indirildi. Dosyayı cihaz dışında da saklaman önerilir.');
  }catch(e){
    renderBackup46('❌ Yedek oluşturulamadı: '+e.message);
  }
}

function normalizeBackup46(obj){
  if(obj?.format==='FinPalEncryptedBackup') throw new Error('Bu dosya şifreli yedek. “Şifreli Yedek Aç” seçeneğini kullan.');
  const payload=obj?.meta?.format==='FinPalBackup' ? obj.data : obj;
  if(!payload || !Array.isArray(payload.accounts) || !Array.isArray(payload.transactions)) throw new Error('Geçerli FinPal yedeği değil.');
  return payload;
}

async function restore46(e){
  const f=e.target.files?.[0]; if(!f)return;
  try{
    const obj=JSON.parse(await f.text());
    const payload=normalizeBackup46(obj);
    const meta=obj?.meta;
    const info=meta ? `\nYedek: ${meta.version||'FinPal'}\nTarih: ${meta.createdAt||'—'}` : '';
    if(!confirm('Mevcut FinPal verileri bu yedek ile değiştirilsin mi?'+info)) return;
    createRecovery46(false);
    data=migrate(payload);
    save();
    renderBackup46('✅ Yedek başarıyla geri yüklendi. Önceki durum için yerel kurtarma noktası oluşturuldu.');
  }catch(err){
    renderBackup46('❌ Geri yükleme başarısız: '+err.message);
  }finally{
    e.target.value='';
  }
}

function recoveryList46(){
  try{return JSON.parse(localStorage.getItem(FP46_RECOVERY)||'[]')}catch(e){return []}
}

function createRecovery46(showMessage=true){
  try{
    const list=recoveryList46();
    const point={createdAt:new Date().toISOString(),data:JSON.parse(JSON.stringify(data))};
    list.unshift(point);
    localStorage.setItem(FP46_RECOVERY,JSON.stringify(list.slice(0,3)));
    if(showMessage)renderBackup46('✅ Yerel kurtarma noktası oluşturuldu. En fazla son 3 nokta tutulur.');
    return true;
  }catch(e){
    if(showMessage)renderBackup46('❌ Kurtarma noktası oluşturulamadı: '+e.message);
    return false;
  }
}

function restoreRecovery46(){
  const list=recoveryList46();
  if(!list.length){renderBackup46('ℹ️ Henüz yerel kurtarma noktası yok.');return}
  const point=list[0];
  const when=new Date(point.createdAt).toLocaleString('tr-TR');
  if(!confirm(`${when} tarihli son kurtarma noktasına dönülsün mü? Mevcut veriler değişecek.`))return;
  try{
    data=migrate(point.data);
    save();
    renderBackup46('✅ Son yerel kurtarma noktası geri yüklendi.');
  }catch(e){
    renderBackup46('❌ Kurtarma noktası geri yüklenemedi: '+e.message);
  }
}

function verifyBackup46(){
  const raw=localStorage.getItem(KEY);
  const issues=[];
  if(!raw)issues.push('Ana veri kaydı bulunamadı');
  let size=0;
  try{
    size=new Blob([raw||'']).size;
    const parsed=raw?JSON.parse(raw):null;
    if(!parsed?.accounts)issues.push('Hesap verisi eksik');
    if(!parsed?.transactions)issues.push('İşlem verisi eksik');
  }catch(e){issues.push('Ana veri JSON formatı bozuk')}
  const recoveries=recoveryList46();
  const text=issues.length
    ? `⚠️ Kontrol gerekli: ${issues.join(' · ')}`
    : `✅ Veri yapısı sağlıklı. Yerel veri yaklaşık ${(size/1024).toFixed(1)} KB. Kurtarma noktası: ${recoveries.length}/3.`;
  renderBackup46(text);
}

function renderBackup46(message=''){
  const e=document.getElementById('backup46Status'); if(!e)return;
  const list=recoveryList46();
  const last=list[0]?.createdAt ? new Date(list[0].createdAt).toLocaleString('tr-TR') : 'Yok';
  e.innerHTML=`<div class="kpi"><div>Yedek Formatı<b>4.6 Pro</b></div><div>Yerel Kurtarma<b>${list.length}/3</b></div><div>Son Nokta<b>${last}</b></div></div>${message?`<div class="warnBox" style="margin-top:8px">${message}</div>`:''}`;
}

setTimeout(()=>{try{renderBackup46();verifyBackup46()}catch(e){}},320);


(()=>{
const EP='finpal40Endpoint';
const enc=new TextEncoder(), dec=new TextDecoder();
const $=id=>document.getElementById(id);
function setLog(t){if($('fp40Log'))$('fp40Log').innerHTML=t}
function getData(){try{if(window.data)return JSON.parse(JSON.stringify(window.data));}catch(e){} try{for(const k of ['finpalData','finpal','data']){const v=localStorage.getItem(k);if(v)return JSON.parse(v)}}catch(e){} return null}
function b64(u8){let s='';for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode(...u8.subarray(i,i+0x8000));return btoa(s)}
function unb64(s){const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u}
async function keyFromPass(pass,salt){const base=await crypto.subtle.importKey('raw',enc.encode(pass),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:250000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function encrypt(payload,pass){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));const key=await keyFromPass(pass,salt);const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(JSON.stringify(payload))));return {format:'FinPalEncryptedBackup',version:1,createdAt:new Date().toISOString(),salt:b64(salt),iv:b64(iv),data:b64(ct)}}
async function decrypt(obj,pass){const key=await keyFromPass(pass,unb64(obj.salt));const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(obj.iv)},key,unb64(obj.data));return JSON.parse(dec.decode(pt))}
window.fp40SaveEndpoint=()=>{const v=($('fp40Endpoint')||{}).value?.trim()||'';if(v&&!/^https:\/\//i.test(v)){setLog('<span class="fp40-warn">Endpoint HTTPS olmalı.</span>');return}localStorage.setItem(EP,v);refresh();setLog(v?'Endpoint kaydedildi. API anahtarı tarayıcıya eklenmedi.':'Endpoint temizlendi.');}
window.fp40TestEndpoint=async()=>{const v=localStorage.getItem(EP)||'';if(!v){setLog('<span class="fp40-warn">Önce HTTPS endpoint tanımla.</span>');return}try{const r=await fetch(v,{method:'GET',headers:{'Accept':'application/json'}});setLog(r.ok?'<span class="fp40-ok">Endpoint erişilebilir. Gerçek AI çağrısı için sunucunun kimlik doğrulama ve POST sözleşmesini ayrıca tanımlamalıyız.</span>':'Sunucu yanıt verdi ancak durum kodu '+r.status+'.');}catch(e){setLog('Endpoint test edilemedi: '+e.message)} }
window.fp40EncryptedBackup=async()=>{if(!crypto?.subtle){setLog('<span class="fp40-warn">Bu cihaz/tarayıcı WebCrypto desteklemiyor.</span>');return}const pass=prompt('Şifreli yedek için bir parola belirle:');if(!pass||pass.length<8){setLog('En az 8 karakterlik parola gerekli.');return}try{const obj=await encrypt(getData(),pass),blob=new Blob([JSON.stringify(obj)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='finpal-sifreli-yedek-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);setLog('<span class="fp40-ok">Şifreli yedek oluşturuldu. Parolayı kaybedersen yedeği geri açamayız.</span>')}catch(e){setLog('Şifreli yedek oluşturulamadı: '+e.message)}}
window.fp40RestoreEncrypted=()=>{const f=$('fp40RestoreFile');if(f)f.click()}
window.fp40ReadEncrypted=async e=>{const f=e.target.files?.[0];if(!f)return;try{const obj=JSON.parse(await f.text());if(obj.format!=='FinPalEncryptedBackup')throw Error('FinPal şifreli yedeği değil');const pass=prompt('Yedek parolasını gir:');if(!pass)return;const restored=await decrypt(obj,pass);if(!restored||!restored.accounts||!restored.transactions)throw Error('Geçersiz FinPal verisi');if(!confirm('Mevcut FinPal verileri şifreli yedek ile değiştirilsin mi?'))return;localStorage.setItem('finpalData',JSON.stringify(restored));if(window.migrate)window.data=window.migrate(restored);else window.data=restored;if(window.save)window.save();location.reload()}catch(err){setLog('<span class="fp40-warn">Geri yükleme başarısız: parola yanlış veya dosya bozuk.</span>')}finally{e.target.value=''}}
window.fp40Health=()=>{const secure=window.isSecureContext===true,cryptoOk=!!window.crypto?.subtle,sw='serviceWorker' in navigator;const ep=localStorage.getItem(EP)||'';const issues=[];if(!secure)issues.push('HTTPS güvenli bağlam değil');if(!cryptoOk)issues.push('WebCrypto yok');if(!sw)issues.push('Service Worker desteklenmiyor');if(!getData())issues.push('FinPal verisi bulunamadı');$('fp40Https').textContent=secure?'Hazır':'Dikkat';$('fp40Crypto').textContent=cryptoOk?'Hazır':'Yok';$('fp40Pwa').textContent=sw?'Destekleniyor':'Yok';$('fp40Api').textContent=ep?'Tanımlı':'Yapılandırılmadı';$('fp40Secure').textContent=issues.length?'Kontrol gerekli':'Güvenlik temeli hazır';setLog(issues.length?'Kontrol: '+issues.join(' · '):'<span class="fp40-ok">Ürün sağlık kontrolü başarılı. Güvenli bağlam, WebCrypto ve yerel veri hazır.</span>')}
function refresh(){const ep=localStorage.getItem(EP)||'';if($('fp40Endpoint'))$('fp40Endpoint').value=ep;if($('fp40Api'))$('fp40Api').textContent=ep?'Tanımlı':'Yapılandırılmadı';}
refresh();setTimeout(window.fp40Health,400);
})();



(function(){
 const KEY='finpal42_backend';
 const WORKER=`const DEFAULT_ORIGIN = "https://pangaea5.github.io";
const DEFAULT_MODEL = "gpt-5.6-luna";
const MAX_BODY_BYTES = 120000;

function originFor(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allow = (env.ALLOWED_ORIGIN || DEFAULT_ORIGIN).split(",").map(x => x.trim()).filter(Boolean);
  if (!origin) return allow[0] || DEFAULT_ORIGIN;
  return allow.includes(origin) ? origin : null;
}
function headers(origin) {
  const h = new Headers({
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "no-store"
  });
  if (origin) { h.set("Access-Control-Allow-Origin", origin); h.set("Vary", "Origin"); }
  return h;
}
function json(data, status, origin) {
  const h = headers(origin); h.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { status: status || 200, headers: h });
}
function clean(v, max) { return typeof v === "string" ? v.trim().slice(0, max || 20000) : ""; }

export default {
  async fetch(request, env) {
    const origin = originFor(request, env);
    if (request.method === "OPTIONS") {
      return origin ? new Response(null, { status: 204, headers: headers(origin) }) : new Response(null, { status: 403 });
    }
    if (!origin && request.headers.get("Origin")) return json({ok:false,error:"Origin not allowed."},403,null);

    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ok:true,service:"FinPal API",version:"4.2",aiConfigured:Boolean(env.OPENAI_API_KEY),model:env.OPENAI_MODEL || DEFAULT_MODEL,time:new Date().toISOString()},200,origin);
    }
    if (request.method !== "POST" || url.pathname !== "/ai") return json({ok:false,error:"Not found."},404,origin);
    if (!env.OPENAI_API_KEY) return json({ok:false,error:"AI backend is not configured."},503,origin);

    const length = Number(request.headers.get("Content-Length") || 0);
    if (length > MAX_BODY_BYTES) return json({ok:false,error:"Request too large."},413,origin);
    let body;
    try {
      const raw = await request.text();
      if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json({ok:false,error:"Request too large."},413,origin);
      body = JSON.parse(raw);
    } catch { return json({ok:false,error:"Invalid JSON."},400,origin); }

    const question = clean(body?.question,8000);
    const summary = body?.financial_summary && typeof body.financial_summary === "object" ? body.financial_summary : {};
    if (!question) return json({ok:false,error:"Question is required."},400,origin);

    const system = [
      "Sen FinPal'in Türkçe kişisel finans koçusun.",
      "Yalnızca istemcinin gönderdiği toplu finans özetini kullan; veri yoksa uydurma.",
      "Parola, PIN, API anahtarı, IBAN, kart numarası veya banka giriş bilgisi isteme ya da üretme.",
      "Ödeme, transfer veya alım-satım işlemi gerçekleştirme.",
      "Yatırım, kredi, vergi veya hukuk konularında garanti verme; varsayımları ve riskleri açıkla.",
      "Veri yetersizse hangi bilginin eksik olduğunu açıkça belirt.",
      "Hesaplama yaparken sonucu ve kısa gerekçesini göster."
    ].join(" ");
    const input = system + "\\n\\nFINANS ÖZETİ:\\n" + JSON.stringify(summary) + "\\n\\nKULLANICI SORUSU:\\n" + question;

    try {
      const r = await fetch("https://api.openai.com/v1/responses", {
        method:"POST",
        headers:{"Authorization":"Bearer " + env.OPENAI_API_KEY,"Content-Type":"application/json"},
        body:JSON.stringify({model:env.OPENAI_MODEL || DEFAULT_MODEL,input,store:false})
      });
      if (!r.ok) return json({ok:false,error:"AI provider request failed.",status:r.status},502,origin);
      const result = await r.json();
      return json({ok:true,output_text:typeof result.output_text === "string" ? result.output_text : ""},200,origin);
    } catch {
      return json({ok:false,error:"AI service temporarily unavailable."},502,origin);
    }
  }
};
`;
 const WRANGLER=`name = "finpal-api"\nmain = "finpal-worker.js"\ncompatibility_date = "2026-09-06"\n\n[vars]\nOPENAI_MODEL = "gpt-5.6-luna"\nALLOWED_ORIGIN = "https://pangaea5.github.io"\n`;
 function cfg(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return {}}}
 function save(c){localStorage.setItem(KEY,JSON.stringify(c||{}))}
 function log(x){const e=document.getElementById('fp42Log');if(e)e.textContent=x}
 function render(){const c=cfg(),u=document.getElementById('fp42Endpoint');if(u)u.value=c.endpoint||'';const st=document.getElementById('fp42EndpointState');if(st)st.textContent=c.endpoint?'Ayarlı':'Ayarlanmadı';const dot=document.getElementById('fp42Dot'),net=document.getElementById('fp42Net');const online=navigator.onLine!==false;if(dot)dot.className='fp42-dot '+(online?'ok':'warn');if(net)net.textContent=online?'Çevrimiçi':'Çevrimdışı'}
 window.fp42Save=function(){let e=(document.getElementById('fp42Endpoint')?.value||'').trim().replace(/\/$/,'');if(e&&!/^https:\/\//i.test(e)){alert('Worker URL HTTPS olmalı.');return}save({endpoint:e});render();log(e?'Backend endpoint kaydedildi.':'Endpoint temizlendi.')}
 window.fp42HealthCheck=async function(){const c=cfg(),h=document.getElementById('fp42HealthState');if(!c.endpoint){if(h)h.textContent='Endpoint yok';log('Önce Worker URL gir.');return}if(h)h.textContent='Test…';try{const r=await fetch(c.endpoint+'/health',{headers:{'Accept':'application/json'}});const j=await r.json().catch(()=>({}));if(!r.ok)throw Error('HTTP '+r.status);if(h)h.textContent=j.ok?'OK':'Hata';log(j.ok?'✅ Worker çalışıyor. AI: '+(j.aiConfigured?'hazır':'OPENAI_API_KEY eksik')+'.':'❌ Sağlık yanıtı geçersiz.')}catch(e){if(h)h.textContent='Hata';log('❌ Backend test başarısız: '+e.message)}}
 window.fp42TestAI=async function(){const c=cfg();if(!c.endpoint){log('Önce Worker URL gir.');return}try{const summary=typeof ai35Summary==='function'?ai35Summary():{};const r=await fetch(c.endpoint+'/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:'Bağlantı testi. Yalnızca "FinPal AI bağlantısı çalışıyor." yaz.',financial_summary:summary})});const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.error||('HTTP '+r.status));log('🤖 '+(j.output_text||'AI yanıtı boş.'))}catch(e){log('❌ AI test başarısız: '+e.message)}}
 window.fp42DownloadWorker=function(){const blob=new Blob([WORKER],{type:'text/javascript'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='finpal-worker.js';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);log('finpal-worker.js oluşturuldu.')}
 window.fp42DownloadWrangler=function(){const blob=new Blob([WRANGLER],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='wrangler.toml';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);log('wrangler.toml oluşturuldu.')}
 window.addEventListener('online',render);window.addEventListener('offline',render);setTimeout(render,100);
})();



(function(){
  const Q='finpal37_sync_queue', SNAP='finpal37_snapshot';
  function read(k,fb){try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb}catch(e){return fb}}
  function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
  function queue(){return read(Q,[])}
  function log(t){const e=document.getElementById('fp37Log');if(e)e.textContent=t}
  function fmt(t){try{return new Date(t).toLocaleString('tr-TR')}catch(e){return '—'}}
  function size(){try{return new Blob([localStorage.getItem('finpalData')||'']).size}catch(e){return 0}}
  function dataKey(){
    if(window.data && typeof window.data==='object') return 'window.data';
    const keys=['finpalData','finpal','data'];
    for(const k of keys){try{if(localStorage.getItem(k))return k}catch(e){}}
    return null;
  }
  function refresh(){
    const online=navigator.onLine!==false,dot=document.getElementById('fp37Dot'),net=document.getElementById('fp37Net');
    if(dot)dot.className='fp37-dot '+(online?'ok':'warn'); if(net)net.textContent=online?'Çevrimiçi':'Çevrimdışı';
    const d=document.getElementById('fp37Data'); if(d)d.textContent=(size()/1024).toFixed(1)+' KB';
    const q=document.getElementById('fp37Queue'); if(q)q.textContent=queue().length;
    const snap=read(SNAP,null),sv=document.getElementById('fp37Saved');if(sv)sv.textContent=snap?fmt(snap.at):'—';
    const l=document.getElementById('fp37Load');if(l&&performance&&performance.timing){const n=performance.now();l.textContent=Math.round(n)+' ms'}
  }
  window.fp37Enqueue=function(type,payload){const a=queue();a.push({id:Date.now()+'-'+Math.random().toString(36).slice(2,7),type,payload,at:new Date().toISOString()});write(Q,a);refresh();return a[a.length-1].id}
  window.fp37SyncNow=function(){
    const a=queue();
    if(!a.length){log(navigator.onLine===false?'Çevrimdışı. Kuyruk boş.':'Senkronize edilecek bekleyen işlem yok.');return}
    if(navigator.onLine===false){log('Çevrimdışı olduğun için işlemler yerel kuyrukta tutuluyor. İnternet geldiğinde tekrar deneyebilirsin.');return}
    // Tek HTML mimarisinde uzak sunucu yoksa güvenli davranış: kuyruk yerelde işlenmiş kabul edilir.
    write(Q,[]);refresh();log(a.length+' bekleyen yerel işlem senkronizasyon kuyruğundan işlendi. Uzak API bağlıysa bu noktaya gerçek POST katmanı eklenebilir.');
  }
  window.fp37CacheSnapshot=function(){
    let payload=null;
    try{payload=window.data?JSON.parse(JSON.stringify(window.data)):null}catch(e){}
    if(!payload){const k=dataKey();try{payload=k?JSON.parse(localStorage.getItem(k)):null}catch(e){}}
    const snap={at:new Date().toISOString(),payload:payload};
    if(write(SNAP,snap)){refresh();log('Yerel snapshot oluşturuldu: '+fmt(snap.at));}else log('Snapshot oluşturulamadı: cihaz depolama alanı dolu olabilir.');
  }
  window.fp37Health=function(){
    const issues=[];if(!navigator.onLine)issues.push('internet bağlantısı yok');
    try{JSON.parse(localStorage.getItem('finpalData')||'{}')}catch(e){issues.push('finpalData JSON okunamıyor')}
    if(queue().length>100)issues.push('senkronizasyon kuyruğu büyümüş');
    if(typeof window.data==='undefined')issues.push('global data nesnesi bulunamadı');
    if(issues.length)log('Kontrol: '+issues.join(' · '));else log('Sağlık kontrolü başarılı. Yerel veri okunabilir ve kuyruk normal.');
    refresh();
  }
  window.addEventListener('online',refresh);window.addEventListener('offline',refresh);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)refresh()});
  setTimeout(function(){refresh();if(!read(SNAP,null))fp37CacheSnapshot()},300);
})();

/* FinPal 4.4 Pro — Gelişmiş Raporlar */
(function(){
  function pctChange(cur,prev){if(!prev)return cur?100:0;return ((cur-prev)/Math.abs(prev))*100}
  function signText(v){if(!isFinite(v))v=0;return `${v>0?'+':''}${Math.round(v)}%`}
  function daysInReportMonth(m){let [y,mo]=m.split('-').map(Number);return new Date(y,mo,0).getDate()}
  function netWorth44(){
    let a=0,l=0;
    (data.accounts||[]).forEach(x=>{let b=Number(accountBalance(x.id)||0);if(x.type==='credit'||x.type==='debt')l+=Math.max(0,Math.abs(Math.min(0,b)));else a+=Math.max(0,b)});
    a+=Number(typeof trackedAssetTotal==='function'?trackedAssetTotal():0);
    (data.obligations||[]).filter(o=>o.type==='debt').forEach(o=>l+=Number(obligationRemaining(o)||0));
    return {assets:a,liabilities:l,net:a-l};
  }
  function escCSV(v){let s=String(v??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
  window.downloadReportCSV=function(){
    let rm=reportMonth||month();
    let rows=[['Tarih','Tür','Açıklama','Kategori','Tutar','Hesap']];
    (data.transactions||[]).filter(t=>(t.date||'').slice(0,7)===rm).sort((a,b)=>(a.date||'').localeCompare(b.date||'')).forEach(t=>{
      let acc=(data.accounts||[]).find(a=>a.id===t.accountId);
      rows.push([t.date,t.type==='income'?'Gelir':'Gider',t.description||'',t.categorySubcategory||t.category||'',Number(t.amount||0).toFixed(2),acc?.name||'']);
    });
    let csv='\ufeff'+rows.map(r=>r.map(escCSV).join(';')).join('\n');
    let blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`FinPal_Rapor_${rm}.csv`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  };

  renderReports=function(){
    let rm=reportMonth||month(),rmEl=document.getElementById('reportMonth');if(rmEl&&rmEl.value!==rm)rmEl.value=rm;
    let mt=monthTotals(rm),pm=previousMonth(rm),pt=monthTotals(pm);
    let b=(data.budgets||[]).filter(x=>x.month===rm),bl=b.reduce((s,x)=>s+Number(x.amount||0),0),bs=b.reduce((s,x)=>s+budgetSpent(x),0);
    let saveRate=mt.inc?mt.net/mt.inc*100:0,expenseRatio=mt.inc?mt.exp/mt.inc*100:0,days=daysInReportMonth(rm),dailyAvg=mt.exp/days;
    let tx=(data.transactions||[]).filter(t=>(t.date||'').slice(0,7)===rm),expenseTx=tx.filter(t=>t.type==='expense');

    let k=document.getElementById('reportKpis');if(k)k.innerHTML=`<div class="cardMini"><span>Tasarruf oranı<br><b class="${saveRate>=20?'positive':saveRate>=0?'':'negative'}">${Math.round(saveRate)}%</b></span><span>Gider / Gelir<br><b>${Math.round(expenseRatio)}%</b></span><span>Günlük ort. gider<br><b>${money(dailyAvg)}</b></span><span>İşlem sayısı<br><b>${tx.length}</b></span></div>`;

    let ie=document.getElementById('reportIncomeExpense');if(ie)ie.innerHTML=`<div class="cardMini"><span>Gelir<br><b class="positive">${money(mt.inc)}</b></span><span>Gider<br><b class="negative">${money(mt.exp)}</b></span><span>Net<br><b class="${mt.net>=0?'positive':'negative'}">${money(mt.net)}</b></span></div><div class="progress"><div class="bar" style="width:${mt.inc?Math.min(100,Math.max(0,mt.exp/mt.inc*100)):0}%"></div></div><div class="muted">Gider / gelir oranı: ${Math.round(expenseRatio)}%</div>`;

    let cmp=document.getElementById('reportComparison');if(cmp){let ic=pctChange(mt.inc,pt.inc),ec=pctChange(mt.exp,pt.exp),nc=mt.net-pt.net;cmp.innerHTML=`<div class="row"><span>Gelir değişimi</span><b class="${ic>=0?'positive':'negative'}">${signText(ic)}</b></div><div class="row"><span>Gider değişimi</span><b class="${ec<=0?'positive':'negative'}">${signText(ec)}</b></div><div class="row"><span>Net fark</span><b class="${nc>=0?'positive':'negative'}">${nc>=0?'+':''}${money(nc)}</b></div><div class="muted">Karşılaştırma: ${pm}</div>`}

    let rb=document.getElementById('reportBudget');if(rb)rb.innerHTML=`<div class="cardMini"><span>Limit<br><b>${money(bl)}</b></span><span>Harcanan<br><b>${money(bs)}</b></span><span>Kalan<br><b class="${bl-bs<0?'negative':'positive'}">${money(bl-bs)}</b></span></div><div class="progress"><div class="bar" style="width:${bl?Math.min(100,Math.max(0,bs/bl*100)):0}%"></div></div><div class="muted">${bl?Math.round(bs/bl*100):0}% kullanıldı · ${b.length} bütçe kalemi</div>`;

    let dayMap={};expenseTx.forEach(t=>{let d=(t.date||'').slice(8,10);dayMap[d]=(dayMap[d]||0)+Number(t.amount||0)});let dmax=Math.max(1,...Object.values(dayMap));let daily=document.getElementById('reportDaily');if(daily)daily.innerHTML=Object.keys(dayMap).length?Object.entries(dayMap).sort((a,b)=>a[0].localeCompare(b[0])).map(([d,v])=>`<div class="row"><div style="flex:1"><b>${d}. gün</b><div class="progress"><div class="bar" style="width:${v/dmax*100}%"></div></div></div><b>${money(v)}</b></div>`).join(''):'<div class="empty">Bu ay gider yok.</div>';

    let months=[];let base=new Date(rm+'-01T00:00:00');for(let i=11;i>=0;i--){let x=new Date(base.getFullYear(),base.getMonth()-i,1);months.push(`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}`)}let vals=months.map(m=>({...monthTotals(m),label:m.slice(5)}));let mx=Math.max(1,...vals.flatMap(x=>[x.inc,x.exp]));let rt=document.getElementById('reportTrend');if(rt)rt.innerHTML=vals.map(x=>`<div class="col" title="${x.label}: gelir ${money(x.inc)} · gider ${money(x.exp)}"><div class="vbar in" style="height:${x.inc/mx*95}%"></div><div class="vbar" style="height:${x.exp/mx*95}%"></div></div>`).join('');

    let cats={};expenseTx.forEach(t=>{let key=(t.categoryGroup||'Diğer')+' › '+(t.categorySubcategory||t.category||'Diğer');cats[key]=(cats[key]||0)+Number(t.amount||0)});let catArr=Object.entries(cats).sort((a,b)=>b[1]-a[1]);let rc=document.getElementById('reportCategories');if(rc)rc.innerHTML=catArr.length?catArr.map(([key,v])=>`<div class="row"><div style="flex:1"><b>${key}</b><div class="progress"><div class="bar" style="width:${mt.exp?Math.min(100,v/mt.exp*100):0}%"></div></div><span class="muted">${mt.exp?Math.round(v/mt.exp*100):0}%</span></div><b>${money(v)}</b></div>`).join(''):'<div class="empty">Bu ay harcama yok.</div>';

    let top=document.getElementById('reportTopExpenses');if(top){let arr=[...expenseTx].sort((a,b)=>Number(b.amount||0)-Number(a.amount||0)).slice(0,5);top.innerHTML=arr.length?arr.map((t,i)=>`<div class="row"><div><b>${i+1}. ${t.description||t.categorySubcategory||t.category||'Gider'}</b><div class="muted">${fmt(t.date)} · ${t.categorySubcategory||t.category||'Diğer'}</div></div><b class="negative">${money(t.amount)}</b></div>`).join(''):'<div class="empty">Bu ay gider yok.</div>'}

    let cards=(data.accounts||[]).filter(a=>a.type==='credit');let rcard=document.getElementById('reportCards');if(rcard)rcard.innerHTML=cards.length?cards.map(a=>{let c=cardInfo(a.id);let use=a.cardLimit?Math.round((a.cardLimit-c.available)/a.cardLimit*100):0;return `<div class="row"><div style="flex:1"><b>${a.name}</b><div class="progress"><div class="bar" style="width:${Math.min(100,Math.max(0,use))}%"></div></div><span class="muted">Borç ${money(c.debt)} · Limit kullanımı ${use}% · Ekstre ${money(c.statement)} · Son ödeme ${c.due?fmt(c.due):'—'}</span></div></div>`}).join(''):'<div class="empty">Kredi kartı yok.</div>';

    let nw=netWorth44(),nwEl=document.getElementById('reportNetWorth');if(nwEl)nwEl.innerHTML=`<div class="cardMini"><span>Varlıklar<br><b class="positive">${money(nw.assets)}</b></span><span>Borçlar<br><b class="negative">${money(nw.liabilities)}</b></span><span>Net varlık<br><b class="${nw.net>=0?'positive':'negative'}">${money(nw.net)}</b></span></div>`;

    let ins=[];if(mt.exp>mt.inc&&mt.inc>0)ins.push('🔴 Bu ay giderlerin gelirlerini aşıyor. Harcamaları gözden geçir.');else if(saveRate>=20)ins.push('🟢 Tasarruf oranı %'+Math.round(saveRate)+'. Güçlü bir ay.');else if(mt.inc>0)ins.push('🟡 Tasarruf oranı %'+Math.round(Math.max(0,saveRate))+'. %20 ve üzeri hedeflenebilir.');if(bl&&bs>bl)ins.push('🔴 Bütçe limitinin '+money(bs-bl)+' üzerindesin.');if(pt.exp&&mt.exp>pt.exp*1.2)ins.push('⚠️ Giderlerin geçen aya göre %20’den fazla yükselmiş.');if(catArr[0]&&mt.exp&&catArr[0][1]/mt.exp>.4)ins.push('⚠️ En büyük harcama kategorin toplam giderin %'+Math.round(catArr[0][1]/mt.exp*100)+' kadarını oluşturuyor.');if(nw.net<0)ins.push('🔴 Net varlık negatif. Borç azaltımı öncelikli olabilir.');if(!ins.length)ins.push('🟢 Kritik bir uyarı görünmüyor. Finansal görünüm dengeli.');let ri=document.getElementById('reportInsights');if(ri)ri.innerHTML=ins.map(x=>`<div class="row"><span>${x}</span></div>`).join('');
  };
})();



/* FinPal 4.7 Pro — Güvenlik Merkezi */
const FP47_ITER=120000;
function b64u47(bytes){return btoa(String.fromCharCode(...bytes))}
function bytes47(s){return new TextEncoder().encode(s)}
async function derivePin47(pin,saltB64){
  const salt=Uint8Array.from(atob(saltB64),c=>c.charCodeAt(0));
  const key=await crypto.subtle.importKey('raw',bytes47(pin),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:FP47_ITER},key,256);
  return b64u47(new Uint8Array(bits));
}
function secureContext47(){return !!(window.isSecureContext&&window.crypto?.subtle)}
function waitText47(ms){
  if(ms<=0)return '';
  const sec=Math.ceil(ms/1000);
  if(sec<60)return sec+' sn';
  return Math.ceil(sec/60)+' dk';
}
function lockNow47(){
  if(!data.security.pinEnabled)return alert('Önce PIN kilidini etkinleştir.');
  sessionStorage.removeItem('finpalUnlocked');
  openLock();
  const m=document.getElementById('lockMsg'); if(m)m.textContent='FinPal manuel olarak kilitlendi.';
}
function securityStatus47(msg=''){
  const e=document.getElementById('security47Status');if(e)e.textContent=msg;
}
openSecurity=function(){
  const s=data.security,supported=webauthnAvailable();
  openModal('🔐 FinPal 4.7 Pro Güvenlik Merkezi','security47',`
    <label>PIN kilidi</label>
    <select id="sec47Pin"><option value="on" ${s.pinEnabled?'selected':''}>Açık</option><option value="off" ${!s.pinEnabled?'selected':''}>Kapalı</option></select>
    ${s.pinEnabled?'<label>Mevcut PIN (PIN değiştirilecekse)</label><input id="sec47Current" inputmode="numeric" type="password" maxlength="6" placeholder="••••">':''}
    <label>${s.pinEnabled?'Yeni PIN (değiştirmeyeceksen boş bırak)':'Yeni PIN (4-6 hane)'}</label>
    <input id="sec47New" inputmode="numeric" type="password" maxlength="6" placeholder="••••">
    <label>Yeni PIN tekrar</label>
    <input id="sec47Repeat" inputmode="numeric" type="password" maxlength="6" placeholder="••••">
    <label>Otomatik kilit</label>
    <select id="sec47Auto"><option value="0" ${s.autoLock==0?'selected':''}>Hemen</option><option value="1" ${s.autoLock==1?'selected':''}>1 dakika</option><option value="5" ${s.autoLock==5?'selected':''}>5 dakika</option><option value="15" ${s.autoLock==15?'selected':''}>15 dakika</option><option value="30" ${s.autoLock==30?'selected':''}>30 dakika</option></select>
    <label>Uygulamadan çıkınca / sekme gizlenince</label>
    <select id="sec47Hidden"><option value="yes" ${s.lockOnHidden!==false?'selected':''}>Kilitle</option><option value="no" ${s.lockOnHidden===false?'selected':''}>Kilitleme</option></select>
    <div class="securityBadge">${secureContext47()?'PIN yeni formatta PBKDF2 + SHA-256 ile güçlendirilir.':'Güçlü PIN türetimi için HTTPS/güvenli bağlam gerekir.'}</div>
    <div class="securityBadge">${supported?'Face ID / Touch ID / cihaz biyometrisi WebAuthn üzerinden kullanılabilir.':'Bu tarayıcıda WebAuthn kullanılamıyor.'}</div>
    <div class="actions"><button ${supported?'':'disabled'} type="button" onclick="registerWebAuthn()"> Biyometri Kaydet</button>${s.biometricEnabled?'<button class="light" type="button" onclick="removeBiometric()">Biyometriyi Kaldır</button>':''}</div>
  `);
}
async function verifyCurrentPin47(pin){
  const s=data.security;
  if(!s.pinEnabled)return true;
  if(s.pinKdf&&s.pinSalt)return (await derivePin47(pin,s.pinSalt))===s.pinKdf;
  return hashText(pin)===s.pinHash;
}
async function setPin47(pin){
  if(!secureContext47()){
    data.security.pinHash=hashText(pin);
    data.security.pinSalt='';data.security.pinKdf='';
    return;
  }
  const salt=crypto.getRandomValues(new Uint8Array(16));
  data.security.pinSalt=b64u47(salt);
  data.security.pinKdf=await derivePin47(pin,data.security.pinSalt);
  data.security.pinHash='';
}
const submitModalBefore47=submitModal;
submitModal=async function(){
  if(modalType!=='security47')return submitModalBefore47();
  const enabled=val('sec47Pin')==='on';
  const current=(document.getElementById('sec47Current')?.value||'').trim();
  const fresh=(val('sec47New')||'').trim(),repeat=(val('sec47Repeat')||'').trim();
  if(enabled){
    if(!data.security.pinEnabled && !fresh)return alert('PIN belirleyin.');
    if(fresh){
      if(!/^\d{4,6}$/.test(fresh))return alert('PIN 4-6 haneli olmalı.');
      if(fresh!==repeat)return alert('Yeni PIN tekrarı eşleşmiyor.');
      if(data.security.pinEnabled){
        if(!current)return alert('PIN değiştirmek için mevcut PIN gerekli.');
        if(!(await verifyCurrentPin47(current)))return alert('Mevcut PIN yanlış.');
      }
      await setPin47(fresh);
    }
  }else{
    if(data.security.pinEnabled){
      if(!current)return alert('PIN kilidini kapatmak için mevcut PIN gerekli.');
      if(!(await verifyCurrentPin47(current)))return alert('Mevcut PIN yanlış.');
    }
    data.security.pinHash='';data.security.pinSalt='';data.security.pinKdf='';
    data.security.biometricEnabled=false;data.security.credentialId='';
  }
  data.security.pinEnabled=enabled;
  data.security.autoLock=Number(val('sec47Auto')||5);
  data.security.lockOnHidden=val('sec47Hidden')==='yes';
  data.security.failedAttempts=0;data.security.lockUntil=0;
  save();closeModal();
  securityStatus47('Güvenlik ayarları güncellendi.');
}
unlockWithPin=async function(){
  const s=data.security,now=Date.now(),msg=document.getElementById('lockMsg');
  if(Number(s.lockUntil||0)>now){
    if(msg)msg.textContent='Çok fazla hatalı deneme. '+waitText47(s.lockUntil-now)+' sonra tekrar deneyin.';
    return;
  }
  const el=document.getElementById('unlockPin'),p=(el?.value||'').trim();
  if(!/^\d{4,6}$/.test(p)){if(msg)msg.textContent='4-6 haneli PIN girin.';return}
  let ok=false;
  try{ok=await verifyCurrentPin47(p)}catch(e){if(msg)msg.textContent='PIN doğrulaması yapılamadı.';return}
  if(!ok){
    s.failedAttempts=Number(s.failedAttempts||0)+1;
    let wait=0;
    if(s.failedAttempts>=10)wait=15*60*1000;
    else if(s.failedAttempts>=8)wait=5*60*1000;
    else if(s.failedAttempts>=5)wait=60*1000;
    if(wait)s.lockUntil=Date.now()+wait;
    localStorage.setItem(KEY,JSON.stringify(data));
    if(msg)msg.textContent=wait?'Çok fazla hatalı deneme. '+waitText47(wait)+' bekleyin.':`PIN hatalı. Deneme: ${s.failedAttempts}/5`;
    return;
  }
  if(!s.pinKdf && secureContext47()){try{await setPin47(p)}catch(e){}}
  s.failedAttempts=0;s.lockUntil=0;s.lastUnlock=Date.now();
  localStorage.setItem(KEY,JSON.stringify(data));
  if(el)el.value='';
  unlock();
}
const unlockBefore47=unlock;
unlock=function(){
  data.security.lastUnlock=Date.now();
  data.security.failedAttempts=0;data.security.lockUntil=0;
  localStorage.setItem(KEY,JSON.stringify(data));
  return unlockBefore47();
}
renderSecurity=function(){
  const el=document.getElementById('securityDetail');if(!el)return;
  const s=data.security,now=Date.now(),blocked=Number(s.lockUntil||0)>now;
  const pinType=s.pinEnabled?(s.pinKdf?'PBKDF2-SHA256':'Eski PIN biçimi'):'Kapalı';
  el.innerHTML=`<div class="kpi"><div>PIN Koruması<b>${s.pinEnabled?'🔒 Açık':'Kapalı'}</b></div><div>PIN Gücü<b>${pinType}</b></div><div>Biyometri<b>${s.biometricEnabled?' Hazır':'Kurulmadı'}</b></div></div>
  <div class="row"><span>Otomatik kilit</span><b>${s.autoLock==0?'Hemen':s.autoLock+' dk'}</b></div>
  <div class="row"><span>Sekme gizlenince kilit</span><b>${s.lockOnHidden!==false?'Açık':'Kapalı'}</b></div>
  <div class="row"><span>Başarısız PIN denemesi</span><b>${Number(s.failedAttempts||0)}</b></div>
  ${blocked?`<div class="dangerBox">Geçici güvenlik kilidi aktif: ${waitText47(s.lockUntil-now)}</div>`:''}
  <div class="muted">Biyometri, iOS/macOS cihazlarında tarayıcı ve sistem desteğine göre Face ID veya Touch ID olarak gösterilebilir. FinPal biyometrik veriyi kendisi saklamaz.</div>`;
}
let fp47HiddenAt=0;
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){fp47HiddenAt=Date.now();return}
  if(data.security.pinEnabled&&data.security.lockOnHidden!==false&&fp47HiddenAt&&Date.now()-fp47HiddenAt>1500){
    sessionStorage.removeItem('finpalUnlocked');openLock();
    const m=document.getElementById('lockMsg');if(m)m.textContent='Uygulama arka plandan döndüğü için kilitlendi.';
  }
});
setTimeout(()=>{try{renderSecurity()}catch(e){}},350);




/* FinPal 4.8 Pro — Akıllı Finans Asistanı */
let fp48LastSummary='';
function aiMetrics48(){
  const now=new Date(),m=month(),tx=(data.transactions||[]).filter(t=>(t.date||'').slice(0,7)===m);
  const income=tx.filter(t=>t.type==='income').reduce((s,t)=>s+Number(t.amount||0),0);
  const expense=tx.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.amount||0),0);
  const saving=income-expense,savingRate=income?saving/income*100:0;
  const t=totals(),debt=Number(t.liab||0),net=Number(t.net||0);
  const ef=Number(data.emergencyFund?.current||0);
  const essential=Math.max(1,expense);
  const efMonths=ef/essential;
  const budgets=(data.budgets||[]).filter(b=>b.month===m);
  const budgetLimit=budgets.reduce((s,b)=>s+Number(b.limit||0),0);
  const budgetUse=budgetLimit?expense/budgetLimit*100:0;
  const subs=(data.subscriptions||[]).filter(x=>x.active!==false);
  const subMonthly=subs.reduce((s,x)=>s+Number(x.amount||0)*(x.frequency==='yearly'?1/12:1),0);
  const overdue=(data.obligations||[]).filter(o=>!o.paid&&o.dueDate&&o.dueDate<new Date().toISOString().slice(0,10));
  return {income,expense,saving,savingRate,debt,net,ef,efMonths,budgetLimit,budgetUse,subMonthly,overdue};
}
function aiInsights48(){
  const x=aiMetrics48(),items=[];
  if(x.income<=0) items.push({p:1,icon:'🔴',title:'Gelir verisini tamamla',text:'Bu ay gelir kaydı görünmediği için tasarruf ve nakit akışı analizi sınırlı.'});
  if(x.savingRate<0) items.push({p:1,icon:'🔴',title:'Nakit açığını kapat',text:`Bu ay giderler geliri ${money(Math.abs(x.saving))} aşıyor. Önce zorunlu olmayan harcamaları azalt.`});
  else if(x.savingRate<10) items.push({p:2,icon:'🟠',title:'Tasarruf oranını yükselt',text:`Tasarruf oranı %${x.savingRate.toFixed(1)}. İlk hedef olarak %10+ seviyesini dene.`});
  else items.push({p:4,icon:'🟢',title:'Tasarruf ritmi iyi',text:`Bu ay tasarruf oranı %${x.savingRate.toFixed(1)}.`});
  if(x.efMonths<3) items.push({p:1,icon:'🔴',title:'Acil durum fonunu güçlendir',text:`Mevcut fon yaklaşık ${x.efMonths.toFixed(1)} aylık bu ayki gideri karşılıyor. 3-6 ay bandına yaklaşmak öncelikli olabilir.`});
  else if(x.efMonths<6) items.push({p:2,icon:'🟠',title:'Acil fonu 6 aya yaklaştır',text:`Acil fon yaklaşık ${x.efMonths.toFixed(1)} aylık gider seviyesinde.`});
  else items.push({p:4,icon:'🟢',title:'Acil fon güçlü',text:`Acil fon yaklaşık ${x.efMonths.toFixed(1)} aylık gideri karşılıyor.`});
  if(x.debt>0) items.push({p:x.net<0?1:2,icon:x.net<0?'🔴':'🟠',title:'Borç planını takip et',text:`Toplam yükümlülük ${money(x.debt)}. 4.2 Borç Özgürlük Planındaki öncelik sırasını kullan.`});
  if(x.budgetLimit&&x.budgetUse>100) items.push({p:1,icon:'🔴',title:'Bütçe aşımı var',text:`Bu ay toplam harcama tanımlı bütçenin %${x.budgetUse.toFixed(0)} seviyesinde.`});
  if(x.subMonthly>0) items.push({p:3,icon:'🔵',title:'Abonelikleri gözden geçir',text:`Aktif aboneliklerin aylık eşdeğeri yaklaşık ${money(x.subMonthly)}.`});
  if(x.overdue.length) items.push({p:1,icon:'🔴',title:'Geciken ödemeleri kontrol et',text:`${x.overdue.length} gecikmiş yükümlülük görünüyor.`});
  if(x.net>0) items.push({p:4,icon:'🟢',title:'Net değer pozitif',text:`Net değer ${money(x.net)}. 4.5 ekranından gelişimini takip edebilirsin.`});
  return items.sort((a,b)=>a.p-b.p);
}
function renderAI48(){
  const el=document.getElementById('ai48Dashboard');if(!el)return;
  const x=aiMetrics48(),ins=aiInsights48(),top=ins.slice(0,5);
  fp48LastSummary=`FinPal 4.8 Finans Özeti\nGelir: ${money(x.income)}\nGider: ${money(x.expense)}\nTasarruf: ${money(x.saving)} (%${x.savingRate.toFixed(1)})\nNet değer: ${money(x.net)}\nBorç: ${money(x.debt)}\nAcil fon: ${x.efMonths.toFixed(1)} ay\n\nÖncelikler:\n`+top.map((i,n)=>`${n+1}. ${i.title}: ${i.text}`).join('\n');
  el.innerHTML=`<div class="kpi"><div>Bu Ay Tasarruf<b class="${x.saving>=0?'positive':'negative'}">${money(x.saving)}</b></div><div>Tasarruf Oranı<b>%${x.savingRate.toFixed(1)}</b></div><div>Acil Fon<b>${x.efMonths.toFixed(1)} ay</b></div></div>
  <h3 style="margin-top:14px">🎯 Öncelikli Aksiyonlar</h3>
  ${top.map((i,n)=>`<div class="row"><span><b>${n+1}. ${i.icon} ${i.title}</b><br><span class="muted">${i.text}</span></span></div>`).join('')||'<div class="empty">Analiz için yeterli veri yok.</div>'}
  <div class="muted" style="margin-top:10px">Analiz FinPal içindeki kayıtlarından yerel olarak üretilir; harici bir AI servisine veri göndermez.</div>`;
}
async function copyAI48(){
  renderAI48();
  try{await navigator.clipboard.writeText(fp48LastSummary);alert('FinPal finans özeti kopyalandı.')}
  catch(e){alert(fp48LastSummary)}
}
setTimeout(()=>{try{renderAI48()}catch(e){}},400);




/* FinPal 4.9 Pro — Stabilizasyon, performans ve mobil uyumluluk */
function sanitizeData49(x){
  if(!x||typeof x!=='object')return base();
  const arrays=['accounts','transactions','budgets','envelopes','categories','obligations','paymentPlans','plans','goals','subscriptions','shopping','assets','netWorthHistory'];
  arrays.forEach(k=>{if(!Array.isArray(x[k]))x[k]=[]});
  if(!x.security||typeof x.security!=='object')x.security={};
  if(!x.emergencyFund||typeof x.emergencyFund!=='object')x.emergencyFund={current:0,targetMonths:6};
  return x;
}
try{data=sanitizeData49(data)}catch(e){console.warn('FinPal veri doğrulama:',e)}

let fp49RenderQueued=false;
function renderSoon49(){
  if(fp49RenderQueued)return;
  fp49RenderQueued=true;
  requestAnimationFrame(()=>{
    fp49RenderQueued=false;
    try{render()}catch(e){
      console.error('FinPal render hatası:',e);
      const s=document.getElementById('proStatus');
      if(s)s.textContent='⚠️ Görünüm yenilenirken bir hata oluştu. Veriler korunuyor.';
    }
  });
}

save=function(){
  try{
    snapshotNetWorth45();
    data=sanitizeData49(data);
    localStorage.setItem(KEY,JSON.stringify(data));
  }catch(e){
    console.error('FinPal kayıt hatası:',e);
    if(e?.name==='QuotaExceededError') alert('FinPal depolama alanı doldu. Önce 4.6 bölümünden yedek alıp eski/gereksiz kayıtları azalt.');
    else alert('Veri kaydedilirken bir sorun oluştu. 4.6 bölümünden yedek alman önerilir.');
  }
  renderSoon49();
}

window.addEventListener('error',e=>{
  console.error('FinPal çalışma hatası:',e.error||e.message);
});
window.addEventListener('unhandledrejection',e=>{
  console.error('FinPal async hata:',e.reason);
});

let fp49ResizeTimer=0;
window.addEventListener('resize',()=>{
  clearTimeout(fp49ResizeTimer);
  fp49ResizeTimer=setTimeout(()=>{try{renderChart();renderAssets45();}catch(e){}},180);
},{passive:true});

document.addEventListener('touchstart',()=>{}, {passive:true});

setTimeout(()=>{
  try{
    buildManifest();
    renderSoon49();
  }catch(e){console.warn('FinPal 4.9 başlangıç kontrolü:',e)}
},500);




/* =========================================================
   FinPal 5.0 Final — Release doğrulama ve son stabilizasyon
   ========================================================= */
const FINPAL_RELEASE='5.0 Final';

function finalChecks50(){
  const checks=[];
  const add=(name,ok,detail='')=>checks.push({name,ok:!!ok,detail});
  try{
    add('Ana veri', !!data && typeof data==='object', 'finpalData');
    add('Hesaplar', Array.isArray(data.accounts), `${(data.accounts||[]).length} kayıt`);
    add('İşlemler', Array.isArray(data.transactions), `${(data.transactions||[]).length} kayıt`);
    add('Bütçeler', Array.isArray(data.budgets), `${(data.budgets||[]).length} kayıt`);
    add('Varlıklar', Array.isArray(data.assets), `${(data.assets||[]).length} kayıt`);
    add('Net değer geçmişi', Array.isArray(data.netWorthHistory), `${(data.netWorthHistory||[]).length} nokta`);
    add('Düzenli işlemler', Array.isArray(data.paymentPlans), `${(data.paymentPlans||[]).length} plan`);
    add('Güvenlik modeli', !!data.security && typeof data.security==='object',
        data.security?.pinEnabled ? 'PIN açık' : 'PIN kapalı');
    add('Yedekleme', typeof backup46==='function', 'FinPal 4.6 yedekleme altyapısı');
    add('Borç planı', typeof debtMetrics==='function', 'FinPal 4.2');
    add('Varlık analizi', typeof assetMetrics45==='function', 'FinPal 4.5');
    add('Akıllı analiz', typeof aiMetrics48==='function', 'FinPal 4.8');
    add('Mobil/PWA manifest', typeof buildManifest==='function', 'FinPal PWA');
    add('Yerel kayıt', typeof localStorage!=='undefined', KEY);
  }catch(e){
    checks.push({name:'Kontrol çalışması',ok:false,detail:e.message});
  }
  return checks;
}

function runFinalSelfCheck50(){
  const e=document.getElementById('final50Status');
  if(!e)return;
  const checks=finalChecks50(), passed=checks.filter(x=>x.ok).length;
  const all=passed===checks.length;
  e.innerHTML=`<div class="kpi">
    <div>Sürüm<b>${FINPAL_RELEASE}</b></div>
    <div>Kontrol<b>${passed}/${checks.length}</b></div>
    <div>Durum<b>${all?'🟢 Hazır':'🟠 Kontrol gerekli'}</b></div>
  </div>
  <div style="margin-top:10px">${checks.map(x=>`
    <div class="row">
      <span>${x.ok?'✅':'⚠️'} ${x.name}</span>
      <b>${x.detail|| (x.ok?'Hazır':'Sorun')}</b>
    </div>`).join('')}</div>
  <div class="muted" style="margin-top:10px">
    FinPal 5.0 verileri tarayıcıdaki localStorage içinde saklanır. Cihaz değişikliği veya tarayıcı temizliği öncesinde 4.6 yedekleme merkezinden dosya yedeği al.
  </div>`;
  return {passed,total:checks.length,all};
}

/* Bozuk/eksik veri ile açılmaya karşı final koruma */
try{
  data=sanitizeData49(data);
  snapshotNetWorth45();
  localStorage.setItem(KEY,JSON.stringify(data));
}catch(e){
  console.error('FinPal 5.0 başlangıç doğrulama hatası:',e);
}

setTimeout(()=>{
  try{runFinalSelfCheck50()}catch(e){console.warn('FinPal 5.0 self-check:',e)}
},650);



/* FinPal 5.3 — Güvenli Cihaz Aktarımı (yerel, üçüncü taraf bulut yok) */
const FP52_TRANSFER_FORMAT='FinPalSecureTransfer';
const FP52_LAST='finpal52LastTransfer';
function fp52Status(msg){const e=document.getElementById('deviceTransfer52Status');if(e)e.innerHTML=msg}
function fp52B64(u8){let s='';for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode(...u8.subarray(i,i+0x8000));return btoa(s)}
function fp52Unb64(s){const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u}
async function fp52Key(pass,salt){const enc=new TextEncoder();const base=await crypto.subtle.importKey('raw',enc.encode(pass),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function fp52Encrypt(payload,pass){const enc=new TextEncoder(),salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),key=await fp52Key(pass,salt);const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(JSON.stringify(payload))));return {format:FP52_TRANSFER_FORMAT,version:1,appVersion:APP_VERSION,createdAt:new Date().toISOString(),kdf:'PBKDF2-SHA256',iterations:310000,cipher:'AES-256-GCM',salt:fp52B64(salt),iv:fp52B64(iv),data:fp52B64(ct)}}
async function fp52Decrypt(obj,pass){const dec=new TextDecoder(),key=await fp52Key(pass,fp52Unb64(obj.salt));const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:fp52Unb64(obj.iv)},key,fp52Unb64(obj.data));return JSON.parse(dec.decode(pt))}
function fp52Download(obj,name){const blob=new Blob([JSON.stringify(obj)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
async function deviceTransferExport52(){if(!window.isSecureContext||!crypto?.subtle)return fp52Status('⚠️ Şifreli aktarım için FinPal HTTPS üzerinden açılmalı.');const pass=prompt('Aktarım dosyası için en az 8 karakterlik parola belirle:');if(!pass||pass.length<8)return fp52Status('⚠️ Aktarım iptal edildi. En az 8 karakterlik parola gerekli.');try{const payload=JSON.parse(JSON.stringify(data)),pack=await fp52Encrypt(payload,pass);fp52Download(pack,'FinPal_Cihaz_Aktarimi_'+new Date().toISOString().slice(0,10)+'.finpal');localStorage.setItem(FP52_LAST,JSON.stringify({type:'export',at:new Date().toISOString()}));fp52Status('✅ Şifreli aktarım dosyası hazır. Dosyayı diğer cihaza taşı ve aynı parolayla aç. Parola dosyanın içinde tutulmaz.')}catch(e){fp52Status('❌ Aktarım dosyası oluşturulamadı: '+esc(e.message||String(e)))}}
async function deviceTransferImport52(ev){const f=ev.target.files?.[0];if(!f)return;try{if(!window.isSecureContext||!crypto?.subtle)throw Error('Şifreli aktarım için HTTPS/WebCrypto gerekli.');const obj=JSON.parse(await f.text());if(obj?.format!==FP52_TRANSFER_FORMAT)throw Error('Bu dosya FinPal 5.3 güvenli cihaz aktarım dosyası değil.');const pass=prompt('Aktarım dosyasının parolasını gir:');if(!pass)return;const incoming=await fp52Decrypt(obj,pass);if(!incoming||!Array.isArray(incoming.accounts)||!Array.isArray(incoming.transactions))throw Error('Aktarım verisi geçersiz.');const tx=incoming.transactions.length,acc=incoming.accounts.length;if(!confirm(`Bu cihazdaki FinPal verileri aktarım dosyasıyla değiştirilecek.\n\nGelen veri: ${tx} işlem · ${acc} hesap\n\nDevam edilsin mi?`))return;createRecovery46(false);data=migrate(incoming);save();localStorage.setItem(FP52_LAST,JSON.stringify({type:'import',at:new Date().toISOString(),file:f.name}));fp52Status('✅ Cihaz aktarımı tamamlandı. Önceki yerel durum için kurtarma noktası oluşturuldu.');render()}catch(e){fp52Status('❌ Aktarım başarısız: parola yanlış, dosya bozuk veya uyumsuz.')}finally{ev.target.value=''}}
function renderDeviceTransfer52(){const e=document.getElementById('deviceTransfer52Status');if(!e)return;let x=null;try{x=JSON.parse(localStorage.getItem(FP52_LAST)||'null')}catch(_){};if(x?.at)e.textContent='Son cihaz aktarımı: '+new Date(x.at).toLocaleString('tr-TR')+' · '+(x.type==='import'?'İçe alındı':'Dışa aktarıldı');else e.textContent='Henüz cihaz aktarımı yapılmadı.'}
setTimeout(renderDeviceTransfer52,350);
