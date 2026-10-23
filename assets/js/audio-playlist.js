(() => {
 'use strict';
 const $=id=>document.getElementById(id),auth=window.CGAudioAuth,{api,clearPlayer}=window.CGAudio;
 const player=$('playlistPlayer');let rows=[],currentId=null,loadSerial=0,playSerial=0,poll=null,reordering=false,continuous=false;
 const readyRows=()=>rows.filter(r=>r.status==='ready');
 function stop(){playSerial++;clearPlayer(player);currentId=null;continuous=false;$('nowPlaying').hidden=true;}
 function draw(){
  const host=$('audioList');host.replaceChildren();const ready=readyRows();
  $('recordingCount').textContent=rows.length?`${rows.length} enregistrement${rows.length>1?'s':''} · ${ready.length} prêt${ready.length>1?'s':''} à écouter`:'';
  $('playAll').disabled=!ready.length;
  if(!rows.length){const box=document.createElement('div');box.className='empty';const p=document.createElement('p');p.textContent=auth.user()?'Votre liste est encore vide. Ouvrez un texte dans le lecteur, puis choisissez « Générer l’audio ».':'Vos enregistrements apparaîtront après connexion.';box.append(p);host.append(box);return;}
  rows.forEach((r,index)=>{
   const item=document.createElement('div');item.className='track'+(r.id===currentId?' active':'');
   const info=document.createElement('div');info.className='track-info';const h=document.createElement('h3');h.lang='en';h.textContent=r.title;
   const meta=document.createElement('p');meta.className='muted';meta.textContent=r.status==='ready'?'Prêt à écouter':r.status==='pending'?'Préparation en cours…':'Génération interrompue — ouvrez le texte pour réessayer.';info.append(h,meta);
   const actions=document.createElement('div');actions.className='track-actions';
   const play=document.createElement('button');play.type='button';play.textContent='Écouter';play.disabled=r.status!=='ready';play.setAttribute('aria-label','Écouter : '+r.title);play.onclick=()=>{continuous=false;void select(r.id,true);};
   const open=document.createElement('a');open.className='button';open.textContent='Ouvrir le texte';open.href='lecture.html?audio='+encodeURIComponent(r.id);
   actions.append(play,open);
   for(const [delta,label] of [[-1,'Monter'],[1,'Descendre']]){const b=document.createElement('button');b.type='button';b.textContent=delta<0?'↑':'↓';b.setAttribute('aria-label',label+' : '+r.title);b.disabled=reordering||index+delta<0||index+delta>=rows.length;b.onclick=()=>move(index,delta);actions.append(b);}
   item.append(info,actions);host.append(item);
  });
  const i=ready.findIndex(r=>r.id===currentId);$('previousTrack').disabled=i<=0;$('nextTrack').disabled=i<0||i>=ready.length-1;
 }
 async function load(){
  clearTimeout(poll);const serial=++loadSerial;
  if(!auth.user()){rows=[];stop();draw();$('listStatus').textContent='';return;}
  $('listStatus').textContent='Chargement de vos écoutes…';
  try{const result=await api('');if(serial!==loadSerial)return;rows=result.recordings;draw();$('listStatus').textContent='';if(rows.some(r=>r.status==='pending'))poll=setTimeout(()=>void load(),5000);}
  catch(e){if(serial===loadSerial)$('listStatus').textContent=e.message;}
 }
 async function select(id,autoplay){
  const row=rows.find(x=>x.id===id&&x.status==='ready');if(!row)return;
  const serial=++playSerial;currentId=id;clearPlayer(player);$('nowPlaying').hidden=false;$('playingTitle').textContent=row.title;$('openPlayingText').href='lecture.html?audio='+encodeURIComponent(id);$('playerStatus').textContent='Chargement de l’audio…';draw();
  try{const result=await api('/'+id+'/url',{method:'POST'});if(serial!==playSerial)return;player.src=result.url;player.playbackRate=Number($('playbackSpeed').value);$('playerStatus').textContent=continuous?'Lecture de la liste en continu.':'';if(autoplay){try{await player.play();}catch{if(serial===playSerial)$('playerStatus').textContent='Appuyez sur Lecture dans le lecteur audio pour continuer.';}}}
  catch(e){if(serial===playSerial)$('playerStatus').textContent=e.message;}
 }
 async function move(index,delta){
  if(reordering)return;reordering=true;clearTimeout(poll);const owner=auth.user()?.id;const next=[...rows];[next[index],next[index+delta]]=[next[index+delta],next[index]];draw();
  try{await api('/reorder',{method:'POST',body:{ids:next.map(x=>x.id)}});if(auth.user()?.id!==owner)return;rows=next;$('listStatus').textContent='Ordre enregistré.';}
  catch(e){$('listStatus').textContent=e.message;}
  finally{reordering=false;draw();if(rows.some(r=>r.status==='pending'))poll=setTimeout(()=>void load(),5000);}
 }
 function next(delta){const items=readyRows(),i=items.findIndex(x=>x.id===currentId);if(items[i+delta])void select(items[i+delta].id,true);else if(delta===1){continuous=false;$('playerStatus').textContent='Vous avez terminé votre liste.';}}
 $('playAll').onclick=()=>{const first=readyRows()[0];if(first){continuous=true;void select(first.id,true);}};
 $('previousTrack').onclick=()=>next(-1);$('nextTrack').onclick=()=>next(1);
 $('playbackSpeed').onchange=e=>{player.playbackRate=Number(e.target.value);};
 $('refreshList').onclick=()=>void load();
 player.addEventListener('ended',()=>{if(continuous)next(1);});
 player.addEventListener('error',()=>{if(player.getAttribute('src'))$('playerStatus').textContent='Lecture interrompue. Cliquez à nouveau sur Écouter pour renouveler le lien.';});
 window.addEventListener('reader-auth',()=>{loadSerial++;clearTimeout(poll);rows=[];stop();draw();void load();});
 window.addEventListener('pagehide',()=>{loadSerial++;clearTimeout(poll);stop();});
 window.addEventListener('pageshow',e=>{if(e.persisted)void load();});
 void auth.ready.then(()=>load());
})();
