// Keep startup failures visible rather than leaving a dead button on screen.
(()=>{
 const report=message=>{if(document.documentElement.dataset.ironwoodBoot==='ready')return;const status=document.getElementById('art-status');status.hidden=false;status.textContent='The player could not start. '+message+' Reload to retry.';document.getElementById('action-label').textContent='Reload player';document.getElementById('action').onclick=()=>location.reload();};
 window.addEventListener('error',event=>report(event.message||'A required player file did not load.'));
 window.addEventListener('unhandledrejection',event=>report(event.reason?.message||'Startup was interrupted.'));
 const script=document.createElement('script');script.src='ironwood-player.js?v=6';script.onerror=()=>report('The player file did not load.');document.body.append(script);
})();
