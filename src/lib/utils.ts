import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { IVA_NICARAGUA } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formato moneda córdoba nicaragüense
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Formato fecha
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-NI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Calcular IVA
export function calcularIVA(subtotal: number, aplicaIVA: boolean): number {
  if (!aplicaIVA) return 0;
  return subtotal * IVA_NICARAGUA;
}

// Validar RUC Nicaragua (formato básico)
export function validarRUC(ruc: string): boolean {
  // RUC persona natural: 14 dígitos
  // RUC persona jurídica: 14 dígitos
  return /^\d{14}$/.test(ruc.replace(/-/g, ""));
}

// Validar cédula Nicaragua: 001-000000-0000X
export function validarCedula(cedula: string): boolean {
  return /^\d{3}-\d{6}-\d{4}[A-Z]$/.test(cedula);
}

// Generar número de factura
export function generarNumeroFactura(ultimo: number, prefijo = "F"): string {
  return `${prefijo}-${String(ultimo + 1).padStart(6, "0")}`;
}

// Formatear RUC con guiones
export function formatearRUC(ruc: string): string {
  const limpio = ruc.replace(/\D/g, "");
  if (limpio.length !== 14) return ruc;
  return `${limpio.slice(0, 3)}-${limpio.slice(3, 9)}-${limpio.slice(9)}`;
}

// Mes en español
export function nombreMes(mes: number): string {
  const meses = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
  ];
  return meses[mes - 1] ?? "";
}
