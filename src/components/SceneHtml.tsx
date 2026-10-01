import { createContext, useContext, type ComponentProps, type RefObject } from "react";
import { Html } from "@react-three/drei";

// Keep Html's independent React roots out of Canvas's React-owned DOM tree.
// A stable explicit target also prevents Html from reusing its root container
// when R3F's event connection changes during a scene mount or unmount.
export const SceneHtmlPortalContext = createContext<RefObject<HTMLElement> | null>(null);

export function SceneHtml(props: ComponentProps<typeof Html>) {
  const portal = useContext(SceneHtmlPortalContext);
  if (!portal) throw new Error("SceneHtml requires a mounted scene overlay");
  return <Html {...props} portal={portal} />;
}
