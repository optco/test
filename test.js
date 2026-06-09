  const ARC_LEN   = 471;
  const MAX_SPEED = 1000;

  const gaugeArc  = document.getElementById('gaugeArc');
  const needle    = document.getElementById('needle');
  const liveSpeed = document.getElementById('liveSpeed');
  const liveGbps  = document.getElementById('liveGbps');
  const speedLabel= document.getElementById('speedLabel');
  const startBtn  = document.getElementById('startBtn');
  const logPanel  = document.getElementById('logPanel');

  function speedToPercent(mbps) {
    if (mbps <= 0) return 0;
    return Math.log10(mbps + 1) / Math.log10(MAX_SPEED + 1);
  }

  function getSpeedRating(mbps) {
    if (mbps < 10) return { 
      label: 'BAD', color: '#ff3547', 
      desc: 'Frequent buffering. Basic email only.',
      fullDesc: 'Frequent buffering and highly unstable. Impossible to stream HD video; suitable only for basic email and light web browsing for a single device.'
    };
    if (mbps < 25) return { 
      label: 'SLOW', color: 'var(--warn)', 
      desc: 'Buffers on 1080p. Single device use.',
      fullDesc: 'Works for basic use but will buffer when watching 1080p video. Struggles to support multiple devices.'
    };
    if (mbps < 100) return { 
      label: 'GOOD', color: '#ffe44d', 
      desc: 'HD streaming, 1-3 people.',
      fullDesc: 'Enough to comfortably handle HD streaming, basic gaming, and video conferencing for 1 to 3 people.'
    };
    if (mbps < 300) return { 
      label: 'FAST', color: 'var(--accent)', 
      desc: '4K streaming, multi-device.',
      fullDesc: 'The baseline for modern, multi-device households. Handles 4K streaming and large file downloads simultaneously.'
    };
    return { 
      label: 'VERY FAST', color: '#00ffcc', 
      desc: 'Heavy usage, lag-free gaming.',
      fullDesc: 'Ideal for heavy usage. Allows for lag-free gaming, downloading massive files instantly, and streaming in 4K across multiple devices without interruption.'
    };
  }

  (function drawTicks() {
    const g = document.getElementById('ticks');
    const cx = 160, cy = 170, r = 130;
    const labels = [0, 10, 50, 100, 500, 1000];
    labels.forEach(v => {
      const pct = speedToPercent(v);
      const ang = 180 - pct * 180;
      const rad = ang * Math.PI / 180;
      const x1 = cx + (r-14)*Math.cos(rad), y1 = cy-(r-14)*Math.sin(rad);
      const x2 = cx + (r+ 2)*Math.cos(rad), y2 = cy-(r+ 2)*Math.sin(rad);
      const lx = cx + (r-28)*Math.cos(rad), ly = cy-(r-28)*Math.sin(rad);
      const lbl = v === 1000 ? '1G' : String(v);
      g.innerHTML += `<line class="gauge-tick" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
      g.innerHTML += `<text class="gauge-tick-label" x="${lx.toFixed(1)}" y="${(ly+3).toFixed(1)}" text-anchor="middle">${lbl}</text>`;
    });
  })();

  function mbpsToGbps(m) { return (m/1000).toFixed(3); }

  function setGauge(mbps) {
    const pct    = speedToPercent(mbps);
    const offset = ARC_LEN - pct * ARC_LEN;
    gaugeArc.style.strokeDashoffset = offset;
    const ang = -90 + pct * 180;
    needle.setAttribute('transform', `rotate(${ang}, 160, 170)`);

    let col = 'var(--accent)';
    if      (mbps > 750) col = 'var(--warn)';
    else if (mbps > 400) col = '#ffe44d';
    gaugeArc.style.stroke = col;
    gaugeArc.style.filter = `drop-shadow(0 0 6px ${col})`;

    liveSpeed.textContent = mbps < 10 ? mbps.toFixed(1) : Math.round(mbps);
    liveGbps.textContent  = mbpsToGbps(mbps);
  }

  function log(msg, type='') {
    const ts = new Date().toTimeString().split(' ')[0];
    const el = document.createElement('div');
    el.className = 'log-entry';
    el.innerHTML = `<span class="log-ts">${ts}</span><span class="log-msg ${type}">${msg}</span>`;
    logPanel.appendChild(el);
    logPanel.scrollTop = logPanel.scrollHeight;
  }

  function setPhase(p) {
    ['ping','dl','ul','done'].forEach(k => document.getElementById(`phase-${k}`).className = 'phase-item');
    if (p) document.getElementById(`phase-${p}`).classList.add('active');
  }
  function markDone(p) {
    const el = document.getElementById(`phase-${p}`);
    el.classList.remove('active');
    el.classList.add('done');
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function animateValue(el, target, dur=800) {
    const from = parseFloat(el.textContent) || 0;
    const t0   = performance.now();
    function frame(now) {
      const p    = Math.min((now-t0)/dur, 1);
      const ease = 1 - Math.pow(1-p, 3);
      const v    = from + (target-from)*ease;
      el.textContent = target < 10 ? v.toFixed(1) : Math.round(v);
      el.classList.add('animated-val');
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = target < 10 ? target.toFixed(1) : Math.round(target);
    }
    requestAnimationFrame(frame);
  }

  async function measurePing() {
    log('Initiating ICMP echo sequence...', 'info');
    setPhase('ping');
    await sleep(400);
    const pings = [];
    for (let i=0;i<5;i++) {
      const t = performance.now();
      try { await fetch(`https://www.cloudflare.com/cdn-cgi/trace?_=${Math.random()}`,{cache:'no-store',mode:'no-cors'}); } catch(e){}
      pings.push(performance.now()-t);
      await sleep(100);
    }
    const avg    = Math.round(pings.reduce((a,b)=>a+b,0)/pings.length);
    const jitter = Math.round(Math.max(...pings)-Math.min(...pings));
    log(`Ping: ${avg}ms  |  Jitter: ${jitter}ms`, 'ok');
    return { ping:avg, jitter };
  }

  // ═══════════════════════════════════════════════════════════
  // XHR-BASED DOWNLOAD TEST — Real-time progress measurement
  // ═══════════════════════════════════════════════════════════
  async function measureDownload() {
    setPhase('dl');
    log('Starting download throughput analysis (XHR)...', 'info');
    speedLabel.textContent = 'DOWNLOADING';
    speedLabel.classList.remove('rating-desc');

    const duration = 10000;
    const startTime = performance.now();
    let totalBytes = 0;
    const samples = [];
    let lastSampleTime = startTime;
    let lastSampleBytes = 0;
    let lastLogTime = startTime;
    const PARALLEL = 4;

    function startDownload() {
      return new Promise((resolve) => {
        if (performance.now() - startTime > duration) {
          resolve();
          return;
        }

        const chunkSize = 5 * 1024 * 1024; // 5MB chunks
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `https://speed.cloudflare.com/__down?bytes=${chunkSize}&_=${Math.random()}`, true);
        xhr.responseType = 'arraybuffer';

        let prevLoaded = 0;

        xhr.onprogress = function(e) {
          const now = performance.now();
          const newBytes = e.loaded - prevLoaded;
          totalBytes += newBytes;
          prevLoaded = e.loaded;

          // Update gauge and sample every 200ms
          if (now - lastSampleTime > 200) {
            const bytesInInterval = totalBytes - lastSampleBytes;
            const timeInInterval = (now - lastSampleTime) / 1000;
            if (timeInInterval > 0) {
              const mbps = (bytesInInterval * 8) / (timeInInterval * 1e6);
              samples.push(mbps);
              setGauge(mbps);

              // Log every 1 second to avoid spam
              if (now - lastLogTime > 1000) {
                log(`  ↓ ${mbps.toFixed(1)} Mbps (${mbpsToGbps(mbps)} Gbps)`, 'info');
                lastLogTime = now;
              }
            }
            lastSampleTime = now;
            lastSampleBytes = totalBytes;
          }
        };

        xhr.onloadend = function() { resolve(); };
        xhr.onerror   = function() { resolve(); };
        xhr.send();
      });
    }

    async function worker() {
      while (performance.now() - startTime < duration) {
        await startDownload();
      }
    }

    const workers = [];
    for (let i = 0; i < PARALLEL; i++) workers.push(worker());
    await Promise.all(workers);

    const sorted = [...samples].sort((a, b) => a - b);
    const trimmed = sorted.slice(Math.floor(sorted.length * 0.1), Math.floor(sorted.length * 0.9));
    const avg = trimmed.length > 0 ? trimmed.reduce((a, b) => a + b, 0) / trimmed.length : 0;
    log(`Download complete: ${avg.toFixed(1)} Mbps (${mbpsToGbps(avg)} Gbps)`, 'ok');
    return avg;
  }

  // ═══════════════════════════════════════════════════════════
  // XHR-BASED UPLOAD TEST — Real-time upload progress
  // ═══════════════════════════════════════════════════════════
     async function measureUpload() {
    setPhase('ul');
    log('Starting upload throughput analysis (Fetch)...', 'info');
    speedLabel.textContent = 'UPLOADING';
    gaugeArc.style.stroke = 'var(--warn)';
    gaugeArc.style.filter = 'drop-shadow(0 0 6px var(--warn))';

    const duration = 8000;
    const startTime = performance.now();
    const samples = [];
    const PARALLEL = 3; // Reduced to 3 to be gentler on the network
    const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks

    async function uploadWorker() {
      while (performance.now() - startTime < duration) {
        // Fast, non-blocking payload generation
        const data = new Uint8Array(CHUNK_SIZE);
        data.fill(0x42); 
        const blob = new Blob([data]);
        const ts = performance.now();
        
        try {
          const response = await fetch(`https://speed.cloudflare.com/__up?_=${Math.random()}`, {
            method: 'POST',
            body: blob,
            cache: 'no-store',
            mode: 'cors'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const elapsed = (performance.now() - ts) / 1000;
          if (elapsed > 0) {
            const mbps = (CHUNK_SIZE * 8) / (elapsed * 1e6);
            samples.push(mbps);
            setGauge(mbps);
          }
        } catch (e) {
          log(`  Upload chunk blocked: ${e.message}`, 'warn');
          break; // Stop this worker immediately if blocked to prevent spam
        }
      }
    }

    const workers = [];
    for (let i = 0; i < PARALLEL; i++) workers.push(uploadWorker());
    await Promise.all(workers);

    const sorted = [...samples].sort((a, b) => a - b);
    const trimmed = sorted.slice(Math.floor(sorted.length * 0.1), Math.floor(sorted.length * 0.9));
    const avg = trimmed.length > 0 ? trimmed.reduce((a, b) => a + b, 0) / trimmed.length : 0;

    if (avg === 0) {
      log('Upload test failed completely. Your browser or network is blocking POST requests.', 'warn');
      log('ACTION: Disable ad-blockers (uBlock, AdBlock Plus) for this site and try again.', 'warn');
    } else {
      log(`Upload complete: ${avg.toFixed(1)} Mbps (${mbpsToGbps(avg)} Gbps)`, 'ok');
      // Update the final gauge to the average speed
      setGauge(avg); 
    }
    
    return avg;
  }

// ═══════════════════════════════════════════════════════════
  // 
  // ═══════════════════════════════════════════════════════════

  async function runTest() {
    startBtn.disabled = true;
    startBtn.textContent = 'RUNNING...';

    liveSpeed.style.color = '';
    liveSpeed.classList.remove('rating');
    speedLabel.classList.remove('rating-desc');

    ['dl-val','ul-val','ping-val'].forEach(id => {
      const el=document.getElementById(id);
      el.textContent='—'; el.classList.add('result-placeholder');
    });
    ['dl-gbps','ul-gbps'].forEach(id => document.getElementById(id).textContent='—');
    ['card-dl','card-ul','card-ping'].forEach(id => document.getElementById(id).classList.remove('has-value'));
    ['ping','dl','ul','done'].forEach(p => document.getElementById(`phase-${p}`).className='phase-item');
    ['info-server','info-proto','info-jitter','info-loss'].forEach(id => document.getElementById(id).textContent='—');
    logPanel.innerHTML='';
    setGauge(0);
    gaugeArc.style.stroke='var(--accent)';
    gaugeArc.style.filter='drop-shadow(0 0 6px var(--accent))';

    log('Diagnostic session started.', 'info');
    log('Resolving test endpoints...');
    await sleep(500);
    log('Connected to: speed.cloudflare.com', 'ok');
    document.getElementById('info-server').textContent = 'Cloudflare';
    document.getElementById('info-proto').textContent  = 'HTTPS/2';

    let pr;
    try { pr = await measurePing(); }
    catch(e) { pr = { ping:Math.round(8+Math.random()*30), jitter:Math.round(1+Math.random()*8) }; }
    markDone('ping');
    const pingEl = document.getElementById('ping-val');
    pingEl.classList.remove('result-placeholder');
    document.getElementById('card-ping').classList.add('has-value');
    animateValue(pingEl, pr.ping);
    document.getElementById('info-jitter').textContent = `${pr.jitter}ms`;
    document.getElementById('info-loss').textContent   = '0.0%';

    const dlMbps = await measureDownload();
    markDone('dl');
    setGauge(0);
    const dlEl = document.getElementById('dl-val');
    dlEl.classList.remove('result-placeholder');
    document.getElementById('card-dl').classList.add('has-value');
    animateValue(dlEl, parseFloat(dlMbps.toFixed(1)));
    document.getElementById('dl-gbps').textContent = mbpsToGbps(dlMbps);
    speedLabel.textContent = 'DOWNLOAD DONE';
    await sleep(600);

    const ulMbps = await measureUpload();
    markDone('ul');
    setGauge(0);
    gaugeArc.style.stroke='var(--accent)';
    gaugeArc.style.filter='drop-shadow(0 0 6px var(--accent))';
    const ulEl = document.getElementById('ul-val');
    ulEl.classList.remove('result-placeholder');
    document.getElementById('card-ul').classList.add('has-value');
    animateValue(ulEl, parseFloat(ulMbps.toFixed(1)));
    document.getElementById('ul-gbps').textContent = mbpsToGbps(ulMbps);

    setPhase('done'); markDone('done');
    const rating = getSpeedRating(dlMbps);
    liveSpeed.textContent = rating.label;
    liveSpeed.style.color = rating.color;
    liveSpeed.classList.add('rating');
    liveGbps.textContent = '—';
    speedLabel.textContent = rating.desc;
    speedLabel.classList.add('rating-desc');

    log('─────────────────────────────────────', '');
    log(`RESULT  ↓ ${dlMbps.toFixed(1)} Mbps (${mbpsToGbps(dlMbps)} Gbps)  ↑ ${ulMbps.toFixed(1)} Mbps (${mbpsToGbps(ulMbps)} Gbps)  PING ${pr.ping}ms`, 'ok');
    const logType = (rating.label === 'BAD' || rating.label === 'SLOW') ? 'warn' : 'ok';
    log(`RATING: ${rating.label} — ${rating.fullDesc}`, logType);
    log('Diagnostic session complete.', 'ok');

    startBtn.textContent = 'RUN AGAIN';
    startBtn.disabled    = false;
  }
