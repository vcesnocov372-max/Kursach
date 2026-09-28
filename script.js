// KidsBe — интерактив лендинга (бургер-меню + скролл-анимации)


/* ===== Плавное появление блоков при скролле ===== */
(function(){
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  var targets = document.querySelectorAll('section > *, footer > *');
  targets.forEach(function(el, i){
    el.classList.add('reveal');
    el.style.transitionDelay = (Math.min(i % 3, 2) * 0.09) + 's';
  });

  if (!('IntersectionObserver' in window)) {
    targets.forEach(function(el){ el.classList.add('in-view'); });
    return;
  }

  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting){
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(function(el){ observer.observe(el); });
})();
