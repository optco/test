(function() {
  function init() {
    // --- UNIFIED STYLES ---
    if (!document.getElementById('pl-bottombar-styles-v5')) {
      const style = document.createElement('style');
      style.id = 'pl-bottombar-styles-v5';
      style.textContent = `
        /* --- Loader --- */
        #pl-indicator {
          position: fixed;
          bottom: 5px;
          left: 0;
          right: 0;
          height: 20px;
          z-index: 999999;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .pl-dot {
          position: absolute;
          top: 50%;
          left: -10px;
          width: 8px;
          height: 8px;
          margin-top: -4px;
          border-radius: 50%;
          background: #d90000;
          opacity: 0;
        }
        .pl-dot:nth-child(1) {
          animation: plRace1 3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
        }
        .pl-dot:nth-child(2) {
          animation: plRace2 3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
        }
        @keyframes plRace1 {
          0%   { left: -10px; top: 50%; opacity: 0; }
          5%   { opacity: 1; }
          25%  { left: 50%; top: 50%; opacity: 1; }
          50%  { left: 50%; top: 50%; opacity: 1; }
          75%  { left: calc(100vw + 10px); top: 50%; opacity: 1; }
          80%  { left: calc(100vw + 10px); top: 50%; opacity: 0; }
          100% { left: calc(100vw + 10px); top: 50%; opacity: 0; }
        }
        @keyframes plRace2 {
          0%   { left: -10px; top: 50%; opacity: 0; }
          15%  { left: -10px; top: 50%; opacity: 0; }
          20%  { opacity: 1; }
          40%  { left: 50%; top: 50%; opacity: 1; }
          65%  { left: 50%; top: 50%; opacity: 1; }
          90%  { left: calc(100vw + 10px); top: 50%; opacity: 1; }
          95%  { left: calc(100vw + 10px); top: 50%; opacity: 0; }
          100% { left: calc(100vw + 10px); top: 50%; opacity: 0; }
        }

        /* --- Fixed Bottom Bar --- */
        #pl-bottombar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 30px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 99999;
          display: flex;
          align-items: center;
          padding: 0 20px;
          box-sizing: border-box;
          transform: translateY(100%);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        #pl-bottombar.show {
          transform: translateY(0);
        }
        #pl-bottombar a {
          display: flex;
          align-items: center;
          text-decoration: none;
          color: #000;
          width: 100%;
        }
        #pl-bottombar .pl-logo {
          display: block;
          width: 50px;          /* change this to control the logo width */
          height: auto;         /* height adjusts automatically */
          max-height: 24px;     /* keeps it inside the 30px bar */
          object-fit: contain;
          margin-right: 12px;
          user-select: none;
        }
        #pl-page-title {
          font-size: 15px;
          font-weight: 600;
          color: #111111;
          font-family: "Barlow Condensed", sans-serif;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 400px;
        }
      `;
      document.head.appendChild(style);
    }

    // --- LOADER ---
    if (!document.getElementById('pl-indicator')) {
      const loader = document.createElement('div');
      loader.id = 'pl-indicator';
      loader.innerHTML = '<div class="pl-dot"></div><div class="pl-dot"></div>';
      document.body.appendChild(loader);

      setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 400);
      }, 3500);
    }

    // --- BOTTOM BAR ---
    if (!document.getElementById('pl-bottombar')) {
      const rawTitle = document.title || (document.querySelector('title') ? document.querySelector('title').textContent : '');
      const cleanTitle = rawTitle.trim();
      const pageTitle = cleanTitle || window.location.pathname.split('/').pop().replace('.html', '') || 'attn:invoice';

      document.body.style.paddingBottom = '30px';

      const bottombar = document.createElement('div');
      bottombar.id = 'pl-bottombar';
      bottombar.innerHTML = `
        <a href="/index.html" rel="noopener" title="Home">
          <span id="pl-page-title">${pageTitle}</span>
        </a>
      `;

      document.body.appendChild(bottombar);

      // Logo: inserted before the title only if /logo.png actually loads
      const probe = new Image();
      probe.onload = function() {
        if (!probe.naturalWidth) return;
        probe.className = 'pl-logo';
        probe.alt = '';
        probe.draggable = false;
        const titleEl = document.getElementById('pl-page-title');
        if (titleEl && titleEl.parentNode) {
          titleEl.parentNode.insertBefore(probe, titleEl);
        }
      };
      probe.onerror = function() { /* missing logo: render nothing */ };
      probe.src = '/logo.png';

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          bottombar.classList.add('show');
        });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
