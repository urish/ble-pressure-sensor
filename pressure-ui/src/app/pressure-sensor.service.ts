/// <reference types="web-bluetooth" />

import { Injectable } from '@angular/core';
import { Subject, fromEvent, zip } from 'rxjs';
import { first, map, mapTo, filter, zipAll, takeUntil } from 'rxjs/operators';

export interface IPressureSample {
  pressure: number;
  temperature: number;
}

const environmentalSensingServiceUuid = 0x181a;
const temperatureCharactericUuid = 0x2a6e;
const pressureCharactericUuid = 0x2a6d;

@Injectable({
  providedIn: 'root',
})
export class PressureSensorService {
  readings$ = new Subject<IPressureSample>();
  connectionStatus$ = new Subject<boolean>();
  disconnect$ = this.connectionStatus$.pipe(filter((v) => !v));

  private gatt: BluetoothRemoteGATTServer;

  constructor() {}

  async connect() {
    if (!navigator.bluetooth || !navigator.bluetooth.requestDevice) {
      throw new Error('Web bluetooth is not supported on this browser');
    }

    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [environmentalSensingServiceUuid] }],
    });
    this.gatt = await device.gatt.connect();
    fromEvent(device, 'gattserverdisconnected')
      .pipe(first())

      .subscribe(() => {
        this.gatt = null;
        this.connectionStatus$.next(false);
      });
    this.connectionStatus$.next(true);
    const service = await device.gatt.getPrimaryService(environmentalSensingServiceUuid);
    const temperatureChar = await service.getCharacteristic(temperatureCharactericUuid);
    const pressureChar = await service.getCharacteristic(pressureCharactericUuid);
    zip(
      fromEvent(temperatureChar, 'characteristicvaluechanged'),
      fromEvent(pressureChar, 'characteristicvaluechanged'),
    )
      .pipe(takeUntil(this.disconnect$))
      .subscribe(() => {
        const temperature = temperatureChar.value.getInt16(0, true) / 100;
        const pressure = pressureChar.value.getUint32(0, true) / 10;
        this.readings$.next({
          temperature,
          pressure,
        });
      });
    await temperatureChar.startNotifications();
    await pressureChar.startNotifications();
  }

  disconnect() {
    if (this.gatt) {
      this.gatt.disconnect();
      this.gatt = null;
    }
  }
}
