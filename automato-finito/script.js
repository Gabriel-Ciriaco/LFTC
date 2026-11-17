const elementosDom = {
    tipoAfdButton: document.getElementById("tipoAfdButton"),
    tipoAfndButton: document.getElementById("tipoAfndButton"),
    exemploAfdButton: document.getElementById("exemploAfdButton"),
    exemploAfndButton: document.getElementById("exemploAfndButton"),
    limparButton: document.getElementById("limparButton"),

    ferramentaButtons: document.querySelectorAll("#barraFerramentas .ferramenta"),
    containerDiagramaDiv: document.getElementById("containerDiagrama"),
    diagramaCanvasDiv: document.getElementById("diagramaCanvas"),

    promptTransicaoDiv: document.getElementById("promptTransicao"),
    promptTransicaoTextoSpan: document.getElementById("promptTransicaoTexto"),
    inputSimbolosTransicao: document.getElementById("inputSimbolosTransicao"),
    confirmarTransicaoButton: document.getElementById("confirmarTransicaoButton"),
    cancelarTransicaoButton: document.getElementById("cancelarTransicaoButton"),

    menuContextoDiv: document.getElementById("menuContexto"),
    menuInicialButton: document.getElementById("menuInicialButton"),
    menuFinalButton: document.getElementById("menuFinalButton"),
    menuEditarButton: document.getElementById("menuEditarButton"),
    menuRemoverButton: document.getElementById("menuRemoverButton"),

    editorSelecaoDiv: document.getElementById("editorSelecao"),
    editorTituloSpan: document.getElementById("editorTitulo"),
    editorValorInput: document.getElementById("editorValorInput"),
    editorSalvarButton: document.getElementById("editorSalvarButton"),
    editorInicialButton: document.getElementById("editorInicialButton"),
    editorFinalButton: document.getElementById("editorFinalButton"),
    editorRemoverButton: document.getElementById("editorRemoverButton"),

    saidaAutomatoDiv: document.getElementById("saidaAutomato"),

    entradaUnicaInput: document.getElementById("entradaUnica"),
    iniciarSimulacaoButton: document.getElementById("iniciarSimulacaoButton"),
    painelPassoAPassoDiv: document.getElementById("painelPassoAPasso"),
    passoAnteriorButton: document.getElementById("passoAnteriorButton"),
    proximoPassoButton: document.getElementById("proximoPassoButton"),
    autoPlayButton: document.getElementById("autoPlayButton"),
    resetarSimulacaoButton: document.getElementById("resetarSimulacaoButton"),
    infoPassoSpan: document.getElementById("infoPasso"),
    fitaSimulacaoDiv: document.getElementById("fitaSimulacao"),
    statusPassoDiv: document.getElementById("statusPasso"),

    entradasTextarea: document.getElementById("entradas"),
    testarMultiplasButton: document.getElementById("submitButton"),
    resultadosDiv: document.getElementById("resultados")
};

let tipoAutomato = "AFD";

function exibirErros(erros)
{
    elementosDom.saidaAutomatoDiv.innerHTML = "";

    erros.forEach((erro) => {
        let pErro = document.createElement("p");
        pErro.className = "erro";
        pErro.textContent = erro;
        elementosDom.saidaAutomatoDiv.appendChild(pErro);
    });
}

function validarEAtualizarSaida()
{
    let automato = diagrama.exportarAutomato(tipoAutomato);
    let validacao = automato.validar();

    if (!validacao.valido && automato.estados.length > 0)
    {
        exibirErros(validacao.erros);
    }
    else
    {
        elementosDom.saidaAutomatoDiv.innerHTML = "";
    }

    return validacao;
}

const diagrama = new DiagramaControlador(elementosDom, () => {
    simulacao.resetar();
    validarEAtualizarSaida();
});

const simulacao = new SimulacaoControlador(elementosDom, diagrama, exibirErros);

function definirTipoAutomato(novoTipo)
{
    tipoAutomato = novoTipo;
    elementosDom.tipoAfdButton.classList.toggle("ativo", novoTipo === "AFD");
    elementosDom.tipoAfndButton.classList.toggle("ativo", novoTipo === "AFND");

    simulacao.resetar();
    validarEAtualizarSaida();
}

function limparTudo()
{
    diagrama.limpar();
    simulacao.resetar();
    elementosDom.saidaAutomatoDiv.innerHTML = "";
    elementosDom.resultadosDiv.innerHTML = "";
}

function carregarExemploAfd()
{
    definirTipoAutomato("AFD");

    diagrama.carregarAutomato(
        [
            { id: "q0", rotulo: "q0", posicao: { x: 140, y: 185 }, inicial: true, final: false },
            { id: "q1", rotulo: "q1", posicao: { x: 340, y: 185 }, inicial: false, final: false },
            { id: "q2", rotulo: "q2", posicao: { x: 540, y: 185 }, inicial: false, final: true }
        ],
        [
            { origem: "q0", destino: "q1", simbolos: "0" },
            { origem: "q0", destino: "q0", simbolos: "1" },
            { origem: "q1", destino: "q1", simbolos: "0" },
            { origem: "q1", destino: "q2", simbolos: "1" },
            { origem: "q2", destino: "q1", simbolos: "0" },
            { origem: "q2", destino: "q0", simbolos: "1" }
        ]
    );

    elementosDom.entradaUnicaInput.value = "101";
    elementosDom.entradasTextarea.value = "01\n101\n010\n11\n";
    elementosDom.resultadosDiv.innerHTML = "";
}

function carregarExemploAfnd()
{
    definirTipoAutomato("AFND");

    diagrama.carregarAutomato(
        [
            { id: "q0", rotulo: "q0", posicao: { x: 120, y: 185 }, inicial: true, final: false },
            { id: "q1", rotulo: "q1", posicao: { x: 290, y: 185 }, inicial: false, final: false },
            { id: "q2", rotulo: "q2", posicao: { x: 460, y: 185 }, inicial: false, final: false },
            { id: "q3", rotulo: "q3", posicao: { x: 620, y: 185 }, inicial: false, final: true }
        ],
        [
            { origem: "q0", destino: "q0", simbolos: "a, b" },
            { origem: "q0", destino: "q1", simbolos: "a" },
            { origem: "q1", destino: "q2", simbolos: "b" },
            { origem: "q2", destino: "q3", simbolos: "" }
        ]
    );

    elementosDom.entradaUnicaInput.value = "aab";
    elementosDom.entradasTextarea.value = "ab\naab\nba\nb\n";
    elementosDom.resultadosDiv.innerHTML = "";
}

elementosDom.tipoAfdButton.addEventListener("click", () => definirTipoAutomato("AFD"));
elementosDom.tipoAfndButton.addEventListener("click", () => definirTipoAutomato("AFND"));
elementosDom.exemploAfdButton.addEventListener("click", carregarExemploAfd);
elementosDom.exemploAfndButton.addEventListener("click", carregarExemploAfnd);
elementosDom.limparButton.addEventListener("click", limparTudo);

elementosDom.iniciarSimulacaoButton.addEventListener("click", () => {
    simulacao.iniciar(diagrama.exportarAutomato(tipoAutomato));
});

elementosDom.entradaUnicaInput.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter")
    {
        simulacao.iniciar(diagrama.exportarAutomato(tipoAutomato));
    }
});

elementosDom.testarMultiplasButton.addEventListener("click", () => {
    simulacao.testarMultiplas(diagrama.exportarAutomato(tipoAutomato));
});

// Carrega um AFD inicial para facilitar o primeiro uso
carregarExemploAfd();
