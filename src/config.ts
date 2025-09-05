type Config = {
  command: string;
};

const config: Config = {
  command: import.meta.env.VITE_API_APP, // default from build
};

export const setCommand = (value: string) => {
  config.command = value;
};

export const getCommand = () => config.command;
