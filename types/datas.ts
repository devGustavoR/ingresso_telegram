// types/datas.ts

export interface DataFormatada {
  date: string;
  dateFormatted: string;
  dayOfWeek: string;
  isToday: boolean;
}

// resposta real do endpoint /v0/sessions/city/{cityId}/event/{eventId}/dates
export interface DataBruta {
  date: string;
  dateFormatted: string;
  dayOfWeek: string;
  isToday: boolean;
  sessionTypes: string[];
}
