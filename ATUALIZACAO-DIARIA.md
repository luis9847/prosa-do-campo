# Atualização diária dos preços

Este documento descreve como atualizar os arquivos de dados do site: `data/cotacoes.json` (todo dia útil), `data/noticias.json` e `data/clima.json` (notícias; todo dia útil) e `data/dicas.json` (dicas e leituras; de vez em quando). Pode ser seguido por uma pessoa ou por uma tarefa agendada do Claude.

## Regras que não podem ser quebradas

1. **Nunca inventar nem estimar um valor.** Se não achar um preço novo em fonte confiável, mantenha o valor anterior com a data dele, ou escreva "sem dado".
2. **Toda linha tem data.** A coluna "Data" mostra o dia a que o preço se refere, não o dia da coleta.
3. **Conferir o ano.** Descarte páginas de 2025 ou anteriores. Já apareceram preços de leite e de dólar de anos antigos nas buscas.
4. **Só Minas Gerais.** Preços de outros estados ficam de fora. A única exceção é o bloco "Referências nacionais", que já está identificado como tal.
5. **Separar pregão de fechamento.** Valores durante o pregão são estimativas, e o texto precisa dizer isso. O dólar leva sempre o horário.
6. **Conferir duas vezes quando possível.** Exemplo: a variação do dia deve bater com o preço anterior (1.802 para 1.747 é −3,05%). Se duas fontes divergirem, explique no campo `nota`, como foi feito com o dólar.
7. A variação de grãos e café no resumo diário do O Tempo é a **média das praças**. Diga isso na nota.

## Onde buscar

| Dado | Fonte usada | Observação |
|---|---|---|
| Soja, milho, feijão, frango, algodão, banana, leite (Conseleite-MG) | O Tempo, "Cotações do agro em Minas" (uma página por dia, com dados da BBM, Avimig, Conab, CeasaMinas) | Endereço: `otempo.com.br/agro/AAAA/MM/DD/cotacoes-do-agro-em-minas-DD-MM-AAAA` |
| Café por cooperativa (tipo 6 dura, cereja descascado) | Cotação do Café (`cotacaodocafe.com`) e Café em Foco (`muzambinho.com.br`) | O primeiro é do pregão; o segundo, do fechamento |
| Indicadores de café | Cepea, via Muzambinho.com e Brasil 61 | Referência nacional |
| Boi gordo | Cepea, via portais de notícias | Ainda falta Sul de Minas |
| Leite pago ao produtor | Cepea, via Diário do Comércio | Sai uma vez por mês |
| Hortifrúti | Boletim semanal da Seapa-MG (Ceasa Minas) | Sai uma vez por semana |
| Dólar | Portais de câmbio (BPMoney, Istoé Dinheiro, Piranot) e PTAX do Banco Central | Registrar horário |

## Formato do arquivo

- `atualizadoEm`: data e hora da coleta, no formato `2026-11-25T16:30:00-03:00`. **Sempre atualizar.** Com mais de 30 horas, o site avisa que os preços podem estar desatualizados.
- `dolar`: `valor`, `variacaoPct`, `hora`, `data`, `tipo`, `ptax`, `fonte`, `url`, `nota`, `linhas`.
- `ticker`: lista da faixa rolante. Cada item tem `k` (nome), `v` (valor), `u` (unidade), `d` (data) e `dir` (`1` alta, `-1` queda, `0` estável, `null` sem seta).
- `paineis`: quadros de cotação. Cada um tem `icone` (`boi`, `leite`, `grao`, `cafe`, `cesta`, `folha`), `titulo`, `sub`, `blocos` (tabelas com `colunas`, `linhas`, `nota` e `fontes`). Linhas aceitam texto simples ou `{ "t": texto, "s": legenda, "cls": "val|up|down|dt" }`.
- Notícias ficam em arquivos próprios (o campo `noticias` não existe mais em `cotacoes.json`):
  - `data/noticias.json`: `atualizadoEm` e `itens` com `titulo` (exato, como na página), `fonte`, `data` (`dd/mm/aaaa`, com ano), `url` (só `https://`), `tema` (`boi`, `leite`, `cafe`, `graos`, `mercado`) e `impacto` (uma frase própria, opcional; nunca copiar trecho da matéria). Manter de 12 a 20 itens dos últimos 15 dias, apagando os mais velhos.
  - `data/clima.json`: `noticias` (mesmo formato, com `tema` `chuva`, `geada`, `calor`, `seca` ou `geral`, e `regiao` `Sul de Minas`, `Minas Gerais` ou `Brasil`), `links` (avisos oficiais) e `sazonal` (perspectiva oficial, ou `null`).
  - `data/dicas.json`: `dicas` (`area`: `cafe`, `milho`, `soja`, `feijao`, `corte`, `recria`, `leite`; `titulo`, `texto`, `epoca`, `fonte`, `url`, `data`) e `artigos`. Só fontes técnicas (Embrapa, Epamig, Emater-MG, Cooxupé, universidades). Sem dose de remédio nem receita de agrotóxico.
  - Regra para notícias: abrir cada página, conferir título, data e ano antes de incluir. Se não abrir, não entra.

## Passo a passo

1. Buscar os valores novos nas fontes acima, seguindo as regras. Também buscar notícias novas do mercado (boi, leite, café, grãos) e do clima em Minas e atualizar `noticias.json` e `clima.json`.
2. Editar os arquivos de dados e atualizar `atualizadoEm` de cada um.
3. Validar que o arquivo continua correto: `for f in data/*.json; do node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" || echo erro em $f; done`.
4. Publicar o arquivo. No GitHub, é um commit com a mensagem "Atualiza cotações DD/MM".
5. Abrir o site e conferir a faixa de cotações, o dólar no menu e as tabelas.

## Texto para a tarefa agendada do Claude

> Atualize `data/cotacoes.json` do site Prosa do Campo seguindo `ATUALIZACAO-DIARIA.md`. Busque os preços de hoje de Minas Gerais (soja, milho, feijão, café por cooperativa, leite, boi, hortifrúti, frango, dólar) . Não invente valores, confira o ano e as datas, mantenha a data de cada preço, atualize `atualizadoEm`, valide o JSON e publique com a mensagem "Atualiza cotações DD/MM". No fim, liste o que não foi possível confirmar.
