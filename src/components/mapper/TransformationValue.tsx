import { Transformation } from "../../mapper/model/model.ts";
import { Flex, Tooltip } from "antd";
import React, { useEffect, useState } from "react";
import {
  TransformationInfo,
  TRANSFORMATIONS,
} from "../../mapper/model/transformations.ts";
import styles from "./TransformationValue.module.css";
import { VerificationError } from "../../mapper/verification/model.ts";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { PLACEHOLDER } from "../../misc/format-utils.ts";
import { TransformationInfoTooltip } from "./TransformationInfoTooltip.tsx";

export type TransformationValueProps = {
  transformation?: Transformation;
  errors: VerificationError[];
};

export const TransformationValue: React.FC<TransformationValueProps> = ({
  transformation,
  errors,
}) => {
  const [transformationInfo, setTransformationInfo] = useState<
    TransformationInfo | undefined
  >(undefined);

  useEffect(() => {
    setTransformationInfo(
      TRANSFORMATIONS.find((g) => g.name === transformation?.name),
    );
  }, [transformation]);

  return (
    <div className={styles["transformation-content"]}>
      {transformation ? (
        <TransformationInfoTooltip
          transformation={transformation}
        >
          <div className={styles["transformation-details"]}>
            <span className={styles["transformation-title"]}>
              {transformationInfo?.title ?? transformation.name}
            </span>
            <div className={styles["transformation-parameters"]}>
              {transformation.parameters.map((parameter, index) => (
                <span
                  className={styles["transformation-parameter-value"]}
                  key={index}
                >
                  {parameter}
                </span>
              ))}
            </div>
          </div>
        </TransformationInfoTooltip>
      ) : (
        PLACEHOLDER
      )}
      {errors.length > 0 ? (
        <Tooltip
          title={
            <Flex vertical className={styles["transformation-errors"]} gap={8}>
              {errors.map((error, index) => (
                <div className={styles["transformation-error"]} key={index}>
                  {error.message}
                </div>
              ))}
            </Flex>
          }
        >
          <ExclamationCircleOutlined style={{ color: "red" }} />
        </Tooltip>
      ) : (
        <></>
      )}
    </div>
  );
};
