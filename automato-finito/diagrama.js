class DiagramaControlador
{
    constructor(elementosDom, aoAlterar)
    {
        this.elementosDom = elementosDom;
        this.aoAlterar = aoAlterar;

        this.modoAtual = "mover";
        this.contadorEstados = 0;
        this.contadorTransicoes = 0;
        this.estadoOrigemTransicaoId = null;
        this.transicaoPendente = null;
        this.elementoContexto = null;
        this.elementoSelecionado = null;

        this.cy = this.inicializarCytoscape();
        this.registrarEventosCytoscape();
        this.registrarEventosEdicao();
    }

    inicializarCytoscape()
    {
        return cytoscape({
            container: this.elementosDom.diagramaCanvasDiv,
            elements: [],
            wheelSensitivity: 0.25,
            minZoom: 0.4,
            maxZoom: 2.5,
            style: [
                {
                    selector: "node",
                    style: {
                        "shape": "ellipse",
                        "width": 48,
                        "height": 48,
                        "background-color": "#ffffff",
                        "border-width": 2.5,
                        "border-color": "#0f172a",
                        "label": "data(rotulo)",
                        "text-valign": "center",
                        "text-halign": "center",
                        "font-family": "ui-monospace, Consolas, monospace",
                        "font-size": 14,
                        "font-weight": 600,
                        "color": "#0f172a"
                    }
                },
                {
                    selector: "node.final",
                    style: { "border-style": "double", "border-width": 6 }
                },
                {
                    selector: "node.origem-transicao",
                    style: { "background-color": "#eff6ff", "border-color": "#2563eb" }
                },
                {
                    selector: "node.ativo",
                    style: { "background-color": "#dbeafe", "border-color": "#2563eb" }
                },
                {
                    selector: "node.ativo-aceita",
                    style: { "background-color": "#dcfce7", "border-color": "#16a34a" }
                },
                {
                    selector: "node.ativo-rejeita",
                    style: { "background-color": "#fee2e2", "border-color": "#dc2626" }
                },
                {
                    selector: "node:selected",
                    style: { "border-color": "#2563eb" }
                },
                {
                    selector: "node.marcador-inicio",
                    style: { "width": 1, "height": 1, "opacity": 0, "events": "no" }
                },
                {
                    selector: "edge",
                    style: {
                        "width": 2,
                        "line-color": "#475569",
                        "target-arrow-color": "#475569",
                        "target-arrow-shape": "triangle",
                        "curve-style": "bezier",
                        "control-point-step-size": 44,
                        "loop-direction": "0deg",
                        "loop-sweep": "-45deg",
                        "label": "data(rotulo)",
                        "font-family": "ui-monospace, Consolas, monospace",
                        "font-size": 13,
                        "font-weight": 600,
                        "color": "#0f172a",
                        "text-background-color": "#ffffff",
                        "text-background-opacity": 1,
                        "text-background-padding": "3px"
                    }
                },
                {
                    selector: "edge.ativa",
                    style: { "line-color": "#2563eb", "target-arrow-color": "#2563eb", "width": 3 }
                },
                {
                    selector: "edge:selected",
                    style: { "line-color": "#2563eb", "target-arrow-color": "#2563eb" }
                },
                {
                    selector: "edge.seta-inicio",
                    style: {
                        "width": 2.5,
                        "line-color": "#0f172a",
                        "target-arrow-color": "#0f172a",
                        "target-arrow-shape": "triangle",
                        "curve-style": "straight",
                        "label": "",
                        "events": "no"
                    }
                }
            ]
        });
    }

    exportarAutomato(tipoAutomato)
    {
        let estados = [];
        let transicoes = [];

        this.cy.nodes().forEach((no) => {
            if (no.hasClass("marcador-inicio"))
                return;

            estados.push(new Estado(
                no.id(),
                no.data("rotulo"),
                no.data("inicial"),
                no.data("final")
            ));
        });

        this.cy.edges().forEach((aresta) => {
            if (aresta.hasClass("seta-inicio"))
                return;

            transicoes.push(new Transicao(
                aresta.id(),
                aresta.data("source"),
                aresta.data("target"),
                aresta.data("simbolos") || [EPSILON]
            ));
        });

        return tipoAutomato === "AFD" ?
            new AFD(estados, transicoes) :
            new AFND(estados, transicoes);
    }

    obterNomeEstado(estadoId)
    {
        return this.cy.getElementById(estadoId).data("rotulo");
    }

    atualizarSetaInicial()
    {
        let marcador = this.cy.getElementById("__inicio");

        if (marcador.length > 0)
        {
            marcador.remove();
        }

        let noInicial = this.cy.nodes().filter((no) => !no.hasClass("marcador-inicio") && no.data("inicial"));

        if (noInicial.length === 0)
            return;

        let alvo = noInicial[0];
        let pos = alvo.position();

        this.cy.add([
            {
                group: "nodes",
                data: { id: "__inicio", rotulo: "" },
                position: { x: pos.x - 56, y: pos.y },
                classes: "marcador-inicio",
                selectable: false,
                grabbable: false
            },
            {
                group: "edges",
                data: { id: "__seta_inicio", source: "__inicio", target: alvo.id() },
                classes: "seta-inicio",
                selectable: false
            }
        ]);
    }

    gerarProximoNomeEstado()
    {
        let nomesUsados = new Set();

        this.cy.nodes().forEach((no) => {
            if (!no.hasClass("marcador-inicio"))
            {
                nomesUsados.add(no.data("rotulo"));
            }
        });

        while (nomesUsados.has(`q${this.contadorEstados}`))
        {
            this.contadorEstados++;
        }

        let nome = `q${this.contadorEstados}`;
        this.contadorEstados++;

        return nome;
    }

    adicionarEstado(posicao, rotuloCustomizado = null, ehInicial = false, ehFinal = false)
    {
        let rotulo = rotuloCustomizado || this.gerarProximoNomeEstado();
        let id = `estado_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

        let jaTemInicial = this.cy.nodes().some((no) => !no.hasClass("marcador-inicio") && no.data("inicial"));
        let inicialFinal = ehInicial || !jaTemInicial;

        let no = this.cy.add({
            group: "nodes",
            data: { id: id, rotulo: rotulo, inicial: inicialFinal, final: ehFinal },
            position: posicao,
            classes: ehFinal ? "final" : ""
        });

        this.atualizarSetaInicial();
        this.aoAlterar();

        return no;
    }

    adicionarOuAtualizarTransicao(origemId, destinoId, textoSimbolos)
    {
        let novosSimbolos = Transicao.normalizarSimbolos(textoSimbolos);
        let arestaExistente = this.cy.edges().filter((aresta) => {
            return !aresta.hasClass("seta-inicio") &&
                aresta.data("source") === origemId &&
                aresta.data("target") === destinoId;
        });

        if (arestaExistente.length > 0)
        {
            let aresta = arestaExistente[0];
            let combinados = Array.from(new Set([...(aresta.data("simbolos") || []), ...novosSimbolos]));
            let transicaoTemp = new Transicao(aresta.id(), origemId, destinoId, combinados);

            aresta.data("simbolos", transicaoTemp.simbolos);
            aresta.data("rotulo", transicaoTemp.formatarRotulo());
        }
        else
        {
            this.contadorTransicoes++;
            let id = `transicao_${this.contadorTransicoes}_${Date.now()}`;
            let transicao = new Transicao(id, origemId, destinoId, novosSimbolos);

            this.cy.add({
                group: "edges",
                data: {
                    id: id,
                    source: origemId,
                    target: destinoId,
                    simbolos: transicao.simbolos,
                    rotulo: transicao.formatarRotulo()
                }
            });
        }

        this.aoAlterar();
    }

    definirEstadoInicial(noAlvo)
    {
        if (!noAlvo || !noAlvo.isNode())
            return;

        this.cy.nodes().forEach((no) => {
            if (!no.hasClass("marcador-inicio"))
            {
                no.data("inicial", no.id() === noAlvo.id());
            }
        });

        this.atualizarSetaInicial();
        this.aoAlterar();
    }

    alternarEstadoFinal(noAlvo)
    {
        if (!noAlvo || !noAlvo.isNode())
            return;

        let novoFinal = !Boolean(noAlvo.data("final"));
        noAlvo.data("final", novoFinal);
        noAlvo.toggleClass("final", novoFinal);

        this.aoAlterar();
    }

    removerElemento(elemento)
    {
        if (!elemento || elemento.hasClass("marcador-inicio") || elemento.hasClass("seta-inicio"))
            return;

        if (this.elementoSelecionado && this.elementoSelecionado.id() === elemento.id())
        {
            this.fecharEditorSelecao();
        }

        elemento.remove();
        this.atualizarSetaInicial();
        this.aoAlterar();
    }

    definirModo(novoModo)
    {
        this.modoAtual = novoModo;
        this.limparOrigemTransicao();
        this.fecharMenuContexto();
        this.fecharPromptTransicao();

        this.elementosDom.ferramentaButtons.forEach((botao) => {
            botao.classList.toggle("ativo", botao.dataset.modo === novoModo);
        });
    }

    limparOrigemTransicao()
    {
        if (this.estadoOrigemTransicaoId)
        {
            this.cy.getElementById(this.estadoOrigemTransicaoId).removeClass("origem-transicao");
            this.estadoOrigemTransicaoId = null;
        }
    }

    abrirPromptTransicao(origemNo, destinoNo)
    {
        this.transicaoPendente = { origemId: origemNo.id(), destinoId: destinoNo.id() };
        this.elementosDom.promptTransicaoTextoSpan.textContent =
            `${origemNo.data("rotulo")} → ${destinoNo.data("rotulo")}:`;
        this.elementosDom.inputSimbolosTransicao.value = "";
        this.elementosDom.promptTransicaoDiv.classList.remove("oculto");
        this.elementosDom.inputSimbolosTransicao.focus();
    }

    fecharPromptTransicao()
    {
        this.transicaoPendente = null;
        this.elementosDom.promptTransicaoDiv.classList.add("oculto");
        this.limparOrigemTransicao();
    }

    abrirEditorSelecao(elemento)
    {
        let dom = this.elementosDom;
        this.elementoSelecionado = elemento;
        dom.editorSelecaoDiv.classList.remove("oculto");

        if (elemento.isNode())
        {
            dom.editorTituloSpan.textContent = `Estado ${elemento.data("rotulo")}:`;
            dom.editorValorInput.value = elemento.data("rotulo");
            dom.editorValorInput.placeholder = "Nome do estado";
            dom.editorInicialButton.classList.remove("oculto");
            dom.editorFinalButton.classList.remove("oculto");
        }
        else
        {
            let origem = this.obterNomeEstado(elemento.data("source"));
            let destino = this.obterNomeEstado(elemento.data("target"));
            let transicao = new Transicao(elemento.id(), origem, destino, elemento.data("simbolos"));

            dom.editorTituloSpan.textContent = `Transição ${origem} → ${destino}:`;
            dom.editorValorInput.value = transicao.formatarRotulo();
            dom.editorValorInput.placeholder = "Símbolos (vazio = ε)";
            dom.editorInicialButton.classList.add("oculto");
            dom.editorFinalButton.classList.add("oculto");
        }
    }

    fecharEditorSelecao()
    {
        this.elementoSelecionado = null;
        this.elementosDom.editorSelecaoDiv.classList.add("oculto");
    }

    aplicarEdicaoSelecao()
    {
        if (!this.elementoSelecionado)
            return;

        let valor = this.elementosDom.editorValorInput.value;

        if (this.elementoSelecionado.isNode())
        {
            let novoRotulo = valor.trim();

            if (novoRotulo !== "")
            {
                this.elementoSelecionado.data("rotulo", novoRotulo);
                this.elementosDom.editorTituloSpan.textContent = `Estado ${novoRotulo}:`;
            }
        }
        else
        {
            let simbolos = Transicao.normalizarSimbolos(valor);
            let transicao = new Transicao("", "", "", simbolos);
            let rotulo = transicao.formatarRotulo();

            this.elementoSelecionado.data("simbolos", simbolos);
            this.elementoSelecionado.data("rotulo", rotulo);
            this.elementosDom.editorValorInput.value = rotulo;
        }

        this.aoAlterar();
    }

    abrirMenuContexto(elemento, posicao)
    {
        let dom = this.elementosDom;
        this.elementoContexto = elemento;

        dom.menuInicialButton.classList.toggle("oculto", !elemento.isNode());
        dom.menuFinalButton.classList.toggle("oculto", !elemento.isNode());
        dom.menuEditarButton.textContent = elemento.isNode() ? "Renomear estado" : "Editar símbolos";

        let x = Math.min(posicao.x, dom.containerDiagramaDiv.clientWidth - 175);
        let y = Math.min(posicao.y, dom.containerDiagramaDiv.clientHeight - 140);

        dom.menuContextoDiv.style.left = `${Math.max(8, x)}px`;
        dom.menuContextoDiv.style.top = `${Math.max(8, y)}px`;
        dom.menuContextoDiv.classList.remove("oculto");
    }

    fecharMenuContexto()
    {
        this.elementoContexto = null;
        this.elementosDom.menuContextoDiv.classList.add("oculto");
    }

    limparDestaques()
    {
        this.cy.nodes().removeClass("ativo ativo-aceita ativo-rejeita");
        this.cy.edges().removeClass("ativa");
    }

    destacarPasso(estadosAtivosIds, transicoesAtivasIds, ehUltimoPasso, aceita)
    {
        this.limparDestaques();

        estadosAtivosIds.forEach((estadoId) => {
            let no = this.cy.getElementById(estadoId);

            if (ehUltimoPasso)
            {
                no.addClass(aceita ? "ativo-aceita" : "ativo-rejeita");
            }
            else
            {
                no.addClass("ativo");
            }
        });

        transicoesAtivasIds.forEach((transicaoId) => {
            this.cy.getElementById(transicaoId).addClass("ativa");
        });
    }

    limpar()
    {
        this.cy.elements().remove();
        this.contadorEstados = 0;
        this.contadorTransicoes = 0;
        this.limparOrigemTransicao();
        this.fecharPromptTransicao();
        this.fecharMenuContexto();
        this.fecharEditorSelecao();
    }

    carregarAutomato(listaEstados, listaTransicoes)
    {
        this.cy.batch(() => {
            this.limpar();

            listaEstados.forEach((estado) => {
                this.cy.add({
                    group: "nodes",
                    data: {
                        id: estado.id,
                        rotulo: estado.rotulo,
                        inicial: Boolean(estado.inicial),
                        final: Boolean(estado.final)
                    },
                    position: estado.posicao,
                    classes: estado.final ? "final" : ""
                });
            });

            listaTransicoes.forEach((transicao) => {
                this.contadorTransicoes++;
                let simbolos = Transicao.normalizarSimbolos(transicao.simbolos);
                let modelo = new Transicao("", transicao.origem, transicao.destino, simbolos);

                this.cy.add({
                    group: "edges",
                    data: {
                        id: `transicao_${this.contadorTransicoes}_${Date.now()}`,
                        source: transicao.origem,
                        target: transicao.destino,
                        simbolos: modelo.simbolos,
                        rotulo: modelo.formatarRotulo()
                    }
                });
            });

            this.atualizarSetaInicial();
        });

        this.ajustarVisualizacao();
        this.aoAlterar();
    }

    ajustarVisualizacao()
    {
        this.cy.fit(undefined, 40);
    }

    registrarEventosCytoscape()
    {
        this.cy.on("tap", (evento) => {
            this.fecharMenuContexto();

            if (evento.target !== this.cy)
                return;

            this.fecharEditorSelecao();

            if (this.modoAtual === "estado")
            {
                this.adicionarEstado(evento.position);
            }
            else if (this.modoAtual === "transicao")
            {
                this.limparOrigemTransicao();
            }
        });

        this.cy.on("tap", "node, edge", (evento) => {
            let elemento = evento.target;

            if (elemento.hasClass("marcador-inicio") || elemento.hasClass("seta-inicio"))
                return;

            this.fecharMenuContexto();

            if (this.modoAtual === "remover")
            {
                this.removerElemento(elemento);
                return;
            }

            if (elemento.isNode() && this.modoAtual === "transicao")
            {
                if (!this.estadoOrigemTransicaoId)
                {
                    this.estadoOrigemTransicaoId = elemento.id();
                    elemento.addClass("origem-transicao");
                }
                else
                {
                    let origemNo = this.cy.getElementById(this.estadoOrigemTransicaoId);
                    this.abrirPromptTransicao(origemNo, elemento);
                }

                return;
            }

            this.abrirEditorSelecao(elemento);
        });

        this.cy.on("cxttap", "node, edge", (evento) => {
            let elemento = evento.target;

            if (elemento.hasClass("marcador-inicio") || elemento.hasClass("seta-inicio"))
                return;

            evento.originalEvent.preventDefault();
            this.abrirMenuContexto(elemento, evento.renderedPosition);
        });

        this.cy.on("position", "node", (evento) => {
            let no = evento.target;

            if (!no.data("inicial"))
                return;

            let marcador = this.cy.getElementById("__inicio");

            if (marcador.length > 0)
            {
                let pos = no.position();
                marcador.position({ x: pos.x - 56, y: pos.y });
            }
        });
    }

    registrarEventosEdicao()
    {
        let dom = this.elementosDom;

        dom.ferramentaButtons.forEach((botao) => {
            botao.addEventListener("click", () => this.definirModo(botao.dataset.modo));
        });

        dom.confirmarTransicaoButton.addEventListener("click", () => {
            if (!this.transicaoPendente)
                return;

            this.adicionarOuAtualizarTransicao(
                this.transicaoPendente.origemId,
                this.transicaoPendente.destinoId,
                dom.inputSimbolosTransicao.value
            );
            this.fecharPromptTransicao();
        });

        dom.cancelarTransicaoButton.addEventListener("click", () => this.fecharPromptTransicao());

        dom.inputSimbolosTransicao.addEventListener("keydown", (evento) => {
            if (evento.key === "Enter")
            {
                dom.confirmarTransicaoButton.click();
            }
            else if (evento.key === "Escape")
            {
                this.fecharPromptTransicao();
            }
        });

        // Ações compartilhadas entre menu de contexto e barra de seleção
        dom.menuInicialButton.addEventListener("click", () => {
            this.definirEstadoInicial(this.elementoContexto);
            this.fecharMenuContexto();
        });

        dom.menuFinalButton.addEventListener("click", () => {
            this.alternarEstadoFinal(this.elementoContexto);
            this.fecharMenuContexto();
        });

        dom.menuEditarButton.addEventListener("click", () => {
            if (this.elementoContexto)
            {
                this.abrirEditorSelecao(this.elementoContexto);
                dom.editorValorInput.focus();
            }

            this.fecharMenuContexto();
        });

        dom.menuRemoverButton.addEventListener("click", () => {
            this.removerElemento(this.elementoContexto);
            this.fecharMenuContexto();
        });

        dom.editorSalvarButton.addEventListener("click", () => this.aplicarEdicaoSelecao());
        dom.editorValorInput.addEventListener("keydown", (evento) => {
            if (evento.key === "Enter")
            {
                this.aplicarEdicaoSelecao();
            }
        });

        dom.editorInicialButton.addEventListener("click", () => this.definirEstadoInicial(this.elementoSelecionado));
        dom.editorFinalButton.addEventListener("click", () => this.alternarEstadoFinal(this.elementoSelecionado));
        dom.editorRemoverButton.addEventListener("click", () => this.removerElemento(this.elementoSelecionado));

        document.addEventListener("click", (evento) => {
            if (!dom.menuContextoDiv.contains(evento.target))
            {
                this.fecharMenuContexto();
            }
        });
    }
}
