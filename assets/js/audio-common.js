/* Public configuration only. All private API keys stay on Scalingo. */
(() => {
 'use strict';
 const base='https://anglais-en-autonomie-backend.osc-fr1.scalingo.io';
 async function api(path,{method='GET',body,signal}={}) {
  const auth=window.CGAudioAuth,owner=auth?.user()?.id;
  if(!owner)throw Error('Connectez-vous pour accéder à vos écoutes.');
  for(let attempt=0;attempt<2;attempt++){
   const token=await auth.token(attempt===1);
   if(auth.user()?.id!==owner)throw Error('Session fermée.');
   let response;
   try{response=await fetch(base+'/api/audio'+path,{method,headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,credentials:'omit',referrerPolicy:'no-referrer',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(25000)]):AbortSignal.timeout(25000)});}catch(e){if(e.name==='AbortError')throw e;throw Error('Connexion au service audio impossible. Réessayez.');}
   if(response.status===401&&attempt===0)continue;
   let result;try{result=await response.json();}catch{throw Error('Réponse audio indisponible.');}
   if(auth.user()?.id!==owner)throw Error('Session fermée.');
   if(!response.ok){const e=Error(result.error||'Service audio indisponible.');e.status=response.status;throw e;}
   return result;
  }
  throw Error('Reconnectez-vous pour continuer.');
 }
 async function hash(text){const bytes=new TextEncoder().encode(text.normalize('NFC').replace(/\r\n?/g,'\n').trim());return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');}
 function clearPlayer(player){player.pause();player.removeAttribute('src');player.load();}
 window.CGAudio={api,hash,clearPlayer};
})();
