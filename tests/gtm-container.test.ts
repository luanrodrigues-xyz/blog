import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const config = JSON.parse(readFileSync(new URL('../config/analytics/gtm-container.json', import.meta.url), 'utf8'));
const container = config.containerVersion;

function checkParameters(parameters: any[] = []) {
  for (const parameter of parameters) {
    expect(['TEMPLATE', 'LIST', 'MAP', 'INTEGER', 'BOOLEAN']).toContain(parameter.type);
    checkParameters(parameter.list);
    checkParameters(parameter.map);
  }
}

describe('GTM import file', () => {
  it('uses export-format enums rather than REST API enums', () => {
    expect(config.exportFormatVersion).toBe(2);
    expect(container.container.usageContext).toEqual(['WEB']);
    for (const tag of container.tag) {
      expect(['ONCE_PER_LOAD', 'ONCE_PER_EVENT']).toContain(tag.tagFiringOption);
      checkParameters(tag.parameter);
    }
    for (const trigger of container.trigger) {
      expect(trigger.type).toBe('CUSTOM_EVENT');
      for (const condition of trigger.customEventFilter) {
        expect(condition.type).toBe('EQUALS');
        checkParameters(condition.parameter);
      }
    }
    for (const variable of container.variable) checkParameters(variable.parameter);
  });

  it('keeps template identifiers and resolves event variable and trigger references', () => {
    const variables = new Set(container.variable.map((variable: any) => variable.name));
    const triggers = new Set(container.trigger.map((trigger: any) => trigger.triggerId));
    for (const tag of container.tag) {
      expect(['googtag', 'gaawe']).toContain(tag.type);
      for (const id of tag.firingTriggerId) {
        expect(triggers.has(id) || id === '2147479573').toBe(true);
      }
      for (const match of JSON.stringify(tag.parameter).matchAll(/\{\{([^}]+)\}\}/g)) {
        expect(variables.has(match[1])).toBe(true);
      }
    }
    for (const variable of container.variable) expect(variable.type).toBe('v');
  });
});
