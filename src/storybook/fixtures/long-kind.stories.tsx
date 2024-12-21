// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

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
