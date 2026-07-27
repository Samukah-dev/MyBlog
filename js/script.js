// --- Alternância de tema ---
const toggle = document.getElementById('modoEscuro');
const textoModo = document.querySelector('.texto-toggle');

if (toggle && textoModo) {
  if (localStorage.getItem('tema') === 'escuro') {
    document.body.classList.add('tema-escuro');
    toggle.checked = true;
    textoModo.textContent = 'Desativar modo escuro';
  } else {
    document.body.classList.add('tema-claro');
    toggle.checked = false;
    textoModo.textContent = 'Ativar modo escuro';
  }

  toggle.addEventListener('change', function () {
    if (this.checked) {
      document.body.classList.add('tema-escuro');
      document.body.classList.remove('tema-claro');
      localStorage.setItem('tema', 'escuro');
      textoModo.textContent = 'Desativar modo escuro';
    } else {
      document.body.classList.add('tema-claro');
      document.body.classList.remove('tema-escuro');
      localStorage.setItem('tema', 'claro');
      textoModo.textContent = 'Ativar modo escuro';
    }
  });
}

// --- Popup de nova postagem ---
const novoPost = document.getElementById('novoPost');
const popup = document.getElementById('popupPost');
const fecharPopup = document.getElementById('fecharPopup');

if (novoPost && popup && fecharPopup) {
  novoPost.addEventListener('click', () => popup.style.display = 'flex');
  fecharPopup.addEventListener('click', () => popup.style.display = 'none');
}

// --- Criação e salvamento de posts ---
const mancheteInput = document.getElementById('manchete');
const tituloInput = document.getElementById('titulo');
const conteudoInput = document.getElementById('conteudo');
const categoriaSelect = document.getElementById('categoria');
const capaInput = document.getElementById('capa');
const imagemInput = document.getElementById('imagem'); // galeria (opcional)

function salvarPosts() {
  if (!listaPosts) return;

  const posts = Array.from(listaPosts.querySelectorAll('article')).map((post) => {
    const titulo = post.querySelector('h2')?.textContent?.trim() || '';
    const data = post.querySelector('[data-role="data"]')?.textContent?.replace('Data: ', '').trim() || '';
    const categoria = post.querySelector('[data-role="categoria"]')?.textContent?.replace('Categoria: ', '').trim() || '';
    const conteudo = post.querySelector('[data-role="conteudo"]')?.textContent?.trim() || '';
    const imagem = post.querySelector('img')?.getAttribute('src') || '';

    return { titulo, data, categoria, conteudo, imagem };
  });

  localStorage.setItem('posts', JSON.stringify(posts));
}

function renderizarPosts(posts) {
  if (!listaPosts) return;

  listaPosts.innerHTML = '';

  posts.forEach((postData) => {
    const post = document.createElement('article');
    post.setAttribute('data-categoria', (postData.categoria || '').toLowerCase());
    post.innerHTML = `
      <h2>${postData.titulo}</h2>
      <p data-role="data"><strong>Data:</strong> ${postData.data}</p>
      <p data-role="categoria"><strong>Categoria:</strong> ${postData.categoria}</p>
      ${postData.imagem ? `<img src="${postData.imagem}" alt="${postData.titulo}" class="post-img">` : ''}
      <p data-role="conteudo">${postData.conteudo}</p>
      <button class="excluirPost">Excluir</button>
    `;

    listaPosts.appendChild(post);

    post.querySelector('.excluirPost')?.addEventListener('click', () => {
      post.remove();
      salvarPosts();
    });
  });
}

function criarPost() {
  const titulo = tituloInput?.value.trim();
  const conteudo = conteudoInput?.value.trim();
  const categoria = categoriaSelect?.value || 'Celulares';
  const imagem = imagemInput?.files[0];

  if (!titulo || !conteudo) {
    alert('Preencha todos os campos!');
    return;
  }

  const montarPost = (imagemDataUrl = '') => {
    const novoPost = document.createElement('article');
    novoPost.setAttribute('data-categoria', categoria.toLowerCase());
    novoPost.innerHTML = `
      <h2>${titulo}</h2>
      <p data-role="data"><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
      <p data-role="categoria"><strong>Categoria:</strong> ${categoria}</p>
      ${imagemDataUrl ? `<img src="${imagemDataUrl}" alt="${titulo}" class="post-img">` : ''}
      <p data-role="conteudo">${conteudo}</p>
      <button class="excluirPost">Excluir</button>
    `;

    listaPosts?.appendChild(novoPost);

    novoPost.querySelector('.excluirPost')?.addEventListener('click', () => {
      novoPost.remove();
      salvarPosts();
    });

    tituloInput.value = '';
    conteudoInput.value = '';
    categoriaSelect.value = 'Celulares';
    imagemInput.value = '';

    if (popup) {
      popup.style.display = 'none';
    }

    salvarPosts();
    mostrarMensagem('Post salvo com sucesso!');
  };

  if (imagem) {
    const leitor = new FileReader();
    leitor.onload = () => montarPost(leitor.result);
    leitor.readAsDataURL(imagem);
  } else {
    montarPost('');
  }
}

if (salvarPost) {
  salvarPost.addEventListener('click', criarPost);
}

// --- Carregar posts salvos ---
window.addEventListener('DOMContentLoaded', () => {
  const postsSalvos = JSON.parse(localStorage.getItem('posts')) || [];
  const categoriaAlvo = document.body.dataset.categoria?.toLowerCase();

  const filtrados = categoriaAlvo
    ? postsSalvos.filter((post) => (post.categoria || '').toLowerCase() === categoriaAlvo)
    : postsSalvos;

  if (filtrados.length > 0) {
    renderizarPosts(filtrados);
  } else if (listaPosts) {
    mostrarPopup('Nenhum resultado encontrado!');
  }
});

// --- Pesquisa ---
if (campoPesquisa) {
  campoPesquisa.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const termo = campoPesquisa.value.toLowerCase().trim();
      const postsSalvos = JSON.parse(localStorage.getItem('posts')) || [];

      const filtrados = termo
        ? postsSalvos.filter((post) => {
            const titulo = (post.titulo || '').toLowerCase();
            const conteudo = (post.conteudo || '').toLowerCase();
            const categoria = (post.categoria || '').toLowerCase();
            return titulo.includes(termo) || conteudo.includes(termo) || categoria.includes(termo);
          })
        : postsSalvos;

      renderizarPosts(filtrados);

      if (filtrados.length === 0 && termo !== '') {
        mostrarPopup('Nenhum resultado encontrado!');
      }
    }
  });
}

// --- Popup de aviso ---
function mostrarPopup(mensagem) {
  if (!popupAviso) return;
  popupAviso.textContent = mensagem;
  popupAviso.classList.add('mostrar');
  setTimeout(() => popupAviso.classList.remove('mostrar'), 3000);
}

// --- Preview de imagens ---
const galeriaPreview = document.querySelector('.galeria-preview');

if (imagemInput && galeriaPreview) {
  imagemInput.addEventListener('change', () => {
    galeriaPreview.innerHTML = '';
    const arquivos = Array.from(imagemInput.files);

    arquivos.forEach((arquivo, index) => {
      const imgURL = URL.createObjectURL(arquivo);
      const img = document.createElement('img');
      img.src = imgURL;
      img.classList.add('thumb');
      img.alt = `Miniatura ${index + 1}`;
      galeriaPreview.appendChild(img);
    });

    if (arquivos.length > 2) {
      const contador = document.createElement('div');
      contador.classList.add('mais-imagens');
      contador.textContent = `+${arquivos.length - 2}`;
      galeriaPreview.appendChild(contador);
    }
  });
}

const modal = document.getElementById('modal');
const imagemPost = document.getElementById('imagemPost');
const imagemModal = document.getElementById('imagemModal');
const fechar = document.querySelector('.fechar');

if (imagemPost && modal && imagemModal && fechar) {
  imagemPost.addEventListener('click', () => {
    modal.style.display = 'block';
    imagemModal.src = imagemPost.src;
  });

  fechar.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
}

function mostrarMensagem(texto) {
  const msg = document.createElement('div');
  msg.className = 'mensagem-sucesso';
  msg.textContent = texto;
  document.body.appendChild(msg);

  setTimeout(() => {
    msg.remove();
  }, 3000);
}
