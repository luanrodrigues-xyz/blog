import { describe, expect, it } from 'vitest';
import { articleAlternates } from '../src/lib/article-translations';

const article = (slug: string, language: 'en' | 'pt-BR', extra = {}) => ({
  id: `notebook/payments/${slug}`,
  data: { topic: 'payments', language, draft: false, ...extra },
});

describe('article translations', () => {
  it('links both published versions using the existing -pt convention', () => {
    const en = article('checkout', 'en');
    const pt = article('checkout-pt', 'pt-BR');
    expect(articleAlternates(en, [en, pt])).toEqual([
      { language: 'en', url: 'https://luanrodrigues.xyz/articles/checkout/' },
      { language: 'pt-BR', url: 'https://luanrodrigues.xyz/articles/pt/checkout-pt/' },
    ]);
    expect(articleAlternates(pt, [en, pt]).map((a) => a.language)).toEqual(['pt-BR', 'en']);
  });

  it('keeps the original listed when its translation is still a draft', () => {
    const en = article('checkout', 'en');
    const pt = article('checkout-pt', 'pt-BR', { draft: true });
    expect(articleAlternates(en, [en, pt])).toHaveLength(1);
  });

  it('does not associate the same slug across topics', () => {
    const en = article('checkout', 'en');
    const pt = article('checkout-pt', 'pt-BR', { topic: 'swift' });
    expect(articleAlternates(en, [en, pt])).toHaveLength(1);
  });

  it('supports different slugs through a shared key and respects canonical URLs', () => {
    const en = article('checkout', 'en', { translationKey: 'payment' });
    const pt = article('pagamento', 'pt-BR', { translationKey: 'payment', canonical: 'https://example.com/payment/' });
    expect(articleAlternates(en, [en, pt])[1].url).toBe('https://example.com/payment/');
  });

  it('preserves explicit legacy alternates', () => {
    const alternates = [{ language: 'pt-BR', url: 'https://example.com/legacy/' }];
    const en = article('checkout', 'en', { alternates });
    expect(articleAlternates(en, [en])).toEqual(alternates);
  });

  it('rejects ambiguous pairs instead of choosing a translation silently', () => {
    const en = article('checkout', 'en');
    const pt = article('checkout-pt', 'pt-BR');
    const other = article('pagamento', 'pt-BR', { translationKey: 'checkout' });
    expect(() => articleAlternates(en, [en, pt, other])).toThrow('Ambiguous translation');
  });
});

describe('localized article bundles', () => {
  const localized = (language: 'en' | 'pt-BR', extra = {}) => ({
    id: `notebook/payments/checkout/${language === 'en' ? 'en' : 'pt-br'}`,
    data: { topic: 'payments', language, draft: false, ...extra },
  });

  it('pairs locale folders under one article without using the locale as its slug', () => {
    const en = localized('en');
    const pt = localized('pt-BR');
    expect(articleAlternates(en, [en, pt])).toEqual([
      { language: 'en', url: 'https://luanrodrigues.xyz/articles/checkout/' },
      { language: 'pt-BR', url: 'https://luanrodrigues.xyz/articles/pt/checkout/' },
    ]);
    expect(articleAlternates(pt, [en, pt])[1].url).toBe('https://luanrodrigues.xyz/articles/checkout/');
  });

  it('preserves historical URLs while pairing by the shared folder', () => {
    const en = localized('en');
    const pt = localized('pt-BR', { urlSlug: 'checkout-pt' });
    expect(articleAlternates(en, [en, pt])[1].url).toBe('https://luanrodrigues.xyz/articles/pt/checkout-pt/');
  });

  it('does not expose a missing or draft English translation', () => {
    const pt = localized('pt-BR');
    const en = localized('en', { draft: true });
    expect(articleAlternates(pt, [pt])).toHaveLength(1);
    expect(articleAlternates(pt, [pt, en])).toHaveLength(1);
  });
});
