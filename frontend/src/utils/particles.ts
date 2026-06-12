export const burstParticles = () => {
  const modalEl = document.getElementById('timer-modal-element');
  if (!modalEl) return;
  const rect = modalEl.getBoundingClientRect();
  const colors = ['#7c3aed', '#3b82f6', '#ff6b6b', '#10b981', '#fbbf24'];

  for (let i = 0; i < 40; i++) {
    const particle = document.createElement('div');
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 3;

    particle.style.position = 'fixed';
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.width = `${Math.random() * 8 + 6}px`;
    particle.style.height = particle.style.width;
    particle.style.borderRadius = '50%';
    const color = colors[Math.floor(Math.random() * colors.length)];
    particle.style.backgroundColor = color;
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '9999';
    particle.style.boxShadow = `0 0 10px ${color}`;
    document.body.appendChild(particle);

    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 4;
    const velX = Math.cos(angle) * speed;
    const velY = Math.sin(angle) * speed - 2;

    let curX = x;
    let curY = y;
    let opacity = 1;
    let gravity = 0.25;

    const animate = () => {
      curX += velX;
      curY += velY + gravity;
      gravity += 0.05;
      opacity -= 0.02;
      particle.style.left = `${curX}px`;
      particle.style.top = `${curY}px`;
      particle.style.opacity = opacity.toString();

      if (opacity > 0) {
        requestAnimationFrame(animate);
      } else {
        particle.remove();
      }
    };
    requestAnimationFrame(animate);
  }
};
