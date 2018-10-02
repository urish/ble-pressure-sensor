import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PressureSensorService, IPressureSample } from './pressure-sensor.service';
import { MatSnackBar } from '@angular/material';
import * as NoSleep from 'nosleep.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  connected = false;
  connecting = false;
  readonly data$: Observable<IPressureSample> = this.pressureSensor.readings$;
  readonly nosleep = new NoSleep();

  private destroy$ = new Subject<void>();

  constructor(private pressureSensor: PressureSensorService, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.pressureSensor.connectionStatus$.pipe(takeUntil(this.destroy$)).subscribe((status) => {
      this.connected = status;
      if (!status) {
        this.nosleep.disable();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  async connect() {
    this.connecting = true;
    this.snackBar.dismiss();
    this.nosleep.enable();
    try {
      await this.pressureSensor.connect();
    } catch (err) {
      this.nosleep.disable();
      this.snackBar.open('Connection failed: ' + err.toString(), 'Dismiss');
    } finally {
      this.connecting = false;
    }
  }

  disconnect() {
    this.pressureSensor.disconnect();
  }
}
