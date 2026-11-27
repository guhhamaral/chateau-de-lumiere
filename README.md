# Château de Lumière · site

Site estático (HTML, CSS e JavaScript), sem etapa de build: é só publicar esta pasta como está.

## Publicar no GitHub Pages
1. Envie todo o conteúdo desta pasta para a raiz do repositório (branch `main`).
2. No repositório: **Settings → Pages → Build and deployment**.
   Em *Source* escolha **Deploy from a branch**, depois **main** e **/ (root)**, e clique em **Save**.
3. Em 1 ou 2 minutos o site abre em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

Também funciona na Vercel ou na Netlify: importe o repositório sem comando de build, com a raiz como pasta pública.

## Estrutura
- `index.html` e as demais páginas `.html`
- `assets/` — estilos (`style.css`, `experience.css`) e scripts (`experience.js`, `app.js`)
- `img/` — recortes e tratamentos de imagem feitos para o site
- `fotos/` — fotografias e logotipos usados nas páginas
- `robots.txt`, `sitemap.xml`, `llms.txt` — SEO e busca por IA

## Domínio
Canonical, sitemap, dados estruturados e `llms.txt` já apontam para `https://chateaudelumiere.com.br`.
Ao ligar o domínio oficial ao site, nada precisa ser alterado.

## Fotografias
Os créditos dos fotógrafos parceiros aparecem nas legendas e na ampliação de cada foto.
