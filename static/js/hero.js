/* The supplied template's hero reveal, without unrelated page interactions. */
(() => {
  const hero = document.querySelector('.hero-section');
  const video = document.querySelector('.hero-video');
  const cue = document.querySelector('.scroll-cue');
  const toggle = document.querySelector('.video-toggle');
  if (!hero || !video) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealFraction = 0.6;
  let ticking = false;
  function update() {
    ticking = false;
    hero.classList.toggle('is-static', reduced.matches);
    const total = hero.offsetHeight - window.innerHeight;
    const scroll = Math.max(0, -hero.getBoundingClientRect().top);
    const progress = reduced.matches || total <= 0 ? 1 : Math.min(1, scroll / total / revealFraction);
    hero.style.setProperty('--hero-enter-progress', progress.toFixed(3));
    cue.hidden = reduced.matches || progress > 0.5;
  }
  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }
  function playbackState() {
    toggle.textContent = video.paused ? 'Play video' : 'Pause video';
    toggle.setAttribute('aria-label', video.paused ? 'Play teaser video' : 'Pause teaser video');
  }
  toggle.addEventListener('click', () => {
    if (video.paused) video.play().catch(playbackState);
    else video.pause();
  });
  video.addEventListener('play', playbackState);
  video.addEventListener('pause', playbackState);
  video.addEventListener('loadeddata', playbackState);
  cue.addEventListener('click', () => {
    const top = hero.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({top: top + Math.max(0, hero.offsetHeight - innerHeight) * revealFraction, behavior: 'smooth'});
  });
  window.addEventListener('scroll', requestUpdate, {passive: true});
  window.addEventListener('resize', requestUpdate, {passive: true});
  reduced.addEventListener('change', () => { if (reduced.matches) video.pause(); update(); });
  if (reduced.matches) { video.autoplay = false; video.pause(); }
  else video.play().catch(playbackState);
  update();
  playbackState();
})();
