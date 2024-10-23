import AsyncStorage from "@react-native-async-storage/async-storage";
import { view } from "./storybook.requires";
import { LaunchArguments } from "react-native-launch-arguments";

const args = LaunchArguments.value();

const StorybookUIRoot = view.getStorybookUI({
  storage: {
    getItem: AsyncStorage.getItem,
    setItem: AsyncStorage.setItem,
  },
  initialSelection: {
    kind: args.kind,
    name: args.name,
  },
});

export default StorybookUIRoot;
