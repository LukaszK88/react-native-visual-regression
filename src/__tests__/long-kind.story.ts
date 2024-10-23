const SomeComponentWithVerLongNameWhichWillEndOnNextLine =
  function SomeComponentWithVerLongName() {};

const CardDetailsMeta: Meta<
  typeof SomeComponentWithVerLongNameWhichWillEndOnNextLine
> = {
  title: "SomeComponentWithVerLongNameWhichWillEndOnNextLine",
  component: SomeComponentWithVerLongNameWhichWillEndOnNextLine,
};

export default CardDetailsMeta;

export const Basic: StoryObj<
  typeof SomeComponentWithVerLongNameWhichWillEndOnNextLine
> = {
  parameters: {
    visualRegression: true,
  },
};
