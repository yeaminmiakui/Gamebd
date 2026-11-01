import {initializeApp} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {initializeAppCheck,ReCaptchaV3Provider} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app-check.js";
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendEmailVerification,sendPasswordResetEmail,signOut,GoogleAuthProvider,signInWithPopup,updatePassword,updateProfile} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import {getFirestore,collection,query,where,orderBy,limit,onSnapshot,doc,updateDoc,deleteDoc,getDocs,getDoc,setDoc,addDoc,writeBatch,serverTimestamp,increment} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

import { CFG } from "./config.js";

const $=s=>document.querySelector(s),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const BN={Home:"হোম",Tournament:"টুর্নামেন্ট","My Matches":"আমার ম্যাচ",Leaderboard:"লিডারবোর্ড",Profile:"প্রোফাইল",Wallet:"ওয়ালেট",Team:"টিম",Rewards:"রিওয়ার্ড",Support:"সাপোর্ট",Streaming:"লাইভ",Settings:"সেটিংস","Log in":"লগ ইন","Create account":"অ্যাকাউন্ট খুলুন",Email:"ইমেইল",Password:"পাসওয়ার্ড",Join:"যোগ দিন",Deposit:"ডিপোজিট",Withdraw:"উইথড্র","Log out":"লগ আউট",Available:"ব্যালেন্স",Upcoming:"আসন্ন",Ongoing:"চলমান",Completed:"সমাপ্ত",Cancelled:"বাতিল",Free:"ফ্রি",Save:"সেভ করুন",Retry:"আবার চেষ্টা",Notifications:"নোটিফিকেশন",Winners:"বিজয়ী","Full name":"পুরো নাম",Username:"ইউজারনেম","Entry fee":"এন্ট্রি ফি","Prize pool":"প্রাইজ পুল",Slots:"স্লট",Back:"পেছনে"};
let lang=localStorage.lang||"en";const t=s=>lang==="bn"&&BN[s]||s;
document.documentElement.dataset.t=localStorage.th||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");
const bdt=p=>"৳"+(Number(p||0)/100).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const toP=s=>{const m=/^(\d{1,5})(?:\.(\d{1,2}))?$/.exec(String(s).trim());return m?+m[1]*100+ +((m[2]||"").padEnd(2,"0")):null};
const ms=v=>v?.toMillis?v.toMillis():v?new Date(v).getTime():0;
const dt=v=>ms(v)?new Date(ms(v)).toLocaleString("en-GB",{timeZone:"Asia/Dhaka",dateStyle:"medium",timeStyle:"short"}):"—";
const cd=v=>{let d=ms(v)-Date.now();if(d<=0)return"Started";const s=d/1e3|0;return(s/86400|0)+"d "+(s%86400/3600|0)+"h "+(s%3600/60|0)+"m "+s%60+"s"};
const em=(b,d="")=>`<div class="card em"><i>🎮</i><b>${esc(b)}</b>${esc(d)}</div>`;
const toast=(m,e)=>{const x=$("#toast");x.textContent=m;x.className="on"+(e?" er":"");setTimeout(()=>x.className="",3200)};
const MODES=["BR Solo","BR Duo","BR Squad","BR Survival","CS 1v1","CS 2v2","CS 4v4","Lone Wolf","Championship","Grand Final","Special Event"];
const S={tab:"home",sub:null,ready:false,tours:[],regs:[],notes:[],ann:[],streams:[],tx:[],teams:[],invs:[],tickets:[],wins:[],boards:{},cat:"weekly",tl:20,f:{q:"",mode:"",entry:"",status:"",date:"",sort:"time"},wtab:"dep",htab:"",mode:"login",settings:{}};
let app,auth,db,fns,sto,subs=[],lastUid=null;

const ok=CFG.firebase.apiKey&&CFG.firebase.projectId;
if(ok){app=initializeApp(CFG.firebase);if(CFG.appCheckKey)initializeAppCheck(app,{provider:new ReCaptchaV3Provider(CFG.appCheckKey),isTokenAutoRefreshEnabled:true});
auth=getAuth(app);db=getFirestore(app)}

/* ===== data subscriptions ===== */
const on=(q,fn)=>subs.push(onSnapshot(q,s=>{fn(s);draw()},e=>toast(e.code,1)));
const arr=s=>s.docs.map(d=>({id:d.id,...d.data()}));
function subT(){subs.filter(x=>x.t).forEach(x=>x());subs=subs.filter(x=>!x.t);const u=subs.push(onSnapshot(query(collection(db,"tournaments"),orderBy("startAt","asc"),limit(S.tl)),s=>{S.tours=arr(s);S.tloaded=1;draw()},e=>toast(e.code,1)));subs[u-1].t=1}
function start(uid){const U=where("userId","==",uid);
on(doc(db,"users",uid),s=>{S.profile=s.exists()?s.data():null;S.ready=true});
on(query(collection(db,"registrations"),U),s=>S.regs=arr(s));
on(query(collection(db,"notifications"),U),s=>S.notes=arr(s).sort((a,b)=>ms(b.createdAt)-ms(a.createdAt)));
on(query(collection(db,"supportTickets"),U),s=>S.tickets=arr(s).sort((a,b)=>ms(b.createdAt)-ms(a.createdAt)));
on(query(collection(db,"announcements"),orderBy("createdAt","desc"),limit(5)),s=>S.ann=arr(s));
on(query(collection(db,"liveStreams"),orderBy("startAt","desc"),limit(10)),s=>S.streams=arr(s));
on(query(collection(db,"winnerHistory"),orderBy("date","desc"),limit(20)),s=>S.wins=arr(s));
on(doc(db,"appSettings","public"),s=>S.settings=s.data()||{});
subT();subB();}
function subB(){const c=S.cat;if(S.boards[c]?.u)return;S.boards[c]={u:1,e:[]};subs.push(onSnapshot(doc(db,"leaderboards",c),s=>{S.boards[c]={u:1,e:s.data()?.entries||[]};draw()},e=>toast(e.code,1)))}
function stop(){subs.forEach(x=>x());subs=[];Object.assign(S,{tloaded:false,ready:false,profile:null,wallet:null,boards:{},tours:[],regs:[],notes:[],tx:[],teams:[],invs:[],tickets:[]})}
if(ok)onAuthStateChanged(auth,u=>{S.user=u;stop();if(u){lastUid=u.uid;start(u.uid)}else S.ready=true;draw()});

/* ===== views ===== */
const chip=(a,v,l,on)=>`<button class="chip${on?" on":""}" data-a="${a}" data-v="${v}">${esc(l)}</button>`;
const stc=s=>({approved:"ok",completed:"ok",open:"ok",live:"live",rejected:"er",cancelled:"er",failed:"er"}[s]||"");
const stat=s=>`<span class="st ${stc(s)}">${esc(s||"—")}</span>`;
const fee=x=>x.entryFeePoisha>0?bdt(x.entryFeePoisha):t("Free");
const lock=s=>S.settings[s]===true;

function authV(){const r=S.mode==="register";return`<main class="sc"><div class="hero"><h1>TCE FF</h1><small>PLAY • COMPETE • WIN 🇧🇩</small></div>
<form class="card" data-f="auth">${r?`<label>${t("Full name")}</label><input name="name" required autocomplete="name"><label>${t("Username")}</label><input name="user" required pattern="[A-Za-z0-9_]{3,20}">`:""}
<label>${t("Email")}</label><input name="email" type="email" required autocomplete="email"><label>${t("Password")}</label><input name="pw" type="password" minlength="8" required autocomplete="${r?"new-password":"current-password"}">
${r?`<label>Confirm password</label><input name="pw2" type="password" required><label><input name="terms" type="checkbox" style="width:auto"> I accept the Terms &amp; Conditions</label>`:""}
<button class="btn">${r?t("Create account"):t("Log in")}</button></form>
<button class="btn ghost" data-a="google">Google</button>
<div class="row"><button class="chip" data-a="mode">${r?t("Log in"):t("Create account")}</button>${r?"":`<button class="chip" data-a="forgot">Forgot password?</button>`}<button class="chip" data-a="lang">${lang==="en"?"বাংলা":"English"}</button></div></main>`}
const completeV=()=>`<main class="sc"><div class="hero"><h1>Finish your profile</h1></div><form class="card" data-f="complete"><label>${t("Full name")}</label><input name="name" required value="${esc(S.user.displayName||"")}"><label>${t("Username")}</label><input name="user" required pattern="[A-Za-z0-9_]{3,20}"><button class="btn">${t("Save")}</button></form><button class="btn ghost" data-a="out">${t("Log out")}</button></main>`;

const tcard=x=>{const j=x.joinedCount||0,n=x.totalSlots||0,reg=S.regs.some(r=>r.tournamentId===x.id&&r.status!=="cancelled");
const can=x.status==="open"&&j<n&&!reg&&(!x.registerUntil||ms(x.registerUntil)>Date.now())&&(x.entryFeePoisha>0?false:(x.teamSize||1)===1);
return`<div class="card" data-a="tour" data-v="${x.id}"><div class="ban" style="${x.bannerUrl?`background-image:url('${esc(x.bannerUrl)}')`:""}">${esc(x.name)}</div>
<div class="row wrap"><b>${esc(x.mode)}</b>${stat(x.status)}</div><div class="mu">${esc(x.map||"")} • ${dt(x.startAt)}</div>
<div class="row"><span>${t("Entry fee")}: <b>${fee(x)}</b></span><span>${t("Prize pool")}: <b>${bdt(x.prizePoolPoisha)}</b></span></div>
<div class="bar"><i style="width:${n?Math.min(100,j/n*100):0}%"></i></div><div class="row"><span class="mu">${t("Slots")}: ${j}/${n} (${Math.max(0,n-j)} left)</span><span class="mu" data-cd="${ms(x.startAt)}">${cd(x.startAt)}</span></div>
<button class="btn" data-a="join" data-v="${x.id}" ${can?"":"disabled"}>${reg?"Joined":t("Join")}</button></div>`};

function tlistH(){if(!S.tloaded)return`<div class="sk"></div><div class="sk"></div>`;const f=S.f,d=f.date;let l=S.tours.filter(x=>(!f.q||x.name?.toLowerCase().includes(f.q.toLowerCase()))&&(!f.mode||x.mode===f.mode)&&(!f.status||x.status===f.status)&&(!f.entry||(f.entry==="free")===!(x.entryFeePoisha>0))&&(!d||new Date(ms(x.startAt)).toLocaleDateString("en-CA",{timeZone:"Asia/Dhaka"})===d));
l.sort((a,b)=>f.sort==="slots"?(b.totalSlots-b.joinedCount)-(a.totalSlots-a.joinedCount):ms(a.startAt)-ms(b.startAt));
return(l.length?l.map(tcard).join(""):em("No tournaments yet","Published tournaments appear here."))+(S.tours.length>=S.tl?`<button class="btn ghost" data-a="more">Load more</button>`:"")}
const tourV=()=>`<h2>${t("Tournament")}</h2><div class="card"><input id="fq" data-f2="q" placeholder="Search" value="${esc(S.f.q)}">
<div class="row g"><select data-f2="mode"><option value="">All modes</option>${MODES.map(m=>`<option ${S.f.mode===m?"selected":""}>${m}</option>`).join("")}</select>
<select data-f2="status"><option value="">Any status</option>${["upcoming","open","live","completed","cancelled"].map(m=>`<option ${S.f.status===m?"selected":""}>${m}</option>`).join("")}</select></div>
<div class="row g"><select data-f2="entry"><option value="">Free + paid</option><option value="free" ${S.f.entry==="free"?"selected":""}>Free</option><option value="paid" ${S.f.entry==="paid"?"selected":""}>Paid</option></select>
<input type="date" data-f2="date" value="${S.f.date}"><select data-f2="sort"><option value="time">Soonest</option><option value="slots" ${S.f.sort==="slots"?"selected":""}>Most slots</option></select></div></div><div id="tl">${tlistH()}</div>`;

function detailV(id){const x=S.tours.find(a=>a.id===id);if(!x)return em("Not found");
return`<div class="ban" style="${x.bannerUrl?`background-image:url('${esc(x.bannerUrl)}')`:""}">${esc(x.name)}</div><div class="card"><b>${esc(x.mode)}</b> ${stat(x.status)}<p class="mu">${esc(x.map||"")} • ${dt(x.startAt)} • Register until ${dt(x.registerUntil)}</p>
<p>${t("Entry fee")}: <b>${fee(x)}</b> • ${t("Prize pool")}: <b>${bdt(x.prizePoolPoisha)}</b></p><p class="mu">Eligibility: ${esc(x.eligibility||"—")}</p></div>
<div class="card"><b>Prize distribution</b>${(x.prizes||[]).map(p=>`<div class="row"><span>#${p.place}</span><b>${bdt(p.amountPoisha)}</b></div>`).join("")||`<p class="mu">Not published</p>`}</div>
<div class="card"><b>Rules</b><p class="mu">${esc([].concat(x.rules||"—").join("\n")).replace(/\n/g,"<br>")}</p></div>
${x.teamSize>1?em("Team entry is not available yet","Only solo tournaments can be joined for now."):""}
<button class="btn" data-a="join" data-v="${x.id}">${t("Join")}</button><div class="card" id="parts"><b>Participants</b><p class="mu">Loading…</p></div>`}

function matchesV(){const mine=S.regs.map(r=>({r,x:S.tours.find(a=>a.id===r.tournamentId)})).filter(a=>a.x);
const G={Upcoming:a=>["upcoming","open"].includes(a.x.status),Ongoing:a=>a.x.status==="live",Completed:a=>a.x.status==="completed",Cancelled:a=>a.x.status==="cancelled"};
return`<h2>${t("My Matches")}</h2>`+Object.keys(G).map(k=>{const l=mine.filter(G[k]);return`<h3>${t(k)}</h3>`+(l.length?l.map(({r,x})=>`<div class="card"><div class="row"><b>${esc(x.name)}</b>${stat(x.status)}</div><div class="mu">${dt(x.startAt)} • <span data-cd="${ms(x.startAt)}">${cd(x.startAt)}</span></div>
<div class="mu">Registered ${dt(r.createdAt)} • Points ${r.points??"—"} • Prize ${esc(r.prizeStatus||"—")}</div>
<div class="row g"><button class="btn sm" data-a="room" data-v="${x.id}">Room</button>${k==="Ongoing"||k==="Completed"?`<button class="btn sm ghost" data-a="res" data-v="${x.id}">Submit result</button>`:""}</div></div>`).join(""):em("No matches yet","Join a tournament to see it here."))}).join("")}

function boardV(){const C=["daily","weekly","monthly","allTime","kills","wins","teams","season"],b=S.boards[S.cat]?.e||[],me=S.user.uid;
return`<h2>${t("Leaderboard")}</h2><div class="chips">${C.map(c=>chip("cat",c,c,S.cat===c)).join("")}</div>`+(b.length?b.map((e,i)=>`<div class="card row" style="${e.uid===me?"border-color:var(--g)":""}"><span><b>#${i+1}</b> ${esc(e.username||e.name)}</span><span class="mu">${e.points??0} pts • ${e.wins??0}W • ${e.kills??0}K</span></div>`).join(""):em("No rankings yet","Rankings appear after verified results."))}

function profileV(){const p=S.profile,s=p.stats||{},m=s.matches||0;
return`<div class="card ${p.vip?"vip":""}"><div class="row"><div class="av" style="${p.avatarUrl?`background-image:url('${esc(p.avatarUrl)}')`:""}">${p.avatarUrl?"":esc(p.fullName[0])}</div><div style="flex:1;margin-left:10px"><b>${esc(p.fullName)}</b> ${p.vip?'<span class="vipb">VIP</span>':""}<div class="mu">@${esc(p.username)} • TCE-${esc(S.user.uid.slice(0,8).toUpperCase())}</div><div class="mu">FF UID ${esc(p.ffUid||"—")} • IGN ${esc(p.ign||"—")}</div><div class="mu">Joined ${dt(p.createdAt)} • Level ${p.level||1} • ${esc(p.rank||"Beginner")}</div></div></div></div>
<div class="grid"><div class="card em"><b>${m}</b>Matches</div><div class="card em"><b>${s.wins||0}</b>Wins</div><div class="card em"><b>${s.kills||0}</b>Kills</div><div class="card em"><b>${m?Math.round((s.wins||0)/m*100):0}%</b>Win rate</div><div class="card em"><b>${s.points||0}</b>Points</div></div>
<div class="card"><b>Achievements</b><div>${(p.achievements||[]).map(a=>`<span class="st">${esc(a)}</span> `).join("")||`<span class="mu">None yet</span>`}</div></div>
<form class="card" data-f="edit"><label>Free Fire UID</label><input name="ffUid" inputmode="numeric" pattern="\\d{6,15}" value="${esc(p.ffUid||"")}"><label>IGN</label><input name="ign" maxlength="30" value="${esc(p.ign||"")}"><button class="btn">${t("Save")}</button></form>`+more()}
const more=()=>`<div class="grid">${[["wallet","Wallet"],["support","Support"],["stream","Streaming"],["wins","Winners"],["notes","Notifications"],["report","Report"],["settings","Settings"]].map(([k,l])=>`<button data-a="go" data-v="${k}">${t(l)}${k==="notes"&&S.notes.some(n=>!n.read)?" ●":""}</button>`).join("")}</div>`;

function homeV(){const p=S.profile,w=S.wallet,by=s=>S.tours.filter(x=>s.includes(x.status)),top=(S.boards.weekly?.e||[]).slice(0,3),B=S.settings.banners||[];
const list=(h,l)=>`<h3>${h}</h3>`+(!S.tloaded?`<div class="sk"></div>`:l.length?l.slice(0,3).map(tcard).join(""):em("Nothing here yet"));
return`<div class="hero"><div class="row"><div><small>Welcome</small><h1>${esc(p.fullName)}</h1></div><button class="chip" data-a="go" data-v="notes">🔔 ${S.notes.filter(n=>!n.read).length}</button></div>
<p style="margin-top:6px;opacity:.9">Free-entry tournaments • prizes are sent by the organizer</p></div>
${B.length?`<div class="chips bn">${B.map(b=>`<div class="ban" style="min-width:80%;background-image:url('${esc(b.imageUrl)}')">${esc(b.title||"")}</div>`).join("")}</div>`:""}
${S.ann.map(a=>`<div class="card"><b>📢 ${esc(a.title)}</b><p class="mu">${esc(a.body||"")}</p></div>`).join("")}
<div class="chips">${MODES.slice(0,7).map(m=>chip("qm",m,m)).join("")}</div>
${list("Live",by(["live"]))}${list(t("Upcoming"),by(["upcoming","open"]))}${list(t("Completed"),by(["completed"]).reverse())}
<h3>Top 3 this week</h3>${top.length?top.map((e,i)=>`<div class="card row"><b>#${i+1} ${esc(e.username)}</b><span class="mu">${e.points} pts</span></div>`).join(""):em("No rankings yet")}${more()}`}

function walletV(){return`<h2>${t("Wallet")}</h2>${em("Wallet is not available","Entry is free and prizes are sent by the organizer. Deposits and withdrawals are not enabled.")}`}
function supportV(){return`<h2>${t("Support")}</h2><form class="card" data-f="ticket"><label>Type</label><select name="type"><option>Tournament complaint</option><option>Account issue</option><option>Payment issue</option></select><label>Subject</label><input name="sub" required maxlength="80"><label>Message</label><textarea name="msg" rows="4" required maxlength="1000"></textarea><label>Transaction ID (payment issues)</label><input name="trx" maxlength="30"><label>Screenshot link (optional)</label><input name="link" type="url" placeholder="https://"><button class="btn">Submit ticket</button><p class="mu">To delete your account, send an Account issue ticket.</p></form><div class="row g"><a class="btn ghost" style="text-align:center;text-decoration:none" href="${esc(S.settings.faqUrl||"#")}" target="_blank">FAQ</a><a class="btn ghost" style="text-align:center;text-decoration:none" href="${esc(S.settings.termsUrl||"#")}" target="_blank">Terms</a><a class="btn ghost" style="text-align:center;text-decoration:none" href="${esc(S.settings.privacyUrl||"#")}" target="_blank">Privacy</a></div><h3>Tickets</h3>`+(S.tickets.length?S.tickets.map(x=>`<div class="card row"><span>${esc(x.subject)}<div class="mu">${dt(x.createdAt)}</div></span>${stat(x.status)}</div>`).join(""):em("No tickets yet"))}
const reportV=()=>`<h2>Report / Fair play</h2><form class="card" data-f="report"><label>Type</label><select name="type"><option value="cheating">Cheating</option><option value="suspicious">Suspicious player</option><option value="wrong_result">Incorrect result</option></select><label>Player ID or username</label><input name="who" maxlength="40"><label>Details</label><textarea name="msg" rows="4" required maxlength="1000"></textarea><label>Evidence link (video or screenshot)</label><input name="link" type="url" placeholder="https://"><button class="btn">Submit report</button><p class="mu">Reports are reviewed by staff. No automatic bans.</p></form>`;

const ALLOW=/^https:\/\/(www\.youtube\.com\/embed\/|www\.facebook\.com\/plugins\/)/;
const streamV=()=>`<h2>${t("Streaming")}</h2>`+(S.streams.length?S.streams.map(x=>`<div class="card"><div class="row"><b>${esc(x.title)}</b>${stat(x.status)}</div><p class="mu">${dt(x.startAt)}</p>${ALLOW.test(x.embedUrl||"")?`<iframe src="${esc(x.embedUrl)}" allowfullscreen allow="fullscreen"></iframe>`:""}</div>`).join(""):em("No streams yet","Live matches appear here."));
const winsV=()=>`<h2>${t("Winners")}</h2>`+(S.wins.length?S.wins.map(w=>`<div class="card"><b>${esc(w.tournamentName)}</b> <span class="mu">${dt(w.date)}</span><p>🏆 ${esc(w.winnerName)} ${w.team?`(${esc(w.team)})`:""} • #${w.placement||1} • ${w.kills||0} kills • ${w.score||0} pts</p><p class="mu">Prize ${bdt(w.prizePoisha)}</p></div>`).join(""):em("No verified winners yet"));
const notesV=()=>`<h2>${t("Notifications")}</h2>`+(S.notes.length?S.notes.map(n=>`<div class="card" style="${n.read?"":"border-color:var(--g)"}"><b>${esc(n.title)}</b><p class="mu">${esc(n.body||"")}</p><div class="row"><span class="mu">${dt(n.createdAt)}</span><span>${n.read?"":`<button class="btn sm ghost" data-a="read" data-v="${n.id}">Mark read</button> `}<button class="btn sm ghost" data-a="dn" data-v="${n.id}">Delete</button></span></div></div>`).join(""):em("No notifications"));
function setV(){const p=S.profile,np=p.notificationPrefs||{};return`<h2>${t("Settings")}</h2><div class="card"><div class="row g"><button class="btn ghost" data-a="lang">${lang==="en"?"বাংলা":"English"}</button><button class="btn ghost" data-a="theme">Dark / Light</button></div>
<label><input type="checkbox" data-a="np" data-v="tournaments" ${np.tournaments!==false?"checked":""} style="width:auto"> Tournament alerts</label><label><input type="checkbox" data-a="np" data-v="wallet" ${np.wallet!==false?"checked":""} style="width:auto"> Wallet alerts</label><label><input type="checkbox" data-a="pv" ${p.privacy?.hideStats?"checked":""} style="width:auto"> Hide my stats from others</label></div>
<form class="card" data-f="pw"><label>New password</label><input name="pw" type="password" minlength="8" required><button class="btn">Change password</button></form>
<div class="card"><p class="mu">TCE FF Esports v${CFG.version} • Bangladesh 🇧🇩</p><button class="btn" data-a="out">${t("Log out")}</button><p class="mu" style="margin-top:8px">To delete your account, send an Account issue ticket in Support.</p></div>`}

const IC={"home": "<path d=\"M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z\"/>", "tour": "<path d=\"M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3\"/>", "matches": "<circle cx=\"12\" cy=\"12\" r=\"8\"/><path d=\"M12 2v4M12 18v4M2 12h4M18 12h4\"/>", "board": "<path d=\"M5 21V10M12 21V4M19 21v-8\"/>", "me": "<circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4 21a8 8 0 0 1 16 0\"/>"},ic=k=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg>`;
const SUB={wallet:walletV,support:supportV,stream:streamV,wins:winsV,notes:notesV,report:reportV,settings:setV};
function draw(){if(!ok)return $("#app").innerHTML=`<main class="sc">${em("Firebase is not configured","Fill the CFG block at the top of this file.")}</main>`;
if(document.activeElement?.closest?.("form")){S.dirty=1;return}
let h;if(!S.ready)h=`<div class="sp"><div class="lg"><i></i><h1>TCE FF</h1></div><p>PLAY • COMPETE • WIN</p><div class="ld"><b></b></div></div>`;
else if(!S.user)h=authV();else if(!S.profile)h=completeV();else{
const sub=S.sub,body=sub?(sub.startsWith("tour:")?detailV(sub.slice(5)):(SUB[sub]||homeV)()):({home:homeV,tour:tourV,matches:matchesV,board:boardV,me:profileV}[S.tab])();
h=`${navigator.onLine?"":`<div class="off">Offline — showing cached data</div>`}<main class="sc${S.anim?" pg":""}">${sub?`<button class="chip" data-a="back">← ${t("Back")}</button>`:""}${body}</main><nav>${[["home","Home"],["tour","Tournament"],["matches","My Matches"],["board","Leaderboard"],["me","Profile"]].map(([k,l])=>`<button data-a="tab" data-v="${k}" class="${!sub&&S.tab===k?"on":""}">${ic(k)}<span>${t(l)}</span></button>`).join("")}</nav>`}
$("#app").innerHTML=h;S.anim=0}
setInterval(()=>{const b=document.querySelector(".bn");if(b&&!document.hidden){const w=b.clientWidth*.8;b.scrollBy({left:b.scrollLeft+w>=b.scrollWidth-b.clientWidth-4?-b.scrollLeft:w,behavior:"smooth"})}},4500);
setInterval(()=>document.querySelectorAll("[data-cd]").forEach(e=>e.textContent=cd(+e.dataset.cd)),1000);
addEventListener("online",draw);addEventListener("offline",draw);
document.addEventListener("focusout",()=>setTimeout(()=>{if(S.dirty&&!document.activeElement?.closest?.("form")){S.dirty=0;draw()}},80));

/* ===== actions ===== */
const modal=h=>{const m=document.createElement("div");m.className="mo";m.innerHTML=`<div class="card">${h}<button class="btn ghost" data-a="close">Close</button></div>`;document.body.append(m)};
const cp=s=>navigator.clipboard?.writeText(s).then(()=>toast("Copied"));
const A={
tab:v=>{S.tab=v;S.sub=null;S.anim=1;draw()},go:(v,e)=>{S.sub=v;if(e.dataset.w)S.wtab=e.dataset.w;S.anim=1;draw()},back:()=>{S.sub=null;S.anim=1;draw()},close:(v,e)=>e.closest(".mo").remove(),
mode:()=>{S.mode=S.mode==="login"?"register":"login";draw()},lang:()=>{lang=lang==="en"?"bn":"en";localStorage.lang=lang;draw()},theme:()=>{const d=document.documentElement;d.dataset.t=d.dataset.t==="dark"?"light":"dark";localStorage.th=d.dataset.t},
out:()=>signOut(auth),forgot:async()=>{const m=prompt("Email");if(m)try{await sendPasswordResetEmail(auth,m);toast("Reset email sent")}catch(e){toast(e.code,1)}},
google:async()=>{try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){toast(e.code+" (Google needs a native plugin inside the APK)",1)}},
cat:v=>{S.cat=v;subB();draw()},qm:v=>{S.tab="tour";S.f.mode=v;draw()},more:()=>{S.tl+=20;subT()},wt:v=>{S.wtab=v;draw()},ht:v=>{S.htab=v;draw()},
tour:async(v,e)=>{if(e.closest("button")&&e.closest("button")!==e)return;S.sub="tour:"+v;S.anim=1;draw();try{const s=await getDocs(query(collection(db,"tournaments",v,"participants"),limit(50)));$("#parts").innerHTML="<b>Participants</b>"+(s.empty?`<p class="mu">None yet</p>`:s.docs.map(d=>`<div class="mu">${esc(d.data().username||d.data().ign)}</div>`).join(""))}catch{$("#parts").innerHTML="<b>Participants</b><p class=mu>Unavailable</p>"}},
join:async(v,e)=>{e.disabled=true;try{const uid=S.user.uid;if(!/^\d{6,15}$/.test(S.profile.ffUid||""))throw Error("Add your Free Fire UID in Profile first");
const b=writeBatch(db);b.set(doc(db,"registrations",v+"_"+uid),{userId:uid,tournamentId:v,status:"registered",createdAt:serverTimestamp()});
b.update(doc(db,"tournaments",v),{joinedCount:increment(1)});b.set(doc(db,"tournaments",v,"participants",uid),{uid,username:S.profile.username,ffUid:S.profile.ffUid});
await b.commit();toast("Registered")}catch(x){toast(x.code==="permission-denied"?"Cannot join: closed, full, deadline passed or already joined":x.message,1)}e.disabled=false},
room:async v=>{try{const r=(await getDoc(doc(db,"matchRooms",v))).data();modal(`<b>Room</b><p>ID: <b>${esc(r.roomId)}</b> <button class="btn sm" data-a="cp" data-v="${esc(r.roomId)}">Copy</button></p><p>Password: <b>${esc(r.password)}</b> <button class="btn sm" data-a="cp" data-v="${esc(r.password)}">Copy</button></p>`)}catch{toast("Room is not released yet, or you are not registered",1)}},cp:v=>cp(v),
res:v=>modal(`<form data-f="result" data-tid="${v}"><b>Submit result</b><label>Kills</label><input name="k" type="number" min="0" max="99" required><label>Placement</label><input name="pl" type="number" min="1" max="60" required><label>Screenshot link (https)</label><input name="link" type="url" required placeholder="https://"><button class="btn">Submit</button></form>`),
read:v=>updateDoc(doc(db,"notifications",v),{read:true}),dn:v=>deleteDoc(doc(db,"notifications",v)),
np:(v,e)=>updateDoc(doc(db,"users",S.user.uid),{notificationPrefs:{...(S.profile.notificationPrefs||{}),[v]:e.checked}}),pv:(v,e)=>updateDoc(doc(db,"users",S.user.uid),{privacy:{hideStats:e.checked}})};
document.addEventListener("click",e=>{const el=e.target.closest("[data-a]");if(!el||el.tagName==="INPUT")return;if(el.dataset.a==="tour"&&e.target.closest("button"))return;A[el.dataset.a]?.(el.dataset.v,el)});
document.addEventListener("change",e=>{const el=e.target;if(el.dataset.a&&el.tagName==="INPUT")return A[el.dataset.a](el.dataset.v,el);if(el.dataset.f2){S.f[el.dataset.f2]=el.value;$("#tl").innerHTML=tlistH()}});
document.addEventListener("input",e=>{if(e.target.dataset.f2==="q"){S.f.q=e.target.value;$("#tl").innerHTML=tlistH()}});

async function makeProfile(uid,name,uname){const b=writeBatch(db),k=uname.toLowerCase();b.set(doc(db,"usernames",k),{uid});
b.set(doc(db,"users",uid),{fullName:name,username:uname,usernameLower:k,role:"player",vip:false,stats:{matches:0,wins:0,kills:0,points:0},language:"en",createdAt:serverTimestamp()});await b.commit()}
const url=v=>{v=(v||"").trim();if(v&&!/^https:\/\/.{3,290}$/.test(v))throw Error("Link must start with https://");return v};
const F={
auth:async d=>{if(S.mode==="login")return signInWithEmailAndPassword(auth,d.email.trim(),d.pw);
if(!/^[A-Za-z0-9_]{3,20}$/.test(d.user))throw Error("Username: 3-20 letters, numbers, _");if(d.pw!==d.pw2)throw Error("Passwords do not match");if(!d.terms)throw Error("Accept the Terms");
const c=await createUserWithEmailAndPassword(auth,d.email.trim(),d.pw);try{await makeProfile(c.user.uid,d.name.trim(),d.user);await sendEmailVerification(c.user);toast("Verification email sent")}catch(e){await c.user.delete().catch(()=>{});throw Error(e.code==="permission-denied"?"Username is taken or invalid":e.message)}},
complete:async d=>{try{await makeProfile(S.user.uid,d.name.trim(),d.user)}catch(e){throw Error(e.code==="permission-denied"?"Username is taken or invalid":e.message)}},
edit:async d=>{const o={};if(d.ffUid){if(!/^\d{6,15}$/.test(d.ffUid))throw Error("Invalid Free Fire UID");o.ffUid=d.ffUid}o.ign=(d.ign||"").trim();await updateDoc(doc(db,"users",S.user.uid),o);toast("Saved")},
result:async(d,f)=>{try{await setDoc(doc(db,"resultSubmissions",f.dataset.tid+"_"+S.user.uid),{userId:S.user.uid,tournamentId:f.dataset.tid,kills:+d.k,placement:+d.pl,evidenceUrl:url(d.link),status:"pending",createdAt:serverTimestamp()})}catch(e){throw Error(e.code==="permission-denied"?"Already submitted, or results are not open for this match":e.message)}f.closest(".mo").remove();toast("Submitted for review")},
ticket:async d=>{if(d.type==="Payment issue"&&!d.trx.trim())throw Error("Add the transaction ID");const o={userId:S.user.uid,type:d.type,subject:d.sub.trim(),message:d.msg.trim(),status:"open",createdAt:serverTimestamp()};if(d.trx.trim())o.transactionId=d.trx.trim();if(url(d.link))o.evidenceUrl=url(d.link);await addDoc(collection(db,"supportTickets"),o);toast("Ticket submitted")},
report:async d=>{const o={userId:S.user.uid,type:d.type,details:d.msg.trim(),status:"open",createdAt:serverTimestamp()};if((d.who||"").trim())o.target=d.who.trim();if(url(d.link))o.evidenceUrl=url(d.link);await addDoc(collection(db,"playerReports"),o);toast("Report submitted")},
pw:async d=>{await updatePassword(auth.currentUser,d.pw);toast("Password changed")}};
document.addEventListener("submit",async e=>{const f=e.target;if(!f.dataset.f)return;e.preventDefault();const b=f.querySelector(".btn");b.disabled=true;
try{await F[f.dataset.f](Object.fromEntries(new FormData(f)),f);if(f.dataset.f!=="result")f.reset?.()}catch(x){toast(x.message||x.code,1)}b.disabled=false;S.dirty&&draw()});
draw();
