import { createStore } from "zustand/vanilla";
import { Story } from "@/types";
import { getVRStories } from "@/storybook/stories";
import { storyFilter } from "@/args";

interface State {
  stories: Story[];
}

export const vrStore = createStore<State>(() => ({
  stories: [],
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
