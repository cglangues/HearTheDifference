/* Same tab session as the reader; no passwords are saved. */
(() => {
 const URL='https://felvetvglybxooxtsmbv.supabase.co',KEY='sb_publishable_x7WfYJ6NSMoiDE09ajQ61w_BmeR9T-7',SESSION='cglangues.reader.auth.v1';
 const $=id=>document.getElementById(id);let session=null,refreshing=null,epoch=0;
 function save(s){const before=session?.user?.id;session=s;try{if(s)sessionStorage.setItem(SESSION,JSON.stringify(s));else sessionStorage.removeItem(SESSION);}catch{}$('accountStatus').textContent=s?'Connecté : '+s.user.email:'Connectez-vous pour retrouver vos écoutes.';$('openLogin').hidden=!!s;$('signOut').hidden=!s;if(before!==s?.user?.id)window.dispatchEvent(new Event('reader-auth'));}
 async function request(path,body,token){
  const r=await fetch(URL+'/auth/v1/'+path,{method:body?'POST':'GET',headers:{apikey:KEY,...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined,credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(15000)});
  const j=await r.json();if(!r.ok){const e=Error(r.status===429?'Trop de tentatives. Patientez.':'Connexion impossible. Vérifiez vos identifiants ou réessayez.');e.status=r.status;throw e;}return j;
 }
 function clean(s){if(!s?.access_token||!s.refresh_token||!s.user?.id)throw Error('Session invalide.');return {access_token:s.access_token,refresh_token:s.refresh_token,expires_at:s.expires_at||Date.now()/1000+(s.expires_in||3600),user:{id:s.user.id,email:s.user.email||''}};}
 async function token(force=false){
  if(!session)throw Error('Connectez-vous pour continuer.');if(!force&&session.expires_at>Date.now()/1000+60)return session.access_token;
  if(refreshing)return refreshing;const e=epoch;
  refreshing=(async()=>{try{const s=await request('token?grant_type=refresh_token',{refresh_token:session.refresh_token});if(e!==epoch)throw Error('Session fermée.');save(clean(s));return session.access_token;}catch(err){if(e===epoch&&[400,401,403].includes(err.status))save(null);throw err;}finally{refreshing=null;}})();return refreshing;
 }
 function login(){$('loginMessage').textContent='';$('loginDialog').showModal();$('loginEmail').focus();}
 window.CGAudioAuth={user:()=>session?.user,token,login};
 $('openLogin').onclick=login;$('cancelLogin').onclick=()=>$('loginDialog').close();
 $('loginDialog').addEventListener('close',()=>{epoch++;$('loginPassword').value='';});
 $('loginForm').onsubmit=async e=>{e.preventDefault();const n=++epoch;$('loginSubmit').disabled=true;$('loginMessage').textContent='Connexion en cours…';try{const s=await request('token?grant_type=password',{email:$('loginEmail').value.trim(),password:$('loginPassword').value});if(n!==epoch)return;save(clean(s));$('loginDialog').close();}catch(err){if(n===epoch)$('loginMessage').textContent=err.message;}finally{$('loginPassword').value='';$('loginSubmit').disabled=false;}};
 $('signOut').onclick=async()=>{const old=session?.access_token;epoch++;save(null);if(old){try{await fetch(URL+'/auth/v1/logout?scope=local',{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+old},signal:AbortSignal.timeout(10000)});}catch{}}};
 async function restore(){let stored;try{stored=JSON.parse(sessionStorage.getItem(SESSION)||'null');}catch{}const n=++epoch;save(null);if(stored){try{session=clean(stored);const t=await token(),u=await request('user',null,t);if(n!==epoch)return;const verified=clean({...session,user:u});session=null;save(verified);}catch{if(n===epoch)save(null);}}}
 window.addEventListener('pageshow',e=>{if(e.persisted)void restore();});
 window.CGAudioAuth.ready=restore();
})();
