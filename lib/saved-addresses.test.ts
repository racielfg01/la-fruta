import { describe, it, expect } from 'vitest';
import {
  findSavedAddress,
  planSaveAddress,
  type SavedAddress,
} from './saved-addresses';

const direcciones: SavedAddress[] = [
  {
    id: 'a1',
    alias: 'casa',
    address: 'Calle 7 de Sueño, entre 1ra y 2da',
    zone: 'Sueño',
    notes: 'Tocar la puerta azul',
  },
  {
    id: 'a2',
    alias: 'abuela',
    address: 'Calle K',
    zone: 'Sueño',
    notes: '',
  },
];

describe('findSavedAddress', () => {
  it('encuentra la dirección que coincide en texto y zona', () => {
    const found = findSavedAddress(
      direcciones,
      'calle 7 de sueño, entre 1ra y 2da',
      'sueño'
    );
    expect(found?.id).toBe('a1');
  });

  it('no confunde direcciones con zonas distintas', () => {
    expect(
      findSavedAddress(direcciones, 'Calle K', 'Víbora')
    ).toBeUndefined();
  });

  it('ignora mayúsculas y espacios sobrantes', () => {
    expect(
      findSavedAddress(direcciones, '  CALLE K  ', ' Sueño ')?.id
    ).toBe('a2');
  });

  it('con dirección vacía no encuentra nada', () => {
    expect(findSavedAddress(direcciones, '   ', 'Sueño')).toBeUndefined();
  });
});

describe('planSaveAddress', () => {
  it('crea si la dirección no existe', () => {
    const plan = planSaveAddress(direcciones, {
      address: 'Calle 50 y 51',
      zone: 'Víbora',
      alias: 'nueva',
      notes: 'llamar antes',
    });
    expect(plan.kind).toBe('create');
  });

  it('actualiza si la dirección ya existe (no la descarta)', () => {
    const plan = planSaveAddress(direcciones, {
      address: 'Calle K',
      zone: 'Sueño',
      alias: 'abuela',
      notes: 'Viernes de 5 a 7 pm',
    });
    expect(plan.kind).toBe('update');
    if (plan.kind === 'update') {
      expect(plan.id).toBe('a2');
      expect(plan.notes).toBe('Viernes de 5 a 7 pm');
      expect(plan.alias).toBe('abuela');
    }
  });

  it('actualiza aunque el alias venga vacío (conserva el que ya tenía)', () => {
    const plan = planSaveAddress(direcciones, {
      address: 'Calle K',
      zone: 'Sueño',
      alias: '   ',
      notes: 'nota nueva',
    });
    expect(plan.kind).toBe('update');
    if (plan.kind === 'update') {
      expect(plan.alias).toBe('abuela');
      expect(plan.notes).toBe('nota nueva');
    }
  });

  it('la nota se guarda sin espacios sobrantes', () => {
    const plan = planSaveAddress(direcciones, {
      address: 'Calle K',
      zone: 'Sueño',
      alias: 'abuela',
      notes: '  hola  ',
    });
    if (plan.kind === 'update') expect(plan.notes).toBe('hola');
  });
});
