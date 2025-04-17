// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

const Component = function Component() {};

const ComponentMeta: Meta<typeof Component> = {
  title: "Components/ComponentA/Some",
  component: Component,
};

export default ComponentMeta;

export const Basic: StoryObj<typeof Component> = {
  parameters: {
    visualRegression: true,
  },
};

export const EUR: StoryObj<typeof Component> = {
  parameters: {
    visualRegression: true,
  },
};
