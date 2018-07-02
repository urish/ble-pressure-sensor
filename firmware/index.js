const DEVICE_NAME = 'ble-pressure';
const SAMPLE_INTERVAL = 50;

const sensor = require('MS5803').connectI2C(I2C1);

let sensorTimer = null;
function readSensor() {
  Promise.resolve()
    .then(() => sensor.read(sensor.PRECISION.ADC_4096))
    .then((result) => {
      const pressurePascal = result.pressure * 100;
      const temperatue = new Int16Array([result.temperature * 100]);
      const pressure = new Uint32Array([Math.round(pressurePascal * 10)]);
      NRF.updateServices({
        0x181a: {
          0x2a6e: {
            notify: true,
            value: temperatue.buffer,
          },
          0x2a6d: {
            notify: true,
            value: pressure.buffer,
          },
        },
      });
    });
}

function startSensor() {
  if (sensorTimer == null) {
    sensorTimer = setInterval(readSensor, SAMPLE_INTERVAL);
  }
}

function stopSensor() {
  if (sensorTimer != null) {
    try {
      clearInterval(sensorTimer);
    } finally {
      sensorTimer = null;
    }
  }
}

function onInit() {
  I2C1.setup({ sda: 29, scl: 30 });

  const eirEntry = (type, data) => [data.length + 1, type].concat(data);
  NRF.setAdvertising([].concat(eirEntry(0x3, [0x1a, 0x18]), eirEntry(0x9, DEVICE_NAME)), {
    name: DEVICE_NAME,
  });

  // Bluetooth
  NRF.setServices({
    0x181a: {
      0x2a6e: {
        readable: true,
        notify: true,
        value: [0, 0],
      },
      0x2a6d: {
        readable: true,
        notify: true,
        value: [0, 0, 0, 0],
      },
    },
  });

  sensor.reset().then(() => {
    sensor.begin();

    NRF.on('connect', startSensor);
    NRF.on('disconnect', stopSensor);
  });
}
