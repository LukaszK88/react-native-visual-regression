import { View } from "react-native";
import type { Meta, StoryObj } from "@storybook/react";
import { MyButton } from "./Button";
import { useEffect, useState } from "react";
import React from "react";

const MyButtonMeta: Meta<typeof MyButton> = {
  title: "MyButton",
  component: MyButton,
  argTypes: {
    onPress: { action: "pressed the button" },
  },
  args: {
    text: "Hello world",
  },
  decorators: [
    (Story) => (
      <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
        <Story />
      </View>
    ),
  ],
};

export default MyButtonMeta;

export const Basic: StoryObj<typeof MyButton> = {
  parameters: {
    visualRegression: true,
  },
};

export const AnotherExample: StoryObj<typeof MyButton> = {
  args: {
    text: "Another example",
  },
  parameters: {
    visualRegression: true,
  },
};

export const CAPS: StoryObj<typeof MyButton> = {
  args: {
    text: "CAPS Example",
  },
  parameters: {
    visualRegression: true,
  },
};

export const AwaitingElement: StoryObj<typeof MyButton> = {
  parameters: {
    visualRegression: true,
    visualRegressionAwaitElement: "element",
  },
  args: {
    text: "Awaiting",
  },
  render: () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
      setTimeout(() => {
        setVisible(true);
      }, 2000);
    }, []);

    if (visible) {
      return (
        <MyButton
          testID="element"
          text="Awaiting"
          onPress={() => console.log("test")}
        />
      );
    }

    return null;
  },
};
