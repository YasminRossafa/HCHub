# HCHub

Na UFSCar, horas complementares ainda funcionam como há vinte anos: o aluno imprime o certificado, grampeia tudo e leva pessoalmente até a secretaria do departamento — sem nenhuma forma de saber como está seu progresso até que alguém revise a pilha. O HCHub troca essa pilha de papel por um único painel. O aluno acompanha seu progresso por categoria assim que anexa um certificado; o professor valida com um clique, a partir de um link, sem precisar fazer login.

## Destaques

- ✅ **Login por e-mail/senha e Google, unificados.** Cadastre-se com e-mail e depois entre com Google (ou vice-versa) usando o mesmo endereço — o HCHub detecta o conflito e vincula as contas através de um diálogo de confirmação explícito, sem contas mescladas silenciosamente e sem contas órfãs.
- ✅ **Um dashboard que realmente soma.** Um grid de categorias adaptativo acompanha horas validadas e pendentes por categoria, calcula porcentagens de progresso considerando a meta de cada uma, e resume tudo em uma visão de progresso geral.
- ✅ **Subcategorias onde elas importam.** Extensão e Atividades Complementares — as duas categorias que a UFSCar realmente subdivide — ganham seu próprio detalhamento (Projetos de Extensão, ACIEPE, Monitoria, IC e mais), enquanto as demais permanecem simples.
- ✅ **Cadastro de certificado pensado para o celular.** Todo certificado exige uma foto, que é comprimida no próprio dispositivo antes de ir para o Storage — o upload continua rápido sem que o aluno precise pensar no tamanho do arquivo.
- ✅ **Histórico pesquisável.** Filtre por categoria e status, busque por título e veja de imediato quais certificados ainda aguardam revisão.
- ✅ **Relatórios em PDF com os comprovantes anexados.** Gere um relatório completo das horas complementares do aluno, com as imagens dos certificados incorporadas — o mesmo documento que uma coordenação pediria, sem a viagem até a impressora.
- ✅ **Exportação em ZIP com um clique.** Baixe todas as imagens de certificados de uma vez, em um arquivo zip, para quando a universidade quiser os arquivos originais em vez de um relatório.
- ✅ **Validação do professor sem conta de professor.** O aluno gera um link compartilhável e tokenizado; o professor o abre, revisa os certificados e valida ou rejeita em tempo real — tudo isso rodando sobre Cloud Functions, sem login no Firebase do lado do professor.
- ✅ **Modo escuro que respeita o sistema.** Tema escuro completo, adotando por padrão a preferência já configurada no sistema operacional.
- ✅ **Acessibilidade como padrão, não como extra.** HTML semântico, navegação completa por teclado, contraste WCAG AA em toda a aplicação, status sempre exibido com cor *e* ícone *e* texto (nunca só cor), e integração com VLibras.
- ✅ **Responsivo do corredor da faculdade ao escritório.** Todo o fluxo — incluindo o envio de certificados — foi construído com foco em dispositivos móveis.

## Stack técnica

- **React 19** + **Vite** para a base da aplicação
- **Tailwind CSS 4** para estilização
- **Firebase**: Authentication, Firestore, Storage e Cloud Functions (fluxo de validação do professor)
- **jsPDF** para geração de relatórios, **JSZip** para download em lote dos certificados

## Como rodar

```bash
git clone <repo-url>
cd HCHub
npm install
cp .env.example .env   # preencha com as credenciais do seu projeto Firebase
npm run dev
```

O `.env.example` lista tudo o que a aplicação precisa — as configurações do seu projeto Firebase, além de uma flag opcional para apontar o servidor de desenvolvimento para o Firebase Emulator Suite local em vez de um projeto em produção.

## Créditos

O HCHub foi desenvolvido para o **SeCoT XVIII**, a semana de tecnologia e empreendedorismo da UFSCar Sorocaba, em parceria com a **Rocketseat** e a **WorkWiser**.
