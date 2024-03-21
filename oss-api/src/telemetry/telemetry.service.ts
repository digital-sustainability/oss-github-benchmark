import { Injectable } from '@nestjs/common';
import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

@Injectable()
export class TelemetryService {
  private repoCounter: number = 0;
  private latestCrawl: number = 0;
  private okStatus: number = 0;
  private errorStatus: number = 0;

  constructor() {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
    const { endpoint, port } = PrometheusExporter.DEFAULT_OPTIONS;
    const exporter = new PrometheusExporter({}, () => {
      console.log(
        `prometheus scrape endpoint: http://localhost:${port}${endpoint}`,
      );
    });
    const meterProvider = new MeterProvider();
    meterProvider.addMetricReader(exporter);
    const meter = meterProvider.getMeter('prometheus');
    const attributes = { pid: process.pid, environment: 'staging' };
    const observableRepoCounter = meter.createObservableCounter(
      'observable_repos',
      {
        description: 'The count of crawled Repositories',
      },
    );
    const observableTimestamp = meter.createObservableCounter(
      'observable_lastest_crawl',
      {
        description: 'The Date of the lastest crawl',
      },
    );
    const observableokStatus = meter.createObservableCounter(
      'observable_ok_status',
      {
        description: 'The count of ok status',
      },
    );
    const observableErrorStatus = meter.createObservableCounter(
      'observable_error_status',
      {
        description: 'The count of error status',
      },
    );
    observableRepoCounter.addCallback((observableResult) => {
      observableResult.observe(this.repoCounter, attributes);
    });
    observableTimestamp.addCallback((observableResult) => {
      observableResult.observe(this.latestCrawl, attributes);
    });
    observableokStatus.addCallback((observableResult) => {
      observableResult.observe(this.okStatus, attributes);
    });
    observableErrorStatus.addCallback((observableResult) => {
      observableResult.observe(this.errorStatus, attributes);
    });
  }

  public setRepoCount(repoCount: number) {
    this.repoCounter = repoCount;
  }
  public setLatestCrawl(timestamp: number) {
    this.latestCrawl = timestamp;
  }
  public incrementOkStatus() {
    this.okStatus++;
  }
  public incrementErrorStatus() {
    this.errorStatus++;
  }
}
