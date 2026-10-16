const EPSILON = "ε";

function ehNaoTerminal(caractere)
{
    return caractere >= "A" && caractere <= "Z";
}

function lerGramatica()
{
    let mapaProducoes = new Map();
    let listaErros = [];

    let linhasProducao = document.querySelectorAll(".producao");

    linhasProducao.forEach((linha) => {
        let inputNaoTerminal = linha.querySelector(".nt");
        let naoTerminal = inputNaoTerminal.value.trim();

        inputNaoTerminal.classList.remove("invalida");

        // Ignora produções em branco (Símbolo à esquerda vazio)
        if (naoTerminal === "")
            return;

        // Verificamos se o símbolo à esquerda é não-terminal.
        if (!ehNaoTerminal(naoTerminal))
        {
            inputNaoTerminal.classList.add("invalida");
            listaErros.push(`"${naoTerminal}" não é um não-terminal (use A-Z).`);

            return;
        }

        if (!mapaProducoes.has(naoTerminal))
        {
            mapaProducoes.set(naoTerminal, []);
        }

        let inputsRegra = linha.querySelectorAll(".regra");

        inputsRegra.forEach((inputRegra) => {
            inputRegra.classList.remove("invalida");

            // Removemos espaços em brancos digitados pelo usuário
            let textoRegra = inputRegra.value.replace(/\s/g, "").replaceAll(EPSILON, "");

            // Testando a GLD
            let posicoesNaoTerminais = [];

            for (let i = 0; i < textoRegra.length; i++)
            {
                if (ehNaoTerminal(textoRegra[i]))
                {
                    posicoesNaoTerminais.push(i);
                }
            }

            // Se não houver não-terminais ou houver apenas um e ele estiver no final,
            // então, temos um GLD. Verificamos isso pelo índice do não-terminal na string
            let ehRegraValida = posicoesNaoTerminais.length === 0 ||
                (posicoesNaoTerminais.length === 1 && posicoesNaoTerminais[0] === textoRegra.length - 1);

            if (!ehRegraValida)
            {
                inputRegra.classList.add("invalida");

                listaErros.push(`${naoTerminal} → ${textoRegra} não é linear à direita.`);

                return;
            }

            /*
                    Aqui temos como simboloNaoTerminalDestino o não terminal de uma cadeia
                do estilo wB, onde w é uma cadeia de terminais e B é um não-terminal.
                    Se encontra um terminal ou vazio, simboloNaoTerminalDestino será null
                e cadeiaTerminais será w.

                Exemplos:
                    "0S": simboloNaoTerminalDestino = "S", cadeiaTerminais = "0"
                    "10": simboloNaoTerminalDestino = null, cadeiaTerminais = "10"
                    "ε": simboloNaoTerminalDestino = null, cadeiaTerminais = ""
            */
            let simboloNaoTerminalDestino = posicoesNaoTerminais.length > 0 ?
                textoRegra[textoRegra.length - 1] : null;

            let cadeiaTerminais = simboloNaoTerminalDestino ?
                textoRegra.slice(0, -1) : textoRegra;


            let objetoRegra = {
                cadeiaTerminais: cadeiaTerminais,
                naoTerminalDestino: simboloNaoTerminalDestino,
                textoOriginal: textoRegra || EPSILON
            };

            // Evitamos regras duplicadas na mesma linha
            let regrasExistentes = mapaProducoes.get(naoTerminal);

            let jaExiste = regrasExistentes.some(
                (regra) => regra.textoOriginal === objetoRegra.textoOriginal);

            // Se é uma regra nova, adicionamos ao mapa
            if (!jaExiste)
            {
                regrasExistentes.push(objetoRegra);
            }
        });
    });

    return { mapaProducoes, listaErros };
}

// Adiciona todos os terminais encontrados no mapa de produções.
function obterTerminais(mapaProducoes)
{
    let conjuntoTerminais = new Set();

    mapaProducoes.forEach((listaRegras) => {
        listaRegras.forEach((regra) => {
            for (let caractere of regra.cadeiaTerminais)
            {
                conjuntoTerminais.add(caractere);
            }
        });
    });

    return Array.from(conjuntoTerminais).sort();
}

// Adiciona todos os não terminais encontrados no mapa de produções.
function obterNaoTerminais(mapaProducoes)
{
    // Pegamos todos os não terminais que estão à esquerda das produções.
    let conjuntoNaoTerminais = new Set(mapaProducoes.keys());

    // Pegamos os não terminais que estão à direita das produções.
    mapaProducoes.forEach((listaRegras) => {
        listaRegras.forEach((regra) => {
            if (regra.naoTerminalDestino)
            {
                conjuntoNaoTerminais.add(regra.naoTerminalDestino);
            }
        });
    });

    // Garante que o S seja sempre o primeiro não terminal.
    conjuntoNaoTerminais.add("S");

    return Array.from(conjuntoNaoTerminais).sort((a, b) => {
        if (a === "S")
            return -1;
        if (b === "S")
            return 1;

        return a.localeCompare(b);
    });
}

// Identifica os símbolos alcançáveis a partir do não terminal inicial 'S'.
// Lembrando que um símbolo é alcançável se ele pode ser derivado a partir de 'S'.
function obterSimbolosAlcancaveis(mapaProducoes)
{
    let simbolosAlcancados = new Set(["S"]);
    let filaExploracao = ["S"];

    while (filaExploracao.length > 0)
    {
        let naoTerminalAtual = filaExploracao.shift();
        let regras = mapaProducoes.get(naoTerminalAtual) || [];

        regras.forEach((regra) => {
            // Se a produção tiver um não-terminal no lado direito e ele ainda não foi alcançado,
            // então, ele é alcançável.
            if (regra.naoTerminalDestino && !simbolosAlcancados.has(regra.naoTerminalDestino))
            {
                simbolosAlcancados.add(regra.naoTerminalDestino);
                filaExploracao.push(regra.naoTerminalDestino);
            }
        });
    }

    return simbolosAlcancados;
}

// Identifica os símbolos produtivos a partir do não terminal inicial 'S'.
// Lembrando que um símbolo é produtivo se ele pode ser derivado a partir de 'S'.
function obterSimbolosProdutivos(mapaProducoes)
{
    let simbolosProdutivos = new Set();
    let houveMudanca = true;

    while (houveMudanca)
    {
        houveMudanca = false;

        mapaProducoes.forEach((listaRegras, naoTerminal) => {
            if (!simbolosProdutivos.has(naoTerminal))
            {
                // Se A → wB é uma regra, e B já é produtivo, então A é produtivo.
                // Se A → w é uma regra, então A é produtivo.
                let ehProdutivo = listaRegras.some((regra) => {
                    return !regra.naoTerminalDestino || simbolosProdutivos.has(regra.naoTerminalDestino);
                });

                if (ehProdutivo)
                {
                    simbolosProdutivos.add(naoTerminal);
                    houveMudanca = true;
                }
            }
        });
    }

    return simbolosProdutivos;
}


/*
    Gera exemplos de palavras a partir do não terminal inicial 'S'.
    Para isso, faz uma busca em largura (BFS) no grafo de produções.

    Exemplo:
        Gramática: {S → ε | 0S | 1S | 01}

        Passo 1 (Raiz):
            A fila começa com: [ ("", "S") ]
            O código tira ("", "S") e aplica as 3 regras do S:
                S → 0S
                S → 1S
                S → 01
            E gera as seguintes palavras:
                0S
                1S
                01 -> NÃO TEM NÃO TERMINAL -> ADICIONA NO CONJUNTO DE PALAVRAS GERADAS
            
            A fila agora é: [ ("0", "S"), ("1", "S") ]

        Passo 2 (Raiz):
            O código tira ("0", "S") e aplica as 3 regras do S:
                S → 0S
                S → 1S
                S → 01
            E gera as seguintes palavras:
                00S
                01S
                001 -> NÃO TEM NÃO TERMINAL -> ADICIONA NO CONJUNTO DE PALAVRAS GERADAS
        
            A fila agora é: [ ("1", "S"), ("00", "S"), ("01", "S") ]
        
        Passo 3:
            O código tira ("1", "S") e aplica as 3 regras do S:
                S → 0S
                S → 1S
                S → 01
            E gera as seguintes palavras:
                10S
                11S
                101 -> NÃO TEM NÃO TERMINAL -> ADICIONA NO CONJUNTO DE PALAVRAS GERADAS
        
            A fila agora é: [ ("00", "S"), ("01", "S"), ("10", "S"), ("11", "S") ]

        E assim por diante...
*/
function gerarExemplosPalavras(mapaProducoes, quantidadeMaxima = 10, tamanhoMaximo = 8)
{
    let palavrasGeradas = new Set();
    let estadosVisitados = new Set();

    let filaBusca = [["", "S"]];
    let totalPassos = 0;

    while (filaBusca.length > 0 && palavrasGeradas.size < quantidadeMaxima && totalPassos < 5000)
    {
        totalPassos++;

        // [prefixo já gerado por não terminais anteriores] + [não terminal atual]
        let [prefixoTerminais, naoTerminalAtual] = filaBusca.shift();

        // Evita o loop infinito, pois verifica se já esteve no "mesmo lugar".
        // Ou seja, se esteve exatamente com esse prefixo + esse não terminal.
        let chaveEstado = prefixoTerminais + "|" + naoTerminalAtual;

        if (estadosVisitados.has(chaveEstado))
            continue;

        estadosVisitados.add(chaveEstado);

        let regras = mapaProducoes.get(naoTerminalAtual) || [];

        for (let regra of regras)
        {
            let novaCadeia = prefixoTerminais + regra.cadeiaTerminais;

            // Evitamos palavras muito longas.
            if (novaCadeia.length > tamanhoMaximo)
                continue;

            if (regra.naoTerminalDestino)
            {
                filaBusca.push([novaCadeia, regra.naoTerminalDestino]);
            }
            else
            {
                palavrasGeradas.add(novaCadeia);
            }
        }
    }

    return Array.from(palavrasGeradas).sort((a, b) => {
        return a.length - b.length || a.localeCompare(b);
    });
}

// Deriva uma palavra a partir do não terminal inicial 'S'.
// Para isso, faz uma busca em largura (BFS) no grafo de produções.
function derivarPalavra(mapaProducoes, palavraEntrada)
{
    // Armazena o antecessor de cada estado para reconstruir os passos da derivação.
    let mapaAntecessores = new Map();

    let gerarChaveEstado = (naoTerminal, indice) => naoTerminal + "," + indice;

    let chaveInicial = gerarChaveEstado("S", 0);
    mapaAntecessores.set(chaveInicial, null);

    // O estado significa, estou no símbolo 'S', e já consumi 0 caracteres da palavra.
    let filaBusca = [["S", 0]];

    // Reconstroi os passos da derivação (anda de trás para frente).
    function reconstruirPassos(chaveUltimoEstado, regraFinalTexto)
    {
        let passosDerivacao = [
            { formaSentencial: palavraEntrada || EPSILON, regraAplicada: regraFinalTexto }
        ];

        let chavePai = chaveUltimoEstado;

        while (chavePai)
        {
            let partes = chavePai.split(",");
            let naoTerminal = partes[0];
            let indiceConsumido = parseInt(partes[1]);

            // Busca o estado antecessor para reconstruir os passos da derivação.
            let dadosPai = mapaAntecessores.get(chavePai);

            // Coloca o pai na frente da lista (reconstruindo a derivação).
            passosDerivacao.unshift({
                formaSentencial: palavraEntrada.slice(0, indiceConsumido) + naoTerminal,
                regraAplicada: dadosPai ? dadosPai.regraTexto : null
            });

            chavePai = dadosPai ? dadosPai.estadoOrigem : null;
        }

        return passosDerivacao;
    }

    while (filaBusca.length > 0)
    {
        let [naoTerminalAtual, indiceConsumido] = filaBusca.shift();
        let chaveEstadoAtual = gerarChaveEstado(naoTerminalAtual, indiceConsumido);

        let regras = mapaProducoes.get(naoTerminalAtual) || [];

        for (let regra of regras)
        {
            /* 
                Se o pedaço da palavra que ainda não foi consumido
                não começa com a cadeia de terminais da regra, então
                essa regra não pode ser aplicada.

                Exemplo:
                    A regra é: S → 1S
                    Palavra: 010110101
                    Índice atual: 0
                    Pedaço da palavra que ainda não foi consumido: 010110101
                    Cadeia de terminais da regra: 0
                    Então essa regra não pode ser aplicada.
            */
            if (!palavraEntrada.startsWith(regra.cadeiaTerminais, indiceConsumido))
                continue;

            let proximoIndice = indiceConsumido + regra.cadeiaTerminais.length;
            let regraTexto = `${naoTerminalAtual} → ${regra.textoOriginal}`;

            if (!regra.naoTerminalDestino)
            {
                // Se todos os caracteres foram consumidos,
                // então a palavra foi derivada com sucesso.
                if (proximoIndice === palavraEntrada.length)
                    return reconstruirPassos(chaveEstadoAtual, regraTexto);
                
                continue;
            }

            // Se a regra foi para outro não terminal,
            // então continua a busca em largura.
            let chaveProximoEstado = gerarChaveEstado(regra.naoTerminalDestino, proximoIndice);

            if (mapaAntecessores.has(chaveProximoEstado))
                continue;

            // Anotamos no mapa
            mapaAntecessores.set(chaveProximoEstado, {
                estadoOrigem: chaveEstadoAtual,
                regraTexto: regraTexto
            });

            filaBusca.push([regra.naoTerminalDestino, proximoIndice]);
        }
    }

    // Se não encontrou, retorna null.
    return null;
}
