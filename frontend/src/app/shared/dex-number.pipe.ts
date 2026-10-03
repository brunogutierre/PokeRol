import { Pipe, PipeTransform } from '@angular/core';

/** Formats a Pokédex number: 25 -> "#025". */
export function dexNumber(id: number): string {
  return `#${String(id).padStart(3, '0')}`;
}

@Pipe({ name: 'dexNumber' })
export class DexNumberPipe implements PipeTransform {
  transform(id: number): string {
    return dexNumber(id);
  }
}
