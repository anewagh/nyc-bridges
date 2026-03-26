export interface City {
  slug: string;
  name: string;
  isBuiltIn: boolean;
}

export interface Bridge {
  slug: string;
  name: string;
  from: string;
  to: string;
  distance: string;
  yearBuilt: number;
  region: string;
  funFacts?: string[];
  city: string;
  isUserAdded?: boolean;
  wikipediaUrl?: string;
}
