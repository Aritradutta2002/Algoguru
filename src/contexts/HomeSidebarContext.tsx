import { createContext, useContext } from "react";

/**
 * Controls the left sidebar panel on the home page ("/").
 * The home page hides the left panel (and its fold/unfold handle) by
 * default; it only appears when the user clicks the
 * "Choose where to focus next." heading, which calls `toggleHomeSidebar`.
 */
interface HomeSidebarContextValue {
  homeSidebarOpen: boolean;
  toggleHomeSidebar: () => void;
}

export const HomeSidebarContext = createContext<HomeSidebarContextValue>({
  homeSidebarOpen: false,
  toggleHomeSidebar: () => {},
});

export const useHomeSidebar = () => useContext(HomeSidebarContext);
