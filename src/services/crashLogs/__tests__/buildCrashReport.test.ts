import { buildCrashReport, CrashReportData } from '../buildCrashReport';

const reportData: CrashReportData = {
  generatedAt: '2026-09-14T00:00:00.000Z',
  application: {
    packageName: 'com.example.LNReader',
    version: '2.1.3',
    buildNumber: '42',
    buildType: 'Release',
    commitSha: 'abc123',
    releaseDate: '2026-09-14',
    jsEngine: 'Hermes',
  },
  device: {
    systemName: 'Android',
    systemVersion: '16',
    apiLevel: 36,
    buildId: 'build',
    brand: 'brand',
    manufacturer: 'manufacturer',
    model: 'model',
    deviceId: 'device',
    supportedAbis: ['arm64-v8a'],
    webViewVersion: '140.0',
  },
  problematicPlugins: [],
  exception: 'Error: boom',
};

describe('buildCrashReport', () => {
  it('formats application, device, plugin, and exception sections', () => {
    const report = buildCrashReport(reportData);

    expect(report).toContain('[Application]');
    expect(report).toContain('Version: 2.1.3 (42)');
    expect(report).toContain('WebView: 140.0');
    expect(report).toContain('[Problematic plugins]\nNone detected.');
    expect(report).toContain('[Current exception]\nError: boom');
  });

  it('does not duplicate an identical current and pending crash', () => {
    const report = buildCrashReport({
      ...reportData,
      pendingCrash: reportData.exception,
    });

    expect(report).not.toContain('[Previous fatal crash]');
  });
});
