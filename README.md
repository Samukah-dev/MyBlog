X.X.X
│ │ └── Correções pequenas
│ └──── Novas funcionalidades
└────── Grandes mudanças

==================================================
VERSÃO 1.0.0
==================================================

Data:
27/07/2026

Tecnologias
- HTML
- CSS
- JavaScript
- LocalStorage

Recursos
- Tema escuro
- Criação de posts
- Pesquisa
- Categorias
- Upload de imagens (Base64)
- Botão excluir post

Limitações
- Os posts ficam apenas no navegador.
- Não existe login.
- Não existe banco de dados.

Motivo da próxima versão
Migrar para Firebase para que as postagens sejam armazenadas online.

==================================================
VERSÃO 1.1.0
==================================================

Data:
28/07/2026

Objetivo
Primeira integração com Firebase.

Mudanças
- Firestore
- Cloudinary
- Página individual das notícias
- Melhor organização do JavaScript

Correções
- Removido localStorage para os posts.
- Separação entre dados e imagens.

Arquitetura

Cloudinary
    ↓
URL da imagem
    ↓
Firestore
    ↓
Blog

Problemas conhecidos
- Login de administrador ainda não implementado.
- remoção indesejada do botão excluir post.
