document.addEventListener('DOMContentLoaded', async () => {

  const apis = [
    {
      name: 'IA (Inteligencia Artificial)',
      items: [
        { name:'ChatGPT', desc:'Habla con ChatGPT, el modelo de IA de OpenAI.', path:'/ai/chatgpt?text=', status:'listo', params:{ text:'Texto para ChatGPT' } },
        { name:'Gemini', desc:'Habla con Gemini, la IA de Google.', path:'/ai/gemini?text=', status:'listo', params:{ text:'Texto para Gemini' } },
      ]
    },
    {
      name: 'Anime',
      items: [
        { name:'Anime Reacciones', desc:'Obtén GIFs e imágenes de anime según la acción. Acciones: hug, kiss, slap, pat, cry, etc.', path:'/random/anime?action=&type=', status:'listo', params:{ action:'hug, kiss, slap, pat, cry, etc.', type:'sfw o nsfw' } },
      ]
    },
    {
      name: 'Aleatorio',
      items: [
        { name:'Blue Archive', desc:'Imagen aleatoria de personajes de Blue Archive.', path:'/random/ba', status:'listo', params:{} },
      ]
    },
    {
      name: 'Descargas',
      items: [
        { name:'YouTube Downloader', desc:'Descarga videos de YouTube en video o audio.', path:'/download/youtube?url=&type=', status:'listo', params:{ url:'Enlace del video de YouTube', type:'video o audio' } },
        { name:'Spotify', desc:'Descarga canciones de Spotify por link.', path:'/download/spotify?url=', status:'listo', params:{ url:'Link de Spotify' } },
        { name:'TikTok', desc:'Descarga videos de TikTok sin marca de agua.', path:'/download/tiktok?url=', status:'listo', params:{ url:'Link del video de TikTok' } },
        { name:'Instagram', desc:'Descarga fotos y videos de Instagram.', path:'/download/instagram?url=', status:'listo', params:{ url:'Link de Instagram' } },
        { name:'Facebook', desc:'Descarga videos de Facebook en HD o SD.', path:'/download/facebook?url=', status:'listo', params:{ url:'Link del video de Facebook' } },
        { name:'Mediafire', desc:'Obtén el link directo de descarga de Mediafire.', path:'/download/mediafire?url=', status:'listo', params:{ url:'Link de Mediafire' } },
      ]
    },
    {
      name: 'Herramientas de Búsqueda',
      items: [
        { name:'YouTube Search', desc:'Busca videos en YouTube y obtén resultados detallados en JSON.', path:'/search/youtube?q=', status:'listo', params:{ q:'Consulta de búsqueda' } },
        { name:'Spotify Search', desc:'Busca canciones en Spotify.', path:'/search/spotify?q=', status:'listo', params:{ q:'Nombre de la canción o artista' } },
        { name:'TikTok Search', desc:'Busca videos en TikTok y obtén resultados con links de descarga.', path:'/search/tiktok?query=', status:'listo', params:{ query:'Término de búsqueda' } },
        { name:'APK Search', desc:'Busca aplicaciones APK para Android por nombre.', path:'/search/apk?query=', status:'listo', params:{ query:'Nombre de la aplicación' } },
        { name:'Pinterest Search', desc:'Busca imágenes y videos en Pinterest.', path:'/search/pinterest?q=', status:'listo', params:{ q:'Término de búsqueda' } },
        { name:'Lyrics Search', desc:'Busca la letra de cualquier canción.', path:'/search/lirycs?q=', status:'listo', params:{ q:'Nombre de la canción y artista' } },
        { name:'Wikipedia', desc:'Busca información en Wikipedia.', path:'/search/wikipedia?q=&lang=', status:'listo', params:{ q:'Término de búsqueda', lang:'Idioma (es, en, fr, etc.)' } },
      ]
    },
    {
      name: 'Stalk',
      items: [
        { name:'GitHub Stalk', desc:'Obtén información detallada de un perfil de GitHub.', path:'/stalk/github?q=', status:'listo', params:{ q:'Nombre de usuario de GitHub' } },
        { name:'Instagram Stalk', desc:'Obtén información detallada de un perfil de Instagram.', path:'/stalk/instagram?q=', status:'listo', params:{ q:'Nombre de usuario de Instagram' } },
        { name:'TikTok Stalk', desc:'Obtén información detallada de un perfil de TikTok.', path:'/stalk/tiktok?q=', status:'listo', params:{ q:'Nombre de usuario de TikTok' } },
      ]
    },
    {
      name: 'Herramientas',
      items: [
        { name:'Brat Generator', desc:'Genera una imagen estilo Brat de Charli XCX con tu texto.', path:'/tools/brat?text=', status:'listo', params:{ text:'Texto para el generador Brat' } },
      ]
    },
    {
      name: 'Herramientas de Grupos',
      items: [
        { name:'WelcomeV2', desc:'Genera una imagen de bienvenida personalizada para nuevos miembros.', path:'/welcomev2?username=&guildName=&memberCount=&avatar=&background=', status:'listo', params:{ username:'Nombre del usuario', guildName:'Nombre del grupo', memberCount:'Número de miembro', avatar:'URL del avatar', background:'URL del fondo' } },
      ]
    }
  ];

  // Obtener apikey del usuario logueado
  const getApiKey = () => {
    try {
      const user = JSON.parse(localStorage.getItem('star_user'));
      return user?.apikey || null;
    } catch(e) { return null; }
  };

  const DOM = {
    loadingScreen: document.getElementById('loadingScreen'),
    body: document.body,
    sideNav: document.getElementById('sideNav'),
    collapseBtn: document.getElementById('collapseBtn'),
    menuToggle: document.getElementById('menuToggle'),
    themeToggle: document.getElementById('themeToggle'),
    searchInput: document.getElementById('searchInput'),
    clearBtn: document.getElementById('clearBtn'),
    apiGrid: document.getElementById('apiGrid'),
    bellBtn: document.getElementById('bellBtn'),
    toast: document.getElementById('toast'),
    modal: {
      element: document.getElementById('apiModal'),
      instance: null,
      title: document.getElementById('modalTitle'),
      desc: document.getElementById('modalDesc'),
      endpoint: document.getElementById('modalEndpoint'),
      params: document.getElementById('modalParams'),
      loading: document.getElementById('modalLoading'),
      responseBox: document.getElementById('responseBox'),
      responseContent: document.getElementById('responseContent'),
      sendBtn: document.getElementById('sendBtn'),
      copyEndpoint: document.getElementById('copyEndpoint'),
      copyResponse: document.getElementById('copyResponse'),
    }
  };

  let currentItem = null;

  const init = () => {
    setupEventListeners();
    initTheme();
    renderApis();
    hideLoadingScreen();
    if (DOM.modal.element) {
      DOM.modal.instance = new bootstrap.Modal(DOM.modal.element);
      // Limpiar modal completamente al cerrarse
      DOM.modal.element.addEventListener('hidden.bs.modal', () => {
        resetModal();
      });
    }
  };

  const resetModal = () => {
    currentItem = null;
    if (DOM.modal.title) DOM.modal.title.textContent = '';
    if (DOM.modal.desc) DOM.modal.desc.textContent = '';
    if (DOM.modal.endpoint) DOM.modal.endpoint.textContent = '';
    if (DOM.modal.params) DOM.modal.params.innerHTML = '';
    if (DOM.modal.responseContent) DOM.modal.responseContent.innerHTML = '';
    if (DOM.modal.responseBox) DOM.modal.responseBox.classList.add('d-none');
    if (DOM.modal.loading) DOM.modal.loading.classList.add('d-none');
    if (DOM.modal.sendBtn) {
      DOM.modal.sendBtn.classList.add('d-none');
      DOM.modal.sendBtn.disabled = true;
      DOM.modal.sendBtn.innerHTML = '<span>Enviar</span><i class="fas fa-paper-plane ms-2"></i>';
    }
  };

  const hideLoadingScreen = () => {
    setTimeout(() => {
      if (DOM.loadingScreen) DOM.loadingScreen.classList.add('hidden');
    }, 800);
  };

  const initTheme = () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (DOM.themeToggle) DOM.themeToggle.checked = true;
  };

  const setupEventListeners = () => {
    if (DOM.collapseBtn) DOM.collapseBtn.addEventListener('click', () => DOM.sideNav.classList.toggle('collapsed'));
    if (DOM.menuToggle) DOM.menuToggle.addEventListener('click', () => DOM.sideNav.classList.toggle('open'));

    document.addEventListener('click', e => {
      if (DOM.sideNav && !DOM.sideNav.contains(e.target) && DOM.menuToggle && !DOM.menuToggle.contains(e.target)) {
        DOM.sideNav.classList.remove('open');
      }
    });

    if (DOM.themeToggle) {
      DOM.themeToggle.addEventListener('change', () => {
        document.documentElement.setAttribute('data-theme', DOM.themeToggle.checked ? 'dark' : 'light');
      });
    }

    if (DOM.searchInput) {
      DOM.searchInput.addEventListener('input', () => {
        const q = DOM.searchInput.value;
        if (DOM.clearBtn) DOM.clearBtn.classList.toggle('show', q.length > 0);
        renderApis(q);
      });
    }

    if (DOM.clearBtn) {
      DOM.clearBtn.addEventListener('click', () => {
        DOM.searchInput.value = '';
        DOM.clearBtn.classList.remove('show');
        renderApis();
      });
    }

    if (DOM.bellBtn) DOM.bellBtn.addEventListener('click', () => showToast('No hay notificaciones nuevas.', 'info'));

    if (DOM.modal.copyEndpoint) {
      DOM.modal.copyEndpoint.addEventListener('click', () => {
        copyToClipboard(DOM.modal.endpoint.textContent, DOM.modal.copyEndpoint);
      });
    }

    if (DOM.modal.copyResponse) {
      DOM.modal.copyResponse.addEventListener('click', () => {
        copyToClipboard(DOM.modal.responseContent.textContent, DOM.modal.copyResponse);
      });
    }

    if (DOM.modal.sendBtn) DOM.modal.sendBtn.addEventListener('click', handleSubmit);
  };

  const renderApis = (filter = '') => {
    if (!DOM.apiGrid) return;
    const q = filter.toLowerCase();
    let html = '';
    let total = 0;

    apis.forEach(cat => {
      const filtered = cat.items.filter(i =>
        i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q) || cat.name.toLowerCase().includes(q)
      );
      if (!filtered.length) return;
      total += filtered.length;

      html += `<div class="category-title"><i class="fas fa-folder me-2"></i>${cat.name}</div><div class="api-grid-row">`;

      filtered.forEach(item => {
        const globalIdx = apis.flatMap(c => c.items).indexOf(item);
        const statusClass = item.status === 'listo' ? 'status-ready' : item.status === 'error' ? 'status-error' : 'status-update';
        const statusText = item.status === 'listo' ? 'Ready' : item.status === 'error' ? 'Error' : 'Update';
        const disabled = item.status !== 'listo' ? 'disabled' : '';

        html += `
          <div class="api-card" data-idx="${globalIdx}">
            <div class="api-card-header">
              <span class="api-card-name">${item.name}</span>
              <span class="api-badge">FREE</span>
            </div>
            <p class="api-card-desc">${item.desc}</p>
            <div class="api-card-ep"><span class="api-method">GET</span>${item.path.split('?')[0]}</div>
            <div class="api-card-footer">
              <div class="api-status ${statusClass}">
                <i class="fas fa-circle me-1"></i><span>${statusText}</span>
              </div>
              <button class="get-btn" data-idx="${globalIdx}" ${disabled}>
                <i class="fas fa-code me-1"></i> GET
              </button>
            </div>
          </div>`;
      });

      html += '</div>';
    });

    if (!total) {
      html = '<div class="no-results"><i class="fas fa-search"></i><p>No se encontraron resultados.</p></div>';
    }

    DOM.apiGrid.innerHTML = html;

    DOM.apiGrid.querySelectorAll('.get-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        openModal(+btn.dataset.idx);
      });
    });
  };

  const allItems = () => apis.flatMap(c => c.items);

  const openModal = (idx) => {
    // Limpiar primero
    resetModal();

    currentItem = allItems()[idx];
    if (!currentItem) return;

    DOM.modal.title.textContent = currentItem.name;
    DOM.modal.desc.textContent = currentItem.desc;

    const baseUrl = window.location.origin;
    const pathOnly = currentItem.path.split('?')[0];
    DOM.modal.endpoint.textContent = `${baseUrl}${pathOnly}`;

    const paramsFromPath = new URLSearchParams(currentItem.path.split('?')[1] || '');
    const paramKeys = Array.from(paramsFromPath.keys());

    DOM.modal.params.innerHTML = '';

    if (paramKeys.length > 0) {
      const formTitle = document.createElement('h6');
      formTitle.className = 'param-form-title';
      formTitle.innerHTML = '<i class="fas fa-sliders-h me-2"></i> Parameter';
      DOM.modal.params.appendChild(formTitle);

      paramKeys.forEach(key => {
        const group = document.createElement('div');
        group.className = 'param-group';

        const labelContainer = document.createElement('div');
        labelContainer.className = 'param-label-container';

        const label = document.createElement('label');
        label.textContent = key;
        label.htmlFor = `p-${key}`;

        const required = document.createElement('span');
        required.className = 'required-indicator ms-1';
        required.textContent = '*';
        label.appendChild(required);
        labelContainer.appendChild(label);

        if (currentItem.params && currentItem.params[key]) {
          const info = document.createElement('i');
          info.className = 'fas fa-info-circle param-info ms-1';
          info.setAttribute('data-bs-toggle', 'tooltip');
          info.setAttribute('data-bs-placement', 'top');
          info.title = currentItem.params[key];
          labelContainer.appendChild(info);
        }

        group.appendChild(labelContainer);

        const input = document.createElement('input');
        input.type = 'text';
        input.id = `p-${key}`;
        input.className = 'form-control custom-input';
        input.placeholder = `Ingresa ${key}...`;
        input.dataset.param = key;
        input.autocomplete = 'off';
        input.addEventListener('input', validateInputs);
        group.appendChild(input);

        if (currentItem.params && currentItem.params[key]) {
          const hint = document.createElement('p');
          hint.className = 'param-hint';
          hint.textContent = currentItem.params[key];
          group.appendChild(hint);
        }

        DOM.modal.params.appendChild(group);
      });

      DOM.modal.sendBtn.classList.remove('d-none');
      DOM.modal.sendBtn.disabled = true;
      initTooltips(DOM.modal.params);
    } else {
      // Sin parámetros — ejecutar directo con apikey
      const apiKey = getApiKey();
      const url = `${baseUrl}${currentItem.path}${apiKey ? `&apikey=${apiKey}` : ''}`;
      handleRequest(url);
    }

    DOM.modal.instance.show();
  };

  const validateInputs = () => {
    const inputs = DOM.modal.params.querySelectorAll('input');
    const allFilled = Array.from(inputs).every(i => i.value.trim() !== '');
    DOM.modal.sendBtn.disabled = !allFilled;
  };

  const handleSubmit = async () => {
    if (!currentItem) return;

    const inputs = DOM.modal.params.querySelectorAll('input');
    const newParams = new URLSearchParams();
    let valid = true;

    inputs.forEach(input => {
      if (!input.value.trim()) {
        valid = false;
        input.classList.add('is-invalid');
      } else {
        input.classList.remove('is-invalid');
        newParams.append(input.dataset.param, input.value.trim());
      }
    });

    if (!valid) return;

    // Añadir apikey del usuario logueado
    const apiKey = getApiKey();
    if (apiKey) newParams.append('apikey', apiKey);

    const url = `${window.location.origin}${currentItem.path.split('?')[0]}?${newParams.toString()}`;
    DOM.modal.endpoint.textContent = url;

    await handleRequest(url);
  };

  const handleRequest = async (url) => {
    DOM.modal.sendBtn.disabled = true;
    DOM.modal.sendBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Procesando...';
    DOM.modal.loading.classList.remove('d-none');
    DOM.modal.responseBox.classList.add('d-none');
    DOM.modal.responseContent.innerHTML = '';

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      const contentType = response.headers.get('Content-Type') || '';

      if (contentType.includes('image/')) {
        const blob = await response.blob();
        const imgUrl = URL.createObjectURL(blob);
        DOM.modal.responseContent.innerHTML = `
          <img src="${imgUrl}" style="max-width:100%;border-radius:8px;" alt="Respuesta"/>
          <a href="${imgUrl}" download class="btn btn-primary mt-3 w-100">
            <i class="fas fa-download me-2"></i> Descargar imagen
          </a>`;
      } else if (contentType.includes('audio/')) {
        DOM.modal.responseContent.innerHTML = `
          <audio controls style="width:100%">
            <source src="${url}" type="audio/mpeg"/>
          </audio>`;
      } else if (contentType.includes('application/json')) {
        const data = await response.json();
        DOM.modal.responseContent.innerHTML = syntaxHighlight(JSON.stringify(data, null, 2));

        const mediaUrl = data?.result?.data?.url || data?.result?.url || data?.data?.url || data?.url;
        const mimeType = data?.result?.data?.mimetype || data?.result?.mimetype || data?.data?.mimetype || '';

        if (mediaUrl) {
          const mediaEl = document.createElement('div');
          mediaEl.style.marginTop = '1rem';

          if (mimeType.includes('video') || mediaUrl.endsWith('.mp4')) {
            mediaEl.innerHTML = `
              <video controls style="max-width:100%;border-radius:8px;">
                <source src="${mediaUrl}" type="${mimeType || 'video/mp4'}"/>
              </video>`;
          } else if (mimeType.includes('audio') || mediaUrl.endsWith('.mp3')) {
            mediaEl.innerHTML = `
              <audio controls style="width:100%">
                <source src="${mediaUrl}" type="${mimeType || 'audio/mpeg'}"/>
              </audio>`;
          } else {
            mediaEl.innerHTML = `
              <img src="${mediaUrl}" style="max-width:100%;border-radius:8px;" alt="Media"/>`;
          }

          DOM.modal.responseContent.appendChild(mediaEl);
        }
      } else {
        const text = await response.text();
        DOM.modal.responseContent.textContent = text || 'Sin contenido.';
      }

      DOM.modal.responseBox.classList.remove('d-none');
      showToast('Datos obtenidos correctamente.', 'success');

    } catch (err) {
      DOM.modal.responseContent.innerHTML = `
        <div class="text-center p-3">
          <i class="fas fa-exclamation-triangle fa-2x text-danger mb-2"></i>
          <p class="text-danger">${err.message || 'Error al obtener datos.'}</p>
        </div>`;
      DOM.modal.responseBox.classList.remove('d-none');
      showToast('Error al obtener datos.', 'error');
    } finally {
      DOM.modal.loading.classList.add('d-none');
      DOM.modal.sendBtn.disabled = false;
      DOM.modal.sendBtn.innerHTML = '<span>Enviar</span><i class="fas fa-paper-plane ms-2"></i>';
    }
  };

  const syntaxHighlight = (json) => {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, match => {
      let cls = 'json-number';
      if (/^"/.test(match)) cls = /:$/.test(match) ? 'json-key' : 'json-string';
      else if (/true|false/.test(match)) cls = 'json-boolean';
      else if (/null/.test(match)) cls = 'json-null';
      return `<span class="${cls}">${match}</span>`;
    });
  };

  const showToast = (message, type = 'info') => {
    if (!DOM.toast) return;
    const body = DOM.toast.querySelector('.toast-body');
    const icon = DOM.toast.querySelector('.toast-icon');
    if (body) body.textContent = message;
    const colors = { success:'var(--ok)', error:'var(--err)', info:'var(--c)' };
    const icons = { success:'fa-check-circle', error:'fa-exclamation-circle', info:'fa-info-circle' };
    if (