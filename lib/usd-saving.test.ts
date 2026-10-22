import { describe, it, expect } from 'vitest';
import { cupSaving, cupSavingForItems, productSavingCup, formatCupAmount } from './usd-saving';

describe('cupSaving', () => {
  it('el ahorro es el margen aplicado al subtotal de productos', () => {
    const r = cupSaving({ itemsSubtotalCup: 1000, marginPct: 20 });
    expect(r.totalWithMarginCup).toBe(1200);
    expect(r.totalWithoutMarginCup).toBe(1000);
    expect(r.savingCup).toBe(200);
    expect(r.savingPct).toBe(17); // 200 de 1200
  });

  it('envío y costo operativo no llevan margen y no forman parte del ahorro', () => {
    const r = cupSaving({
      itemsSubtotalCup: 1000,
      marginPct: 20,
      deliveryFeeCup: 300,
      operationalCostCup: 100,
    });
    expect(r.totalWithMarginCup).toBe(1600);
    expect(r.totalWithoutMarginCup).toBe(1400);
    expect(r.savingCup).toBe(200);
  });

  it('sin margen no hay ahorro', () => {
    const r = cupSaving({ itemsSubtotalCup: 5000, marginPct: 0 });
    expect(r.savingCup).toBe(0);
    expect(r.savingPct).toBe(0);
    expect(r.totalWithMarginCup).toBe(5000);
  });

  it('un margen por producto manda sobre el global', () => {
    const r = cupSaving({ itemsSubtotalCup: 1000, marginPct: 50 });
    expect(r.totalWithMarginCup).toBe(1500);
    expect(r.savingCup).toBe(500);
  });

  it('no rompe con valores negativos o NaN', () => {
    const r = cupSaving({
      itemsSubtotalCup: -100,
      marginPct: -20,
      deliveryFeeCup: NaN,
      operationalCostCup: undefined,
    });
    expect(r.totalWithMarginCup).toBe(0);
    expect(r.savingCup).toBe(0);
  });

  it('el ahorro nunca supera el total con margen', () => {
    const r = cupSaving({ itemsSubtotalCup: 100, marginPct: 20 });
    expect(r.savingCup).toBeLessThanOrEqual(r.totalWithMarginCup);
    expect(r.savingPct).toBeLessThanOrEqual(100);
  });
});

describe('cupSavingForItems', () => {
  it('suma el ahorro de cada producto con su propio margen', () => {
    const r = cupSavingForItems([
      { basePriceCup: 1000, quantity: 2, marginPct: 20 }, // 400 de ahorro
      { basePriceCup: 500, quantity: 1, marginPct: 0 }, // sin margen
    ]);
    expect(r.totalWithoutMarginCup).toBe(2500);
    expect(r.totalWithMarginCup).toBe(2900);
    expect(r.savingCup).toBe(400);
  });

  it('el margen de un producto no se aplica a los demás', () => {
    const r = cupSavingForItems([
      { basePriceCup: 1000, quantity: 1, marginPct: 50 },
      { basePriceCup: 1000, quantity: 1, marginPct: 20 },
    ]);
    expect(r.savingCup).toBe(700);
  });

  it('el envío no altera el ahorro', () => {
    const withFee = cupSavingForItems(
      [{ basePriceCup: 1000, quantity: 1, marginPct: 20 }],
      { deliveryFeeCup: 250 },
    );
    expect(withFee.savingCup).toBe(200);
    expect(withFee.totalWithMarginCup).toBe(1450);
  });
});

describe('productSavingCup', () => {  it('devuelve el margen en CUP de un producto', () => {
    expect(productSavingCup(1000, 20)).toBe(200);
    expect(productSavingCup(455, 20)).toBe(91);
  });

  it('sin margen devuelve 0', () => {
    expect(productSavingCup(1000, 0)).toBe(0);
  });
});

describe('formatCupAmount', () => {
  it('agrupa miles con espacio y redondea', () => {
    expect(formatCupAmount(1250.4)).toBe('1 250 CUP');
    expect(formatCupAmount(999)).toBe('999 CUP');
    expect(formatCupAmount(125000)).toBe('125 000 CUP');
  });

  it('redondea a entero', () => {
    expect(formatCupAmount(89.6)).toBe('90 CUP');
  });
});
