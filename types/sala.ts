// types/sala.ts

export interface AssentoFormatado {
  id: string;
  label: string;
  line: number;
  column: number;
  type: string;
  status: string;
  available: boolean;
}

export interface LinhaFormatada {
  line: number;
  seats: AssentoFormatado[];
}

export interface RotuloLinha {
  label: string;
  line: number;
  column: number;
}

export interface SalaFormatada {
  theaterName: string;
  totalSeats: number;
  bounds: { lines: number; columns: number };
  labels: RotuloLinha[];
  linhas: LinhaFormatada[];
}

// resposta real do endpoint /v1/sessions/{sessionId}/sections/{sectionId}/seats
export interface AssentoBruto {
  id: string;
  line: number;
  column: number;
  label: string;
  type: string;
  status: string;
  typeDescription: string;
  areaNumber: number;
  rowIndex: number;
  columnIndex: number;
}

export interface LinhaBruta {
  line: number;
  seats: AssentoBruto[];
}

export interface SalaBruta {
  id: string;
  lines: LinhaBruta[];
  labels: RotuloLinha[];
  bounds: { lines: number; columns: number };
  totalSeats: number;
  theaterName: string;
}
