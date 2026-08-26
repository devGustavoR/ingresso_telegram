// types/estados.ts

export interface EstadoFormatado {
  sigla: string;
  nome: string;
}

// resposta real do endpoint https://servicodados.ibge.gov.br/api/v1/localidades/estados
export interface EstadoBruto {
  id: number;
  sigla: string;
  nome: string;
  regiao: {
    id: number;
    sigla: string;
    nome: string;
  };
}
