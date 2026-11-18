(() => {
  const section = document.querySelector('#comparisons');
  if (!section) return;
  const buttons = document.querySelector('#comparison-scenes');
  const prompt = document.querySelector('#comparison-prompt');
  const status = document.querySelector('#comparison-status');
  const table = document.querySelector('#comparison-table');
  const play = document.querySelector('#comparison-play');
  const restart = document.querySelector('#comparison-restart');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let data, selected, visible = false, wanted = !reduceMotion.matches, generation = 0;
  let videos = [];
  const setPlayback = () => {
    for (const video of videos) {
      if (wanted && visible && !document.hidden) video.play().catch(() => {});
      else video.pause();
    }
    play.textContent = wanted ? 'Pause all' : 'Play all';
    play.setAttribute('aria-label', wanted ? 'Pause all comparison videos' : 'Play all comparison videos');
  };
  function clearVideos() {
    for (const video of videos) { video.pause(); video.removeAttribute('src'); video.load(); }
    videos = [];
  }
  function renderScene() {
    if (!selected || !visible) return;
    const token = ++generation;
    clearVideos();
    table.tHead.replaceChildren(); table.tBodies[0].replaceChildren();
    const header = document.createElement('tr');
    const corner = document.createElement('th'); corner.scope = 'col'; corner.textContent = 'View'; header.append(corner);
    for (const method of data.methods) {
      const th = document.createElement('th'); th.scope = 'col'; th.textContent = method.label;
      if (method.ours) th.classList.add('is-ours'); header.append(th);
    }
    table.tHead.append(header);
    for (const view of selected.views) {
      const tr = document.createElement('tr');
      const row = document.createElement('th'); row.scope = 'row'; row.textContent = `View ${view}`; tr.append(row);
      for (const method of data.methods) {
        const td = document.createElement('td'); if (method.ours) td.classList.add('is-ours');
        const clip = selected.videos[method.id]?.[String(view)];
        if (!clip) { td.textContent = 'Not available'; tr.append(td); continue; }
        const video = document.createElement('video');
        video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'auto'; video.playbackRate = 1;
        video.setAttribute('muted',''); video.setAttribute('playsinline','');
        video.setAttribute('aria-label', `${selected.label}, ${method.label}, view ${view}`);
        video.dataset.method = method.id; video.dataset.view = String(view); video.src = clip.src; video.poster = clip.poster;
        video.addEventListener('error', () => { if (token === generation) status.textContent = 'A comparison clip could not load. Try another scene or reload the page.'; });
        td.append(video); tr.append(td); videos.push(video);
      }
      table.tBodies[0].append(tr);
    }
    table.caption.textContent = `${selected.label} comparison videos`;
    status.textContent = ''; setPlayback();
  }
  function choose(scene) {
    selected = scene; prompt.textContent = `“${scene.prompt}”`;
    for (const button of buttons.children) button.setAttribute('aria-pressed', String(button.dataset.scene === scene.id));
    renderScene();
  }
  play.addEventListener('click', () => { wanted = !wanted; setPlayback(); });
  restart.addEventListener('click', () => { for (const video of videos) video.currentTime = 0; setPlayback(); });
  document.addEventListener('visibilitychange', setPlayback);
  reduceMotion.addEventListener('change', () => { if (reduceMotion.matches) { wanted = false; setPlayback(); } });
  const enter = entries => {
    visible = entries.some(entry => entry.isIntersecting);
    if (visible && !videos.length) renderScene();
    setPlayback();
  };
  if ('IntersectionObserver' in window) new IntersectionObserver(enter,{threshold:0,rootMargin:'150px 0px'}).observe(section);
  else visible = true;
  fetch('./static/comparisons/index.json?v=2').then(response => {
    if (!response.ok) throw new Error('Comparison data not found'); return response.json();
  }).then(result => {
    data = result;
    for (const scene of data.scenes) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = scene.label; button.dataset.scene = scene.id;
      button.addEventListener('click', () => choose(scene)); buttons.append(button);
    }
    play.disabled = false; restart.disabled = false;
    choose(data.scenes[0]);
    if (!visible) status.textContent = 'Videos load when this section comes into view.';
  }).catch(() => { status.textContent = 'Comparison results could not load. Please reload the page.'; });
})();
