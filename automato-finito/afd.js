class AFD extends AutomatoFinito
{
    validar()
    {
        let base = super.validar();
        let erros = [...base.erros];
        let mapaDeterminismo = new Map();
        let mapaNomes = new Map();

        this.estados.forEach((estado) => mapaNomes.set(estado.id, estado.rotulo));

        this.transicoes.forEach((transicao) => {
            let nomeOrigem = mapaNomes.get(transicao.origem) || transicao.origem;

            transicao.simbolos.forEach((simbolo) => {
                if (simbolo === EPSILON)
                {
                    erros.push(`AFD não permite transição vazia (${nomeOrigem} → ε).`);
                    return;
                }

                let chave = `${transicao.origem}::${simbolo}`;

                if (mapaDeterminismo.has(chave))
                {
                    erros.push(`Não-determinismo em ${nomeOrigem} com o símbolo '${simbolo}'.`);
                }
                else
                {
                    mapaDeterminismo.set(chave, transicao.destino);
                }
            });
        });

        let errosUnicos = Array.from(new Set(erros));

        return {
            valido: errosUnicos.length === 0,
            erros: errosUnicos,
            estadoInicialId: base.estadoInicialId
        };
    }
}
