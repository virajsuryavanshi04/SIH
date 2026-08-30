import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-[#2E8B57]';
  if (score >= 60) return 'text-[#A85D4C]';
  return 'text-[#B38A3D]';
}

export function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-[#2E8B57]/10';
  if (score >= 60) return 'bg-[#A85D4C]/10';
  return 'bg-[#B38A3D]/15';
}

export function getPriorityColor(priority: string): string {
  switch(priority.toUpperCase()) {
    case 'CRITICAL': return 'text-[#B38A3D]';
    case 'HIGH': return 'text-[#B38A3D]';
    case 'MEDIUM': return 'text-[#A85D4C]';
    default: return 'text-[#292B2B]';
  }
}
