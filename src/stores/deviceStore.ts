import { createStore } from "zustand/vanilla";

interface PararellDevice {
  id: string;
  name: string;
}

interface State {
  devices: Record<string, PararellDevice[]>;
}

export const deviceStore = createStore<State>(() => ({
  devices: {},
}));

export const addToBaseDevice = (
  baseDeviceName: string,
  pararellDevice: PararellDevice,
) => {
  deviceStore.setState((state) => {
    return {
      devices: {
        ...state.devices,
        [baseDeviceName]: state.devices[baseDeviceName].concat(pararellDevice),
      },
    };
  });
};

export const addBaseDevice = (pararellDevice: PararellDevice) => {
  deviceStore.setState((state) => {
    return {
      devices: {
        ...state.devices,
        [pararellDevice.name]: [pararellDevice],
      },
    };
  });
};
