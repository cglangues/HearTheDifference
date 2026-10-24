(() => {
 const $=id=>document.getElementById(id),key='cglangues.journal.v1';
 const prompts=[
 ['Libre','Choisissez votre propre sujet.','Écrivez ce que vous voulez.','I’ve been thinking about…'],
 ['Today','What happened today?','Une chose que vous avez faite, une personne rencontrée, votre humeur.','Today, I… | I felt… because… | The best part was…'],
 ['Looking forward','What are you looking forward to?','Un petit plaisir ou un grand projet : quoi, quand, pourquoi ?','I’m looking forward to… | I hope… | I’m going to…'],
 ['Everyday object','Describe something you use every day.','Son apparence, son utilité, pourquoi vous l’aimez.','I use it to… | It looks like… | Without it, I would…'],
 ['Yesterday','What would you change about yesterday?','Un événement, un choix, une autre possibilité.','Yesterday, I… | Next time, I would…'],
 ['Learning','What have you learned recently?','Une découverte, comment vous l’avez faite, son utilité.','I’ve recently learned… | I found out that…'],
 ['A place','Describe a place you like.','Ce que vous voyez, entendez et ressentez là-bas.','There is… | You can… | I like it because…'],
 ['Small win','What went well this week?','Une petite réussite compte aussi.','This week, I managed to… | I was pleased because…'],
 ['Routine','What is a typical morning like for you?','Vos habitudes et une chose que vous aimeriez changer.','I usually… | After that… | I’d like to…'],
 ['Memory','Write about a memory that makes you smile.','Le lieu, les personnes, ce qui s’est passé.','I remember… | We were… | Suddenly…'],
 ['Opinion','Would you rather live in a city or in the countryside?','Votre choix, deux raisons, un inconvénient.','I’d rather… | One advantage is… | However…'],
 ['Weekend','What would your ideal weekend look like?','Imaginez sans contrainte de budget ou de temps.','If I could… | I would… | It would be…'],
 ['Food','Tell us about a meal you enjoyed.','Les plats, les personnes, ce qui vous a plu.','We had… | It tasted… | What I liked most was…'],
 ['Advice','What advice would you give someone learning English?','Partez de votre propre expérience.','You could… | It helps to… | Don’t worry if…'],
 ['Surprise','What surprised you recently?','Vos attentes, ce qui s’est passé, votre réaction.','I thought… | But actually… | I didn’t expect…'],
 ['Tomorrow','What would you like to do tomorrow?','Un projet réaliste et une chose pour vous faire plaisir.','Tomorrow, I’d like to… | I need to… | If I have time…']
 ];
 let data={entries:[],current:null},storageOK=true,blocked=false;
 try{const v=JSON.parse(localStorage.getItem(key)||'null');if(v){if(!Array.isArray(v.entries)||!v.entries.every(e=>e&&typeof e.id==='string'&&typeof e.text==='string'&&typeof e.title==='string'&&Number.isFinite(e.created)&&Number.isFinite(e.updated)))throw Error();data=v;}}catch{storageOK=false;blocked=true;}
 let current;
 const status=(text,error=false)=>{$('saveStatus').textContent=text;$('saveStatus').className='status '+(error?'error':'success');};
 function persist(){if(blocked){status('Sauvegarde indisponible. Téléchargez votre texte avant de quitter.',true);return false;}try{localStorage.setItem(key,JSON.stringify(data));storageOK=true;status('Enregistré sur cet appareil.');return true;}catch{storageOK=false;status('Sauvegarde impossible. Téléchargez votre journal avant de quitter.',true);return false;}}
 function help(){const p=prompts[Number($('prompt').value)]||prompts[0];$('promptHelp').textContent=p[2];$('starters').textContent=p[3];}
 function capture(){current.title=$('entryTitle').value;current.text=$('journalText').value;current.prompt=Number($('prompt').value);current.updated=Date.now();data.current=current.id;const n=current.text.trim()?current.text.trim().split(/\s+/u).length:0;$('wordCount').textContent=n+' '+(n===1?'mot':'mots');}
 function renderList(){const list=$('entries');list.replaceChildren();const entries=data.entries.filter(e=>e.text.trim()||e.title.trim()).sort((a,b)=>b.updated-a.updated);if(!entries.length){list.textContent='Votre premier texte commence ici.';return;}for(const e of entries){const b=document.createElement('button');b.type='button';b.className='entry';b.textContent=e.title||e.text.slice(0,45);const s=document.createElement('small');s.textContent=new Date(e.created).toLocaleDateString('fr-FR');b.append(s);b.onclick=()=>{capture();persist();open(e);};list.append(b);}}
 function open(e){current=e;$('entryTitle').value=e.title||'';$('journalText').value=e.text;$('prompt').value=String(e.prompt||0);data.current=e.id;help();capture();$('deleteEntry').hidden=false;renderList();}
 function create(){if(current){capture();if(!persist())return;}const e={id:crypto.randomUUID(),created:Date.now(),updated:Date.now(),title:'',text:'',prompt:1};data.entries=data.entries.filter(x=>x.text.trim()||x.title.trim());data.entries.push(e);open(e);persist();$('journalText').focus();}
 prompts.forEach((p,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=p[1];$('prompt').append(o);});
 for(const id of ['entryTitle','journalText'])$(id).addEventListener('input',()=>{capture();persist();renderList();});
 $('prompt').onchange=()=>{help();capture();persist();};
 $('saveEntry').onclick=()=>{capture();if(persist()&&current.text.trim())window.CGPractice?.record();renderList();};
 $('newEntry').onclick=create;
 $('deleteEntry').onclick=()=>{if(!confirm('Supprimer ce texte de cet appareil ?'))return;data.entries=data.entries.filter(e=>e.id!==current.id);current=null;data.current=null;persist();if(data.entries.length)open(data.entries[0]);else create();persist();};
 $('exportJournal').onclick=()=>{capture();const text=data.entries.filter(e=>e.text.trim()||e.title.trim()).map(e=>new Date(e.created).toLocaleDateString('fr-FR')+' — '+(e.title||'Mon journal')+'\n'+(prompts[e.prompt]?.[1]||'')+'\n\n'+e.text).join('\n\n────────────────────\n\n');const a=document.createElement('a'),url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));a.href=url;a.download='mon-journal-anglais.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 const restored=data.entries.find(e=>e.id===data.current)||data.entries[0];if(restored)open(restored);else create();
 if(!storageOK)status('La sauvegarde locale est indisponible ou illisible. Téléchargez votre journal avant de quitter.',true);
})();
