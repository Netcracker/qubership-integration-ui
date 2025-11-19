import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import Icon from '@ant-design/icons';
import type { AntdIconProps } from "@ant-design/icons/lib/components/AntdIcon";
import parse from "html-react-parser";
import {
  DeleteOutlined,
  PlusOutlined,
  InboxOutlined,
  MoreOutlined,
  SaveOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  RollbackOutlined,
  SendOutlined,
  LeftOutlined,
  RightOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  TableOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  LockOutlined,
  DownOutlined,
  UpOutlined,
  DesktopOutlined,
  LinkOutlined,
  DownloadOutlined,
  ExportOutlined,
  StopOutlined,
  CopyOutlined,
  CloudOutlined,
  AppstoreOutlined,
  SettingOutlined,
  BellOutlined,
  RedoOutlined,
  CaretRightFilled,
  CaretDownFilled,
  UnorderedListOutlined,
  AuditOutlined,
  SnippetsOutlined,
  CodeOutlined,
  EditOutlined,
  CheckOutlined,
  QuestionCircleOutlined,
  CloseOutlined,
  CloseCircleOutlined,
  MinusOutlined,
  ExpandOutlined,
  RotateRightOutlined,
  ClearOutlined,
  EllipsisOutlined,
  PlusCircleOutlined,
  FileMarkdownOutlined,
  ClusterOutlined,
  GlobalOutlined,
  HomeOutlined,
  FilterOutlined,
  CarryOutOutlined,
  FileAddOutlined,
  FileOutlined,
  FolderAddOutlined,
  FolderOutlined,
  ApartmentOutlined,
  ApiOutlined,
  GroupOutlined,
  DeploymentUnitOutlined,
  EyeInvisibleOutlined,
  FileDoneOutlined,
  FileUnknownOutlined,
  QuestionOutlined,
  RadarChartOutlined,
  SolutionOutlined,
  ColumnHeightOutlined,
  VerticalAlignMiddleOutlined,
} from "@ant-design/icons";
import {
  APP_EXTENSION_UPDATE,
  appExtensionEvents,
} from "./appExtensionEvents.ts";
import { AppExtensionProps } from "./appConfig.ts";
import { VSCodeResponse } from "../dist-lib/types";

export type IconSource =
  | React.ComponentType<AntdIconProps>
  | string
  | React.ReactElement;

export type IconSet = {
  [iconName: string]: IconSource;
};

const defaultIcons: IconSet = {
  plus: PlusOutlined,
  delete: DeleteOutlined,
  inbox: InboxOutlined,
  more: MoreOutlined,
  save: SaveOutlined,
  user: UserOutlined,
  exclamationCircle: ExclamationCircleOutlined,
  fileText: FileTextOutlined,
  rollback: RollbackOutlined,
  send: SendOutlined,
  left: LeftOutlined,
  right: RightOutlined,
  doubleLeft: DoubleLeftOutlined,
  doubleRight: DoubleRightOutlined,
  table: TableOutlined,
  cloudUpload: CloudUploadOutlined,
  cloudDownload: CloudDownloadOutlined,
  lock: LockOutlined,
  down: DownOutlined,
  up: UpOutlined,
  desktop: DesktopOutlined,
  link: LinkOutlined,
  download: DownloadOutlined,
  export: ExportOutlined,
  stop: StopOutlined,
  copy: CopyOutlined,
  cloud: CloudOutlined,
  appstore: AppstoreOutlined,
  settings: SettingOutlined,
  bell: BellOutlined,
  redo: RedoOutlined,
  caretRightFilled: CaretRightFilled,
  caretDownFilled: CaretDownFilled,
  unorderedList: UnorderedListOutlined,
  audit: AuditOutlined,
  snippets: SnippetsOutlined,
  code: CodeOutlined,
  edit: EditOutlined,
  check: CheckOutlined,
  questionCircle: QuestionCircleOutlined,
  close: CloseOutlined,
  closeCircle: CloseCircleOutlined,
  minus: MinusOutlined,
  expand: ExpandOutlined,
  rotateRight: RotateRightOutlined,
  clear: ClearOutlined,
  ellipsis: EllipsisOutlined,
  plusCircle: PlusCircleOutlined,
  fileMarkdown: FileMarkdownOutlined,
  cluster: ClusterOutlined,
  global: GlobalOutlined,
  home: HomeOutlined,
  filter: FilterOutlined,
  carryOut: CarryOutOutlined,
  fileAdd: FileAddOutlined,
  file: FileOutlined,
  folderAdd: FolderAddOutlined,
  folder: FolderOutlined,
  apartment: ApartmentOutlined,
  api: ApiOutlined,
  group: GroupOutlined,
  deploymentUnit: DeploymentUnitOutlined,
  eyeInvisible: EyeInvisibleOutlined,
  fileDone: FileDoneOutlined,
  fileUnknown: FileUnknownOutlined,
  question: QuestionOutlined,
  radarChart: RadarChartOutlined,
  solution: SolutionOutlined,
  columnHeight: ColumnHeightOutlined,
  verticalAlignMiddle: VerticalAlignMiddleOutlined,
};

const IconContext = createContext<IconOverrides>(defaultIcons);

export const IconProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [icons, setIcons] = useState<IconOverrides>(defaultIcons);

  useEffect(() => {
    const handler = (event: CustomEvent<VSCodeResponse<AppExtensionProps>>) => {
      setIcons((prev) => ({ ...prev, ...event.detail.payload?.icons }));
      console.log("IconProvider updated icons via EventTarget:", event.detail);
    };

    appExtensionEvents.addEventListener(
      APP_EXTENSION_UPDATE,
      handler as EventListener,
    );

    return () => {
      appExtensionEvents.removeEventListener(
        APP_EXTENSION_UPDATE,
        handler as EventListener,
      );
    };
  }, []);

  return <IconContext.Provider value={icons}>{children}</IconContext.Provider>;
};

export const useIcons = () => {
  const context = useContext(IconContext);
  if (!context) {
    throw new Error("useIcons must be used within IconProvider");
  }
  return context;
};

interface IconProps extends Omit<AntdIconProps, "name"> {
  name: IconName;
}

export type IconName = keyof typeof defaultIcons;

export type IconOverrides = {
  [K in IconName]?: IconSource;
};

export const OverridableIcon: React.FC<IconProps> = ({ name, ...props }) => {
  const icons = useIcons();
  const IconComponent = icons[name];

  console.log("Get icon", icons, name);
  console.log("Received component", IconComponent);
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in IconProvider`);
    return null;
  }

  if (React.isValidElement(IconComponent)) {
    console.log("valid react component", IconComponent);
    return React.cloneElement(IconComponent, props);
  }

  if (typeof IconComponent === "string") {
    console.log("string", IconComponent);
    // return <span {...props} dangerouslySetInnerHTML={{ __html: IconComponent }} />;
    // return <span className="anticon">{parse(IconComponent)}</span>;
    // const newIcon = () => (IconComponent);
    const parsed = parse(IconComponent);
    const Wrapped = () => <>{parsed}</>;
    return <Icon component={Wrapped} {...props} />;
  }

  // @ts-expect-error all cases covered
  return <IconComponent {...props} />;
};
