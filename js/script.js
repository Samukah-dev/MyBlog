import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';
import { cloudName, uploadPreset } from './cloudinary.js';
import { db } from './firebase.js';

const POSTS = 'posts';
const POSTS_LEGADOS = 'posts';
const $ = (selector) => document.querySelector(selector);
const ui = {
  toggle: $('#modoEscuro'), textoModo: $('.texto-toggle'), novoPost: $('#novoPost'),
  popup: $('#popupPost'), fecharPopup: $('#fecharPopup'), salvarPost: $('#salvarPost'),
  manchete: $('#manchete'), titulo: $('#titulo'), conteudo: $('#conteudo'), categoria: $('#categoria'),
  imagemCapa: $('#imagemCapa'), imagens: $('#imagem'), lista: $('#listaPosts'),
  pesquisa: $('#campoPesquisa'), aviso: $('#popupAviso'), completo: $('#postCompleto'),
};
let posts = [];

function elemento(tag, texto, classe) {
  const node = document.createElement(tag);
  node.textContent = texto;
  if (classe) node.className = classe;
  return node;
}

function imagem(src, alt, classe) {
  const node = document.createElement('img');
  node.src = src;
  node.alt = alt;
  node.className = classe;
  return node;
}

function criarSlug(texto) {
  const base = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${base || 'post'}-${crypto.randomUUID().slice(0, 8)}`;
}

function formatarCriadoEm(criadoEm) {
  const data = criadoEm?.toDate?.();
  return data ? data.toLocaleDateString('pt-BR') : '';
}

function avisar(mensagem) {
  if (!ui.aviso) return;
  ui.aviso.textContent = mensagem;
  ui.aviso.classList.add('mostrar');
  window.setTimeout(() => ui.aviso?.classList.remove('mostrar'), 3000);
}

function sucesso(mensagem) {
  const node = elemento('div', mensagem, 'mensagem-sucesso');
  document.body.append(node);
  window.setTimeout(() => node.remove(), 3000);
}

function configurarTema() {
  if (!ui.toggle || !ui.textoModo) return;
  const aplicarTema = (escuro) => {
    document.body.classList.toggle('tema-escuro', escuro);
    document.body.classList.toggle('tema-claro', !escuro);
    ui.toggle.checked = escuro;
    ui.textoModo.textContent = escuro ? 'Desativar modo escuro' : 'Ativar modo escuro';
  };
  aplicarTema(localStorage.getItem('tema') === 'escuro');
  ui.toggle.addEventListener('change', () => {
    aplicarTema(ui.toggle.checked);
    localStorage.setItem('tema', ui.toggle.checked ? 'escuro' : 'claro');
  });
}

function renderizarPosts(listaDePosts) {
  if (!ui.lista) return;
  ui.lista.replaceChildren();
  if (!listaDePosts.length) {
    ui.lista.append(elemento('p', 'Nenhuma postagem encontrada.', 'sem-posts'));
    return;
  }

  listaDePosts.forEach((post) => {
    const artigo = document.createElement('article');
    artigo.dataset.categoria = (post.categoria || '').toLowerCase();
    const link = document.createElement('a');
    link.className = 'post-card-link';
    link.href = `post.html?id=${encodeURIComponent(post.id)}`;
    link.append(post.capa
      ? imagem(post.capa, post.manchete || post.titulo || 'Capa da postagem', 'post-capa')
      : elemento('div', 'Sem imagem de capa', 'post-capa sem-capa'));
    const conteudo = document.createElement('div');
    conteudo.className = 'post-card-conteudo';
    conteudo.append(
      elemento('span', post.categoria || 'Sem categoria', 'post-categoria'),
      elemento('h2', post.manchete || post.titulo || 'Sem título'),
      elemento('p', formatarCriadoEm(post.criadoEm), 'post-meta'),
    );
    link.append(conteudo);
    const excluir = elemento('button', 'Excluir', 'excluirPost');
    excluir.type = 'button';
    excluir.addEventListener('click', () => excluirPost(post));
    artigo.append(link, excluir);
    ui.lista.append(artigo);
  });
}

function filtrarPosts(termo = '') {
  const categoriaAlvo = document.body.dataset.categoria?.toLowerCase();
  const busca = termo.trim().toLocaleLowerCase('pt-BR');
  const resultado = posts.filter((post) => {
    const naCategoria = !categoriaAlvo || post.categoria?.toLowerCase() === categoriaAlvo;
    const texto = [post.manchete, post.titulo, post.conteudo, post.categoria]
      .filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');
    return naCategoria && (!busca || texto.includes(busca));
  });
  renderizarPosts(resultado);
  if (busca && !resultado.length) avisar('Nenhum resultado encontrado!');
}

async function carregarPosts() {
  if (!ui.lista) return;
  try {
    let resultado = await getDocs(query(collection(db, POSTS), orderBy('criadoEm', 'desc')));
    if (resultado.empty) {
      await migrarPostsLegados();
      resultado = await getDocs(query(collection(db, POSTS), orderBy('criadoEm', 'desc')));
    }
    posts = resultado.docs.map((registro) => ({ id: registro.id, ...registro.data() }));
    filtrarPosts(ui.pesquisa?.value || '');
  } catch (erro) {
    console.error('Erro ao carregar posts:', erro);
    renderizarPosts([]);
    avisar('Não foi possível carregar as postagens. Verifique o Firestore.');
  }
}

async function enviarImagem(arquivo) {
  if (cloudName.startsWith('SEU_') || uploadPreset.startsWith('SEU_')) {
    throw new Error('Configure o Cloudinary em js/cloudinary.js antes de enviar imagens.');
  }
  const formulario = new FormData();
  formulario.append('file', arquivo);
  formulario.append('upload_preset', uploadPreset);
  const resposta = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formulario,
  });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.error?.message || 'Falha no upload para o Cloudinary.');
  return dados.secure_url;
}

async function enviarImagemLegada(url, indice) {
  if (!url || !url.startsWith('data:')) return url || '';
  const resposta = await fetch(url);
  const blob = await resposta.blob();
  const extensao = blob.type.split('/')[1] || 'jpg';
  return enviarImagem(new File([blob], `imagem-legada-${indice}.${extensao}`, { type: blob.type }));
}

async function migrarPostsLegados() {
  const dadosLegados = localStorage.getItem(POSTS_LEGADOS);
  if (!dadosLegados) return;
  let postsLegados;
  try {
    postsLegados = JSON.parse(dadosLegados);
  } catch {
    console.warn('Os posts salvos localmente não estão em um formato válido.');
    return;
  }
  if (!Array.isArray(postsLegados) || !postsLegados.length) return;

  await Promise.all(postsLegados.map(async (post, indice) => {
    const capa = await enviarImagemLegada(post.capa || post.imagem, indice);
    const imagens = await Promise.all((post.imagens || []).map((url, imagemIndice) =>
      enviarImagemLegada(url, `${indice}-${imagemIndice}`)));
    return addDoc(collection(db, POSTS), {
      manchete: post.manchete || post.titulo || 'Sem título',
      titulo: post.titulo || 'Sem título',
      conteudo: post.conteudo || '',
      categoria: post.categoria || 'Celulares',
      capa,
      imagens,
      autor: post.autor || 'Samukah',
      slug: post.slug || criarSlug(post.titulo || post.manchete || 'post'),
      criadoEm: serverTimestamp(),
    });
  }));
  localStorage.removeItem(POSTS_LEGADOS);
}

async function criarPost() {
  const titulo = ui.titulo?.value.trim();
  const conteudo = ui.conteudo?.value.trim();
  if (!titulo || !conteudo) return alert('Preencha todos os campos!');
  ui.salvarPost.disabled = true;
  try {
    const capa = ui.imagemCapa?.files[0] ? await enviarImagem(ui.imagemCapa.files[0]) : '';
    const imagens = await Promise.all(Array.from(ui.imagens?.files || []).map(enviarImagem));
    await addDoc(collection(db, POSTS), {
      manchete: ui.manchete?.value.trim() || titulo,
      titulo,
      conteudo,
      categoria: ui.categoria?.value || 'Celulares',
      capa,
      imagens,
      autor: 'Samukah',
      slug: criarSlug(titulo),
      criadoEm: serverTimestamp(),
    });
    ui.titulo.value = '';
    ui.manchete.value = '';
    ui.conteudo.value = '';
    ui.categoria.value = 'Celulares';
    if (ui.imagemCapa) ui.imagemCapa.value = '';
    if (ui.imagens) ui.imagens.value = '';
    if (ui.popup) ui.popup.style.display = 'none';
    await carregarPosts();
    sucesso('Post salvo com sucesso!');
  } catch (erro) {
    console.error('Erro ao salvar post:', erro);
    avisar('Não foi possível salvar a postagem. Verifique o Cloudinary e as regras do Firestore.');
  } finally {
    ui.salvarPost.disabled = false;
  }
}

async function excluirPost(post) {
  try {
    await deleteDoc(doc(db, POSTS, post.id));
    await carregarPosts();
    sucesso('Post excluído com sucesso!');
  } catch (erro) {
    console.error('Erro ao excluir post:', erro);
    avisar('Não foi possível excluir a postagem.');
  }
}

function configurarLista() {
  ui.novoPost?.addEventListener('click', () => { ui.popup.style.display = 'flex'; });
  ui.fecharPopup?.addEventListener('click', () => { ui.popup.style.display = 'none'; });
  ui.salvarPost?.addEventListener('click', criarPost);
  ui.pesquisa?.addEventListener('input', () => filtrarPosts(ui.pesquisa.value));
}

function postNaoEncontrado() {
  if (!ui.completo) return;
  const aviso = elemento('p', 'Postagem não encontrada. ', 'sem-posts');
  const voltar = elemento('a', 'Voltar ao início');
  voltar.href = 'Index.html';
  aviso.append(voltar);
  ui.completo.replaceChildren(aviso);
}

function renderizarPostCompleto(post) {
  document.title = `${post.titulo} | Meu Blog Tech`;
  const artigo = document.createElement('article');
  artigo.append(
    elemento('span', post.categoria || 'Sem categoria', 'post-categoria'),
    elemento('h1', post.manchete || post.titulo),
    elemento('p', `${formatarCriadoEm(post.criadoEm)} · ${post.autor || 'Samukah'}`, 'post-meta'),
  );
  if (post.capa) artigo.append(imagem(post.capa, post.manchete || post.titulo, 'post-capa'));
  artigo.append(elemento('h2', post.titulo));
  const texto = elemento('p', post.conteudo, 'post-texto');
  texto.style.whiteSpace = 'pre-line';
  artigo.append(texto);
  (post.imagens || []).forEach((src) => artigo.append(imagem(src, 'Imagem da notícia', 'post-imagem')));
  ui.completo.replaceChildren(artigo);
}

async function carregarPostCompleto() {
  if (!ui.completo) return;
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) return postNaoEncontrado();
  try {
    const registro = await getDoc(doc(db, POSTS, id));
    if (!registro.exists()) return postNaoEncontrado();
    renderizarPostCompleto({ id: registro.id, ...registro.data() });
  } catch (erro) {
    console.error('Erro ao carregar post:', erro);
    postNaoEncontrado();
  }
}

configurarTema();
configurarLista();
carregarPosts();
carregarPostCompleto();
