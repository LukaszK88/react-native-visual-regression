## Name

This package orchestrates several tools to provide a flexible visual regression solution for React Native (RN).

If you are using Storybook in your project, you can perform visual regression testing against existing stories.

### Storybook

You need to have an app build that can launch in Storybook mode. See the `example` directory for reference.

Storybook allows you to render any screen or component in your application. By capturing screenshots of these screens or components in a controlled environment, you can ensure consistent results.

Rendering only the screens or components that you are interested in regression testing will be more efficient, as you won't need to navigate through multiple screens to reach a particular screen.

### Installation

```bash
npm install --save-dev xxxx
```

### Usage

Add the configuration file `rn-vr.config.js` to the root of your project:

```javascript
module.exports = {
  devices: [ // You can run visual regression for multiple devices
    {
      platform: 'android',
      name: 'Pixel_8_API_34',
    },
  ],
  appId: 'com.anonymous.VisualRegression', // appId of the app
  storiesDirectories: [ // Directories where the stories are located
    './example/.storybook'
  ]
};
```

Mark which story should have visual regression coverage:

```javascript
export const AnotherExample: StoryObj<typeof MyButton> = {
  args: {
    text: 'Another example',
  },
  parameters: {
    visualRegression: true,
  }
};
```

Run Visual Regression:

```bash
npx rn-vr
```

### Command Arguments

| Argument       | Default   | Example                    | Notes                                                |
| -------------- | --------- | -------------------------- | ---------------------------------------------------- |
| --approve \| -a| undefined | -a                         | Approve base images with the current version         |
| --file \| -f   | undefined | -f .storybook/stories/Button/Button.stories.tsx      | Filename to run visual regression on                 |
| --story \| -s  | undefined | -s MyButton-AnotherExample | Target a particular Story kind-name                  |

### Prerequisites

- Ensure the app you want to run against is installed on the simulator/emulator you want to use.
- The app can launch in Storybook mode, preferably without a UI, so you can capture only the screen. See the `example` directory for more details.
- Story files should end with `*.stories.tsx`.
