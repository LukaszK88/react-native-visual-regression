
## Name

This package orchestrates several tools to provide flexible visual regression solution for RN.

* Storybook
* Maestro
* pixelmatch

#### Storybook

You want to have an app build which can spawn in Storybook mode. See example dir.

Storybook will enable you to render any screen or component in your application. Having ability to take screenshots of screens or components in controlled enviroment will produce consistent results.

Rendering only screens / components you are interested in regression testing will also be more efficent given you don't need to navigate through multiple screens to get to test screen desitnation.

#### Maestro

Maestro is lightweight E2E testing framework which acts as test driver.

Maestro will be able to spawn a particular story and capture a screenshot.

### Installation

```
npm install --save-dev xxxx
```

### Usage

Add config file `rn-vr.config.js` to the root of your project,

```
module.exports = {
    devices: [ # you can run visual regression for multiple devices
      {
        platform: 'android',
        name: 'Pixel_8_API_34',
      },
    ],
    appId: 'com.anonymous.VisualRegression', # appId of the app
    storiesDirectories: [ # directories of where the stories are
        './example/.storybook'
    ]
  };
```

Mark which story should have visual regression coverage

```
export const AnotherExample: StoryObj<typeof MyButton> = {
  args: {
    text: 'Another example',
  },
  parameters: {
    visualRegression: true,
  }
};
```

Run Visual Regression
```
npm run vr
```

#### Command Arguments

| Argument       | Default   | Example                    | Notes
| -------------- | --------- | -------------------------- | ----|
| --approve \| -a| undefined | -a                         | Approve base images with current version
| --file \| -f   | undefined | -f Button.stories.tsx      | Filename to run VR on
| --story \| -s  | undefined | -s MyButton-AnotherExample | Target particular Story Kind-name

### Prerequisites

Have [Maestro](https://maestro.mobile.dev/) installed

Ensure the app you want to run against is installed on a simulator / emulator you want to run on.

App can spawn in storybook mode, best without UI so you can capture only screen, see example dir.
