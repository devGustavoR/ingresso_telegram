// types/filmes.ts

export interface FilmeFormatado {
  id: string;
  title: string;
  contentRating: string;
  synopsis: string;
  imageFeatured: string;
  distributor: string;
  genres: string[];
  trailers: string[];
  ratingDetails: string;
  ratingDetailsDescription: string;
}

// resposta real do endpoint /v0/events/city/{cityId}
export interface FilmeBruto {
  id: string;
  title: string;
  contentRating: string;
  synopsis: string;
  imageFeatured: string;
  distributor: string;
  genres: string[];
  trailers: { url: string }[];
  ratingDetails: { name: string; description: string };
}
