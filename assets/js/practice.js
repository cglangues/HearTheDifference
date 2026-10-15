/* Shared daily practice history. Local calendar dates; no accounts or tracking. */
(function () {
  'use strict';
  var KEY = 'cglangues.practice.days.v1', memory = [], available = true;
  function dateKey(d) {
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  }
  function shift(key, amount) {
    var p=key.split('-').map(Number), d=new Date(p[0],p[1]-1,p[2],12);
    d.setDate(d.getDate()+amount); return dateKey(d);
  }
  function valid(k) { return typeof k==='string' && /^\d{4}-\d{2}-\d{2}$/.test(k) && shift(k,0)===k; }
  function read() {
    try {
      var raw=localStorage.getItem(KEY), value=raw ? JSON.parse(raw) : [];
      if (!Array.isArray(value)) throw Error('Invalid history');
      memory=Array.from(new Set(value.filter(valid))).sort(); available=true;
    } catch(e) { available=false; }
    return memory.slice();
  }
  function stats() {
    var today=dateKey(new Date()), days=read().filter(function(k){return k<=today;}), set=new Set(days);
    var end=set.has(today)?today:shift(today,-1), current=0, best=0, run=0, previous=null;
    while(set.has(end)){current++;end=shift(end,-1);}
    days.forEach(function(k){run=previous && shift(previous,1)===k ? run+1 : 1;best=Math.max(best,run);previous=k;});
    var d=new Date(), monday=shift(today,-((d.getDay()+6)%7)), week=[];
    for(var i=0;i<7;i++){var key=shift(monday,i);week.push({date:key,done:set.has(key),today:key===today});}
    return {current:current,best:best,today:set.has(today),weekly:week.filter(function(d){return d.done;}).length,week:week,available:available};
  }
  function record() {
    var days=read(), today=dateKey(new Date());
    if(days.indexOf(today)===-1)days.push(today);
    memory=days.sort();
    try{localStorage.setItem(KEY,JSON.stringify(memory));available=true;}catch(e){available=false;}
    render();return stats();
  }
  function render() {
    var s=stats();
    document.querySelectorAll('[data-practice-summary]').forEach(function(box){
      box.replaceChildren();
      var heading=document.createElement('strong');heading.className='practice-current';
      heading.textContent='🔥 '+s.current+' jour'+(s.current===1?'':'s')+' de suite';
      var detail=document.createElement('span');detail.className='practice-detail';
      detail.textContent='Record : '+s.best+' jour'+(s.best===1?'':'s')+' · '+s.weekly+'/7 jours cette semaine';
      var week=document.createElement('div');week.className='practice-week';week.setAttribute('aria-label','Votre semaine, du lundi au dimanche');
      ['L','M','M','J','V','S','D'].forEach(function(label,i){
        var day=document.createElement('span'),entry=s.week[i];day.className='practice-day'+(entry.done?' done':'')+(entry.today?' today':'');
        day.textContent=label;day.title=entry.date+' : '+(entry.done?'pratique effectuée':'pas encore de pratique');day.setAttribute('aria-label',day.title);week.append(day);
      });
      var message=document.createElement('span');message.className='practice-message';
      message.textContent=!s.available?'La sauvegarde est indisponible dans ce navigateur.':s.today?'✓ Votre pratique du jour est enregistrée.':s.current?'Une minute aujourd’hui suffit pour continuer.':'Un peu de pratique aujourd’hui : à vous de jouer.';
      box.append(heading,detail,week,message);
    });
  }
  window.CGPractice={record:record,stats:stats};
  window.addEventListener('storage',function(e){if(e.key===KEY||e.key===null)render();});
  window.addEventListener('pageshow',render);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)render();});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
  setInterval(render,60000);
})();
