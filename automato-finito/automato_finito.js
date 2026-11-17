class AutomatoFinito
{
    constructor(estados = [], transicoes = [])
    {
        this.estados = estados;
        this.transicoes = transicoes;
        this.transicoesPorOrigem = new Map();

        transicoes.forEach((transicao) => {
            if (!this.transicoesPorOrigem.has(transicao.origem))
            {
                this.transicoesPorOrigem.set(transicao.origem, []);
            }

            this.transicoesPorOrigem.get(transicao.origem).push(transicao);
        });
    }

    validar()
    {
        let erros = [];

        if (this.estados.length === 0)
        {
            erros.push("Adicione pelo menos um estado ao diagrama.");
        }

        let estadosIniciais = this.estados.filter((estado) => estado.inicial);

        if (estadosIniciais.length === 0 && this.estados.length > 0)
        {
            erros.push("Defina um estado inicial (clique direito ou barra de edição).");
        }
        else if (estadosIniciais.length > 1)
        {
            erros.push("O autômato deve possuir apenas um estado inicial.");
        }

        return {
            valido: erros.length === 0,
            erros: erros,
            estadoInicialId: estadosIniciais.length === 1 ? estadosIniciais[0].id : null
        };
    }

    obterConfiguracaoInicial(estadoInicialId)
    {
        return {
            estadosAtivos: [estadoInicialId],
            transicoesAtivas: []
        };
    }

    avancarPasso(estadosAtivosIds, simbolo)
    {
        let destinosDiretos = new Set();
        let transicoesUsadas = new Set();

        estadosAtivosIds.forEach((estadoId) => {
            let listaSaida = this.transicoesPorOrigem.get(estadoId) || [];

            listaSaida.forEach((transicao) => {
                if (!transicao.aceitaSimbolo(simbolo))
                    return;

                destinosDiretos.add(transicao.destino);
                transicoesUsadas.add(transicao.id);
            });
        });

        return {
            estadosAtivos: Array.from(destinosDiretos),
            transicoesAtivas: Array.from(transicoesUsadas)
        };
    }

    gerarPassosSimulacao(palavra, estadoInicialPreValidado = null)
    {
        let estadoInicialId = estadoInicialPreValidado;

        if (!estadoInicialId)
        {
            let validacao = this.validar();

            if (!validacao.valido)
            {
                return {
                    valido: false,
                    erros: validacao.erros,
                    aceita: false,
                    passos: []
                };
            }

            estadoInicialId = validacao.estadoInicialId;
        }

        let palavraLimpa = (palavra || "").replace(/\s/g, "").replaceAll(EPSILON, "");
        let inicio = this.obterConfiguracaoInicial(estadoInicialId);
        let estadosAtivos = inicio.estadosAtivos;

        let passos = [{
            indiceSimbolo: 0,
            simboloLido: null,
            estadosAtivos: estadosAtivos,
            transicoesAtivas: inicio.transicoesAtivas
        }];

        for (let indice = 0; indice < palavraLimpa.length; indice++)
        {
            let simboloAtual = palavraLimpa[indice];
            let resultado = this.avancarPasso(estadosAtivos, simboloAtual);

            estadosAtivos = resultado.estadosAtivos;

            passos.push({
                indiceSimbolo: indice + 1,
                simboloLido: simboloAtual,
                estadosAtivos: estadosAtivos,
                transicoesAtivas: resultado.transicoesAtivas
            });
        }

        let conjuntoFinais = new Set(
            this.estados.filter((estado) => estado.final).map((estado) => estado.id)
        );

        let aceita = estadosAtivos.some((estadoId) => conjuntoFinais.has(estadoId));

        return {
            valido: true,
            erros: [],
            palavra: palavraLimpa,
            aceita: aceita,
            passos: passos
        };
    }

    simularMultiplasEntradas(textoEntradas)
    {
        let validacao = this.validar();

        if (!validacao.valido)
        {
            return {
                valido: false,
                erros: validacao.erros,
                resultados: []
            };
        }

        let resultados = textoEntradas.split("\n").map((linha) => {
            let palavra = linha.trim();
            let simulacao = this.gerarPassosSimulacao(palavra, validacao.estadoInicialId);

            return {
                palavraOriginal: palavra === "" ? EPSILON : simulacao.palavra || EPSILON,
                palavraEntrada: simulacao.palavra,
                aceita: simulacao.aceita
            };
        });

        return {
            valido: true,
            erros: [],
            resultados: resultados
        };
    }
}
