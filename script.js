// On the home page, DISCOVER / NEW IN / logo scroll smoothly.
// On other pages the same links (/#top, /#autumn, /) just navigate home.
if (document.body.classList.contains('home')) {
  const go = (id, target) => document.getElementById(id).addEventListener('click', e => {
    e.preventDefault();
    target === 'top' ? scrollTo({ top: 0, behavior: 'smooth' })
                     : document.getElementById(target).scrollIntoView({ behavior: 'smooth' });
  });
  go('nav-logo', 'top'); go('nav-discover', 'top'); go('nav-newin', 'autumn');
}

// Newsletter: until a real form endpoint replaces YOUR_FORM_ID, don't submit
document.querySelectorAll('.f-news').forEach(form => form.addEventListener('submit', e => {
  if (form.action.includes('YOUR_')) {
    e.preventDefault();
    form.querySelector('.f-status').textContent = 'NEWSLETTER NOT CONNECTED YET';
  }
}));

// Dev aid: press "G" to toggle a 12-column grid overlay
const g = document.createElement('div');
g.className = 'grid-overlay';
g.innerHTML = '<i></i>'.repeat(12);
document.body.appendChild(g);
addEventListener('keydown', e => { if (e.key.toLowerCase() === 'g') g.classList.toggle('on'); });