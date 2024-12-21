// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

const Component = function Component() {};

const CardDetailsMeta: Meta<typeof Component> = {
  title: "ComponentB",
  component: Component,
};

export default CardDetailsMeta;

export const Basic: StoryObj<typeof Component> = {
  parameters: {
    msw: {
      reset: true,
    },
    visualRegression: true,
  },
};

export const Second: StoryObj<typeof Component> = {
  parameters: {
    visualRegression: true,
    msw: {
      reset: true,
    },
  },
};

export const Third: StoryObj<typeof Component> = {
  parameters: {
    navigation: true,
    visualRegression: true,
    msw: {
      reset: true,
    },
  },
};

export const Fourth: StoryObj<typeof Component> = {
  parameters: {
    navigation: true,
    visualRegression: true,
    story: false,
  },
};