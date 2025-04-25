
export interface ServiceInfo {
  duration: number;
  price: number;
  category: string;
}

export const serviceData: Record<string, ServiceInfo> = {
  // Cabelo
  "corte_cabelo": { duration: 30, price: 50, category: "Cabelo" },
  "coloracao": { duration: 120, price: 150, category: "Cabelo" },
  "luzes": { duration: 180, price: 200, category: "Cabelo" },
  "escova": { duration: 40, price: 60, category: "Cabelo" },
  "hidratacao": { duration: 60, price: 80, category: "Cabelo" },
  
  // Mãos e Pés
  "manicure_comum": { duration: 40, price: 35, category: "Manicure" },
  "manicure_gel": { duration: 60, price: 80, category: "Manicure" },
  "pedicure_comum": { duration: 50, price: 45, category: "Pedicure" },
  "pedicure_spa": { duration: 90, price: 90, category: "Pedicure" },
  
  // Maquiagem
  "maquiagem_social": { duration: 60, price: 120, category: "Maquiagem" },
  "maquiagem_noiva": { duration: 120, price: 250, category: "Maquiagem" },
  
  // Estética
  "design_sobrancelhas": { duration: 30, price: 40, category: "Estética" },
  "depilacao_cera": { duration: 60, price: 80, category: "Depilação" },
  "depilacao_laser": { duration: 60, price: 150, category: "Depilação" },
  
  // Barba
  "barba": { duration: 30, price: 40, category: "Barba" },
  
  // Bem-estar
  "massagem_relaxante": { duration: 60, price: 120, category: "Massagem" },
  "limpeza_pele": { duration: 60, price: 100, category: "Tratamento Facial" },
};
