import { useDeferredValue, useMemo } from "react";
import { format } from "sql-formatter";
import type { SqlLanguage, KeywordCase } from "sql-formatter";
import { ToolPage } from "../../components/layout/tool-page/tool-page";
import { ConverterPanes } from "../../components/common/converter-panes/converter-panes";
import { SegmentedControl } from "../../components/common/segmented-control/segmented-control";
import { Select } from "../../components/common/select/select";
import type { ISelectOption } from "../../components/common/select/select";
import { usePersistentState } from "../../hooks/use-persistent-state";

type Indent = "2" | "4" | "tab";

const DIALECTS: ISelectOption<SqlLanguage>[] = [
  { value: "sql", label: "Standard SQL" },
  { value: "postgresql", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "mariadb", label: "MariaDB" },
  { value: "sqlite", label: "SQLite" },
  { value: "transactsql", label: "SQL Server (T-SQL)" },
  { value: "plsql", label: "Oracle PL/SQL" },
  { value: "bigquery", label: "BigQuery" },
  { value: "snowflake", label: "Snowflake" },
  { value: "redshift", label: "Redshift" },
  { value: "clickhouse", label: "ClickHouse" },
  { value: "duckdb", label: "DuckDB" },
  { value: "trino", label: "Trino and Presto" },
  { value: "spark", label: "Spark SQL" },
  { value: "hive", label: "Hive" },
  { value: "db2", label: "Db2" },
  { value: "db2i", label: "Db2 for IBM i" },
  { value: "n1ql", label: "Couchbase N1QL" },
  { value: "singlestoredb", label: "SingleStore" },
  { value: "tidb", label: "TiDB" },
];

const CASE_OPTIONS: { value: KeywordCase; label: string }[] = [
  { value: "upper", label: "UPPER" },
  { value: "lower", label: "lower" },
  { value: "preserve", label: "Keep" },
];

const INDENT_OPTIONS: { value: Indent; label: string }[] = [
  { value: "2", label: "2 spaces" },
  { value: "4", label: "4 spaces" },
  { value: "tab", label: "Tab" },
];

const PLACEHOLDER =
  "select u.id, u.name, count(o.id) as orders from users u left join orders o on o.user_id = u.id where u.active = true group by u.id, u.name order by orders desc limit 10;";

export const SqlFormatterPage = () => {
  const [input, setInput] = usePersistentState("sql:input", "");
  const [dialect, setDialect] = usePersistentState<SqlLanguage>("sql:dialect", "sql");
  const [keywordCase, setKeywordCase] = usePersistentState<KeywordCase>("sql:case", "upper");
  const [indent, setIndent] = usePersistentState<Indent>("sql:indent", "2");
  const deferredInput = useDeferredValue(input);

  const result = useMemo(() => {
    if (!deferredInput.trim()) return { output: "", error: null };
    try {
      return {
        output: format(deferredInput, {
          language: dialect,
          keywordCase,
          tabWidth: indent === "4" ? 4 : 2,
          useTabs: indent === "tab",
        }),
        error: null,
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message.split("\n")[0] : "";
      return {
        output: "",
        error: `This SQL could not be formatted as ${DIALECTS.find((d) => d.value === dialect)?.label}. ${detail} Check the dialect and any unclosed quotes or brackets.`,
      };
    }
  }, [deferredInput, dialect, keywordCase, indent]);

  return (
    <ToolPage
      title="SQL Formatter"
      description="Make long queries readable. Pick your database so its keywords and quoting rules are understood."
      fill
    >
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        <Select label="Dialect" options={DIALECTS} value={dialect} onChange={setDialect} />
        <SegmentedControl label="Keywords" options={CASE_OPTIONS} value={keywordCase} onChange={setKeywordCase} />
        <SegmentedControl label="Indent" options={INDENT_OPTIONS} value={indent} onChange={setIndent} />
      </div>
      <ConverterPanes
        inputLabel="SQL"
        outputLabel="Formatted SQL"
        input={input}
        onInputChange={setInput}
        inputPlaceholder={PLACEHOLDER}
        output={result.output}
        outputPlaceholder="Formatted SQL shows up here"
        error={result.error}
      />
    </ToolPage>
  );
};
