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
import BleManager, {
  BleScanCallbackType,
  BleScanMatchMode,
  BleScanMode,
  Peripheral,
} from 'react-native-ble-manager';
import {Buffer} from 'buffer';
import Button from './src/Button';
import {Column} from './src/Column';
type IScannedDevice = Peripheral & {
  connected?: boolean;
};

const BleManagerModule = NativeModules.BleManager;
const BleManagerEmitter = new NativeEventEmitter(BleManagerModule);
const {BLUETOOTH_SCAN, BLUETOOTH_CONNECT, ACCESS_FINE_LOCATION} =
  PermissionsAndroid.PERMISSIONS;

const App = () => {
  const [isPermissionAllowed, setIsPermissionAllowed] = useState(false);
  const [isBluetoothEnabled, setIsBluetoothEnabled] = useState(false);
  const [isModuleEnabled, setIsModuleEnabled] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAnyDeviceScanned, setAnyDeviceScanned] = useState(false);
  const [scannedDevices, setScannedDevices] = useState<Peripheral[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<
    Peripheral[] | undefined
  >();
  // 40:35:E6:4D:06:C8

  const checkAndRequestBluetoothPermission = async () => {
    const permissions = await PermissionsAndroid.requestMultiple([
      BLUETOOTH_CONNECT,
      BLUETOOTH_SCAN,
    ]);

    setIsPermissionAllowed(
      permissions[BLUETOOTH_CONNECT] === 'granted' &&
        permissions[BLUETOOTH_SCAN] === 'granted',
    );
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

  const retrievePeripheralService = async (deviceId: string) => {
    try {
      const peripheralInfo = await BleManager.retrieveServices(deviceId);
      console.log(peripheralInfo);
      return peripheralInfo;
    } catch (error) {
      console.error('[Retrieve Error]', error);
    }
  };

  const createPeripheralBond = async (deviceId: string) => {
    try {
      await BleManager.createBond(deviceId);
      await retrievePeripheralService(deviceId);
    } catch (error) {
      console.error('[CreateBond Error]', error);
    }
  };

  const handleStartScan = () => {
    BleManager.scan([], 5, true, {
      matchMode: BleScanMatchMode.Sticky,
      scanMode: BleScanMode.LowLatency,
      callbackType: BleScanCallbackType.AllMatches,
    }).then(() => {
      // Success code
      setIsScanning(true);
    });
  };

  const storeDiscoveredPeripheral = (device: Peripheral) => {
    // if (!device.name) {
    //   return;
    // }

    setScannedDevices(prevDevices => {
      const alreadyInList = prevDevices.find(
        peripheral => peripheral.id === device.id,
      );

      if (alreadyInList) {
        return prevDevices;
      }

      return [...prevDevices, device];
    });
  };

  const handleGetConnectedDevices = () => {
    BleManager.getConnectedPeripherals([]).then(devices => {
      console.log(devices);
      if (devices.length === 0) {
        return setAnyDeviceScanned(false);
      }

      setAnyDeviceScanned(true);
    });
  };

  const handleConnectToDevice = async (deviceId: string) => {
    try {
      // await retrievePeripheralService(deviceId);
      await createPeripheralBond(deviceId);
      const responseConnection = await BleManager.connect(deviceId);

      console.log(responseConnection);
    } catch (error) {
      console.error('[Connect Error]', error);
    }
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

    const dataToSend = Buffer.from(JSON.stringify(data)).toJSON().data;

    // console.log(connectedDevice.advertising);
    BleManager.write(
      connectedDevice?.id,
      '00000003-0000-1000-8000-00805F9B34FB',
      '00000003-0000-1000-8000-00805F9B34FB',
      dataToSend,
    ).then(() => {
      console.log('Write', data);
    });
  };

  useEffect(() => {
    BleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      storeDiscoveredPeripheral,
    );
    // BleManagerEmitter.addListener('BleManagerStopScan', () => {
    //   setIsScanning(false);
    //   handleGetConnectedDevices();
    // });
  }, []);

  return (
    <ScrollView style={{padding: 30}} contentContainerStyle={{gap: 16}}>
      <Column>
        <Text>Bluetooth</Text>

        <Button onPress={checkAndRequestBluetoothPermission}>
          {isPermissionAllowed
            ? 'Permission allowed ✅'
            : 'Check|Request permission'}
        </Button>
        {Platform.OS === 'android' && (
          <Button onPress={handleEnableBluetooth}>
            {isBluetoothEnabled ? 'Bluetooth enabled ✅' : 'Enable bluetooth'}
          </Button>
        )}
      </Column>

      {isPermissionAllowed && isBluetoothEnabled && (
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
            {scannedDevices.length > 0 ? (
              scannedDevices.map((device, index) => (
                <Button
                  key={index}
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

      {/* {scannedDevices.find(device => device.connected) && (
        <Column>
          <Text>Send data</Text>
          <Button onPress={handleSendDataToDevice}>
            {isScanning ? 'Json sent 🔎' : 'Send json'}
          </Button>
        </Column>
      )} */}
    </ScrollView>
  );
};

export default App;
