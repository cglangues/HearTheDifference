'use strict';
const cards = [
['a kettle','une bouilloire','It’s something you use to…','It’s something you use to boil water for tea.'],
['an umbrella','un parapluie','You use it when…','You use it when it rains to keep yourself dry.'],
['a ladder','une échelle','It helps you…','It helps you reach somewhere high. You climb up it.'],
['scissors','des ciseaux','You use them to…','You use them to cut paper or hair.'],
['a wallet','un portefeuille','It’s something you keep…','It’s something you keep your money and bank cards in.'],
['a charger','un chargeur','You use it to…','You use it to give your phone power when the battery is low.'],
['gloves','des gants','You wear them…','You wear them on your hands when it’s cold.'],
['a toothbrush','une brosse à dents','You use it to…','You use it to clean your teeth every morning and evening.'],
['a frying pan','une poêle','It’s something you cook…','It’s something you cook eggs in. It’s flat and has a handle.'],
['a remote control','une télécommande','You use it to…','You use it to change the channel on your television without getting up.'],
['a plumber','un plombier / une plombière','It’s someone who…','It’s someone who repairs pipes and fixes water problems in your house.'],
['a firefighter','un pompier / une pompière','It’s someone who…','It’s someone who puts out fires and helps people in danger.'],
['a dentist','un / une dentiste','It’s someone who…','It’s someone who checks your teeth and repairs them when there’s a problem.'],
['a hairdresser','un coiffeur / une coiffeuse','You go to this person when…','You go to this person when you want someone to cut your hair.'],
['a mechanic','un mécanicien / une mécanicienne','It’s someone who…','It’s someone who repairs your car when it isn’t working.'],
['a waiter / a waitress','un serveur / une serveuse','It’s someone who…','It’s someone who brings you food and drinks in a restaurant.'],
['a farmer','un agriculteur / une agricultrice','It’s someone who…','It’s someone who grows food or keeps animals in the countryside.'],
['a nurse','un infirmier / une infirmière','It’s someone who…','It’s someone who looks after patients and gives them care, often in a hospital.'],
['a builder','un ouvrier / une ouvrière du bâtiment','It’s someone who…','It’s someone who builds houses or repairs buildings.'],
['a baker','un boulanger / une boulangère','It’s someone who…','It’s someone who makes bread and cooks it in an oven.'],
['a pharmacy','une pharmacie','It’s a place where…','It’s a place where you go to buy medicine.'],
['a hospital','un hôpital','It’s a place where…','It’s a place where doctors and nurses look after people who are ill or injured.'],
['a library','une bibliothèque','It’s a place where…','It’s a place where you can read books and borrow them to take home.'],
['a post office','un bureau de poste','You go there to…','You go there to send letters and parcels or buy stamps.'],
['a train station','une gare','It’s a place where…','It’s a place where you wait for a train and get on it.'],
['a supermarket','un supermarché','It’s a place where…','It’s a large shop where you buy food and things for your home.'],
['a bakery','une boulangerie','It’s a place where…','It’s a shop where you buy fresh bread and croissants.'],
['a petrol station','une station-service','You go there when…','You go there when your car needs fuel.'],
['an airport','un aéroport','It’s a place where…','It’s a place where you go to catch a plane.'],
['a bank','une banque','It’s a place where…','It’s a place where you can put money into your account or talk about a loan.']
].map((c,id)=>({id,word:c[0],fr:c[1],hint:c[2],example:c[3],category:Math.floor(id/10)}));
const $=id=>document.getElementById(id), categories=['Objet','Personne','Lieu'];
let queue=[],session=[],position=0,recorder=null,stream=null,clip=null,recordingPending=false,recordEpoch=0;
function shuffled(list){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function pool(){return cards.filter(c=>$('filter').value==='all'||String(c.category)===$('filter').value);}
function start(repeat=false){stopAudio();if(!repeat){if(queue.length<5)queue=shuffled(pool());session=queue.splice(0,5);}position=0;$('round').hidden=false;$('complete').hidden=true;render();}
function stopAudio(){recordEpoch++;if(recorder&&recorder.state!=='inactive')recorder.stop();if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;recorder=null;$('playback').pause();$('playback').hidden=true;$('playback').removeAttribute('src');if(clip)URL.revokeObjectURL(clip);clip=null;$('record').textContent='◉ M’enregistrer';$('recordStatus').textContent='Facultatif · sur cet appareil';}
function render(){stopAudio();const c=session[position];$('progress').textContent=`Image ${position+1} / ${session.length}`;$('category').textContent=categories[c.category];const edges=[0,210,396,601,805,1015,1254],row=Math.floor(c.id/5),height=edges[row+1]-edges[row];$('picture').style.aspectRatio=`251 / ${height}`;$('picture').style.backgroundSize=`500% ${1254/height*100}%`;$('picture').style.backgroundPosition=`${c.id%5*25}% ${edges[row]/(1254-height)*100}%`;$('picture').setAttribute('aria-label',`Image à décrire : ${c.fr}`);$('dots').innerHTML=session.map((_,i)=>`<span class="dot ${i<=position?'active':''}"></span>`).join('');$('hint').textContent=c.hint;$('sentence').textContent='“'+c.example+'”';$('word').textContent=c.word+' · '+c.fr;for(const id of ['hint','example','retry','tryAgain','next'])$(id).hidden=true;$('reveal').hidden=false;$('hintButton').setAttribute('aria-expanded','false');$('hintButton').textContent='Besoin d’un début ?';$('next').textContent=position===4?'Terminer la séance →':'Image suivante →';}
$('hintButton').onclick=()=>{const show=$('hint').hidden;$('hint').hidden=!show;$('hintButton').setAttribute('aria-expanded',String(show));$('hintButton').textContent=show?'Masquer le début de phrase':'Besoin d’un début ?';};
$('reveal').onclick=()=>{$('example').hidden=false;$('reveal').hidden=true;$('tryAgain').hidden=false;$('next').hidden=false;$('retry').hidden=true;$('tryAgain').textContent='Masquer l’exemple et réessayer';};
$('tryAgain').onclick=()=>{const hide=!$('example').hidden;$('example').hidden=hide;$('retry').hidden=!hide;$('hint').hidden=true;$('hintButton').setAttribute('aria-expanded','false');$('hintButton').textContent='Besoin d’un début ?';$('tryAgain').textContent=hide?'Revoir l’exemple':'Masquer l’exemple et réessayer';};
$('next').onclick=()=>{stopAudio();position++;if(position>=session.length){$('round').hidden=true;$('complete').hidden=false;$('complete').focus();}else{render();$('hintButton').focus({preventScroll:true});$('round').scrollIntoView({behavior:'smooth',block:'start'});}};
$('filter').onchange=()=>{queue=[];start();};$('restart').onclick=()=>start();$('repeat').onclick=()=>start(true);
$('record').onclick=async()=>{if(recordingPending)return;if(recorder&&recorder.state==='recording'){recorder.stop();if(stream)stream.getTracks().forEach(t=>t.stop());$('record').textContent='◉ Recommencer';return;}if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){$('recordStatus').textContent='Enregistrement indisponible ici. Parlez simplement à voix haute.';return;}recordingPending=true;const epoch=recordEpoch;try{const s=await navigator.mediaDevices.getUserMedia({audio:true});if(epoch!==recordEpoch){s.getTracks().forEach(t=>t.stop());return;}stream=s;const chunks=[];recorder=new MediaRecorder(s);const r=recorder;r.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};r.onstop=()=>{s.getTracks().forEach(t=>t.stop());if(epoch!==recordEpoch)return;if(clip)URL.revokeObjectURL(clip);clip=URL.createObjectURL(new Blob(chunks,{type:r.mimeType}));$('playback').src=clip;$('playback').hidden=false;$('recordStatus').textContent='Écoutez-vous. Le son est effacé à l’image suivante.';};$('playback').hidden=true;recorder.start();$('record').textContent='■ Arrêter';$('recordStatus').textContent='Enregistrement en cours…';}catch(e){$('recordStatus').textContent='Micro indisponible ou accès refusé. Vous pouvez continuer sans enregistrer.';}finally{recordingPending=false;}};
window.addEventListener('pagehide',stopAudio);start();
