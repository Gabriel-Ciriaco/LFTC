class SimulacaoControlador
{
    constructor(elementosDom, diagramaControlador, aoValidar)
    {
        this.elementosDom = elementosDom;
        this.diagrama = diagramaControlador;
        this.aoValidar = aoValidar;

        this.simulacaoAtual = null;
        this.indicePassoAtual = 0;
        this.intervaloAutoPlay = null;

        this.registrarEventos();
    }

    pararAutoPlay()
    {
        if (this.intervaloAutoPlay !== null)
        {
            clearInterval(this.intervaloAutoPlay);

            this.intervaloAutoPlay = null;
            this.elementosDom.autoPlayButton.textContent = "Auto";
        }
    }

    resetar()
    {
        this.pararAutoPlay();

        this.simulacaoAtual = null;

        this.indicePassoAtual = 0;

        this.diagrama.limparDestaques();

        this.elementosDom.painelPassoAPassoDiv.classList.add("oculto");
    }

    iniciar(automato)
    {
        this.pararAutoPlay();

        let resultado = automato.gerarPassosSimulacao(this.elementosDom.entradaUnicaInput.value);

        if (!resultado.valido)
        {
            this.aoValidar(resultado.erros);

            this.elementosDom.painelPassoAPassoDiv.classList.add("oculto");
            
            return;
        }

        this.simulacaoAtual = resultado;

        
        this.indicePassoAtual = 0;
        
        this.elementosDom.painelPassoAPassoDiv.classList.remove("oculto");
        
        this.renderizarPasso();
    }

    renderizarPasso()
    {
        if (!this.simulacaoAtual)
            return;

        let dom = this.elementosDom;
        let passos = this.simulacaoAtual.passos;
        let passo = passos[this.indicePassoAtual];
        let ehUltimoPasso = this.indicePassoAtual === passos.length - 1;

        this.diagrama.destacarPasso(
            passo.estadosAtivos,
            passo.transicoesAtivas,
            ehUltimoPasso,
            this.simulacaoAtual.aceita
        );

        dom.infoPassoSpan.textContent = `Passo ${this.indicePassoAtual} de ${passos.length - 1}`;
        dom.passoAnteriorButton.disabled = this.indicePassoAtual === 0;
        dom.proximoPassoButton.disabled = ehUltimoPasso;

        this.renderizarFita();
        this.renderizarStatus(passo, ehUltimoPasso);
    }

    renderizarFita()
    {
        let fitaDiv = this.elementosDom.fitaSimulacaoDiv;
        let palavra = this.simulacaoAtual.palavra;
        fitaDiv.innerHTML = "";

        if (palavra.length === 0)
        {
            let celulaVazia = document.createElement("span");
         
            celulaVazia.className = "celula-fita atual";
         
            celulaVazia.textContent = EPSILON;
         
            fitaDiv.appendChild(celulaVazia);
         
            return;
        }

        for (let i = 0; i < palavra.length; i++)
        {
            let celula = document.createElement("span");
            celula.className = "celula-fita";

            if (i < this.indicePassoAtual - 1)
            {
                celula.classList.add("lida");
            }
            else if (i === this.indicePassoAtual - 1)
            {
                celula.classList.add("atual");
            }

            celula.textContent = palavra[i];

            fitaDiv.appendChild(celula);
        }
    }

    renderizarStatus(passo, ehUltimoPasso)
    {
        let statusDiv = this.elementosDom.statusPassoDiv;
        statusDiv.innerHTML = "";

        let nomesAtivos = passo.estadosAtivos.map((id) => this.diagrama.obterNomeEstado(id));
        let textoEstados = document.createElement("span");
        
        textoEstados.textContent = nomesAtivos.length > 0 ?
            `Estados ativos: {${nomesAtivos.join(", ")}}` :
            "Estados ativos: ∅ (sem transição)";
      
        statusDiv.appendChild(textoEstados);

        if (ehUltimoPasso)
        {
            let badge = document.createElement("span");
            badge.className = `badge ${this.simulacaoAtual.aceita ? "aceita" : "rejeitada"}`;
            badge.textContent = this.simulacaoAtual.aceita ? "Aceita" : "Rejeitada";
            statusDiv.appendChild(badge);
        }
    }

    testarMultiplas(automato)
    {
        let dom = this.elementosDom;
        let resposta = automato.simularMultiplasEntradas(dom.entradasTextarea.value);
        dom.resultadosDiv.innerHTML = "";

        if (!resposta.valido)
        {
            this.aoValidar(resposta.erros);
            return;
        }

        resposta.resultados.forEach((item) => {
            let linha = document.createElement("div");
            linha.className = "resultado-linha";
            linha.title = "Clique para simular esta palavra passo a passo";

            let palavraSpan = document.createElement("span");
            palavraSpan.className = "palavra mono";
            palavraSpan.textContent = item.palavraOriginal;

            let badge = document.createElement("span");
            badge.className = `badge ${item.aceita ? "aceita" : "rejeitada"}`;
            badge.textContent = item.aceita ? "Aceita" : "Rejeitada";

            linha.appendChild(palavraSpan);
            linha.appendChild(badge);

            linha.addEventListener("click", () => {
                dom.entradaUnicaInput.value = item.palavraEntrada;
                this.iniciar(automato);
            });

            dom.resultadosDiv.appendChild(linha);
        });
    }

    alternarAutoPlay()
    {
        if (!this.simulacaoAtual)
            return;

        if (this.intervaloAutoPlay !== null)
        {
            this.pararAutoPlay();
            return;
        }

        if (this.indicePassoAtual >= this.simulacaoAtual.passos.length - 1)
        {
            this.indicePassoAtual = 0;
            this.renderizarPasso();
        }

        this.elementosDom.autoPlayButton.textContent = "Pausar";

        this.intervaloAutoPlay = setInterval(() => {
            if (!this.simulacaoAtual || this.indicePassoAtual >= this.simulacaoAtual.passos.length - 1)
            {
                this.pararAutoPlay();
                return;
            }

            this.indicePassoAtual++;
            this.renderizarPasso();
        }, 750);
    }

    moverPasso(deslocamento)
    {
        if (!this.simulacaoAtual)
            return;

        let novoIndice = this.indicePassoAtual + deslocamento;

        if (novoIndice < 0 || novoIndice >= this.simulacaoAtual.passos.length)
            return;

        this.pararAutoPlay();
        this.indicePassoAtual = novoIndice;
        this.renderizarPasso();
    }

    registrarEventos()
    {
        let dom = this.elementosDom;

        dom.passoAnteriorButton.addEventListener("click", () => this.moverPasso(-1));
        dom.proximoPassoButton.addEventListener("click", () => this.moverPasso(1));
        dom.autoPlayButton.addEventListener("click", () => this.alternarAutoPlay());
        dom.resetarSimulacaoButton.addEventListener("click", () => this.resetar());
    }
}
