import {
  Component,
  OnInit,
  Input,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { IPressureSample } from '../pressure-sensor.service';
import { Observable, Subject } from 'rxjs';
import { SmoothieChart, TimeSeries } from 'smoothie';
import { takeUntil } from 'rxjs/operators';

const samplingFrequency = 20;

@Component({
  selector: 'app-pressure-graph',
  templateUrl: './pressure-graph.component.html',
  styleUrls: ['./pressure-graph.component.css'],
})
export class PressureGraphComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() pressureData: Observable<IPressureSample>;

  @ViewChild('chart') canvasElement: ElementRef;

  private chart: SmoothieChart = new SmoothieChart({
    tooltip: true,
    responsive: true,
  });
  private pressureSeries = new TimeSeries();
  private destroy$ = new Subject<void>();

  constructor() {}

  ngOnInit() {
    this.chart.addTimeSeries(this.pressureSeries, {
      strokeStyle: 'rgba(0, 255, 0, 1)',
      fillStyle: 'rgba(0, 255, 0, 0.2)',
      lineWidth: 2,
    });
    this.pressureData.pipe(takeUntil(this.destroy$)).subscribe((sample) => {
      this.pressureSeries.append(new Date().getTime(), sample.pressure);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  ngAfterViewInit() {
    this.chart.streamTo(this.canvasElement.nativeElement);
  }
}
