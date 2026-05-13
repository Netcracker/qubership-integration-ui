import { Chain } from "../../../api/apiTypes.ts";
import { Change } from "./compare/types.ts";
import React, { useCallback, useEffect, useState } from "react";
import yaml, { DumpOptions } from "js-yaml";
import { DiffEditor } from "@monaco-editor/react";
import { useMonacoTheme } from "../../../hooks/useMonacoTheme.ts";
import { buildElementMap } from "./compare/compare.ts";

export type ChainDiffTextViewProps = {
  chain1?: Chain;
  chain2?: Chain;
  changes: Change[];
  selectedChangeId?: string;
  onSelectChange: (id: string) => void;
};

const IGNORED_PROPERTIES = new Set<string>([
  "id",
  "parentId",
  "swimlaneId",
  "deployments",
  "createdBy",
  "createdWhen",
  "modifiedWhen",
  "modifiedBy",
  "chainId",
  "mandatoryChecksPassed",
  "navigationPath",
  "containsDeprecatedContainers",
  "containsDeprecatedElements",
  "containsUnsupportedElements",
  "unsavedChanges",
]);

export const ChainDiffTextView: React.FC<ChainDiffTextViewProps> = ({
  chain1,
  chain2,
  changes,
  selectedChangeId,
  onSelectChange,
}): React.ReactNode => {
  const [elementMap, setElementMap] = useState<Map<string, string>>(
    new Map<string, string>(),
  );
  const [yaml1, setYaml1] = useState<string>("");
  const [yaml2, setYaml2] = useState<string>("");
  const monacoTheme = useMonacoTheme();

  const dumpYaml = useCallback((chain: Chain, m: Map<string, string>) => {
    const options: DumpOptions = {
      indent: 2,
      noArrayIndent: true,
      skipInvalid: true,
      sortKeys: true,
      replacer: (key, value) => {
        if (IGNORED_PROPERTIES.has(key)) {
          return undefined;
        }
        if (key === "from" || key === "to") {
          const element = chain.elements.find((e) => e.id === value);
          return element ? `${element.name} (${element.type})` : value;
        }

        if (key === "elements" && Array.isArray(value)) {
          return value.sort((v1, v2) => {
            const id1 = m.get(v1?.id) ?? v1?.id;
            const id2 = m.get(v2?.id) ?? v2?.id;
            return id1.toString().localeCompare(id2.toString());
          });
        }

        return value;
      },
    };
    return yaml.dump(chain, options);
  }, []);

  useEffect(() => {
    setYaml1(chain1 ? dumpYaml(chain1, new Map<string, string>()) : "");
  }, [chain1, dumpYaml]);

  useEffect(() => {
    setYaml2(chain2 ? dumpYaml(chain2, elementMap) : "");
  }, [chain2, dumpYaml, elementMap]);

  useEffect(() => {
    setElementMap(
      chain1 && chain2
        ? buildElementMap(chain1, chain2)
        : new Map<string, string>(),
    );
  }, [chain1, chain2]);

  return (
    <DiffEditor
      className="qip-editor"
      originalLanguage={"yaml"}
      modifiedLanguage={"yaml"}
      original={yaml1}
      modified={yaml2}
      theme={monacoTheme}
      options={{
        readOnly: true,
        originalAriaLabel: "Body Before",
        modifiedAriaLabel: "Body After",
        automaticLayout: true,
      }}
    />
  );
};
