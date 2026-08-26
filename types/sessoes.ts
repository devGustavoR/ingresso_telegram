// types/sessoes.ts

export interface SessaoFormatada {
  sessionId: string;
  sectionId: string; // vem de defaultSector, é o que você usa pro endpoint de assentos
  room: string;
  price: number;
  date: string; // ISO completo (date.localDate) — ex: "2026-07-27T21:50:00-03:00"
  time: string; // versão curta, ex: "21:50"
  type: string[]; // ex: ["Normal", "Dublado"]
  hasSeatSelection: boolean;
  checkoutUrl: string;
}

export interface CinemaFormatado {
  id: string;
  name: string;
  address: string;
  addressComplement: string;
  number: string;
  neighborhood: string;
  geolocation: {
    lat: number;
    lng: number;
  };
  siteURL: string;
  sessoes: SessaoFormatada[]; // achatado — junta todas as sessões de todas as salas desse cinema
}

// types/sessoes.ts — adiciona isso junto com o CinemaFormatado
export interface CinemaBruto {
  id: string;
  name: string;
  address: string;
  addressComplement: string;
  number: string;
  neighborhood: string;
  geolocation: { lat: number; lng: number };
  siteURL: string;
  rooms: {
    name: string;
    sessions: {
      id: string;
      defaultSector: string;
      price: number;
      date: { localDate: string };
      time: string;
      type: string[];
      hasSeatSelection: boolean;
      siteURL: string;
    }[];
  }[];
}

// resposta real do endpoint /v0/sessions/city/{cityId}/event/{eventId}: um item por data,
// cada um contendo os cinemas em "theaters" (não é um array de cinemas diretamente)
export interface SessionsResponseBruta {
  date: string;
  dateFormatted: string;
  dayOfWeek: string;
  isToday: boolean;
  theaters: CinemaBruto[];
}
