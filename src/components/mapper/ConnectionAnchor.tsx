import React, { useEffect, useState } from "react";
import styles from "./ConnectionAnchor.module.css";

export type ConnectionAnchorProps = React.HTMLAttributes<HTMLElement> & {
  invalid?: boolean;
  connected: boolean;
  onClick?: (connected: boolean) => void;
};

export const ConnectionAnchor: React.FC<ConnectionAnchorProps> = ({
  invalid,
  connected,
  onClick,
  ...props
}): React.ReactNode => {
  const [className, setClassName] = useState<string>(
    `${styles["connection-anchor"]} ${styles["disconnected"]}`,
  );

  useEffect(() => {
    const classNames = [
      styles["connection-anchor"],
      styles[connected ? "connected" : "disconnected"],
    ];
    if (invalid) {
      classNames.push(styles["invalid"]);
    }
    setClassName(classNames.join(" "));
  }, [invalid, connected]);

  return (
    <div className={className} {...props} onClick={() => onClick?.(connected)}>
      <div className={styles["inner-circle"]}></div>
    </div>
  );
};
