```
npm install --save-dev xxxx
```

Add config file `rn-vr.config.js` to root of your project,

```
module.exports = {
    device: 'emulator-5554', # device you would like to run the regression on
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

### Prerequisited

Have Maestro installed

Ensure the app you want to run against is installed on a simulator / emulator you want to run, otherwise RN will run on a default opened device.

