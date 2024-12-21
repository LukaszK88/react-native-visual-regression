// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

const Component = function Component() {};

const CardDetailsMeta: Meta<typeof Component> = {
  title: "Component",
  component: Component,
};

export default CardDetailsMeta;

export const Basic: StoryObj<typeof Component> = {
  parameters: {
    visualRegression: true,
  },
};

export const SecondName: StoryObj<typeof Component> = {
  parameters: {
    visualRegression: true,
  },
};
