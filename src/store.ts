import { createStore } from "zustand/vanilla";
import { Story } from "@/types";
import { getVRStories } from "@/storybook/stories";
import { storyFilter } from "@/args";

interface StoryBeingProcessedExtras {
  testID: string;
}

interface State {
  stories: Story[];
  storiesBeingProcessed: Record<string, StoryBeingProcessedExtras>;
}

export const vrStore = createStore<State>(() => ({
  stories: [],
  storiesBeingProcessed: {},
}));

export const initStore = () => {
  const kindWithNames = getVRStories();
  const stories: Story[] = [];

  Object.keys(kindWithNames).forEach((kind) => {
    if (storyFilter && !storyFilter.startsWith(kind)) {
      return;
    }
    kindWithNames[kind].forEach((name) => {
      if (storyFilter && !storyFilter.endsWith(name)) {
        return;
      }
      const fullName = `${kind}-${name}`;
      stories.push({
        kind,
        name,
        fullName,
      });
    });
  });

  vrStore.setState({ stories });
};
