const EPSILON = "ε";

class Estado
{
    constructor(id, rotulo, inicial = false, final = false)
    {
        this.id = id;
        this.rotulo = rotulo;

        this.inicial = Boolean(inicial);
        this.final = Boolean(final);
    }
}
