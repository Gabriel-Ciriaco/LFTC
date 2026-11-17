class AFND extends AutomatoFinito
{
    calcularFechoEpsilon(conjuntoInicialIds)
    {
        let estadosVisitados = new Set(conjuntoInicialIds);
        let transicoesUsadas = new Set();
        let filaBusca = Array.from(conjuntoInicialIds);

        while (filaBusca.length > 0)
        {
            let estadoAtualId = filaBusca.shift();
            let listaSaida = this.transicoesPorOrigem.get(estadoAtualId) || [];

            listaSaida.forEach((transicao) => {
                if (!transicao.aceitaSimbolo(EPSILON))
                    return;

                transicoesUsadas.add(transicao.id);

                if (!estadosVisitados.has(transicao.destino))
                {
                    estadosVisitados.add(transicao.destino);
                    filaBusca.push(transicao.destino);
                }
            });
        }

        return {
            estados: Array.from(estadosVisitados),
            transicoesUsadas: Array.from(transicoesUsadas)
        };
    }

    obterConfiguracaoInicial(estadoInicialId)
    {
        let fecho = this.calcularFechoEpsilon([estadoInicialId]);

        return {
            estadosAtivos: fecho.estados,
            transicoesAtivas: fecho.transicoesUsadas
        };
    }

    avancarPasso(estadosAtivosIds, simbolo)
    {
        let passoDireto = super.avancarPasso(estadosAtivosIds, simbolo);
        let fecho = this.calcularFechoEpsilon(passoDireto.estadosAtivos);
        let transicoes = Array.from(new Set([...passoDireto.transicoesAtivas, ...fecho.transicoesUsadas]));

        return {
            estadosAtivos: fecho.estados,
            transicoesAtivas: transicoes
        };
    }
}
