class Transicao
{
    constructor(id, origem, destino, simbolos)
    {
        this.id = id;
        this.origem = origem;
        this.destino = destino;
        this.simbolos = Array.isArray(simbolos) ? simbolos : Transicao.normalizarSimbolos(simbolos);
    }

    /**
     * Normaliza os símbolos de uma entrada. 
     * Isso permite termos, por exemplo, a | b | c
     * 
     * @param {string} textoSimbolos 
     * @returns 
     */
    static normalizarSimbolos(textoSimbolos)
    {
        let textoLimpo = (textoSimbolos || "").trim();

        if (textoLimpo === "")
            return [EPSILON];

        let partes = textoLimpo.split(/[,|]/);
        let simbolosUnicos = [];

        partes.forEach((parte) => {
            let simbolo = parte.trim();

            if (simbolo === "")
                return;

            if (simbolo.toLowerCase() === "epsilon" || simbolo === EPSILON)
            {
                simbolo = EPSILON;
            }

            if (!simbolosUnicos.includes(simbolo))
            {
                simbolosUnicos.push(simbolo);
            }
        });

        if (simbolosUnicos.length === 0)
            return [EPSILON];

        return simbolosUnicos;
    }

    formatarRotulo()
    {
        if (!this.simbolos || this.simbolos.length === 0)
            return EPSILON;

        return this.simbolos.join(", ");
    }

    aceitaSimbolo(simbolo)
    {
        return this.simbolos.includes(simbolo);
    }
}
