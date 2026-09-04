# Feedback do Matheus — 03/09/2026

Anotações de um áudio longo do cliente (transcrito). A lista abaixo ficou
documentada em 03/09 e foi **implementada em 04/09/2026** (o cliente autorizou
seguir com tudo). Deixei os itens originais riscados por seção como histórico,
e um resumo do que foi feito no topo.

---

## STATUS — implementado em 04/09/2026

Feito: Hero sai em ~1 scroll com animação de saída mais forte · Ponto Cego mais
perto + título digitado (sem loop) · CTA de fundo do Portfólio removido + glow
sutil no fundo da seção · hover "tremido" trocado por glow vermelho (com
equivalente de toque no mobile) · Serviços reescrito (menos 1ª pessoa, pacote
+ serviço pontual + análise grátis, menção transparente de IA, card novo
"Vídeos/Anúncios com IA", seleção por círculo em cada serviço + botão de
WhatsApp que já monta a mensagem com o que foi marcado, caixa "Ecossistema MA
Growth" em destaque vermelho) · seção "Como Funciona" removida (HTML + CSS
morto) · Sobre reescrito (novo H2, menção à Unisanta/USC, nova frase no lugar
de "decisão sem intermediário", caixinha "Prazo claro" removida, aspas da
citação removidas + citação também digitada, card lateral agora fica parado/
centralizado em vez de seguir o scroll) · Contato com título digitado (mais
rápido que a Hero) e subtítulo sem "eu" · espaçamento das seções reduzido
(mobile principalmente).

Ainda **em aberto** (não mexi nesta rodada):
- Avaliar o vídeo de intro (`#intro`/`introVideo`) — se vale a pena manter,
  ritmo/corte. Só dá pra decidir vendo o vídeo real, não só o código.
- Pesquisa de mercado mais aprofundada (referências tipo G4, benchmarks
  BR/US) — usei bom senso de copywriting nas mudanças de texto, mas não fiz
  uma pesquisa externa extensa pra não gastar à toa.

Prioridade original (histórico): `[alto]` `[médio]` `[baixo]`.

---

## 1. Hero (`#top`, `.hero-wrap`, `heroScrollCue`)
- `[alto]` Some da tela rápido demais em scroll longo — hoje o `.hero-wrap` tem
  `height: 150vh` (130vh no mobile, `main.css` ~L1799/1805) e o fade de opacidade
  acompanha esse scroll todo (`main.js` ~L532-585). Ele quer **1 scroll** com uma
  animação de saída, não 3 telas de rolagem gradual.
- `[médio]` Avaliar o **vídeo de intro** (`#intro`/`introVideo`) como se fosse
  cliente vendo pela 1ª vez: vale a pena manter? A velocidade está boa? Ele comentou
  que o vídeo "parece meio amador" — reavaliar corte/ritmo ou considerar remover.

## 2. Ponto Cego (`#problema`)
- `[alto]` Reduzir a "distância" de scroll até chegar nessa seção (está vindo
  logo após a Hero + Marquee, mas a percepção dele é de que precisa rolar muito —
  provavelmente efeito colateral do mesmo problema do item 1).
- `[alto]` Trocar a animação de entrada: hoje é `data-reveal` simples (fade/subida).
  Ele curtiu a interatividade da Hero, mas aqui quer algo **mais discreto**, tipo
  saída suave no scroll — não repetir o mesmo nível de interatividade da Hero
  (achou cansativo repetir).
- `[alto]` O título "O seu cliente não escolhe quem ele não lembra." (H2, L171)
  deve ganhar efeito de **máquina de escrever** (igual ao `heroTyped`/`heroCaret`
  da Hero) ao entrar no viewport — mas **sem loop** (só a Hero repete em loop).
  Manter o cursor/travessão vermelho parado no final, se ficar bom visualmente.
- `[médio]` Copy já está boa ("A maioria dos negócios não perde venda por falta
  de qualidade...") — ele pediu para revisar se todo o site sustenta o
  posicionamento de R$10-30k. Reler com esse filtro, não reescrever à toa.

## 3. Portfólio / "Amostra do meu trabalho" (`#portfolio`)
- `[médio]` Ele acha que pode estar "sem graça" — se confirmar, mexer no
  background/fundo da seção (`.section--alt`), não necessariamente no conteúdo.
- `[alto]` Remover o CTA final `.work__cta` ("Quer ver os projetos completos...
  Pedir o portfólio completo", L253-259) — seção inteira sai.
- `[baixo]` Caixa "Ferramentas" (L244-251): o texto já está bom e já é impessoal
  ("Usadas no processo de criação e execução de cada entrega") — conferir se bate
  exatamente com o que ele quer, mas não parece precisar de mudança de conteúdo.

## 4. Hover do Portfólio (`.hoverlist__item:hover`, `@keyframes hoverGlitch` L917)
- `[alto]` Trocar a animação de hover "tremida" (glitch) por algo mais sutil —
  ele sugeriu um **glow/contorno avermelhado** ao redor do item, não um efeito
  totalmente diferente, só menos "nervoso". Lembrar que no mobile não existe
  hover — garantir que a versão touch (tap) já tem um tratamento equivalente
  (hoje o `:hover` some sozinho no touch, então provavelmente já é ok, mas
  vale conferir o estado ativo/focus no celular).

## 5. Serviços (`#servicos`)
- `[médio]` Copy geral aprovada — mas revisar todo o site para **reduzir 1ª
  pessoa** ("Escrevo", "Defino", "Publico"...). Preferir formas mais neutras
  ("planejamos", "entrego", passiva) porque nem tudo é feito 100% por ele — usa
  IA no processo. Não precisa dizer explicitamente "uso IA para tudo", só evitar
  o "eu, eu, eu" que soa como estar sozinho fazendo tudo à mão.
  - Já existe um bom exemplo a seguir: o card "Conteúdo & Copy" (L320-321) —
    ele mesmo sugeriu a frase "Utilizo textos que explicam o seu valor sem
    enrolação e conduzem quem lê até o contato" no lugar de "Escrevo textos...".
- `[alto]` Deixar explícito que ele atende tanto **pacote fechado** quanto
  **serviços avulsos/pontuais**, e que qualquer serviço escolhido passa por uma
  análise antes (para não ser feito "de qualquer jeito"). Mencionar que a
  **análise é gratuita**.
- `[alto]` Adicionar nova entrega: **"Vídeos/Anúncios com IA"** — já existe como
  categoria no hoverlist do Portfólio e na marquee, mas falta um resumo dedicado
  no estilo dos outros cards de Serviços (vídeos realistas feitos com IA,
  anúncio de produto/loja, etc. — abrir o leque, "todas as ideias são bem-vindas
  mas alguns pontos técnicos precisam ser alinhados").
- `[alto]` Mencionar uso de IA no processo de forma **transparente mas não
  gritante**: "uso IA para otimizar processos e auxiliar na criação" — sem
  esconder, mas também sem virar o assunto principal do card.
- `[médio]` Seleção de serviço + CTA qualificado: colocar um marcador tipo
  círculo/checkbox em cada item de serviço (aqui ou no hoverlist do Portfólio —
  decidir onde faz mais sentido tecnicamente) para o visitante marcar o(s)
  serviço(s) de interesse (inclui a opção "Ecossistema MA Growth completo").
  O botão de contato final deve levar para o WhatsApp com a mensagem
  pré-preenchida citando o(s) serviço(s) selecionado(s), para o lead já chegar
  qualificado/direcionado.
- `[médio]` Caixa em destaque (fundo vermelho, mesmo estilo das outras caixas de
  destaque do site) para **"Ecossistema MA Growth"** — pacote completo — deixando
  claro que não é obrigatório fechar um combo específico, é só uma opção.
- `[alto]` Remover a seção **"Como Funciona"** inteira (`#como-funciona`,
  L332-368) — com a explicação do Ecossistema + seleção de serviço, ela fica
  redundante e pesa o site.

## 6. Sobre (`#sobre`)
- `[alto]` Trocar o H2 "Uma pessoa só." (L377) — não quer bater na tecla de
  "sou só eu sozinho fazendo tudo". Algo como "Um pouco sobre mim" ou copy
  parecida.
- `[alto]` Adicionar que ele é **estudante de Publicidade e Propaganda na
  Unisanta (USC)** — mencionar isso e amarrar com um resumo do que é o
  trabalho dele, com base no resto do site.
- `[alto]` Mencionar fundador + uso de IA no processo, mas sem deixar
  **óbvio demais** — nível "evidente mas não escancarado" (ele já cita IA no
  parágrafo principal, L379-380 — conferir se o tom está no ponto certo depois
  das outras mudanças).
- `[alto]` Remover a frase "Resposta rápida. Decisão sem intermediário." (L383)
  — tecnicamente tem um intermediário, que é a IA no processo. Definir uma frase
  nova alinhada ao modelo de negócio real dele.
- `[alto]` Remover a caixinha "Prazo claro / Combinado no início, cumprido no
  fim" (`.about__facts` / `.fact`, L391-396) — está vago demais.
- `[médio]` Manter "Não prometo número mágico... prazo combinado..." (L385-389)
  — ele quer continuar trabalhando com a ideia de prazo combinado. Considerar
  destacar visualmente a frase final "meu objetivo é gerar mais vendas —
  atraindo os clientes certos pra você", que é o ponto central.
- `[alto]` Remover as aspas (`&ldquo;` / `&rdquo;`, L401-404) do card lateral
  `.about__card` — a frase "Marca boa não é a mais barata nem a mais
  barulhenta. É a que o cliente lembra quando finalmente decide comprar." é boa
  copy, mas ele nunca disse isso como citação — manter o texto, só tirar as
  aspas (fica como afirmação da marca, não uma "citação dele mesmo"). Manter a
  assinatura "Matheus Almeida · MA Growth".
- `[médio]` No scroll, esse cartão lateral (`.about__card`) hoje se move/desloca
  — ele quer **centralizado e parado** (sem ficar seguindo o scroll). Pode ganhar
  uma entrada simples ao aparecer no viewport, mas sem "flutuar" depois.
- `[médio]` A frase do quote pode ganhar efeito de **máquina de escrever**
  igual à Hero, mas **sem loop** (escreve uma vez e para, cursor/travessão pode
  ficar parado no final).

## 7. Contato (`#contato`)
- `[alto]` Aplicar o mesmo efeito de digitação (texto + travessão vermelho na
  frente, como na Hero) no título "Vamos conversar sobre o seu projeto?" — mas
  **mais rápido** que a velocidade usada na Hero (não pode ficar lento).
- `[baixo]` Revisar 1ª pessoa no subtítulo "Eu te respondo dizendo se consigo
  ajudar..." (L419-420) — mesmo critério do item 5.

## 8. Geral / todas as seções
- `[alto]` Passar o site inteiro pelo crivo de "isso soa como só uma pessoa
  fazendo tudo sozinha, na mão?" e suavizar — sem esconder que existe um
  fundador único, só sem exagerar na 1ª pessoa repetida.
- `[médio]` Analisar se o site está "pesado"/comprido demais, principalmente
  no celular. Onde estiver, reduzir **espaçamento** antes de reduzir conteúdo
  (prioridade: `padding`/`margin` entre seções e dentro dos cards/grades), e
  só depois considerar reduzir tipografia ou enxugar texto. Objetivo: não ficar
  cansativo nem "parado" — ir intercalando pequenas animações de entrada
  conforme rola a página, sem exagerar (ver item 4, que já está exagerado hoje).
- `[baixo]` Pesquisar referências de mercado (agências como G4 Educação,
  outras referências BR/US, boas práticas de copywriting/CRO) para embasar as
  decisões de copy e estrutura — sem virar pesquisa acadêmica longa, só uso
  pontual para validar decisões.
- Ele pediu explicitamente para eu **decidir** a maioria dos pontos de design/
  copy sem ficar perguntando item a item — só avisar depois, resumido, o que
  foi mudado e por quê.

## 9. Processo / relatório (para mim, não para o site)
- Não gerar relatório separado grande — só resumo curto no chat depois de cada
  rodada de mudanças.
- Se eu criar algo novo (ex: nova animação, novo componente), explicar em 1-2
  frases como funciona.
- Guardar tudo isso no GitHub (este arquivo) em vez de só na conversa, porque
  o cliente está de olho no limite de uso e pode encerrar a sessão a qualquer
  momento.
- Ele autorizou trocar livremente entre modelos (Opus/Sonnet) conforme a
  necessidade de cada tarefa.
- Orçamento pedido para esta rodada: bem enxuto (ele citou algo como +5-7% de
  uso semanal / até no máximo ~20% do limite de horas do plano Pro, sendo
  10-12% o alvo confortável). Ou seja: priorizar itens `[alto]` primeiro, em
  lotes pequenos, com confirmação entre lotes maiores em vez de tentar tudo de
  uma vez.

---

### Ordem sugerida para a próxima sessão (lotes pequenos)
1. Remoções rápidas e de baixo risco: `.work__cta` (portfólio), `#como-funciona`,
   aspas do quote, caixinha "Prazo claro", frase "Resposta rápida. Decisão sem
   intermediário."
2. Ajuste do fade/scroll da Hero (reduzir `.hero-wrap` height + curva de opacidade)
   e replicar o critério na seção Ponto Cego.
3. Efeito de digitação no H2 do Ponto Cego e no título do Contato (sem loop,
   mais rápido no Contato).
4. Trocar `hoverGlitch` por glow vermelho.
5. Copy: reduzir 1ª pessoa, novo card "Vídeos/Anúncios com IA", texto novo do
   "Sobre" (Unisanta/USC), caixa "Ecossistema MA Growth".
6. Seleção de serviço + CTA de WhatsApp qualificado (mexe em JS, é o item mais
   trabalhoso — deixar por último).
