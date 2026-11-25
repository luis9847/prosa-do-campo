# Prosa do Campo

Site de notícias, clima e cotações do campo para Minas Gerais, com foco no Sul de Minas.

## O que tem na pasta

- `index.html`, `clima.html`, `cotacoes.html`, `noticias.html`, `dicas.html`: as cinco páginas.
- `assets/site.css` e `assets/site.js`: visual e programa, comuns às páginas.
- `data/cotacoes.json` (preços e dólar), `data/noticias.json` e `data/clima.json` (notícias), `data/dicas.json` (dicas e leituras). **São os arquivos que mudam no dia a dia.**
- `ATUALIZACAO-DIARIA.md`: o passo a passo para atualizar os preços com segurança.

## Como o site funciona

- Ao abrir, cada página lê os arquivos de `data/` de que precisa e monta quadros, faixa rolante, notícias e dicas.
- O **dólar** é buscado ao vivo ao abrir a página (AwesomeAPI). Se a busca falhar, o site mostra o último valor do arquivo, com o horário.
- O **clima e os alertas de geada e chuva forte** são buscados ao vivo (Open-Meteo), por cidade. Se falhar, o site avisa que a previsão está indisponível. Não mostra número inventado.
- A etiqueta "Atualizado em..." da seção Cotações avisa quando os preços têm mais de 30 horas ("podem estar desatualizados"). Assim, se a atualização diária parar, o visitante fica sabendo.

## Como colocar no ar

**Opção A, a mais simples (sem conta no GitHub).** Arraste esta pasta para o Netlify (netlify.com/drop) ou use o envio direto do Cloudflare Pages. Para atualizar os preços, troque o arquivo `data/cotacoes.json` e envie a pasta de novo.

**Opção B, recomendada (permite atualização diária automática).**
1. Crie no GitHub um repositório público chamado `prosa-do-campo`.
2. Envie os arquivos desta pasta para ele.
3. Em Settings > Pages, escolha "Deploy from a branch", branch `main`, pasta `/ (root)`.
4. O site fica em `https://SEU-USUARIO.github.io/prosa-do-campo/`. Dá para usar um domínio próprio depois.

## Para testar no seu computador

O site precisa de um servidor local por causa da leitura do arquivo de dados. Na pasta, rode `python3 -m http.server` e abra `http://localhost:8000`.

## Antes de abrir ao público

- Confirme os termos de uso das fontes (Cepea, BBM, portais de notícias). Pode ser preciso licença ou mostrar só um resumo com link.
- O dólar ao vivo e o clima ao vivo foram programados com as regras das duas APIs, mas **não puderam ser testados com a internet real** no ambiente em que o site foi montado. Teste no site publicado e me avise se algum não aparecer.
- Os preços e as variações são de fontes de terceiros. O site orienta o visitante a confirmar na fonte antes de fechar negócio.
