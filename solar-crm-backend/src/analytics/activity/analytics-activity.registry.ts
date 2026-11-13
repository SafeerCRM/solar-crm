
import {
  AnalyticsActivityContext,
  AnalyticsActivityProvider,
  AnalyticsActivitySection,
} from './analytics-activity.types';

export class AnalyticsActivityRegistry {
  private readonly providers =
    new Map<string, AnalyticsActivityProvider>();

  register(provider: AnalyticsActivityProvider): void {
    const key = provider.moduleKey.trim().toUpperCase();

    if (this.providers.has(key)) {
      throw new Error(
        `Duplicate analytics activity provider: ${key}`,
      );
    }

    this.providers.set(key, provider);
  }

  getRegisteredModules(): string[] {
    return [...this.providers.keys()];
  }

  async buildReport(
    context: AnalyticsActivityContext,
    moduleKeys?: string[],
  ): Promise<AnalyticsActivitySection[]> {
    const requestedKeys = moduleKeys
      ? [...new Set(
          moduleKeys.map((key) =>
            key.trim().toUpperCase(),
          ),
        )]
      : this.getRegisteredModules();

    const sections: AnalyticsActivitySection[] = [];

    for (const key of requestedKeys) {
      const provider = this.providers.get(key);

      if (!provider) {
        continue;
      }

      const section = await provider.build(context);

      const hasRecordedMetrics = section.metrics.some(
  (metric) =>
    metric.value !== null &&
    Number.isFinite(metric.value) &&
    metric.value > 0 &&
    (metric.timeScope === 'PERIOD' ||
      metric.timeScope === 'CURRENT'),
);

if (hasRecordedMetrics) {
  sections.push(section);
}
    }

    return sections;
  }
}
