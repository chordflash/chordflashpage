(() => {
  const grid = document.querySelector('#gallery-grid');
  if (!grid) return;
  const status = document.querySelector('#gallery-status');
  const toggle = document.querySelector('#gallery-toggle');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const states = [];
  const byVideo = new Map();
  function load(state) {
    if (state.loaded) return;
    state.loaded = true; state.video.src = state.clip.src; state.video.preload = 'auto'; state.video.load();
  }
  function sync(state) {
    if (state.visible && state.wantPlay && !document.hidden) {
      load(state); state.video.play().catch(() => {});
    } else state.video.pause();
    state.button.textContent = state.wantPlay ? 'Pause' : 'Play';
    state.button.setAttribute('aria-label', `${state.wantPlay ? 'Pause' : 'Play'} ${state.clip.title}`);
  }
  function globalLabel() { toggle.textContent = states.some(s => s.wantPlay) ? 'Pause gallery' : 'Play gallery'; }
  const loader = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) { load(byVideo.get(entry.target)); loader.unobserve(entry.target); }
  },{rootMargin:'180px 0px'}) : null;
  const player = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) { const state=byVideo.get(entry.target); state.visible=entry.isIntersecting; sync(state); }
  },{threshold:.12}) : null;
  toggle.addEventListener('click', () => {
    const want = !states.some(s => s.wantPlay);
    for (const state of states) { state.wantPlay=want; sync(state); }
    globalLabel();
  });
  document.addEventListener('visibilitychange', () => states.forEach(sync));
  reduced.addEventListener('change', () => {
    if (reduced.matches) { for (const state of states) { state.wantPlay=false; sync(state); } globalLabel(); }
  });
  fetch('./static/gallery/index.json?v=2').then(response => {
    if (!response.ok) throw new Error('Missing gallery data'); return response.json();
  }).then(data => {
    for (const clip of data.clips) {
      const card=document.createElement('article');card.className='gallery-card';card.dataset.scene=clip.id;
      const media=document.createElement('div');media.className='gallery-media';
      const video=document.createElement('video');video.muted=true;video.loop=true;video.playsInline=true;video.preload='none';video.poster=clip.poster;
      video.setAttribute('muted','');video.setAttribute('playsinline','');video.setAttribute('aria-label',clip.description);media.append(video);
      const copy=document.createElement('div');copy.className='gallery-copy';
      const title=document.createElement('h3');title.textContent=clip.title;
      const description=document.createElement('p');description.textContent=clip.description;
      const actions=document.createElement('div');actions.className='gallery-card-actions';
      const button=document.createElement('button');button.type='button';button.className='gallery-play';
      const link=document.createElement('a');link.href=clip.src;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open video ↗';link.setAttribute('aria-label',`Open ${clip.title} video`);
      actions.append(button,link);copy.append(title,description,actions);card.append(media,copy);grid.append(card);
      const state={clip,video,button,wantPlay:!reduced.matches,loaded:false,visible:!player};states.push(state);byVideo.set(video,state);
      button.addEventListener('click', () => { state.wantPlay=!state.wantPlay; sync(state); globalLabel(); });
      video.addEventListener('error', () => { if (!media.querySelector('.gallery-error')) { const text=document.createElement('div');text.className='gallery-error';text.textContent='This video could not load. Try opening it directly.';media.append(text); } });
      if (loader) loader.observe(video); else load(state);
      if (player) player.observe(video);
      sync(state);
    }
    document.querySelector('#gallery-count').textContent=`${data.clips.length} scenes`;
    toggle.disabled=false;status.textContent='';globalLabel();
  }).catch(() => { status.textContent='The gallery could not load. Please reload the page.'; });
})();
