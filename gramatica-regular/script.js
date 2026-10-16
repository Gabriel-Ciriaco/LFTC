const gramaticaDiv = document.getElementById("gramatica");
const saidaGramaticaDiv = document.getElementById("saidaGramatica");
const entradasTextarea = document.getElementById("entradas");
const resultadosDiv = document.getElementById("resultados");

const novaProducaoButton = document.getElementById("novaProducao");
const exemploButton = document.getElementById("exemplo");
const limparButton = document.getElementById("limpar");
const testarButton = document.getElementById("submitButton");

let gramaticaAtual = null;

function criarInputRegra(valorInicial = "")
{
    let inputRegra = document.createElement("input");
    inputRegra.type = "text";
    inputRegra.className = "regra";
    inputRegra.placeholder = EPSILON;
    inputRegra.value = valorInicial;

    inputRegra.addEventListener("keydown", gerenciarTeclasRegra);
    inputRegra.addEventListener("input", atualizarVisualizacaoGramatica);

    return inputRegra;
}

function criarSeparadorOu()
{
    let spanSeparador = document.createElement("span");
    spanSeparador.className = "ou";
    spanSeparador.textContent = "|";

    return spanSeparador;
}

function adicionarLinhaProducao(ehInicial = false, naoTerminalInicial = "", regrasIniciais = [""])
{
    let linhaProducaoDiv = document.createElement("div");
    linhaProducaoDiv.className = "producao";

    let inputNaoTerminal = document.createElement("input");
    inputNaoTerminal.type = "text";
    inputNaoTerminal.className = "nt";
    inputNaoTerminal.maxLength = 1;
    inputNaoTerminal.value = ehInicial ? "S" : naoTerminalInicial;
    inputNaoTerminal.readOnly = ehInicial;

    inputNaoTerminal.addEventListener("keydown", gerenciarTeclasComuns);
    inputNaoTerminal.addEventListener("input", () => {
        inputNaoTerminal.value = inputNaoTerminal.value.toUpperCase();
        atualizarVisualizacaoGramatica();
    });

    let spanSeta = document.createElement("span");
    spanSeta.className = "seta";
    spanSeta.textContent = "→";

    let regrasContainerDiv = document.createElement("div");
    regrasContainerDiv.className = "regras";

    regrasIniciais.forEach((regraTexto, indice) => {
        if (indice > 0)
        {
            regrasContainerDiv.appendChild(criarSeparadorOu());
        }
        regrasContainerDiv.appendChild(criarInputRegra(regraTexto));
    });

    linhaProducaoDiv.appendChild(inputNaoTerminal);
    linhaProducaoDiv.appendChild(spanSeta);
    linhaProducaoDiv.appendChild(regrasContainerDiv);

    if (!ehInicial)
    {
        let removerButton = document.createElement("button");
        removerButton.type = "button";
        removerButton.className = "remover";
        removerButton.title = "Remover produção";
        removerButton.textContent = "✕";

        removerButton.addEventListener("click", () => {
            linhaProducaoDiv.remove();
            atualizarVisualizacaoGramatica();
        });

        linhaProducaoDiv.appendChild(removerButton);
    }

    gramaticaDiv.appendChild(linhaProducaoDiv);

    if (ehInicial)
    {
        regrasContainerDiv.firstChild.focus();
    }
    else
    {
        inputNaoTerminal.focus();
    }

    return linhaProducaoDiv;
}

function gerenciarTeclasComuns(event)
{
    if (event.key === "Enter")
    {
        event.preventDefault();

        adicionarLinhaProducao();
        atualizarVisualizacaoGramatica();

        return true;
    }

    if (event.key === "|")
    {
        event.preventDefault();

        return false;
    }

    return false;
}

function gerenciarTeclasRegra(event)
{
    let inputAtual = event.currentTarget;

    if (gerenciarTeclasComuns(event))
        return;

    if (event.key === "|")
    {
        let posicaoCursor = inputAtual.selectionStart;
        let novoInputRegra = criarInputRegra(inputAtual.value.substring(posicaoCursor));

        inputAtual.value = inputAtual.value.substring(0, posicaoCursor);
        inputAtual.after(criarSeparadorOu(), novoInputRegra);

        novoInputRegra.focus();
        novoInputRegra.setSelectionRange(0, 0);

        atualizarVisualizacaoGramatica();

        return;
    }

    if (event.key === "Backspace" &&
        inputAtual.selectionStart === 0 && inputAtual.selectionEnd === 0)
    {
        let elementoSeparador = inputAtual.previousSibling;

        if (!elementoSeparador || !elementoSeparador.classList.contains("ou"))
            return;

        event.preventDefault();

        let inputAnterior = elementoSeparador.previousSibling;
        let tamanhoAnterior = inputAnterior.value.length;

        inputAnterior.value += inputAtual.value;

        elementoSeparador.remove();
        inputAtual.remove();

        inputAnterior.focus();
        inputAnterior.setSelectionRange(tamanhoAnterior, tamanhoAnterior);

        atualizarVisualizacaoGramatica();
    }
}

function atualizarVisualizacaoGramatica()
{
    resultadosDiv.textContent = "";
    saidaGramaticaDiv.textContent = "";

    let { mapaProducoes, listaErros } = lerGramatica();

    if (listaErros.length > 0)
    {
        gramaticaAtual = null;

        listaErros.forEach((mensagemErro) => {
            let paragrafoErro = document.createElement("p");
            paragrafoErro.className = "erro mono";
            paragrafoErro.textContent = mensagemErro;

            saidaGramaticaDiv.appendChild(paragrafoErro);
        });

        return;
    }

    gramaticaAtual = mapaProducoes;

    let naoTerminais = obterNaoTerminais(mapaProducoes);
    let terminais = obterTerminais(mapaProducoes);

    let paragrafoDefinicao = document.createElement("p");
    paragrafoDefinicao.className = "mono";
    paragrafoDefinicao.textContent = `G = ({${naoTerminais.join(", ")}}, {${terminais.join(", ")}}, P, S)`;
    
    saidaGramaticaDiv.appendChild(paragrafoDefinicao);

    let alcancaveis = obterSimbolosAlcancaveis(mapaProducoes);
    let inalcancaveis = naoTerminais.filter((naoTerminal) => !alcancaveis.has(naoTerminal));

    if (inalcancaveis.length > 0)
    {
        let paragrafoInalcancaveis = document.createElement("p");
        paragrafoInalcancaveis.className = "mono";
        paragrafoInalcancaveis.textContent = `Inalcançáveis: ${inalcancaveis.join(", ")}`;

        saidaGramaticaDiv.appendChild(paragrafoInalcancaveis);
    }

    let produtivos = obterSimbolosProdutivos(mapaProducoes);
    let improdutivos = naoTerminais.filter((naoTerminal) => !produtivos.has(naoTerminal));

    if (improdutivos.length > 0)
    {
        let paragrafoImprodutivos = document.createElement("p");
        paragrafoImprodutivos.className = "mono";
        paragrafoImprodutivos.textContent = `Improdutivos: ${improdutivos.join(", ")}`;

        saidaGramaticaDiv.appendChild(paragrafoImprodutivos);
    }

    let amostraPalavras = gerarExemplosPalavras(mapaProducoes);

    let paragrafoExemplos = document.createElement("p");
    paragrafoExemplos.className = "mono";
    paragrafoExemplos.textContent = amostraPalavras.length > 0 ?
        `Exemplos: ${amostraPalavras.map((p) => p || EPSILON).join(", ")}` :
        "A linguagem não possui palavras curtas (ou é vazia).";

    saidaGramaticaDiv.appendChild(paragrafoExemplos);
}

function executarTestes()
{
    atualizarVisualizacaoGramatica();

    if (!gramaticaAtual)
        return;

    let linhasEntrada = entradasTextarea.value.split(/\r?\n/);

    linhasEntrada.forEach((linhaBruta) => {
        let palavraTeste = linhaBruta.replace(/\s/g, "").replaceAll(EPSILON, "");
        let passosDerivacao = derivarPalavra(gramaticaAtual, palavraTeste);

        let detailsResultado = document.createElement("details");
        detailsResultado.className = "resultado";

        let summaryResultado = document.createElement("summary");

        let spanPalavra = document.createElement("span");
        spanPalavra.className = "palavra mono";
        spanPalavra.textContent = `"${palavraTeste || EPSILON}"`;

        let spanBadge = document.createElement("span");
        spanBadge.className = "badge " + (passosDerivacao ? "aceita" : "rejeitada");
        spanBadge.textContent = passosDerivacao ? "Aceita · ver derivação" : "Rejeitada";

        summaryResultado.appendChild(spanPalavra);
        summaryResultado.appendChild(spanBadge);
        detailsResultado.appendChild(summaryResultado);

        if (passosDerivacao)
        {
            let containerDerivacao = document.createElement("div");
            containerDerivacao.className = "derivacao mono";

            passosDerivacao.forEach((passo, indice) => {
                let textoPasso = indice === 0 ? passo.formaSentencial : `⇒ ${passo.formaSentencial}`;
                containerDerivacao.append(textoPasso);

                if (passo.regraAplicada)
                {
                    let spanRegra = document.createElement("span");
                    spanRegra.className = "regra-usada";
                    spanRegra.textContent = `   (${passo.regraAplicada})`;

                    containerDerivacao.appendChild(spanRegra);
                }

                containerDerivacao.append("\n");
            });

            detailsResultado.appendChild(containerDerivacao);
        }
        else
        {
            summaryResultado.style.cursor = "default";
            summaryResultado.addEventListener("click", (e) => e.preventDefault());
        }

        resultadosDiv.appendChild(detailsResultado);
    });
}

function resetarGramatica(pedirConfirmacao = true)
{
    if (pedirConfirmacao && !confirm("Deseja apagar a gramática atual?"))
        return;

    gramaticaDiv.textContent = "";
    adicionarLinhaProducao(true);
    atualizarVisualizacaoGramatica();
}

function carregarExemplo()
{
    gramaticaDiv.textContent = "";

    adicionarLinhaProducao(true, "S", ["0S", "1S", "01"]);

    entradasTextarea.value = "01\n1101\n0001\n10\n\n011";

    executarTestes();
}

novaProducaoButton.addEventListener("click", () => adicionarLinhaProducao());
limparButton.addEventListener("click", () => resetarGramatica(true));
exemploButton.addEventListener("click", carregarExemplo);
testarButton.addEventListener("click", executarTestes);

resetarGramatica(false);
