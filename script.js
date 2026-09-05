const regexInput = document.getElementById("regexInput");

const entrada1Input = document.getElementById("entrada");
const entrada2Input = document.getElementById("entrada2");

const testarButton = document.getElementById("submitButton");
const testarButton2 = document.getElementById("submitButton2");

const saidaOutput = document.getElementById("saida");


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
    {
        saidaOutput.textContent = "Regex Inválido";
        return "";
    }
    
    let resultado = regex.exec(entrada);

    return resultado !== null ?
             "Expressão válida." : "Expressão Inválida.";
}

function testarTeclado(event) {
    if (event.key === 'Enter') {
        event.preventDefault();

        executarTeste(regexInput.value, event.target.value);
    }
}

function executarTeste(expressaoRegular, entrada) {
    saidaOutput.textContent =
        avaliarExpressaoRegular(expressaoRegular, entrada);
}

function gerenciarClique(event) {
    const idDoInput = event.target.getAttribute("data-entrada"); 

    const inputCorrespondente = document.getElementById(idDoInput); 
    
    executarTeste(regexInput.value, inputCorrespondente.value);
}

entrada1Input.addEventListener('keydown', testarTeclado);
entrada2Input.addEventListener('keydown', testarTeclado);

testarButton.addEventListener('click', gerenciarClique);
testarButton2.addEventListener('click', gerenciarClique);
