// ================================================
// PARTICLES.JS — Neural Network Canvas Animation
// ================================================

class NeuralParticles {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null };
    this.animId = null;

    this.config = {
      count: 70,
      maxDist: 140,
      speed: 0.4,
      dotSize: 2,
      primaryColor: '0, 212, 255',   // cyan
      secondaryColor: '124, 58, 237', // violet
      lineOpacity: 0.12,
      dotOpacity: 0.5,
      mouseForce: 80,
    };

    this.init();
    this.bindEvents();
    this.animate();
  }

  init() {
    this.resize();
    this.particles = Array.from({ length: this.config.count }, () => ({
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      vx: (Math.random() - 0.5) * this.config.speed,
      vy: (Math.random() - 0.5) * this.config.speed,
      r: Math.random() * this.config.dotSize + 1,
      isSecondary: Math.random() < 0.3,
    }));
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    window.addEventListener('mouseleave', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });
  }

  update() {
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > this.canvas.width)  p.vx *= -1;
      if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

      // Mouse repulsion
      if (this.mouse.x !== null) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.config.mouseForce) {
          const force = (this.config.mouseForce - dist) / this.config.mouseForce;
          p.x += dx * force * 0.04;
          p.y += dy * force * 0.04;
        }
      }
    });
  }

  draw() {
    const { ctx, particles, config, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < config.maxDist) {
          const alpha = config.lineOpacity * (1 - dist / config.maxDist);
          const color = particles[i].isSecondary
            ? config.secondaryColor
            : config.primaryColor;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${color}, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Draw dots
    particles.forEach(p => {
      const color = p.isSecondary ? config.secondaryColor : config.primaryColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color}, ${config.dotOpacity})`;
      ctx.fill();

      // Glow on large dots
      if (p.r > 2) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgba(${color}, 0.5)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });
  }

  animate() {
    this.update();
    this.draw();
    this.animId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new NeuralParticles('particles-canvas');
});
