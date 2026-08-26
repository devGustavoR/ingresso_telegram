// types/cidades.ts

export interface CidadeFormatada {
  id: string;
  nome: string;
}

// resposta real do endpoint /v0/states/{stateId} (campo "cities")
export interface CidadeBruta {
  id: string;
  name: string;
}
