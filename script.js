const regexInput = document.getElementById("regexInput");

const entrada1Input = document.getElementById("entrada");
const entrada2Input = document.getElementById("entrada2");

const testarButton = document.getElementById("submitButton");


const saidaOutput1 = document.getElementById("saida1");
const saidaOutput2 = document.getElementById("saida2");


function getExpressaoRegular(expressaoRegular)
{
    if (!regexInput.value || regexInput.value.trim() == "")
        return false;

    try {
        return new RegExp(expressaoRegular);
    } catch (error) {
        return false;   
    }
}

function avaliarExpressaoRegular(expressaoRegular, entrada)
{
    let regex = getExpressaoRegular(expressaoRegular)
    
    if (!regex)
        return "Regex Inválido";
    
    let resultado = regex.exec(entrada);

    return resultado !== null ?
             "Expressão válida." : "Expressão inválida.";
}

function executarTeste(expressaoRegular, entrada, saida) {
    saida.textContent =
        avaliarExpressaoRegular(expressaoRegular, entrada.value);

    let cores = {
        "Expressão válida.": "#8ff152ff",
        "Expressão inválida.": "#f13434ff"
    };

    if (saida.textContent in cores)
    {
        entrada.style.backgroundColor = cores[saida.textContent];
    }
}

function refreshInputs(entrada, saida)
{
    entrada.style.backgroundColor = "";
    entrada.value = "";

    saida.textContent = "";
}

function gerenciarClique(event) { 
    executarTeste(regexInput.value, entrada1Input, saidaOutput1);
    executarTeste(regexInput.value, entrada2Input, saidaOutput2);
}

testarButton.addEventListener('click', gerenciarClique);

regexInput.addEventListener('keyup', () => {
    refreshInputs(entrada1Input, saidaOutput1);
    refreshInputs(entrada2Input, saidaOutput2);
})
