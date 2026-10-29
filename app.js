/**
 * MatLab Pro — Materials Science & Testing Lab Hub
 * Frontend Interactive Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // State & Data
  // =========================================================================
  let currentExpId = 'exp1';
  let allVivaQuestions = [];
  let currentQuizIndex = 0;

  // Initialize Viva Database for Quiz Mode & Global Search
  initVivaDatabase();

  // =========================================================================
  // Theme Toggle (Dark / Light)
  // =========================================================================
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('matlab_theme') || 'theme-dark';
  document.body.className = savedTheme;

  themeToggleBtn.addEventListener('click', () => {
    if (document.body.classList.contains('theme-dark')) {
      document.body.classList.replace('theme-dark', 'theme-light');
      localStorage.setItem('matlab_theme', 'theme-light');
      const m = document.getElementById('themeColorMeta');
      if (m) m.setAttribute('content', '#f8fafc');
    } else {
      document.body.classList.replace('theme-light', 'theme-dark');
      localStorage.setItem('matlab_theme', 'theme-dark');
      const m = document.getElementById('themeColorMeta');
      if (m) m.setAttribute('content', '#0a0f1d');
    }
  });

  // =========================================================================
  // Mobile Sidebar Drawer (hamburger + backdrop + swipe-to-close)
  // =========================================================================
  const sidebar         = document.getElementById('sidebar');
  const backdrop        = document.getElementById('sidebarBackdrop');
  const mobileMenuBtn   = document.getElementById('mobileMenuBtn');

  function openSidebar() {
    sidebar.classList.add('open');
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden'; // prevent background scroll
    if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'true');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
    if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });
  }

  // Tap backdrop to close
  if (backdrop) {
    backdrop.addEventListener('click', closeSidebar);
  }

  // Swipe left on sidebar to close (touch gesture)
  if (sidebar) {
    let touchStartX = 0;
    sidebar.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    sidebar.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (dx < -60) closeSidebar(); // swiped left
    }, { passive: true });
  }

  // Auto-reset on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) closeSidebar();
  });

  // =========================================================================
  // Mobile Search Bar Toggle
  // =========================================================================
  const mobileSearchToggleBtn = document.getElementById('mobileSearchToggleBtn');
  const mobileSearchBar       = document.getElementById('mobileSearchBar');
  const mobileSearchInput     = document.getElementById('mobileSearchInput');
  const clearMobileSearchBtn  = document.getElementById('clearMobileSearchBtn');

  if (mobileSearchToggleBtn && mobileSearchBar) {
    mobileSearchToggleBtn.addEventListener('click', () => {
      mobileSearchBar.classList.toggle('active');
      if (mobileSearchBar.classList.contains('active') && mobileSearchInput) {
        mobileSearchInput.focus();
      }
    });
  }

  if (mobileSearchInput) {
    let mobileSearchDebounce = null;
    mobileSearchInput.addEventListener('input', () => {
      clearTimeout(mobileSearchDebounce);
      const q = mobileSearchInput.value.trim().toLowerCase();
      clearMobileSearchBtn.style.display = q ? 'block' : 'none';
      if (q.length > 1) {
        mobileSearchDebounce = setTimeout(() => performSearch(q), 120);
      } else {
        const sp = document.getElementById('searchResultsSection');
        if (sp) sp.style.display = 'none';
      }
    });
  }

  if (clearMobileSearchBtn) {
    clearMobileSearchBtn.addEventListener('click', () => {
      mobileSearchInput.value = '';
      clearMobileSearchBtn.style.display = 'none';
      const sp = document.getElementById('searchResultsSection');
      if (sp) sp.style.display = 'none';
      mobileSearchInput.focus();
    });
  }

  // =========================================================================
  // Navigation: Sidebar Experiment Switching
  // =========================================================================
  const navItems = document.querySelectorAll('.nav-item');
  const expArticles = document.querySelectorAll('.exp-article');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.dataset.expId;
      switchExperiment(targetId);
    });
  });

  function switchExperiment(expId) {
    currentExpId = expId;

    // Update Sidebar Active state
    navItems.forEach(n => {
      if (n.dataset.expId === expId) {
        n.classList.add('active');
        n.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        n.classList.remove('active');
      }
    });

    // Update Article Active state
    expArticles.forEach(art => {
      if (art.id === `${expId}-content`) {
        art.classList.add('active');
      } else {
        art.classList.remove('active');
      }
    });

    // Reset subtabs to first tab for this experiment
    const activeArt = document.getElementById(`${expId}-content`);
    if (activeArt) {
      const firstSubtabBtn = activeArt.querySelector('.subtab-btn');
      if (firstSubtabBtn) {
        firstSubtabBtn.click();
      }
    }

    // Hide search results if visible
    const searchPanel = document.getElementById('searchResultsSection');
    if (searchPanel) searchPanel.style.display = 'none';

    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Optimize MathJax: only typeset newly active article if not yet typeset
    const currentArticle = document.getElementById(`${expId}-content`);
    if (window.MathJax && window.MathJax.typesetPromise && currentArticle && !currentArticle.dataset.mathTypeset) {
      currentArticle.dataset.mathTypeset = 'true';
      window.MathJax.typesetPromise([currentArticle]);
    }

    // Auto-close sidebar drawer on mobile after user picks an experiment
    if (window.innerWidth <= 1024) closeSidebar();
  }

  // =========================================================================
  // Subtabs Bar Switching (How to Perform, Theory, Calc, Viva)
  // =========================================================================
  document.querySelectorAll('.subtabs-bar').forEach(bar => {
    const btns = bar.querySelectorAll('.subtab-btn');
    const parentArticle = bar.closest('.exp-article');

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const targetContentId = btn.dataset.target;
        const subtabContents = parentArticle.querySelectorAll('.subtab-content');
        subtabContents.forEach(content => {
          if (content.id === targetContentId) {
            content.classList.add('active');
            // Optimize MathJax: only typeset if not yet typeset (prevents re-render lag)
            if (window.MathJax && window.MathJax.typesetPromise && !content.dataset.mathTypeset) {
              content.dataset.mathTypeset = 'true';
              window.MathJax.typesetPromise([content]);
            }
            // Trigger resize event only if needed
            window.dispatchEvent(new Event('resize'));
          } else {
            content.classList.remove('active');
          }
        });
      });
    });
  });

  // =========================================================================
  // Viva Voce Accordion
  // =========================================================================
  document.querySelectorAll('.viva-q').forEach(qHeader => {
    qHeader.addEventListener('click', () => {
      const card = qHeader.closest('.viva-card');
      card.classList.toggle('open');
    });
  });

  // Toggle All Viva Questions Button
  document.querySelectorAll('.toggle-all-viva').forEach(btn => {
    btn.addEventListener('click', () => {
      const parentId = btn.dataset.parent;
      const parentEl = document.getElementById(parentId);
      if (!parentEl) return;

      const cards = parentEl.querySelectorAll('.viva-card');
      const anyClosed = Array.from(cards).some(c => !c.classList.contains('open'));

      cards.forEach(c => {
        if (anyClosed) {
          c.classList.add('open');
        } else {
          c.classList.remove('open');
        }
      });

      btn.textContent = anyClosed ? 'Collapse All Answers' : 'Expand All Answers';
    });
  });

  // =========================================================================
  // Lab Readiness Checklist Persistence & Progress
  // =========================================================================
  const allCheckboxes = document.querySelectorAll('input[type="checkbox"][data-check]');
  const readinessScoreEl = document.getElementById('readinessScore');
  const readinessBarEl = document.getElementById('readinessBar');

  // Load saved state
  allCheckboxes.forEach(cb => {
    const key = `matlab_check_${cb.dataset.check}`;
    const isChecked = localStorage.getItem(key) === 'true';
    cb.checked = isChecked;
    if (isChecked) {
      cb.closest('.check-item').classList.add('checked');
    }

    cb.addEventListener('change', () => {
      localStorage.setItem(key, cb.checked);
      if (cb.checked) {
        cb.closest('.check-item').classList.add('checked');
      } else {
        cb.closest('.check-item').classList.remove('checked');
      }
      updateReadinessProgress();
    });
  });

  function updateReadinessProgress() {
    const total = allCheckboxes.length;
    if (total === 0) return;
    const checkedCount = Array.from(allCheckboxes).filter(cb => cb.checked).length;
    const percent = Math.round((checkedCount / total) * 100);

    if (readinessScoreEl) readinessScoreEl.textContent = `${percent}%`;
    if (readinessBarEl) readinessBarEl.style.width = `${percent}%`;
  }
  updateReadinessProgress();

  // =========================================================================
  // Interactive Calculators
  // =========================================================================

  // --- Calculator 1: Metallography Optics & Grain Size ---
  const exp1CalcBtn = document.getElementById('exp1-calc-btn');
  if (exp1CalcBtn) {
    exp1CalcBtn.addEventListener('click', () => {
      const eye = parseFloat(document.getElementById('exp1-eye').value) || 10;
      const obj = parseFloat(document.getElementById('exp1-obj').value) || 10;
      const N = parseFloat(document.getElementById('exp1-grains').value) || 32;

      const totalMag = eye * obj;
      // N = 2^(G - 1) => G - 1 = log2(N) => G = 1 + (ln(N) / ln(2))
      const astmG = (1 + (Math.log(Math.max(1, N)) / Math.LN2)).toFixed(1);
      // Rough mean grain diameter from ASTM G: d ≈ 0.25 / (2^((G-1)/2)) in mm
      const diaMicrons = (250 / Math.pow(2, (parseFloat(astmG) - 1) / 2)).toFixed(1);

      document.getElementById('exp1-out-mag').textContent = `${totalMag}X`;
      document.getElementById('exp1-out-astm').textContent = `${astmG}`;
      document.getElementById('exp1-out-dia').textContent = `~${diaMicrons} µm`;
    });
  }

  // --- Calculator 2: Tensile Properties ---
  const exp2CalcBtn = document.getElementById('exp2-calc-btn');
  if (exp2CalcBtn) {
    exp2CalcBtn.addEventListener('click', () => {
      const L0 = parseFloat(document.getElementById('exp2-l0').value) || 50;
      const W0 = parseFloat(document.getElementById('exp2-w0').value) || 12.5;
      const t0 = parseFloat(document.getElementById('exp2-t0').value) || 3.0;

      const Py = (parseFloat(document.getElementById('exp2-py').value) || 10) * 1000; // N
      const Pmax = (parseFloat(document.getElementById('exp2-pmax').value) || 15) * 1000; // N
      const Pf = (parseFloat(document.getElementById('exp2-pf').value) || 12) * 1000; // N

      const Lf = parseFloat(document.getElementById('exp2-lf').value) || 60;
      const Wf = parseFloat(document.getElementById('exp2-wf').value) || 10;
      const tf = parseFloat(document.getElementById('exp2-tf').value) || 2.2;

      const A0 = W0 * t0;
      const Af = Wf * tf;

      const sy = Py / A0;
      const uts = Pmax / A0;
      const el = ((Lf - L0) / L0) * 100;
      const ra = Math.max(0, ((A0 - Af) / A0) * 100);

      document.getElementById('exp2-out-a0').textContent = `${A0.toFixed(2)} mm²`;
      document.getElementById('exp2-out-sy').textContent = `${sy.toFixed(1)} MPa`;
      document.getElementById('exp2-out-uts').textContent = `${uts.toFixed(1)} MPa`;
      document.getElementById('exp2-out-el').textContent = `${el.toFixed(1)}%`;
      document.getElementById('exp2-out-ra').textContent = `${ra.toFixed(1)}%`;
    });
  }

  // --- Calculator 3: Composite Batch Mixing ---
  const exp3CalcBtn = document.getElementById('exp3-calc-btn');
  if (exp3CalcBtn) {
    exp3CalcBtn.addEventListener('click', () => {
      const Wf = parseFloat(document.getElementById('exp3-wf').value) || 160;
      const ratio = parseFloat(document.getElementById('exp3-ratio').value) || 1.2;

      const totalMatrix = Wf * ratio;
      // 1 part hardener to 2 parts resin => 1/3 hardener, 2/3 resin
      const hardener = totalMatrix * (1 / 3);
      const resin = totalMatrix * (2 / 3);

      // Volume fraction estimate: assume rho_fiber = 2.54 g/cm3, rho_matrix = 1.15 g/cm3
      const vFiber = Wf / 2.54;
      const vMatrix = totalMatrix / 1.15;
      const Vf = ((vFiber / (vFiber + vMatrix)) * 100).toFixed(1);

      document.getElementById('exp3-out-matrix').textContent = `${totalMatrix.toFixed(1)} g`;
      document.getElementById('exp3-out-resin').textContent = `${resin.toFixed(1)} g`;
      document.getElementById('exp3-out-hard').textContent = `${hardener.toFixed(1)} g`;
      document.getElementById('exp3-out-vf').textContent = `~${Vf}%`;
    });
  }

  // --- Calculator 4: Impact Toughness ---
  const exp4CalcBtn = document.getElementById('exp4-calc-btn');
  if (exp4CalcBtn) {
    exp4CalcBtn.addEventListener('click', () => {
      const w = parseFloat(document.getElementById('exp4-w').value) || 12.7;
      const h = parseFloat(document.getElementById('exp4-h').value) || 10.16;
      const k = parseFloat(document.getElementById('exp4-k').value) || 18.5;
      const e0 = parseFloat(document.getElementById('exp4-e0').value) || 0.2;

      const netArea = w * h;
      const netEnergy = Math.max(0, k - e0);
      const isJmm2 = netEnergy / netArea;
      const isKJm2 = isJmm2 * 1000;

      document.getElementById('exp4-out-area').textContent = `${netArea.toFixed(2)} mm²`;
      document.getElementById('exp4-out-netenergy').textContent = `${netEnergy.toFixed(2)} J`;
      document.getElementById('exp4-out-is').textContent = `${isJmm2.toFixed(3)} J/mm² (${isKJm2.toFixed(1)} kJ/m²)`;
    });
  }

  // --- Calculator 5: Vernier Scale & Crack Length ---
  const exp5CalcBtn = document.getElementById('exp5-calc-btn');
  if (exp5CalcBtn) {
    exp5CalcBtn.addEventListener('click', () => {
      const smd = parseFloat(document.getElementById('exp5-smd').value) || 0.5;
      const vsd = parseFloat(document.getElementById('exp5-vsd').value) || 50;
      const lc = smd / vsd;
      document.getElementById('exp5-out-lc').value = `${lc.toFixed(3)} mm`;

      const r1a = parseFloat(document.getElementById('exp5-r1a').value) || 12.5;
      const r2a = parseFloat(document.getElementById('exp5-r2a').value) || 15.82;
      const a1 = Math.abs(r2a - r1a);

      const r1b = parseFloat(document.getElementById('exp5-r1b').value) || 12.5;
      const r2b = parseFloat(document.getElementById('exp5-r2b').value) || 16.14;
      const a2 = Math.abs(r2b - r1b);

      const r1c = parseFloat(document.getElementById('exp5-r1c').value) || 12.5;
      const r2c = parseFloat(document.getElementById('exp5-r2c').value) || 15.78;
      const a3 = Math.abs(r2c - r1c);

      const aAvg = (a1 + a2 + a3) / 3;

      document.getElementById('exp5-out-a1').textContent = `${a1.toFixed(2)} mm`;
      document.getElementById('exp5-out-a2').textContent = `${a2.toFixed(2)} mm`;
      document.getElementById('exp5-out-a3').textContent = `${a3.toFixed(2)} mm`;
      document.getElementById('exp5-out-avg').textContent = `${aAvg.toFixed(2)} mm`;
    });
  }

  // --- Calculator 6: Rotating Bending Fatigue ---
  const exp6CalcBtn = document.getElementById('exp6-calc-btn');
  if (exp6CalcBtn) {
    exp6CalcBtn.addEventListener('click', () => {
      const w = parseFloat(document.getElementById('exp6-w').value) || 12.0; // kg
      const l = parseFloat(document.getElementById('exp6-l').value) || 100; // mm
      const d = parseFloat(document.getElementById('exp6-d').value) || 8.0; // mm
      const rpm = parseFloat(document.getElementById('exp6-rpm').value) || 3500;
      const nf = parseFloat(document.getElementById('exp6-nf').value) || 284000;

      // Applied force F = W * 9.81 N
      const F = w * 9.80665;
      // Moment M = F * (l / 2)
      const M = (F * l) / 2; // N*mm
      // Z = pi * d^3 / 32
      const Z = (Math.PI * Math.pow(d, 3)) / 32;
      const sa = M / Z; // MPa

      // Duration: minutes = Nf / rpm
      const totalMinutes = nf / rpm;
      const hours = Math.floor(totalMinutes / 60);
      const mins = Math.floor(totalMinutes % 60);
      const secs = Math.round((totalMinutes * 60) % 60);

      document.getElementById('exp6-out-m').textContent = `${M.toFixed(1)} N·mm (${(M / 1000).toFixed(2)} N·m)`;
      document.getElementById('exp6-out-z').textContent = `${Z.toFixed(2)} mm³`;
      document.getElementById('exp6-out-sa').textContent = `${sa.toFixed(1)} MPa`;
      document.getElementById('exp6-out-time').textContent = `${hours}h ${mins}m ${secs}s`;
    });
  }

  // --- Calculator 7: Vickers Hardness ---
  const exp7CalcBtn = document.getElementById('exp7-calc-btn');
  if (exp7CalcBtn) {
    exp7CalcBtn.addEventListener('click', () => {
      const P = parseFloat(document.getElementById('exp7-p').value) || 10;
      const d1 = parseFloat(document.getElementById('exp7-d1').value) || 0.345;
      const d2 = parseFloat(document.getElementById('exp7-d2').value) || 0.349;

      const d = (d1 + d2) / 2;
      const hv = (1.8544 * P) / (d * d);

      // Approximations for structural steel:
      const bhn = (hv * 0.95).toFixed(0);
      // HRB approx = 130 - (500 / sqrt(HV))
      const hrb = Math.min(100, Math.max(0, 130 - (500 / Math.sqrt(hv)))).toFixed(0);

      document.getElementById('exp7-out-d').textContent = `${d.toFixed(4)} mm`;
      document.getElementById('exp7-out-hv').textContent = `${hv.toFixed(1)} HV${P}`;
      document.getElementById('exp7-out-bhn').textContent = `~${bhn} BHN`;
      document.getElementById('exp7-out-hrb').textContent = `~${hrb} HRB`;
    });
  }

  // --- Calculator 8: Heat Treatment Simulator ---
  const exp8CalcBtn = document.getElementById('exp8-calc-btn');
  if (exp8CalcBtn) {
    exp8CalcBtn.addEventListener('click', () => {
      const carbon = parseFloat(document.getElementById('exp8-carbon').value);
      const proc = document.getElementById('exp8-process').value;

      let phase = '';
      let hv = '';
      let duct = '';
      let app = '';

      if (carbon === 0.18) {
        // Mild steel
        if (proc === 'as-received') {
          phase = 'Equiaxed Ferrite (~80%) + Pearlite (~20%)';
          hv = '130–145 HV (75 HRB)';
          duct = 'High (~26% EL)';
          app = 'General structural framing, cold forming, shafts';
        } else if (proc === 'annealed') {
          phase = 'Coarse Polygonal Ferrite + Coarse Pearlite';
          hv = '110–125 HV (65 HRB)';
          duct = 'Maximum (~32% EL)';
          app = 'Deep drawing, stamping, optimum machinability';
        } else if (proc === 'normalized') {
          phase = 'Fine Equiaxed Ferrite + Fine Lamellar Pearlite';
          hv = '150–175 HV (82 HRB)';
          duct = 'Balanced (~24% EL)';
          app = 'Enhanced toughness, grain refinement, load gears';
        } else if (proc === 'quenched') {
          phase = 'Lath Martensite + Retained Proeutectoid Ferrite';
          hv = '280–360 HV (28–36 HRC)';
          duct = 'Low (~8% EL, Brittle)';
          app = 'Needs immediate tempering to prevent quench cracking';
        } else if (proc === 'tempered') {
          phase = 'Tempered Martensite (Ferrite + fine Fe₃C spheroids)';
          hv = '190–225 HV (90 HRB / 18 HRC)';
          duct = 'High (~20% EL, Tough)';
          app = 'Automotive axles, structural bolts, heavy duty pins';
        }
      } else if (carbon === 0.45) {
        // Medium carbon
        if (proc === 'quenched') {
          phase = 'Plate/Lath Martensite (Hard)';
          hv = '550–620 HV (52–56 HRC)';
          duct = 'Very Low (<3% EL)';
          app = 'High hardness dies, cutting edges';
        } else if (proc === 'tempered') {
          phase = 'Fine Tempered Martensite';
          hv = '320–380 HV (32–39 HRC)';
          duct = 'Moderate (~15% EL)';
          app = 'Connecting rods, engine crankshafts, transmission gears';
        } else {
          phase = 'Ferrite (~50%) + Pearlite (~50%)';
          hv = '180–220 HV (90 HRB)';
          duct = 'Good (~18% EL)';
          app = 'Forgings, machine spindles, rail axles';
        }
      } else {
        // High carbon 0.8%
        if (proc === 'quenched') {
          phase = '100% Acicular Martensite + Retained Austenite';
          hv = '700–850 HV (60–65 HRC)';
          duct = 'Extremely Brittle (<1% EL)';
          app = 'Hardened file teeth, razor blades, ball bearings';
        } else if (proc === 'tempered') {
          phase = 'Sorbite / Tempered Martensite';
          hv = '450–520 HV (45–50 HRC)';
          duct = 'Resilient (~10% EL)';
          app = 'Leaf & coil springs, chisels, punches';
        } else {
          phase = '100% Eutectoid Lamellar Pearlite';
          hv = '240–280 HV (25 HRC)';
          duct = 'Moderate (~12% EL)';
          app = 'Rail tracks, high-tensile wire ropes';
        }
      }

      document.getElementById('exp8-out-phase').textContent = phase;
      document.getElementById('exp8-out-hv').textContent = hv;
      document.getElementById('exp8-out-duct').textContent = duct;
      document.getElementById('exp8-out-app').textContent = app;
    });
  }

  // =========================================================================
  // Global Search Engine
  // =========================================================================
  const searchInput = document.getElementById('globalSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const searchResultsSection = document.getElementById('searchResultsSection');
  const searchResultsList = document.getElementById('searchResultsList');
  const searchQueryDisplay = document.getElementById('searchQueryDisplay');
  const closeSearchPanel = document.getElementById('closeSearchPanel');

  if (searchInput) {
    let desktopSearchDebounce = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(desktopSearchDebounce);
      const query = searchInput.value.trim().toLowerCase();
      if (query.length > 0) {
        clearSearchBtn.style.display = 'block';
        desktopSearchDebounce = setTimeout(() => performSearch(query), 120);
      } else {
        clearSearchBtn.style.display = 'none';
        searchResultsSection.style.display = 'none';
      }
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearSearchBtn.style.display = 'none';
      searchResultsSection.style.display = 'none';
      searchInput.focus();
    });

    closeSearchPanel.addEventListener('click', () => {
      searchResultsSection.style.display = 'none';
    });
  }

  function performSearch(query) {
    searchResultsSection.style.display = 'block';
    searchQueryDisplay.textContent = query;
    searchResultsList.innerHTML = '';

    const matches = [];

    // Search Viva Database
    allVivaQuestions.forEach(item => {
      if (item.question.toLowerCase().includes(query) || item.answer.toLowerCase().includes(query)) {
        matches.push({
          type: 'Viva Voce Question',
          expId: item.expId,
          title: item.question,
          snippet: item.answer.substring(0, 180) + '...',
          targetSubtab: 'viva'
        });
      }
    });

    // Search Headings & Procedures
    document.querySelectorAll('.exp-article').forEach(art => {
      const expId = art.id.replace('-content', '');
      const heading = art.querySelector('.exp-heading')?.textContent || '';
      const summary = art.querySelector('.exp-summary')?.textContent || '';

      if (heading.toLowerCase().includes(query) || summary.toLowerCase().includes(query)) {
        matches.push({
          type: 'Experiment Overview',
          expId: expId,
          title: heading,
          snippet: summary.substring(0, 160) + '...',
          targetSubtab: 'procedure'
        });
      }
    });

    if (matches.length === 0) {
      searchResultsList.innerHTML = `<div class="result-card"><p>No direct matches found for "${query}". Try searching for terms like <em>martensite, vernier, impact, charpy, vickers, ASTM E8, nital</em>.</p></div>`;
      return;
    }

    matches.slice(0, 15).forEach(m => {
      const card = document.createElement('div');
      card.className = 'result-card';
      card.innerHTML = `
        <span class="result-badge">${m.type} • ${m.expId.toUpperCase()}</span>
        <h4 class="result-title">${highlightQuery(m.title, query)}</h4>
        <p class="result-snippet">${highlightQuery(m.snippet, query)}</p>
      `;

      card.addEventListener('click', () => {
        switchExperiment(m.expId);
        // Switch to the target subtab
        const art = document.getElementById(`${m.expId}-content`);
        if (art) {
          const btn = art.querySelector(`.subtab-btn[data-target="${m.expId}-${m.targetSubtab}"]`);
          if (btn) btn.click();
        }
        searchResultsSection.style.display = 'none';
      });

      searchResultsList.appendChild(card);
    });
  }

  function highlightQuery(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark style="background: rgba(56, 189, 248, 0.3); color: inherit; padding: 0 2px; border-radius: 2px;">$1</mark>');
  }

  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // =========================================================================
  // Viva Flashcard / Quiz Mode
  // =========================================================================
  const quizModeBtn = document.getElementById('quizModeBtn');
  const quizModal = document.getElementById('quizModal');
  const closeQuizBtn = document.getElementById('closeQuizBtn');
  const flashcard = document.getElementById('flashcard');
  const flipCardBtn = document.getElementById('flipCardBtn');
  const prevCardBtn = document.getElementById('prevCardBtn');
  const nextCardBtn = document.getElementById('nextCardBtn');
  const quizQuestionText = document.getElementById('quizQuestionText');
  const quizAnswerText = document.getElementById('quizAnswerText');
  const quizExpBadge = document.getElementById('quizExpBadge');
  const quizProgressText = document.getElementById('quizProgressText');

  function initVivaDatabase() {
    allVivaQuestions = [];
    document.querySelectorAll('.exp-article').forEach(art => {
      const expId = art.id.replace('-content', '');
      const expName = art.querySelector('.exp-heading')?.textContent || expId;

      art.querySelectorAll('.viva-card').forEach((vc, idx) => {
        const q = vc.querySelector('.viva-q h4')?.textContent || '';
        const a = vc.querySelector('.viva-a')?.innerHTML || '';

        allVivaQuestions.push({
          expId: expId,
          expName: expName,
          index: idx + 1,
          question: q,
          answer: a
        });
      });
    });
  }

  if (quizModeBtn && quizModal) {
    quizModeBtn.addEventListener('click', () => {
      openQuiz();
    });

    closeQuizBtn.addEventListener('click', () => {
      quizModal.classList.remove('active');
    });

    // Close on backdrop click
    quizModal.addEventListener('click', (e) => {
      if (e.target === quizModal) {
        quizModal.classList.remove('active');
      }
    });

    // Flip card trigger
    flashcard.addEventListener('click', () => {
      flashcard.classList.toggle('flipped');
    });

    flipCardBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      flashcard.classList.toggle('flipped');
    });

    // Keyboard navigation: Space to flip, Arrow keys to navigate
    document.addEventListener('keydown', (e) => {
      if (!quizModal.classList.contains('active')) return;

      if (e.code === 'Space') {
        e.preventDefault();
        flashcard.classList.toggle('flipped');
      } else if (e.code === 'ArrowRight') {
        goToNextCard();
      } else if (e.code === 'ArrowLeft') {
        goToPrevCard();
      } else if (e.code === 'Escape') {
        quizModal.classList.remove('active');
      }
    });

    nextCardBtn.addEventListener('click', goToNextCard);
    prevCardBtn.addEventListener('click', goToPrevCard);
  }

  function openQuiz() {
    // Find index of first question in current experiment
    const firstMatch = allVivaQuestions.findIndex(q => q.expId === currentExpId);
    currentQuizIndex = firstMatch >= 0 ? firstMatch : 0;
    renderQuizCard();
    quizModal.classList.add('active');
  }

  function renderQuizCard() {
    if (allVivaQuestions.length === 0) return;
    const cardData = allVivaQuestions[currentQuizIndex];

    flashcard.classList.remove('flipped');
    quizExpBadge.textContent = `${cardData.expId.toUpperCase()} • Q${cardData.index}`;
    quizProgressText.textContent = `Card ${currentQuizIndex + 1} of ${allVivaQuestions.length}`;
    quizQuestionText.textContent = cardData.question;
    quizAnswerText.innerHTML = cardData.answer;
  }

  function goToNextCard() {
    if (currentQuizIndex < allVivaQuestions.length - 1) {
      currentQuizIndex++;
      renderQuizCard();
    } else {
      // Loop back to start
      currentQuizIndex = 0;
      renderQuizCard();
    }
  }

  function goToPrevCard() {
    if (currentQuizIndex > 0) {
      currentQuizIndex--;
      renderQuizCard();
    } else {
      currentQuizIndex = allVivaQuestions.length - 1;
      renderQuizCard();
    }
  }


  // =========================================================================
  // 17. INTERACTIVE LAB SIMULATIONS
  // =========================================================================

  // ── 1. Virtual Metallurgical Microscope Simulation ───────────────────────
  initMicroscopeSimulation();
  function initMicroscopeSimulation() {
    const canvas = document.getElementById('microscopeCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const sampleSelect = document.getElementById('exp1-sample-select');
    const focusSlider = document.getElementById('exp1-focus-slider');
    const lightSlider = document.getElementById('exp1-light-slider');
    const focusText = document.getElementById('focusValText');
    const lightText = document.getElementById('lightValText');
    const reticleToggle = document.getElementById('exp1-reticle-toggle');
    const reticleOverlay = document.getElementById('reticleOverlay');
    const turretBtns = document.querySelectorAll('#exp1-turret .turret-btn');
    const scaleBarLabel = document.getElementById('scaleBarLabel');

    let currentSample = 'mild-steel';
    let currentMag = 100;
    let focusVal = 85;
    let lightVal = 85;

    // Specimen database
    const specimenData = {
      'mild-steel': {
        title: '0.2% C Hypoeutectoid Mild Steel',
        phase: 'FERRITE + PEARLITE',
        desc: 'Light polygonal matrix represents soft, ductile alpha-ferrite (\u03B1). The dark etched colonies are lamellar pearlite (\u03B1 + Fe\u2083C) formed by eutectoid decomposition at 727\u00B0C.',
        hardness: '130\u2013150 HV',
        etchant: '2% Nital (10 sec)'
      },
      'eutectoid': {
        title: '0.8% C Eutectoid High Carbon Steel',
        phase: '100% LAMELLAR PEARLITE',
        desc: 'Microstructure consists entirely of fine fingerprint-like colonies of alternating alpha-ferrite and cementite (Fe\u2083C) plates with interlamellar spacing of ~0.2 \u00B5m.',
        hardness: '240\u2013280 HV',
        etchant: '2% Nital (8 sec)'
      },
      'martensite': {
        title: 'Water-Quenched Carbon Steel (Martensite)',
        phase: 'BCT MARTENSITE LATHS',
        desc: 'Diffusionless shear transformation results in highly strained body-centered tetragonal (BCT) needle-like acicular laths with high dislocation density and extreme hardness.',
        hardness: '650\u2013750 HV (60+ HRC)',
        etchant: '4% Picral or 2% Nital'
      },
      'gray-iron': {
        title: 'Class 30 Gray Cast Iron',
        phase: 'FLAKE GRAPHITE IN PEARLITE',
        desc: 'Interconnected 3D graphite flakes in a pearlitic matrix. Flake tips act as internal stress-raisers, giving excellent machinability and vibration damping but low tensile ductility.',
        hardness: '180\u2013220 HBW',
        etchant: '2% Nital (15 sec)'
      },
      'ductile-iron': {
        title: 'Ductile / Spheroidal Graphite (SG) Iron',
        phase: 'SPHEROIDAL GRAPHITE NODULES',
        desc: 'Treated with magnesium/cerium to nucleate spherical graphite nodules surrounded by a "bulls-eye" ferrite ring in a pearlite matrix, yielding high elongation and impact toughness.',
        hardness: '170\u2013210 HBW',
        etchant: '2% Nital (12 sec)'
      },
      'brass': {
        title: '\u03B1+\u03B2\u2032 60:40 Muntz Brass (Cu-40Zn)',
        phase: 'DUAL PHASE \u03B1 + \u03B2\u2032 BRASS',
        desc: 'Light-etching needle-like alpha phase (FCC) distributed within a dark-etching beta-prime ordered BCC matrix. Excellent for hot stamping and valve bodies.',
        hardness: '105\u2013125 HV',
        etchant: "Ferric chloride + HCl solution"
      }
    };

    function updateIntelCard(key) {
      const data = specimenData[key];
      if (!data) return;
      const tag = document.getElementById('intelTagPhase');
      const title = document.getElementById('intelTitle');
      const desc = document.getElementById('intelDesc');
      const hardness = document.getElementById('intelHardness');
      const etchant = document.getElementById('intelEtchant');
      if (tag) tag.textContent = data.phase;
      if (title) title.textContent = data.title;
      if (desc) desc.textContent = data.desc;
      if (hardness) hardness.textContent = data.hardness;
      if (etchant) etchant.textContent = data.etchant;
    }

    // Seeded random pseudo-generator for consistent grains
    function pseudoRandom(seed) {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    }

    function renderMicroscope() {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Base background
      const lightFactor = lightVal / 100;
      const blurAmount = Math.abs(focusVal - 85) / 12; // 85 is sharpest
      ctx.filter = `blur(${blurAmount}px) brightness(${lightFactor})`;

      ctx.save();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
      ctx.clip();

      const scale = currentMag === 100 ? 1 : currentMag === 400 ? 2.5 : 5.5;

      if (currentSample === 'mild-steel') {
        // Polygonal Ferrite + Pearlite patches
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(0, 0, w, h);

        const cols = Math.floor(14 * scale);
        const rows = Math.floor(14 * scale);
        const cellW = w / cols;
        const cellH = h / rows;

        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const seed = i * 73 + j * 97;
            const r = pseudoRandom(seed);
            const cx = (i + 0.5) * cellW + (pseudoRandom(seed + 1) - 0.5) * cellW * 0.4;
            const cy = (j + 0.5) * cellH + (pseudoRandom(seed + 2) - 0.5) * cellH * 0.4;

            ctx.beginPath();
            ctx.ellipse(cx, cy, cellW * 0.55, cellH * 0.55, pseudoRandom(seed + 3) * Math.PI, 0, Math.PI * 2);
            
            // 20% pearlite colonies (dark)
            if (r < 0.22) {
              ctx.fillStyle = '#2d3748';
              ctx.fill();
              // Lamellae stripes inside pearlite
              ctx.strokeStyle = '#718096';
              ctx.lineWidth = 1;
              for (let k = -cellW * 0.4; k < cellW * 0.4; k += 3) {
                ctx.beginPath();
                ctx.moveTo(cx + k, cy - cellH * 0.4);
                ctx.lineTo(cx + k + 2, cy + cellH * 0.4);
                ctx.stroke();
              }
            } else {
              // Ferrite grain
              const shade = 210 + Math.floor(pseudoRandom(seed + 4) * 35);
              ctx.fillStyle = `rgb(${shade}, ${shade + 4}, ${shade + 8})`;
              ctx.fill();
            }

            // Grain boundaries
            ctx.strokeStyle = 'rgba(74, 85, 104, 0.7)';
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }
        }
      } else if (currentSample === 'eutectoid') {
        // 100% Lamellar Pearlite
        ctx.fillStyle = '#2b3648';
        ctx.fillRect(0, 0, w, h);

        const numColonies = Math.floor(25 * scale);
        for (let c = 0; c < numColonies; c++) {
          const seed = c * 139;
          const cx = pseudoRandom(seed) * w;
          const cy = pseudoRandom(seed + 1) * h;
          const radius = (35 + pseudoRandom(seed + 2) * 55) * (scale > 2 ? 1.5 : 1);
          const angle = pseudoRandom(seed + 3) * Math.PI;

          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.clip();

          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = scale > 2 ? 2.5 : 1.2;
          const spacing = scale > 2 ? 6 : 3.5;
          for (let d = -radius * 1.5; d < radius * 1.5; d += spacing) {
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * d - Math.sin(angle) * radius, cy + Math.sin(angle) * d + Math.cos(angle) * radius);
            ctx.lineTo(cx + Math.cos(angle) * d + Math.sin(angle) * radius, cy + Math.sin(angle) * d - Math.cos(angle) * radius);
            ctx.stroke();
          }
          ctx.restore();

          // Colony boundaries
          ctx.strokeStyle = '#1a202c';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (currentSample === 'martensite') {
        // Acicular Martensite Needles
        ctx.fillStyle = '#64748b';
        ctx.fillRect(0, 0, w, h);

        const numNeedles = Math.floor(280 * scale);
        for (let n = 0; n < numNeedles; n++) {
          const seed = n * 59;
          const x = pseudoRandom(seed) * w;
          const y = pseudoRandom(seed + 1) * h;
          const len = (25 + pseudoRandom(seed + 2) * 65) * (scale / 1.5);
          const ang = (Math.floor(pseudoRandom(seed + 3) * 4) * 45 + pseudoRandom(seed + 4) * 12) * Math.PI / 180;

          ctx.beginPath();
          ctx.moveTo(x - Math.cos(ang) * len * 0.5, y - Math.sin(ang) * len * 0.5);
          ctx.lineTo(x + Math.cos(ang) * len * 0.5, y + Math.sin(ang) * len * 0.5);
          ctx.strokeStyle = pseudoRandom(seed + 5) > 0.4 ? '#1e293b' : '#334155';
          ctx.lineWidth = (1 + pseudoRandom(seed + 6) * 2.2) * (scale > 2 ? 1.6 : 1);
          ctx.stroke();
        }
      } else if (currentSample === 'gray-iron') {
        // Graphite Flakes in Pearlite
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(0, 0, w, h);

        const numFlakes = Math.floor(75 * scale);
        for (let f = 0; f < numFlakes; f++) {
          const seed = f * 179;
          const x = pseudoRandom(seed) * w;
          const y = pseudoRandom(seed + 1) * h;
          const len = (35 + pseudoRandom(seed + 2) * 55) * (scale / 1.5);

          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.bezierCurveTo(
            x + (pseudoRandom(seed + 3) - 0.5) * len, y + (pseudoRandom(seed + 4) - 0.5) * len,
            x + (pseudoRandom(seed + 5) - 0.5) * len, y + (pseudoRandom(seed + 6) - 0.5) * len,
            x + len * 0.8, y + (pseudoRandom(seed + 7) - 0.5) * len * 0.5
          );
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = (2.5 + pseudoRandom(seed + 8) * 2) * (scale > 2 ? 1.5 : 1);
          ctx.stroke();
        }
      } else if (currentSample === 'ductile-iron') {
        // Nodular Spheroids with Bulls-eye Ferrite Ring
        ctx.fillStyle = '#64748b'; // Pearlite matrix
        ctx.fillRect(0, 0, w, h);

        const numNodules = Math.floor(35 * scale);
        for (let n = 0; n < numNodules; n++) {
          const seed = n * 211;
          const cx = pseudoRandom(seed) * w;
          const cy = pseudoRandom(seed + 1) * h;
          const coreR = (12 + pseudoRandom(seed + 2) * 16) * (scale / 2);
          const ringR = coreR * 2.1;

          // Ferrite halo (bulls-eye)
          ctx.beginPath();
          ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
          ctx.fillStyle = '#e2e8f0';
          ctx.fill();
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Spheroidal graphite nodule (dark core)
          ctx.beginPath();
          ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
          ctx.fillStyle = '#0f172a';
          ctx.fill();
        }
      } else if (currentSample === 'brass') {
        // Alpha-Beta Brass (Dual Phase)
        ctx.fillStyle = '#b45309'; // Beta prime dark matrix
        ctx.fillRect(0, 0, w, h);

        const numGrains = Math.floor(90 * scale);
        for (let g = 0; g < numGrains; g++) {
          const seed = g * 89;
          const x = pseudoRandom(seed) * w;
          const y = pseudoRandom(seed + 1) * h;
          const len = (25 + pseudoRandom(seed + 2) * 50) * (scale / 1.5);
          const ang = pseudoRandom(seed + 3) * Math.PI;

          ctx.beginPath();
          ctx.ellipse(x, y, len, len * 0.35, ang, 0, Math.PI * 2);
          ctx.fillStyle = '#fde68a'; // Alpha needle bright
          ctx.fill();
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }

      ctx.restore();
      ctx.filter = 'none';

      // Update scale bar label
      if (scaleBarLabel) {
        scaleBarLabel.textContent = currentMag === 100 ? '100 \u00B5m' : currentMag === 400 ? '25 \u00B5m' : '10 \u00B5m';
      }
    }

    // Event Listeners
    if (sampleSelect) {
      sampleSelect.addEventListener('change', () => {
        currentSample = sampleSelect.value;
        updateIntelCard(currentSample);
        renderMicroscope();
      });
    }

    let microRaf = null;
    function scheduleMicroscopeRender() {
      if (!microRaf) {
        microRaf = requestAnimationFrame(() => {
          microRaf = null;
          renderMicroscope();
        });
      }
    }

    if (focusSlider) {
      focusSlider.addEventListener('input', () => {
        focusVal = parseInt(focusSlider.value, 10);
        const diff = Math.abs(focusVal - 85);
        if (focusText) {
          focusText.textContent = diff < 5 ? 'Sharp (100%)' : diff < 15 ? 'Good (80%)' : 'Defocused';
        }
        scheduleMicroscopeRender();
      });
    }

    if (lightSlider) {
      lightSlider.addEventListener('input', () => {
        lightVal = parseInt(lightSlider.value, 10);
        if (lightText) lightText.textContent = `${lightVal}%`;
        scheduleMicroscopeRender();
      });
    }

    turretBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        turretBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMag = parseInt(btn.dataset.mag, 10);
        renderMicroscope();
      });
    });

    if (reticleToggle && reticleOverlay) {
      reticleToggle.addEventListener('change', () => {
        reticleOverlay.style.display = reticleToggle.checked ? 'block' : 'none';
      });
    }

    renderMicroscope();
  }

  // ── 2. Virtual UTM Tensile Test Simulator ────────────────────────────────
  initUtmSimulation();
  function initUtmSimulation() {
    const machineCanvas = document.getElementById('utmMachineCanvas');
    const graphCanvas = document.getElementById('utmGraphCanvas');
    if (!machineCanvas || !graphCanvas) return;

    const mCtx = machineCanvas.getContext('2d');
    const gCtx = graphCanvas.getContext('2d');
    const startBtn = document.getElementById('utmStartBtn');
    const resetBtn = document.getElementById('utmResetBtn');
    const matSelect = document.getElementById('exp2-mat-select');

    const hudDisp = document.getElementById('hudDisp');
    const hudForce = document.getElementById('hudForce');
    const phaseTag = document.getElementById('utmPhaseTag');
    const stressVal = document.getElementById('utmStressVal');
    const strainVal = document.getElementById('utmStrainVal');
    const yieldVal = document.getElementById('utmYieldVal');
    const utsVal = document.getElementById('utmUtsVal');

    let animId = null;
    let t = 0;
    let isRunning = false;
    let isBroken = false;
    let currentMat = 'mild-steel';

    // Tensile constitutive model parameters
    const matParams = {
      'mild-steel': {
        E: 205000,
        syUpper: 320,
        syLower: 280,
        uts: 460,
        fractureStress: 360,
        eElastic: 0.0015,
        eYieldEnd: 0.025,
        eUts: 0.16,
        eFracture: 0.28,
        a0: 122.7, // mm² (Ø12.5mm)
        l0: 50     // mm
      },
      'al-6061': {
        E: 70000,
        syUpper: 275,
        syLower: 275,
        uts: 310,
        fractureStress: 240,
        eElastic: 0.0039,
        eYieldEnd: 0.005,
        eUts: 0.11,
        eFracture: 0.17,
        a0: 122.7,
        l0: 50
      },
      'cast-iron': {
        E: 110000,
        syUpper: 195,
        syLower: 195,
        uts: 200,
        fractureStress: 200,
        eElastic: 0.0018,
        eYieldEnd: 0.0018,
        eUts: 0.004,
        eFracture: 0.005,
        a0: 122.7,
        l0: 50
      }
    };

    function getStressStrain(strain, p) {
      if (strain <= p.eElastic) {
        return (strain / p.eElastic) * p.syUpper;
      } else if (strain <= p.eYieldEnd) {
        // Yield plateau with ripple
        const progress = (strain - p.eElastic) / (p.eYieldEnd - p.eElastic);
        return p.syLower + Math.sin(progress * Math.PI * 6) * 6;
      } else if (strain <= p.eUts) {
        // Strain hardening
        const progress = (strain - p.eYieldEnd) / (p.eUts - p.eYieldEnd);
        return p.syLower + (p.uts - p.syLower) * Math.sin(progress * Math.PI * 0.5);
      } else if (strain <= p.eFracture) {
        // Necking drop
        const progress = (strain - p.eUts) / (p.eFracture - p.eUts);
        return p.uts - (p.uts - p.fractureStress) * progress;
      }
      return 0;
    }

    function drawMachine(strain) {
      const w = machineCanvas.width;
      const h = machineCanvas.height;
      mCtx.clearRect(0, 0, w, h);

      // Frame columns (solid steel)
      mCtx.fillStyle = '#1e293b';
      mCtx.fillRect(25, 20, 20, h - 40);
      mCtx.fillRect(w - 45, 20, 20, h - 40);

      // Base bed
      mCtx.fillStyle = '#334155';
      mCtx.fillRect(15, h - 50, w - 30, 35);

      // Top fixed crosshead
      mCtx.fillRect(15, 20, w - 30, 28);

      // Moving crosshead position (starts at y=120, moves up or down based on strain)
      const maxDisplacement = 45;
      const disp = Math.min(strain * 150, maxDisplacement);
      const crossheadY = 110 - disp;

      mCtx.fillStyle = '#475569';
      mCtx.fillRect(35, crossheadY, w - 70, 24);
      mCtx.fillStyle = '#60a5fa';
      mCtx.fillRect(w / 2 - 25, crossheadY + 6, 50, 12); // Load cell

      // Upper and Lower Grips
      mCtx.fillStyle = '#64748b';
      // Upper grip (moves with crosshead)
      mCtx.fillRect(w / 2 - 22, crossheadY + 24, 44, 30);
      // Lower fixed grip
      mCtx.fillRect(w / 2 - 22, h - 110, 44, 30);

      // Dogbone Specimen
      const topY = crossheadY + 54;
      const bottomY = h - 110;
      const gaugeLen = bottomY - topY;
      const midY = (topY + bottomY) / 2;

      // Necking factor
      const p = matParams[currentMat];
      const isNecking = strain > p.eUts;
      const neckRatio = isNecking ? Math.max(0.35, 1 - (strain - p.eUts) * 3.5) : 1;

      if (!isBroken) {
        mCtx.fillStyle = '#94a3b8';
        mCtx.beginPath();
        // Left side of dogbone
        mCtx.moveTo(w / 2 - 18, topY);
        mCtx.lineTo(w / 2 - 18, topY + 15);
        mCtx.bezierCurveTo(w / 2 - 18, topY + 30, w / 2 - 10 * neckRatio, midY - 20, w / 2 - 10 * neckRatio, midY);
        mCtx.bezierCurveTo(w / 2 - 10 * neckRatio, midY + 20, w / 2 - 18, bottomY - 30, w / 2 - 18, bottomY - 15);
        mCtx.lineTo(w / 2 - 18, bottomY);

        // Right side
        mCtx.lineTo(w / 2 + 18, bottomY);
        mCtx.lineTo(w / 2 + 18, bottomY - 15);
        mCtx.bezierCurveTo(w / 2 + 18, bottomY - 30, w / 2 + 10 * neckRatio, midY + 20, w / 2 + 10 * neckRatio, midY);
        mCtx.bezierCurveTo(w / 2 + 10 * neckRatio, midY - 20, w / 2 + 18, topY + 30, w / 2 + 18, topY + 15);
        mCtx.lineTo(w / 2 + 18, topY);
        mCtx.closePath();
        mCtx.fill();
        mCtx.strokeStyle = '#3b82f6';
        mCtx.lineWidth = 1.5;
        mCtx.stroke();

        // Gauge marks
        mCtx.fillStyle = '#10b981';
        mCtx.beginPath();
        mCtx.arc(w / 2, midY - 35, 3, 0, Math.PI * 2);
        mCtx.arc(w / 2, midY + 35, 3, 0, Math.PI * 2);
        mCtx.fill();
      } else {
        // Fractured pieces (Cup and Cone)
        mCtx.fillStyle = '#94a3b8';
        mCtx.strokeStyle = '#ef4444';
        mCtx.lineWidth = 1.5;

        // Top fractured half
        mCtx.beginPath();
        mCtx.moveTo(w / 2 - 18, topY);
        mCtx.lineTo(w / 2 - 18, topY + 15);
        mCtx.lineTo(w / 2 - 6, midY - 8);
        mCtx.lineTo(w / 2, midY - 15); // Cup
        mCtx.lineTo(w / 2 + 6, midY - 8);
        mCtx.lineTo(w / 2 + 18, topY + 15);
        mCtx.lineTo(w / 2 + 18, topY);
        mCtx.closePath();
        mCtx.fill();
        mCtx.stroke();

        // Bottom fractured half
        mCtx.beginPath();
        mCtx.moveTo(w / 2 - 18, bottomY);
        mCtx.lineTo(w / 2 - 18, bottomY - 15);
        mCtx.lineTo(w / 2 - 6, midY + 8);
        mCtx.lineTo(w / 2, midY + 3); // Cone
        mCtx.lineTo(w / 2 + 6, midY + 8);
        mCtx.lineTo(w / 2 + 18, bottomY - 15);
        mCtx.lineTo(w / 2 + 18, bottomY);
        mCtx.closePath();
        mCtx.fill();
        mCtx.stroke();
      }
    }

    function drawGraph(currentStrain) {
      const w = graphCanvas.width;
      const h = graphCanvas.height;
      gCtx.clearRect(0, 0, w, h);

      const p = matParams[currentMat];
      const maxStrain = p.eFracture * 1.15;
      const maxStress = p.uts * 1.25;

      const originX = 55;
      const originY = h - 40;
      const plotW = w - originX - 25;
      const plotH = originY - 30;

      // Grid lines
      gCtx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      gCtx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = originY - (plotH / 5) * i;
        gCtx.beginPath();
        gCtx.moveTo(originX, y);
        gCtx.lineTo(originX + plotW, y);
        gCtx.stroke();

        // Y-axis label (Stress in MPa)
        gCtx.fillStyle = '#64748b';
        gCtx.font = '10px JetBrains Mono';
        gCtx.textAlign = 'right';
        gCtx.fillText(`${Math.round((maxStress / 5) * i)}`, originX - 8, y + 3);
      }

      for (let j = 0; j <= 5; j++) {
        const x = originX + (plotW / 5) * j;
        gCtx.beginPath();
        gCtx.moveTo(x, originY);
        gCtx.lineTo(x, originY - plotH);
        gCtx.stroke();

        // X-axis label (Strain)
        gCtx.fillStyle = '#64748b';
        gCtx.font = '10px JetBrains Mono';
        gCtx.textAlign = 'center';
        gCtx.fillText(`${((maxStrain / 5) * j).toFixed(2)}`, x, originY + 16);
      }

      // Axis labels
      gCtx.fillStyle = '#94a3b8';
      gCtx.font = '11px Plus Jakarta Sans';
      gCtx.textAlign = 'center';
      gCtx.fillText('Engineering Strain (\u03B5 = \u0394L / L\u2080)', originX + plotW / 2, h - 8);

      gCtx.save();
      gCtx.translate(16, originY - plotH / 2);
      gCtx.rotate(-Math.PI / 2);
      gCtx.fillText('Engineering Stress (\u03C3, MPa)', 0, 0);
      gCtx.restore();

      // Plot curve up to currentStrain
      gCtx.beginPath();
      gCtx.moveTo(originX, originY);
      const steps = 120;
      const stepSize = currentStrain / steps;

      for (let s = 0; s <= steps; s++) {
        const e = s * stepSize;
        const sig = getStressStrain(e, p);
        const px = originX + (e / maxStrain) * plotW;
        const py = originY - (sig / maxStress) * plotH;
        if (s === 0) gCtx.moveTo(px, py);
        else gCtx.lineTo(px, py);
      }

      gCtx.strokeStyle = '#3b82f6';
      gCtx.lineWidth = 2.5;
      gCtx.stroke();

      // Current tracking dot
      if (currentStrain > 0) {
        const currentSig = getStressStrain(currentStrain, p);
        const curX = originX + (currentStrain / maxStrain) * plotW;
        const curY = originY - (currentSig / maxStress) * plotH;

        gCtx.beginPath();
        gCtx.arc(curX, curY, 5, 0, Math.PI * 2);
        gCtx.fillStyle = isBroken ? '#ef4444' : '#60a5fa';
        gCtx.fill();
        gCtx.strokeStyle = '#ffffff';
        gCtx.lineWidth = 2;
        gCtx.stroke();
      }
    }

    function runSimulationStep() {
      const p = matParams[currentMat];
      t += 0.0008; // Strain increment per frame
      const currentStrain = t;

      if (currentStrain >= p.eFracture) {
        isBroken = true;
        isRunning = false;
        phaseTag.textContent = 'SPECIMEN FRACTURED';
        phaseTag.style.background = 'rgba(239, 68, 68, 0.15)';
        phaseTag.style.color = '#f87171';
        drawMachine(p.eFracture);
        drawGraph(p.eFracture);
        return;
      }

      const curStress = getStressStrain(currentStrain, p);
      const curForce = (curStress * p.a0) / 1000; // kN
      const curDisp = currentStrain * p.l0; // mm

      // Update Phase tag
      if (currentStrain <= p.eElastic) {
        phaseTag.textContent = 'ELASTIC REGION (HOOKE\'S LAW)';
        phaseTag.style.color = '#60a5fa';
      } else if (currentStrain <= p.eYieldEnd) {
        phaseTag.textContent = 'YIELDING & L\u00DCDERS BANDS';
        phaseTag.style.color = '#34d399';
        yieldVal.textContent = `${p.syLower.toFixed(1)} MPa`;
      } else if (currentStrain <= p.eUts) {
        phaseTag.textContent = 'STRAIN HARDENING';
        phaseTag.style.color = '#fbbf24';
        utsVal.textContent = `${p.uts.toFixed(1)} MPa`;
      } else {
        phaseTag.textContent = 'PLASTIC NECKING INSTABILITY';
        phaseTag.style.color = '#f87171';
      }

      // Update HUD & Props
      hudDisp.textContent = `${curDisp.toFixed(2)} mm`;
      hudForce.textContent = `${curForce.toFixed(2)} kN`;
      stressVal.textContent = `${curStress.toFixed(1)} MPa`;
      strainVal.textContent = `${currentStrain.toFixed(4)}`;

      drawMachine(currentStrain);
      drawGraph(currentStrain);

      animId = requestAnimationFrame(runSimulationStep);
    }

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (!isRunning && !isBroken) {
          isRunning = true;
          startBtn.disabled = true;
          runSimulationStep();
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (animId) cancelAnimationFrame(animId);
        isRunning = false;
        isBroken = false;
        t = 0;
        startBtn.disabled = false;
        phaseTag.textContent = 'READY TO PULL';
        phaseTag.style.background = 'rgba(59, 130, 246, 0.15)';
        phaseTag.style.color = '#60a5fa';
        hudDisp.textContent = '0.00 mm';
        hudForce.textContent = '0.00 kN';
        stressVal.textContent = '0.0 MPa';
        strainVal.textContent = '0.0000';
        yieldVal.textContent = '\u2014';
        utsVal.textContent = '\u2014';
        drawMachine(0);
        drawGraph(0);
      });
    }

    if (matSelect) {
      matSelect.addEventListener('change', () => {
        currentMat = matSelect.value;
        if (resetBtn) resetBtn.click();
      });
    }

    drawMachine(0);
    drawGraph(0);
  }

  // ── 3. Virtual Charpy Impact Simulator ───────────────────────────────────
  initCharpySimulation();
  function initCharpySimulation() {
    const canvas = document.getElementById('charpyCanvas');
    const dbttCanvas = document.getElementById('dbttGraphCanvas');
    if (!canvas || !dbttCanvas) return;

    const ctx = canvas.getContext('2d');
    const dCtx = dbttCanvas.getContext('2d');
    const releaseBtn = document.getElementById('charpyReleaseBtn');
    const resetBtn = document.getElementById('charpyResetBtn');
    const tempSlider = document.getElementById('exp4-temp-slider');
    const tempValText = document.getElementById('exp4-temp-val');
    const energyDial = document.getElementById('charpyEnergyDial');
    const modeTag = document.getElementById('charpyModeTag');
    const fractureType = document.getElementById('charpyFractureType');
    const lateralExp = document.getElementById('charpyLateralExp');

    let currentTemp = 20;
    let isSwinging = false;
    let angle = -140 * Math.PI / 180; // Release angle (deg to rad)
    let vel = 0;
    let hasStruck = false;
    let absorbedEnergy = 0;
    let finalAngle = 0;
    let animId = null;

    // S-curve DBTT energy function for structural mild steel
    function getImpactEnergy(T) {
      // Upper shelf: 160J, Lower shelf: 12J, Transition mid-point: 10°C
      const upperShelf = 160;
      const lowerShelf = 12;
      const tMid = 10;
      const width = 25;
      return lowerShelf + (upperShelf - lowerShelf) / (1 + Math.exp(-(T - tMid) / (width / 2.5)));
    }

    function drawPendulum(currentAngle) {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const pivotX = w / 2;
      const pivotY = 55;
      const armLength = 220;

      // Anvil base & supports at bottom center
      ctx.fillStyle = '#334155';
      ctx.fillRect(pivotX - 50, pivotY + armLength + 10, 100, 25);

      // Specimen in anvil (centered at x=pivotX, y=pivotY + armLength)
      const specY = pivotY + armLength;
      if (!hasStruck) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(pivotX - 35, specY - 6, 70, 14);
        // V-Notch indicator
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(pivotX, specY - 6);
        ctx.lineTo(pivotX - 4, specY);
        ctx.lineTo(pivotX + 4, specY);
        ctx.fill();
      } else {
        // Fractured halves pushed aside
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(pivotX - 45, specY - 6, 32, 14);
        ctx.fillRect(pivotX + 13, specY - 6, 32, 14);
      }

      // Pendulum arm
      const hammerX = pivotX + Math.sin(currentAngle) * armLength;
      const hammerY = pivotY + Math.cos(currentAngle) * armLength;

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(hammerX, hammerY);
      ctx.stroke();

      // Heavy steel striker head
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(hammerX, hammerY, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Hardened striker knife blade
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(hammerX, hammerY);
      ctx.lineTo(hammerX + Math.cos(currentAngle) * 16, hammerY - Math.sin(currentAngle) * 16);
      ctx.lineTo(hammerX - Math.sin(currentAngle) * 10, hammerY + Math.cos(currentAngle) * 10);
      ctx.fill();

      // Top bearing mount
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    function drawDBTTGraph() {
      const w = dbttCanvas.width;
      const h = dbttCanvas.height;
      dCtx.clearRect(0, 0, w, h);

      const originX = 50;
      const originY = h - 35;
      const plotW = w - originX - 25;
      const plotH = originY - 25;

      // Axes
      dCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      dCtx.lineWidth = 1;
      dCtx.beginPath();
      dCtx.moveTo(originX, originY);
      dCtx.lineTo(originX + plotW, originY);
      dCtx.moveTo(originX, originY);
      dCtx.lineTo(originX, originY - plotH);
      dCtx.stroke();

      // S-Curve plot
      dCtx.beginPath();
      for (let t = -60; t <= 100; t += 2) {
        const e = getImpactEnergy(t);
        const px = originX + ((t + 60) / 160) * plotW;
        const py = originY - (e / 180) * plotH;
        if (t === -60) dCtx.moveTo(px, py);
        else dCtx.lineTo(px, py);
      }
      dCtx.strokeStyle = '#10b981';
      dCtx.lineWidth = 2.5;
      dCtx.stroke();

      // Operating temperature marker
      const curE = getImpactEnergy(currentTemp);
      const curX = originX + ((currentTemp + 60) / 160) * plotW;
      const curY = originY - (curE / 180) * plotH;

      dCtx.beginPath();
      dCtx.arc(curX, curY, 6, 0, Math.PI * 2);
      dCtx.fillStyle = '#60a5fa';
      dCtx.fill();
      dCtx.strokeStyle = '#ffffff';
      dCtx.lineWidth = 2;
      dCtx.stroke();

      // Labels
      dCtx.fillStyle = '#94a3b8';
      dCtx.font = '10px JetBrains Mono';
      dCtx.fillText('-60\u00B0C', originX, originY + 15);
      dCtx.fillText('0\u00B0C', originX + (60 / 160) * plotW, originY + 15);
      dCtx.fillText('+100\u00B0C', originX + plotW, originY + 15);
      dCtx.fillText('180 J', originX - 35, originY - plotH + 10);
      dCtx.fillText('0 J', originX - 25, originY);
    }

    function stepSwing() {
      // Gravity acceleration towards bottom center
      const gravity = 0.0035;
      vel += -gravity * Math.sin(angle);
      angle += vel;

      // Strike bottom center (specimen hit)
      if (angle >= 0 && !hasStruck) {
        hasStruck = true;
        absorbedEnergy = getImpactEnergy(currentTemp);
        // Striker velocity reduction based on energy absorbed
        const initialKinetic = 300; // Joules rating
        const remainingKinetic = Math.max(10, initialKinetic - absorbedEnergy);
        vel = vel * Math.sqrt(remainingKinetic / initialKinetic);
        finalAngle = Math.acos(1 - (remainingKinetic / initialKinetic) * (1 - Math.cos(140 * Math.PI / 180)));
      }

      // Reached apex on opposite side
      if (hasStruck && vel > 0 && angle >= finalAngle) {
        isSwinging = false;
        energyDial.textContent = `${absorbedEnergy.toFixed(1)} J`;
        return;
      }

      drawPendulum(angle);
      animId = requestAnimationFrame(stepSwing);
    }

    if (releaseBtn) {
      releaseBtn.addEventListener('click', () => {
        if (!isSwinging) {
          isSwinging = true;
          hasStruck = false;
          angle = -140 * Math.PI / 180;
          vel = 0;
          stepSwing();
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (animId) cancelAnimationFrame(animId);
        isSwinging = false;
        hasStruck = false;
        angle = -140 * Math.PI / 180;
        vel = 0;
        energyDial.textContent = '0.0 J';
        drawPendulum(angle);
      });
    }

    if (tempSlider) {
      tempSlider.addEventListener('input', () => {
        currentTemp = parseInt(tempSlider.value, 10);
        tempValText.textContent = `${currentTemp} \u00B0C`;

        const energy = getImpactEnergy(currentTemp);
        if (currentTemp < 0) {
          modeTag.textContent = 'LOWER SHELF (BRITTLE)';
          modeTag.style.color = '#f87171';
          fractureType.textContent = '100% Cleavage (Flat Crystalline)';
          lateralExp.textContent = '0.22 mm (Low Ductility)';
        } else if (currentTemp <= 30) {
          modeTag.textContent = 'TRANSITION REGION';
          modeTag.style.color = '#fbbf24';
          fractureType.textContent = 'Mixed (50% Shear Lips / 50% Cleavage)';
          lateralExp.textContent = '1.10 mm';
        } else {
          modeTag.textContent = 'UPPER SHELF (DUCTILE)';
          modeTag.style.color = '#34d399';
          fractureType.textContent = '100% Fibrous Shear Lips (Matte)';
          lateralExp.textContent = '1.85 mm (High Ductility)';
        }

        drawDBTTGraph();
      });
    }

    drawPendulum(angle);
    drawDBTTGraph();
  }

  // ── 4. Virtual Vickers Micro-Hardness Indenter Simulator ─────────────────
  initVickersSimulation();
  function initVickersSimulation() {
    const canvas = document.getElementById('vickersCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const matSelect = document.getElementById('exp7-mat-select');
    const loadBtns = document.querySelectorAll('#exp7-load-pills .load-btn');
    const d1Slider = document.getElementById('exp7-d1-slider');
    const d2Slider = document.getElementById('exp7-d2-slider');
    const d1Read = document.getElementById('vickersD1Read');
    const d2Read = document.getElementById('vickersD2Read');
    const dMeanRead = document.getElementById('vickersDMeanRead');
    const liveHV = document.getElementById('vickersLiveHV');
    const equivBHN = document.getElementById('vickersEquivBHN');
    const equivHRB = document.getElementById('vickersEquivHRB');

    let currentLoad = 10; // kgf
    let d1Px = 184; // caliper pixels
    let d2Px = 183;
    const pxToMm = 0.002; // calibration: 1 pixel = 2 µm under 100X

    function renderVickers() {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      ctx.clearRect(0, 0, w, h);

      // Polished metallic specimen surface with fine micro-scratches
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 40; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * 11);
        ctx.lineTo(w, i * 11 + (i % 3) * 6);
        ctx.stroke();
      }

      // Pyramidal square diamond impression (rotated 45 deg)
      // d1 is horizontal tip-to-tip, d2 is vertical tip-to-tip
      const halfD1 = d1Px / 2;
      const halfD2 = d2Px / 2;

      // 4 facets of pyramid with 3D shadow depth
      // Top facet
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx - halfD1, cy);
      ctx.lineTo(cx, cy - halfD2);
      ctx.closePath();
      ctx.fill();

      // Right facet (slightly illuminated)
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy - halfD2);
      ctx.lineTo(cx + halfD1, cy);
      ctx.closePath();
      ctx.fill();

      // Bottom facet (deep shadow)
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + halfD1, cy);
      ctx.lineTo(cx, cy + halfD2);
      ctx.closePath();
      ctx.fill();

      // Left facet
      ctx.fillStyle = '#141d2e';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy + halfD2);
      ctx.lineTo(cx - halfD1, cy);
      ctx.closePath();
      ctx.fill();

      // Perimeter edge
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx - halfD1, cy);
      ctx.lineTo(cx, cy - halfD2);
      ctx.lineTo(cx + halfD1, cy);
      ctx.lineTo(cx, cy + halfD2);
      ctx.closePath();
      ctx.stroke();

      // Interactive Caliper Measurement lines
      // Horizontal measurement caliper lines (green dashed lines at tips)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);

      // Left tip line
      ctx.beginPath();
      ctx.moveTo(cx - halfD1, cy - halfD2 - 20);
      ctx.lineTo(cx - halfD1, cy + halfD2 + 20);
      ctx.stroke();

      // Right tip line
      ctx.beginPath();
      ctx.moveTo(cx + halfD1, cy - halfD2 - 20);
      ctx.lineTo(cx + halfD1, cy + halfD2 + 20);
      ctx.stroke();

      // Vertical measurement caliper lines
      ctx.strokeStyle = '#f59e0b';
      // Top tip line
      ctx.beginPath();
      ctx.moveTo(cx - halfD1 - 20, cy - halfD2);
      ctx.lineTo(cx + halfD1 + 20, cy - halfD2);
      ctx.stroke();

      // Bottom tip line
      ctx.beginPath();
      ctx.moveTo(cx - halfD1 - 20, cy + halfD2);
      ctx.lineTo(cx + halfD1 + 20, cy + halfD2);
      ctx.stroke();

      ctx.setLineDash([]);

      // Center crosshair
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 15, cy);
      ctx.lineTo(cx + 15, cy);
      ctx.moveTo(cx, cy - 15);
      ctx.lineTo(cx, cy + 15);
      ctx.stroke();

      // Compute physical metrics
      const d1Mm = d1Px * pxToMm;
      const d2Mm = d2Px * pxToMm;
      const meanDMm = (d1Mm + d2Mm) / 2;

      // HV = 1.8544 * P / d²
      const hv = 1.8544 * currentLoad / (meanDMm * meanDMm);

      d1Read.textContent = `${d1Mm.toFixed(3)} mm`;
      d2Read.textContent = `${d2Mm.toFixed(3)} mm`;
      dMeanRead.textContent = `${meanDMm.toFixed(3)} mm`;
      liveHV.textContent = `${hv.toFixed(1)} HV${currentLoad}`;
      equivBHN.textContent = `~${Math.round(hv * 0.95)} HBW`;
      equivHRB.textContent = `~${Math.min(100, Math.round(130 - 500 / Math.sqrt(hv)))} HRB`;
    }

    if (d1Slider) {
      d1Slider.addEventListener('input', () => {
        d1Px = parseInt(d1Slider.value, 10);
        renderVickers();
      });
    }

    if (d2Slider) {
      d2Slider.addEventListener('input', () => {
        d2Px = parseInt(d2Slider.value, 10);
        renderVickers();
      });
    }

    loadBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        loadBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentLoad = parseFloat(btn.dataset.load);
        renderVickers();
      });
    });

    if (matSelect) {
      matSelect.addEventListener('change', () => {
        const mat = matSelect.value;
        if (mat === 'quenched-steel') {
          d1Slider.value = 80;
          d2Slider.value = 80;
        } else if (mat === 'mild-steel') {
          d1Slider.value = 184;
          d2Slider.value = 183;
        } else if (mat === 'brass') {
          d1Slider.value = 220;
          d2Slider.value = 219;
        } else if (mat === 'al-alloy') {
          d1Slider.value = 170;
          d2Slider.value = 171;
        }
        d1Px = parseInt(d1Slider.value, 10);
        d2Px = parseInt(d2Slider.value, 10);
        renderVickers();
      });
    }

    renderVickers();
  }


  // =========================================================================
  // 18. INTERACTIVE SCIENTIFIC GRAPH STUDIOS
  // =========================================================================

  // ── Exp 3: Rule of Mixtures Elastic Modulus vs Fiber Fraction Graph ──────
  initExp3Graph();
  function initExp3Graph() {
    const canvas = document.getElementById('exp3GraphCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const fiberSelect = document.getElementById('exp3-fiber-select');
    const vfSlider = document.getElementById('exp3-vf-slider');
    const vfVal = document.getElementById('exp3VfVal');
    const vfTag = document.getElementById('exp3VfTag');
    const e1Val = document.getElementById('exp3E1Val');
    const e2Val = document.getElementById('exp3E2Val');
    const ratioVal = document.getElementById('exp3RatioVal');
    const vcritVal = document.getElementById('exp3VcritVal');

    const fiberProps = {
      'e-glass': { ef: 72.4, em: 3.4, sf: 3400, sm: 65 },
      'carbon':  { ef: 230.0, em: 3.4, sf: 4500, sm: 65 },
      'aramid':  { ef: 125.0, em: 3.4, sf: 3600, sm: 65 }
    };

    let currentFiber = 'e-glass';
    let currentVf = 0.40;

    function renderExp3Graph() {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const f = fiberProps[currentFiber];
      const originX = 65;
      const originY = h - 45;
      const plotW = w - originX - 30;
      const plotH = originY - 30;

      const maxE = f.ef * 1.05;

      // Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = originY - (plotH / 5) * i;
        ctx.beginPath();
        ctx.moveTo(originX, y);
        ctx.lineTo(originX + plotW, y);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.round((maxE / 5) * i)} GPa`, originX - 8, y + 4);
      }

      for (let j = 0; j <= 5; j++) {
        const x = originX + (plotW / 5) * j;
        ctx.beginPath();
        ctx.moveTo(x, originY);
        ctx.lineTo(x, originY - plotH);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`${(j * 20)}%`, x, originY + 18);
      }

      // Axis Titles
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Plus Jakarta Sans';
      ctx.textAlign = 'center';
      ctx.fillText('Fiber Volume Fraction (V_f)', originX + plotW / 2, h - 8);

      ctx.save();
      ctx.translate(18, originY - plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Composite Modulus (GPa)', 0, 0);
      ctx.restore();

      // Voigt Upper Bound E1 = Vf * Ef + (1 - Vf) * Em
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(originX, originY - (f.em / maxE) * plotH);
      ctx.lineTo(originX + plotW, originY - (f.ef / maxE) * plotH);
      ctx.stroke();

      // Reuss Lower Bound E2 = (Ef * Em) / (Vf * Em + (1 - Vf) * Ef)
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let step = 0; step <= 100; step++) {
        const vf = step / 100;
        const e2 = (f.ef * f.em) / (vf * f.em + (1 - vf) * f.ef);
        const px = originX + vf * plotW;
        const py = originY - (e2 / maxE) * plotH;
        if (step === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Current Vf Tracker
      const curE1 = currentVf * f.ef + (1 - currentVf) * f.em;
      const curE2 = (f.ef * f.em) / (currentVf * f.em + (1 - currentVf) * f.ef);
      const curX = originX + currentVf * plotW;
      const curY1 = originY - (curE1 / maxE) * plotH;
      const curY2 = originY - (curE2 / maxE) * plotH;

      // Vertical guideline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(curX, originY);
      ctx.lineTo(curX, curY1);
      ctx.stroke();
      ctx.setLineDash([]);

      // Dots
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(curX, curY1, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#a78bfa';
      ctx.beginPath();
      ctx.arc(curX, curY2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Legend
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(originX + 15, originY - plotH + 12, 16, 4);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px Plus Jakarta Sans';
      ctx.textAlign = 'left';
      ctx.fillText('Voigt Longitudinal Modulus E_1 (Upper Bound)', originX + 38, originY - plotH + 16);

      ctx.fillStyle = '#a78bfa';
      ctx.fillRect(originX + 15, originY - plotH + 30, 16, 4);
      ctx.fillStyle = '#f8fafc';
      ctx.fillText('Reuss Transverse Modulus E_2 (Lower Bound)', originX + 38, originY - plotH + 34);

      // Calculations
      const vcrit = ((f.sm - (f.em / f.ef) * f.sm) / (f.sf - (f.em / f.ef) * f.sm)) * 100;
      if (e1Val) e1Val.textContent = `${curE1.toFixed(1)} GPa`;
      if (e2Val) e2Val.textContent = `${curE2.toFixed(1)} GPa`;
      if (ratioVal) ratioVal.textContent = `${(curE1 / curE2).toFixed(2)}`;
      if (vcritVal) vcritVal.textContent = `~${vcrit.toFixed(1)}%`;
      if (vfVal) vfVal.textContent = `${Math.round(currentVf * 100)}%`;
      if (vfTag) vfTag.textContent = `V_f = ${Math.round(currentVf * 100)}% (${currentVf <= 0.45 ? 'Hand Lay-up' : 'Autoclave / Vacuum Prepreg'})`;
    }

    if (fiberSelect) {
      fiberSelect.addEventListener('change', () => {
        currentFiber = fiberSelect.value;
        renderExp3Graph();
      });
    }

    let exp3Raf = null;
    if (vfSlider) {
      vfSlider.addEventListener('input', () => {
        currentVf = parseInt(vfSlider.value, 10) / 100;
        if (!exp3Raf) {
          exp3Raf = requestAnimationFrame(() => {
            exp3Raf = null;
            renderExp3Graph();
          });
        }
      });
    }

    renderExp3Graph();
  }

  // ── Exp 5: ASTM E399 Load vs CMOD Secant Line Graph ─────────────────────
  initExp5Graph();
  function initExp5Graph() {
    const canvas = document.getElementById('exp5GraphCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const typeSelect = document.getElementById('exp5-specimen-type');
    const loadSlider = document.getElementById('exp5-load-slider');
    const sliderVal = document.getElementById('exp5LoadSliderVal');
    const validityTag = document.getElementById('exp5ValidityTag');
    const s0Val = document.getElementById('exp5S0Val');
    const s5Val = document.getElementById('exp5S5Val');
    const pqVal = document.getElementById('exp5PqVal');
    const ratioVal = document.getElementById('exp5RatioVal');
    const kicVal = document.getElementById('exp5KicVal');

    let currentType = 'type3';
    let progress = 0.75; // 0 to 1

    function renderExp5Graph() {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const originX = 60;
      const originY = h - 45;
      const plotW = w - originX - 30;
      const plotH = originY - 30;

      const maxP = 22; // kN
      const maxCMOD = 0.45; // mm

      // Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const y = originY - (plotH / 5) * i;
        ctx.beginPath();
        ctx.moveTo(originX, y);
        ctx.lineTo(originX + plotW, y);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'right';
        ctx.fillText(`${((maxP / 5) * i).toFixed(1)} kN`, originX - 8, y + 4);
      }

      for (let j = 0; j <= 5; j++) {
        const x = originX + (plotW / 5) * j;
        ctx.beginPath();
        ctx.moveTo(x, originY);
        ctx.lineTo(x, originY - plotH);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`${((maxCMOD / 5) * j).toFixed(2)}`, x, originY + 18);
      }

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Plus Jakarta Sans';
      ctx.textAlign = 'center';
      ctx.fillText('Crack Mouth Opening Displacement CMOD (mm)', originX + plotW / 2, h - 8);

      ctx.save();
      ctx.translate(18, originY - plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Applied Test Load P (kN)', 0, 0);
      ctx.restore();

      // Slopes
      const s0 = 62.5; // kN/mm
      const s5 = s0 * 0.95; // 5% secant slope

      // Initial linear slope line S0 (OB)
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      const testCMOD = 0.30;
      ctx.lineTo(originX + (testCMOD / maxCMOD) * plotW, originY - ((testCMOD * s0) / maxP) * plotH);
      ctx.stroke();

      // 5% Secant line S5 (OA)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      const secantCMOD = 0.35;
      ctx.lineTo(originX + (secantCMOD / maxCMOD) * plotW, originY - ((secantCMOD * s5) / maxP) * plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      // P vs CMOD Experimental Curve
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(originX, originY);

      let pMax = 14.5;
      let pq = 13.4;
      const numSteps = 100;

      for (let step = 0; step <= numSteps * progress; step++) {
        const v = (step / numSteps) * 0.35;
        let p;
        if (v <= 0.12) {
          p = v * s0;
        } else {
          // Non-linear bending
          p = 0.12 * s0 + (v - 0.12) * s0 * 0.65 - Math.pow(v - 0.12, 2) * 95;
        }
        if (p > pMax) pMax = p;
        const px = originX + (v / maxCMOD) * plotW;
        const py = originY - (p / maxP) * plotH;
        if (step === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Secant intersection marker (P_Q)
      const vQ = 0.235;
      pq = vQ * s5;
      const pqX = originX + (vQ / maxCMOD) * plotW;
      const pqY = originY - (pq / maxP) * plotH;

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(pqX, pqY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.font = '11px JetBrains Mono';
      ctx.fillText(`P_Q = ${pq.toFixed(1)} kN`, pqX + 12, pqY - 8);

      // Pmax marker
      const vMax = 0.285;
      const maxPlotX = originX + (vMax / maxCMOD) * plotW;
      const maxPlotY = originY - (14.6 / maxP) * plotH;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(maxPlotX, maxPlotY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Ratio
      const ratio = 14.6 / pq;
      const isValid = ratio <= 1.10;

      if (validityTag) {
        validityTag.textContent = isValid ? 'VALID PLANE STRAIN TEST (PASS)' : 'INVALID TEST (EXCESS PLASTICITY)';
        validityTag.style.background = isValid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
        validityTag.style.color = isValid ? '#34d399' : '#f87171';
      }

      if (s0Val) s0Val.textContent = `${s0.toFixed(1)} kN/mm`;
      if (s5Val) s5Val.textContent = `${s5.toFixed(1)} kN/mm`;
      if (pqVal) pqVal.textContent = `${pq.toFixed(1)} kN`;
      if (ratioVal) ratioVal.textContent = `${ratio.toFixed(2)} (${isValid ? '<= 1.10 Pass' : '> 1.10 Fail'})`;
      if (kicVal) kicVal.textContent = `${(pq * 2.23).toFixed(1)} MPa\u221Am`;
      if (sliderVal) sliderVal.textContent = `${(progress * 14.6).toFixed(1)} kN`;
    }

    let exp5Raf = null;
    if (loadSlider) {
      loadSlider.addEventListener('input', () => {
        progress = parseInt(loadSlider.value, 10) / 100;
        if (!exp5Raf) {
          exp5Raf = requestAnimationFrame(() => {
            exp5Raf = null;
            renderExp5Graph();
          });
        }
      });
    }

    if (typeSelect) {
      typeSelect.addEventListener('change', () => {
        currentType = typeSelect.value;
        renderExp5Graph();
      });
    }

    renderExp5Graph();
  }

  // ── Exp 6: Wöhler S-N Curve Studio ───────────────────────────────────────
  initExp6Graph();
  function initExp6Graph() {
    const canvas = document.getElementById('exp6GraphCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const alloySelect = document.getElementById('exp6-alloy-select');
    const stressSlider = document.getElementById('exp6-stress-slider');
    const stressValText = document.getElementById('exp6StressValText');
    const lifeStatus = document.getElementById('exp6LifeStatus');
    const enduranceVal = document.getElementById('exp6EnduranceVal');
    const lifeCycles = document.getElementById('exp6LifeCycles');
    const runTime = document.getElementById('exp6RunTime');

    let currentAlloy = 'mild-steel';
    let currentStress = 210;

    const alloyData = {
      'mild-steel':  { se: 225, uts: 460, b: -0.09, hasKnee: true },
      'alloy-steel': { se: 480, uts: 980, b: -0.08, hasKnee: true },
      'al-7075':     { se: 160, uts: 570, b: -0.11, hasKnee: false }
    };

    function renderExp6Graph() {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const a = alloyData[currentAlloy];
      const originX = 65;
      const originY = h - 45;
      const plotW = w - originX - 30;
      const plotH = originY - 30;

      const minLog = 3; // 10^3 cycles
      const maxLog = 8; // 10^8 cycles
      const maxS = a.uts * 1.15;

      // Grid (Logarithmic X-axis from 10^3 to 10^8)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for (let s = 0; s <= 5; s++) {
        const y = originY - (plotH / 5) * s;
        ctx.beginPath();
        ctx.moveTo(originX, y);
        ctx.lineTo(originX + plotW, y);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'right';
        ctx.fillText(`${Math.round((maxS / 5) * s)} MPa`, originX - 8, y + 4);
      }

      for (let logN = minLog; logN <= maxLog; logN++) {
        const x = originX + ((logN - minLog) / (maxLog - minLog)) * plotW;
        ctx.beginPath();
        ctx.moveTo(x, originY);
        ctx.lineTo(x, originY - plotH);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(`10^${logN}`, x, originY + 18);
      }

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Plus Jakarta Sans';
      ctx.textAlign = 'center';
      ctx.fillText('Cycles to Failure N (Logarithmic Scale)', originX + plotW / 2, h - 8);

      ctx.save();
      ctx.translate(18, originY - plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Alternating Stress \u03C3_a (MPa)', 0, 0);
      ctx.restore();

      // Draw Wöhler Curve
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.8;
      ctx.beginPath();

      const kneeLog = 6.0; // 10^6 cycles knee for steel
      for (let step = 0; step <= 100; step++) {
        const logVal = minLog + (step / 100) * (maxLog - minLog);
        let s;
        if (a.hasKnee && logVal >= kneeLog) {
          s = a.se; // Flat horizontal plateau!
        } else {
          // Basquin curve: S = UTS * 0.9 * (10^(logVal - 3))^b
          const cyclesRatio = Math.pow(10, logVal - 3);
          s = Math.max(a.hasKnee ? a.se : 110, (a.uts * 0.88) * Math.pow(cyclesRatio, a.b));
        }
        const px = originX + ((logVal - minLog) / (maxLog - minLog)) * plotW;
        const py = originY - (s / maxS) * plotH;
        if (step === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Endurance Limit Plateau line (if steel)
      if (a.hasKnee) {
        const seY = originY - (a.se / maxS) * plotH;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(originX, seY);
        ctx.lineTo(originX + plotW, seY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#f59e0b';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'left';
        ctx.fillText(`Endurance Limit \u03C3_e = ${a.se} MPa`, originX + 15, seY - 6);
      }

      // Current Stress Operating Point
      const curY = originY - (currentStress / maxS) * plotH;
      let calculatedCycles;
      const isInfinite = a.hasKnee && currentStress <= a.se;

      if (isInfinite) {
        calculatedCycles = Infinity;
      } else {
        // Invert Basquin: N = 0.5 * (S / (UTS * 0.9))^(1/b) * 10^3
        const logRatio = Math.log10(currentStress / (a.uts * 0.88)) / a.b;
        calculatedCycles = Math.min(1e8, Math.max(1e3, Math.pow(10, 3 + logRatio)));
      }

      // Draw horizontal crosshair for current stress
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(originX, curY);
      ctx.lineTo(originX + plotW, curY);
      ctx.stroke();
      ctx.setLineDash([]);

      if (!isInfinite) {
        const curLog = Math.log10(calculatedCycles);
        const curX = originX + ((curLog - minLog) / (maxLog - minLog)) * plotW;

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(curX, curY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Status updates
      if (stressValText) stressValText.textContent = `${currentStress} MPa`;
      if (enduranceVal) enduranceVal.textContent = a.hasKnee ? `${a.se} MPa (~0.5 \u00D7 UTS)` : 'None (Continual drop)';

      if (isInfinite) {
        if (lifeStatus) {
          lifeStatus.textContent = 'SAFE INFINITE LIFE (N > 10^7)';
          lifeStatus.style.background = 'rgba(16, 185, 129, 0.15)';
          lifeStatus.style.color = '#34d399';
        }
        if (lifeCycles) lifeCycles.textContent = '\u221E Cycles (No Fatigue Fracture)';
        if (runTime) runTime.textContent = 'Infinite (Continuous Duty)';
      } else {
        if (lifeStatus) {
          lifeStatus.textContent = 'FINITE FATIGUE LIFE (FATIGUE FAILURE)';
          lifeStatus.style.background = 'rgba(239, 68, 68, 0.15)';
          lifeStatus.style.color = '#f87171';
        }
        const nSci = calculatedCycles.toExponential(2);
        if (lifeCycles) lifeCycles.textContent = `${nSci} Cycles`;
        const minutes = Math.round(calculatedCycles / 3500);
        if (runTime) runTime.textContent = minutes < 60 ? `${minutes} minutes @ 3500 rpm` : `${(minutes / 60).toFixed(1)} hours`;
      }
    }

    if (alloySelect) {
      alloySelect.addEventListener('change', () => {
        currentAlloy = alloySelect.value;
        renderExp6Graph();
      });
    }

    let exp6Raf = null;
    if (stressSlider) {
      stressSlider.addEventListener('input', () => {
        currentStress = parseInt(stressSlider.value, 10);
        if (!exp6Raf) {
          exp6Raf = requestAnimationFrame(() => {
            exp6Raf = null;
            renderExp6Graph();
          });
        }
      });
    }

    renderExp6Graph();
  }

  // ── Exp 8: Thermal Cycles (T-t) & Tempering Curves Studio ─────────────────
  initExp8Graph();
  function initExp8Graph() {
    const canvas = document.getElementById('exp8GraphCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const modeSelect = document.getElementById('exp8-graph-mode');
    const graphTitle = document.getElementById('exp8GraphTitle');
    const modeTag = document.getElementById('exp8ModeTag');
    const tempSliderGroup = document.getElementById('exp8TemperingSliderGroup');
    const tempSlider = document.getElementById('exp8-temp-slider');
    const tempSliderVal = document.getElementById('exp8TempSliderVal');
    const resultsCard = document.getElementById('exp8ResultsCard');

    let currentMode = 'thermal-cycles';
    let currentTemp = 450; // °C

    function renderExp8Graph() {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const originX = 60;
      const originY = h - 45;
      const plotW = w - originX - 30;
      const plotH = originY - 30;

      if (currentMode === 'thermal-cycles') {
        // Temperature vs. Time (T vs. t)
        const maxTemp = 1000; // °C

        // Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
          const y = originY - (plotH / 5) * i;
          ctx.beginPath();
          ctx.moveTo(originX, y);
          ctx.lineTo(originX + plotW, y);
          ctx.stroke();

          ctx.fillStyle = '#64748b';
          ctx.font = '10px JetBrains Mono';
          ctx.textAlign = 'right';
          ctx.fillText(`${(maxTemp / 5) * i} \u00B0C`, originX - 8, y + 4);
        }

        // Critical Temperature Transformation Lines
        const criticalLines = [
          { name: 'Ac3 = 880\u00B0C (Austenite Complete)', temp: 880, color: '#f43f5e' },
          { name: 'Ac1 = 727\u00B0C (Eutectoid)', temp: 727, color: '#fbbf24' },
          { name: 'Ms = 380\u00B0C (Martensite Start)', temp: 380, color: '#a78bfa' },
          { name: 'Mf = 210\u00B0C (Martensite Finish)', temp: 210, color: '#818cf8' }
        ];

        criticalLines.forEach(line => {
          const ly = originY - (line.temp / maxTemp) * plotH;
          ctx.strokeStyle = line.color;
          ctx.setLineDash([3, 4]);
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(originX, ly);
          ctx.lineTo(originX + plotW, ly);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = line.color;
          ctx.font = '9px JetBrains Mono';
          ctx.textAlign = 'right';
          ctx.fillText(line.name, originX + plotW - 10, ly - 4);
        });

        // Common Heating & Soaking Stage (0 to 40% of time)
        const soakX1 = originX + plotW * 0.25;
        const soakX2 = originX + plotW * 0.40;
        const soakY = originY - (900 / maxTemp) * plotH;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(originX, originY - (25 / maxTemp) * plotH);
        ctx.lineTo(soakX1, soakY); // Heating
        ctx.lineTo(soakX2, soakY); // 30 min Soaking
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Plus Jakarta Sans';
        ctx.textAlign = 'center';
        ctx.fillText('Austenitizing Soak (900\u00B0C)', (soakX1 + soakX2) / 2, soakY - 10);

        // Curve 1: Water Quenching (Rapid steep drop)
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(soakX2, soakY);
        ctx.bezierCurveTo(soakX2 + 15, soakY + 120, soakX2 + 25, originY - 50, soakX2 + 35, originY - (25 / maxTemp) * plotH);
        ctx.stroke();
        ctx.fillStyle = '#f87171';
        ctx.fillText('Water Quench (CCR > 250\u00B0C/s)', soakX2 + 75, originY - 70);

        // Curve 2: Normalizing (Air Cool, Moderate)
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(soakX2, soakY);
        ctx.bezierCurveTo(soakX2 + 80, soakY + 60, soakX2 + 140, originY - 120, soakX2 + 180, originY - (25 / maxTemp) * plotH);
        ctx.stroke();
        ctx.fillStyle = '#34d399';
        ctx.fillText('Normalizing (Still Air)', soakX2 + 185, originY - 120);

        // Curve 3: Full Annealing (Furnace Cool, Very Slow)
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(soakX2, soakY);
        ctx.bezierCurveTo(soakX2 + 120, soakY + 20, soakX2 + 220, soakY + 80, originX + plotW, originY - (150 / maxTemp) * plotH);
        ctx.stroke();
        ctx.fillStyle = '#60a5fa';
        ctx.fillText('Full Annealing (Furnace Cool ~30\u00B0C/h)', originX + plotW - 70, originY - 180);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Plus Jakarta Sans';
        ctx.textAlign = 'center';
        ctx.fillText('Elapsed Processing Time (Hours)', originX + plotW / 2, h - 8);
      } else {
        // Tempering Curve: Hardness vs. Tempering Temperature
        const maxH = 70; // HRC
        const maxImpact = 160; // Joules

        // Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
          const y = originY - (plotH / 5) * i;
          ctx.beginPath();
          ctx.moveTo(originX, y);
          ctx.lineTo(originX + plotW, y);
          ctx.stroke();

          ctx.fillStyle = '#f87171';
          ctx.font = '10px JetBrains Mono';
          ctx.textAlign = 'right';
          ctx.fillText(`${Math.round((maxH / 5) * i)} HRC`, originX - 8, y + 4);
        }

        ctx.fillStyle = '#f87171';
        ctx.font = '11px Plus Jakarta Sans';
        ctx.save();
        ctx.translate(18, originY - plotH / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Hardness (HRC)', 0, 0);
        ctx.restore();

        // X-axis: 100°C to 700°C
        for (let j = 0; j <= 6; j++) {
          const x = originX + (plotW / 6) * j;
          ctx.beginPath();
          ctx.moveTo(x, originY);
          ctx.lineTo(x, originY - plotH);
          ctx.stroke();

          ctx.fillStyle = '#64748b';
          ctx.font = '10px JetBrains Mono';
          ctx.textAlign = 'center';
          ctx.fillText(`${100 + j * 100}\u00B0C`, x, originY + 18);
        }

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Plus Jakarta Sans';
        ctx.textAlign = 'center';
        ctx.fillText('Tempering Temperature (\u00B0C)', originX + plotW / 2, h - 8);

        // Temper Embrittlement Zone (250°C to 350°C) shaded strip
        const embrittleX1 = originX + ((250 - 100) / 600) * plotW;
        const embrittleX2 = originX + ((350 - 100) / 600) * plotW;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
        ctx.fillRect(embrittleX1, originY - plotH, embrittleX2 - embrittleX1, plotH);

        ctx.fillStyle = '#f87171';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText('Blue Brittleness Dip', (embrittleX1 + embrittleX2) / 2, originY - plotH + 18);

        // Hardness Curve (monotonically drops)
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        for (let t = 100; t <= 700; t += 10) {
          // As-quenched 64 HRC drops to 22 HRC
          const hrc = 64 - (42 / (1 + Math.exp(-(t - 420) / 90)));
          const px = originX + ((t - 100) / 600) * plotW;
          const py = originY - (hrc / maxH) * plotH;
          if (t === 100) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Toughness Curve (rises with embrittlement dip at 300°C)
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        for (let t = 100; t <= 700; t += 10) {
          let energy = 15 + ((140) / (1 + Math.exp(-(t - 460) / 75)));
          // Dip at 300
          if (t >= 250 && t <= 360) {
            energy -= 22 * Math.sin(((t - 250) / 110) * Math.PI);
          }
          const px = originX + ((t - 100) / 600) * plotW;
          const py = originY - ((energy / maxImpact) * (maxH / maxH)) * plotH;
          if (t === 100) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Current Marker
        const curHrc = 64 - (42 / (1 + Math.exp(-(currentTemp - 420) / 90)));
        const curX = originX + ((currentTemp - 100) / 600) * plotW;
        const curY = originY - (curHrc / maxH) * plotH;

        ctx.fillStyle = '#f87171';
        ctx.beginPath();
        ctx.arc(curX, curY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '11px JetBrains Mono';
        ctx.fillText(`${curHrc.toFixed(1)} HRC (~${Math.round(curHrc * 10 + 30)} HV)`, curX + 12, curY - 8);
      }
    }

    if (modeSelect) {
      modeSelect.addEventListener('change', () => {
        currentMode = modeSelect.value;
        if (currentMode === 'thermal-cycles') {
          graphTitle.textContent = 'Complete Heat Treatment Cooling Regimens & Critical Transformation Lines';
          modeTag.textContent = 'AUSTENITIZING @ 900\u00B0C';
          tempSliderGroup.style.display = 'none';
        } else {
          graphTitle.textContent = 'Hardness (HRC) & Impact Toughness vs. Tempering Temperature';
          modeTag.textContent = 'TEMPERING STAGE';
          tempSliderGroup.style.display = 'block';
        }
        renderExp8Graph();
      });
    }

    if (tempSlider) {
      tempSlider.addEventListener('input', () => {
        currentTemp = parseInt(tempSlider.value, 10);
        tempSliderVal.textContent = `${currentTemp} \u00B0C`;
        renderExp8Graph();
      });
    }

    renderExp8Graph();
  }

  // =========================================================================
  // Print Lab Cheat Sheet
  // =========================================================================
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      // Temporarily expand all viva questions for clean PDF printout
      document.querySelectorAll('.viva-card').forEach(c => c.classList.add('open'));
      window.print();
    });
  }
});
