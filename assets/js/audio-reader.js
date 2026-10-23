(() => {
 'use strict';
 const $=id=>document.getElementById(id),auth=window.CGAudioAuth,{api,hash,clearPlayer}=window.CGAudio;
 let serial=0,row=null,limits=null,poll=null,controller=null,fingerprint='',busy=false;
 let cloudId=new URLSearchParams(location.search).get('audio'),cloudOwner=null;
 const player=$('readerAudioPlayer');
 const current=()=>window.CGReaderAudio.current();
 const message=s=>{$('readerAudioStatus').textContent=s;};
 function reset(){serial++;clearTimeout(poll);controller?.abort();row=null;busy=false;clearPlayer(player);player.hidden=true;$('readerAudioSpeedLabel').hidden=true;}
 function paint(){
  const text=current(),n=[...(text?.body||'').normalize('NFC').trim()].length;
  const button=$('generateAudio');button.hidden=false;button.disabled=busy||!text?.body;
  $('audioAllowance').textContent=limits?`Jusqu’à ${limits.maxTextCharacters.toLocaleString('fr-FR')} caractères par texte · ${Math.max(0,limits.monthlyCharacters-limits.usedCharacters).toLocaleString('fr-FR')} caractères de génération restants ce mois-ci.`:'';
  if(!auth.user()){button.textContent='Se connecter pour écouter';message('Connectez-vous pour créer et retrouver vos enregistrements.');return;}
  if(row?.status==='ready'){button.hidden=true;message('Audio enregistré dans Mes écoutes. Vous pouvez le réécouter.');return;}
  if(row?.status==='pending'){button.disabled=true;button.textContent='Préparation en cours…';message('Votre audio est en préparation. Vous pouvez revenir plus tard dans Mes écoutes.');return;}
  button.textContent=row?.status==='failed'?'Réessayer la génération':'Générer l’audio';
  if(busy){button.textContent='Demande en cours…';return;}
  if(limits&&n>limits.maxTextCharacters){button.disabled=true;message('Ce texte est trop long pour la génération audio. Ajoutez un extrait plus court dans Mes textes.');}
  else if(row?.status==='failed')message('La génération a échoué. Une nouvelle tentative utilisera à nouveau votre allocation.');
  else message('Créez une lecture de ce texte, puis retrouvez-la dans Mes écoutes.');
 }
 async function showRow(r,ticket){
  if(ticket!==serial)return;row=r;paint();
  if(r?.status==='ready'){
   const signed=await api('/'+r.id+'/url',{method:'POST'});if(ticket!==serial)return;
   player.src=signed.url;player.hidden=false;$('readerAudioSpeedLabel').hidden=false;player.playbackRate=Number($('readerAudioSpeed').value);
  }else if(r?.status==='pending'){
   poll=setTimeout(async()=>{try{const result=await api('/'+r.id,{signal:controller?.signal});await showRow(result.recording,ticket);}catch(e){if(ticket===serial){message(e.message);$('refreshAudio').hidden=false;}}},4000);
  }
 }
 async function refresh(force=false){
  const t=current(),key=(auth.user()?.id||'')+'|'+(t?.id||'')+'|'+(t?.body||'');
  if(key===fingerprint&&!force)return;fingerprint=key;reset();limits=null;paint();$('refreshAudio').hidden=true;
  if(!auth.user()||!t?.body)return;
  const ticket=serial;controller=new AbortController();
  try{
   const [list,limit,h]=await Promise.all([api('',{signal:controller.signal}),api('/limits',{signal:controller.signal}),hash(t.body)]);
   if(ticket!==serial)return;limits=limit;paint();const found=list.recordings.find(x=>x.content_hash===h);if(found)await showRow(found,ticket);
  }catch(e){if(ticket===serial&&e.name!=='AbortError'){message(e.message);$('refreshAudio').hidden=false;}}
 }
 $('generateAudio').onclick=async()=>{
  if(!auth.user()){auth.login();return;}
  if(busy||row?.status==='pending')return;
  const retry=row?.status==='failed';
  if(retry&&!confirm('Réessayer utilisera à nouveau votre allocation de génération. Continuer ?'))return;
  const t=current(),ticket=serial;busy=true;paint();
  try{const result=await api('',{method:'POST',body:{title:t.title.slice(0,150),text:t.body,retry}});if(ticket!==serial)return;busy=false;await showRow(result.recording,ticket);const l=await api('/limits');if(ticket===serial){limits=l;paint();}}
  catch(e){if(ticket===serial){busy=false;paint();message(e.message);$('refreshAudio').hidden=false;}}
 };
 $('refreshAudio').onclick=()=>refresh(true);
 $('readerAudioSpeed').onchange=e=>{player.playbackRate=Number(e.target.value);};
 player.addEventListener('error',()=>{if(player.getAttribute('src')){message('Lecture interrompue. Actualisez l’audio pour renouveler son lien.');$('refreshAudio').hidden=false;}});
 async function loadCloud(){
  if(!cloudId||!auth.user())return;
  const owner=auth.user().id,id=cloudId;
  try{const result=await api('/'+encodeURIComponent(id));if(auth.user()?.id!==owner||cloudId!==id)return;cloudOwner=owner;window.CGReaderAudio.openCloud(result.recording);await refresh(true);}
  catch(e){message(e.message);}
 }
 window.addEventListener('reader-text',()=>void refresh());
 window.addEventListener('reader-auth',()=>{
  if(cloudOwner&&cloudOwner!==auth.user()?.id){window.CGReaderAudio.clearCloud();cloudOwner=null;}
  void refresh(true);void loadCloud();
 });
 window.addEventListener('pagehide',()=>{reset();});
 window.addEventListener('pageshow',e=>{if(e.persisted)void refresh(true);});
 void refresh();void loadCloud();
})();
