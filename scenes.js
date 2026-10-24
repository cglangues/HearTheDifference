'use strict';
(()=>{
const scenes=window.LISTENING_SCENES||[], $=id=>document.getElementById(id), audio=$('audio');let current=0;
if(!scenes.length){$('audio-status').textContent='Les scènes n’ont pas pu être chargées.';return;}
scenes.forEach((s,i)=>{const o=document.createElement('option');o.value=i;o.textContent=`${i+1}. ${s.title}`;$('scene-select').append(o)});
function setExpanded(button,panel,open,label){button.setAttribute('aria-expanded',String(open));panel.hidden=!open;button.textContent=label;}
function render(i){current=i;const s=scenes[i];audio.pause();audio.removeAttribute('src');audio.load();$('scene-select').value=i;$('scene-image').src=s.image;$('scene-image').alt=s.alt;$('scene-title').textContent=s.englishTitle;$('scene-meta').textContent=`Scène ${i+1} / ${scenes.length} · ${s.level}`;$('transcript').textContent=s.transcript;
setExpanded($('text-toggle'),$('transcript'),false,'Afficher le texte');setExpanded($('answer-toggle'),$('answer'),false,'Voir une réponse possible');$('vocabulary').open=false;$('question').open=false;document.querySelector('.panel').scrollTop=0;
$('word-list').replaceChildren();s.vocabulary.forEach(w=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.lang='en';dt.textContent=w.en;dd.textContent=w.fr;$('word-list').append(dt,dd)});$('question-text').textContent=s.question;$('answer').textContent=s.answer;$('previous').disabled=i===0;$('next').disabled=i===scenes.length-1;
$('audio-status').hidden=!!s.audio;audio.hidden=!s.audio;$('audio-tools').hidden=!s.audio;$('audio-status').textContent='Enregistrement à venir. Vous pouvez déjà explorer l’image et son texte.';if(s.audio){audio.src=s.audio;audio.load();audio.playbackRate=Number($('speed').value);}
}
$('scene-select').addEventListener('change',e=>render(Number(e.target.value)));$('previous').onclick=()=>render(current-1);$('next').onclick=()=>render(current+1);
$('text-toggle').onclick=()=>{const open=$('transcript').hidden;setExpanded($('text-toggle'),$('transcript'),open,open?'Masquer le texte':'Afficher le texte')};$('answer-toggle').onclick=()=>{const open=$('answer').hidden;setExpanded($('answer-toggle'),$('answer'),open,open?'Masquer la réponse':'Voir une réponse possible')};
$('speed').onchange=()=>audio.playbackRate=Number($('speed').value);$('replay').onclick=()=>{audio.currentTime=0;audio.play().catch(()=>{$('audio-status').hidden=false;$('audio-status').textContent='Appuyez sur le bouton de lecture du lecteur audio.'})};audio.addEventListener('error',()=>{if(!audio.getAttribute('src'))return;$('audio-status').hidden=false;$('audio-status').textContent='Cet enregistrement est indisponible ou son format n’est pas pris en charge.'});render(0);
})();
