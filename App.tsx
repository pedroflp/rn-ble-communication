import React, {useEffect, useState} from 'react';
import {
  NativeEventEmitter,
  NativeModules,
  Permission,
  PermissionsAndroid,
  Platform,
  ScrollView,
  Text,
} from 'react-native';
import BleManager, {Peripheral} from 'react-native-ble-manager';
import {Buffer} from 'buffer';
import Button from './src/Button';
import {Column} from './src/Column';
type IScannedDevice = Peripheral & {
  connected?: boolean;
};

const BleManagerModule = NativeModules.BleManager;
const BleManagerEmitter = new NativeEventEmitter(BleManagerModule);
const {BLUETOOTH_SCAN, BLUETOOTH_CONNECT} = PermissionsAndroid.PERMISSIONS;

const App = () => {
  const [isScanPermissionAllowed, setIsScanPermissionAllowed] = useState(false);
  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(false);
  const [isModuleEnabled, setIsModuleEnabled] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAnyDeviceScanned, setAnyDeviceScanned] = useState(false);
  const [scannedDevices, setScannedDevices] = useState<IScannedDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<
    IScannedDevice | undefined
  >();

  const checkAndRequestBluetoothPermission = async (permission: Permission) => {
    PermissionsAndroid.check(permission).then(alreadyAllowed => {
      if (alreadyAllowed) {
        return setIsScanPermissionAllowed(true);
      }

      PermissionsAndroid.request(permission).then(res =>
        setIsScanPermissionAllowed(res === 'granted'),
      );
    });
  };

  const handleAllowBluetoothPermission = async () => {
    await Promise.allSettled([
      checkAndRequestBluetoothPermission(BLUETOOTH_SCAN),
      checkAndRequestBluetoothPermission(BLUETOOTH_CONNECT),
    ]);
  };

  const handleEnableBluetooth = () => {
    BleManager.enableBluetooth().then(() => {
      // Success code
      setIsBluetoothEnabled(true);
    });
  };

  const handleStartBleModule = () => {
    BleManager.start({showAlert: false}).then(() => {
      // Success code
      setIsModuleEnabled(true);
    });
  };

  const handleStartScan = () => {
    BleManager.scan([], 5, true).then(() => {
      // Success code
      setIsScanning(true);
    });
  };

  const handleGetConnectedDevices = () => {
    BleManager.getConnectedPeripherals([]).then(devices => {
      console.log(devices);
      if (devices.length === 0) {
        return setAnyDeviceScanned(false);
      }

      const mappedDevices = devices.map(device => ({
        ...device,
        connected: false,
      }));
      setScannedDevices(mappedDevices);
      setAnyDeviceScanned(true);
    });
  };

  const handleConnectToDevice = (deviceId: string) => {
    BleManager.connect(deviceId).then(() => {
      const devices = scannedDevices;

      const mappedDevices = devices.map(device => {
        if (device.id === deviceId) {
          const data = {...device, connected: true};
          setConnectedDevice(data);
          return data;
        }
        return device;
      });

      setScannedDevices(mappedDevices);
    });
  };

  const handleDisconnectDevice = (deviceId: string) => {
    BleManager.disconnect(deviceId).then(() => {
      const devices = scannedDevices;

      const devicesFiltered = devices.filter(device => device.id !== deviceId);
      setScannedDevices(devicesFiltered);
    });
  };

  const handleSendDataToDevice = () => {
    if (!connectedDevice) {
      return;
    }

    const data = {
      id: 123,
      name: 'data to send',
    };

    const dataToSend = Buffer.from(JSON.stringify(data));

    // console.log(connectedDevice.advertising);
    // BleManager.write(
    //   connectedDevice?.id,
    //   connectedDevice?.advertising.serviceUUIDs,
    //   connectedDevice?.advertising.serviceUUIDs,
    //   dataToSend
    // ).then(() => {
  };

  useEffect(() => {
    BleManagerEmitter.addListener('BleManagerStopScan', () => {
      setIsScanning(false);
      handleGetConnectedDevices();
    });
  }, []);

  return (
    <ScrollView style={{padding: 30}} contentContainerStyle={{gap: 16}}>
      <Column>
        <Text>Bluetooth</Text>

        <Button onPress={handleAllowBluetoothPermission}>
          {isScanPermissionAllowed
            ? 'Scan permission allowed ✅'
            : 'Check|Request scan permission'}
        </Button>
        {Platform.OS === 'android' && (
          <Button onPress={handleEnableBluetooth}>
            {isBluetoothEnabled ? 'Bluetooth enabled ✅' : 'Enable bluetooth'}
          </Button>
        )}
      </Column>

      {isScanPermissionAllowed && isBluetoothEnabled && (
        <Column>
          <Text>BLE Manager Module</Text>
          <Button onPress={handleStartBleModule}>
            {isModuleEnabled ? 'Module enabled ✅' : 'Enable module'}
          </Button>
        </Column>
      )}
      {isModuleEnabled && (
        <>
          <Column>
            <Text>Scan mode</Text>
            <Button onPress={handleStartScan}>
              {isScanning ? 'Scanning 🔎' : 'Start scan'}
            </Button>
          </Column>

          <Column>
            <Text>Devices</Text>
            {isScanning ? (
              <Text>Scanning 🔎</Text>
            ) : isAnyDeviceScanned ? (
              scannedDevices.map(device => (
                <Button
                  key={device.id}
                  style={{
                    backgroundColor: device.connected ? '#027636' : '#000',
                  }}
                  onPress={() => handleConnectToDevice(device.id)}
                  onLongPress={() =>
                    device.connected && handleDisconnectDevice(device.id)
                  }>
                  <Column>
                    {device.connected && (
                      <Text style={{color: '#fff'}}>
                        Connected with this device ✅
                      </Text>
                    )}
                    <Text style={{color: '#fff'}}>Device: {device.name}</Text>
                    <Text style={{color: '#fff'}}>ID: {device.id}</Text>
                    <Text style={{color: '#fff'}}>RSSI: {device.rssi}</Text>
                  </Column>
                </Button>
              ))
            ) : (
              <Text>0 devices scanned</Text>
            )}
          </Column>
        </>
      )}

      {scannedDevices.find(device => device.connected) && (
        <Column>
          <Text>Send data</Text>
          <Button onPress={handleSendDataToDevice}>
            {isScanning ? 'Json sent 🔎' : 'Send json'}
          </Button>
        </Column>
      )}
    </ScrollView>
  );
};

export default App;
